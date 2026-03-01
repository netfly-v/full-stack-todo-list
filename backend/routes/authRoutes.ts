import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRole, type AuthPayload, type User } from '../types';
import pool from '../db';
import { formatZodErrors, loginSchema, registerSchema } from '../validators';

const router = express.Router();

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET ?? 'dev_access_secret';
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET ?? 'dev_refresh_secret';
const isProduction = process.env.NODE_ENV === 'production';

const accessTokenTtlMs = 15 * 60 * 1000;
const refreshTokenTtlMs = 7 * 24 * 60 * 60 * 1000;

const getCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProduction,
  path: '/',
});

const signTokens = (payload: AuthPayload) => {
  const accessToken = jwt.sign(payload, accessTokenSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, refreshTokenSecret, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const setAuthCookies = (res: Response, payload: AuthPayload) => {
  const { accessToken, refreshToken } = signTokens(payload);
  const baseOptions = getCookieOptions();

  res.cookie('access_token', accessToken, { ...baseOptions, maxAge: accessTokenTtlMs });
  res.cookie('refresh_token', refreshToken, { ...baseOptions, maxAge: refreshTokenTtlMs });
};

const clearAuthCookies = (res: Response) => {
  const baseOptions = getCookieOptions();
  res.clearCookie('access_token', baseOptions);
  res.clearCookie('refresh_token', baseOptions);
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.access_token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, accessTokenSecret) as AuthPayload | { userId: number; email: string; role?: string };
    const role = payload.role === UserRole.Superadmin ? UserRole.Superadmin : payload.role === UserRole.Admin ? UserRole.Admin : UserRole.User;
    res.locals.auth = { userId: payload.userId, email: payload.email, role };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation error', details: formatZodErrors(parsed.error.issues) });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  try {
    const existing = await pool.query<User>('SELECT id, email FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rowCount && existing.rowCount > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query<User>(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, name, bio, avatar_url, role',
      [normalizedEmail, passwordHash, UserRole.User]
    );

    const user = result.rows[0];
    setAuthCookies(res, { userId: user.id, email: user.email, role: user.role ?? UserRole.User });
    return res.status(201).json(user);
  } catch (error) {
    console.error('Failed to register user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation error', details: formatZodErrors(parsed.error.issues) });
  }

  const { email, password } = parsed.data;

  try {
    const result = await pool.query<{ id: number; email: string; password_hash: string; role: string | null }>(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userRow = result.rows[0];
    const matches = await bcrypt.compare(password, userRow.password_hash);
    if (!matches) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const role = (userRow.role as UserRole | null) ?? UserRole.User;

    // Fetch full user profile
    const profileResult = await pool.query<User>(
      'SELECT id, email, name, bio, avatar_url, role FROM users WHERE id = $1',
      [userRow.id]
    );

    const user = profileResult.rows[0];
    setAuthCookies(res, { userId: user.id, email: user.email, role });
    return res.json(user);
  } catch (error) {
    console.error('Failed to login user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  clearAuthCookies(res);
  return res.json({ ok: true });
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const token = req.cookies?.refresh_token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, refreshTokenSecret) as AuthPayload;
    const result = await pool.query<User>(
      'SELECT id, email, name, bio, avatar_url, role FROM users WHERE id = $1',
      [payload.userId]
    );
    if (result.rowCount === 0) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = result.rows[0];
    setAuthCookies(res, { userId: user.id, email: user.email, role: user.role ?? UserRole.User });
    return res.json({ ok: true });
  } catch (error) {
    clearAuthCookies(res);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (_req: Request, res: Response) => {
  const auth = res.locals.auth as AuthPayload;

  try {
    const result = await pool.query<User>(
      'SELECT id, email, name, bio, avatar_url, role FROM users WHERE id = $1',
      [auth.userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
