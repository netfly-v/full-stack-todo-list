import request from 'supertest';
import app from '../server';
import { UserRole } from '../types';
import { clearTestData, setupTestDb, teardownTestDb } from './setup';
import { buildCookieHeader, createTestTodo, createTestUser, loginTestUser } from './helpers';

describe('Admin API', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestData();
  });

  it('should forbid access to non-admin users', async () => {
    await createTestUser({ email: 'user@example.com', password: 'password123', role: UserRole.User });
    const cookies = await loginTestUser(app, 'user@example.com', 'password123');
    const authCookie = buildCookieHeader(cookies, ['access_token']);

    const res = await request(app)
      .get('/api/admin/todos')
      .set('Cookie', authCookie);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('should allow admin to access all todos', async () => {
    const admin = await createTestUser({ email: 'admin@example.com', password: 'password123', role: UserRole.Admin });
    const user = await createTestUser({ email: 'user2@example.com', password: 'password123', role: UserRole.User });

    await createTestTodo(admin.id, { title: 'Admin todo', description: 'Admin task' });
    await createTestTodo(user.id, { title: 'User todo', description: 'User task' });

    const cookies = await loginTestUser(app, 'admin@example.com', 'password123');
    const authCookie = buildCookieHeader(cookies, ['access_token']);

    const res = await request(app)
      .get('/api/admin/todos')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body.items.length).toBe(2);
  });
});
