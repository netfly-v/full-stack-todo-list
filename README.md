# Full-Stack Todo Monorepo

Full-stack pet-project для изучения backend-разработки: авторизация, роли пользователей (RBAC), CRUD задач, профиль с аватаром, PostgreSQL, тесты и деплой в облако.

## Что внутри

- `frontend` — React + TypeScript + Vite + React Query.
- `backend` — Express + TypeScript + PostgreSQL.
- `docs` — пояснения по архитектуре и реализованным модулям.
- `docker-compose.yml` — локальный Postgres + backend в Docker.

## Технологии

- **Frontend:** React, TypeScript, React Router, React Query, Axios, Vite
- **Backend:** Node.js, Express, TypeScript, Zod, JWT, Multer, Sharp
- **Data:** PostgreSQL + SQL migrations
- **Testing:** Jest + Supertest
- **Deploy stack:** Vercel (frontend) + Render (backend) + Neon (PostgreSQL)

## Ключевые фичи

- JWT auth через HTTP-only cookies (`access_token` + `refresh_token`)
- RBAC роли: `user`, `admin`, `superadmin`
- Todo API: CRUD + фильтрация + поиск + пагинация + статистика
- Профиль пользователя + загрузка и обработка аватара
- Swagger UI для просмотра API-эндпоинтов

## API docs (Swagger)

- Local: `http://localhost:3001/api/docs`
- JSON schema: `http://localhost:3001/api/docs.json`
- Production: `<RENDER_BACKEND_URL>/api/docs`

## Local Setup

### 1) Установка зависимостей

```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2) Переменные окружения

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3) Запуск PostgreSQL

```bash
docker compose up -d postgres
```

### 4) Запуск приложения

```bash
npm run dev
```

Открой:

- Frontend: `http://localhost:3002`
- Backend health: `http://localhost:3001/`
- Swagger: `http://localhost:3001/api/docs`

## Production Setup (Vercel + Render + Neon)

### 1) Neon (PostgreSQL)

1. Создай бесплатный проект в Neon.
2. Возьми connection string (`DATABASE_URL`) c `sslmode=require`.
3. Сохрани `DATABASE_URL` для Render.

### 2) Render (Backend)

Вариант A (рекомендуется): используй `render.yaml` из корня репозитория.

Вариант B (ручной):

- Root Directory: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`

Добавь environment variables:

- `NODE_ENV=production`
- `DATABASE_URL=<Neon URL>`
- `FRONTEND_URL=<Vercel frontend URL>`
- `PUBLIC_API_URL=<Render backend URL>`
- `ACCESS_TOKEN_SECRET=<strong-random>`
- `REFRESH_TOKEN_SECRET=<strong-random>`
- `SUPERADMIN_BOOTSTRAP_SECRET=<strong-random>`

Проверки после деплоя:

- `GET <RENDER_BACKEND_URL>/`
- `GET <RENDER_BACKEND_URL>/api/docs`
- `GET <RENDER_BACKEND_URL>/api/docs.json`

### 3) Vercel (Frontend)

1. Импортируй проект из GitHub.
2. Укажи Root Directory: `frontend`.
3. Добавь env var:
   - `BACKEND_URL=<RENDER_BACKEND_URL>`
4. Убедись, что `frontend/vercel.json` применяется (rewrites `/api/*` и `/uploads/*`).

> Благодаря rewrites браузер работает с тем же доменом фронта (`/api`), а запросы проксируются на backend.

## Публикация в GitHub

```bash
git init
git add .
git commit -m "chore: initial monorepo setup"
git branch -M main
git remote add origin https://github.com/netfly-v/<repo-name>.git
git push -u origin main
```

## Smoke Test Checklist

- [ ] Регистрация и логин работают в production
- [ ] Обновление access token через refresh cookie работает
- [ ] CRUD задач работает
- [ ] Профиль обновляется
- [ ] Аватар загружается и отдается по `/uploads/*`
- [ ] Admin endpoints доступны только для нужных ролей
- [ ] Swagger открывается по `/api/docs`

## Важные документы

- `ROADMAP.md` — направления развития проекта
- `docs/rbac-explained.md` — как реализован RBAC
- `docs/docker-explained.md` — Docker и персистентность данных

## License

MIT
