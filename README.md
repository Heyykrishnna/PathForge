# PathForge

PathForge is an evidence-based internship decision and career intelligence platform for students.

## Architecture & Monorepo Layout

The repository is structured as a pnpm workspace monorepo:

```text
pathforge/
  apps/
    web/                 # Next.js App Router (React, JavaScript/JSX, Tailwind CSS)
    api/                 # Express REST API (Node.js, Drizzle ORM, PostgreSQL)
  packages/
    shared/              # Shared constants, Zod validation schemas, API contracts
  pathforge-roadmap/     # Phase-by-phase specifications and checklists
  docker-compose.yml     # Local PostgreSQL service
  pnpm-workspace.yaml
  package.json
```

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker & Docker Compose (optional, for local PostgreSQL) or a local PostgreSQL instance

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Copy the example environment file for the project:

```bash
cp .env.example .env
```

Ensure the values in `.env` match your local development environment:

```env
NODE_ENV=development
PORT=4000
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/pathforge_dev
LOG_LEVEL=info
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### 3. Start PostgreSQL Database

Using Docker:

```bash
docker compose up -d
```

Or connect to an existing PostgreSQL database matching `DATABASE_URL`.

### 4. Run Database Migrations

Generate and apply Drizzle migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

### 5. Start Development Servers

Run both the Next.js frontend and the Express backend concurrently:

```bash
pnpm dev
```

- Web application: [http://localhost:3000](http://localhost:3000)
- API health check: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)

## Available Scripts

| Command            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `pnpm dev`         | Starts web and API applications concurrently     |
| `pnpm dev:api`     | Starts the Express API server with file watching |
| `pnpm dev:web`     | Starts the Next.js frontend development server   |
| `pnpm build`       | Builds all packages and applications             |
| `pnpm test`        | Runs all unit and integration tests              |
| `pnpm lint`        | Runs linters across all packages                 |
| `pnpm db:generate` | Generates new Drizzle SQL migrations from schema |
| `pnpm db:migrate`  | Applies pending Drizzle migrations to database   |
| `pnpm db:push`     | Pushes Drizzle schema directly to database       |
| `pnpm db:studio`   | Opens Drizzle Studio database viewer             |

## API Conventions

All API endpoints follow a standardized response envelope:

### Success Response

```json
{
  "data": { ... },
  "meta": { ... }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be validated.",
    "details": [
      {
        "field": "email",
        "message": "Invalid email address"
      }
    ]
  }
}
```

## Security & Reliability Standards

- Centralized error handling: database errors, credentials, and internal stack traces are never exposed to clients.
- Environment variables: validated at startup using Zod schemas; fails fast with clear diagnostic messages on invalid configuration.
- Security headers: Helmet enabled by default.
- CORS: restricted to configured frontend origin with credentials enabled.
- Payload limits: JSON body parsing capped at 100kb to mitigate payload denial-of-service.
