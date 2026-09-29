# Local Engineering Setup & Development Guide

## 1. Prerequisites
- **Node.js**: Version `22.0.0` or higher (`node -v`).
- **NPM**: Version `10.0.0` or higher (`npm -v`).
- **Operating System**: Linux, macOS, or Windows (PowerShell / Command Prompt).

---

## 2. Onboarding Workflow (Zero to Running)

```bash
# 1. Clone the repository
git clone https://github.com/Nixxzzzzz/truck_tracker.git
cd truck_tracker

# 2. Install workspace dependencies
npm install

# 3. Initialize database & apply migrations
npm run migrate

# 4. Seed initial Delhi-NCR commercial logistics dataset
npm run seed

# 5. Run database integrity and business invariant tests
npm run test

# 6. Start development servers concurrently (Backend on :5000, Frontend on :5173)
npm run dev
```

---

## 3. Environment Configuration (`.env`)

Create a local `.env` file in the project root:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=local-development-secret-key-32-chars-min
DATABASE_URL=postgresql://user:password@localhost:5432/truck_tracker
DB_POOL_MAX=10
DB_SSL=false
UPLOADS_DIR=./uploads/photos
```

---

## 4. Default Seed Logins
- **Executive**: `director@company.com` / `director123`
- **Manager**: `manager@company.com` / `manager123`
- **Driver**: `rahul@company.com` / `driver123`
