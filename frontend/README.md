# Frontend (React + Vite)

## Команды

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Переменные окружения

Скопируй шаблон:

```bash
cp .env.example .env
```

Доступные переменные:

- `VITE_UPLOADS_BASE_URL` — базовый URL для аватаров/файлов.
  - Оставь пустым при использовании rewrites (`/uploads/*`) на Vercel.
  - Укажи полный URL backend только если нужен прямой доступ к файлам.

## API

Frontend использует относительный `baseURL: /api`, поэтому:

- локально запросы идут через Vite proxy на `http://localhost:3001`;
- в production запросы идут через Vercel rewrites (`frontend/vercel.json`).
