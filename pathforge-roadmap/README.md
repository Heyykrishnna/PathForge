# PathForge Development Roadmap

A practical six-week MVP roadmap for PathForge, an internship decision and career intelligence platform.

## Stack
- Frontend: Next.js App Router, React, JavaScript/JSX, Tailwind CSS
- Client data: TanStack Query; Zustand only for lightweight client-only state
- Backend: Node.js, Express.js, REST API
- Database: PostgreSQL, Drizzle ORM and Drizzle migrations
- Validation: Zod
- Authentication: Argon2 password hashing, short-lived access tokens, rotating refresh sessions in secure HttpOnly cookies
- Integrations: GitHub OAuth/API, resume parsing, LLM/embedding provider
- Background work: BullMQ + Redis when long-running analysis is introduced
- Testing: Vitest and Supertest

## Suggested implementation order
1. Phase 1: Foundation and architecture
2. Phase 2: Authentication and student profiles
3. Phase 3: Resume and GitHub intelligence
4. Phase 4: Internship intelligence and matching
5. Phase 5: Preparation roadmaps and bridge projects
6. Phase 6: Application tracking and dashboard
7. Phase 7: Testing, security and deployment

The six-week schedule is an estimate, not a commitment. Adjust it to team size, integration access and the quality bar.

## Repository layout

```text
pathforge/
  apps/
    web/                 # Next.js frontend
    api/                 # Express backend
  packages/
    shared/              # Shared validation schemas and constants
  docs/
  README.md
  pnpm-workspace.yaml
  package.json
```

Keep the application as a modular monolith for the MVP. PostgreSQL is the source of truth. The frontend communicates with the backend through versioned REST APIs. Do not add microservices or distributed infrastructure until measured needs justify them.

## Definition of done (applies to every phase)
- Feature works end-to-end in a clean local environment.
- Validation and authorization are enforced on the server.
- Loading, empty, success and error states exist in the UI where relevant.
- Automated tests cover important happy paths and failure paths.
- Database changes are represented by reviewed Drizzle migrations.
- No secrets are committed; `.env.example` documents required variables.
- README or relevant docs explain setup and operation.
- Acceptance criteria in the phase file are checked before marking the phase complete.

## Key product principles
- Explain match scores; never present an unexplained number as career truth.
- Separate hard eligibility checks from compatibility scoring.
- Treat resume and GitHub analysis as evidence, not definitive measures of ability.
- Let users review and correct extracted profile information.
- Show data freshness and source for internship information.
- Never claim a user is application-ready solely because an AI model says so.
