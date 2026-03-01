import request from 'supertest';
import app from '../server';
import { clearTestData, setupTestDb, teardownTestDb } from './setup';
import { buildCookieHeader, createTestUser, loginTestUser } from './helpers';
import { testUsers } from './fixtures/users';

describe('Auth API', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestData();
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testUsers.basic.email, password: testUsers.basic.password });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', testUsers.basic.email);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should reject invalid registration payload', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation error');
  });

  it('should reject duplicate registration', async () => {
    await createTestUser(testUsers.basic);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testUsers.basic.email, password: testUsers.basic.password });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('User already exists');
  });

  it('should login a user with valid credentials', async () => {
    await createTestUser(testUsers.basic);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUsers.basic.email, password: testUsers.basic.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should reject login with invalid credentials', async () => {
    await createTestUser(testUsers.basic);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUsers.basic.email, password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('should return current user for /api/auth/me', async () => {
    await createTestUser(testUsers.basic);
    const cookies = await loginTestUser(app, testUsers.basic.email, testUsers.basic.password);
    const authCookie = buildCookieHeader(cookies, ['access_token']);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('email', testUsers.basic.email);
  });

  it('should refresh tokens with valid refresh cookie', async () => {
    await createTestUser(testUsers.basic);
    const cookies = await loginTestUser(app, testUsers.basic.email, testUsers.basic.password);
    const refreshCookie = buildCookieHeader(cookies, ['refresh_token']);

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(res.headers['set-cookie']).toBeDefined();
  });
});
