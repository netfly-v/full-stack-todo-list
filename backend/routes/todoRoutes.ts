// Routes file - defines all endpoints for todos
// Think of this like Next.js pages, but for API
import express, { Request, Response } from 'express';
import type { AuthPayload, CreateTodoDto, UpdateTodoDto, Todo, TodoFilter, TodosPage, TodosStats } from '../types';
import pool from '../db';
import { createTodoSchema, formatZodErrors, todoListQuerySchema, updateTodoSchema } from '../validators';
import { requireAuth } from './authRoutes';

const router = express.Router();

router.use(requireAuth);

const normalizeTags = (tags?: string[]) =>
  (tags ?? []).map(tag => tag.trim()).filter(tag => tag.length > 0);

// GET /api/todos - Get all todos (with optional filtering)
// Like fetching data in React useEffect
// Supports: ?filter=all|active|completed
router.get('/', async (req: Request, res: Response) => {
  const parsed = todoListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation error', details: formatZodErrors(parsed.error.issues) });
  }

  const { filter, q, page, page_size } = parsed.data;
  const auth = res.locals.auth as AuthPayload;
  const normalizedQuery = q?.trim();
  const searchQuery = normalizedQuery && normalizedQuery.length >= 2 ? normalizedQuery : undefined;
  const pageNumber = page ?? 0;
  const pageSize = page_size ?? 5;

  try {
    let whereSql = 'WHERE user_id = $1';
    const params: Array<boolean | number | string | string[]> = [auth.userId];
    // $1 uses params[0], $2 uses params[1], and so on (position-based SQL params).

    if (filter === 'active') {
      whereSql += ' AND completed = $2';
      params.push(false);
    }
    if (filter === 'completed') {
      whereSql += ' AND completed = $2';
      params.push(true);
    }

    if (searchQuery) {
      const searchIndex = params.length + 1;
      const tagsIndex = params.length + 2;
      const tagTokens = searchQuery.split(/\s+/).map(token => token.trim()).filter(token => token.length > 0);
      whereSql += ` AND (to_tsvector('simple', title || ' ' || description) @@ plainto_tsquery('simple', $${searchIndex})`;
      whereSql += ` OR tags && $${tagsIndex})`;
      params.push(searchQuery, tagTokens);
    }

    const countResult = await pool.query<{ total: number }>(
      `SELECT COUNT(*)::int as total FROM todos ${whereSql}`,
      params
    );
    const total = countResult.rows[0]?.total ?? 0;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    const dataParams = [...params, pageSize, pageNumber * pageSize];
    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;
    const dataQuery =
      `SELECT id, title, description, completed, created_at as "createdAt", tags, deadline FROM todos ${whereSql}` +
      ' ORDER BY created_at DESC, id DESC' +
      ` LIMIT $${limitIndex} OFFSET $${offsetIndex}`;

    const result = await pool.query<Todo>(dataQuery, dataParams);

    const response: TodosPage = {
      items: result.rows,
      page: pageNumber,
      page_size: pageSize,
      total,
      total_pages: totalPages,
      has_previous: pageNumber > 0,
      has_next: totalPages > 0 && pageNumber + 1 < totalPages,
    };
    res.json(response);
  } catch (error) {
    console.error('Failed to fetch todos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/todos/stats - Get counts for all todos
router.get('/stats', async (_req: Request, res: Response) => {
  const auth = res.locals.auth as AuthPayload;

  try {
    const result = await pool.query<TodosStats>(
      `
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE completed = false)::int AS active,
          COUNT(*) FILTER (WHERE completed = true)::int AS completed
        FROM todos
        WHERE user_id = $1
      `,
      [auth.userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to fetch todo stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/todos/:id - Get single todo by id
router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const auth = res.locals.auth as AuthPayload;

  try {
    const result = await pool.query<Todo>(
      'SELECT id, title, description, completed, created_at as "createdAt", tags, deadline FROM todos WHERE id = $1 AND user_id = $2',
      [id, auth.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to fetch todo by id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/todos - Create new todo
// Like submitting a form in React
router.post('/', async (req: Request<{}, {}, CreateTodoDto>, res: Response) => {
  const parsed = createTodoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation error', details: formatZodErrors(parsed.error.issues) });
  }

  const { title, description } = parsed.data;
  const { tags, deadline } = parsed.data;
  const auth = res.locals.auth as AuthPayload;
  const normalizedTags = normalizeTags(tags);

  try {
    const result = await pool.query<Todo>(
      `
        INSERT INTO todos (title, description, completed, user_id, tags, deadline)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, title, description, completed, created_at as "createdAt", tags, deadline
      `,
      [title, description?.trim() || '', false, auth.userId, normalizedTags, deadline ?? null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to create todo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/todos/:id - Update todo
router.put('/:id', async (req: Request<{ id: string }, {}, UpdateTodoDto>, res: Response) => {
  const id = parseInt(req.params.id);
  const parsed = updateTodoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation error', details: formatZodErrors(parsed.error.issues) });
  }

  const { title, completed, description, tags, deadline } = parsed.data;
  const auth = res.locals.auth as AuthPayload;

  try {
    const existingResult = await pool.query<Todo>(
      'SELECT id, title, description, completed, created_at as "createdAt", tags, deadline FROM todos WHERE id = $1 AND user_id = $2',
      [id, auth.userId]
    );

    if (existingResult.rowCount === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const existing = existingResult.rows[0];
    const updated = {
      title: title !== undefined ? title : existing.title,
      description: description !== undefined ? description.trim() : existing.description,
      completed: completed !== undefined ? completed : existing.completed,
      tags: tags !== undefined ? normalizeTags(tags) : existing.tags,
      deadline: deadline !== undefined ? deadline : existing.deadline,
    };

    const result = await pool.query<Todo>(
      `
        UPDATE todos
        SET title = $1, description = $2, completed = $3, tags = $4, deadline = $5
        WHERE id = $6 AND user_id = $7
        RETURNING id, title, description, completed, created_at as "createdAt", tags, deadline
      `,
      [updated.title, updated.description, updated.completed, updated.tags, updated.deadline, id, auth.userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update todo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/todos/:id - Delete todo
router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const auth = res.locals.auth as AuthPayload;

  try {
    const result = await pool.query<Todo>(
      'DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING id, title, description, completed, created_at as "createdAt", tags, deadline',
      [id, auth.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to delete todo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
