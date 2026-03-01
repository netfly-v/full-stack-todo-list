import request from 'supertest';
import pool from '../db';
import { UserRole, type CreateTodoDto, type Todo, type User } from '../types';

/**
 * Create a test user in the database
 */
type TestUserInput = {
  email?: string;
  password?: string;
  name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  role?: UserRole;
};

export async function createTestUser(input: TestUserInput = {}): Promise<User> {
  const {
    email = 'test@example.com',
    password = 'password123',
    name = null,
    bio = null,
    avatar_url = null,
    role,
  } = input;
  const bcrypt = await import('bcrypt');
  const passwordHash = await bcrypt.hash(password, 10);

  const insertQuery = role
    ? 'INSERT INTO users (email, password_hash, name, bio, avatar_url, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, name, bio, avatar_url, role'
    : 'INSERT INTO users (email, password_hash, name, bio, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, bio, avatar_url, role';

  const values = role
    ? [email.toLowerCase(), passwordHash, name, bio, avatar_url, role]
    : [email.toLowerCase(), passwordHash, name, bio, avatar_url];

  const result = await pool.query<User>(insertQuery, values);

  return result.rows[0];
}

/**
 * Create a test todo for a user
 */
type TestTodoInput = CreateTodoDto & {
  completed?: boolean;
};

export async function createTestTodo(
  userId: number,
  input: TestTodoInput = { title: 'Test todo', description: 'Test description' }
): Promise<Todo> {
  const tags = input.tags ?? [];
  const deadline = input.deadline ?? null;
  const description = input.description?.trim() ?? '';
  const completed = input.completed ?? false;

  const result = await pool.query<Todo>(
    `
      INSERT INTO todos (title, description, completed, user_id, tags, deadline)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, title, description, completed, created_at as "createdAt", tags, deadline
    `,
    [input.title, description, completed, userId, tags, deadline]
  );

  return result.rows[0];
}

/**
 * Login a test user and return auth cookies
 */
export async function loginTestUser(
  app: any,
  email: string = 'test@example.com',
  password: string = 'password123'
): Promise<string[]> {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  const cookies = response.headers['set-cookie'] ?? [];
  return Array.isArray(cookies) ? cookies : [cookies];
}

/**
 * Get auth cookie string from response cookies
 */
export function getCookieByName(cookies: string[] = [], name: string): string {
  const found = cookies.find((cookie: string) => cookie.startsWith(`${name}=`));
  return found ? found.split(';')[0] : '';
}

export function buildCookieHeader(cookies: string[], names: string[]): string {
  const byName = names
    .map(name => getCookieByName(cookies, name))
    .filter(Boolean);
  return byName.join('; ');
}
