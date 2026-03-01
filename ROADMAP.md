# 🗺️ Roadmap - План развития проекта

Этот документ содержит идеи для дальнейшего усложнения и развития проекта, чтобы глубже изучить backend-разработку.

## 📋 Текущий статус

✅ **Реализовано:**
- Базовая архитектура (Express + TypeScript)
- PostgreSQL с миграциями
- JWT аутентификация (access + refresh tokens)
- CRUD операции для задач
- Фильтрация, поиск и пагинация
- Валидация с Zod
- React frontend с React Query

## 🚀 Фаза 1: Основы (в процессе)

### 1. Личный кабинет с загрузкой фото ⏳
**Статус:** В разработке

**Что изучим:**
- 📸 Загрузка файлов (`multer`)
- 🖼️ Обработка изображений (`sharp`)
- 🗄️ Работа с файловой системой
- 🔒 Валидация и безопасность файлов
- 🧪 Тестирование API (Jest + Supertest)

**Функционал:**
- Просмотр и редактирование профиля
- Загрузка и удаление аватара
- Поля: имя, биография, фото

---

### 2. Система ролей (RBAC) 📋
**Сложность:** Средняя  
**Приоритет:** Высокий

**Что изучим:**
- 👥 Role-Based Access Control
- 🛡️ Authorization vs Authentication
- 🔐 Middleware для проверки прав
- 📊 Расширение JWT payload

**Функционал:**
- Роли: `user`, `admin`
- Middleware: `requireRole(['admin'])`
- Разные права доступа для разных ролей

**Изменения в БД:**
```sql
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
CREATE INDEX idx_users_role ON users(role);
```

**Backend:**
- `middleware/requireRole.ts` - проверка роли
- Обновление JWT payload (добавить role)
- Защита эндпоинтов по ролям

**Frontend:**
- Условный рендеринг по ролям
- Скрытие админ-функций от обычных юзеров

---

### 3. Админ-панель 🎛️
**Сложность:** Средняя  
**Приоритет:** Высокий  
**Зависит от:** Система ролей

**Что изучим:**
- 🔍 Получение данных других пользователей
- 📈 Агрегация данных
- 🎭 Разделение прав (user vs admin endpoints)

**Функционал:**
- Просмотр всех пользователей
- Просмотр всех задач (с фильтрацией по пользователю)
- Статистика: количество юзеров, задач, активность
- Управление пользователями (блокировка, удаление)

**Endpoints:**
```
GET  /api/admin/users          - список всех пользователей
GET  /api/admin/users/:id      - профиль пользователя
GET  /api/admin/todos          - все задачи всех пользователей
GET  /api/admin/stats          - общая статистика
PUT  /api/admin/users/:id      - изменить роль/статус пользователя
DELETE /api/admin/users/:id    - удалить пользователя
```

**Frontend:**
- Отдельная страница `/admin`
- Таблица пользователей с сортировкой
- Таблица всех задач с фильтрами
- Дашборд со статистикой

---

## 🚀 Фаза 2: Средний уровень

### 4. Email уведомления 📧
**Сложность:** Средняя  
**Приоритет:** Средний

**Что изучим:**
- 📬 Отправка email через `nodemailer`
- 🔑 Работа с внешними API (SMTP)
- ⏰ Планировщик задач (`node-cron`)
- 🎨 HTML шаблоны для email

**Функционал:**
- Email верификация при регистрации
- Сброс пароля через email
- Напоминания о задачах с дедлайном
- Еженедельный дайджест задач

**Технологии:**
- `nodemailer` - отправка email
- `handlebars` или `ejs` - шаблоны
- `node-cron` - планировщик
- Mailtrap (dev) / SendGrid (prod)

**Изменения в БД:**
```sql
ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_token TEXT,
ADD COLUMN reset_password_token TEXT,
ADD COLUMN reset_password_expires TIMESTAMPTZ;
```

---

### 5. Rate Limiting & Throttling 🚦
**Сложность:** Низкая  
**Приоритет:** Высокий (безопасность!)

**Что изучим:**
- 🛡️ Защита от DDoS и брутфорса
- ⏱️ Ограничение запросов
- 🗄️ Хранение счетчиков (память/Redis)

**Функционал:**
- Лимит на регистрацию/логин (защита от брутфорса)
- Лимит на создание задач (защита от спама)
- Разные лимиты для разных ролей

**Технологии:**
- `express-rate-limit`
- `express-slow-down`
- Redis для распределенных систем

**Примеры:**
```typescript
// 5 попыток входа в 15 минут
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts'
});

// 100 запросов в час для обычного юзера
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  skip: (req) => req.user?.role === 'admin' // админы без лимитов
});
```

---

### 6. Логирование действий (Audit Log) 📝
**Сложность:** Средняя  
**Приоритет:** Средний

**Что изучим:**
- 📊 Логирование в БД
- 🕰️ История изменений
- 🔍 Трекинг пользовательских действий

**Функционал:**
- Запись всех действий пользователей
- История изменений задач (кто, когда, что изменил)
- Просмотр audit log в админ-панели

**Изменения в БД:**
```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
```

**Примеры логов:**
- `USER_REGISTERED`, `USER_LOGGED_IN`
- `TODO_CREATED`, `TODO_UPDATED`, `TODO_DELETED`
- `PROFILE_UPDATED`, `AVATAR_UPLOADED`

---

### 7. Экспорт данных 📄
**Сложность:** Средняя  
**Приоритет:** Низкий

**Что изучим:**
- 📊 Генерация CSV
- 📄 Генерация PDF
- 📥 Streaming больших файлов

**Функционал:**
- Экспорт задач в CSV
- Экспорт отчета в PDF
- Экспорт профиля со всеми данными (GDPR)

**Технологии:**
- `csv-writer` или `fast-csv`
- `pdfkit` или `puppeteer`
- Streaming для больших объемов

---

## 🚀 Фаза 3: Продвинутый уровень

### 8. Совместные задачи (Shared Todos) 👥
**Сложность:** Высокая  
**Приоритет:** Средний

**Что изучим:**
- 🔗 Many-to-many отношения в БД
- 🎫 Система приглашений
- 🔐 Разные уровни доступа

**Функционал:**
- Несколько пользователей работают над одной задачей
- Роли в задаче: owner, editor, viewer
- Приглашения по email
- Лента активности (кто что изменил)

**Изменения в БД:**
```sql
-- Связь пользователей и задач (many-to-many)
CREATE TABLE todo_users (
  todo_id INTEGER REFERENCES todos(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'viewer', -- owner, editor, viewer
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (todo_id, user_id)
);

-- Приглашения
CREATE TABLE todo_invitations (
  id SERIAL PRIMARY KEY,
  todo_id INTEGER REFERENCES todos(id) ON DELETE CASCADE,
  inviter_id INTEGER REFERENCES users(id),
  invitee_email TEXT NOT NULL,
  role TEXT DEFAULT 'viewer',
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Endpoints:**
```
POST   /api/todos/:id/share        - пригласить пользователя
DELETE /api/todos/:id/share/:userId - удалить доступ
GET    /api/todos/shared           - задачи, расшаренные со мной
```

---

### 9. Redis кэширование ⚡
**Сложность:** Высокая  
**Приоритет:** Средний

**Что изучим:**
- 🗄️ Подключение Redis
- ⚡ Кэширование запросов
- ⏰ TTL (Time To Live)
- 🔄 Инвалидация кэша

**Функционал:**
- Кэширование списка задач
- Кэширование профиля пользователя
- Кэширование статистики
- Инвалидация при изменениях

**Технологии:**
- `redis` или `ioredis`
- Docker compose для Redis

**Пример:**
```typescript
// Кэширование на 5 минут
const cacheKey = `todos:${userId}:${filter}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const todos = await db.query(...);
await redis.setex(cacheKey, 300, JSON.stringify(todos));
```

---

### 10. WebSockets для real-time ⚡
**Сложность:** Высокая  
**Приоритет:** Высокий (для продвинутых)

**Что изучим:**
- 🔌 Socket.io интеграция
- 📡 Real-time обновления
- 🎭 Rooms и namespaces
- 🔐 Аутентификация WebSocket

**Функционал:**
- Видеть изменения задач в реальном времени
- Онлайн-статус пользователей
- Уведомления в реальном времени
- Live-collaboration (несколько пользователей редактируют одну задачу)

**Технологии:**
- `socket.io`
- JWT для аутентификации WebSocket

**События:**
```typescript
// Backend
io.to(userId).emit('todo:created', newTodo);
io.to(userId).emit('todo:updated', updatedTodo);
io.to(userId).emit('todo:deleted', todoId);

// Frontend
socket.on('todo:created', (todo) => {
  queryClient.setQueryData(['todos'], (old) => [...old, todo]);
});
```

---

## 🔧 Инфраструктура и DevOps

### 11. CI/CD Pipeline 🔄
**Что изучим:**
- GitHub Actions
- Автоматические тесты
- Автоматический деплой
- Docker образы

### 12. Деплой в production 🚀
**Где деплоить:**
- Frontend: Vercel / Netlify
- Backend: Railway / Render / Fly.io
- БД: Supabase / Neon / Railway
- Файлы: AWS S3 / Cloudinary

### 13. Мониторинг и логирование 📊
**Технологии:**
- `winston` или `pino` для логов
- Sentry для ошибок
- Health checks
- Metrics (Prometheus)

---

## 📚 Дополнительные идеи

### 14. Продвинутые фичи
- 🔍 Elasticsearch для полнотекстового поиска
- 📅 Календарь задач (интеграция с Google Calendar)
- 🤖 Telegram бот для управления задачами
- 📱 Mobile API (оптимизация для мобилок)
- 🌐 Мультиязычность (i18n)
- 🎨 Темы оформления (dark/light mode)
- 📎 Прикрепление файлов к задачам
- 🏷️ Продвинутая система тегов (иерархия, цвета)
- 📈 Аналитика и отчеты
- 🔔 Push-уведомления

### 15. Безопасность
- 🔒 Two-Factor Authentication (2FA)
- 🛡️ CSRF защита
- 🔐 Content Security Policy (CSP)
- 🚫 Input sanitization (XSS защита)
- 🔑 OAuth (Google, GitHub login)

---

## 📖 Рекомендуемый порядок изучения

### Для начинающих backend-разработчиков:
1. ✅ **Личный кабинет + файлы** (Фаза 1.1) - основы работы с файлами
2. ✅ **Система ролей** (Фаза 1.2) - авторизация
3. ✅ **Админ-панель** (Фаза 1.3) - закрепление
4. 📧 **Email уведомления** (Фаза 2.4) - внешние сервисы
5. 🚦 **Rate Limiting** (Фаза 2.5) - безопасность

### Для перехода на средний уровень:
6. 📝 **Audit Log** (Фаза 2.6) - сложные схемы БД
7. 👥 **Shared Todos** (Фаза 3.8) - many-to-many
8. ⚡ **Redis** (Фаза 3.9) - оптимизация

### Для продвинутых:
9. 🔌 **WebSockets** (Фаза 3.10) - real-time
10. 🔄 **CI/CD** (Инфраструктура 11) - автоматизация
11. 🚀 **Production deploy** (Инфраструктура 12) - реальный проект

---

## 🎯 Цели обучения по фазам

### Фаза 1: Основы
✅ Файлы, авторизация, базовая безопасность

### Фаза 2: Средний уровень
✅ Внешние сервисы, безопасность, сложные схемы БД

### Фаза 3: Продвинутый
✅ Real-time, оптимизация, масштабирование

---

## 💡 Советы

1. **Не торопись** - лучше качественно изучить одну фичу, чем поверхностно 10
2. **Пиши тесты** - на бэкенде это критически важно
3. **Документируй** - будущий ты скажет спасибо
4. **Читай код** - изучай как реализованы похожие фичи в open-source
5. **Экспериментируй** - не бойся ломать и переделывать

---

## 📝 Примечания

Этот roadmap - не строгий план, а набор идей для изучения. Выбирай то, что интересно, и адаптируй под свои цели. Главное - практика и понимание концепций, а не количество реализованных фич.

Удачи в изучении backend-разработки! 🚀
