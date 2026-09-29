# Database Architecture & Persistence Strategy

## 1. Relational Engine Specification
TruckTracker uses PostgreSQL through a single asynchronous `pg.Pool`, configured with `DATABASE_URL` and `DB_POOL_MAX`.

### Connection & Transaction Guarantees
- All database calls are asynchronous and use PostgreSQL `$1`, `$2`, ... parameter placeholders.
- `withTransaction()` checks out one `PoolClient` and uses it for every query in the transaction.
- PostgreSQL foreign keys, unique constraints, and check constraints enforce relational integrity.

---

## 2. Render Persistence Audit & Storage Realities

### Free Tier Single-Instance Environment
- **Container Disk Nature**: The filesystem on Render Web Services (`plan: free`) is **ephemeral**.
- **Persistence Reality**: Database state lives in managed PostgreSQL and is independent of web-service restarts or deployments.
- **Auto-Boot Mitigation**:
  The application migration runner (`server/src/migrations/runner.ts`) executes idempotently on startup (`initDatabase()`). It creates or upgrades the PostgreSQL schema without inserting demo data in production.

### Production PostgreSQL Configuration
The backend connects to PostgreSQL directly:
1. Queries use parameterized `SELECT`, `INSERT`, `UPDATE`, and `JOIN` statements through `query()`.
2. Schema migrations (`001` through `007`) use PostgreSQL-compatible data types:
   - `TEXT` → `VARCHAR` / `TEXT`
   - `INTEGER` → `INT` / `BIGINT`
  - `REAL` → PostgreSQL `REAL`
  - timestamp fields → `TIMESTAMPTZ` where applicable
3. Managed services can enable TLS with `DB_SSL=true`; credentials are never stored in the repository.

---

## 3. Indexing Strategy & Query Plans

Indexes were introduced based on actual query access patterns:

| Index Name | Table & Columns | Target Query Pattern |
| :--- | :--- | :--- |
| `idx_trips_driver_status` | `trips(driver_id, status)` | Filter driver active trips on mobile terminal startup (`GET /api/driver/trips/active`) |
| `idx_trips_date` | `trips(date)` | Manager daily manifest dispatch query & reporting aggregation (`GET /api/trips?date=...`) |
| `idx_trip_stops_trip_order` | `trip_stops(trip_id, stop_number)` | Chronological stops retrieval for manifest detail (`GET /api/trips/:id`) |
| `idx_events_trip_time` | `trip_events(trip_id, timestamp)` | Timeline event stream generation in audit dossier |
| `idx_delays_trip` | `delays(trip_id)` | Active unresolved delays retrieval for manager attention feed |
| `idx_vehicle_docs_vehicle` | `vehicle_documents(vehicle_id, expiry_date)` | Vehicle compliance certificate expiration audit |
| `idx_sheet_sync` | `google_sheet_sync(sheet_name, sync_status)` | Google Sheets outbox sync worker polling pending records |
