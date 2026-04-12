import { Router } from 'express';
import multer from 'multer';
import { getMyProfile, updateMyProfile, uploadAvatar, getUserProfile, getDiscoveryList } from '../controllers/profileController';
import { authenticate } from '../middleware/auth';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

router.use(authenticate);

router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.get('/users', getDiscoveryList); // e.g. /api/profile/users?role=student
router.get('/:userId', getUserProfile);

export default router;
