import request from 'supertest';
import app from '../server';
import { clearTestData, setupTestDb, teardownTestDb } from './setup';
import { buildCookieHeader, createTestUser, loginTestUser } from './helpers';
import { testUsers } from './fixtures/users';

describe('Profile API', () => {
  let authCookie: string;
  let testUserId: number;

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestData();
    const user = await createTestUser(testUsers.basic);
    testUserId = user.id;
    const cookies = await loginTestUser(app, testUsers.basic.email, testUsers.basic.password);
    authCookie = buildCookieHeader(cookies, ['access_token']);
  });

  describe('GET /api/profile', () => {
    it('should return user profile', async () => {
      const res = await request(app).get('/api/profile').set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', testUserId);
      expect(res.body).toHaveProperty('email', testUsers.basic.email);
      expect(res.body).toHaveProperty('name', testUsers.basic.name);
      expect(res.body).toHaveProperty('bio', testUsers.basic.bio);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/api/profile');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/profile', () => {
    it('should update profile name and bio', async () => {
      const res = await request(app)
        .put('/api/profile')
        .set('Cookie', authCookie)
        .send({ name: 'John Doe', bio: 'Software developer' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('John Doe');
      expect(res.body.bio).toBe('Software developer');
    });

    it('should validate name length', async () => {
      const longName = 'a'.repeat(101);
      const res = await request(app).put('/api/profile').set('Cookie', authCookie).send({ name: longName });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation error');
    });

    it('should return 400 when no fields provided', async () => {
      const res = await request(app).put('/api/profile').set('Cookie', authCookie).send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('No fields to update');
    });
  });
});
