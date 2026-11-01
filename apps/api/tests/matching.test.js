import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { seedDatabase } from '../src/db/seed.js';

describe('Matching Engine and Diagnostics Integration Tests', () => {
  let userToken = '';
  let vercelInternshipId = '';
  let scaleAiInternshipId = '';
  let firstResultId = '';

  beforeAll(async () => {
    await seedDatabase();

    const testUser = {
      email: `matching_candidate_${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Jordan',
      lastName: 'Matcher'
    };

    await request(app).post('/api/v1/auth/register').send(testUser);
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: testUser.email,
      password: testUser.password
    });
    userToken = loginRes.body.data.accessToken;

    await request(app)
      .patch('/api/v1/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        bio: 'Passionate about React, Next.js, and TypeScript application development with clean UI workflows.',
        location: 'Remote, US'
      });

    await request(app)
      .post('/api/v1/profile/educations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        institution: 'University of California, Berkeley',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
        startDate: '2021-09-01',
        endDate: '2025-05-15',
        gpa: '3.20'
      });

    await request(app)
      .post('/api/v1/profile/skills')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        skills: [
          { name: 'React', proficiencyLevel: 'advanced' },
          { name: 'TypeScript', proficiencyLevel: 'intermediate' }
        ]
      });

    const samplePdfContent = '%PDF-1.4\nTECHNICAL SKILLS\nReact, TypeScript, Next.js, Tailwind CSS\nPROJECTS\nPortfolio web app built with Next.js\n%%EOF';
    await request(app)
      .post('/api/v1/resumes/upload')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('resume', Buffer.from(samplePdfContent), 'resume.pdf');

    const internshipsRes = await request(app).get('/api/v1/internships?limit=50');
    const vercel = internshipsRes.body.data.internships.find(i => /vercel/i.test(i.company));
    const scale = internshipsRes.body.data.internships.find(i => /scale ai/i.test(i.company));

    vercelInternshipId = vercel ? vercel.id : internshipsRes.body.data.internships[0].id;
    scaleAiInternshipId = scale ? scale.id : internshipsRes.body.data.internships[1].id;
  });

  it('rejects unauthenticated match analysis', async () => {
    const res = await request(app)
      .post('/api/v1/matching/analyze')
      .send({ internshipId: vercelInternshipId });

    expect(res.status).toBe(401);
  });

  it('rejects match analysis without internshipId', async () => {
    const res = await request(app)
      .post('/api/v1/matching/analyze')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('computes hybrid match score with independent deterministic and semantic components', async () => {
    const res = await request(app)
      .post('/api/v1/matching/analyze')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ internshipId: vercelInternshipId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const result = res.body.data;
    firstResultId = result.id;

    expect(result).toHaveProperty('overallScore');
    expect(typeof result.overallScore).toBe('number');
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);

    expect(result).toHaveProperty('deterministicScore');
    expect(typeof result.deterministicScore).toBe('number');

    expect(result).toHaveProperty('semanticScore');
    expect(typeof result.semanticScore).toBe('number');

    expect(result).toHaveProperty('engineVersion');
    expect(result.engineVersion).toBe('v1.0.0');

    expect(result).toHaveProperty('weightsConfig');
    expect(result.weightsConfig.weights).toHaveProperty('technicalSkills');

    expect(result).toHaveProperty('scoreBreakdown');
    expect(result.scoreBreakdown).toHaveProperty('technicalSkills');
    expect(result.scoreBreakdown).toHaveProperty('relevantProjects');
    expect(result.scoreBreakdown).toHaveProperty('education');
    expect(result.scoreBreakdown).toHaveProperty('experience');
    expect(result.scoreBreakdown).toHaveProperty('roleSpecific');

    expect(typeof result.summaryExplanation).toBe('string');
    expect(result.summaryExplanation.length).toBeGreaterThan(10);
  });

  it('cites candidate evidence for positive skill matches and identifies missing skills', async () => {
    const res = await request(app)
      .get(`/api/v1/matching/results/${firstResultId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    const result = res.body.data;

    expect(Array.isArray(result.matchEvidence)).toBe(true);
    expect(result.matchEvidence.length).toBeGreaterThan(0);

    const matchedItem = result.matchEvidence.find(e => e.matchStatus === 'matched');
    if (matchedItem) {
      expect(matchedItem.confidenceScore).toBeGreaterThan(0);
      expect(matchedItem.evidenceSnippet).toBeTruthy();
    }
  });

  it('detects and flags eligibility warnings separately from compatibility score', async () => {
    const res = await request(app)
      .post('/api/v1/matching/analyze')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ internshipId: scaleAiInternshipId });

    expect(res.status).toBe(200);
    const result = res.body.data;

    expect(result.eligibilityStatus).toBe('warning');
    expect(Array.isArray(result.eligibilityWarnings)).toBe(true);
    expect(result.eligibilityWarnings.length).toBeGreaterThan(0);
    expect(result.eligibilityWarnings[0]).toMatch(/GPA/i);

    expect(Array.isArray(result.skillGaps)).toBe(true);
    expect(result.skillGaps.length).toBeGreaterThan(0);
    const criticalGap = result.skillGaps.find(g => g.importance === 'critical');
    expect(criticalGap).toBeDefined();
    expect(criticalGap.recommendedAction).toBeTruthy();
  });

  it('produces a new traceable result upon re-running analysis instead of mutating previous result', async () => {
    const secondRunRes = await request(app)
      .post('/api/v1/matching/analyze')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ internshipId: vercelInternshipId });

    expect(secondRunRes.status).toBe(200);
    const secondResultId = secondRunRes.body.data.id;
    expect(secondResultId).not.toBe(firstResultId);

    const historyRes = await request(app)
      .get(`/api/v1/matching/history?internshipId=${vercelInternshipId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.length).toBeGreaterThanOrEqual(2);
    const historyIds = historyRes.body.data.map(h => h.id);
    expect(historyIds).toContain(firstResultId);
    expect(historyIds).toContain(secondResultId);
  });
});
