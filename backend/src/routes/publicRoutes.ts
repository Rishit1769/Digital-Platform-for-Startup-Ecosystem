import { Router } from 'express';
import {
  getPublicStats, getPublicShowcase, getPublicLeaderboard,
  getPublicMentors, getPublicTicker,
  getPublicStartupsList, getPublicMentorsList, getPublicIdeas,
} from '../controllers/publicController';

const router = Router();

// No authentication required — landing page data only
router.get('/stats',       getPublicStats);
router.get('/showcase',    getPublicShowcase);
router.get('/leaderboard', getPublicLeaderboard);
router.get('/mentors',     getPublicMentors);
router.get('/ticker',      getPublicTicker);

// Full paginated public directories
router.get('/startups',     getPublicStartupsList);
router.get('/mentors-list', getPublicMentorsList);
router.get('/ideas',        getPublicIdeas);

export default router;
