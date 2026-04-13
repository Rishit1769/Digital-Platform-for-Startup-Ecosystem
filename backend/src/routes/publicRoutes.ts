import { Router } from 'express';
import {
  getPublicStats, getPublicShowcase,
  getPublicMentors, getPublicTicker,
  getPublicStartupsList, getPublicMentorsList, getPublicIdeas,
  getPublicSessions,
} from '../controllers/publicController';

const router = Router();

// No authentication required — landing page data only
router.get('/stats',       getPublicStats);
router.get('/showcase',    getPublicShowcase);
router.get('/mentors',     getPublicMentors);
router.get('/ticker',      getPublicTicker);
router.get('/sessions',    getPublicSessions);

// Full paginated public directories
router.get('/startups',     getPublicStartupsList);
router.get('/mentors-list', getPublicMentorsList);
router.get('/ideas',        getPublicIdeas);

export default router;
