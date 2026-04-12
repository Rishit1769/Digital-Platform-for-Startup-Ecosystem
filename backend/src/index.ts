import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeDatabase } from './db';
import { initializeMinio } from './services/minio';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Server is healthy' });
});

// Global Error Handler
app.use(errorHandler);

// Initialization & Server Start
const startServer = async () => {
  try {
    await initializeDatabase();
    await initializeMinio();
    
    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
