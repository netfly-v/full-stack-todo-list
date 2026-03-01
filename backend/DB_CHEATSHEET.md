# DB Cheatsheet (PostgreSQL + pg Pool)

This file explains SQL basics and how `pool.query` is used in this project.

## 1) Quick mental model
- **Frontend** sends HTTP to **Backend**
- **Backend** runs **SQL** against **PostgreSQL**
- **PostgreSQL** returns rows
- **Backend** returns JSON to frontend

## 2) Safe parameters in SQL (`$1`, `$2`, ...)
We never insert user input directly into SQL strings. Instead:

```ts
pool.query('SELECT * FROM todos WHERE id = $1', [id]);
```

- `$1`, `$2`, ... are placeholders
- The second argument is an array of values
- `pg` safely binds values (prevents SQL injection)

## 3) Basic SQL commands used here

### SELECT (read)
```sql
SELECT id, title, description, completed
FROM todos
ORDER BY id ASC;
```

With filter:
```sql
SELECT id, title, description, completed
FROM todos
WHERE completed = $1
ORDER BY id ASC;
```

### INSERT (create)
```sql
INSERT INTO todos (title, description, completed)
VALUES ($1, $2, $3)
RETURNING id, title, description, completed;
```

`RETURNING` lets you get the created row immediately.

### UPDATE (edit)
```sql
UPDATE todos
SET title = $1, description = $2, completed = $3
WHERE id = $4
RETURNING id, title, description, completed;
```

### DELETE (remove)
```sql
DELETE FROM todos
WHERE id = $1
RETURNING id, title, description, completed;
```

## 4) Common `pg` Pool usage

### Query with params
```ts
const result = await pool.query<Todo>(
  'SELECT id, title, description, completed FROM todos WHERE id = $1',
  [id]
);
const todo = result.rows[0];
```

### Result shape
- `result.rows` -> array of rows
- `result.rowCount` -> how many rows were affected

## 5) Typical patterns in this project

### GET list
```ts
const result = await pool.query<Todo>(
  'SELECT id, title, description, completed FROM todos ORDER BY id ASC'
);
res.json(result.rows);
```

### GET by id
```ts
const result = await pool.query<Todo>(
  'SELECT id, title, description, completed FROM todos WHERE id = $1',
  [id]
);
if (result.rowCount === 0) return res.status(404).json({ error: 'Todo not found' });
res.json(result.rows[0]);
```

### POST create
```ts
const result = await pool.query<Todo>(
  `
    INSERT INTO todos (title, description, completed)
    VALUES ($1, $2, $3)
    RETURNING id, title, description, completed
  `,
  [title.trim(), description?.trim() || '', false]
);
res.status(201).json(result.rows[0]);
```

### PUT update
```ts
const result = await pool.query<Todo>(
  `
    UPDATE todos
    SET title = $1, description = $2, completed = $3
    WHERE id = $4
    RETURNING id, title, description, completed
  `,
  [updated.title, updated.description, updated.completed, id]
);
res.json(result.rows[0]);
```

### DELETE remove
```ts
const result = await pool.query<Todo>(
  'DELETE FROM todos WHERE id = $1 RETURNING id, title, description, completed',
  [id]
);
if (result.rowCount === 0) return res.status(404).json({ error: 'Todo not found' });
res.json(result.rows[0]);
```

## 6) Optional: DATABASE_URL
You can also use a single connection string:

```
DATABASE_URL=postgresql://todo_user:todo_password@localhost:5432/todo_db
```

If `DATABASE_URL` is set, it overrides `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`.
