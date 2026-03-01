## Поиск и пагинация (backend + frontend)

Ниже — что именно добавили для поиска, page‑пагинации и индексов, и как это работает.
Фокус на файлах: `backend/routes/todoRoutes.ts`, `backend/validators.ts`, `backend/migrations/004_add_todos_search_indexes.sql`,
`frontend/src/api/todos.ts`, `frontend/src/hooks/useTodos.ts`, `frontend/src/App.tsx`.

---

## 1) Query‑параметры GET /api/todos

Поддерживаются параметры:

- `filter`: `all | active | completed`
- `q`: строка поиска (минимум 2 символа)
- `page`: номер страницы (начинается с 0)
- `page_size`: размер страницы (по умолчанию 5, максимум 100)

Ответ теперь не просто массив, а объект:

```ts
{
  items: Todo[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}
```

---

## 2) Page‑пагинация (как работает)

Мы сортируем задачи по `created_at DESC, id DESC` и используем:

- `LIMIT page_size`
- `OFFSET page * page_size`

Дополнительно считаем `COUNT(*)` для `total`, чтобы отдать `total_pages`, `has_next` и `has_previous`.

---

## 3) Поиск по title, description и tags

Поиск реализован как единая строка `q`:

- `title` и `description`: через полнотекстовый поиск
  `to_tsvector('simple', title || ' ' || description) @@ plainto_tsquery('simple', $q)`
- `tags`: через пересечение массивов
  `tags && $tagsArray`

Если `q` короче 2 символов — поиск не применяется.

---

## 4) Индексы

Добавлены индексы в `backend/migrations/004_add_todos_search_indexes.sql`:

- `idx_todos_user_created_id` — ускоряет сортировку и page‑пагинацию
- `idx_todos_tags_gin` — ускоряет поиск по `tags`
- `idx_todos_search_tsv` — ускоряет полнотекстовый поиск по `title/description`

---

## 5) Фронтенд

- `todoApi.getTodos` принимает `{ filter, q, page, page_size }`
- `useTodos` использует `useInfiniteQuery` c page‑параметром
- В `App.tsx` есть поиск с дебаунсом и кнопка «Загрузить ещё»

При изменении `filter` или `q` React Query сбрасывает страницы (новый queryKey).

---

## 6) Статистика (общее количество)

Чтобы счётчики «Всего / Активных / Выполнено» не зависели от выбранного фильтра,
добавлен отдельный эндпоинт:

- `GET /api/todos/stats`

Ответ:

```ts
{
  total: number;
  active: number;
  completed: number;
}
```
