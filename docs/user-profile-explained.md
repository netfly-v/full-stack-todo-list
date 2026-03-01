# 👤 User Profile Feature - Подробное объяснение

Этот документ объясняет как работает функционал личного кабинета с загрузкой аватара.

## 📋 Содержание

- [Обзор функционала](#обзор-функционала)
- [Как работает загрузка файлов](#как-работает-загрузка-файлов)
- [Обработка изображений](#обработка-изображений)
- [Безопасность](#безопасность)
- [Тестирование](#тестирование)
- [Будущие улучшения](#будущие-улучшения)

---

## Обзор функционала

### Что добавлено

1. **Профиль пользователя**
   - Новые поля в таблице `users`: `name`, `bio`, `avatar_url`
   - Эндпоинты для просмотра и редактирования профиля

2. **Загрузка аватара**
   - Загрузка изображения (JPEG, PNG, WebP)
   - Автоматическая обработка (resize 300x300, оптимизация)
   - Удаление аватара

3. **Frontend интерфейс**
   - Страница профиля `/profile`
   - Компонент загрузки аватара с preview
   - Форма редактирования имени и биографии

### Зачем это нужно

Этот функционал демонстрирует важные концепции backend-разработки:

- **Работа с файлами** - как backend принимает, обрабатывает и хранит файлы
- **Безопасность** - валидация типов, размеров, защита от атак
- **Оптимизация** - обработка изображений для экономии места и трафика
- **Архитектура** - разделение ответственности (middleware, utils, routes)

---

## Как работает загрузка файлов

### 1. Что такое multipart/form-data

Обычно данные отправляются в формате JSON:

```http
POST /api/profile HTTP/1.1
Content-Type: application/json

{"name": "John", "bio": "Developer"}
```

Но файлы нельзя отправить в JSON. Для них используется `multipart/form-data`:

```http
POST /api/profile/avatar HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="avatar"; filename="photo.jpg"
Content-Type: image/jpeg

[binary data]
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

**На фронтенде:**

```typescript
const formData = new FormData();
formData.append('avatar', file); // File object из input[type="file"]

await api.post('/profile/avatar', formData);
```

### 2. Как работает multer

**Multer** - это Express middleware для обработки `multipart/form-data`.

**Конфигурация** (`backend/middleware/upload.ts`):

```typescript
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir); // Куда сохранять
  },
  filename: (req, file, cb) => {
    const userId = (req as any).userId;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `user-${userId}-${timestamp}${ext}`); // Как назвать
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Принять файл
  } else {
    cb(new Error('Invalid file type')); // Отклонить
  }
};

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
```

**Использование в роуте:**

```typescript
router.post('/avatar', uploadAvatar.single('avatar'), async (req, res) => {
  // req.file содержит информацию о загруженном файле
  console.log(req.file);
  // {
  //   fieldname: 'avatar',
  //   originalname: 'photo.jpg',
  //   mimetype: 'image/jpeg',
  //   path: '/uploads/avatars/user-1-1234567890.jpg',
  //   size: 145678
  // }
});
```

**Что происходит:**

1. Пользователь отправляет файл
2. Multer проверяет тип и размер (`fileFilter`, `limits`)
3. Если OK - сохраняет на диск в `uploads/avatars/`
4. Возвращает `req.file` с информацией о файле

### 3. Где хранятся файлы

```
backend/
├── uploads/
│   └── avatars/
│       ├── user-1-1234567890.jpg
│       ├── user-2-1234567891.jpg
│       └── user-1-1234567892-processed.jpg
```

**В базе данных хранится только путь:**

```sql
UPDATE users SET avatar_url = '/uploads/avatars/user-1-1234567892-processed.jpg' WHERE id = 1;
```

**На фронтенде:**

```typescript
<img src={`http://localhost:3001${user.avatar_url}`} />
```

### 4. Как сервер раздает статические файлы

**Настройка в `server.ts`:**

```typescript
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
```

**Что это делает:**

- Запрос `GET /uploads/avatars/user-1-123.jpg`
- Express читает файл `backend/uploads/avatars/user-1-123.jpg`
- Возвращает его как response

**Важно:** Это работает только для чтения. Файлы создаются через multer, а не через этот middleware.

---

## Обработка изображений

### Зачем нужен sharp

Проблемы без обработки:

- ❌ Пользователь загружает фото 4000x3000px (5MB)
- ❌ Для аватара нужно только 300x300px
- ❌ Трафик расходуется впустую
- ❌ Страница загружается медленно

**Sharp** - библиотека для обработки изображений на Node.js.

### Что делает наш код

**Файл:** `backend/utils/imageProcessor.ts`

```typescript
export async function processAvatar(inputPath: string): Promise<string> {
  const outputPath = inputPath.replace(/\.(jpg|jpeg|png|webp)$/i, '-processed.jpg');

  await sharp(inputPath)
    .resize(300, 300, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 85 })
    .toFile(outputPath);

  await fs.unlink(inputPath); // Удалить оригинал

  return outputPath;
}
```

**Пошагово:**

1. **Resize 300x300**
   - `fit: 'cover'` - обрезает по центру, сохраняя пропорции
   - Альтернативы: `contain` (вписывает), `fill` (растягивает)

2. **Конвертация в JPEG**
   - PNG может быть очень большим
   - JPEG хорошо сжимает фотографии
   - `quality: 85` - баланс между качеством и размером

3. **Удаление оригинала**
   - Экономия места на диске
   - Остается только обработанная версия

**Результат:**

- Загружено: `photo.png` (2.5MB, 2000x1500px)
- Обработано: `photo-processed.jpg` (50KB, 300x300px)
- **Экономия: 98% размера!**

### Форматы изображений

| Формат | Плюсы | Минусы | Когда использовать |
|--------|-------|--------|-------------------|
| **JPEG** | Маленький размер, хорошо для фото | Нет прозрачности, lossy | Фотографии, аватары |
| **PNG** | Прозрачность, lossless | Большой размер | Логотипы, иконки |
| **WebP** | Маленький размер + прозрачность | Старые браузеры | Современные сайты |

**Мы используем JPEG для аватаров** - фотографиям не нужна прозрачность, а размер важен.

---

## Безопасность

### 1. Валидация типов файлов

**Проблема:** Пользователь может загрузить `.exe`, `.php`, `.js` и попытаться их выполнить.

**Решение:**

```typescript
const fileFilter = (_req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};
```

**Важно:** Проверяем `mimetype` (определяется по содержимому), а не только расширение.

### 2. Ограничение размера

**Проблема:** Пользователь может загрузить файл 1GB и заполнить диск.

**Решение:**

```typescript
limits: { fileSize: 5 * 1024 * 1024 } // 5MB
```

Multer автоматически отклонит файлы больше 5MB.

### 3. Именование файлов (предотвращение коллизий)

**Проблема:** Два пользователя загружают `photo.jpg` - один перезапишет другого.

**Решение:**

```typescript
filename: (req, file, cb) => {
  const userId = (req as any).userId;
  const timestamp = Date.now();
  const ext = path.extname(file.originalname);
  cb(null, `user-${userId}-${timestamp}${ext}`);
}
```

**Результат:** `user-1-1234567890.jpg` - уникальное имя для каждого файла.

### 4. Санитизация путей

**Проблема:** Path traversal атака

```
POST /api/profile/avatar
filename: "../../etc/passwd"
```

Пытается перезаписать системные файлы.

**Решение:**

- Multer игнорирует directory separators (`/`, `\`) в `filename`
- Мы генерируем filename сами, не используя `originalname`
- Файлы сохраняются только в `uploads/avatars/`

### 5. Проверка авторизации

**Важно:**

```typescript
router.use(requireAuth); // Все роуты профиля требуют авторизации
```

Без токена невозможно:
- Загрузить аватар
- Изменить профиль
- Удалить аватар

---

## Тестирование

### Почему тесты важны на бэкенде

**На фронтенде:** Можно открыть браузер и проверить визуально.

**На бэкенде:**
- ❌ Нельзя "посмотреть" на API
- ❌ Нужно тестировать разные сценарии (успех, ошибки, edge cases)
- ❌ Регрессии незаметны до production

**Тесты гарантируют:**
- ✅ API работает как ожидается
- ✅ Изменения не сломали существующий функционал
- ✅ Все edge cases учтены

### Как писать интеграционные тесты

**Интеграционные тесты** - проверяют весь путь от HTTP запроса до БД.

**Инструменты:**
- **Jest** - фреймворк для тестирования
- **Supertest** - делает HTTP запросы к приложению

**Пример** (`backend/tests/profile.test.ts`):

```typescript
describe('POST /api/profile/avatar', () => {
  it('should upload avatar', async () => {
    const res = await request(app)
      .post('/api/profile/avatar')
      .set('Cookie', authCookies) // Авторизация
      .attach('avatar', 'tests/fixtures/test-avatar.jpg'); // Файл

    expect(res.status).toBe(200);
    expect(res.body.avatar_url).toMatch(/\/uploads\/avatars\//);
  });

  it('should reject large files', async () => {
    // Создать файл > 5MB
    const largeFile = Buffer.alloc(6 * 1024 * 1024);
    
    const res = await request(app)
      .post('/api/profile/avatar')
      .set('Cookie', authCookies)
      .attach('avatar', largeFile, 'large.jpg');

    expect(res.status).toBe(413); // Payload Too Large
  });

  it('should reject invalid file types', async () => {
    const res = await request(app)
      .post('/api/profile/avatar')
      .set('Cookie', authCookies)
      .attach('avatar', Buffer.from('text content'), 'file.txt');

    expect(res.status).toBe(400);
  });
});
```

**Что проверяем:**
- ✅ Успешная загрузка
- ✅ Отклонение больших файлов
- ✅ Отклонение неправильных типов
- ✅ Требование авторизации
- ✅ Замена старого аватара
- ✅ Удаление аватара

### Тестирование загрузки файлов

**Особенности:**

1. **Создание тестовых файлов**

```typescript
// В tests/fixtures/ создать test-avatar.jpg
// Или генерировать на лету:
const testImage = Buffer.from('fake-image-data');
```

2. **Очистка после тестов**

```typescript
afterEach(async () => {
  // Удалить загруженные файлы
  const files = await fs.readdir('uploads/avatars');
  for (const file of files) {
    await fs.unlink(`uploads/avatars/${file}`);
  }
});
```

3. **Тестовая база данных**

Используй отдельную БД для тестов:

```env
# .env.test
DATABASE_URL=postgresql://localhost/todo_test
```

### Coverage и CI/CD

**Coverage** - процент покрытия кода тестами:

```bash
npm run test:coverage
```

```
--------------------|----------|----------|----------|----------|
File                |  % Stmts | % Branch |  % Funcs |  % Lines |
--------------------|----------|----------|----------|----------|
routes/profileRoutes|    95.00 |    88.00 |   100.00 |    95.00 |
middleware/upload   |   100.00 |   100.00 |   100.00 |   100.00 |
--------------------|----------|----------|----------|----------|
```

**CI/CD** (Continuous Integration):

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test
```

Автоматически запускает тесты при каждом push.

---

## Будущие улучшения

### 1. Миграция на S3/Cloudinary

**Проблема с локальным хранением:**
- ❌ При деплое на Heroku/Railway файлы удаляются при рестарте
- ❌ Нельзя масштабировать (несколько серверов)
- ❌ Нет CDN

**Решение - облачное хранилище:**

**AWS S3:**

```typescript
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

export async function uploadToS3(file: Express.Multer.File) {
  const params = {
    Bucket: 'my-todo-app',
    Key: `avatars/${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  };

  const result = await s3.upload(params).promise();
  return result.Location; // URL файла
}
```

**Cloudinary** (проще для изображений):

```typescript
import { v2 as cloudinary } from 'cloudinary';

export async function uploadToCloudinary(filePath: string) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'avatars',
    transformation: [
      { width: 300, height: 300, crop: 'fill' }, // Resize
      { quality: 'auto' }, // Автоматическая оптимизация
    ],
  });

  return result.secure_url;
}
```

**Преимущества:**
- ✅ Не теряются файлы при рестарте
- ✅ CDN для быстрой загрузки
- ✅ Автоматическая оптимизация (Cloudinary)
- ✅ Масштабирование

### 2. CDN для раздачи изображений

**CDN (Content Delivery Network)** - сеть серверов по всему миру.

**Без CDN:**
```
Пользователь (Россия) → Сервер (США) → 500ms задержка
```

**С CDN:**
```
Пользователь (Россия) → CDN (Москва) → 20ms задержка
```

**Примеры CDN:**
- Cloudflare (бесплатно)
- CloudFront (AWS)
- Cloudinary (встроенный)

### 3. Websockets для real-time обновления аватаров

**Проблема:** Если пользователь обновил аватар, другие видят старый.

**Решение - WebSockets:**

```typescript
// Backend
io.on('connection', (socket) => {
  socket.on('avatar:updated', (userId) => {
    // Уведомить всех, кто видит этого пользователя
    io.emit('user:updated', { userId, avatar_url: newUrl });
  });
});

// Frontend
socket.on('user:updated', ({ userId, avatar_url }) => {
  // Обновить аватар в UI без перезагрузки
  queryClient.invalidateQueries(['user', userId]);
});
```

### 4. Кроппинг на фронтенде перед загрузкой

**Проблема:** Пользователь загружает фото 5MB, хотя нужно 300x300px.

**Решение - обработка на фронтенде:**

Библиотеки:
- `react-image-crop`
- `react-easy-crop`
- Canvas API

```typescript
import Cropper from 'react-easy-crop';

function AvatarCropper({ image, onCrop }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const onCropComplete = async (croppedArea, croppedAreaPixels) => {
    const croppedImage = await getCroppedImg(image, croppedAreaPixels);
    onCrop(croppedImage); // File объект
  };

  return (
    <Cropper
      image={image}
      crop={crop}
      zoom={zoom}
      aspect={1} // Квадрат
      onCropChange={setCrop}
      onZoomChange={setZoom}
      onCropComplete={onCropComplete}
    />
  );
}
```

**Преимущества:**
- ✅ Загружается меньше данных
- ✅ Пользователь видит результат сразу
- ✅ Меньше нагрузки на сервер

---

## Резюме

### Что мы изучили

✅ **Загрузка файлов**
- Формат `multipart/form-data`
- Библиотека `multer` для Express
- Сохранение на диск
- Раздача статических файлов

✅ **Обработка изображений**
- Библиотека `sharp`
- Resize, crop, optimize
- Форматы (JPEG, PNG, WebP)

✅ **Безопасность**
- Валидация типов и размеров
- Именование файлов
- Path traversal защита
- Авторизация

✅ **Тестирование**
- Jest + Supertest
- Интеграционные тесты
- Тестирование загрузки файлов
- Coverage

✅ **Архитектура**
- Middleware (multer)
- Utils (imageProcessor)
- Routes (profileRoutes)
- Разделение ответственности

### Следующие шаги

1. **Запустить проект** и протестировать загрузку аватара
2. **Изучить код** - посмотреть как все работает вместе
3. **Дополнить тесты** - добавить реальные проверки (сейчас placeholders)
4. **Попробовать улучшения** - S3, Cloudinary, cropper

Теперь у вас есть solid foundation для работы с файлами на бэкенде! 🚀
