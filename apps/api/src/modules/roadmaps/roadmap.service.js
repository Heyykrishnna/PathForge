import { eq, and, desc, ilike } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  roadmaps,
  roadmapTasks,
  bridgeProjects,
  internships,
  internshipSkills,
  skills,
  matchResults,
  skillGaps,
  userSkills
} from '../../db/schema/index.js';
import { ApiError } from '../../utils/api-error.js';
import { generateSevenDayRoadmapPlan } from '../../utils/roadmap-generator.js';

export class RoadmapService {
  async generateRoadmap(userId, { matchResultId = null, internshipId = null } = {}) {
    if (!matchResultId && !internshipId) {
      throw ApiError.badRequest('Either matchResultId or internshipId is required to generate a roadmap');
    }

    let targetInternship = null;
    let gapsList = [];

    if (matchResultId) {
      const [match] = await db
        .select()
        .from(matchResults)
        .where(and(eq(matchResults.id, matchResultId), eq(matchResults.userId, userId)))
        .limit(1);

      if (!match) {
        throw ApiError.notFound('Match result not found or unauthorized');
      }

      const [internship] = await db
        .select()
        .from(internships)
        .where(eq(internships.id, match.internshipId))
        .limit(1);

      if (!internship) {
        throw ApiError.notFound('Target internship for this match result not found');
      }

      targetInternship = internship;

      const loadedGaps = await db
        .select()
        .from(skillGaps)
        .where(eq(skillGaps.matchResultId, match.id));

      gapsList = loadedGaps;
    } else {
      const [internship] = await db
        .select()
        .from(internships)
        .where(eq(internships.id, internshipId))
        .limit(1);

      if (!internship) {
        throw ApiError.notFound('Internship not found');
      }

      targetInternship = internship;

      const requiredSkillsList = await db
        .select({
          name: skills.name,
          isRequired: internshipSkills.isRequired
        })
        .from(internshipSkills)
        .innerJoin(skills, eq(internshipSkills.skillId, skills.id))
        .where(and(eq(internshipSkills.internshipId, internshipId), eq(internshipSkills.isRequired, true)));

      const studentSkills = await db
        .select({ name: skills.name })
        .from(userSkills)
        .innerJoin(skills, eq(userSkills.skillId, skills.id))
        .where(eq(userSkills.userId, userId));

      const studentSkillSet = new Set(studentSkills.map(s => s.name.toLowerCase()));

      gapsList = requiredSkillsList
        .filter(r => !studentSkillSet.has(r.name.toLowerCase()))
        .map(r => ({
          skillName: r.name,
          importance: 'critical',
          recommendedAction: `Complete bridge module for ${r.name}`
        }));
    }

    const primaryGapName = gapsList[0]?.skillName || null;
    let bridgeProject = null;

    if (primaryGapName) {
      const [matchedBp] = await db
        .select()
        .from(bridgeProjects)
        .where(ilike(bridgeProjects.targetSkill, `%${primaryGapName}%`))
        .limit(1);

      if (matchedBp) {
        bridgeProject = matchedBp;
      }
    }

    if (!bridgeProject) {
      const [defaultBp] = await db
        .select()
        .from(bridgeProjects)
        .limit(1);
      bridgeProject = defaultBp || null;
    }

    const plan = generateSevenDayRoadmapPlan({
      internship: targetInternship,
      skillGaps: gapsList,
      bridgeProject
    });

    const [createdRoadmap] = await db
      .insert(roadmaps)
      .values({
        userId,
        internshipId: targetInternship.id,
        matchResultId: matchResultId || null,
        title: plan.title,
        targetRole: plan.targetRole,
        targetCompany: plan.targetCompany,
        status: 'active',
        progressPercentage: 0,
        generationInputs: plan.generationInputs,
        version: plan.version
      })
      .returning();

    const taskInserts = plan.tasks.map(t => ({
      roadmapId: createdRoadmap.id,
      dayNumber: t.dayNumber,
      orderIndex: t.orderIndex,
      title: t.title,
      description: t.description,
      estimatedHours: t.estimatedHours,
      expectedOutput: t.expectedOutput,
      skillGap: t.skillGap,
      isCompleted: false
    }));

    const insertedTasks = await db
      .insert(roadmapTasks)
      .values(taskInserts)
      .returning();

    return {
      ...createdRoadmap,
      internship: targetInternship,
      tasks: insertedTasks.sort((a, b) => a.dayNumber - b.dayNumber)
    };
  }

  async listRoadmaps(userId) {
    const userRoadmaps = await db
      .select({
        id: roadmaps.id,
        internshipId: roadmaps.internshipId,
        matchResultId: roadmaps.matchResultId,
        title: roadmaps.title,
        targetRole: roadmaps.targetRole,
        targetCompany: roadmaps.targetCompany,
        status: roadmaps.status,
        progressPercentage: roadmaps.progressPercentage,
        version: roadmaps.version,
        createdAt: roadmaps.createdAt,
        updatedAt: roadmaps.updatedAt,
        internshipLocation: internships.location,
        internshipWorkMode: internships.workMode
      })
      .from(roadmaps)
      .innerJoin(internships, eq(roadmaps.internshipId, internships.id))
      .where(eq(roadmaps.userId, userId))
      .orderBy(desc(roadmaps.updatedAt));

    return userRoadmaps;
  }

  async getRoadmapById(userId, roadmapId) {
    const [roadmap] = await db
      .select()
      .from(roadmaps)
      .where(and(eq(roadmaps.id, roadmapId), eq(roadmaps.userId, userId)))
      .limit(1);

    if (!roadmap) {
      throw ApiError.notFound('Roadmap not found or unauthorized');
    }

    const [internship] = await db
      .select()
      .from(internships)
      .where(eq(internships.id, roadmap.internshipId))
      .limit(1);

    const tasks = await db
      .select()
      .from(roadmapTasks)
      .where(eq(roadmapTasks.roadmapId, roadmapId))
      .orderBy(roadmapTasks.dayNumber, roadmapTasks.orderIndex);

    return {
      ...roadmap,
      internship,
      tasks
    };
  }

  async updateRoadmap(userId, roadmapId, { title, status } = {}) {
    const [existing] = await db
      .select()
      .from(roadmaps)
      .where(and(eq(roadmaps.id, roadmapId), eq(roadmaps.userId, userId)))
      .limit(1);

    if (!existing) {
      throw ApiError.notFound('Roadmap not found or unauthorized');
    }

    const updates = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title;
    if (status !== undefined) updates.status = status;

    const [updated] = await db
      .update(roadmaps)
      .set(updates)
      .where(and(eq(roadmaps.id, roadmapId), eq(roadmaps.userId, userId)))
      .returning();

    return updated;
  }

  async updateTask(userId, roadmapId, taskId, updates = {}) {
    const [roadmap] = await db
      .select()
      .from(roadmaps)
      .where(and(eq(roadmaps.id, roadmapId), eq(roadmaps.userId, userId)))
      .limit(1);

    if (!roadmap) {
      throw ApiError.notFound('Roadmap not found or unauthorized');
    }

    const [task] = await db
      .select()
      .from(roadmapTasks)
      .where(and(eq(roadmapTasks.id, taskId), eq(roadmapTasks.roadmapId, roadmapId)))
      .limit(1);

    if (!task) {
      throw ApiError.notFound('Task not found in this roadmap');
    }

    const taskUpdates = { updatedAt: new Date() };

    if (updates.isCompleted !== undefined) {
      taskUpdates.isCompleted = Boolean(updates.isCompleted);
      taskUpdates.completedAt = taskUpdates.isCompleted ? new Date() : null;
    }

    if (updates.title !== undefined) taskUpdates.title = updates.title;
    if (updates.description !== undefined) taskUpdates.description = updates.description;
    if (updates.userNotes !== undefined) taskUpdates.userNotes = updates.userNotes;
    if (updates.expectedOutput !== undefined) taskUpdates.expectedOutput = updates.expectedOutput;
    if (updates.estimatedHours !== undefined) taskUpdates.estimatedHours = Number(updates.estimatedHours);

    const [updatedTask] = await db
      .update(roadmapTasks)
      .set(taskUpdates)
      .where(eq(roadmapTasks.id, taskId))
      .returning();

    const allTasks = await db
      .select({ isCompleted: roadmapTasks.isCompleted })
      .from(roadmapTasks)
      .where(eq(roadmapTasks.roadmapId, roadmapId));

    const totalCount = allTasks.length;
    const completedCount = allTasks.filter(t => t.isCompleted).length;
    const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const newStatus = newProgress === 100 ? 'completed' : roadmap.status === 'completed' ? 'active' : roadmap.status;

    await db
      .update(roadmaps)
      .set({
        progressPercentage: newProgress,
        status: newStatus,
        updatedAt: new Date()
      })
      .where(eq(roadmaps.id, roadmapId));

    return {
      task: updatedTask,
      progressPercentage: newProgress,
      roadmapStatus: newStatus
    };
  }

  async listBridgeProjects(targetSkill = null) {
    let query = db.select().from(bridgeProjects);
    if (targetSkill && targetSkill.trim()) {
      query = query.where(ilike(bridgeProjects.targetSkill, `%${targetSkill.trim()}%`));
    }
    return query;
  }
}

export const roadmapService = new RoadmapService();
