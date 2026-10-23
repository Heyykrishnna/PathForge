import { eq, and, gt, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { githubAccounts, repositories, githubOauthStates, candidateEvidence } from '../../db/schema/index.js';
import { ApiError } from '../../utils/api-error.js';
import { generateRandomToken } from '../../utils/token.js';
import { encrypt, decrypt } from '../../utils/encryption.js';
import { env } from '../../config/env.js';

export class GitHubService {
  async generateConnectUrl(userId) {
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
      scope: 'read:user,repo',
      state
    });

    return {
      state,
      url: `https://github.com/login/oauth/authorize?${params.toString()}`
    };
  }

  async handleCallback(userId, { code, state }) {
    if (!state) {
      throw ApiError.badRequest('OAuth state parameter is required');
    }

    const [stateRecord] = await db
      .select()
      .from(githubOauthStates)
      .where(
        and(
          eq(githubOauthStates.userId, userId),
          eq(githubOauthStates.state, state),
          gt(githubOauthStates.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!stateRecord) {
      throw ApiError.badRequest('Invalid, expired or unauthorized OAuth state');
    }

    await db.delete(githubOauthStates).where(eq(githubOauthStates.id, stateRecord.id));

    let accessToken = `mock_github_token_${code}`;
    let githubProfile = {
      id: 1234567,
      login: 'dev-student',
      html_url: 'https://github.com/dev-student',
      avatar_url: 'https://avatars.githubusercontent.com/u/1234567'
    };

    if (env.NODE_ENV === 'production' && !code.startsWith('mock_code_')) {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code
        })
      });

      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        throw ApiError.badRequest(tokenData.error_description || 'Failed to exchange GitHub authorization code');
      }
      accessToken = tokenData.access_token;

      const profileRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'PathForge-App'
        }
      });
      githubProfile = await profileRes.json();
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
          profileUrl: githubProfile.html_url,
          avatarUrl: githubProfile.avatar_url,
          encryptedAccessToken: encryptedToken,
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
          profileUrl: githubProfile.html_url,
          avatarUrl: githubProfile.avatar_url,
          encryptedAccessToken: encryptedToken,
          scope: 'read:user,repo',
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

  async syncRepositories(userId, customMockRepos = null) {
    const [account] = await db
      .select()
      .from(githubAccounts)
      .where(eq(githubAccounts.userId, userId))
      .limit(1);

    if (!account) {
      throw ApiError.notFound('No connected GitHub account found for this user');
    }

    await db
      .update(githubAccounts)
      .set({ syncStatus: 'syncing', updatedAt: new Date() })
      .where(eq(githubAccounts.id, account.id));

    let fetchedRepos = customMockRepos;

    if (!fetchedRepos) {
      if (env.NODE_ENV === 'production' && !account.encryptedAccessToken.includes('mock_github_token')) {
        const rawToken = decrypt(account.encryptedAccessToken);
        const res = await fetch('https://api.github.com/user/repos?sort=pushed&per_page=30', {
          headers: {
            Authorization: `Bearer ${rawToken}`,
            'User-Agent': 'PathForge-App'
          }
        });

        if (!res.ok) {
          await db
            .update(githubAccounts)
            .set({ syncStatus: 'failed', updatedAt: new Date() })
            .where(eq(githubAccounts.id, account.id));
          throw ApiError.serviceUnavailable('Failed to retrieve repositories from GitHub API');
        }

        fetchedRepos = await res.json();
      } else {
        fetchedRepos = [
          {
            id: 101,
            name: 'distributed-kv-store',
            full_name: `${account.username}/distributed-kv-store`,
            description: 'A Raft-based distributed key-value store built in Go',
            private: false,
            language: 'Go',
            languages_url: '',
            stargazers_count: 14,
            forks_count: 3,
            default_branch: 'main',
            pushed_at: new Date().toISOString()
          },
          {
            id: 102,
            name: 'react-query-dashboard',
            full_name: `${account.username}/react-query-dashboard`,
            description: 'Modern real-time analytics dashboard in TypeScript and React',
            private: false,
            language: 'TypeScript',
            languages_url: '',
            stargazers_count: 28,
            forks_count: 5,
            default_branch: 'main',
            pushed_at: new Date().toISOString()
          }
        ];
      }
    }

    await db.delete(repositories).where(eq(repositories.githubAccountId, account.id));

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

