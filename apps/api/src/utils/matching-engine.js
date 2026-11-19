export const DEFAULT_MATCHING_CONFIG = Object.freeze({
  version: 'v1.0.0',
  weights: {
    technicalSkills: 0.35,
    relevantProjects: 0.25,
    experience: 0.15,
    education: 0.10,
    roleSpecific: 0.15
  },
  hybridWeights: {
    deterministic: 0.7,
    semantic: 0.3
  }
});

function tokenize(text) {
  if (!text) return new Set();
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9+#.]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
  return new Set(words);
}

function calculateJaccardSimilarity(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function evaluateEligibility(internship, educations = []) {
  const warnings = [];
  let status = 'eligible';

  if (internship.minGpa) {
    const requiredGpa = Number.parseFloat(internship.minGpa);
    const studentGpa = educations.find(e => e.gpa)?.gpa;
    if (studentGpa) {
      const parsedStudentGpa = Number.parseFloat(studentGpa);
      if (!Number.isNaN(parsedStudentGpa) && parsedStudentGpa < requiredGpa) {
        warnings.push(`Current GPA (${parsedStudentGpa}) is below the preferred minimum of ${requiredGpa}`);
        status = 'warning';
      }
    }
  }

  if (internship.eligibleGraduationYears && Array.isArray(internship.eligibleGraduationYears) && internship.eligibleGraduationYears.length > 0) {
    const latestEducation = educations[0];
    if (latestEducation?.endDate) {
      const gradYear = new Date(latestEducation.endDate).getFullYear();
      if (!internship.eligibleGraduationYears.includes(gradYear)) {
        warnings.push(`Expected graduation year (${gradYear}) is outside the target window [${internship.eligibleGraduationYears.join(', ')}]`);
        status = 'warning';
      }
    }
  }

  return {
    status,
    warnings
  };
}

export function computeMatchScore({
  internship,
  internshipSkillsList = [],
  profile,
  educations = [],
  userSkills = [],
  candidateEvidenceList = [],
  repositories = [],
  config = DEFAULT_MATCHING_CONFIG
}) {
  const eligibility = evaluateEligibility(internship, educations);

  const candidateSkillsMap = new Map();

  for (const s of userSkills) {
    candidateSkillsMap.set(s.skillName.toLowerCase(), {
      source: 'self_reported',
      confidence: 0.75,
      evidenceSnippet: null,
      evidenceId: null
    });
  }

  for (const e of candidateEvidenceList) {
    const existing = candidateSkillsMap.get(e.skillName.toLowerCase());
    if (!existing || e.confidenceScore >= existing.confidence) {
      candidateSkillsMap.set(e.skillName.toLowerCase(), {
        source: e.sourceType,
        confidence: e.confidenceScore,
        evidenceSnippet: e.evidenceContext,
        evidenceId: e.id
      });
    }
  }

  const matchEvidenceItems = [];
  const skillGapsList = [];

  let requiredCount = 0;
  let requiredMatchedCount = 0;
  let preferredCount = 0;
  let preferredMatchedCount = 0;

  for (const reqSkill of internshipSkillsList) {
    const nameLower = reqSkill.name.toLowerCase();
    const candidateEvidenceMatch = candidateSkillsMap.get(nameLower);

    if (reqSkill.isRequired) {
      requiredCount++;
      if (candidateEvidenceMatch) {
        requiredMatchedCount += candidateEvidenceMatch.confidence;
        matchEvidenceItems.push({
          skillName: reqSkill.name,
          matchStatus: 'matched',
          isRequired: true,
          evidenceId: candidateEvidenceMatch.evidenceId,
          evidenceSnippet: candidateEvidenceMatch.evidenceSnippet || `Verified via ${candidateEvidenceMatch.source}`,
          confidenceScore: candidateEvidenceMatch.confidence
        });
      } else {
        matchEvidenceItems.push({
          skillName: reqSkill.name,
          matchStatus: 'missing',
          isRequired: true,
          evidenceId: null,
          evidenceSnippet: null,
          confidenceScore: 0
        });
        skillGapsList.push({
          skillName: reqSkill.name,
          importance: 'critical',
          recommendedAction: `Complete a foundational bridge project or practical tutorial in ${reqSkill.name}`
        });
      }
    } else {
      preferredCount++;
      if (candidateEvidenceMatch) {
        preferredMatchedCount += candidateEvidenceMatch.confidence;
        matchEvidenceItems.push({
          skillName: reqSkill.name,
          matchStatus: 'matched',
          isRequired: false,
          evidenceId: candidateEvidenceMatch.evidenceId,
          evidenceSnippet: candidateEvidenceMatch.evidenceSnippet || `Demonstrated via ${candidateEvidenceMatch.source}`,
          confidenceScore: candidateEvidenceMatch.confidence
        });
      } else {
        skillGapsList.push({
          skillName: reqSkill.name,
          importance: 'preferred',
          recommendedAction: `Familiarize with ${reqSkill.name} to boost candidate competitive standing`
        });
      }
    }
  }

  const technicalScore =
    requiredCount > 0
      ? Math.min(100, Math.round(((requiredMatchedCount / requiredCount) * 80 + (preferredCount > 0 ? (preferredMatchedCount / preferredCount) * 20 : 20))))
      : 85;

  let projectRelevanceScore = 0;
  if (repositories.length > 0) {
    const relevantRepos = repositories.filter(r => {
      const lang = r.primaryLanguage?.toLowerCase();
      return lang && candidateSkillsMap.has(lang);
    });
    projectRelevanceScore = Math.min(100, Math.round(40 + (relevantRepos.length / Math.max(1, repositories.length)) * 60));
  } else if (candidateEvidenceList.some(e => e.sourceType === 'resume')) {
    projectRelevanceScore = 70;
  } else {
    projectRelevanceScore = 30;
  }

  let educationScore = 50;
  if (educations.length > 0) {
    const csField = educations.some(e => /computer|software|engineering|data|science|math/i.test(e.fieldOfStudy));
    educationScore = csField ? 95 : 75;
  }

  let experienceScore = profile.bio && profile.bio.length > 20 ? 75 : 45;

  let roleSpecificScore = 70;
  if (internship.workMode === 'remote') {
    roleSpecificScore = 95;
  } else if (profile.location && internship.location && profile.location.toLowerCase().includes(internship.location.toLowerCase())) {
    roleSpecificScore = 95;
  }

  const scoreBreakdown = {
    technicalSkills: technicalScore,
    relevantProjects: projectRelevanceScore,
    experience: experienceScore,
    education: educationScore,
    roleSpecific: roleSpecificScore
  };

  const deterministicScore = Math.round(
    technicalScore * config.weights.technicalSkills +
    projectRelevanceScore * config.weights.relevantProjects +
    experienceScore * config.weights.experience +
    educationScore * config.weights.education +
    roleSpecificScore * config.weights.roleSpecific
  );

  const candidateText = [
    profile.bio || '',
    ...repositories.map(r => `${r.name} ${r.description || ''} ${r.primaryLanguage || ''}`),
    ...Array.from(candidateSkillsMap.keys())
  ].join(' ');

  const internshipText = `${internship.title} ${internship.company} ${internship.description} ${internshipSkillsList.map(s => s.name).join(' ')}`;

  const candidateTokens = tokenize(candidateText);
  const internshipTokens = tokenize(internshipText);
  const similarityRatio = calculateJaccardSimilarity(candidateTokens, internshipTokens);

  const semanticScore = Math.min(100, Math.round(35 + similarityRatio * 180));

  const overallScore = Math.round(
    (deterministicScore * config.hybridWeights.deterministic +
     semanticScore * config.hybridWeights.semantic) * 10
  ) / 10;

  const matchedSkillsCount = matchEvidenceItems.filter(m => m.matchStatus === 'matched').length;
  const criticalGapsCount = skillGapsList.filter(g => g.importance === 'critical').length;

  let summaryExplanation = `Compatibility score: ${overallScore}%. Matched ${matchedSkillsCount} of ${internshipSkillsList.length} evaluated requirements.`;
  if (criticalGapsCount > 0) {
    summaryExplanation += ` Attention needed on ${criticalGapsCount} critical missing requirement(s).`;
  }
  if (eligibility.warnings.length > 0) {
    summaryExplanation += ` Eligibility notice: ${eligibility.warnings[0]}.`;
  }

  return {
    engineVersion: config.version,
    weightsConfig: config,
    overallScore,
    deterministicScore,
    semanticScore,
    eligibilityStatus: eligibility.status,
    eligibilityWarnings: eligibility.warnings,
    scoreBreakdown,
    summaryExplanation,
    matchEvidence: matchEvidenceItems,
    skillGaps: skillGapsList
  };
}

