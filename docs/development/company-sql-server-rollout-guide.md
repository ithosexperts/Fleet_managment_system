# Company SQL Server Rollout Guide

This is the approved planning guide for moving TruckTracker from the current PostgreSQL/Neon staging deployment to the company Microsoft SQL Server environment.

## Important Status

The live Render service uses Neon PostgreSQL. The repository contains a dual-driver foundation, but the SQL Server migration is not approved for production until the SQL Server-specific migrations, queries, backups, and integration tests pass against the company's instance. Do not set `DB_DRIVER=sqlserver` for production before that validation.

SSMS is an administration client. It is not the database server and it does not provide a connection for Render by itself.

## Company Information Required

Company IT must provide these details through an approved secret-sharing process:

- SQL Server host name or private DNS name
- TCP port, normally `1433`
- Database name
- Dedicated application login and password
- SQL Server version and edition
- Encryption and certificate requirements
- Firewall or VPN route from the application server
- Backup, restore, retention, and disaster-recovery policy
- Approved location for the Node.js API server

Never put the password in GitHub, documentation, screenshots, chat, or `.env.example`.

## Required Network Design

The Node.js API must run where it can reach SQL Server over a secure company network path:

```text
Company users and Android clients
              |
              v
      Company Node.js API server
              |
       encrypted TCP connection
              v
       Company Microsoft SQL Server
              ^
              |
             SSMS
```

Render cannot reach a private on-premises SQL Server unless company IT provides an approved private connection, VPN, or secure public endpoint. Do not open SQL Server broadly to the internet.

## Application Migration Required

The repository now contains a dual-driver foundation. The current default remains PostgreSQL; SQL Server is selected explicitly with `DB_DRIVER=sqlserver`. Before production cutover, validate these SQL Server-specific areas against the company's instance:

1. SQL Server connection, encryption, and named parameter binding.
2. Migration DDL, object existence checks, and schema version tracking.
3. SQL Server pagination, date arithmetic, casts, and catalog queries.
4. Transaction commit and rollback behavior.
5. SQL Server backup and restore procedures.
6. Full API, integrity, workflow, and performance tests.

The web frontend, Android application, REST paths, uploaded photo behavior, and API response contracts should remain unchanged.

## SQL Server Environment Variables

Set these only on the company server's secret manager or deployment environment:

```env
DB_SERVER=company-sql-server.example.internal
DB_PORT=1433
DB_NAME=truck_tracker
DB_USER=truck_tracker_app
DB_PASSWORD=<secret>
DB_POOL_MAX=10
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false
NODE_ENV=production
JWT_SECRET=<secret>
UPLOADS_DIR=/var/lib/truck-tracker/uploads/photos
AUTO_SEED=false
```

Do not use `DATABASE_URL`, `DB_SSL`, `DB_SSL_REJECT_UNAUTHORIZED`, or Neon values when `DB_DRIVER=sqlserver`.

## Database Provisioning

Company IT should create only the empty database and dedicated application login. The application login should receive only the permissions required by the migration and runtime, according to company policy. Do not manually create application tables from screenshots or SSMS scripts.

After `DB_DRIVER=sqlserver` and the SQL Server variables are configured, the server startup process runs the migration runner automatically:

1. It connects to the configured SQL Server.
2. It creates `_schema_migrations` if it does not exist.
3. It applies migrations `1` through `7` in order.
4. It creates all application tables, foreign keys, checks, indexes, and ERP/SAP columns.
5. It records each applied version so a restart does not recreate or destroy tables.
6. It provisions the first manager only when the database has no users and the initial admin variables are present.

Therefore, a new empty database is enough. You do not need to create the TruckTracker tables manually. The first SQL Server startup must still be validated against the company's SQL Server version before production rollout.

The SQL Server migration runner creates `_schema_migrations`, applies every migration in order, and is designed to be idempotent. A new empty database can be initialized automatically after the SQL Server implementation is validated.

## Data Migration and Cutover

1. Keep the current PostgreSQL/Neon deployment available as the rollback source.
2. Export PostgreSQL data to a protected staging location.
3. Transform timestamps, booleans, text lengths, numeric precision, and nulls explicitly.
4. Load the data into a fresh company SQL Server database.
5. Compare row counts for every table.
6. Validate foreign keys, unique constraints, ERP/SAP references, timestamps, documents, photos, maintenance, fuel, challans, exceptions, and audit logs.
7. Run integrity, workflow, API, and performance tests against SQL Server.
8. Pause writes during the final export and cutover.
9. Switch the company API environment to SQL Server.
10. Verify health, login, reads, writes, file uploads, reports, and manager workflows.
11. Keep PostgreSQL read-only until the business owner approves completion.

## Deployment and Verification

Build and test the SQL Server branch before deployment:

```powershell
npm install
npm run build
npm run migrate --workspace=server
npm run test:integrity --workspace=server
npm run test:workflow --workspace=server
```

Required production checks:

- SQL Server connection succeeds with encryption enabled.
- Migrations are idempotent.
- A failed transaction rolls back all writes.
- Manager and driver authentication work.
- Trip lifecycle actions work.
- Reports and pagination work.
- Photo files remain in the approved storage location.
- The company API server uses a company-owned persistent disk for photos, configured through `UPLOADS_DIR`. Render/Neon is staging only and is not the company production photo store.
- Backups and restores have been tested.
- No database password or production data is staged in Git.

## Current Safe Recommendation

Keep Render + Neon as staging until the company SQL Server path is validated. Do not set `DB_DRIVER=sqlserver` on the current Render service until the company SQL Server endpoint is reachable and the complete verification checklist passes.
