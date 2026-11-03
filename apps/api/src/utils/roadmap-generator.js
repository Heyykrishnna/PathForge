export const ROADMAP_VERSION = 'v1.0.0';

export function generateSevenDayRoadmapPlan({
  internship,
  skillGaps = [],
  bridgeProject = null
}) {
  const primaryGap = skillGaps[0]?.skillName || 'Core Framework';
  const secondaryGap = skillGaps[1]?.skillName || skillGaps[0]?.skillName || 'Testing & Reliability';

  const projectName = bridgeProject?.title || `${primaryGap} Application Bridge`;
  const stackSummary = bridgeProject?.suggestedStack?.join(', ') || `${primaryGap}, Git, Node.js`;

  const tasks = [
    {
      dayNumber: 1,
      orderIndex: 0,
      title: `Environment Setup & ${primaryGap} Fundamentals`,
      description: `Review core documentation for ${primaryGap}. Set up a clean development workspace, configure linters, and initialize version control with Git.`,
      estimatedHours: 2.0,
      expectedOutput: `Git repository initialized with clean project skeleton and verified ${primaryGap} tooling.`,
      skillGap: primaryGap
    },
    {
      dayNumber: 2,
      orderIndex: 0,
      title: `Core Architectural Modeling for ${internship.company}`,
      description: `Design minimal data structures and architecture mimicking ${internship.company}'s engineering needs. Implement foundational models and API schemas.`,
      estimatedHours: 2.5,
      expectedOutput: 'Documented architecture blueprint and initial working code modules.',
      skillGap: primaryGap
    },
    {
      dayNumber: 3,
      orderIndex: 0,
      title: `Implement Practical Bridge Feature in ${primaryGap}`,
      description: `Build the central feature demonstrating mastery of ${primaryGap}. Focus on idiomatic patterns, robust validation, and clean interface boundaries.`,
      estimatedHours: 3.0,
      expectedOutput: `Working feature implementation solving a practical problem in ${projectName}.`,
      skillGap: primaryGap
    },
    {
      dayNumber: 4,
      orderIndex: 0,
      title: `Tackle ${secondaryGap} & Real-World Edge Cases`,
      description: `Integrate ${secondaryGap} into the project. Handle network timeouts, boundary edge cases, input sanitization, and structured logging.`,
      estimatedHours: 2.5,
      expectedOutput: `Resilient error handling and integration of ${secondaryGap} with zero unhandled exceptions.`,
      skillGap: secondaryGap
    },
    {
      dayNumber: 5,
      orderIndex: 0,
      title: 'Automated Testing & Code Quality Hardening',
      description: 'Write comprehensive unit and integration tests covering happy paths and failure scenarios. Achieve healthy test coverage with reproducible scripts.',
      estimatedHours: 2.5,
      expectedOutput: 'Passing automated test suite with documented test execution commands.',
      skillGap: secondaryGap
    },
    {
      dayNumber: 6,
      orderIndex: 0,
      title: 'Packaging, CI/CD Workflow & Public Artifact',
      description: `Containerize the application or configure automated GitHub Actions CI. Write a production-grade README explaining architecture decisions for ${internship.title}.`,
      estimatedHours: 2.5,
      expectedOutput: 'Live deployment or reproducible CI pipeline with polished GitHub README documentation.',
      skillGap: primaryGap
    },
    {
      dayNumber: 7,
      orderIndex: 0,
      title: 'Portfolio Evidence Sync & Behavioral Readiness',
      description: `Upload updated resume with ${projectName} proof points, confirm candidate evidence in PathForge, and prepare 3 STAR interview talking points for ${internship.company}.`,
      estimatedHours: 2.0,
      expectedOutput: 'Updated candidate profile evidence and documented STAR behavioral stories ready for recruiter outreach.',
      skillGap: 'Portfolio Proof'
    }
  ];

  return {
    version: ROADMAP_VERSION,
    title: `7-Day Readiness Roadmap for ${internship.title} at ${internship.company}`,
    targetRole: internship.title,
    targetCompany: internship.company,
    generationInputs: {
      internshipId: internship.id,
      primaryGap,
      secondaryGap,
      suggestedBridgeProject: bridgeProject ? bridgeProject.title : null,
      suggestedStack: stackSummary
    },
    tasks
  };
}

