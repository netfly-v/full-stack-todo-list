import express, { Request, Response } from 'express';
import { UserRole, type AuthPayload } from '../types';
import pool from '../db';
import { requireAuth } from './authRoutes';
import { requireRole } from '../middleware/requireRole';

type AdminTodo = {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  tags: string[];
  deadline: string | null;
  user_id: number;
  user_email: string;
};

type AdminUser = {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
};

const router = express.Router();

// POST /api/admin/boot-superadmin - Bootstrap superadmin by secret
router.post('/boot-superadmin', async (req: Request, res: Response) => {
  const secret = req.headers['x-bootstrap-secret'];
  const expectedSecret = process.env.SUPERADMIN_BOOTSTRAP_SECRET;

  if (!expectedSecret) {
    return res.status(500).json({ error: 'Bootstrap secret is not configured' });
  }

  if (secret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const email = String(req.body?.email ?? '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const userResult = await pool.query<AdminUser>(
      "SELECT id, email, name, COALESCE(role, 'user') as role FROM users WHERE email = $1",
      [email]
    );
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    if (user.role === UserRole.Superadmin) {
      return res.json({ ok: true, user });
    }

    const updated = await pool.query<AdminUser>(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, name, role',
      [UserRole.Superadmin, user.id]
    );

    return res.json({ ok: true, user: updated.rows[0] });
  } catch (error) {
    console.error('Failed to bootstrap superadmin:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.use(requireAuth);
router.use(requireRole([UserRole.Admin, UserRole.Superadmin]));

// GET /api/admin/todos - Get all todos for all users
router.get('/todos', async (_req: Request, res: Response) => {
  const auth = res.locals.auth as AuthPayload;

  try {
    const result = await pool.query<AdminTodo>(
      `
        SELECT
          todos.id,
          todos.title,
          todos.description,
          todos.completed,
          todos.created_at as "createdAt",
          todos.tags,
          todos.deadline,
          todos.user_id,
          users.email as user_email
        FROM todos
        JOIN users ON users.id = todos.user_id
        ORDER BY todos.created_at DESC, todos.id DESC
      `
    );

    return res.json({
      items: result.rows,
      requested_by: auth.userId,
      total: result.rowCount ?? 0,
    });
  } catch (error) {
    console.error('Failed to fetch admin todos:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/users - Get all users with roles
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<AdminUser>(
      "SELECT id, email, name, COALESCE(role, 'user') as role FROM users ORDER BY id ASC"
    );

    return res.json({ items: result.rows });
  } catch (error) {
    console.error('Failed to fetch admin users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/users/:id/role - Update user role (superadmin only)
router.put('/users/:id/role', requireRole([UserRole.Superadmin]), async (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  const role = String(req.body?.role ?? '').trim();

  if (!userId || Number.isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  if (!Object.values(UserRole).includes(role as UserRole)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const auth = res.locals.auth as AuthPayload;
    const nextRole = role as UserRole;
    if (auth.userId === userId && nextRole !== UserRole.Superadmin) {
      return res.status(400).json({ error: 'Superadmin cannot remove own role' });
    }

    const result = await pool.query<AdminUser>(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, name, role',
      [nextRole, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update user role:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
