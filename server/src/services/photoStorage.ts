import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db';
import { PhotoType } from '../types';

function resolveUploadsDir(): string {
  const preferred = process.env.UPLOADS_DIR || path.resolve(__dirname, '../../uploads/photos');
  try {
    if (!fs.existsSync(preferred)) {
      fs.mkdirSync(preferred, { recursive: true });
    }
    return preferred;
  } catch (err) {
    const fallback = path.resolve(__dirname, '../../uploads/photos');
    console.warn(`[Storage] Cannot use ${preferred} (${(err as Error).message}), falling back to ${fallback}`);
    if (!fs.existsSync(fallback)) {
      fs.mkdirSync(fallback, { recursive: true });
    }
    return fallback;
  }
}

export const UPLOADS_DIR = resolveUploadsDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image file type. Only JPEG, PNG, and WebP are supported.'));
  }
};

export const uploadPhotoMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export async function savePhotoRecord(params: {
  tripId: string;
  stopId?: string;
  driverId: string;
  vehicleId: string;
  photoType: PhotoType;
  filePath: string;
  fileSize: number;
  mimeType: string;
  latitude?: number;
  longitude?: number;
  gpsAccuracy?: number;
  timestamp?: string;
}) {
  const id = uuidv4();
  const timestamp = params.timestamp || new Date().toISOString();

  await query(`
    INSERT INTO photos (
      id, trip_id, stop_id, driver_id, vehicle_id, photo_type, 
      file_path, file_size, mime_type, timestamp, latitude, longitude, gps_accuracy
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
  `, [
    id,
    params.tripId,
    params.stopId || null,
    params.driverId,
    params.vehicleId,
    params.photoType,
    params.filePath,
    params.fileSize,
    params.mimeType,
    timestamp,
    params.latitude ?? null,
    params.longitude ?? null,
    params.gpsAccuracy ?? null
  ]);

  const result = await query(`SELECT * FROM photos WHERE id = $1`, [id]);
  return result.rows[0];
}
