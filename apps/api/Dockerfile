FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g --ignore-scripts pnpm@10.19.0

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --prod=false

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=dependencies --chown=node:node /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=dependencies --chown=node:node /app/apps/api/node_modules ./apps/api/node_modules
COPY --chown=node:node package.json pnpm-workspace.yaml ./
COPY --chown=node:node packages/shared ./packages/shared
COPY --chown=node:node apps/api ./apps/api

USER node

EXPOSE 4000
CMD ["node", "apps/api/src/server.js"]

