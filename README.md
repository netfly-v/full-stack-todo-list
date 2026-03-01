# Full-Stack Todo Monorepo

A full-stack pet project built to learn backend development in practice: cookie-based JWT auth, user roles (RBAC), todo CRUD with search and pagination, profile/avatar management, PostgreSQL migrations, tests, and cloud deployment.

## Live URLs

- Frontend (Vercel): `https://full-stack-todo-list-amber.vercel.app`
- Backend API (Render): `https://full-stack-todo-list-53in.onrender.com`
- Backend health check: `https://full-stack-todo-list-53in.onrender.com/healthz`
- Swagger UI: `https://full-stack-todo-list-53in.onrender.com/api/docs/`
- Neon dashboard: `https://console.neon.tech/`

## Demo Credentials

- Email: `admin@todolist.com`
- Password: `Qwerty123`
- Role: `superadmin`

Use the production frontend domain above (`...amber.vercel.app`) for testing.

## Repository Structure

- `frontend` — React + TypeScript + Vite + React Query
- `backend` — Express + TypeScript + PostgreSQL
- `docs` — implementation notes and architecture explanations
- `docker-compose.yml` — local PostgreSQL setup

## Tech Stack

- **Frontend:** React, TypeScript, React Router, React Query, Axios, Vite
- **Backend:** Node.js, Express, TypeScript, Zod, JWT, Multer, Sharp
- **Database:** PostgreSQL with SQL migrations
- **Tests:** Jest + Supertest
- **Deployment:** Vercel (frontend) + Render (backend) + Neon (PostgreSQL)

## Key Features

- JWT authentication via HTTP-only cookies (`access_token` + `refresh_token`)
- RBAC roles: `user`, `admin`, `superadmin`
- Todo API: CRUD + filtering + full-text search + pagination + stats
- User profile management and avatar upload/processing
- OpenAPI/Swagger docs for public API browsing

## Local Development

### 1) Install dependencies

```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2) Configure environment files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3) Start PostgreSQL

```bash
docker compose up -d postgres
```

### 4) Run the app

```bash
npm run dev
```

Open in browser:

- Frontend: `http://localhost:3002`
- Backend root: `http://localhost:3001/`
- Swagger: `http://localhost:3001/api/docs`

## Production Setup (Vercel + Render + Neon)

### Neon (PostgreSQL)

1. Create a Neon project.
2. Copy `DATABASE_URL` with `sslmode=require`.
3. Add it to Render backend environment variables.

### Render (Backend)

This project is deployed as a Docker web service:

- Root Directory: `backend`
- Docker Build Context Directory: `backend`
- Dockerfile Path: `backend/Dockerfile`
- Health Check Path: `/healthz`

Required environment variables:

- `NODE_ENV=production`
- `DATABASE_URL=<Neon connection string>`
- `FRONTEND_URL=<Vercel frontend URL>`
- `PUBLIC_API_URL=<Render backend URL>`
- `ACCESS_TOKEN_SECRET=<strong random secret>`
- `REFRESH_TOKEN_SECRET=<strong random secret>`
- `SUPERADMIN_BOOTSTRAP_SECRET=<strong random secret>`

### Vercel (Frontend)

1. Import this repo in Vercel.
2. Set Root Directory to `frontend`.
3. Deploy.

Rewrites are configured in `frontend/vercel.json` for:

- `/api/*` -> Render backend
- `/uploads/*` -> Render backend

## API Docs

- Local Swagger UI: `http://localhost:3001/api/docs`
- Local OpenAPI JSON: `http://localhost:3001/api/docs.json`
- Production Swagger UI: `https://full-stack-todo-list-53in.onrender.com/api/docs/`

## Smoke Test Checklist

- [ ] Register and login work in production
- [ ] Refresh-cookie flow works after access token expiry
- [ ] Todo CRUD works
- [ ] Profile update works
- [ ] Avatar upload and serving via `/uploads/*` works
- [ ] Admin endpoints are protected by role
- [ ] Swagger opens and documents key endpoints

## Useful Project Docs

- `ROADMAP.md` — project growth plan
- `docs/rbac-explained.md` — RBAC design details
- `docs/docker-explained.md` — Docker persistence notes
- `docs/deploy-vercel-render-neon.md` — deployment walkthrough

## License

MIT
