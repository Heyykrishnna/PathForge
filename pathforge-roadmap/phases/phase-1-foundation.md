# Phase 1: Foundation and Architecture

**Target:** Week 1  
**Outcome:** A reproducible monorepo with a working Next.js frontend, Express API and PostgreSQL connection.

## Scope

- Create a pnpm workspace monorepo.
- Initialize `apps/web` with Next.js App Router and JavaScript/JSX.
- Initialize `apps/api` with Node.js and Express.
- Configure PostgreSQL and Drizzle ORM.
- Add Drizzle schema and migration workflow.
- Add environment configuration and `.env.example`.
- Add API version prefix: `/api/v1`.
- Add centralized error handling, request validation conventions and structured logging.
- Add `GET /api/v1/health` with service and database readiness information.
- Add a small frontend API client and a page that calls the health endpoint.
- Add linting/formatting conventions and root development scripts.

## Suggested backend layout

```text
apps/api/src/
  config/
  db/
    schema/
    migrations/
    index.js
  middleware/
  modules/
  services/
  utils/
  app.js
  server.js
```

## Implementation notes

- Keep route handlers thin; put business logic in services.
- Use a single Drizzle database client per API process.
- Keep secrets in environment variables.
- Configure CORS for the known frontend origin, not `*` with credentials.
- Use separate local, test and production configuration.
- Avoid adding Redis or background workers until a real long-running job requires them.

## Acceptance criteria

- [x] `pnpm install` completes from the repository root.
- [x] One documented command starts the web and API apps locally.
- [x] Next.js renders the PathForge starter page.
- [x] Express starts and exposes `/api/v1/health`.
- [x] Health endpoint confirms database connectivity and returns a non-sensitive response.
- [x] Drizzle can generate and apply a migration against a fresh local database.
- [x] A sample frontend request successfully reaches the API.
- [x] Invalid/missing environment variables fail fast with a clear message.
- [x] CORS, JSON body limits and basic security headers are configured.
- [x] Setup instructions work on a clean checkout.

## Exit gate

Do not begin feature development until a new developer can clone the repository, configure environment variables, migrate the database and run both applications by following the README.
