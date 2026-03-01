import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

const pool = new Pool(
  databaseUrl
    ? { connectionString: databaseUrl }
    : {
        host: process.env.PGHOST ?? 'localhost',
        port: Number(process.env.PGPORT ?? 5432),
        user: process.env.PGUSER ?? 'todo_user',
        password: process.env.PGPASSWORD ?? 'todo_password',
        database: process.env.PGDATABASE ?? 'todo_db',
      }
);

export default pool;
