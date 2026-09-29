# Database Migration Engine Specification

## 1. Overview
TruckTracker executes schema migrations through an ordered, version-tracked migration engine located at [`server/src/migrations/runner.ts`](file:///u:/tracktracker/server/src/migrations/runner.ts).

Ad-hoc, unversioned `CREATE TABLE IF NOT EXISTS` execution is prohibited for production schema evolution.

---

## 2. Schema Version Tracking Table
The catalog table `_schema_migrations` tracks which migration versions have been applied to the current database file:

```sql
CREATE TABLE IF NOT EXISTS _schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Ordered Migration Registry

| Version | Migration Identifier | Purpose & Operations |
| :---: | :--- | :--- |
| **`1`** | `001_initial_core_schema` | Establishes the 12 core tables (`users`, `vehicles`, `drivers`, `destinations`, `trips`, `trip_stops`, `activities`, `delays`, `photos`, `trip_events`, `audit_logs`, `google_sheet_sync`) and baseline indexes. |
| **`2`** | `002_add_enterprise_compliance_and_maintenance` | Introduces normalized compliance and fleet operating tables: `vehicle_documents`, `maintenance_records`, `fuel_transactions`, and `operational_exceptions`. |
| **`3`** | `003_add_erp_references_and_performance_indexes` | Idempotently applies `ALTER TABLE` to add ERP/SAP references (`fleet_unit_id`, `chassis_number`, `telematics_imei` to `vehicles`; `sap_shipment_num`, `erp_delivery_doc`, `cost_center` to `trips`), plus composite indexes (`idx_trips_created_at`, `idx_destinations_active`). |

---

## 4. Execution Guarantees
1. **Atomic Transactionality**:
   Each migration executes within a dedicated `BEGIN IMMEDIATE ... COMMIT` boundary. If any statement encounters an error, the database rolls back completely to its pre-migration state.
2. **Idempotence**:
   Running migrations multiple times against an already up-to-date database executes in `< 2ms` with zero side effects.
3. **Automatic Startup Hook**:
   [`server/src/db.ts`](file:///u:/tracktracker/server/src/db.ts) invokes `runMigrations()` upon initial database connection, guaranteeing that newly provisioned containers initialize the schema before the first HTTP request arrives.

---

## 5. Development & CI CLI Commands

```bash
# Execute all pending migrations
npm run migrate --workspace=server

# Run database integrity and invariant validation tests
npm run test:integrity --workspace=server

# Reset database to fresh seed data
npm run seed --workspace=server
```
