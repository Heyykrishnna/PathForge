import { eq, and, gt, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  githubAccounts,
  repositories,
  githubOauthStates,
  candidateEvidence
} from '../../db/schema/index.js';
import { ApiError } from '../../utils/api-error.js';
import { generateRandomToken } from '../../utils/token.js';
import { encrypt, decrypt } from '../../utils/encryption.js';
import { env } from '../../config/env.js';

const scope = 'read:user';

async function fetchGithub(url, options) {
  const unavailable =
    'GitHub could not complete the request. Please try again.';
  let response;
  try {
    response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(10000)
    });
  } catch {
    throw ApiError.serviceUnavailable(unavailable);
  }
  if (!response.ok) throw ApiError.serviceUnavailable(unavailable);
  return response.json().catch(() => {
    throw ApiError.serviceUnavailable(unavailable);
  });
}

export class GitHubService {
  async generateConnectUrl(userId) {
    if (
      !env.GITHUB_CLIENT_ID ||
      !env.GITHUB_CLIENT_SECRET ||
      env.GITHUB_CLIENT_ID === 'dev_github_client_id' ||
      env.GITHUB_CLIENT_SECRET === 'dev_github_client_secret'
    ) {
      throw ApiError.serviceUnavailable('GitHub OAuth is not configured.');
    }

    const state = generateRandomToken();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.insert(githubOauthStates).values({
      userId,
      state,
      expiresAt
    });

    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: env.GITHUB_CALLBACK_URL,
      scope,
      state
    });

    return {
      state,
      url: `https://github.com/login/oauth/authorize?${params.toString()}`
    };
  }

  async handleCallback(userId, { code, state }) {
    if (typeof state !== 'string' || !state) {
      throw ApiError.badRequest('OAuth state parameter is required');
    }

    if (typeof code !== 'string' || !code) {
      throw ApiError.badRequest('GitHub authorization code is required');
    }

    const [stateRecord] = await db
      .delete(githubOauthStates)
      .where(
        and(
          eq(githubOauthStates.userId, userId),
          eq(githubOauthStates.state, state),
          gt(githubOauthStates.expiresAt, new Date())
        )
      )
      .returning({ id: githubOauthStates.id });

    if (!stateRecord) {
      throw ApiError.badRequest('Invalid, expired or unauthorized OAuth state');
    }

    const token = await fetchGithub(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          redirect_uri: env.GITHUB_CALLBACK_URL,
          code
        })
      }
    );

    const accessToken = token?.access_token;
    if (typeof accessToken !== 'string' || !accessToken) {
      throw ApiError.badRequest(
        'GitHub rejected the authorization code. Start the connection again.'
      );
    }

    const githubProfile = await fetchGithub('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'PathForge-App'
      }
    });
    if (
      !Number.isSafeInteger(githubProfile?.id) ||
      typeof githubProfile.login !== 'string' ||
      !/^[a-z\d][a-z\d-]{0,38}$/i.test(githubProfile.login)
    ) {
      throw ApiError.serviceUnavailable(
        'GitHub returned an invalid account profile.'
      );
    }

    const encryptedToken = encrypt(accessToken);

    const [existingAccount] = await db
      .select()
      .from(githubAccounts)
      .where(eq(githubAccounts.userId, userId))
      .limit(1);

    let savedAccount;
    if (existingAccount) {
      [savedAccount] = await db
        .update(githubAccounts)
        .set({
          githubUserId: String(githubProfile.id),
          username: githubProfile.login,
          profileUrl: `https://github.com/${githubProfile.login}`,
          avatarUrl: githubProfile.avatar_url,
          encryptedAccessToken: encryptedToken,
          scope,
          syncStatus: 'idle',
          updatedAt: new Date()
        })
        .where(eq(githubAccounts.id, existingAccount.id))
        .returning();
    } else {
      [savedAccount] = await db
        .insert(githubAccounts)
        .values({
          userId,
          githubUserId: String(githubProfile.id),
          username: githubProfile.login,
          profileUrl: `https://github.com/${githubProfile.login}`,
          avatarUrl: githubProfile.avatar_url,
          encryptedAccessToken: encryptedToken,
          scope,
          syncStatus: 'idle'
        })
        .returning();
    }

    return {
      id: savedAccount.id,
      username: savedAccount.username,
      profileUrl: savedAccount.profileUrl,
      avatarUrl: savedAccount.avatarUrl,
      syncStatus: savedAccount.syncStatus,
      lastSyncedAt: savedAccount.lastSyncedAt
    };
  }

  async syncRepositories(userId) {
    const [account] = await db
      .select()
      .from(githubAccounts)
      .where(eq(githubAccounts.userId, userId))
      .limit(1);

    if (!account) {
      throw ApiError.notFound(
        'No connected GitHub account found for this user'
      );
    }

    await db
      .update(githubAccounts)
      .set({ syncStatus: 'syncing', updatedAt: new Date() })
      .where(eq(githubAccounts.id, account.id));

    let fetchedRepos;
    try {
      const accessToken = decrypt(account.encryptedAccessToken);
      fetchedRepos = await fetchGithub(
        'https://api.github.com/user/repos?visibility=public&affiliation=owner&sort=pushed&per_page=30',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'PathForge-App'
          }
        }
      );
      if (!Array.isArray(fetchedRepos)) {
        throw ApiError.serviceUnavailable(
          'GitHub returned an invalid repository list.'
        );
      }
    } catch (error) {
      await db
        .update(githubAccounts)
        .set({ syncStatus: 'failed', updatedAt: new Date() })
        .where(eq(githubAccounts.id, account.id));
      throw error;
    }

    await db
      .delete(repositories)
      .where(eq(repositories.githubAccountId, account.id));

    const savedRepos = [];
    const discoveredSkills = new Set();

    for (const repo of fetchedRepos) {
      const languages = repo.language ? [repo.language] : [];
      if (repo.language) discoveredSkills.add(repo.language);

      const [saved] = await db
        .insert(repositories)
        .values({
          userId,
          githubAccountId: account.id,
          githubRepoId: String(repo.id),
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          isPrivate: Boolean(repo.private),
          primaryLanguage: repo.language,
          languages,
          stargazersCount: repo.stargazers_count || 0,
          forksCount: repo.forks_count || 0,
          defaultBranch: repo.default_branch || 'main',
          pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null
        })
        .returning();

      savedRepos.push(saved);
    }

    for (const skillName of discoveredSkills) {
      const [existing] = await db
        .select()
        .from(candidateEvidence)
        .where(
          and(
            eq(candidateEvidence.userId, userId),
            eq(candidateEvidence.skillName, skillName),
            eq(candidateEvidence.sourceType, 'github')
          )
        )
        .limit(1);

      if (!existing) {
        await db.insert(candidateEvidence).values({
          userId,
          skillName,
          sourceType: 'github',
          sourceId: account.id,
          confidenceScore: 0.85,
          evidenceContext: `Demonstrated across connected GitHub repositories (${savedRepos.length} synced repos)`,
          isConfirmedByUser: false
        });
      }
    }

    await db
      .update(githubAccounts)
      .set({
        syncStatus: 'completed',
        lastSyncedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(githubAccounts.id, account.id));

    return {
      syncedRepositoriesCount: savedRepos.length,
      repositories: savedRepos
    };
  }

  async getAccount(userId) {
    const [account] = await db
      .select({
        id: githubAccounts.id,
        username: githubAccounts.username,
        profileUrl: githubAccounts.profileUrl,
        avatarUrl: githubAccounts.avatarUrl,
        syncStatus: githubAccounts.syncStatus,
        lastSyncedAt: githubAccounts.lastSyncedAt,
        createdAt: githubAccounts.createdAt
      })
      .from(githubAccounts)
      .where(eq(githubAccounts.userId, userId))
      .limit(1);

    if (!account) {
      return null;
    }

    const repos = await db
      .select()
      .from(repositories)
      .where(eq(repositories.userId, userId))
      .orderBy(desc(repositories.stargazersCount));

    return {
      account,
      repositories: repos
    };
  }

  async disconnect(userId) {
    const [account] = await db
      .select()
      .from(githubAccounts)
      .where(eq(githubAccounts.userId, userId))
      .limit(1);

    if (!account) {
      return { success: true };
    }

    await db.delete(githubAccounts).where(eq(githubAccounts.id, account.id));

    return { success: true };
  }
}

export const githubService = new GitHubService();
