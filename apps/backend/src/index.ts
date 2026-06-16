import path from 'node:path';
import { config } from 'dotenv';
import express, { Express, Request, Response } from 'express';
import { createServer, type Server as HttpServer } from 'http';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { initializeDatabase, shutdownDatabase } from './db';
import { initializeMinio } from './services/minio';
import { errorHandler } from './middleware/errorHandler';
import { getAllowedOrigins, isOriginAllowed } from './config/origins';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import adminRoutes from './routes/adminRoutes';
import discoverRoutes from './routes/discoverRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import aiRoutes from './routes/aiRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

config({ path: path.resolve(__dirname, '../../../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error(
    '[backend] Missing DATABASE_URL. Define it in the repo root `.env`, `apps/backend/.env`, or the current shell before starting the backend.'
  );
}

const app: Express = express();
const port = Number(process.env.PORT || 5000);
const allowedOrigins = getAllowedOrigins();
let server: HttpServer | null = null;
let isShuttingDown = false;

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin || 'unknown'} is not allowed by CORS. Allowed origins: ${allowedOrigins.join(', ')}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

import startupRoutes from './routes/startupRoutes';
import showcaseRoutes from './routes/showcaseRoutes';
import ideaRoutes from './routes/ideaRoutes';
import roleRoutes from './routes/roleRoutes';
import userRoutes from './routes/userRoutes';
import meetingRoutes from './routes/meetingRoutes';
import officeHourRoutes from './routes/officeHourRoutes';
import calendarRoutes from './routes/calendarRoutes';
import newsRoutes from './routes/newsRoutes';
import publicRoutes from './routes/publicRoutes';
import mediaRoutes from './routes/mediaRoutes';

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Server is healthy' });
});

app.use('/api/public', publicRoutes);
app.use('/api/media', mediaRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/showcase', showcaseRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/office-hours', officeHourRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api', newsRoutes);

// Global Error Handler
app.use(errorHandler);

import { initCronJobs } from './services/cron';
import { initializeRealtime } from './services/realtime';

// Initialization & Server Start
const startServer = async () => {
  try {
    await initializeDatabase();
    await initializeMinio();
    server = createServer(app);
    initializeRealtime(server, allowedOrigins);
    
    initCronJobs();
    
    server.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`[backend] Port ${port} is already in use. A previous dev server may still be shutting down.`);
      } else {
        console.error('[backend] Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

const shutdown = (signal: NodeJS.Signals) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`[backend] Received ${signal}, shutting down...`);

  const finalizeExit = async (exitCode: number) => {
    try {
      await shutdownDatabase();
    } catch (error) {
      console.error('[backend] Error while disconnecting from the database:', error);
      exitCode = 1;
    }

    process.exit(exitCode);
  };

  if (!server) {
    void finalizeExit(0);
    return;
  }

  server.close((error?: Error) => {
    if (error) {
      console.error('[backend] Error while closing server:', error);
      void finalizeExit(1);
      return;
    }

    void finalizeExit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
