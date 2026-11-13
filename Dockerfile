# Forge: the server, console, CLI and migrations in one image.
# Build:  docker build -t forge .
# Run:    see docker/compose.yml (Forge + PostgreSQL).

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build && npm prune --omit=dev --no-audit --no-fund

FROM node:22-bookworm-slim
# git: every run works in its own worktree. python3: agents often generate documents with it.
RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates python3 \
  && rm -rf /var/lib/apt/lists/* \
  && git config --system user.name "Forge" \
  && git config --system user.email "forge@localhost" \
  && git config --system --add safe.directory '*'
ENV NODE_ENV=production \
    PORT=3000 \
    FORGE_HOST=0.0.0.0 \
    FORGE_PROJECTS_DIR=/data/projects \
    FORGE_KEEP_AWAKE=0
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json LICENSE README.md .env.example ./
COPY bin ./bin
COPY brands ./brands
COPY drizzle ./drizzle
COPY public ./public
COPY src ./src
RUN mkdir -p /data/projects /app/workspaces && chown -R node:node /data /app/workspaces
USER node
VOLUME ["/data", "/app/workspaces"]
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Apply pending migrations, then start.
CMD ["sh", "-c", "node dist/infrastructure/database/migrate.js && exec node dist/main.js"]
