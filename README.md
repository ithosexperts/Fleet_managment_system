<p align="center">
  <img src="assets/hosexperts-logo.png" alt="HoseXperts — working with the flow" width="420" />
</p>

# 🚛 TruckTracker 2.0 — Enterprise Fleet Operations & Dispatch Logistics

> **Production-grade logistics management platform for HoseXperts fleet operators.**  
> All data is **live from the company PostgreSQL database** — no hardcoded vehicles, no fake plates, no dummy challans, no placeholder documents.

[![Live Production](https://img.shields.io/badge/Production-truck--tracker--api--9yhq.onrender.com-059669.svg?logo=render)](https://truck-tracker-api-9yhq.onrender.com/)
[![Health Check](https://img.shields.io/badge/Health-200%20OK-059669.svg?logo=render)](https://truck-tracker-api-9yhq.onrender.com/api/health)
[![CI/CD Build](https://github.com/Nixxzzzzz/truck_tracker/actions/workflows/deploy.yml/badge.svg)](https://github.com/Nixxzzzzz/truck_tracker/actions)
[![Android APK](https://img.shields.io/badge/Android%20APK-v1.1.0-4f46e5.svg?logo=android)](https://github.com/Nixxzzzzz/truck_tracker/releases/tag/v1.1.0)
[![Stack](https://img.shields.io/badge/Stack-Node%2022%20%7C%20React%2019%20%7C%20TypeScript-2563eb.svg)](#)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-336791.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 What Is TruckTracker 2.0?

TruckTracker is an **internal enterprise fleet operations platform** built exclusively for HoseXperts. It connects two types of users:

- **Dispatch Operations Managers** — Plan multi-stop routes, assign drivers and vehicles, monitor live GPS fleet positions, manage statutory vehicle compliance documents, handle challan records, and generate SLA/delay analytics reports.
- **Field Route Drivers** — Receive trip manifests, log geofenced stop arrivals, capture proof-of-delivery photos, report delays, and access assigned vehicle papers — from the mobile web cockpit or Android APK.

**Data source**: All vehicles, drivers, trips, documents, and challans come from the live **PostgreSQL database** (backed by SAP ONE Portal ERP references). There is **no Google Sheets dependency**, no mock data, and no static demo records in production.

---

## 🏛️ Production Architecture

```
Drivers (Android / Mobile Web)  ──► Render Web Service (Oregon)
Managers (Web Command Center)   ──►   Express API :10000
                                       • JWT Auth & RBAC
                                       • State Machine Guard
                                       • Geofence Validator
                                       • Static SPA Server
                                      ──► Managed PostgreSQL (`DATABASE_URL`)
                                      ──► /data/uploads/photos/
                                ──► SAP ONE Portal (ERP Reference Sync)
```

### Trip Lifecycle

```
PLANNED → IN_PROGRESS → DELAYED ↔ IN_PROGRESS → RETURNING → COMPLETED
```

Server-enforced. Invalid transitions are rejected with 400 errors.

---

## 🗺️ Ola Maps Style Road Route Visualizer

The Web Manager Console features a high-performance, real-road logistics visualizer modeled after **Ola Maps & enterprise navigation HUDs**:

- **Real Road-Snapped Routing**: Automatically queries OSRM (Open Source Routing Machine) to trace real highway and street corridors across India instead of drawing crude straight lines.
- **Dual-Layer Neon Glow Corridor**: High-contrast, futuristic neon aura (`#00d084` 9px outer glow + `#0284c7` 4.5px inner core) for immediate day/night route legibility.
- **Floating Glassmorphism Ola HUD**: Displays actual highway distance in kilometers, estimated drive time in minutes, and active road-snapped corridor verification.
- **Interactive Drive Simulator**: Real-time cab simulation along the road polyline with 3D driver marker, live speedometer gauge (`42 - 58 km/h`), progress bar (0–100%), playback speed controls (`1x`, `2x`, `4x`), and dynamic "Follow Cab" camera tracking.
- **Turn-by-Turn Waypoints Drawer**: Expandable stop sequence with customer contacts, cargo counts, and one-click Google Maps navigation external links.
- **Map Presets**: Instant switching between **"Ola Dark"** (cyberpunk logistics), **"Day Navigation"** (high contrast street view), and **"Satellite Hybrid"**.

---

## 🛡️ Commercial Security & Operational Hardening

TruckTracker 2.0 has been hardened for enterprise company operations:

- **HTTP Security Headers**: Powered by `helmet` with strict Content-Security-Policy (CSP) allowing trusted CDNs for Leaflet tiles, fonts, and icons.
- **Brute-Force Rate Limiting**: Powered by `express-rate-limit` (15 login attempts per 15 minutes per IP) to neutralize credential-stuffing attacks.
- **Dynamic CORS Whitelisting**: Configurable via `ALLOWED_ORIGINS` environment variable to restrict browser API access exclusively to trusted corporate domains.
- **Zero Schema Leakage**: All 500 error responses are strictly sanitized in production, masking internal database constraint and file path messages.
- **Atomic Hot Database Backups**: Manager-only `POST /api/backup/create` endpoint creates verified PostgreSQL dumps with zero downtime.

---

## 🚀 Quick Start — Local Development

### Prerequisites

| Tool | Min Version | Check |
|------|------------|-------|
| Node.js | v22.0.0+ or v24 LTS | `node -v` |
| npm | v10.0.0+ | `npm -v` |
| Git | Any | `git --version` |

### 1. Clone & Install

```bash
git clone https://github.com/Nixxzzzzz/truck_tracker.git
cd truck_tracker
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your-strong-random-secret-min-32-chars
DB_DRIVER=postgres
DATABASE_URL=postgresql://user:password@localhost:5432/truck_tracker
DB_POOL_MAX=10
DB_SSL=false
UPLOADS_DIR=./uploads/photos
```

For the company SQL Server target, use `DB_DRIVER=sqlserver` and follow the [company SQL Server rollout guide](docs/development/company-sql-server-rollout-guide.md). Do not set that driver on the live Render service until SQL Server staging validation is complete.

### 3. Initialize Database

```bash
# Run migrations (creates or upgrades the PostgreSQL schema)
npm run migrate --workspace=server

# Seed initial demo users (development only)
npm run seed --workspace=server
```

> ⚠️ **Do NOT run seed in production.** Add real users and vehicles through the Manager interface.

### 4. Start Development Servers

```bash
# Terminal 1 — Backend API (Port 5000)
npm run dev --workspace=server

# Terminal 2 — Web Frontend (Port 5173)
npm run dev --workspace=web
```

| Service | URL |
|---------|-----|
| Web Console | `http://localhost:5173` |
| API Health | `http://localhost:5000/api/health` |

---

## 🔐 Login & User Setup

### No Hardcoded Users in Production

All users are stored in the **database**. You create them via the Manager UI or API — never via hardcoded credentials in code.

### Add a Driver or Manager (Manager Web UI)

1. Log in as Manager
2. Go to **Team & Users** panel
3. Click **+ Add User** → enter Name, Email, Password, Role (`DRIVER` or `MANAGER`)

### Add via API

```bash
curl -X POST https://your-app.onrender.com/api/auth/users \
  -H "Authorization: Bearer <your-manager-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Driver Full Name",
    "email": "driver@yourcompany.com",
    "password": "SecurePassword@2025",
    "role": "DRIVER",
    "phone": "+91-XXXXX-XXXXX"
  }'
```

### Development-Only Seed Credentials

> These only exist after running `npm run seed`. **Change passwords before going live.**

| Role | Email | Password |
|------|-------|----------|
| Operations Manager | `manager@company.com` | `manager123` |
| Driver | `rahul@company.com` | `driver123` |
| Driver | `amit@company.com` | `driver123` |

### Driver Login Behavior

- Driver has **active trip assigned** → sees manifest, vehicle info, route stops (all from live DB)
- Driver has **no trip assigned** → sees empty state ("No trip assigned") — no dummy vehicle, no fake plates
- Vehicle papers shown to driver come from the **fleet compliance database** — only real documents managers have added

---

## ☁️ Production Deployment — Render

Full deployment guide: [`documentation/deployment.md`](documentation/deployment.md)
Database migration and release runbook: [`docs/development/postgresql-migration-and-release-guide.md`](docs/development/postgresql-migration-and-release-guide.md)
Company SQL Server rollout guide: [`docs/development/company-sql-server-rollout-guide.md`](docs/development/company-sql-server-rollout-guide.md)

The current deployed configuration uses PostgreSQL/Neon. Microsoft SQL Server is supported as a separate rollout target only after the company SQL Server migration and validation checklist is complete.

### Required Environment Variables (Render Dashboard)

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `10000` | Render assigns automatically |
| `JWT_SECRET` | 32+ random chars | Never expose |
| `DATABASE_URL` | Render PostgreSQL connection string | Secret; never commit |
| `INITIAL_ADMIN_EMAIL` | First manager email | Secret dashboard value |
| `INITIAL_ADMIN_PASSWORD` | Unique first manager password | Secret dashboard value |
| `DB_POOL_MAX` | `10` | Maximum pooled connections |
| `DB_SSL` | `true` | Required for managed PostgreSQL |
| `DB_SSL_REJECT_UNAUTHORIZED` | `true` | Keep enabled unless provider requires otherwise |
| `AUTO_SEED` | `false` | Never seed demo data in production |
| `ALLOWED_ORIGINS` | Exact web app origin | No wildcard |
| `UPLOADS_DIR` | Company server photo directory | Proof photo storage on company-owned disk |

**Photo persistence:** the company deployment stores uploaded photos on the company server's disk through `UPLOADS_DIR`. Render/Neon is staging only; do not use the Render filesystem as the company production photo store.

### Render Config (`render.yaml` — already in repo)

```yaml
services:
  - type: web
    name: truck-tracker-api
    env: node
    region: oregon
    buildCommand: npm ci --include=dev && npm run build:all
    startCommand: npm run start
    # DATABASE_URL is configured as a secret environment variable.
```

### Deploy Steps

1. Push to `main` → Render auto-deploys via GitHub integration
2. Monitor at: `https://dashboard.render.com`
3. Verify: `GET /api/health` → `200 OK`
4. Log in as Manager → create real users and vehicles
5. Do NOT seed demo data on production

---

## 🏢 SAP ONE Portal Integration

TruckTracker stores **SAP Business One ERP reference fields** on trips and vehicles. These link logistics records to SAP documents.

### ERP Fields

| Field | Table | SAP Reference |
|-------|-------|--------------|
| `sap_shipment_num` | `trips` | SAP TM Shipment Order |
| `erp_delivery_doc` | `trips` | SAP SD Delivery (ODLN) |
| `cost_center` | `trips` | SAP CO Cost Center |
| `fleet_unit_id` | `vehicles` | SAP PM Equipment Number |

### Configuration

```env
SAP_PORTAL_URL=https://oneportal.yourcompany.internal/api/v1
SAP_SERVICE_LAYER_TOKEN=your-sap-session-token
```

Managers enter SAP reference numbers when creating trips. The system stores them alongside operational data. For full bi-directional live sync, configure the SAP Service Layer endpoint above.

---

## 🗄️ Database — 16 Tables

| Category | Table | Purpose |
|----------|-------|---------|
| System | `_schema_migrations` | Migration version tracking |
| Identity | `users` | Managers & drivers (bcrypt) |
| Fleet | `vehicles` | Fleet inventory & registration |
| Compliance | `vehicle_documents` | RC, Insurance, Fitness, PUC |
| Maintenance | `maintenance_records` | Service history |
| Fuel | `fuel_transactions` | Fuel fills & costs |
| Trips | `trips` | Route runs with ERP references |
| Stops | `trip_stops` | Ordered delivery/pickup waypoints |
| Events | `trip_events` | Immutable GPS telemetry log |
| Delays | `trip_delays` | Delay records with root-cause |
| Exceptions | `operational_exceptions` | Escalations & alerts |
| Photos | `trip_photos` | Proof-of-delivery photos |
| Cargo | `cargo_activities` | Line items per stop |
| Offline | `offline_events` | Driver offline action queue |
| Hubs | `locations` | Depots, warehouses, hubs |
| Sync | `sync_status` | ERP sync state |

```bash
npm run migrate --workspace=server
```

---

## 📱 Android Driver App — Enterprise Distribution
 
Built with **Kotlin + Jetpack Compose**. Designed for **direct internal company distribution** across company and driver Android devices (no Google Play Store submission required).
 
- **Download**: [GitHub Releases → v1.1.0 APK](https://github.com/Nixxzzzzz/truck_tracker/releases/tag/v1.1.0)
- **Web QR Code / Direct Link**: Available on the Web Login screen (`/login`)
- **Automated OTA Telemetry**: When the app launches, it checks `GET /api/app-version` and notifies drivers whenever a newer corporate APK build is published.
- **Hardware Integration**: High-accuracy GPS fused location, CameraX proof photo capture with aspect-ratio locking, and local Room database offline queue.
 
 **Install Steps:**
 1. Download APK from Releases or through the Web Portal download link
 2. Device → Settings → Security → Enable **Install Unknown Apps** (for Browser/Files)
 3. Install APK → log in with driver credentials
 4. App checks `/api/app-version` for update alerts on launch
 
 ---
 
 ## 🧪 Tests
 
 ```bash
 npm test                                    # DB integrity & business rules (33 tests)
 npm run test:scenarios --workspace=server   # Production edge cases (20 tests)
 npm run test:workflow --workspace=server    # End-to-end dispatch workflow (20 tests)
 npm run build:all                           # Full production build
 ```
 
 ---
 
 ## ✅ Features
 
 | Feature | Notes |
 |---------|-------|
 | Zero dummy data | All from live DB — no `DL01TA4920`, no fake docs |
 | Ola Maps Route Visualizer | Road-snapped OSRM corridor, neon aura, live drive simulator HUD |
 | Security Hardened | Helmet CSP, brute-force rate limiter, CORS whitelist |
 | Hot Database Backups | Atomic `VACUUM INTO` snapshots with zero downtime |
 | JWT auth + RBAC | Manager (full control) / Driver (own trips only) |
 | Server-enforced state machine | Invalid trip transitions rejected |
 | Haversine geofenced arrivals | ≤250m radius check |
 | Proof-of-delivery photo upload | Stored to persistent disk |
 | Statutory compliance hub | RC, Insurance, Fitness, PUC, Permit |
 | Traffic challan vault | Log, attach proof, settle |
 | Tri-lingual driver UI | English / हिन्दी / Hinglish |
 | Offline-first driver | Auto-sync queue on reconnect |
 | Real-time fleet GPS radar | Leaflet live map with Ola Dark / Day / Satellite themes |
 | Delay attribution analytics | Management vs Driver trend analysis |
 | SAP ONE Portal ERP refs | Shipment/Delivery/Cost Center fields |
 | Native Android APK | Kotlin + Jetpack Compose + CameraX (Internal Enterprise Rollout) |
 | GitHub Actions CI/CD | Auto Android build + Render deploy |

---

## 📚 Documentation

| File | Contents |
|------|---------|
| [`documentation/deployment.md`](documentation/deployment.md) | Render + GitHub + SAP ONE Portal rollout |
| [`documentation/api.md`](documentation/api.md) | REST API endpoint reference |
| [`documentation/architecture.md`](documentation/architecture.md) | System design & data model |
| [`documentation/operations-manual.md`](documentation/operations-manual.md) | Manager & driver SOP |
| [`documentation/android.md`](documentation/android.md) | Android build & install guide |
| [`documentation/testing.md`](documentation/testing.md) | Test suite reference |
| [`documentation/web.md`](documentation/web.md) | Web frontend guide |

---

## 📄 License

MIT License. See [`LICENSE`](LICENSE) for details.

© 2025 HoseXperts. Built for enterprise fleet operations excellence.
