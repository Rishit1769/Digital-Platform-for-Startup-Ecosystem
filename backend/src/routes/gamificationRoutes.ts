import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  getLeaderboardStudents, 
  getLeaderboardMentors, 
  getLeaderboardStartups, 
  getMyRank, 
  getMyGamification, 
  getUserGamification, 
  getMyXPHistory 
} from '../controllers/gamificationController';

const router = Router();

// Public
router.get('/gamification/user/:userId', getUserGamification);

// Protected — authenticate applied per-route
router.get('/leaderboard/students', authenticate, getLeaderboardStudents);
router.get('/leaderboard/mentors', authenticate, getLeaderboardMentors);
router.get('/leaderboard/startups', authenticate, getLeaderboardStartups);
router.get('/leaderboard/my-rank', authenticate, getMyRank);

router.get('/gamification/me', authenticate, getMyGamification);
router.get('/gamification/me/history', authenticate, getMyXPHistory);

export default router;
