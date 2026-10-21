import fs from 'fs';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { resumes, candidateEvidence, skills, userSkills } from '../../db/schema/index.js';
import { ApiError } from '../../utils/api-error.js';
import { extractTextFromPdf, parseResumeText } from '../../utils/resume-parser.js';

export class ResumeService {
  async uploadResume({ userId, file }) {
    if (!file) {
      throw ApiError.badRequest('Resume file is required');
    }

    const [record] = await db
      .insert(resumes)
      .values({
        userId,
        fileName: file.originalname,
        fileKey: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: 'uploaded'
      })
      .returning();

    return record;
  }

  async listResumes(userId) {
    return db
      .select({
        id: resumes.id,
        fileName: resumes.fileName,
        fileSize: resumes.fileSize,
        mimeType: resumes.mimeType,
        status: resumes.status,
        isConfirmed: resumes.isConfirmed,
        createdAt: resumes.createdAt,
        updatedAt: resumes.updatedAt
      })
      .from(resumes)
      .where(eq(resumes.userId, userId))
      .orderBy(desc(resumes.createdAt));
  }

  async getResume(userId, resumeId) {
    const [record] = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
      .limit(1);

    if (!record) {
      throw ApiError.notFound('Resume not found or unauthorized');
    }

    return record;
  }

  async analyzeResume(userId, resumeId) {
    const resume = await this.getResume(userId, resumeId);

    await db
      .update(resumes)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(resumes.id, resume.id));

    try {
      const fileBuffer = fs.readFileSync(resume.fileKey);
      const rawText = await extractTextFromPdf(fileBuffer);
      const extractedData = parseResumeText(rawText);

      const [updated] = await db
        .update(resumes)
        .set({
          status: 'completed',
          rawText,
          extractedData,
          errorMessage: null,
          updatedAt: new Date()
        })
        .where(eq(resumes.id, resume.id))
        .returning();

      for (const skill of extractedData.skills) {
        const [existingEvidence] = await db
          .select()
          .from(candidateEvidence)
          .where(
            and(
              eq(candidateEvidence.userId, userId),
              eq(candidateEvidence.skillName, skill.name),
              eq(candidateEvidence.sourceType, 'resume')
            )
          )
          .limit(1);

        if (!existingEvidence) {
          await db.insert(candidateEvidence).values({
            userId,
            skillName: skill.name,
            sourceType: 'resume',
            sourceId: resume.id,
            confidenceScore: skill.confidence,
            evidenceContext: skill.context,
            isConfirmedByUser: false
          });
        }
      }

      return updated;
    } catch (error) {
      await db
        .update(resumes)
        .set({
          status: 'failed',
          errorMessage: error.message || 'Text extraction failed',
          updatedAt: new Date()
        })
        .where(eq(resumes.id, resume.id));

      throw ApiError.badRequest(`Resume extraction failed: ${error.message}`);
    }
  }

  async confirmResumeData(userId, resumeId, { confirmedSkills = [] }) {
    const resume = await this.getResume(userId, resumeId);

    await db
      .update(resumes)
      .set({ isConfirmed: true, updatedAt: new Date() })
      .where(eq(resumes.id, resume.id));

    for (const item of confirmedSkills) {
      const trimmed = typeof item === 'string' ? item.trim() : (item?.name || '').trim();
      if (!trimmed) continue;

      let [skillRecord] = await db
        .select()
        .from(skills)
        .where(eq(skills.name, trimmed))
        .limit(1);

      if (!skillRecord) {
        [skillRecord] = await db
          .insert(skills)
          .values({ name: trimmed, category: 'resume_extracted' })
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

      await db
        .update(candidateEvidence)
        .set({ isConfirmedByUser: true, updatedAt: new Date() })
        .where(
          and(
            eq(candidateEvidence.userId, userId),
            eq(candidateEvidence.skillName, trimmed)
          )
        );
    }

    return { success: true, confirmedSkills };
  }
}

export const resumeService = new ResumeService();
