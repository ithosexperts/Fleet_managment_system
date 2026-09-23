# Production Deployment Specification (Render All-in-One)

## 1. Overview
TruckTracker is deployed on [Render](https://render.com) as a unified All-in-One web service running both the Express API and the Vite-compiled React SPA.

- **Primary Deployed URL**: `https://truck-tracker-api-9yhq.onrender.com/`
- **Render Service Name**: `truck-tracker-api`
- **Current Active Branch**: `main`

---

## 2. Render Blueprint (`render.yaml`)

```yaml
services:
  - type: web
    name: truck-tracker-api
    runtime: node
    plan: free
    buildCommand: npm ci --include=dev && npm run build:all
    startCommand: npm run start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_VERSION
        value: 22.12.0
      - key: NODE_OPTIONS
        value: "10"
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: JWT_SECRET
        generateValue: true
```

---

## 3. Build & Run Pipeline
1. **`buildCommand: npm ci --include=dev && npm run build:all`**:
   - `npm ci --include=dev`: Clean installs pinned dependencies including build-time toolchains (`tsc`, `vite`).
   - `npm run build:all`: Concurrently compiles:
     - `web/src` → `web/dist` (Static production bundle)
     - `server/src` → `server/dist` (Node TypeScript bundle)
2. **`startCommand: npm run start`**:
  - Invokes `node dist/index.js` with `DATABASE_URL` configured by the service.
   - Express binds to `process.env.PORT` (defaults to `10000` on Render)
   - Statically serves `web/dist` on all non-API paths with SPA fallback to `index.html`
3. **`healthCheckPath: /api/health`**:
   - Render pings `GET /api/health` upon startup.
   - Endpoint responds with `200 OK` (`{"status": "healthy", ...}`), confirming runtime readiness.

---

## 4. Ephemeral Disk Awareness & Auto-Initialization
On Render's Free tier, the filesystem is non-persistent across restarts:
- When a free instance restarts or wakes from sleep, `initDatabase()` executes automatically.
- The migration runner [`server/src/migrations/runner.ts`](file:///u:/tracktracker/server/src/migrations/runner.ts) initializes the 16 tables and seeds initial data, ensuring the application is always operational.
- For high-volume multi-node deployments, mount a Render Persistent Disk (`plan: starter`) or connect to an external PostgreSQL instance.
