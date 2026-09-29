# 🏛️ TruckTracker — System Architecture Documentation

## 1. Architectural Overview

TruckTracker is an internal logistics operational platform designed for company fleets, field drivers, and dispatch managers. It consists of:
1. **Native Android Driver Application (`android/`)**: Primary mobile field client for drivers built with Kotlin, Jetpack Compose, CameraX, and Room.
2. **Web Manager Application (`web/`)**: Desktop/tablet dispatch command center for fleet managers built with React 19, TypeScript, and Leaflet.
3. **Shared Contracts & Models (`shared/`)**: Canonical data models, event definitions, and API contracts ensuring consistency across all layers.
4. **Authoritative Shared Backend (`server/`)**: Express + Node.js + a selectable PostgreSQL or Microsoft SQL Server database driver enforcing all business rules, authentication, event integrity, photo storage, reporting, and SAP ONE Portal / ERP integration.

---

## 2. Multi-Client Component Topology

```mermaid
graph TD
    subgraph Clients["Frontend Clients Layer"]
        AndroidApp["📱 Android Driver App<br/>(Kotlin + Jetpack Compose)"]
        WebApp["💻 Web Command Center<br/>(React 19 + TypeScript + Leaflet)"]
    end

    subgraph Shared["Canonical Contracts Layer"]
        SharedTypes["📦 Shared Models & Contracts<br/>(/shared/models.ts, events.ts, api-contracts.ts)"]
    end

    subgraph Backend["Authoritative Backend Engine (Node.js 24 + Express)"]
        AuthModule["🔐 Auth & RBAC Guard<br/>(JWT + bcrypt)"]
        TripEngine["🚚 Multi-Stop Trip Engine<br/>(Sequential State Machine)"]
        EventEngine["⏱️ Event & Audit Engine<br/>(Authoritative Timestamps)"]
        GeoService["📍 Geofence & GPS Validator<br/>(Haversine 100-250m)"]
        PhotoService["📷 Photo Proof Service<br/>(Disk Storage & Metadata)"]
        ErpGateway["🏢 SAP ONE Portal Gateway<br/>(Shipment, Cost Center, PM)"]
        BackupService["💾 Database Backup Service<br/>(Provider or SQL Server Backup Policy)"]
    end

    subgraph Storage["Authoritative Single Source of Truth"]
        Database[("🗄️ PostgreSQL or Microsoft SQL Server<br/>(Company-authoritative database)")]
        PhotoStorage[("📁 Photo Proof Storage<br/>/server/uploads/photos/")]
    end

    AndroidApp -->|HTTPS / REST API| AuthModule
    WebApp -->|HTTPS / REST API| AuthModule

    AndroidApp -.->|Compiles with| SharedTypes
    WebApp -.->|Compiles with| SharedTypes
    Backend -.->|Implements| SharedTypes

    AuthModule --> TripEngine
    AuthModule --> EventEngine
    AuthModule --> PhotoService

    TripEngine --> GeoService
    TripEngine --> Database
    TripEngine --> ErpGateway
    EventEngine --> Database
    PhotoService --> PhotoStorage
    PhotoService --> Database

    BackupService --> Database
```

---

## 3. Database Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ TRIPS : "assigned as driver"
    VEHICLES ||--o{ TRIPS : "assigned to trip"
    TRIPS ||--|{ TRIP_STOPS : "contains 1..N stops"
    TRIPS ||--o{ TRIP_EVENTS : "records timeline events"
    TRIPS ||--o{ TRIP_DELAYS : "records operational delays"
    TRIPS ||--o{ TRIP_PHOTOS : "attaches proof photos"
    TRIP_STOPS ||--o{ TRIP_EVENTS : "stop arrival/departure events"
    TRIP_STOPS ||--o{ TRIP_PHOTOS : "delivery proof photos"
    TRIPS ||--o{ AUDIT_LOGS : "immutable audit trail"

    USERS {
        text id PK
        text name
        text email
        text role "manager | driver | admin"
        text employee_id
        text status "active | inactive"
    }

    VEHICLES {
        text id PK
        text plate_number
        text model
        text status "available | in_use | maintenance"
    }

    TRIPS {
        text id PK
        text trip_number "Unique human identifier"
        text driver_id FK
        text vehicle_id FK
        text status "PLANNED | IN_PROGRESS | DELAYED | RETURNING | COMPLETED | CANCELLED"
        text starting_location
        text planned_departure_time
        text actual_start_time "Server timestamp"
        text return_start_time "Server timestamp"
        text base_arrival_time "Server timestamp"
        text trip_completion_time "Server timestamp"
        real total_distance_km
    }

    TRIP_STOPS {
        text id PK
        text trip_id FK
        integer stop_number "Ordered 1, 2, 3..."
        text destination_name
        real latitude
        real longitude
        real geofence_radius_meters
        text planned_arrival_time
        text actual_arrival_time "Server timestamp"
        text actual_departure_time "Server timestamp"
        text activity_type "DELIVERY | PICKUP | SERVICE"
        integer photo_required "0 or 1"
        text status "PENDING | ARRIVED | COMPLETED"
    }

    TRIP_EVENTS {
        text id PK
        text trip_id FK
        text stop_id FK
        text event_type "TRIP_START | ARRIVE | DEPART..."
        text timestamp "Authoritative server time"
        real latitude
        real longitude
        real gps_accuracy_meters
        text idempotency_key "UUID v4 deduplication"
    }

    TRIP_DELAYS {
        text id PK
        text trip_id FK
        text reason "TRAFFIC | MECHANICAL | WEATHER..."
        text delay_start_time
        text delay_end_time
        integer duration_minutes
        text notes
    }

    TRIP_PHOTOS {
        text id PK
        text trip_id FK
        text stop_id FK
        text photo_category "DELIVERY_PROOF | CARGO_DAMAGE..."
        text file_path
        text server_timestamp
        real latitude
        real longitude
    }

    AUDIT_LOGS {
        text id PK
        text trip_id FK
        text user_id FK
        text action "TRIP_EDIT | REORDER_STOPS | CANCEL"
        text timestamp
        text notes
    }
```

---

## 4. End-to-End Operational Lifecycle Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor Manager as 💻 Dispatch Manager
    actor Driver as 📱 Field Driver
    participant WebApp as Web Command Center
    participant AndroidApp as Android Driver App
    participant Backend as Express + Engine
    participant DB as Company SQL Database

    Note over Manager,WebApp: Dispatch Phase
    Manager->>WebApp: Create Trip TR-2026-0001 (Stops 1..N)
    Manager->>WebApp: Assign Driver (Rahul) + Vehicle (KA-01-E-1001)
    WebApp->>Backend: POST /api/trips
    Backend->>DB: INSERT trips, trip_stops (Status: PLANNED)
    Backend-->>WebApp: 201 Created

    Note over Driver,AndroidApp: Route Execution Phase
    Driver->>AndroidApp: Log In (rahul@company.com)
    AndroidApp->>Backend: POST /api/auth/login
    Backend-->>AndroidApp: JWT Token + Profile
    AndroidApp->>Backend: GET /api/driver/trips/active
    Backend-->>AndroidApp: Trip Details with Sequential Stops

    Driver->>AndroidApp: Tap "START TRIP"
    AndroidApp->>Backend: POST /api/trips/:id/events (TRIP_START)
    Backend->>DB: UPDATE trips (Status: IN_PROGRESS, actual_start_time)

    loop For Each Assigned Destination Stop (1..N)
        Driver->>AndroidApp: Arrive at Stop location
        AndroidApp->>AndroidApp: FusedLocation Check (Haversine distance <= 250m)
        AndroidApp->>Backend: POST /api/trips/:id/events (STOP_ARRIVE)
        Backend->>DB: UPDATE trip_stops (Status: ARRIVED, actual_arrival_time)

        opt Traffic / Breakdown Delay Encountered
            Driver->>AndroidApp: Tap "REPORT DELAY" (Traffic)
            AndroidApp->>Backend: POST /api/trips/:id/delays
            Backend->>DB: INSERT trip_delays (Status: DELAYED)
            Driver->>AndroidApp: Tap "RESOLVE DELAY"
            AndroidApp->>Backend: PUT /api/trips/:id/delays/:delayId/resolve
            Backend->>DB: UPDATE trip_delays (duration_minutes, Status: IN_PROGRESS)
        end

        Driver->>AndroidApp: Tap "COMPLETE ACTIVITY"
        opt Photo Proof Required (photo_required == 1)
            Driver->>AndroidApp: Capture photo via CameraX
            AndroidApp->>Backend: POST /api/photos/upload (Multipart JPEG)
            Backend->>DB: INSERT trip_photos
        end
        AndroidApp->>Backend: POST /api/trips/:id/events (ACTIVITY_COMPLETE)
        Backend->>DB: UPDATE trip_stops (Status: COMPLETED)

        Driver->>AndroidApp: Tap "DEPART STOP"
        AndroidApp->>Backend: POST /api/trips/:id/events (STOP_DEPART)
        Backend->>DB: UPDATE trip_stops (actual_departure_time)
    end

    Note over Driver,AndroidApp: Return & Base Completion Phase
    Driver->>AndroidApp: Tap "START RETURN JOURNEY"
    AndroidApp->>Backend: POST /api/trips/:id/events (RETURN_START)
    Backend->>DB: UPDATE trips (Status: RETURNING, return_start_time)

    Driver->>AndroidApp: Tap "ARRIVE AT BASE"
    AndroidApp->>Backend: POST /api/trips/:id/events (BASE_ARRIVE)
    Backend->>DB: UPDATE trips (base_arrival_time)

    Driver->>AndroidApp: Tap "COMPLETE TRIP"
    AndroidApp->>Backend: POST /api/trips/:id/events (TRIP_COMPLETE)
    Backend->>DB: UPDATE trips (Status: COMPLETED, trip_completion_time)

    Manager->>WebApp: Open Completed Trip Detail & View Generated CSV Report
```

---

## 5. Offline Queue & Idempotency Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Driver as 📱 Field Driver
    participant UI as Jetpack Compose UI
    participant Room as Room Local DB (offline_events)
    participant Monitor as ConnectivityManager
    participant SyncMgr as SyncManager
    participant Backend as Authoritative API

    Note over Driver,Room: Offline Event Generation
    Driver->>UI: Taps "ARRIVE AT STOP"
    UI->>Monitor: Check network state
    Monitor-->>UI: isConnected == false
    UI->>Room: INSERT OfflineEventEntity (UUID idempotency_key, payload, sync_status: PENDING)
    UI-->>Driver: Display "Saved — 1 event(s) waiting for network"

    Note over Driver,Room: Application Killed & Reopened
    Driver->>UI: Closes app & reopens later
    UI->>Room: Query pending count
    Room-->>UI: count == 1 (Persistent in SQLite Room file)

    Note over Monitor,Backend: Network Restoration & Auto-Drain
    Monitor->>SyncMgr: NetworkCallback onAvailable()
    SyncMgr->>Room: SELECT * FROM offline_events WHERE sync_status='PENDING' ORDER BY timestamp ASC
    loop Sequential Queue Drain
        SyncMgr->>Backend: POST /api/trips/:id/events (Payload + idempotency_key)
        alt Server Processes Successfully
            Backend-->>SyncMgr: 200 OK
            SyncMgr->>Room: DELETE FROM offline_events WHERE id=:id
        else Network Drops Mid-Request or Duplicate Sent
            SyncMgr->>Backend: Retry POST with SAME idempotency_key
            Backend->>Backend: Detect existing idempotency_key in DB
            Backend-->>SyncMgr: 200 OK (Idempotent replay, zero duplicates)
            SyncMgr->>Room: DELETE FROM offline_events WHERE id=:id
        end
    end
    SyncMgr-->>UI: Pending count updated to 0
    UI-->>Driver: Offline banner clears automatically
```

---

## 6. Core Architectural Guarantees

1. **Anti-Tampering Timestamps**: Operational timestamps (`actual_start_time`, `actual_arrival_time`, `actual_departure_time`, `trip_completion_time`) are generated strictly by the server. Manipulating device clocks has zero impact on records.
2. **Planned vs. Actual Immutability**: Planned arrival schedules are immutable baseline targets. Real-world differences are logged as variance metrics (+/- minutes) and never overwrite planned targets.
3. **Strict RBAC & Driver Isolation**: Drivers can query and mutate only trips assigned to their `driver_id`. Cross-driver access attempts return HTTP 404/403.
4. **Authoritative SQL Database & ERP Gateway**: The configured PostgreSQL or Microsoft SQL Server database is the authoritative source of truth. All operational metrics, route logs, and proof records are persisted with atomic transactions, while enterprise fields integrate with central ERP systems such as SAP Business One.
