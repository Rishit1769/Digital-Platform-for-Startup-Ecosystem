import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireRole } from '../middleware/auth';
import { getNews, createNews, deleteNews, updateSettings, getSettings } from '../controllers/newsController';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// Public news feed
router.get('/news', getNews);

// Admin news management
router.post('/admin/news', authenticate, requireRole('admin'), upload.single('image'), createNews);
router.delete('/admin/news/:id', authenticate, requireRole('admin'), deleteNews);

// User settings
router.get('/settings', authenticate, getSettings);
router.patch('/settings', authenticate, updateSettings);

export default router;
