import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { initializeDatabase } from './db';
import { initializeMinio } from './services/minio';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import adminRoutes from './routes/adminRoutes';
import discoverRoutes from './routes/discoverRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import aiRoutes from './routes/aiRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Server is healthy' });
});

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

// Global Error Handler
app.use(errorHandler);

import { initCronJobs } from './services/cron';

// Initialization & Server Start
const startServer = async () => {
  try {
    await initializeDatabase();
    await initializeMinio();
    
    initCronJobs();
    
    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
