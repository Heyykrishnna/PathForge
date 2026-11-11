import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { seedDatabase } from '../src/db/seed.js';

describe('Application Tracking Pipeline Integration Tests', () => {
  let userAToken = '';
  let userBToken = '';
  let internshipId = '';
  let secondInternshipId = '';
  let createdAppId = '';

  beforeAll(async () => {
    await seedDatabase();

    const userA = {
      email: `app_candidate_a_${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'App',
      lastName: 'Tracker'
    };

    const userB = {
      email: `app_candidate_b_${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Other',
      lastName: 'Candidate'
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

    const listRes = await request(app).get('/api/v1/internships');
    internshipId = listRes.body.data.internships[0].id;
    secondInternshipId = listRes.body.data.internships[1].id;
  });

  it('rejects unauthenticated application creation and listing', async () => {
    const createRes = await request(app)
      .post('/api/v1/applications')
      .send({ internshipId });
    expect(createRes.status).toBe(401);

    const listRes = await request(app).get('/api/v1/applications');
    expect(listRes.status).toBe(401);
  });

  it('creates an application linked to an internship with initial saved status and logs event', async () => {
    const res = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        internshipId,
        status: 'saved',
        notes: 'Target role for Summer 2025. Spoke with team at career fair.',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    createdAppId = data.id;

    expect(data.internshipId).toBe(internshipId);
    expect(data.status).toBe('saved');
    expect(data.notes).toBe('Target role for Summer 2025. Spoke with team at career fair.');
    expect(data.deadline).toBeDefined();
    expect(data.internship.company).toBeDefined();
  });

  it('prevents duplicate active application for the same internship and user', async () => {
    const res = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        internshipId,
        status: 'preparing'
      });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/active application already exists/i);
  });

  it('allows user to retrieve single application with status change events', async () => {
    const res = await request(app)
      .get(`/api/v1/applications/${createdAppId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdAppId);
    expect(Array.isArray(res.body.data.events)).toBe(true);
    expect(res.body.data.events.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.events[0].toStatus).toBe('saved');
  });

  it('updates status from saved to applied and auto-sets appliedAt date', async () => {
    const res = await request(app)
      .patch(`/api/v1/applications/${createdAppId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        status: 'applied',
        nextAction: 'Follow up with recruiter on LinkedIn',
        nextActionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('applied');
    expect(res.body.data.appliedAt).toBeTruthy();
    expect(res.body.data.nextAction).toBe('Follow up with recruiter on LinkedIn');

    const appWithEvents = await request(app)
      .get(`/api/v1/applications/${createdAppId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(appWithEvents.body.data.events.length).toBeGreaterThanOrEqual(2);
    const latestEvent = appWithEvents.body.data.events[0];
    expect(latestEvent.fromStatus).toBe('saved');
    expect(latestEvent.toStatus).toBe('applied');
  });

  it('rejects update with invalid status string', async () => {
    const res = await request(app)
      .patch(`/api/v1/applications/${createdAppId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ status: 'super_hired' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/invalid application status/i);
  });

  it('prevents another user from viewing or mutating user A application', async () => {
    const getRes = await request(app)
      .get(`/api/v1/applications/${createdAppId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(getRes.status).toBe(404);

    const patchRes = await request(app)
      .patch(`/api/v1/applications/${createdAppId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ status: 'offered' });

    expect(patchRes.status).toBe(404);
  });

  it('lists applications filtered by status', async () => {
    await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        internshipId: secondInternshipId,
        status: 'preparing'
      });

    const appliedList = await request(app)
      .get('/api/v1/applications?status=applied')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(appliedList.status).toBe(200);
    for (const item of appliedList.body.data) {
      expect(item.status).toBe('applied');
    }

    const allList = await request(app)
      .get('/api/v1/applications')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(allList.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('deletes an application and verifies removal', async () => {
    const deleteRes = await request(app)
      .delete(`/api/v1/applications/${createdAppId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.deleted).toBe(true);

    const getRes = await request(app)
      .get(`/api/v1/applications/${createdAppId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(getRes.status).toBe(404);
  });
});

