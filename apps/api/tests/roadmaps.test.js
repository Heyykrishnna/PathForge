import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { seedDatabase } from '../src/db/seed.js';

describe('Roadmaps and Preparation Pipeline Integration Tests', () => {
  let userAToken = '';
  let userBToken = '';
  let internshipId = '';
  let userAMatchResultId = '';
  let generatedRoadmapId = '';
  let firstTaskId = '';

  beforeAll(async () => {
    await seedDatabase();

    const userA = {
      email: `roadmap_student_a_${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Roadmap',
      lastName: 'Student'
    };

    const userB = {
      email: `roadmap_student_b_${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Other',
      lastName: 'Student'
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

    const internshipsRes = await request(app).get('/api/v1/internships');
    internshipId = internshipsRes.body.data.internships[0].id;

    const matchRes = await request(app)
      .post('/api/v1/matching/analyze')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ internshipId });

    userAMatchResultId = matchRes.body.data.id;
  });

  it('rejects unauthenticated roadmap generation', async () => {
    const res = await request(app)
      .post('/api/v1/roadmaps/generate')
      .send({ matchResultId: userAMatchResultId });

    expect(res.status).toBe(401);
  });

  it('rejects generation when neither matchResultId nor internshipId is provided', async () => {
    const res = await request(app)
      .post('/api/v1/roadmaps/generate')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('rejects roadmap generation using another user match result', async () => {
    const res = await request(app)
      .post('/api/v1/roadmaps/generate')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ matchResultId: userAMatchResultId });

    expect(res.status).toBe(404);
  });

  it('generates a 7-day preparation roadmap mapped to candidate skill gaps', async () => {
    const res = await request(app)
      .post('/api/v1/roadmaps/generate')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ matchResultId: userAMatchResultId });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const roadmap = res.body.data;
    generatedRoadmapId = roadmap.id;

    expect(roadmap.userId).toBeDefined();
    expect(roadmap.internshipId).toBe(internshipId);
    expect(roadmap.version).toBe('v1.0.0');
    expect(roadmap.status).toBe('active');
    expect(roadmap.progressPercentage).toBe(0);
    expect(roadmap.generationInputs).toBeDefined();

    expect(Array.isArray(roadmap.tasks)).toBe(true);
    expect(roadmap.tasks.length).toBe(7);

    for (let i = 0; i < 7; i++) {
      const task = roadmap.tasks[i];
      expect(task.dayNumber).toBe(i + 1);
      expect(task.title).toBeTruthy();
      expect(task.description).toBeTruthy();
      expect(task.estimatedHours).toBeGreaterThan(0);
      expect(task.expectedOutput).toBeTruthy();
      expect(task.isCompleted).toBe(false);
      expect(task.completedAt).toBeNull();
    }

    firstTaskId = roadmap.tasks[0].id;
  });

  it('allows user to retrieve single roadmap with complete task schedule', async () => {
    const res = await request(app)
      .get(`/api/v1/roadmaps/${generatedRoadmapId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(generatedRoadmapId);
    expect(res.body.data.tasks.length).toBe(7);
    expect(res.body.data.internship).toBeDefined();
    expect(res.body.data.internship.id).toBe(internshipId);
  });

  it('prevents another user from viewing or modifying the roadmap', async () => {
    const getRes = await request(app)
      .get(`/api/v1/roadmaps/${generatedRoadmapId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(getRes.status).toBe(404);

    const patchRes = await request(app)
      .patch(`/api/v1/roadmaps/${generatedRoadmapId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ title: 'Hacked Roadmap' });

    expect(patchRes.status).toBe(404);
  });

  it('updates task completion and recalculates parent roadmap progress percentage', async () => {
    const patchTaskRes = await request(app)
      .patch(`/api/v1/roadmaps/${generatedRoadmapId}/tasks/${firstTaskId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        isCompleted: true,
        userNotes: 'Setup completed with GitHub repo and initial schema.'
      });

    expect(patchTaskRes.status).toBe(200);
    expect(patchTaskRes.body.data.task.isCompleted).toBe(true);
    expect(patchTaskRes.body.data.task.completedAt).toBeTruthy();
    expect(patchTaskRes.body.data.task.userNotes).toBe('Setup completed with GitHub repo and initial schema.');

    expect(patchTaskRes.body.data.progressPercentage).toBe(14);

    const getRoadmapRes = await request(app)
      .get(`/api/v1/roadmaps/${generatedRoadmapId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(getRoadmapRes.body.data.progressPercentage).toBe(14);
  });

  it('persists task uncompletion and lowers progress percentage', async () => {
    const uncompleteRes = await request(app)
      .patch(`/api/v1/roadmaps/${generatedRoadmapId}/tasks/${firstTaskId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ isCompleted: false });

    expect(uncompleteRes.status).toBe(200);
    expect(uncompleteRes.body.data.task.isCompleted).toBe(false);
    expect(uncompleteRes.body.data.task.completedAt).toBeNull();
    expect(uncompleteRes.body.data.progressPercentage).toBe(0);

    const getRoadmapRes = await request(app)
      .get(`/api/v1/roadmaps/${generatedRoadmapId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(getRoadmapRes.body.data.progressPercentage).toBe(0);
  });

  it('lists roadmaps scoped strictly to the authenticated user', async () => {
    const resA = await request(app)
      .get('/api/v1/roadmaps')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(resA.status).toBe(200);
    expect(resA.body.data.length).toBeGreaterThanOrEqual(1);
    expect(resA.body.data.map(r => r.id)).toContain(generatedRoadmapId);

    const resB = await request(app)
      .get('/api/v1/roadmaps')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(resB.status).toBe(200);
    expect(resB.body.data.length).toBe(0);
  });

  it('supports direct roadmap generation from internshipId without matchResultId', async () => {
    const res = await request(app)
      .post('/api/v1/roadmaps/generate')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ internshipId });

    expect(res.status).toBe(201);
    expect(res.body.data.tasks.length).toBe(7);
    expect(res.body.data.internshipId).toBe(internshipId);
  });

  it('lists curated bridge projects with suggested stacks and deliverables', async () => {
    const res = await request(app)
      .get('/api/v1/roadmaps/bridge-projects')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const project = res.body.data[0];
    expect(project).toHaveProperty('title');
    expect(project).toHaveProperty('targetSkill');
    expect(project).toHaveProperty('estimatedHours');
    expect(project).toHaveProperty('suggestedStack');
    expect(project).toHaveProperty('deliverables');
    expect(project).toHaveProperty('completionCriteria');
  });
});

