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

# The standalone bundle already carries a copy of `public`, and the runner
# copies it explicitly as Next's docs prescribe. Dropping the bundled one keeps
# the 60MB of PDFs out of a second image layer — overwriting a file in a later
# layer does not reclaim the space it took in an earlier one.
RUN npm run build && rm -rf .next/standalone/public

# Python deps live in their own stage so the runtime image never carries pip,
# build tooling, or the wheel cache.
FROM node:22-bookworm-slim AS python-deps

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-venv \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN python3 -m venv /opt/venv \
  && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV PATH="/opt/venv/bin:$PATH"

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=python-deps /opt/venv /opt/venv

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/scripts ./scripts

# The pipeline writes its file cache under the working directory.
RUN mkdir -p /app/.cache && chown -R node:node /app/.cache

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
