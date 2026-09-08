# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS deps

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* 是构建时内联的，不是运行时读取的。不在这里声明 ARG，Railway 里
# 设了变量也传不进 npm run build —— 部署照样成功，但 sitemap / robots / og 链接
# 会静悄悄地留着相对路径。换域名时记得这里要重新构建，改变量重启是不够的。
ARG NEXT_PUBLIC_SITE_URL=""
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# The standalone bundle already carries a copy of `public`, and the runner
# copies it explicitly as Next's docs prescribe. Dropping the bundled one keeps
# the PDFs out of a second image layer — overwriting a file in a later layer
# does not reclaim the space it took in an earlier one.
RUN npm run build && rm -rf .next/standalone/public

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# The pipeline writes its file cache under the working directory.
RUN mkdir -p /app/.cache && chown -R node:node /app/.cache

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
