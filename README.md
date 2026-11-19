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

### Registration email delivery

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` with your mail provider's settings. `SMTP_FROM` must use a sender address permitted by that provider. The example's `localhost` host requires a local SMTP server; replace it to deliver to real inboxes.

For port 587, set `SMTP_SECURE=false` to use STARTTLS. Port 465 uses implicit TLS. Credentials stay in environment variables or untracked `.env` files.

The API loads `.env` from the repository root regardless of its working directory. An `apps/api/.env` file overrides root file values, and explicitly supplied process environment variables take precedence over both files. Restart the API after changing environment files.

Registration advances to verification only after the SMTP server accepts the email. Delivery failures return HTTP 503 with a retry message and roll back the new account so registration can be retried. A failed resend preserves the previous code. Codes expire after 10 minutes and are never logged or included in normal registration responses. SMTP acceptance does not guarantee inbox delivery; check the provider's delivery events and the recipient's spam folder if an accepted email does not arrive.

### GitHub connection

Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` for your GitHub OAuth app. Register the API callback URL from `GITHUB_CALLBACK_URL` in the OAuth app settings. The local callback is `http://localhost:4000/api/v1/github/callback`. Set `CORS_ORIGIN` to the web app origin so the callback can return the user to their profile.

Connect GitHub from the profile and approve access on GitHub. PathForge reads the account profile and syncs up to 30 recently updated public repositories owned by that account.

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
