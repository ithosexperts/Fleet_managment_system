# Testing & Quality Verification Guide

## 1. Test Philosophy
TruckTracker enforces automated quality gates:
1. **Database Integrity & Business Invariants**: Validates schema versioning, table existence, foreign keys, transaction rollbacks, and query plans.
2. **End-to-End Operational Workflow**: Validates dispatcher creation of manifests, driver checkpoints, geofence arrivals, POD photo uploads, delay reporting, and daily reports.
3. **Static Analysis & Build Verification**: TypeScript compiler validation across `server`, `web`, and `shared`.

---

## 2. Test Execution Commands

```bash
# 1. Run database integrity and invariant test suite (31 tests)
npm test

# 2. Run real-world production edge case scenarios (20 tests)
npm run test:scenarios --workspace=server

# 3. Run end-to-end operational dispatch workflow validation (20 tests)
npm run test:workflow --workspace=server

# 4. Run full workspace production build (TypeScript + Vite)
npm run build:all

# 5. Verify database migrations idempotency
npm run migrate --workspace=server
```

---

## 3. GitHub Actions Continuous Integration

The `.github/workflows/deploy.yml` pipeline executes on every push to `main` and pull requests:
1. **`build-and-verify` Job**:
   - Clean installs dependencies via `npm ci`.
   - Compiles Web Single Page App (`npm run build --workspace=web`).
   - Compiles Backend Express Server (`npm run build --workspace=server`).
   - Executes database schema & business invariant tests (`npm test`, 31 tests).
2. **`build-android-apk` Job**:
   - Sets up Temurin JDK 17 with Gradle cache.
   - Compiles native Android debug APK via `./gradlew assembleDebug`.
   - Uploads APK artifact to workflow run.
   - On pushes to `main`, publishes `TruckTracker-Driver-v1.1.0-debug.apk` directly to GitHub Releases.
