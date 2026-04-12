import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getCalendarEvents } from '../controllers/calendarController';

const router = Router();
router.use(authenticate);

router.get('/events', getCalendarEvents);

export default router;
