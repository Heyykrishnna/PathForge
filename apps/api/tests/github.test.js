import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';

vi.mock('../src/config/env.js', async (importOriginal) => {
  const { env } = await importOriginal();
  return {
    env: {
      ...env,
      GITHUB_CLIENT_ID: 'test-client-id',
      GITHUB_CLIENT_SECRET: 'test-client-secret'
    }
  };
});

describe('GitHub Integration Tests', () => {
  let userToken = '';
  let oauthState = '';
  const providerFetch = vi.fn(async (url) => {
    if (url === 'https://github.com/login/oauth/access_token') {
      return Response.json({ access_token: 'provider-token-for-test' });
    }
    if (url === 'https://api.github.com/user') {
      return Response.json({
        id: 42,
        login: 'octocat',
        avatar_url: 'https://avatars.githubusercontent.com/u/42'
      });
    }
    if (url.startsWith('https://api.github.com/user/repos?')) {
      return Response.json([
        {
          id: 7,
          name: 'student-project',
          full_name: 'octocat/student-project',
          private: false,
          language: 'JavaScript'
        }
      ]);
    }
    throw new Error('Unexpected provider request');
  });

  beforeAll(async () => {
    vi.stubGlobal('fetch', providerFetch);
    const user = {
      email: `github_user_${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Git',
      lastName: 'Hubber'
    };

    await request(app).post('/api/v1/auth/register').send(user);
    const login = await request(app).post('/api/v1/auth/login').send({
      email: user.email,
      password: user.password
    });
    userToken = login.body.data.accessToken;
  });

  afterAll(() => vi.unstubAllGlobals());

  it('generates secure OAuth connect URL with CSRF state parameter', async () => {
    const res = await request(app)
      .get('/api/v1/github/connect')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.url).toMatch(/github\.com\/login\/oauth\/authorize/);
    expect(res.body.data.state).toBeDefined();
    expect(new URL(res.body.data.url).searchParams.get('scope')).toBe(
      'read:user'
    );

    oauthState = res.body.data.state;
  });

  it('rejects callback with invalid or missing CSRF state', async () => {
    const res = await request(app)
      .post('/api/v1/github/callback')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: 'provider-code', state: 'invalid_state_token' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/invalid.*state/i);
    expect(providerFetch).not.toHaveBeenCalled();
  });

  it('returns the browser to the profile and requires a session to finish', async () => {
    const callback = await request(app)
      .get('/api/v1/github/callback')
      .query({ code: 'provider-code', state: oauthState });
    const destination = new URL(callback.headers.location);
    expect(callback.status).toBe(303);
    expect(callback.headers['cache-control']).toBe('no-store');
    expect(destination.origin).toBe(new URL(env.CORS_ORIGIN).origin);
    expect(destination.pathname).toBe('/profile');
    expect(destination.search).toBe('');
    expect(new URLSearchParams(destination.hash.slice(1)).get('code')).toBe(
      'provider-code'
    );

    const unauthenticated = await request(app)
      .post('/api/v1/github/callback')
      .send({ code: 'provider-code', state: oauthState });
    expect(unauthenticated.status).toBe(401);
    expect(providerFetch).not.toHaveBeenCalled();
  });

  it('connects account and encrypts token on valid callback', async () => {
    const res = await request(app)
      .post('/api/v1/github/callback')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: 'provider-code', state: oauthState });

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe('octocat');
    expect(JSON.stringify(res.body)).not.toMatch(
      /provider-token-for-test|encrypted/i
    );
    expect(providerFetch).toHaveBeenCalledTimes(2);
    expect(JSON.parse(providerFetch.mock.calls[0][1].body)).toMatchObject({
      code: 'provider-code',
      redirect_uri: env.GITHUB_CALLBACK_URL
    });

    const replay = await request(app)
      .post('/api/v1/github/callback')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: 'provider-code', state: oauthState });
    expect(replay.status).toBe(400);
    expect(providerFetch).toHaveBeenCalledTimes(2);
  });

  it('syncs repositories and extracts candidate evidence', async () => {
    const res = await request(app)
      .post('/api/v1/github/sync')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.syncedRepositoriesCount).toBeGreaterThan(0);

    const accountRes = await request(app)
      .get('/api/v1/github/account')
      .set('Authorization', `Bearer ${userToken}`);

    expect(accountRes.status).toBe(200);
    expect(accountRes.body.data.account.syncStatus).toBe('completed');
    expect(accountRes.body.data.repositories.length).toBeGreaterThan(0);
    expect(accountRes.body.data.repositories[0].name).toBe('student-project');

    const evidenceRes = await request(app)
      .get('/api/v1/evidence')
      .set('Authorization', `Bearer ${userToken}`);

    expect(evidenceRes.status).toBe(200);
    const githubSkills = evidenceRes.body.data.evidence.filter(
      (e) => e.sourceType === 'github'
    );
    expect(githubSkills.length).toBeGreaterThan(0);
  });

  it('disconnects GitHub account and deletes stored tokens', async () => {
    const res = await request(app)
      .delete('/api/v1/github/connection')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);

    const accountRes = await request(app)
      .get('/api/v1/github/account')
      .set('Authorization', `Bearer ${userToken}`);

    expect(accountRes.status).toBe(200);
    expect(accountRes.body.data).toBeNull();
  });
});
