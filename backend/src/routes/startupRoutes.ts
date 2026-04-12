import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { 
  createStartup, getStartups, getStartupById, updateStartup, deleteStartup, uploadLogo,
  inviteMember, removeMember, getMembers 
} from '../controllers/startupController';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }
});

router.use(authenticate);

// CRUD
router.post('/', createStartup);
router.get('/', getStartups);
router.get('/:id', getStartupById);
router.put('/:id', updateStartup);
router.delete('/:id', deleteStartup);
router.post('/:id/logo', upload.single('logo'), uploadLogo);

// Team Mgmt
router.post('/:id/invite', inviteMember);
router.delete('/:id/members/:userId', removeMember);
router.get('/:id/members', getMembers);

import { postOpenRole } from '../controllers/roleController';
import { toggleUpvote, checkUpvoteStatus } from '../controllers/showcaseController';

import { submitReview, getStartupReviews } from '../controllers/reviewController';

router.post('/:id/roles', postOpenRole);
router.post('/:id/upvote', toggleUpvote);
router.get('/:id/upvote', checkUpvoteStatus);
router.post('/:id/reviews', submitReview);
router.get('/:id/reviews', getStartupReviews);

export default router;
