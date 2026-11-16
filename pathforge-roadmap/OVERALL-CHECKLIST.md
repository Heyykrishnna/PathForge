# PathForge Overall Project Checklist

Use this as the single project-level completion tracker. Phase-specific acceptance criteria remain in each `phases/*.md` file.

## Project foundation

- [x] Monorepo and workspace scripts established
- [x] Next.js frontend runs locally
- [x] Express API runs locally
- [x] PostgreSQL connection and Drizzle migrations work
- [x] Environment variables documented
- [x] Shared API conventions documented
- [x] CI checks run on pull requests

## Authentication and user data

- [x] Registration and login
- [x] Email verification
- [x] Secure password hashing
- [x] Refresh session rotation and revocation
- [x] Password reset
- [x] Protected routes and ownership enforcement
- [x] Student profile and education CRUD
- [x] Normalized skill catalogue and user skills

## Candidate intelligence

- [x] Private resume upload
- [x] Resume text extraction
- [x] Structured resume parsing
- [x] User review and correction of extracted data
- [x] GitHub OAuth connection
- [x] Repository synchronization
- [x] Evidence source and freshness metadata
- [x] Disconnect and data deletion behavior

## Internship and matching

- [x] Internship catalogue and source attribution
- [x] Required vs preferred requirements
- [x] Internship search, filters and pagination
- [x] Deterministic matching component
- [x] Semantic relevance component
- [x] Versioned scoring configuration
- [x] Separate hard eligibility checks
- [x] Explainable score breakdown
- [x] Matched, missing and partially evidenced skills
- [x] Traceable match history

## Preparation

- [x] Prioritized skill gap diagnostics
- [x] Bridge project recommendations
- [x] Seven-day roadmap generation
- [x] Editable roadmap tasks
- [x] Persisted task completion
- [x] Accurate progress calculation

## Application workflow

- [x] Save internships
- [x] Create and update applications
- [x] Application status workflow
- [x] Notes, dates and deadlines
- [x] Application activity history
- [x] Dashboard aggregates and next actions

## Frontend and synchronization

- [x] TanStack Query configured
- [x] API client handles credentials and errors consistently
- [x] Query keys and invalidation conventions documented
- [x] Loading, empty, success and error states implemented
- [x] Server state is not duplicated unnecessarily in Zustand
- [x] User-specific data is cleared on logout/account switch
- [x] Forms validate client-side and server-side

## Quality, security and deployment

- [x] Unit tests
- [x] API integration tests
- [x] Critical frontend tests
- [x] End-to-end smoke test
- [x] Zod validation on API boundaries
- [x] Rate limiting and secure headers
- [x] CORS and cookie configuration reviewed
- [x] File upload safeguards
- [x] OAuth state validation
- [x] Structured logs and error monitoring
- [x] Database backup and restore procedure
- [x] Production migrations tested
- [x] Frontend and backend deployed
- [x] Production smoke test passed
- [x] Known limitations documented

## MVP release gate

- [x] A new student can register and verify their email.
- [x] The student can complete and edit their profile.
- [x] The student can upload a resume and connect GitHub.
- [x] The student can review extracted candidate evidence.
- [x] The student can view internships and run a compatibility analysis.
- [x] The result explains matched skills, gaps and eligibility warnings.
- [x] The student can generate and complete a seven-day roadmap.
- [x] The student can track an internship application.
- [x] All private data is protected by server-side ownership checks.
- [x] Critical flows pass tests in a production-like environment.

## Deferred until after MVP validation

- [ ] Multi-agent career assistant
- [ ] Automated applications
- [ ] Broad job-board scraping
- [ ] Microservices
- [ ] Kubernetes and Kafka
- [ ] Advanced predictive analytics
- [ ] Real-time collaboration and notifications
- [ ] Advanced vector search infrastructure
