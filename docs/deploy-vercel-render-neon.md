# Deploy Guide: Vercel + Render + Neon

Пошаговый гайд для бесплатного деплоя монорепо.

## 1. Neon (database)

1. Создай проект в Neon.
2. Открой созданную БД и скопируй connection string.
3. Убедись, что строка подключения содержит `sslmode=require`.
4. Это значение пойдет в `DATABASE_URL` на Render.

## 2. Render (backend)

### Быстро через Blueprint

1. В Render выбери **New +** -> **Blueprint**.
2. Укажи этот репозиторий.
3. Render прочитает `render.yaml` и создаст сервис.

### Переменные окружения

Обязательно добавь:

- `DATABASE_URL`
- `FRONTEND_URL`
- `PUBLIC_API_URL`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `SUPERADMIN_BOOTSTRAP_SECRET`
- `NODE_ENV=production`

`FRONTEND_URL` можно указать как один URL или через запятую несколько:

```text
https://your-frontend.vercel.app,https://preview-frontend.vercel.app
```

### Проверка backend

- `<RENDER_BACKEND_URL>/`
- `<RENDER_BACKEND_URL>/api/docs`
- `<RENDER_BACKEND_URL>/api/docs.json`

## 3. Vercel (frontend)

1. Импортируй репозиторий в Vercel.
2. Выбери Root Directory: `frontend`.
3. Добавь env var `BACKEND_URL` со значением Render backend URL.
4. Проверь, что rewrites из `frontend/vercel.json` активны.

## 4. RBAC bootstrap (superadmin)

После деплоя можно назначить первого superadmin:

```bash
curl -X POST <RENDER_BACKEND_URL>/api/admin/boot-superadmin \
  -H "Content-Type: application/json" \
  -H "x-bootstrap-secret: <SUPERADMIN_BOOTSTRAP_SECRET>" \
  -d '{"email":"your-user-email@example.com"}'
```

## 5. Smoke tests

1. Зарегистрируй пользователя.
2. Проверь создание/редактирование/удаление todo.
3. Проверь загрузку аватара.
4. Открой Swagger.
5. Проверь админ-роуты после bootstrap superadmin.
