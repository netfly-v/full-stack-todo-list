import request from 'supertest';
import app from '../server';
import { clearTestData, setupTestDb, teardownTestDb } from './setup';
import { UserRole } from '../types';
import { buildCookieHeader, createTestUser, loginTestUser } from './helpers';

describe('Superadmin API', () => {
  beforeAll(async () => {
    process.env.SUPERADMIN_BOOTSTRAP_SECRET = 'test_bootstrap_secret';
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestData();
  });

  it('should require bootstrap secret', async () => {
    await createTestUser({ email: 'target@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/admin/boot-superadmin')
      .send({ email: 'target@example.com' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('should bootstrap superadmin with valid secret', async () => {
    await createTestUser({ email: 'target@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/admin/boot-superadmin')
      .set('x-bootstrap-secret', 'test_bootstrap_secret')
      .send({ email: 'target@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.user.role).toBe('superadmin');
  });

  it('should allow superadmin to change roles', async () => {
    await createTestUser({ email: 'superadmin@example.com', password: 'password123', role: UserRole.Superadmin });
    const target = await createTestUser({ email: 'user@example.com', password: 'password123', role: UserRole.User });
    const cookies = await loginTestUser(app, 'superadmin@example.com', 'password123');
    const authCookie = buildCookieHeader(cookies, ['access_token']);

    const res = await request(app)
      .put(`/api/admin/users/${target.id}/role`)
      .set('Cookie', authCookie)
      .send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('admin');
  });

  it('should forbid admin from changing roles', async () => {
    await createTestUser({ email: 'admin@example.com', password: 'password123', role: UserRole.Admin });
    const target = await createTestUser({ email: 'user@example.com', password: 'password123', role: UserRole.User });
    const cookies = await loginTestUser(app, 'admin@example.com', 'password123');
    const authCookie = buildCookieHeader(cookies, ['access_token']);

    const res = await request(app)
      .put(`/api/admin/users/${target.id}/role`)
      .set('Cookie', authCookie)
      .send({ role: 'admin' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });
});
