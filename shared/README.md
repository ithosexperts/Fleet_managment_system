# 📦 TruckTracker Shared Contracts

This package contains the canonical data models, operational event types, system constants, and API contract specifications shared across:
1. **Server / Backend (`server/`)** — authoritative business rule engine and PostgreSQL storage.
2. **Web Manager Client (`web/`)** — desktop/tablet dispatch command center.
3. **Android Native Driver Client (`android/`)** — Kotlin models matching the JSON serialization contracts defined here.

## Contents
- `models.ts`: Trip, TripStop, User, Vehicle, Destination, Activity, Delay, Photo, AuditLog.
- `events.ts`: Operational event vocabulary (`TRIP_START`, `STOP_ARRIVAL`, `ACTIVITY_COMPLETION`, `STOP_DEPARTURE`, `DELAY_START`, `DELAY_RESOLVE`, `RETURN_START`, `BASE_ARRIVAL`, `TRIP_COMPLETE`).
- `constants.ts`: Geofence settings (100–250m default), API endpoints, storage keys.
- `api-contracts.ts`: Canonical request/response payloads for network calls.
