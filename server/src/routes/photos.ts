import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { query } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { uploadPhotoMiddleware, savePhotoRecord, UPLOADS_DIR } from '../services/photoStorage';
import { PhotoType } from '../types';
import { hosexpertsSync } from '../services/hosexpertsSync';

const router = Router();

/**
 * POST /api/photos/upload
 * Accepts multipart photo upload with metadata
 */
router.post(
  '/upload',
  requireAuth,
  uploadPhotoMiddleware.single('photo') as any,
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file provided' });
    }

    const {
      trip_id,
      stop_id,
      photo_type = 'Delivery Proof',
      latitude,
      longitude,
      gps_accuracy,
      timestamp
    } = req.body;

    if (!trip_id) {
      // Clean up orphaned uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'trip_id is required' });
    }

    const trip = (await query(`SELECT * FROM trips WHERE id = $1`, [trip_id])).rows[0] as any;
    if (!trip) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Security check: Driver can only upload photos to their own assigned trips
    if (req.user!.role === 'DRIVER') {
      const driver = (await query(`SELECT id, user_id FROM drivers WHERE user_id = $1 OR id = $1`, [req.user!.id])).rows[0] as any;
      const isAuthorized = trip.driver_id === req.user!.id || (driver && (trip.driver_id === driver.id || trip.driver_id === driver.user_id));
      if (!isAuthorized) {
        if (req.file && fs.existsSync(req.file.path)) {
          try { fs.unlinkSync(req.file.path); } catch {}
        }
        return res.status(403).json({ error: 'You are not authorized to upload photos to another driver\'s trip' });
      }
    }

    // Ensure valid vehicleId for foreign key constraint
    let vehicleId = trip.vehicle_id;
    if (!vehicleId) {
      const firstVehicle = (await query(`SELECT id FROM vehicles LIMIT 1`)).rows[0] as any;
      vehicleId = firstVehicle?.id || 'UNASSIGNED';
    }

    // Ensure stopId exists in trip_stops to avoid foreign key errors
    let validStopId: string | null = null;
    if (stop_id && stop_id !== 'undefined' && stop_id !== 'null') {
      const stopExists = (await query(`SELECT id FROM trip_stops WHERE id = $1`, [stop_id])).rows[0];
      if (stopExists) {
        validStopId = stop_id;
      }
    }

    try {
      // Always use authoritative server timestamp
      const serverTimestamp = new Date().toISOString();

      const photo: any = await savePhotoRecord({
        tripId: trip_id,
        stopId: validStopId || undefined,
        driverId: req.user!.id,
        vehicleId,
        photoType: photo_type as PhotoType,
        filePath: req.file.filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        gpsAccuracy: gps_accuracy ? parseFloat(gps_accuracy) : undefined,
        timestamp: serverTimestamp
      });

      hosexpertsSync.syncPhoto('insert', {
        id: photo.id,
        trip_id,
        stop_id: validStopId || null,
        driver_id: req.user!.id,
        vehicle_id: vehicleId,
        photo_type,
        file_path: req.file.filename,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        timestamp: serverTimestamp,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        gps_accuracy: gps_accuracy ? parseFloat(gps_accuracy) : null,
        created_at: serverTimestamp
      }).catch(err => console.error('[HoseXperts Sync] Photo insert sync failed:', err));

      return res.status(201).json({
        message: 'Photo uploaded successfully',
        photo
      });
    } catch (err: any) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }
      console.error('[Photos Error] Failed to record photo:', err);
      return res.status(500).json({ error: err.message || 'Failed to record photo' });
    }
  }
);

/**
 * GET /api/photos/trip/:tripId
 * List all photos for a trip (manager use)
 */
router.get('/trip/:tripId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { tripId } = req.params;

  // Security: Drivers can only view photos on their own trips
  const trip = (await query(`SELECT * FROM trips WHERE id = $1`, [tripId])).rows[0] as any;
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  if (req.user!.role === 'DRIVER' && trip.driver_id !== req.user!.id) {
    return res.status(403).json({ error: 'Not authorized to view photos for this trip' });
  }

  const photos = (await query(`
    SELECT p.*, ts.destination_name, ts.stop_number
    FROM photos p
    LEFT JOIN trip_stops ts ON p.stop_id = ts.id
    WHERE p.trip_id = $1
    ORDER BY p.timestamp ASC
  `, [tripId])).rows as any[];

  // Append a convenience URL for each photo
  const photosWithUrl = photos.map((p) => ({
    ...p,
    url: `/api/photos/${p.id}/file`
  }));

  return res.json({ photos: photosWithUrl, total: photosWithUrl.length });
});

/**
 * GET /api/photos/:id/file
 * Secure photo file streaming — requires authentication
 */
router.get('/:id/file', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const photo = (await query(`SELECT * FROM photos WHERE id = $1`, [req.params.id])).rows[0] as any;
  if (!photo) {
    return res.status(404).json({ error: 'Photo record not found' });
  }

  // Security: Drivers can only stream their own trip photos
  if (req.user!.role === 'DRIVER') {
    const trip = (await query(`SELECT driver_id FROM trips WHERE id = $1`, [photo.trip_id])).rows[0] as any;
    if (!trip || trip.driver_id !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to view this photo' });
    }
  }

  let filePath = path.join(UPLOADS_DIR, photo.file_path);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(UPLOADS_DIR, path.basename(photo.file_path));
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Photo file missing from storage' });
  }

  const mimeType = photo.file_path.endsWith('.svg') ? 'image/svg+xml' : (photo.mime_type || 'image/jpeg');
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  return res.sendFile(filePath);
});

export default router;
