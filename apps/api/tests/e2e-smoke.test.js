import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { db } from '../src/db/index.js';
import { emailVerificationTokens } from '../src/db/schema/index.js';
import { eq } from 'drizzle-orm';

describe('End-to-End Pilot Smoke Test (Full Student Journey)', () => {
  it('executes registration, verification, profile setup, resume parsing, matching, roadmap, application tracking, and dashboard overview', async () => {
    const timestamp = Date.now();
    const candidateEmail = `pilot_student_${timestamp}@example.com`;
    const password = 'StrongPassword123!';

    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: candidateEmail,
        password,
        firstName: 'Alex',
        lastName: 'Rivera'
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.data.user.email).toBe(candidateEmail);
    expect(regRes.body.data.user.isEmailVerified).toBe(false);

    const [tokenRecord] = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, regRes.body.data.user.id))
      .limit(1);

    expect(tokenRecord).toBeDefined();

    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: regRes.body.data.verificationToken });

    expect(verifyRes.status).toBe(200);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: candidateEmail, password });

    expect(loginRes.status).toBe(200);
    const token = loginRes.body.data.accessToken;
    expect(token).toBeTruthy();

    const profileRes = await request(app)
      .patch('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bio: 'Full-stack software engineer passionate about developer experience, Next.js, and cloud backends.',
        location: 'San Francisco, CA'
      });

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.location).toBe('San Francisco, CA');

    const eduRes = await request(app)
      .post('/api/v1/profile/educations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        institution: 'Stanford University',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
        startDate: '2022-09-01',
        endDate: '2026-06-15',
        gpa: '3.85'
      });

    expect(eduRes.status).toBe(201);

    const skillRes = await request(app)
      .post('/api/v1/profile/skills')
      .set('Authorization', `Bearer ${token}`)
      .send({
        skills: [
          { name: 'React', proficiencyLevel: 'advanced' },
          { name: 'TypeScript', proficiencyLevel: 'advanced' },
          { name: 'Node.js', proficiencyLevel: 'intermediate' }
        ]
      });

    expect(skillRes.status).toBe(200);

    const pdfContent = '%PDF-1.4\nTECHNICAL SKILLS\nReact, TypeScript, Next.js, Node.js, PostgreSQL\nPROJECTS\nHigh throughput API built with Node and Next.js\n%%EOF';
    const uploadRes = await request(app)
      .post('/api/v1/resumes/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('resume', Buffer.from(pdfContent), 'alex_rivera_resume.pdf');

    expect(uploadRes.status).toBe(201);
    const resumeId = uploadRes.body.data.id;

    const analyzeRes = await request(app)
      .post(`/api/v1/resumes/${resumeId}/analyze`)
      .set('Authorization', `Bearer ${token}`);

    expect(analyzeRes.status).toBe(200);

    const confirmRes = await request(app)
      .post(`/api/v1/resumes/${resumeId}/confirm`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        confirmedSkills: [
          { name: 'React', category: 'frontend', confidenceScore: 0.95 },
          { name: 'TypeScript', category: 'languages', confidenceScore: 0.90 }
        ]
      });

    expect(confirmRes.status).toBe(200);

    const internshipsRes = await request(app)
      .get('/api/v1/internships?limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(internshipsRes.status).toBe(200);
    expect(internshipsRes.body.data.internships.length).toBeGreaterThan(0);
    const targetInternship = internshipsRes.body.data.internships[0];

    const matchRes = await request(app)
      .post('/api/v1/matching/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({ internshipId: targetInternship.id });

    expect(matchRes.status).toBe(200);
    const matchData = matchRes.body.data;
    expect(matchData.overallScore).toBeGreaterThan(0);
    expect(matchData.deterministicScore).toBeGreaterThanOrEqual(0);
    expect(matchData.semanticScore).toBeGreaterThanOrEqual(0);
    expect(matchData.eligibilityStatus).toBeDefined();

    const roadmapRes = await request(app)
      .post('/api/v1/roadmaps/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ matchResultId: matchData.id, internshipId: targetInternship.id });

    expect(roadmapRes.status).toBe(201);
    const roadmap = roadmapRes.body.data;
    expect(roadmap.tasks.length).toBe(7);
    expect(roadmap.progressPercentage).toBe(0);

    const firstTask = roadmap.tasks[0];
    const updateTaskRes = await request(app)
      .patch(`/api/v1/roadmaps/${roadmap.id}/tasks/${firstTask.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isCompleted: true });

    expect(updateTaskRes.status).toBe(200);
    expect(updateTaskRes.body.data.progressPercentage).toBe(14);

    const createApplicationRes = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        internshipId: targetInternship.id,
        status: 'saved',
        notes: 'Targeting Summer 2026 cohort. Need to submit by Friday.'
      });

    expect(createApplicationRes.status).toBe(201);
    const application = createApplicationRes.body.data;

    const duplicateRes = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        internshipId: targetInternship.id,
        status: 'preparing'
      });

    expect(duplicateRes.status).toBe(409);

    const applyRes = await request(app)
      .patch(`/api/v1/applications/${application.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'applied',
        notes: 'Submitted resume and portfolio link.'
      });

    expect(applyRes.status).toBe(200);
    expect(applyRes.body.data.status).toBe('applied');
    expect(applyRes.body.data.appliedAt).toBeTruthy();

    const dashboardRes = await request(app)
      .get('/api/v1/dashboard/overview')
      .set('Authorization', `Bearer ${token}`);

    expect(dashboardRes.status).toBe(200);
    const dashboard = dashboardRes.body.data;
    expect(dashboard.applicationsSummary.applied).toBe(1);
    expect(dashboard.roadmapsSummary.total).toBe(1);
    expect(dashboard.roadmapsSummary.nextPendingTask).toBeDefined();
    expect(dashboard.recentActivity.length).toBeGreaterThan(0);

    const otherEmail = `other_student_${timestamp}@example.com`;
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: otherEmail,
        password,
        firstName: 'Taylor',
        lastName: 'Swift'
      });

    const otherLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: otherEmail, password });

    const otherToken = otherLoginRes.body.data.accessToken;

    const unauthorizedRes = await request(app)
      .patch(`/api/v1/applications/${application.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ status: 'rejected' });

    expect(unauthorizedRes.status).toBe(404);

    const deleteRes = await request(app)
      .delete('/api/v1/auth/account')
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);

    const recheckLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: candidateEmail, password });

    expect(recheckLogin.status).toBe(401);
  });
});
