import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('GitHub Integration Tests', () => {
  let userToken = '';
  let oauthState = '';

  beforeAll(async () => {
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

  it('generates secure OAuth connect URL with CSRF state parameter', async () => {
    const res = await request(app)
      .get('/api/v1/github/connect')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.url).toMatch(/github\.com\/login\/oauth\/authorize/);
    expect(res.body.data.state).toBeDefined();

    oauthState = res.body.data.state;
  });

  it('rejects callback with invalid or missing CSRF state', async () => {
    const res = await request(app)
      .get('/api/v1/github/callback?code=mock_code_123&state=invalid_state_token')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/invalid.*state/i);
  });

  it('connects account and encrypts token on valid callback', async () => {
    const res = await request(app)
      .get(`/api/v1/github/callback?code=mock_code_123&state=${oauthState}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBeDefined();
    expect(JSON.stringify(res.body)).not.toMatch(/mock_github_token|encrypted/i);
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

    const evidenceRes = await request(app)
      .get('/api/v1/evidence')
      .set('Authorization', `Bearer ${userToken}`);

    expect(evidenceRes.status).toBe(200);
    const githubSkills = evidenceRes.body.data.evidence.filter(e => e.sourceType === 'github');
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

