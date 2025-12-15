FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY prisma.config.ts ./

ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"

RUN npm ci && \
    npm cache clean --force

FROM base AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules

COPY prisma ./prisma
COPY prisma.config.ts ./

ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"

RUN npx prisma generate

FROM builder AS build-continue
WORKDIR /app
COPY . .

ENV NEXTAUTH_SECRET="dummy-secret-for-build-only"
ENV ADMIN_USERNAME="dummy"
ENV ADMIN_PASSWORD="dummy"

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=build-continue --chown=nextjs:nodejs /app/.next/standalone ./

COPY --from=build-continue --chown=nextjs:nodejs /app/public ./public

COPY --from=build-continue --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN mkdir -p ./public/uploads && \
    chown -R nextjs:nodejs ./public

COPY --from=build-continue --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=build-continue --chown=nextjs:nodejs /app/app/generated ./app/generated
COPY --from=build-continue --chown=nextjs:nodejs /app/lib ./lib
COPY --from=build-continue --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

RUN mkdir -p ./node_modules
COPY --from=build-continue --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=build-continue --chown=nextjs:nodejs /app/package-lock.json* ./package-lock.json
# Install Prisma CLI for running migrations
RUN npm install --production --no-save prisma@^7.1.0 && \
    npm cache clean --force && \
    chown -R nextjs:nodejs ./node_modules 2>/dev/null || true
# Copy dotenv from builder stage (more reliable than installing)
# dotenv is needed for prisma.config.ts to load DATABASE_URL from environment
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/dotenv ./node_modules/dotenv

COPY --from=builder --chown=nextjs:nodejs /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/typescript ./node_modules/typescript

COPY --chown=nextjs:nodejs docker/entrypoint.sh ./docker/entrypoint.sh
RUN chmod +x ./docker/entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["node", "server.js"]

