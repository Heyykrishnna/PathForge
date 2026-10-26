import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Student Profile and Ownership Integration Tests', () => {
  let userAToken = '';
  let userBToken = '';
  let userAEducationId = '';

  beforeAll(async () => {
    const userA = {
      email: `user_a_${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Alice',
      lastName: 'Smith'
    };

    const userB = {
      email: `user_b_${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Bob',
      lastName: 'Jones'
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

  it('retrieves student profile and initial completion score', async () => {
    const res = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.profile.firstName).toBe('Alice');
    expect(res.body.data.profile.completionPercentage).toBeGreaterThanOrEqual(20);
    expect(Array.isArray(res.body.data.educations)).toBe(true);
    expect(Array.isArray(res.body.data.skills)).toBe(true);
  });

  it('updates profile details and recalculates completion percentage', async () => {
    const res = await request(app)
      .patch('/api/v1/profile')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        bio: 'Computer Science student passionate about distributed systems.',
        location: 'San Francisco, CA',
        githubUrl: 'https://github.com/alicesmith'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.bio).toBe('Computer Science student passionate about distributed systems.');
    expect(res.body.data.completionPercentage).toBeGreaterThan(20);
  });

  it('adds education history entry and persists data', async () => {
    const res = await request(app)
      .post('/api/v1/profile/educations')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        institution: 'University of California, Berkeley',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
        startDate: '2022-09-01T00:00:00.000Z',
        isCurrent: true,
        gpa: '3.85'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.institution).toBe('University of California, Berkeley');
    expect(res.body.data.id).toBeDefined();

    userAEducationId = res.body.data.id;

    const profileRes = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(profileRes.body.data.educations.length).toBe(1);
    expect(profileRes.body.data.educations[0].institution).toBe('University of California, Berkeley');
  });

  it('syncs user skills linked to canonical skills catalogue', async () => {
    const res = await request(app)
      .post('/api/v1/profile/skills')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        skills: [
          { name: 'TypeScript', category: 'languages', proficiencyLevel: 'advanced' },
          { name: 'Node.js', category: 'backend', proficiencyLevel: 'intermediate' },
          { name: 'PostgreSQL', category: 'database', proficiencyLevel: 'intermediate' }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
    expect(res.body.data.map(s => s.name)).toContain('TypeScript');
  });

  it('enforces strict ownership isolation: User B cannot modify User A education', async () => {
    const res = await request(app)
      .patch(`/api/v1/profile/educations/${userAEducationId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        institution: 'Malicious Override'
      });

    expect(res.status).toBe(404);
  });

  it('enforces strict ownership isolation: User B cannot delete User A education', async () => {
    const res = await request(app)
      .delete(`/api/v1/profile/educations/${userAEducationId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404);
  });

  it('allows owner User A to delete their own education entry', async () => {
    const res = await request(app)
      .delete(`/api/v1/profile/educations/${userAEducationId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);

    const profileRes = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(profileRes.body.data.educations.length).toBe(0);
  });
});

