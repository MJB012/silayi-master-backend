# ==========================================================
# Multi-Stage Production Dockerfile for Silayi Master Backend
# Node.js 22 (Alpine Linux)
# ==========================================================

# ----------------------------------------------------------
# Stage 1: Build & Package Preparation
# ----------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy configuration and source files
COPY tsconfig*.json nest-cli.json ./
COPY src/ ./src/

# Compile TypeScript to dist/
RUN npm run build

# Remove development dependencies to keep image lean
RUN npm prune --omit=dev

# ----------------------------------------------------------
# Stage 2: Minimal Production Runtime
# ----------------------------------------------------------
FROM node:22-alpine AS production

WORKDIR /usr/src/app

# Set default production environment variables
ENV NODE_ENV=production
ENV PORT=3003

# Copy production dependencies and compiled artifacts with non-root ownership
COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist

# Run container as non-root standard 'node' user for security
USER node

# Expose backend API port
EXPOSE 3003

# Healthcheck against the dedicated /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3003/health || exit 1

# Start the NestJS application
CMD ["node", "dist/main.js"]
