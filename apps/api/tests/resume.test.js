import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Resume Pipeline Integration Tests', () => {
  let userAToken = '';
  let userBToken = '';
  let resumeId = '';

  const samplePdfContent = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\nTECHNICAL SKILLS\nTypeScript, Node.js, React, PostgreSQL, Docker\nEDUCATION\nBachelor of Science in Computer Science, 2024\nPROJECTS\nBuilt distributed key-value store in Go and Kubernetes\n';

  beforeAll(async () => {
    const userA = {
      email: `resume_user_a_${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Alice',
      lastName: 'Resume'
    };

    const userB = {
      email: `resume_user_b_${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Bob',
      lastName: 'Other'
    };

    await request(app).post('/api/v1/auth/register').send(userA);
    const loginA = await request(app).post('/api/v1/auth/login').send({
      email: userA.email,
      password: userA.password
    });
    userAToken = loginA.body.data.accessToken;

    await request(app).post('/api/v1/auth/register').send(userB);
    const loginB = await request(app).post('/api/v1/auth/login').send({
      email: userB.email,
      password: userB.password
    });
    userBToken = loginB.body.data.accessToken;
  });

  it('rejects unauthenticated resume upload', async () => {
    const res = await request(app)
      .post('/api/v1/resumes/upload')
      .attach('resume', Buffer.from('dummy'), 'test.pdf');

    expect(res.status).toBe(401);
  });

  it('rejects non-PDF files', async () => {
    const res = await request(app)
      .post('/api/v1/resumes/upload')
      .set('Authorization', `Bearer ${userAToken}`)
      .attach('resume', Buffer.from('hello world'), 'resume.txt');

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/only pdf files/i);
  });

  it('uploads valid PDF resume and returns uploaded status', async () => {
    const res = await request(app)
      .post('/api/v1/resumes/upload')
      .set('Authorization', `Bearer ${userAToken}`)
      .attach('resume', Buffer.from(samplePdfContent), 'sample-resume.pdf');

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.status).toBe('uploaded');
    expect(res.body.data.fileName).toBe('sample-resume.pdf');

    resumeId = res.body.data.id;
  });

  it('enforces privacy and ownership on single resume lookup', async () => {
    const unauthorizedRes = await request(app)
      .get(`/api/v1/resumes/${resumeId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(unauthorizedRes.status).toBe(404);

    const authorizedRes = await request(app)
      .get(`/api/v1/resumes/${resumeId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(authorizedRes.status).toBe(200);
    expect(authorizedRes.body.data.id).toBe(resumeId);
  });

  it('analyzes resume and extracts skills into candidate evidence', async () => {
    const res = await request(app)
      .post(`/api/v1/resumes/${resumeId}/analyze`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.extractedData).toBeDefined();
    expect(Array.isArray(res.body.data.extractedData.skills)).toBe(true);

    const evidenceRes = await request(app)
      .get('/api/v1/evidence')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(evidenceRes.status).toBe(200);
    expect(evidenceRes.body.data.evidence.length).toBeGreaterThan(0);
    const resumeSkills = evidenceRes.body.data.evidence.filter(e => e.sourceType === 'resume');
    expect(resumeSkills.length).toBeGreaterThan(0);
  });

  it('allows user to review and confirm extracted skills', async () => {
    const res = await request(app)
      .post(`/api/v1/resumes/${resumeId}/confirm`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        confirmedSkills: ['TypeScript', 'Docker', 'PostgreSQL']
      });

    expect(res.status).toBe(200);
    expect(res.body.data.confirmedSkills).toEqual(['TypeScript', 'Docker', 'PostgreSQL']);

    const profileRes = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${userAToken}`);

    const userSkillNames = profileRes.body.data.skills.map(s => s.name);
    expect(userSkillNames).toContain('TypeScript');
  });

  it('streams private resume file download to authorized owner', async () => {
    const res = await request(app)
      .get(`/api/v1/resumes/${resumeId}/download`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
  });
});

