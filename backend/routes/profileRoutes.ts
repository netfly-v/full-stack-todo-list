import express, { Request, Response } from 'express';
import { requireAuth } from './authRoutes';
import { uploadAvatar } from '../middleware/upload';
import { processAvatar, deleteAvatar } from '../utils/imageProcessor';
import { formatZodErrors, updateProfileSchema } from '../validators';
import pool from '../db';
import type { User, AuthPayload, UpdateProfileDto } from '../types';

const router = express.Router();

// All profile routes require authentication
router.use(requireAuth);

// GET /api/profile - Get current user's profile
router.get('/', async (_req: Request, res: Response) => {
  const auth = res.locals.auth as AuthPayload;

  try {
    const result = await pool.query<User>(
      'SELECT id, email, name, bio, avatar_url FROM users WHERE id = $1',
      [auth.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/profile - Update current user's profile
router.put('/', async (req: Request, res: Response) => {
  const auth = res.locals.auth as AuthPayload;

  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation error',
      details: formatZodErrors(parsed.error.issues),
    });
  }

  const { name, bio } = parsed.data as UpdateProfileDto;

  // Build dynamic query based on provided fields
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(name);
  }

  if (bio !== undefined) {
    updates.push(`bio = $${paramIndex++}`);
    values.push(bio);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(auth.userId);

  try {
    const result = await pool.query<User>(
      `UPDATE users 
       SET ${updates.join(', ')} 
       WHERE id = $${paramIndex}
       RETURNING id, email, name, bio, avatar_url`,
      values
    );

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/profile/avatar - Upload avatar
router.post('/avatar', (req: Request, res: Response, next) => {
  const auth = res.locals.auth as AuthPayload;
  // Store userId in request for multer filename function
  (req as any).userId = auth.userId;
  next();
}, uploadAvatar.single('avatar'), async (req: Request, res: Response) => {
  const auth = res.locals.auth as AuthPayload;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Get current avatar to delete it later
    const currentUser = await pool.query<User>(
      'SELECT avatar_url FROM users WHERE id = $1',
      [auth.userId]
    );

    const currentAvatarUrl = currentUser.rows[0]?.avatar_url;

    // Process the uploaded image (resize, optimize)
    const processedPath = await processAvatar(req.file.path);

    // Convert absolute path to relative URL
    const avatarUrl = processedPath.replace(process.cwd(), '').replace(/\\/g, '/');

    // Update database with new avatar URL
    const result = await pool.query<User>(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, email, name, bio, avatar_url',
      [avatarUrl, auth.userId]
    );

    // Delete old avatar file
    if (currentAvatarUrl) {
      await deleteAvatar(currentAvatarUrl);
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to upload avatar:', error);
    return res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// DELETE /api/profile/avatar - Delete avatar
router.delete('/avatar', async (_req: Request, res: Response) => {
  const auth = res.locals.auth as AuthPayload;

  try {
    // Get current avatar URL
    const currentUser = await pool.query<User>(
      'SELECT avatar_url FROM users WHERE id = $1',
      [auth.userId]
    );

    const avatarUrl = currentUser.rows[0]?.avatar_url;

    if (!avatarUrl) {
      return res.status(400).json({ error: 'No avatar to delete' });
    }

    // Remove avatar URL from database
    const result = await pool.query<User>(
      'UPDATE users SET avatar_url = NULL WHERE id = $1 RETURNING id, email, name, bio, avatar_url',
      [auth.userId]
    );

    // Delete avatar file
    await deleteAvatar(avatarUrl);

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to delete avatar:', error);
    return res.status(500).json({ error: 'Failed to delete avatar' });
  }
});

export default router;
