# TruckTracker REST API Catalog

This document details all active HTTP API endpoints provided by the Express backend.

---

## Base URL
- **Local Development**: `http://localhost:5000/api`
- **Render Production**: `https://truck-tracker-api-9yhq.onrender.com/api`

All authenticated endpoints require an HTTP header:
```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Authentication & Session

### `POST /api/auth/login`
- **Purpose**: Authenticate user credentials and receive a signed JWT.
- **Request Body**:
  ```json
  {
    "email": "manager@company.com",
    "password": "manager123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr-uuid",
      "name": "Sunil Mehta",
      "email": "manager@company.com",
      "role": "MANAGER",
      "phone": "+91 98100 11223"
    }
  }
  ```

### `GET /api/auth/me`
- **Purpose**: Validate existing JWT token and retrieve active user profile.
- **Response `200 OK`**: `{ "user": { ... } }`

---

## 2. Dispatch Manifests & Trips

### `GET /api/trips`
- **Role**: `MANAGER`
- **Query Parameters**:
  - `date` (optional): `YYYY-MM-DD`
  - `status` (optional): `'PLANNED'`, `'IN_PROGRESS'`, `'COMPLETED'`, etc.
  - `search` (optional): Text search across trip ID, vehicle plate, driver name.
  - `limit` (optional): Integer (default 50).
  - `offset` (optional): Integer (default 0).
- **Response `200 OK`**: `{ "trips": [ ... ] }`

### `GET /api/trips/:id`
- **Role**: `MANAGER`
- **Response `200 OK`**: Complete trip manifest with stops, activities, photos, delays, events, and audit logs.

### `POST /api/trips`
- **Role**: `MANAGER`
- **Request Body**:
  ```json
  {
    "date": "2026-09-14",
    "driver_id": "driver-uuid",
    "vehicle_id": "vehicle-uuid",
    "starting_location": "Company North Central Depot",
    "purpose": "Commercial Restocking",
    "reference_number": "PO-2026-9912",
    "planned_departure_time": "08:30",
    "notes": "Fragile electronic cargo",
    "stops": [
      {
        "destination_id": "dest-uuid",
        "destination_name": "Lajpat Nagar Hub",
        "address": "Ring Road, Lajpat Nagar",
        "latitude": 28.5677,
        "longitude": 77.2433,
        "geofence_radius_meters": 150,
        "planned_arrival_time": "09:30"
      }
    ]
  }
  ```
- **Response `201 Created`**: `{ "message": "Trip created", "tripId": "TR-2026-00004" }`

---

## 3. Fleet Assets & Compliance

### `GET /api/fleet/vehicles`
- **Role**: Authenticated
- **Response `200 OK`**: `{ "vehicles": [ ... ] }`

### `POST /api/fleet/vehicles`
- **Role**: `MANAGER`
- **Request Body**: `{ "vehicle_number": "DL01 TA 4920", "vehicle_type": "Refrigerated Express", "model": "Tata Ultra T.7" }`

### `POST /api/fleet/vehicles/:id/documents`
- **Role**: `MANAGER`
- **Content-Type**: `multipart/form-data` or `application/json`
- **Purpose**: Upload or update statutory vehicle compliance documents (RC, Commercial Insurance, Road Fitness, PUC, National Permit).
- **Request Body**:
  ```json
  {
    "document_type": "INSURANCE",
    "document_number": "POL-2026-89210",
    "issued_date": "2026-01-10",
    "expiry_date": "2027-01-09",
    "notes": "ICICI Lombard Comprehensive Commercial"
  }
  ```
- **Response `200 OK`**: `{ "message": "Document registered successfully", "document": { ... } }`

### `GET /api/fleet/vehicles/:id/documents`
- **Role**: Authenticated (`MANAGER` or `DRIVER`)
- **Purpose**: Retrieve verified compliance certificates. Used by both the Manager Compliance Hub and the Driver In-Cab Vehicle Papers viewer.
- **Response `200 OK`**: `{ "documents": [ ... ] }`

### `GET /api/fleet/vehicles/:id/maintenance`
- **Role**: Authenticated
- **Response `200 OK`**: `{ "maintenanceRecords": [ ... ] }`

### `GET /api/fleet/exceptions`
- **Role**: Authenticated
- **Query Parameters**: `status` (`OPEN` | `ACKNOWLEDGED` | `RESOLVED`), `severity`
- **Response `200 OK`**: `{ "exceptions": [ ... ] }`

---

## 4. Reports & Delay Attribution Analytics

### `GET /api/reports/daily?date=YYYY-MM-DD`
- **Role**: `MANAGER`
- **Response `200 OK`**:
  ```json
  {
    "date": "2026-09-14",
    "overview": {
      "totalTrips": 3,
      "completedTrips": 1,
      "activeTrips": 2,
      "delayedTrips": 1,
      "totalDestinations": 8,
      "totalDelayMinutes": 73,
      "totalDelayFormatted": "1h 13m",
      "onTimePercentage": 88
    },
    "delayAttribution": {
      "mgmtMins": 45,
      "mgmtCount": 3,
      "mgmtPct": 62,
      "driverMins": 28,
      "driverCount": 2,
      "driverPct": 38,
      "mgmtReasons": [
        { "reason": "Customer Loading Bay Queue / Dock Wait", "count": 2, "total_minutes": 30 },
        { "reason": "Gate Pass & E-Way Bill Verification", "count": 1, "total_minutes": 15 }
      ],
      "driverReasons": [
        { "reason": "Corridor Traffic & Expressway Congestion", "count": 2, "total_minutes": 28 }
      ],
      "trend": [
        { "time": "06:00 - 09:00", "management": 15, "driver": 8 },
        { "time": "09:00 - 12:00", "management": 20, "driver": 12 },
        { "time": "12:00 - 15:00", "management": 10, "driver": 8 }
      ]
    },
    "trips": [ ... ],
    "delayReasons": [ ... ],
    "driverSummary": [ ... ],
    "vehicleSummary": [ ... ]
  }
  ```

### `GET /api/reports/periodic?period=weekly|monthly`
- **Role**: `MANAGER`
- **Response `200 OK`**: Rolling window metrics, aggregate throughput, driver summaries, and delay Pareto distributions with dual-series management vs driver attribution.

### `GET /api/reports/export?date=YYYY-MM-DD`
- **Role**: `MANAGER`
- **Response `200 OK`**: `Content-Type: text/csv` spreadsheet export.

---

## 5. System, Mobile Telemetry & Integrations

### `GET /api/app-version`
- **Role**: Public / Mobile Client
- **Purpose**: Check the latest Android client release and trigger seamless in-app upgrade notifications.
- **Response `200 OK`**:
  ```json
  {
    "version": "1.1.0",
    "versionCode": 2,
    "downloadUrl": "https://github.com/Nixxzzzzz/truck_tracker/releases/download/v1.1.0/TruckTracker-Driver-v1.1.0-debug.apk",
    "latestReleaseUrl": "https://github.com/Nixxzzzzz/truck_tracker/releases/latest",
    "mandatoryUpdate": false
  }
  ```

### `GET /api/health`
- **Role**: Public (Uptime Probe)
- **Response `200 OK`**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-09-16T12:00:00.000Z",
    "service": "TruckTracker Operational API"
  }
  ```

### `POST /api/backup/create`
- **Role**: `MANAGER`
- **Purpose**: Create a verified PostgreSQL dump without taking the service offline.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Backup created successfully",
    "backup": {
      "filename": "backup-2026-09-19T13-30-00-000Z.sqlite",
      "path": "/data/backups/backup-2026-09-19T13-30-00-000Z.sqlite",
      "size": 147456,
      "sizeFormatted": "144.0 KB",
      "createdAt": "2026-09-19T13:30:00.000Z"
    }
  }
  ```


