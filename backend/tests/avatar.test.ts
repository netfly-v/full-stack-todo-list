import request from 'supertest';
import app from '../server';
import { clearTestData, setupTestDb, teardownTestDb } from './setup';
import { buildCookieHeader, createTestUser, loginTestUser } from './helpers';
import { getValidAvatarBuffer } from './fixtures/avatar';
import { testUsers } from './fixtures/users';

describe('Avatar API', () => {
  let authCookie: string;

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestData();
    await createTestUser(testUsers.basic);
    const cookies = await loginTestUser(app, testUsers.basic.email, testUsers.basic.password);
    authCookie = buildCookieHeader(cookies, ['access_token']);
  });

  it('should upload and delete avatar image', async () => {
    const uploadRes = await request(app)
      .post('/api/profile/avatar')
      .set('Cookie', authCookie)
      .attach('avatar', getValidAvatarBuffer(), {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body).toHaveProperty('avatar_url');
    expect(uploadRes.body.avatar_url).toMatch(/\/uploads\/avatars\//);

    const deleteRes = await request(app)
      .delete('/api/profile/avatar')
      .set('Cookie', authCookie);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.avatar_url).toBeNull();
  });

  it('should reject invalid file types', async () => {
    const res = await request(app)
      .post('/api/profile/avatar')
      .set('Cookie', authCookie)
      .attach('avatar', Buffer.from('not-an-image'), {
        filename: 'avatar.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(500);
  });
});
