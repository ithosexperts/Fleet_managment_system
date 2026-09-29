# Contributing to TruckTracker 2.0

Thank you for contributing to the HoseXperts TruckTracker platform.

## Important: No Dummy Data

This codebase is a **production system**. Do not add:
- Hardcoded vehicle plate numbers or fake registration documents
- Static mock fallbacks in `api.ts` that hide backend errors
- Demo employee names, routes, or challans in production-facing components
- Fake `mockStore` data that shows in production UI

All data must come from the live SQLite database via real API calls.

## Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/Nixxzzzzz/truck_tracker.git
cd truck_tracker
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your local settings
```

### 3. Initialize Database
```bash
npm run migrate --workspace=server  # Create all 16 tables
npm run seed --workspace=server     # Add dev-only sample users/data
```

### 4. Run Development Servers
```bash
# Terminal 1 - Backend
npm run dev --workspace=server

# Terminal 2 - Web Frontend
npm run dev --workspace=web
```

### 5. Verify Before Committing
```bash
npm test                         # Database & business rule tests
npm run build:all                # Full TypeScript compilation check
```

## Development Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make changes. Ensure **TypeScript compiles with zero errors** (`npm run build:all`).
3. Run tests: `npm test`
4. Commit with semantic messages:
   - `feat: add driver license expiry alert`
   - `fix: resolve trip geofence validation edge case`
   - `docs: update deployment guide with SAP env vars`
   - `chore: upgrade Node.js runtime to v22.12`
5. Push and open a Pull Request against `main`.

## Code Standards

- **TypeScript strict mode** — no implicit `any`, no type assertions without justification
- **No dummy fallbacks** — if an API call fails, return empty data (`{ trips: [] }`), not fake data
- **Preserve comments** — don't strip existing JSDoc or inline explanations unless refactoring
- **Semantic commits** — follow [Conventional Commits](https://www.conventionalcommits.org/)
- **Zero console.log in production code** — use proper server-side logging

## Project Structure

```
truck_tracker/
├── web/src/
│   ├── components/            # Reusable UI components (LeafletMap, Modals, etc.)
│   ├── views/                 # Page-level components (DriverView, ManagerView)
│   ├── services/api.ts        # All API calls (direct backend, no mock fallbacks)
│   ├── services/routing.ts    # Ola Maps style OSRM road geometry engine
│   └── services/offlineQueue.ts # LocalStorage offline event queue
├── server/src/
│   ├── routes/          # Express API route handlers
│   ├── migrations/      # Database schema migrations
│   └── index.ts         # Express entry point
├── shared/              # Types shared between web and server
├── android/             # Native Kotlin Android driver app
└── documentation/       # Architecture, deployment, API guides
```

## Adhere to the Code of Conduct

See [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
