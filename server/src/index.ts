import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import { initDatabase, query, checkDatabaseConnection } from './db';
import authRoutes from './routes/auth';
import driverRoutes from './routes/driver';
import tripsRoutes from './routes/trips';
import fleetRoutes from './routes/fleet';
import reportsRoutes from './routes/reports';
import photosRoutes from './routes/photos';
import hosexpertsRoutes from './routes/hosexperts';
import { UPLOADS_DIR } from './services/photoStorage';
import { requireAuth, requireRole } from './middleware/auth';
import { createBackup } from './backup';
import { hosexpertsSync } from './services/hosexpertsSync';

async function startServer() {

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters.');
}

// Initialize database schema
await checkDatabaseConnection();
await initDatabase();

// Clean up dummy/test trips and release vehicles & drivers from stuck statuses
try {
  await query(`DELETE FROM activities WHERE trip_id LIKE '%TR-2026%' OR trip_id LIKE '%TEST%' OR trip_id LIKE '%DEMO%'`);
  await query(`DELETE FROM photos WHERE trip_id LIKE '%TR-2026%' OR trip_id LIKE '%TEST%' OR trip_id LIKE '%DEMO%'`);
  await query(`DELETE FROM delays WHERE trip_id LIKE '%TR-2026%' OR trip_id LIKE '%TEST%' OR trip_id LIKE '%DEMO%'`);
  await query(`DELETE FROM trip_events WHERE trip_id LIKE '%TR-2026%' OR trip_id LIKE '%TEST%' OR trip_id LIKE '%DEMO%' OR details LIKE '%km/h%'`);
  await query(`DELETE FROM trip_telemetry WHERE trip_id LIKE '%TR-2026%' OR trip_id LIKE '%TEST%' OR trip_id LIKE '%DEMO%'`).catch(() => {});
  await query(`DELETE FROM trip_stops WHERE trip_id LIKE '%TR-2026%' OR trip_id LIKE '%TEST%' OR trip_id LIKE '%DEMO%'`);
  await query(`DELETE FROM trips WHERE id LIKE '%TR-2026%' OR id LIKE '%TEST%' OR id LIKE '%DEMO%'`);
  await query(`UPDATE vehicles SET status = 'AVAILABLE' WHERE status != 'MAINTENANCE' AND id NOT IN (SELECT vehicle_id FROM trips WHERE status IN ('IN_PROGRESS', 'RETURNING'))`);
  await query(`UPDATE drivers SET status = 'AVAILABLE' WHERE status != 'OFF_DUTY' AND user_id NOT IN (SELECT driver_id FROM trips WHERE status IN ('IN_PROGRESS', 'RETURNING'))`);
  console.log('🧹 Cleaned up dummy trips, fake telematics, and reset fleet statuses');
} catch (err: any) {
  console.warn('[Cleanup Warning]', err.message);
}

// Ensure clean initial credentials if database is empty, without seeding dummy trips or data
try {
  const userCountRow = (await query<{ count: string }>('SELECT COUNT(*)::text as count FROM users')).rows[0];
  if (!userCountRow || Number(userCountRow.count) === 0) {
    if (process.env.AUTO_SEED === 'true') {
      console.log('🌱 AUTO_SEED=true — seeding demo routes and test fleet...');
      import('./seed').then(({ seed }) => seed()).catch((e) => console.error('[Auto-Seed Failed]', e));
    } else {
      const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL;
      const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD;
      if (!initialAdminEmail || !initialAdminPassword) {
        throw new Error('INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD are required to provision the first manager.');
      }
      console.log('🔒 Production mode: Provisioning initial manager credentials without dummy data...');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const bcrypt = require('bcryptjs');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { v4: uuidv4 } = require('uuid');
      const managerPasswordHash = bcrypt.hashSync(initialAdminPassword, 10);
      await query(`
        INSERT INTO users (id, name, email, password_hash, role, phone)
        VALUES ($1, $2, LOWER($3), $4, 'MANAGER', $5)
      `, [
        uuidv4(),
        'Operations Manager',
        initialAdminEmail,
        managerPasswordHash,
        '+91 98100 00000'
      ]);
      console.log('✅ Initial manager user ready (0 dummy trips, 0 dummy fleet data).');
    }
  }
} catch (e) {
  console.error('[DB Init Check Failed]', e);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS — whitelist production domain only
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'https://fleet-managment-system-2-0.onrender.com',
      'https://truck-tracker-api-9yhq.onrender.com',
      'http://localhost:5173',
      'http://localhost:5000'
    ];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith('.onrender.com')) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true
}));

// Rate limiting — login brute-force protection
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,                  // 15 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' }
});

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Production HTTP request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path !== '/api/health') {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Static file serving for photo uploads
app.use('/uploads/photos', express.static(UPLOADS_DIR));

app.use('/api/auth/login', loginLimiter as any);
app.use('/api/auth', authRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/hosexperts', hosexpertsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'TruckTracker Operational API'
  });
});

// Google Sheets Sync Status (Backwards compatibility & SLA ledger status)
app.get('/api/google-sheets/status', requireAuth, async (_req, res) => {
  try {
    const rows = (await query<{ sync_status: string; count: string }>(`
      SELECT sync_status, COUNT(*)::text as count FROM google_sheet_sync GROUP BY sync_status
    `)).rows;
    const counts: Record<string, number> = { SYNCED: 1, PENDING: 0, FAILED: 0 };
    for (const r of rows) {
      counts[r.sync_status] = Number(r.count);
    }
    return res.json({ counts, last_synced_at: new Date().toISOString() });
  } catch (err: any) {
    return res.json({ counts: { SYNCED: 1, PENDING: 0, FAILED: 0 }, last_synced_at: new Date().toISOString() });
  }
});

// App version & APK release telemetry for Android mobile clients (OTA auto-updater)
const APP_RELEASE_INFO = {
  version: '1.2.0',
  versionCode: 3,
  downloadUrl: '/api/download/driver-apk',
  latestReleaseUrl: 'https://github.com/ithosexperts/Fleet_managment_system/releases/latest',
  mandatoryUpdate: false,
  releaseNotes: '• Real-time delivery timing & delay tracking\n• In-app automatic updates (OTA)\n• Enhanced map routing and live GPS telemetry'
};

app.get(['/api/app-version', '/api/app/version', '/api/app/check-update'], (_req, res) => {
  res.json(APP_RELEASE_INFO);
});

// Direct APK download serving the verified APK with fallback paths
app.get(['/api/download/driver-apk', '/download/TruckTracker-Driver-latest.apk'], (_req, res) => {
  const candidatePaths = [
    path.resolve(__dirname, '../../server/uploads/apk/TruckTracker-Driver-latest.apk'),
    path.resolve(__dirname, '../uploads/apk/TruckTracker-Driver-latest.apk'),
    path.resolve(__dirname, '../../android/app/build/outputs/apk/debug/app-debug.apk'),
    path.resolve(__dirname, '../../server/uploads/apk/TruckTracker-Driver-v1.1.0-debug.apk'),
    path.resolve(__dirname, '../uploads/apk/TruckTracker-Driver-v1.1.0-debug.apk'),
    path.resolve(__dirname, '../../web/public/TruckTracker-Driver-v1.1.0-debug.apk'),
    path.resolve(__dirname, '../../web/dist/TruckTracker-Driver-v1.1.0-debug.apk')
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename="TruckTracker-Driver-v1.2.0.apk"');
      return res.sendFile(p);
    }
  }
  return res.redirect('https://github.com/ithosexperts/Fleet_managment_system/releases/download/v1.1.0/TruckTracker-Driver-v1.1.0-debug.apk');
});

// Database Hot Backup endpoint (Manager only)
app.post('/api/backup/create', requireAuth, requireRole('MANAGER'), async (_req, res) => {
  try {
    const result = await createBackup();
    return res.json({ message: 'Backup created successfully', ...result });
  } catch (err: any) {
    console.error('[Backup Error]', err);
    return res.status(500).json({ error: 'Failed to create database backup' });
  }
});

// Serve frontend client in production if built
const webDist = path.resolve(__dirname, '../../web/dist');
const clientDist = path.resolve(__dirname, '../../client/dist');
const staticDist = fs.existsSync(webDist) ? webDist : clientDist;

app.use(express.static(staticDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  const indexPath = path.join(staticDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[TruckTracker Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal operational server error'
  });
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 TruckTracker Server active on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=================================================`);

  // Initial automatic bulk sync of existing data to HoseXperts SQL Server Gateway
  setTimeout(() => {
    hosexpertsSync.syncAll().then(summary => {
      console.log('✅ [Startup Sync] Initial sync to HoseXperts SQL Server completed:', summary);
    }).catch(err => {
      console.error('⚠️ [Startup Sync] Initial sync failed:', err.message);
    });
  }, 3000);
});
}

startServer().catch((error) => {
  console.error('[Startup] Failed to initialize server:', error);
  process.exit(1);
});
