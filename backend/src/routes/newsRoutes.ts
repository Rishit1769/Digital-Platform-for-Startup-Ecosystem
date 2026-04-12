import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getNews, createNews, deleteNews, updateSettings, getSettings } from '../controllers/newsController';

const router = Router();

// Public news feed
router.get('/news', getNews);

// Admin news management
router.post('/admin/news', authenticate, requireRole('admin'), createNews);
router.delete('/admin/news/:id', authenticate, requireRole('admin'), deleteNews);

// User settings
router.get('/settings', authenticate, getSettings);
router.patch('/settings', authenticate, updateSettings);

export default router;
