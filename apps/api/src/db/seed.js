import { eq } from 'drizzle-orm';
import { db } from './index.js';
import {
  skills,
  internships,
  internshipSkills,
  matchingConfigVersions,
  bridgeProjects
} from './schema/index.js';
import { DEFAULT_MATCHING_CONFIG } from '../utils/matching-engine.js';
import { logger } from '../utils/logger.js';

const CURATED_SKILLS = [
  { name: 'JavaScript', category: 'language' },
  { name: 'TypeScript', category: 'language' },
  { name: 'Python', category: 'language' },
  { name: 'React', category: 'framework' },
  { name: 'Next.js', category: 'framework' },
  { name: 'Node.js', category: 'backend' },
  { name: 'Express', category: 'backend' },
  { name: 'PostgreSQL', category: 'database' },
  { name: 'Docker', category: 'devops' },
  { name: 'Git', category: 'tool' },
  { name: 'Tailwind CSS', category: 'frontend' },
  { name: 'GraphQL', category: 'api' },
  { name: 'Redis', category: 'database' },
  { name: 'AWS', category: 'cloud' },
  { name: 'Linux', category: 'os' },
  { name: 'PyTorch', category: 'ml' },
  { name: 'Go', category: 'language' },
  { name: 'Rust', category: 'language' }
];

const CURATED_INTERNSHIPS = [
  {
    title: 'Frontend Engineering Intern',
    company: 'Vercel',
    location: 'Remote, US',
    workMode: 'remote',
    description: 'Join our Frontend Infrastructure team to build fast, delightful web developer workflows. You will craft reusable components in React and Next.js, optimize client rendering performance, and integrate robust TypeScript interfaces.',
    sourceUrl: 'https://vercel.com/careers',
    sourceName: 'Curated Direct',
    verifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    minGpa: '3.0',
    eligibleGraduationYears: [2025, 2026, 2027],
    requiresWorkAuth: false,
    skills: [
      { name: 'React', isRequired: true, importance: 3 },
      { name: 'TypeScript', isRequired: true, importance: 3 },
      { name: 'Next.js', isRequired: true, importance: 2 },
      { name: 'Tailwind CSS', isRequired: false, importance: 1 },
      { name: 'Git', isRequired: false, importance: 1 }
    ]
  },
  {
    title: 'Backend Systems Intern',
    company: 'Stripe',
    location: 'San Francisco, CA',
    workMode: 'hybrid',
    description: 'Work with Stripe financial infrastructure engineers on mission-critical payments APIs, distributed message queues, and high-concurrency transaction processing. You will design scalable database schemas and write resilient Node.js services.',
    sourceUrl: 'https://stripe.com/jobs',
    sourceName: 'Curated Direct',
    verifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    minGpa: '3.3',
    eligibleGraduationYears: [2025, 2026],
    requiresWorkAuth: true,
    skills: [
      { name: 'Node.js', isRequired: true, importance: 3 },
      { name: 'PostgreSQL', isRequired: true, importance: 3 },
      { name: 'Docker', isRequired: true, importance: 2 },
      { name: 'Redis', isRequired: false, importance: 1 },
      { name: 'TypeScript', isRequired: false, importance: 2 }
    ]
  },
  {
    title: 'Cloud Infrastructure & Observability Intern',
    company: 'Datadog',
    location: 'New York, NY',
    workMode: 'hybrid',
    description: 'Build observability tooling, real-time metric processing pipelines, and container telemetry collectors. You will collaborate on core ingestion platforms handling millions of events per second with high reliability.',
    sourceUrl: 'https://www.datadoghq.com/careers',
    sourceName: 'Curated Direct',
    verifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    minGpa: '3.0',
    eligibleGraduationYears: [2025, 2026, 2027],
    requiresWorkAuth: true,
    skills: [
      { name: 'Python', isRequired: true, importance: 3 },
      { name: 'Docker', isRequired: true, importance: 3 },
      { name: 'Linux', isRequired: true, importance: 2 },
      { name: 'AWS', isRequired: false, importance: 2 },
      { name: 'Git', isRequired: false, importance: 1 }
    ]
  },
  {
    title: 'Full Stack Engineering Intern',
    company: 'Linear',
    location: 'San Francisco, CA',
    workMode: 'remote',
    description: 'Help engineer the next generation of issue tracking and project intelligence. You will write synchronized offline-first web apps, optimize reactive state stores, and develop performant Node.js and PostgreSQL endpoints.',
    sourceUrl: 'https://linear.app/careers',
    sourceName: 'Curated Direct',
    verifiedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    minGpa: null,
    eligibleGraduationYears: [2025, 2026, 2027, 2028],
    requiresWorkAuth: false,
    skills: [
      { name: 'TypeScript', isRequired: true, importance: 3 },
      { name: 'React', isRequired: true, importance: 3 },
      { name: 'Node.js', isRequired: true, importance: 2 },
      { name: 'PostgreSQL', isRequired: false, importance: 2 },
      { name: 'GraphQL', isRequired: false, importance: 1 }
    ]
  },
  {
    title: 'AI Platform Engineering Intern',
    company: 'Scale AI',
    location: 'San Francisco, CA',
    workMode: 'in-person',
    description: 'Develop data curation pipelines and foundation model fine-tuning harnesses. You will implement distributed data evaluation workflows, integrate vector indices, and validate benchmark outputs.',
    sourceUrl: 'https://scale.com/careers',
    sourceName: 'Curated Direct',
    verifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    minGpa: '3.5',
    eligibleGraduationYears: [2025, 2026],
    requiresWorkAuth: true,
    skills: [
      { name: 'Python', isRequired: true, importance: 3 },
      { name: 'PyTorch', isRequired: true, importance: 3 },
      { name: 'Docker', isRequired: false, importance: 2 },
      { name: 'Git', isRequired: false, importance: 1 }
    ]
  },
  {
    title: 'Systems & Network Engineering Intern',
    company: 'Cloudflare',
    location: 'Austin, TX',
    workMode: 'in-person',
    description: 'Work alongside edge networking teams protecting and accelerating internet traffic. You will explore low-latency proxies, protocol parsing, and packet filtering services deployed globally.',
    sourceUrl: 'https://cloudflare.com/careers',
    sourceName: 'Curated Direct',
    verifiedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    minGpa: '3.2',
    eligibleGraduationYears: [2025, 2026, 2027],
    requiresWorkAuth: true,
    skills: [
      { name: 'Go', isRequired: true, importance: 3 },
      { name: 'Linux', isRequired: true, importance: 3 },
      { name: 'Git', isRequired: true, importance: 2 },
      { name: 'Docker', isRequired: false, importance: 1 },
      { name: 'Rust', isRequired: false, importance: 1 }
    ]
  }
];

const CURATED_BRIDGE_PROJECTS = [
  {
    title: 'Containerized Microservice & Multi-Stage CI Pipeline',
    description: 'Build a containerized microservice with Docker, multi-stage minimal build images, health probes, and Docker Compose orchestration.',
    targetSkill: 'Docker',
    difficulty: 'intermediate',
    estimatedHours: 5.0,
    suggestedStack: ['Docker', 'Linux', 'Node.js'],
    deliverables: ['Dockerfile', 'docker-compose.yml', 'GitHub Actions workflow'],
    completionCriteria: 'Microservice builds in under 60 seconds with reproducible multi-stage Docker layer caching.'
  },
  {
    title: 'High-Concurrency Redis Caching & Rate Limiter',
    description: 'Implement a distributed token-bucket rate limiter and key-value cache layer with Redis pub/sub eviction invalidation.',
    targetSkill: 'Redis',
    difficulty: 'intermediate',
    estimatedHours: 4.5,
    suggestedStack: ['Redis', 'Node.js', 'Express'],
    deliverables: ['Rate limiter middleware', 'Cache invalidation strategy', 'Benchmark test script'],
    completionCriteria: 'Handles 10,000 req/sec benchmark with sub-2ms response latency and verified cache hits.'
  },
  {
    title: 'Relational Database Schema & Migrations Engine',
    description: 'Design a normalized PostgreSQL schema with composite indexes, foreign key constraints, and reproducible migration runner.',
    targetSkill: 'PostgreSQL',
    difficulty: 'intermediate',
    estimatedHours: 5.5,
    suggestedStack: ['PostgreSQL', 'SQL', 'Drizzle ORM'],
    deliverables: ['Normalized DDL migrations', 'Seed scripts', 'Query explain plan analysis'],
    completionCriteria: 'All queries execute under 10ms with zero unindexed table scans on 50,000 seed records.'
  },
  {
    title: 'Modern Full-Stack React & Next.js Server Components',
    description: 'Develop a responsive web application leveraging React 19, Next.js App Router, Tailwind CSS, and optimistic mutations.',
    targetSkill: 'Next.js',
    difficulty: 'intermediate',
    estimatedHours: 6.0,
    suggestedStack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
    deliverables: ['Interactive dashboard', 'Server actions', 'Lighthouse 95+ report'],
    completionCriteria: 'Passes Lighthouse performance criteria with 0 layout shift and typed server state synchronization.'
  },
  {
    title: 'Concurrent HTTP Reverse Proxy & Circuit Breaker',
    description: 'Build a low-latency reverse proxy in Go with connection pooling, health checks, and circuit-breaking failure recovery.',
    targetSkill: 'Go',
    difficulty: 'advanced',
    estimatedHours: 7.0,
    suggestedStack: ['Go', 'Linux', 'HTTP'],
    deliverables: ['Reverse proxy binary', 'Circuit breaker module', 'Concurrency stress test suite'],
    completionCriteria: 'Successfully handles 5,000 concurrent socket connections with zero race conditions in go test -race.'
  },
  {
    title: 'Deep Learning Vision Classifier & Evaluation Harness',
    description: 'Train and fine-tune a convolutional neural network with PyTorch, automated checkpointing, and evaluation metric reporting.',
    targetSkill: 'PyTorch',
    difficulty: 'advanced',
    estimatedHours: 6.5,
    suggestedStack: ['Python', 'PyTorch', 'Torchvision'],
    deliverables: ['Training pipeline script', 'Trained model weights', 'Confusion matrix visualizer'],
    completionCriteria: 'Achieves >88% top-1 validation accuracy on test split with documented loss curves.'
  }
];

export async function seedDatabase() {
  logger.info('Starting database seeding...');

  const skillMap = new Map();
  for (const s of CURATED_SKILLS) {
    const [existing] = await db
      .select()
      .from(skills)
      .where(eq(skills.name, s.name))
      .limit(1);

    if (existing) {
      skillMap.set(s.name, existing.id);
    } else {
      const [inserted] = await db
        .insert(skills)
        .values({ name: s.name, category: s.category })
        .returning();
      skillMap.set(s.name, inserted.id);
    }
  }

  const [existingConfig] = await db
    .select()
    .from(matchingConfigVersions)
    .where(eq(matchingConfigVersions.version, DEFAULT_MATCHING_CONFIG.version))
    .limit(1);

  if (!existingConfig) {
    await db.insert(matchingConfigVersions).values({
      version: DEFAULT_MATCHING_CONFIG.version,
      weights: DEFAULT_MATCHING_CONFIG.weights,
      description: 'Default hybrid matching engine configuration v1.0.0',
      isActive: true
    });
  }

  for (const item of CURATED_INTERNSHIPS) {
    const [existing] = await db
      .select()
      .from(internships)
      .where(eq(internships.title, item.title))
      .limit(1);

    let internshipId;
    if (existing) {
      internshipId = existing.id;
    } else {
      const [created] = await db
        .insert(internships)
        .values({
          title: item.title,
          company: item.company,
          location: item.location,
          workMode: item.workMode,
          description: item.description,
          sourceUrl: item.sourceUrl,
          sourceName: item.sourceName,
          verifiedAt: item.verifiedAt,
          minGpa: item.minGpa,
          eligibleGraduationYears: item.eligibleGraduationYears,
          requiresWorkAuth: item.requiresWorkAuth
        })
        .returning();
      internshipId = created.id;
    }

    for (const skillReq of item.skills) {
      const skillId = skillMap.get(skillReq.name);
      if (!skillId) continue;

      const [existingSkillLink] = await db
        .select()
        .from(internshipSkills)
        .where(
          eq(internshipSkills.internshipId, internshipId)
        )
        .limit(10);

      const alreadyLinked = existingSkillLink && (await db
        .select()
        .from(internshipSkills)
        .where(
          eq(internshipSkills.internshipId, internshipId)
        )).some(link => link.skillId === skillId);

      if (!alreadyLinked) {
        await db.insert(internshipSkills).values({
          internshipId,
          skillId,
          isRequired: skillReq.isRequired,
          importance: skillReq.importance
        });
      }
    }
  }

  for (const bp of CURATED_BRIDGE_PROJECTS) {
    const [existingBp] = await db
      .select()
      .from(bridgeProjects)
      .where(eq(bridgeProjects.title, bp.title))
      .limit(1);

    if (!existingBp) {
      await db.insert(bridgeProjects).values({
        title: bp.title,
        description: bp.description,
        targetSkill: bp.targetSkill,
        difficulty: bp.difficulty,
        estimatedHours: bp.estimatedHours,
        suggestedStack: bp.suggestedStack,
        deliverables: bp.deliverables,
        completionCriteria: bp.completionCriteria
      });
    }
  }

  logger.info('Database seeding completed successfully');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(error => {
      logger.error({ error }, 'Database seeding failed');
      process.exit(1);
    });
}

