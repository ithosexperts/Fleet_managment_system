# syntax=docker/dockerfile:1
# Multi-stage production build for TruckTracker

# ==========================================
# Stage 1: Build Frontend and Server
# ==========================================
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./
COPY web/package.json ./web/
COPY server/package.json ./server/
COPY shared/ ./shared/

# Install all workspace dependencies
RUN npm ci

# Copy sources
COPY web/ ./web/
COPY server/ ./server/

# Build web frontend and server TypeScript
RUN npm run build --workspace=web && npm run build --workspace=server

# ==========================================
# Stage 2: Production Server Runner
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package.json package-lock.json ./
COPY server/package.json ./server/

# Install production-only dependencies
RUN npm ci --workspace=server --omit=dev

# Copy compiled backend output & static frontend assets
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/web/dist ./web/dist

# Copy seed photo assets for demonstrations
COPY server/uploads/ ./server/uploads/

# Ensure persistent upload directory exists
RUN mkdir -p /app/server/uploads/photos

EXPOSE 5000

# Volume mount point for uploaded photos
VOLUME ["/app/uploads/photos"]

WORKDIR /app/server
CMD ["node", "dist/index.js"]
