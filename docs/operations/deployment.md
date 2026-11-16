# Production Deployment Guide

Comprehensive operational guide for deploying PathForge in production environments.

---

## 1. Architecture Overview

- **Frontend**: Next.js App Router container deployed to Node.js / edge platform (or container orchestrator like Cloud Run, ECS, or Docker Compose).
- **Backend**: Express API container with Helmet, CORS, and Zod boundary validation.
- **Database**: Managed PostgreSQL 16 (e.g. AWS RDS, Google Cloud SQL, or Supabase).
- **Storage**: Private encrypted object storage bucket for resume PDFs and candidate evidence.
- **Reverse Proxy / Ingress**: SSL/TLS termination with HTTP/2 and modern cipher suites (Cloudflare, Caddy, or Nginx).

---

## 2. Environment Variables Matrix

### Express API (`apps/api`)

| Variable | Description | Production Example |
|---|---|---|
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | Listening HTTP port | `4000` |
| `API_PREFIX` | Base routing prefix | `/api/v1` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@db.internal:5432/pathforge_prod?sslmode=require` |
| `JWT_ACCESS_SECRET` | 256-bit secret for signing access tokens | `(generate with openssl rand -hex 32)` |
| `JWT_REFRESH_SECRET` | 256-bit secret for signing refresh tokens | `(generate with openssl rand -hex 32)` |
| `COOKIE_SECRET` | 256-bit secret for signing cookies | `(generate with openssl rand -hex 32)` |
| `ENCRYPTION_KEY` | 64-character hex key for AES-256-GCM encryption | `(generate with openssl rand -hex 32)` |
| `CORS_ORIGIN` | Allowed client origin | `https://pathforge.app` |
| `COOKIE_SECURE` | Enforce Secure flag on cookies | `true` |
| `LOG_LEVEL` | Pino logging level | `info` |

### Next.js Frontend (`apps/web`)

| Variable | Description | Production Example |
|---|---|---|
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | Listening HTTP port | `3000` |
| `NEXT_PUBLIC_API_URL` | Public API endpoint URL | `https://api.pathforge.app/api/v1` |
| `NEXT_TELEMETRY_DISABLED` | Disable telemetry | `1` |

---

## 3. Deployment Procedure

### Step 1: Pre-Deployment Migration Check

Run database migrations against the production database as an automated pre-deployment step:

```bash
pnpm --filter @pathforge/api db:migrate
```

### Step 2: Container Image Build

Build immutable production Docker images:

```bash
docker compose -f docker-compose.prod.yml build
```

### Step 3: Service Startup

Start services using Docker Compose or submit images to container registries:

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Step 4: Production Smoke Test

Execute the automated smoke test against the live endpoint:

```bash
API_URL="https://api.pathforge.app/api/v1" ./scripts/production-smoke-test.js
```

---

## 4. Security & Cookie Hardening

1. **HTTPS Only**: TLS 1.3 enforced at reverse proxy with HSTS (`max-age=31536000; includeSubDomains`).
2. **HttpOnly & SameSite**: Refresh token session cookies set with `HttpOnly`, `Secure`, and `SameSite=Lax`.
3. **Restricted CORS**: Origin matching strictly against `CORS_ORIGIN`. Credentials mode enabled (`credentials: 'include'`).
4. **Rate Limiting**: Rate limits active on `/auth/login`, `/auth/register`, `/matching/analyze`, and `/resumes/upload`.
5. **Private Resume Storage**: Resumes stored in restricted local volume or private cloud bucket without public ACLs.

