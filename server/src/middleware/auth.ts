import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { UserRole } from '../types';
import { v4 as uuidv4 } from 'uuid';

import dotenv from 'dotenv';
dotenv.config();

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is required. Set it in Render Environment Variables.');
  }
  return secret;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.method === 'GET' && req.query && typeof req.query.token === 'string') {
    // Allow query tokens for GET requests (essential for browser <img> tags that cannot set Authorization headers)
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication session' });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access forbidden: Required role [${allowedRoles.join(', ')}], current role is [${req.user.role}]`
      });
    }

    next();
  };
}

export async function logAudit(params: {
  tripId?: string;
  action: string;
  fieldChanged?: string;
  originalValue?: string;
  newValue?: string;
  changedBy: string;
  reason?: string;
}) {
  try {
    await query(`
      INSERT INTO audit_logs (id, trip_id, action, field_changed, original_value, new_value, changed_by, reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      uuidv4(),
      params.tripId || null,
      params.action,
      params.fieldChanged || null,
      params.originalValue || null,
      params.newValue || null,
      params.changedBy,
      params.reason || null
    ]);
  } catch (err: any) {
    console.error('[AuditLog] Failed to record audit log:', err.message);
  }
}
