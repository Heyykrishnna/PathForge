import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { seedDatabase } from '../src/db/seed.js';

describe('Internship Catalogue Integration Tests', () => {
  let userToken = '';
  let seededInternshipId = '';

  beforeAll(async () => {
    await seedDatabase();

    const testUser = {
      email: `internship_test_${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Catalog',
      lastName: 'Tester'
    };

    await request(app).post('/api/v1/auth/register').send(testUser);
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: testUser.email,
      password: testUser.password
    });
    userToken = loginRes.body.data.accessToken;

    const listRes = await request(app).get('/api/v1/internships');
    if (listRes.body.data.internships.length > 0) {
      seededInternshipId = listRes.body.data.internships[0].id;
    }
  });

  it('lists internships with pagination, skills breakdown, and freshness indicators', async () => {
    const res = await request(app)
      .get('/api/v1/internships?page=1&limit=5');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.internships)).toBe(true);
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.limit).toBe(5);

    const first = res.body.data.internships[0];
    expect(first).toHaveProperty('title');
    expect(first).toHaveProperty('company');
    expect(first).toHaveProperty('sourceName');
    expect(first).toHaveProperty('verifiedAt');
    expect(first).toHaveProperty('requiredSkills');
    expect(first).toHaveProperty('preferredSkills');
    expect(first).toHaveProperty('freshness');
    expect(typeof first.freshness.daysSinceVerified).toBe('number');
  });

  it('filters internships by work mode', async () => {
    const res = await request(app)
      .get('/api/v1/internships?workMode=remote');

    expect(res.status).toBe(200);
    for (const item of res.body.data.internships) {
      expect(item.workMode).toBe('remote');
    }
  });

  it('searches internships by keyword in title or company', async () => {
    const res = await request(app)
      .get('/api/v1/internships?search=Vercel');

    expect(res.status).toBe(200);
    expect(res.body.data.internships.length).toBeGreaterThan(0);
    expect(res.body.data.internships[0].company).toMatch(/vercel/i);
  });

  it('retrieves single internship by ID', async () => {
    expect(seededInternshipId).toBeTruthy();

    const res = await request(app)
      .get(`/api/v1/internships/${seededInternshipId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(seededInternshipId);
    expect(Array.isArray(res.body.data.requiredSkills)).toBe(true);
  });

  it('returns 404 for non-existent internship ID', async () => {
    const res = await request(app)
      .get('/api/v1/internships/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
  });

  it('requires authentication to save an internship', async () => {
    const res = await request(app)
      .post(`/api/v1/internships/${seededInternshipId}/save`);

    expect(res.status).toBe(401);
  });

  it('allows authenticated user to save and unsave an internship', async () => {
    const saveRes = await request(app)
      .post(`/api/v1/internships/${seededInternshipId}/save`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.data.saved).toBe(true);

    const savedListRes = await request(app)
      .get('/api/v1/internships/saved')
      .set('Authorization', `Bearer ${userToken}`);

    expect(savedListRes.status).toBe(200);
    const savedIds = savedListRes.body.data.map(s => s.id);
    expect(savedIds).toContain(seededInternshipId);

    const unsaveRes = await request(app)
      .delete(`/api/v1/internships/${seededInternshipId}/save`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(unsaveRes.status).toBe(200);
    expect(unsaveRes.body.data.saved).toBe(false);

    const afterUnsaveList = await request(app)
      .get('/api/v1/internships/saved')
      .set('Authorization', `Bearer ${userToken}`);

    expect(afterUnsaveList.body.data.map(s => s.id)).not.toContain(seededInternshipId);
  });

  it('allows creating a new curated internship record', async () => {
    const newInternship = {
      title: 'DevOps Intern',
      company: 'HashiCorp',
      location: 'Remote',
      workMode: 'remote',
      description: 'Assist in maintaining CI/CD runners and Terraform configurations.',
      sourceUrl: 'https://hashicorp.com/jobs',
      sourceName: 'Curated Direct',
      minGpa: '3.0',
      eligibleGraduationYears: [2025, 2026],
      requiresWorkAuth: false,
      skillsList: [
        { name: 'Docker', isRequired: true, importance: 3 },
        { name: 'Git', isRequired: true, importance: 2 },
        { name: 'AWS', isRequired: false, importance: 1 }
      ]
    };

    const res = await request(app)
      .post('/api/v1/internships')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newInternship);

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('DevOps Intern');
    expect(res.body.data.requiredSkills.length).toBe(2);
    expect(res.body.data.preferredSkills.length).toBe(1);
  });
});

