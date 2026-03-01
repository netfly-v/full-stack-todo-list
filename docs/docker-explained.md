# 🐳 Docker и PostgreSQL - Объяснение

Этот документ объясняет как работает Docker в проекте и как правильно управлять данными.

## 📦 Что такое Docker Volumes

**Volume** - это способ хранения данных Docker контейнера, которые сохраняются даже после удаления контейнера.

### Без volume
```
Контейнер → Данные внутри → docker compose down → ❌ Данные потеряны
```

### С volume (наш случай)
```
Контейнер → Volume (todo_pgdata) → docker compose down → ✅ Данные сохранены
```

## 🗂️ Структура в нашем проекте

```yaml
# docker-compose.yml
services:
  postgres:
    volumes:
      - todo_pgdata:/var/lib/postgresql/data  # Данные PostgreSQL

volumes:
  todo_pgdata:  # Named volume - сохраняется между перезапусками
```

**Что хранится в `todo_pgdata`:**
- Все таблицы (`users`, `todos`, `schema_migrations`)
- Все данные (пользователи, задачи)
- Индексы
- Конфигурация PostgreSQL

## ⚠️ Опасные команды

### `docker compose down -v` 
**УДАЛЯЕТ ВСЕ VOLUMES!**

```bash
docker compose down -v
# ❌ Все данные в БД будут удалены!
# ❌ Все зарегистрированные пользователи исчезнут
# ❌ Все задачи будут потеряны
```

**Когда использовать:**
- Нужно полностью очистить БД (например, после неудачной миграции)
- Хотите начать с чистого листа
- Тестирование установки

**После этого нужно:**
```bash
docker compose up -d
npm run migrate  # Восстановить схему БД
# Заново зарегистрироваться
```

## ✅ Правильные команды

### Остановка (данные сохраняются)
```bash
docker compose down
# ✅ Контейнеры остановлены
# ✅ Volume todo_pgdata сохранен
# ✅ При следующем запуске все данные будут на месте
```

### Перезапуск
```bash
docker compose restart
# ✅ Контейнеры перезапущены
# ✅ Данные не трогаются
```

### Остановка и запуск заново
```bash
docker compose down
docker compose up -d
# ✅ Контейнеры пересозданы
# ✅ Volume подключен обратно
# ✅ Все данные на месте
```

### Просмотр логов
```bash
# Логи PostgreSQL
docker compose logs -f postgres

# Логи backend
docker compose logs -f backend

# Все логи
docker compose logs -f
```

## 📊 Управление volumes

### Посмотреть все volumes
```bash
docker volume ls
```

Вывод:
```
DRIVER    VOLUME NAME
local     backend-todo-api_todo_pgdata
```

### Информация о volume
```bash
docker volume inspect backend-todo-api_todo_pgdata
```

Вывод:
```json
[
    {
        "CreatedAt": "2026-01-26T20:41:00Z",
        "Driver": "local",
        "Mountpoint": "/var/lib/docker/volumes/backend-todo-api_todo_pgdata/_data",
        "Name": "backend-todo-api_todo_pgdata",
        "Scope": "local"
    }
]
```

### Удалить volume вручную (ОСТОРОЖНО!)
```bash
docker compose down
docker volume rm backend-todo-api_todo_pgdata
# ❌ Все данные БД будут удалены!
```

## 🔄 Типичные сценарии

### Сценарий 1: Обычная работа
```bash
# День 1
npm run dev:docker
# Работаете, создаете данные

# Конец дня
docker compose down  # Без -v!

# День 2
npm run dev:docker
# ✅ Все данные на месте!
```

### Сценарий 2: Обновление кода
```bash
# Сделали изменения в коде
docker compose restart backend
# ✅ Backend перезапущен с новым кодом
# ✅ БД не трогается
```

### Сценарий 3: Новая миграция
```bash
# Создали новую миграцию
docker compose down
npm run migrate
docker compose up -d
# ✅ Миграция применена
# ✅ Старые данные сохранены
```

### Сценарий 4: Сломали БД (нужен чистый старт)
```bash
docker compose down -v
docker compose up -d postgres
npm run migrate
# ✅ Чистая БД с правильной схемой
# ⚠️ Все старые данные потеряны!
```

## 🎯 Резюме команд

| Команда | Контейнеры | Volume | Данные | Когда использовать |
|---------|-----------|--------|---------|-------------------|
| `docker compose down` | Останавливает | Сохраняет | ✅ Сохранены | Обычная остановка |
| `docker compose restart` | Перезапускает | Не трогает | ✅ Сохранены | Обновление кода |
| `docker compose down -v` | Останавливает | **УДАЛЯЕТ** | ❌ Потеряны | Чистый старт |
| `docker compose stop` | Останавливает | Сохраняет | ✅ Сохранены | Пауза без удаления |
| `docker compose up -d` | Запускает | Подключает | ✅ Сохранены | Обычный запуск |

## 💡 Советы

1. **По умолчанию всегда используйте `docker compose down` без флага `-v`**
2. **Флаг `-v` используйте только если точно знаете что делаете**
3. **Регулярно делайте backup БД в production**
4. **В development используйте git для кода, Docker volumes для данных**

## 🔍 Проверка что данные сохранены

После `docker compose down` и `docker compose up -d`:

```bash
# Проверьте что volume существует
docker volume ls | grep todo_pgdata

# Зайдите в PostgreSQL
docker exec -it todo-postgres psql -U todo_user -d todo_db

# Выполните запрос
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM todos;
```

Если видите ваши данные - всё работает правильно! ✅

## ⚙️ Альтернатива: Локальный PostgreSQL

Можно установить PostgreSQL локально и не использовать Docker:

```bash
# macOS
brew install postgresql@16
brew services start postgresql@16

# Создать БД
createdb todo_db

# Запустить только backend
cd backend && npm run dev
```

**Плюсы:**
- Не нужен Docker
- Данные всегда на месте
- Быстрее запускается

**Минусы:**
- Нужно устанавливать PostgreSQL
- Может конфликтовать с другими версиями
- Docker проще для командной работы

---

Теперь вы знаете как работать с Docker и не терять данные! 🎉
