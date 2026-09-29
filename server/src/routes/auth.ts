import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db';
import { generateToken, requireAuth, requireRole, logAudit, AuthenticatedRequest } from '../middleware/auth';
import { User } from '../types';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = (await query<User>(
      `SELECT * FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    )).rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    };

    return res.json({
      success: true,
      token,
      user: userPayload,
      data: {
        token,
        user: userPayload
      }
    });
  } catch (err: any) {
    console.error('[Auth Error] Login failure:', err);
    return res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = (await query(
    `SELECT id, name, email, role, phone, created_at FROM users WHERE id = $1`,
    [req.user.id]
  )).rows[0];

  if (!user) {
    return res.status(404).json({ error: 'User record not found' });
  }

  return res.json({ user });
});

router.post('/logout', (_req, res) => {
  return res.json({ message: 'Logged out successfully' });
});

// ==========================================
// USER & MANAGER MANAGEMENT (Manager Role Only)
// ==========================================

router.get('/users', requireAuth, requireRole('MANAGER'), async (_req, res) => {
  try {
    const users = (await query(`
      SELECT id, name, email, role, phone, created_at
      FROM users
      ORDER BY role ASC, name ASC
    `)).rows;
    return res.json({ users });
  } catch (err: any) {
    console.error('[Auth Error] Retrieve users failure:', err);
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

router.post('/users', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password, phone, role = 'MANAGER' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (typeof password !== 'string' || password.trim().length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = (await query(`SELECT id FROM users WHERE LOWER(email) = $1`, [normalizedEmail])).rows[0];
  if (existing) {
    return res.status(409).json({ error: `An account with email "${normalizedEmail}" already exists` });
  }

  try {
    const id = uuidv4();
    const hash = await bcrypt.hash(password, 10);
    const assignedRole = role === 'DRIVER' ? 'DRIVER' : 'MANAGER';

    await query(`
      INSERT INTO users (id, name, email, password_hash, role, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [id, name.trim(), normalizedEmail, hash, assignedRole, phone ? phone.trim() : null]);

    await logAudit({
      action: 'USER_CREATED',
      newValue: `Created ${assignedRole} account for ${name} (${normalizedEmail})`,
      changedBy: req.user!.id
    });

    return res.status(201).json({
      message: `${assignedRole === 'MANAGER' ? 'Operations Manager' : 'User'} created successfully`,
      user: {
        id,
        name: name.trim(),
        email: normalizedEmail,
        role: assignedRole,
        phone: phone ? phone.trim() : null
      }
    });
  } catch (err: any) {
    console.error('[Auth Error] Create user failure:', err);
    return res.status(500).json({ error: 'Failed to create user.' });
  }
});

router.put('/users/:id', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, phone, password, role } = req.body;

  const existing = (await query<User>(`SELECT * FROM users WHERE id = $1`, [id])).rows[0];
  if (!existing) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    let newHash = existing.password_hash;
    if (password && String(password).trim().length > 0) {
      if (String(password).trim().length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      newHash = await bcrypt.hash(String(password).trim(), 10);
    }

    await query(`
      UPDATE users
      SET name = COALESCE($1, name),
          phone = COALESCE($2, phone),
          password_hash = $3,
          role = COALESCE($4, role)
      WHERE id = $5
    `, [
      name ? name.trim() : null,
      phone ? phone.trim() : null,
      newHash,
      role || null,
      id
    ]);

    await logAudit({
      action: 'USER_UPDATED',
      newValue: `Updated account details/password for user ${existing.email}`,
      changedBy: req.user!.id
    });

    return res.json({ message: 'User updated successfully' });
  } catch (err: any) {
    console.error('[Auth Error] Update user failure:', err);
    return res.status(500).json({ error: 'Failed to update user.' });
  }
});

router.delete('/users/:id', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  if (req.user!.id === id) {
    return res.status(400).json({ error: 'You cannot delete your own active session account' });
  }

  const target = (await query<User>(`SELECT * FROM users WHERE id = $1`, [id])).rows[0];
  if (!target) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Ensure at least one manager remains in the system
  if (target.role === 'MANAGER') {
    const managerCount = (await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM users WHERE role = 'MANAGER'`)).rows[0];
    if (Number(managerCount.count) <= 1) {
      return res.status(400).json({ error: 'Cannot delete the only remaining manager account' });
    }
  }

  try {
    await query(`DELETE FROM users WHERE id = $1`, [id]);

    await logAudit({
      action: 'USER_DELETED',
      originalValue: `${target.name} (${target.email})`,
      changedBy: req.user!.id
    });

    return res.json({ message: `Account for ${target.name} has been removed` });
  } catch (err: any) {
    console.error('[Auth Error] Delete user failure:', err);
    return res.status(500).json({ error: 'Failed to delete user.' });
  }
});

export default router;

