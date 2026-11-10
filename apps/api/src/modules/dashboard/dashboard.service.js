import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  profiles,
  applications,
  internships,
  roadmaps,
  roadmapTasks,
  matchResults,
  skillGaps,
  activityLogs
} from '../../db/schema/index.js';

export class DashboardService {
  async getOverview(userId) {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    const userApps = await db
      .select({
        id: applications.id,
        internshipId: applications.internshipId,
        status: applications.status,
        appliedAt: applications.appliedAt,
        deadline: applications.deadline,
        nextAction: applications.nextAction,
        nextActionDeadline: applications.nextActionDeadline,
        createdAt: applications.createdAt,
        updatedAt: applications.updatedAt,
        internshipTitle: internships.title,
        internshipCompany: internships.company,
        internshipLocation: internships.location,
        internshipWorkMode: internships.workMode
      })
      .from(applications)
      .innerJoin(internships, eq(applications.internshipId, internships.id))
      .where(eq(applications.userId, userId));

    const statusCounts = {
      saved: 0,
      preparing: 0,
      ready: 0,
      applied: 0,
      interviewing: 0,
      offered: 0,
      rejected: 0,
      total: userApps.length
    };

    for (const app of userApps) {
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      }
    }

    const userRoadmaps = await db
      .select()
      .from(roadmaps)
      .where(eq(roadmaps.userId, userId))
      .orderBy(desc(roadmaps.updatedAt));

    const totalRoadmaps = userRoadmaps.length;
    const activeRoadmaps = userRoadmaps.filter(r => r.status === 'active').length;
    const completedRoadmaps = userRoadmaps.filter(r => r.status === 'completed').length;
    const avgProgress = totalRoadmaps > 0
      ? Math.round(userRoadmaps.reduce((acc, r) => acc + (r.progressPercentage || 0), 0) / totalRoadmaps)
      : 0;

    let nextPendingTask = null;
    if (userRoadmaps.length > 0) {
      const activeRm = userRoadmaps.find(r => r.status === 'active') || userRoadmaps[0];
      const [pendingTask] = await db
        .select()
        .from(roadmapTasks)
        .where(and(eq(roadmapTasks.roadmapId, activeRm.id), eq(roadmapTasks.isCompleted, false)))
        .orderBy(roadmapTasks.dayNumber, roadmapTasks.orderIndex)
        .limit(1);

      if (pendingTask) {
        nextPendingTask = {
          ...pendingTask,
          targetCompany: activeRm.targetCompany,
          targetRole: activeRm.targetRole
        };
      }
    }

    const now = new Date();
    const upcomingDeadlines = [];

    for (const app of userApps) {
      if (app.deadline && new Date(app.deadline) >= now) {
        upcomingDeadlines.push({
          id: `${app.id}_deadline`,
          applicationId: app.id,
          type: 'application_deadline',
          title: `Application Deadline: ${app.internshipCompany}`,
          targetRole: app.internshipTitle,
          date: app.deadline,
          status: app.status
        });
      }
      if (app.nextActionDeadline && new Date(app.nextActionDeadline) >= now) {
        upcomingDeadlines.push({
          id: `${app.id}_action`,
          applicationId: app.id,
          type: 'next_action',
          title: app.nextAction || `Next Action for ${app.internshipCompany}`,
          targetRole: app.internshipTitle,
          date: app.nextActionDeadline,
          status: app.status
        });
      }
    }

    upcomingDeadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const recentMatches = await db
      .select({
        id: matchResults.id,
        internshipId: matchResults.internshipId,
        overallScore: matchResults.overallScore,
        deterministicScore: matchResults.deterministicScore,
        semanticScore: matchResults.semanticScore,
        eligibilityStatus: matchResults.eligibilityStatus,
        createdAt: matchResults.createdAt,
        internshipTitle: internships.title,
        internshipCompany: internships.company,
        internshipWorkMode: internships.workMode
      })
      .from(matchResults)
      .innerJoin(internships, eq(matchResults.internshipId, internships.id))
      .where(eq(matchResults.userId, userId))
      .orderBy(desc(matchResults.createdAt))
      .limit(3);

    const recentMatchIds = recentMatches.map(m => m.id);
    let topSkillGaps = [];

    if (recentMatchIds.length > 0) {
      const gaps = await db
        .select({
          skillName: skillGaps.skillName,
          importance: skillGaps.importance,
          recommendedAction: skillGaps.recommendedAction
        })
        .from(skillGaps)
        .where(eq(skillGaps.matchResultId, recentMatchIds[0]))
        .limit(5);

      topSkillGaps = gaps;
    }

    const recentActivities = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(6);

    const recommendedInternships = await db
      .select()
      .from(internships)
      .orderBy(desc(internships.verifiedAt))
      .limit(4);

    return {
      profileSummary: {
        firstName: profile?.firstName || 'Student',
        lastName: profile?.lastName || '',
        bio: profile?.bio || 'Aspiring Software Engineer',
        location: profile?.location || 'Unspecified',
        completionPercentage: profile?.completionPercentage || 20
      },
      applicationsSummary: statusCounts,
      roadmapsSummary: {
        total: totalRoadmaps,
        active: activeRoadmaps,
        completed: completedRoadmaps,
        averageProgress: avgProgress,
        nextPendingTask
      },
      upcomingDeadlines: upcomingDeadlines.slice(0, 5),
      recentMatches,
      topSkillGaps,
      recentActivity: recentActivities,
      recommendedInternships
    };
  }
}

export const dashboardService = new DashboardService();
