import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  applications,
  applicationEvents,
  internships,
  activityLogs
} from '../../db/schema/index.js';
import { ApiError } from '../../utils/api-error.js';

export const VALID_APPLICATION_STATUSES = Object.freeze([
  'saved',
  'preparing',
  'ready',
  'applied',
  'interviewing',
  'offered',
  'rejected'
]);

export class ApplicationService {
  async createApplication(userId, data) {
    const {
      internshipId,
      status = 'saved',
      appliedAt = null,
      deadline = null,
      notes = null,
      nextAction = null,
      nextActionDeadline = null
    } = data;

    if (!internshipId) {
      throw ApiError.badRequest('internshipId is required');
    }

    if (!VALID_APPLICATION_STATUSES.includes(status)) {
      throw ApiError.badRequest(`Invalid application status: ${status}`);
    }

    const [internship] = await db
      .select()
      .from(internships)
      .where(eq(internships.id, internshipId))
      .limit(1);

    if (!internship) {
      throw ApiError.notFound('Internship not found');
    }

    const [existing] = await db
      .select({ id: applications.id, status: applications.status })
      .from(applications)
      .where(
        and(
          eq(applications.userId, userId),
          eq(applications.internshipId, internshipId)
        )
      )
      .limit(1);

    if (existing && existing.status !== 'rejected') {
      throw ApiError.conflict('An active application already exists for this internship');
    }

    const [created] = await db
      .insert(applications)
      .values({
        userId,
        internshipId,
        status,
        appliedAt: appliedAt ? new Date(appliedAt) : status === 'applied' ? new Date() : null,
        deadline: deadline ? new Date(deadline) : null,
        notes,
        nextAction,
        nextActionDeadline: nextActionDeadline ? new Date(nextActionDeadline) : null
      })
      .returning();

    await db.insert(applicationEvents).values({
      applicationId: created.id,
      eventType: 'created',
      toStatus: status,
      note: 'Application initiated'
    });

    await db.insert(activityLogs).values({
      userId,
      activityType: 'application_created',
      title: `Tracked application for ${internship.company}`,
      description: `Targeting ${internship.title} with initial status: ${status}`,
      metadata: { applicationId: created.id, internshipId: internship.id }
    });

    return {
      ...created,
      internship
    };
  }

  async listApplications(userId, { status = null } = {}) {
    const conditions = [eq(applications.userId, userId)];
    if (status && VALID_APPLICATION_STATUSES.includes(status)) {
      conditions.push(eq(applications.status, status));
    }

    const rows = await db
      .select({
        id: applications.id,
        internshipId: applications.internshipId,
        status: applications.status,
        appliedAt: applications.appliedAt,
        deadline: applications.deadline,
        notes: applications.notes,
        nextAction: applications.nextAction,
        nextActionDeadline: applications.nextActionDeadline,
        createdAt: applications.createdAt,
        updatedAt: applications.updatedAt,
        internshipTitle: internships.title,
        internshipCompany: internships.company,
        internshipLocation: internships.location,
        internshipWorkMode: internships.workMode,
        internshipSourceUrl: internships.sourceUrl
      })
      .from(applications)
      .innerJoin(internships, eq(applications.internshipId, internships.id))
      .where(and(...conditions))
      .orderBy(desc(applications.updatedAt));

    return rows;
  }

  async getApplicationById(userId, applicationId) {
    const [appRecord] = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
      .limit(1);

    if (!appRecord) {
      throw ApiError.notFound('Application not found or unauthorized');
    }

    const [internship] = await db
      .select()
      .from(internships)
      .where(eq(internships.id, appRecord.internshipId))
      .limit(1);

    const events = await db
      .select()
      .from(applicationEvents)
      .where(eq(applicationEvents.applicationId, applicationId))
      .orderBy(desc(applicationEvents.createdAt));

    return {
      ...appRecord,
      internship,
      events
    };
  }

  async updateApplication(userId, applicationId, updates = {}) {
    const [existing] = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
      .limit(1);

    if (!existing) {
      throw ApiError.notFound('Application not found or unauthorized');
    }

    const patchData = { updatedAt: new Date() };

    if (updates.status !== undefined) {
      if (!VALID_APPLICATION_STATUSES.includes(updates.status)) {
        throw ApiError.badRequest(`Invalid application status: ${updates.status}`);
      }
      patchData.status = updates.status;

      if (updates.status === 'applied' && !existing.appliedAt && !updates.appliedAt) {
        patchData.appliedAt = new Date();
      }

      if (existing.status !== updates.status) {
        await db.insert(applicationEvents).values({
          applicationId,
          eventType: 'status_change',
          fromStatus: existing.status,
          toStatus: updates.status,
          note: updates.eventNote || `Status moved from ${existing.status} to ${updates.status}`
        });

        await db.insert(activityLogs).values({
          userId,
          activityType: 'application_status_updated',
          title: `Application status updated to ${updates.status}`,
          description: `Updated status on application ${applicationId}`,
          metadata: { applicationId, fromStatus: existing.status, toStatus: updates.status }
        });
      }
    }

    if (updates.appliedAt !== undefined) {
      patchData.appliedAt = updates.appliedAt ? new Date(updates.appliedAt) : null;
    }

    if (updates.deadline !== undefined) {
      patchData.deadline = updates.deadline ? new Date(updates.deadline) : null;
    }

    if (updates.notes !== undefined) {
      patchData.notes = updates.notes;
    }

    if (updates.nextAction !== undefined) {
      patchData.nextAction = updates.nextAction;
    }

    if (updates.nextActionDeadline !== undefined) {
      patchData.nextActionDeadline = updates.nextActionDeadline ? new Date(updates.nextActionDeadline) : null;
    }

    await db
      .update(applications)
      .set(patchData)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
      .returning();

    return this.getApplicationById(userId, applicationId);
  }

  async deleteApplication(userId, applicationId) {
    const [existing] = await db
      .select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
      .limit(1);

    if (!existing) {
      throw ApiError.notFound('Application not found or unauthorized');
    }

    await db
      .delete(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)));

    return { deleted: true, applicationId };
  }
}

export const applicationService = new ApplicationService();
