# Phase 7: Testing, Security and Deployment

**Target:** Week 6  
**Outcome:** A tested, observable and deployable MVP with documented operational procedures.

## Scope

### Testing

- Unit tests for services and deterministic scoring.
- API integration tests with Supertest.
- Frontend component and critical-flow tests.
- Database migration tests against a clean test database.
- End-to-end smoke test for registration through application tracking.
- Test failure paths, empty data and permission boundaries.

### Security

- Validate all request bodies, params and query strings with Zod.
- Enforce authentication and resource ownership on every private endpoint.
- Rate-limit authentication and expensive analysis endpoints.
- Set secure headers and strict CORS.
- Restrict upload size/type and keep files private.
- Protect OAuth flows with state validation.
- Keep secrets out of logs and API responses.
- Use parameterized ORM queries and review raw SQL.
- Define data deletion and token revocation behavior.
- Review dependency vulnerabilities.

### Reliability and operations

- Structured logs with request IDs.
- Health and readiness endpoints.
- Error monitoring.
- Database backup and restore procedure.
- Background job retry and failure handling if BullMQ is used.
- API timeout and third-party provider failure handling.
- Basic performance testing for key endpoints.

### Deployment

- Deploy Next.js frontend.
- Deploy Express API.
- Provision managed PostgreSQL.
- Configure production environment variables.
- Configure HTTPS, cookies, CORS and frontend API URL.
- Run Drizzle migrations as a controlled deployment step.
- Configure private object storage for resumes.
- Run production smoke tests.

## Acceptance criteria

- [x] Critical user journeys pass automated tests.
- [x] Matching score calculations have deterministic test fixtures.
- [x] All private resources enforce ownership checks.
- [x] Authentication, upload and analysis endpoints have appropriate rate limits.
- [x] Production cookies use secure settings.
- [x] No secrets are committed or exposed in logs.
- [x] Database backup and restore are documented and tested.
- [x] Migrations can be applied to a clean production-like database.
- [x] Frontend and API are deployed with correct environment configuration.
- [x] Production health checks pass.
- [x] Registration, profile setup, analysis, roadmap and application smoke test passes.
- [x] Known limitations and deferred features are documented.

## Exit gate

The MVP is ready for a small controlled student pilot only after security, data ownership, backup and end-to-end smoke-test criteria pass.
