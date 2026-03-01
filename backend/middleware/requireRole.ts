import type { NextFunction, Request, Response } from 'express';
import { UserRole, type AuthPayload, type User } from '../types';
import pool from '../db';

const validRoles = new Set<string>(Object.values(UserRole));

export const requireRole = (roles: UserRole[]) => {
  return async (_req: Request, res: Response, next: NextFunction) => {
    const auth = res.locals.auth as AuthPayload | undefined;
    if (!auth?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const result = await pool.query<User>('SELECT role FROM users WHERE id = $1', [auth.userId]);
      if (result.rowCount === 0) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const role = result.rows[0]?.role;
      const normalizedRole = role && validRoles.has(role) ? (role as UserRole) : UserRole.User;

      if (!roles.includes(normalizedRole)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      res.locals.auth = { ...auth, role: normalizedRole };
      return next();
    } catch (error) {
      console.error('Failed to check user role:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};
