// Main server file
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import todoRoutes from './routes/todoRoutes';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import adminRoutes from './routes/adminRoutes';
import { runMigrations } from './migrate';
import { openApiSpec } from './swagger';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

// Middleware - functions that run before your route handlers
const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:3002')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('CORS: origin is not allowed'));
    },
    credentials: true,
  })
); // Allows requests from frontend (React app)
app.use(express.json()); // Parses JSON from request body
app.use(cookieParser()); // Parses cookies from request headers

// Static files - serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.get('/api/docs.json', (_req, res) => {
  res.json(openApiSpec);
});

// Routes
app.use('/api/todos', todoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/', (_req, res) => {
  res.json({ message: 'Todo API is running!' });
});

// Render default health endpoint
app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true });
});

const startServer = async () => {
  try {
    await runMigrations();

    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start server (skip during tests)
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// Export app for testing
export default app;
