FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g --ignore-scripts pnpm@10.19.0

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=dependencies /app/apps/web/node_modules ./apps/web/node_modules
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm --filter @pathforge/web build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=dependencies --chown=node:node /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=dependencies --chown=node:node /app/apps/web/node_modules ./apps/web/node_modules
COPY --chown=node:node package.json pnpm-workspace.yaml ./
COPY --chown=node:node packages/shared ./packages/shared
COPY --chown=node:node apps/web/package.json ./apps/web/package.json
COPY --chown=node:node apps/web/next.config.js ./apps/web/next.config.js
COPY --chown=node:node apps/web/public ./apps/web/public
COPY --from=builder --chown=node:node /app/apps/web/.next ./apps/web/.next

USER node

EXPOSE 3000
CMD ["pnpm", "--filter", "@pathforge/web", "start"]

