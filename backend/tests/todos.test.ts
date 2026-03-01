import request from 'supertest';
import app from '../server';
import { clearTestData, setupTestDb, teardownTestDb } from './setup';
import { buildCookieHeader, createTestTodo, createTestUser, loginTestUser } from './helpers';
import { testTodos } from './fixtures/todos';
import { testUsers } from './fixtures/users';

describe('Todos API', () => {
  let authCookie: string;
  let userId: number;

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestData();
    const user = await createTestUser(testUsers.basic);
    userId = user.id;
    const cookies = await loginTestUser(app, testUsers.basic.email, testUsers.basic.password);
    authCookie = buildCookieHeader(cookies, ['access_token']);
  });

  it('should reject unauthenticated requests', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(401);
  });

  it('should create a new todo', async () => {
    const deadline = new Date(Date.now() + 86400000).toISOString();
    const res = await request(app)
      .post('/api/todos')
      .set('Cookie', authCookie)
      .send({ ...testTodos.basic, deadline });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe(testTodos.basic.title);
    expect(res.body.tags).toEqual(testTodos.basic.tags);
    expect(res.body.deadline).toBe(deadline);
  });

  it('should list todos for current user', async () => {
    await createTestTodo(userId, testTodos.basic);
    await createTestTodo(userId, { ...testTodos.completed, completed: true });

    const res = await request(app)
      .get('/api/todos')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.total).toBe(2);
  });

  it('should update a todo', async () => {
    const todo = await createTestTodo(userId, testTodos.basic);
    const res = await request(app)
      .put(`/api/todos/${todo.id}`)
      .set('Cookie', authCookie)
      .send({ completed: true, tags: ['updated'] });

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
    expect(res.body.tags).toEqual(['updated']);
  });

  it('should delete a todo', async () => {
    const todo = await createTestTodo(userId, testTodos.basic);
    const res = await request(app)
      .delete(`/api/todos/${todo.id}`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(todo.id);
  });

  it('should return stats for current user', async () => {
    const todo1 = await createTestTodo(userId, testTodos.basic);
    await createTestTodo(userId, { ...testTodos.completed, completed: true });

    await request(app)
      .put(`/api/todos/${todo1.id}`)
      .set('Cookie', authCookie)
      .send({ completed: true });

    const res = await request(app)
      .get('/api/todos/stats')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.completed).toBe(2);
    expect(res.body.active).toBe(0);
  });

  it('should not allow access to another user todo', async () => {
    const otherUser = await createTestUser(testUsers.secondary);
    const otherTodo = await createTestTodo(otherUser.id, testTodos.basic);
    const otherCookies = await loginTestUser(app, testUsers.secondary.email, testUsers.secondary.password);
    const otherAuthCookie = buildCookieHeader(otherCookies, ['access_token']);

    const res = await request(app)
      .get(`/api/todos/${otherTodo.id}`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(404);

    const resOther = await request(app)
      .get(`/api/todos/${otherTodo.id}`)
      .set('Cookie', otherAuthCookie);

    expect(resOther.status).toBe(200);
    expect(resOther.body.id).toBe(otherTodo.id);
  });
});
