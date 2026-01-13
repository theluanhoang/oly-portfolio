# syntax=docker/dockerfile:1.6
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl ca-certificates
WORKDIR /app
FROM base AS deps
ENV NODE_ENV=development
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev --ignore-scripts --prefer-offline --no-audit
FROM deps AS builder
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
ENV NEXTAUTH_SECRET="dummy-secret-for-build-only"
ENV ADMIN_USERNAME="dummy"
ENV ADMIN_PASSWORD="dummy"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN --mount=type=cache,target=/root/.npm \
    npx prisma generate >/dev/null 2>&1
RUN --mount=type=cache,target=/root/.npm \
    npm run build >/dev/null 2>&1
RUN npm prune --omit=dev >/dev/null 2>&1 && \
    find .next/standalone -name "*.map" -delete >/dev/null 2>&1 || true && \
    find .next/standalone -type f -name "*.d.ts" -delete >/dev/null 2>&1 || true && \
    find .next/standalone -type d \( -name "test" -o -name "tests" -o -name "__tests__" -o -name "*.test.js" -o -name "*.spec.js" -o -name ".cache" -o -name "docs" -o -name "examples" \) -exec rm -rf {} + >/dev/null 2>&1 || true && \
    find .next/standalone -type f \( -name "*.test.js" -o -name "*.spec.js" -o -name "*.md" -o -name "CHANGELOG*" -o -name "LICENSE*" -o -name "README*" \) -delete >/dev/null 2>&1 || true && \
    find .next/standalone/node_modules -type d \( -name "test" -o -name "__tests__" -o -name ".cache" -o -name "docs" -o -name "examples" -o -name "*.test.js" -o -name "*.spec.js" \) -exec rm -rf {} + >/dev/null 2>&1 || true && \
    find .next/standalone/node_modules -type f \( -name "*.map" -o -name "*.md" -o -name "*.d.ts" -o -name "CHANGELOG*" -o -name "LICENSE*" -o -name "README*" \) -delete >/dev/null 2>&1 || true && \
    find .next/standalone/node_modules -type f -name "*.ts" ! -path "*/dist/*" ! -path "*/lib/*" ! -path "*/build/*" -delete >/dev/null 2>&1 || true && \
    find .next/standalone/node_modules -type f -name "*.tsx" ! -path "*/dist/*" ! -path "*/lib/*" ! -path "*/build/*" -delete >/dev/null 2>&1 || true
FROM base AS prisma-cli
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY package.json package-lock.json* ./
COPY prisma.config.ts ./
RUN npm pkg delete scripts.postinstall || true
RUN --mount=type=cache,target=/root/.npm \
    npm install --omit=dev --prefer-offline --no-audit --ignore-scripts prisma dotenv
RUN rm -rf /root/.npm || true
RUN find /app/node_modules -type f -name "*.map" -delete >/dev/null 2>&1 || true && \
    find /app/node_modules -type d \( -name "test" -o -name "tests" -o -name "__tests__" -o -name "docs" -o -name "examples" \) -exec rm -rf {} + >/dev/null 2>&1 || true && \
    find /app/node_modules -type f \( -name "*.md" -o -name "CHANGELOG*" -o -name "LICENSE*" -o -name "README*" -o -name "*.txt" \) -delete >/dev/null 2>&1 || true && \
    find /app/node_modules -type f -name "*.ts" ! -path "*/dist/*" ! -path "*/lib/*" ! -path "*/build/*" -delete >/dev/null 2>&1 || true && \
    find /app/node_modules -type f -name "*.tsx" ! -path "*/dist/*" ! -path "*/lib/*" ! -path "*/build/*" -delete >/dev/null 2>&1 || true && \
    find /app/node_modules -type f -name "*.js.map" -delete >/dev/null 2>&1 || true
COPY docker/copy-prisma-deps.sh /app/copy-prisma-deps.sh
RUN chmod +x /app/copy-prisma-deps.sh && \
    mkdir -p /app/prisma-minimal && \
    /app/copy-prisma-deps.sh /app /app/prisma-minimal >/dev/null 2>&1 && \
    find /app/prisma-minimal -type f -name "*.map" -delete >/dev/null 2>&1 || true && \
    find /app/prisma-minimal -type d \( -name "test" -o -name "tests" -o -name "__tests__" -o -name "docs" -o -name "examples" -o -name ".cache" \) -exec rm -rf {} + >/dev/null 2>&1 || true && \
    find /app/prisma-minimal -type f \( -name "*.md" -o -name "CHANGELOG*" -o -name "LICENSE*" -o -name "README*" \) -delete >/dev/null 2>&1 || true && \
    find /app/prisma-minimal -type f -name "*.ts" ! -path "*/dist/*" ! -path "*/lib/*" ! -path "*/build/*" -delete >/dev/null 2>&1 || true && \
    find /app/prisma-minimal -type f -name "*.tsx" ! -path "*/dist/*" ! -path "*/lib/*" ! -path "*/build/*" -delete >/dev/null 2>&1 || true && \
    find /app/prisma-minimal -type f -name "*.d.ts" -delete >/dev/null 2>&1 || true && \
    rm -rf /app/prisma-minimal/node_modules/.cache /app/prisma-minimal/node_modules/.npm >/dev/null 2>&1 || true && \
    find /app/prisma-minimal/node_modules -type d -name ".cache" -exec rm -rf {} + >/dev/null 2>&1 || true && \
    find /app/prisma-minimal/node_modules -type f -name "*.js.map" -delete >/dev/null 2>&1 || true && \
    find /app/prisma-minimal/node_modules -type f \( -name "*.json" ! -name "package.json" -o -name "*.lock" -o -name "*.log" \) -delete >/dev/null 2>&1 || true && \
    chown -R nextjs:nodejs /app/prisma-minimal
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
WORKDIR /app
RUN mkdir -p ./public/uploads && chown -R nextjs:nodejs /app
COPY --from=builder /app/public ./public
RUN rm -rf ./public/uploads/* >/dev/null 2>&1 || true && \
    find ./public -name "*.map" -delete >/dev/null 2>&1 || true && \
    find ./public -type f \( -name "*.svg" ! -path "*/assets/*" -o -name "next.svg" -o -name "vercel.svg" \) -delete >/dev/null 2>&1 || true && \
    chown -R nextjs:nodejs ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN find .next -name "*.map" -delete >/dev/null 2>&1 || true && \
    find .next -type f -name "*.d.ts" -delete >/dev/null 2>&1 || true && \
    find .next -type d -name ".cache" -exec rm -rf {} + >/dev/null 2>&1 || true && \
    find .next/node_modules -type f -name "*.ts" ! -path "*/dist/*" ! -path "*/lib/*" ! -path "*/build/*" -delete >/dev/null 2>&1 || true && \
    find .next/node_modules -type f -name "*.tsx" ! -path "*/dist/*" ! -path "*/lib/*" ! -path "*/build/*" -delete >/dev/null 2>&1 || true && \
    find .next/node_modules -type f \( -name "*.json" ! -name "package.json" -o -name "*.lock" -o -name "*.log" \) -delete >/dev/null 2>&1 || true && \
    chown -R nextjs:nodejs .next
COPY --from=builder /app/prisma ./prisma
RUN chown -R nextjs:nodejs ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
RUN chown nextjs:nodejs ./prisma.config.ts
COPY --from=builder /app/app/generated/prisma ./app/generated/prisma
RUN chown -R nextjs:nodejs ./app/generated
COPY --from=prisma-cli /app/prisma-minimal/.bin ./node_modules/.bin
COPY --from=prisma-cli /app/prisma-minimal/node_modules ./node_modules
COPY --from=builder /app/docker/entrypoint.sh ./docker/entrypoint.sh
RUN chmod +x ./docker/entrypoint.sh && \
    chown nextjs:nodejs ./docker/entrypoint.sh ./server.js 2>/dev/null || true
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["node", "server.js"]
