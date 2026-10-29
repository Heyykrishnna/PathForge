import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  internships,
  internshipSkills,
  skills,
  profiles,
  educations,
  userSkills,
  candidateEvidence,
  repositories,
  matchingConfigVersions,
  matchResults,
  matchEvidence,
  skillGaps
} from '../../db/schema/index.js';
import { ApiError } from '../../utils/api-error.js';
import { computeMatchScore, DEFAULT_MATCHING_CONFIG } from '../../utils/matching-engine.js';

export class MatchingService {
  async runMatchAnalysis(userId, internshipId) {
    const [internship] = await db
      .select()
      .from(internships)
      .where(eq(internships.id, internshipId))
      .limit(1);

    if (!internship) {
      throw ApiError.notFound('Internship not found');
    }

    const internshipSkillRows = await db
      .select({
        name: skills.name,
        category: skills.category,
        isRequired: internshipSkills.isRequired,
        importance: internshipSkills.importance
      })
      .from(internshipSkills)
      .innerJoin(skills, eq(internshipSkills.skillId, skills.id))
      .where(eq(internshipSkills.internshipId, internshipId));

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    const educationRows = await db
      .select()
      .from(educations)
      .where(eq(educations.userId, userId))
      .orderBy(desc(educations.endDate));

    const userSkillRows = await db
      .select({
        skillName: skills.name,
        category: skills.category,
        proficiencyLevel: userSkills.proficiencyLevel
      })
      .from(userSkills)
      .innerJoin(skills, eq(userSkills.skillId, skills.id))
      .where(eq(userSkills.userId, userId));

    const candidateEvidenceRows = await db
      .select()
      .from(candidateEvidence)
      .where(eq(candidateEvidence.userId, userId));

    const repositoryRows = await db
      .select()
      .from(repositories)
      .where(eq(repositories.userId, userId));

    const [activeConfig] = await db
      .select()
      .from(matchingConfigVersions)
      .where(eq(matchingConfigVersions.isActive, true))
      .limit(1);

    const config = activeConfig
      ? {
          version: activeConfig.version,
          weights: activeConfig.weights,
          hybridWeights: DEFAULT_MATCHING_CONFIG.hybridWeights
        }
      : DEFAULT_MATCHING_CONFIG;

    const analysis = computeMatchScore({
      internship,
      internshipSkillsList: internshipSkillRows,
      profile: profile || { bio: '', location: '' },
      educations: educationRows,
      userSkills: userSkillRows,
      candidateEvidenceList: candidateEvidenceRows,
      repositories: repositoryRows,
      config
    });

    const [createdResult] = await db
      .insert(matchResults)
      .values({
        userId,
        internshipId,
        engineVersion: analysis.engineVersion,
        weightsConfig: analysis.weightsConfig,
        overallScore: analysis.overallScore,
        deterministicScore: analysis.deterministicScore,
        semanticScore: analysis.semanticScore,
        eligibilityStatus: analysis.eligibilityStatus,
        eligibilityWarnings: analysis.eligibilityWarnings,
        scoreBreakdown: analysis.scoreBreakdown,
        summaryExplanation: analysis.summaryExplanation
      })
      .returning();

    const evidenceInserts = analysis.matchEvidence.map(item => ({
      matchResultId: createdResult.id,
      skillName: item.skillName,
      matchStatus: item.matchStatus,
      isRequired: item.isRequired,
      evidenceId: item.evidenceId,
      evidenceSnippet: item.evidenceSnippet,
      confidenceScore: item.confidenceScore
    }));

    if (evidenceInserts.length > 0) {
      await db.insert(matchEvidence).values(evidenceInserts);
    }

    const gapInserts = analysis.skillGaps.map(item => ({
      matchResultId: createdResult.id,
      skillName: item.skillName,
      importance: item.importance,
      recommendedAction: item.recommendedAction
    }));

    if (gapInserts.length > 0) {
      await db.insert(skillGaps).values(gapInserts);
    }

    return {
      id: createdResult.id,
      userId,
      internshipId,
      internship: {
        id: internship.id,
        title: internship.title,
        company: internship.company,
        location: internship.location,
        workMode: internship.workMode,
        sourceName: internship.sourceName,
        sourceUrl: internship.sourceUrl,
        verifiedAt: internship.verifiedAt,
        minGpa: internship.minGpa,
        eligibleGraduationYears: internship.eligibleGraduationYears
      },
      engineVersion: createdResult.engineVersion,
      weightsConfig: createdResult.weightsConfig,
      overallScore: createdResult.overallScore,
      deterministicScore: createdResult.deterministicScore,
      semanticScore: createdResult.semanticScore,
      eligibilityStatus: createdResult.eligibilityStatus,
      eligibilityWarnings: createdResult.eligibilityWarnings,
      scoreBreakdown: createdResult.scoreBreakdown,
      summaryExplanation: createdResult.summaryExplanation,
      matchEvidence: analysis.matchEvidence,
      skillGaps: analysis.skillGaps,
      createdAt: createdResult.createdAt
    };
  }

  async getMatchResult(userId, resultId) {
    const [result] = await db
      .select()
      .from(matchResults)
      .where(and(eq(matchResults.id, resultId), eq(matchResults.userId, userId)))
      .limit(1);

    if (!result) {
      throw ApiError.notFound('Match result not found or unauthorized');
    }

    const [internship] = await db
      .select()
      .from(internships)
      .where(eq(internships.id, result.internshipId))
      .limit(1);

    const evidenceItems = await db
      .select()
      .from(matchEvidence)
      .where(eq(matchEvidence.matchResultId, result.id));

    const gaps = await db
      .select()
      .from(skillGaps)
      .where(eq(skillGaps.matchResultId, result.id));

    return {
      ...result,
      internship,
      matchEvidence: evidenceItems,
      skillGaps: gaps
    };
  }

  async listMatchHistory(userId, internshipId = null) {
    const conditions = [eq(matchResults.userId, userId)];
    if (internshipId) {
      conditions.push(eq(matchResults.internshipId, internshipId));
    }

    const rows = await db
      .select({
        id: matchResults.id,
        internshipId: matchResults.internshipId,
        internshipTitle: internships.title,
        internshipCompany: internships.company,
        workMode: internships.workMode,
        location: internships.location,
        engineVersion: matchResults.engineVersion,
        overallScore: matchResults.overallScore,
        deterministicScore: matchResults.deterministicScore,
        semanticScore: matchResults.semanticScore,
        eligibilityStatus: matchResults.eligibilityStatus,
        eligibilityWarnings: matchResults.eligibilityWarnings,
        summaryExplanation: matchResults.summaryExplanation,
        createdAt: matchResults.createdAt
      })
      .from(matchResults)
      .innerJoin(internships, eq(matchResults.internshipId, internships.id))
      .where(and(...conditions))
      .orderBy(desc(matchResults.createdAt));

    return rows;
  }
}

export const matchingService = new MatchingService();

