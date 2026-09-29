# TruckTracker — System Architecture Overview

## 1. System Mission & Operational Scope
TruckTracker is an enterprise-grade fleet operations and dispatch logistics system designed for medium-to-large road freight operations. It coordinates dispatch manifests, driver turn-by-turn checkpoint confirmations, tamper-evident Proof of Delivery (POD) photo capture, corridor delay reporting, and executive SLA compliance audits across regional distribution corridors.

---

## 2. High-Level Component Topology

```
┌─────────────────────────────────────────────────────────────┐
│                    User Client Surface                      │
│   ┌───────────────────────────┐ ┌─────────────────────────┐ │
│   │ Manager Operations Web UI │ │ Driver Mobile Web/App   │ │
│   │ (React 19 + TypeScript)   │ │ (Compose + CameraX/GPS) │ │
│   └─────────────┬─────────────┘ └────────────┬────────────┘ │
└─────────────────┼────────────────────────────┼──────────────┘
                  │ HTTPS / JSON / Bearer JWT  │
                  ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Unified Node.js / Express Server               │
│               (Render All-in-One Container)                 │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Middleware: Helmet, RateLimiter, Auth/RBAC, CORS   │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                              │
│   ┌──────────────────────────┴──────────────────────────┐   │
│   │ Route Controllers                                   │   │
│   │ ├── /api/auth       (Credentials & JWT Verification)│   │
│   │ ├── /api/trips      (Manifests, Stops, Safeguards)  │   │
│   │ ├── /api/driver     (Driver Telematics & Geofences) │   │
│   │ ├── /api/fleet      (Vehicles, Documents, Papers)   │   │
│   │ ├── /api/reports    (Delay Attribution & SLA Trends)│   │
│   │ ├── /api/photos     (Multer POD File Storage)       │   │
│   │ ├── /api/backup     (Zero-Downtime Hot DB Snapshots)│   │
│   │ ├── /api/app-version(Mobile Client Telemetry)       │   │
│   │ └── /api/health     (Uptime Probe)                  │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                              │
│   ┌──────────────────────────┴──────────────────────────┐   │
│   │ Service Layer                                       │   │
│   │ ├── Geo Service     (Haversine geofence detection)  │   │
│   │ ├── Migration Engine(Versioned ordered migrations)  │   │
│   │ └── Backup Service  (Atomic VACUUM INTO snapshots)  │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                              │
│   ┌──────────────────────────┴──────────────────────────┐   │
│   │ Persistence Layer                                   │   │
│   │ Node 22 native SQLite DatabaseSync (WAL mode)       │   │
│   │ 16 Relational Tables with Foreign Key Enforcement   │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack & Runtime Decisions
- **Backend Runtime**: Node.js `22.12.0+` with the asynchronous `pg` PostgreSQL client and managed database connection.
- **Backend Framework**: Express `4.21.2` with TypeScript `5.7.3`, providing end-to-end typed request/response contracts.
- **Frontend Architecture**: React 19, Vite 6, Leaflet Maps for spatial geofence visualization, and Lucide React icons.
- **Mobile Client**: Native Android application engineered with Kotlin, Jetpack Compose, CameraX, and Google Play Services Location.
- **Automated CI/CD**: GitHub Actions workflow compiles the Android APK via Temurin JDK 17 and publishes release packages to GitHub Releases on push.
- **Persistence Engine**: SQLite in WAL (`PRAGMA journal_mode = WAL;`) and Foreign Key (`PRAGMA foreign_keys = ON;`) mode across 16 canonical relational tables.
- **Authentication**: Stateless HMAC-SHA256 signed JSON Web Tokens (JWT) with 24-hour expiration. Passwords hashed using `bcryptjs` (work factor 10).

