import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { seedDatabase } from '../src/db/seed.js';

describe('Dashboard Aggregates Integration Tests', () => {
  let userToken = '';
  let internshipId = '';

  beforeAll(async () => {
    await seedDatabase();

    const user = {
      email: `dashboard_student_${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Diana',
      lastName: 'Dash'
    };

    await request(app).post('/api/v1/auth/register').send(user);
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: user.email,
      password: user.password
    });
    userToken = loginRes.body.data.accessToken;

    await request(app)
      .patch('/api/v1/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        bio: 'Frontend & Distributed Systems Enthusiast',
        location: 'New York, NY'
      });

    const internshipsRes = await request(app).get('/api/v1/internships');
    internshipId = internshipsRes.body.data.internships[0].id;

    await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        internshipId,
        status: 'applied',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        nextAction: 'Prepare for technical screen',
        nextActionDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      });

    const matchRes = await request(app)
      .post('/api/v1/matching/analyze')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ internshipId });

    await request(app)
      .post('/api/v1/roadmaps/generate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ matchResultId: matchRes.body.data.id });
  });

  it('rejects unauthenticated request to dashboard overview', async () => {
    const res = await request(app).get('/api/v1/dashboard/overview');
    expect(res.status).toBe(401);
  });

  it('computes accurate backend aggregates across applications, roadmaps, and profile', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/overview')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;

    expect(data.profileSummary).toBeDefined();
    expect(data.profileSummary.firstName).toBe('Diana');
    expect(data.profileSummary.bio).toBe('Frontend & Distributed Systems Enthusiast');
    expect(data.profileSummary.completionPercentage).toBeGreaterThanOrEqual(20);

    expect(data.applicationsSummary).toBeDefined();
    expect(data.applicationsSummary.applied).toBe(1);
    expect(data.applicationsSummary.total).toBe(1);

    expect(data.roadmapsSummary).toBeDefined();
    expect(data.roadmapsSummary.total).toBe(1);
    expect(data.roadmapsSummary.active).toBe(1);
    expect(data.roadmapsSummary.nextPendingTask).toBeDefined();
    expect(data.roadmapsSummary.nextPendingTask.dayNumber).toBe(1);

    expect(Array.isArray(data.upcomingDeadlines)).toBe(true);
    expect(data.upcomingDeadlines.length).toBeGreaterThanOrEqual(1);
    expect(data.upcomingDeadlines[0]).toHaveProperty('date');
    expect(data.upcomingDeadlines[0]).toHaveProperty('title');

    expect(Array.isArray(data.recentMatches)).toBe(true);
    expect(data.recentMatches.length).toBeGreaterThanOrEqual(1);

    expect(Array.isArray(data.recommendedInternships)).toBe(true);
    expect(data.recommendedInternships.length).toBeGreaterThan(0);
  });
});
