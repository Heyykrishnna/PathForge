import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { candidateEvidence, skills, userSkills } from '../../db/schema/index.js';
import { ApiError } from '../../utils/api-error.js';

export class EvidenceService {
  async listEvidence(userId) {
    const records = await db
      .select()
      .from(candidateEvidence)
      .where(eq(candidateEvidence.userId, userId))
      .orderBy(desc(candidateEvidence.updatedAt));

    const selfReportedSkills = await db
      .select({
        id: userSkills.id,
        skillName: skills.name,
        category: skills.category,
        proficiencyLevel: userSkills.proficiencyLevel,
        createdAt: userSkills.createdAt
      })
      .from(userSkills)
      .innerJoin(skills, eq(userSkills.skillId, skills.id))
      .where(eq(userSkills.userId, userId));

    return {
      evidence: records,
      selfReported: selfReportedSkills,
      summary: {
        totalEvidenceItems: records.length,
        confirmedItems: records.filter(r => r.isConfirmedByUser).length,
        resumeEvidenceCount: records.filter(r => r.sourceType === 'resume').length,
        githubEvidenceCount: records.filter(r => r.sourceType === 'github').length
      }
    };
  }

  async confirmEvidence(userId, evidenceId, { isConfirmed = true, context = null } = {}) {
    const [existing] = await db
      .select()
      .from(candidateEvidence)
      .where(and(eq(candidateEvidence.id, evidenceId), eq(candidateEvidence.userId, userId)))
      .limit(1);

    if (!existing) {
      throw ApiError.notFound('Evidence item not found or unauthorized');
    }

    const [updated] = await db
      .update(candidateEvidence)
      .set({
        isConfirmedByUser: isConfirmed,
        evidenceContext: context || existing.evidenceContext,
        updatedAt: new Date()
      })
      .where(and(eq(candidateEvidence.id, evidenceId), eq(candidateEvidence.userId, userId)))
      .returning();

    if (isConfirmed) {
      let [skillRecord] = await db
        .select()
        .from(skills)
        .where(eq(skills.name, existing.skillName))
        .limit(1);

      if (!skillRecord) {
        [skillRecord] = await db
          .insert(skills)
          .values({
            name: existing.skillName,
            category: 'evidence_confirmed'
          })
          .returning();
      }

      const [existingUserSkill] = await db
        .select()
        .from(userSkills)
        .where(and(eq(userSkills.userId, userId), eq(userSkills.skillId, skillRecord.id)))
        .limit(1);

      if (!existingUserSkill) {
        await db.insert(userSkills).values({
          userId,
          skillId: skillRecord.id,
          proficiencyLevel: 'intermediate'
        });
      }
    }

    return updated;
  }

  async deleteEvidence(userId, evidenceId) {
    const [existing] = await db
      .select()
      .from(candidateEvidence)
      .where(and(eq(candidateEvidence.id, evidenceId), eq(candidateEvidence.userId, userId)))
      .limit(1);

    if (!existing) {
      throw ApiError.notFound('Evidence item not found or unauthorized');
    }

    await db
      .delete(candidateEvidence)
      .where(and(eq(candidateEvidence.id, evidenceId), eq(candidateEvidence.userId, userId)));

    return { success: true };
  }
}

export const evidenceService = new EvidenceService();

