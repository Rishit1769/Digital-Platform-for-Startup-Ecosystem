import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getOpenRoles, applyForRole, getApplications, updateApplicationStatus, getMyApplications } from '../controllers/roleController';

const router = Router();
router.use(authenticate);

router.get('/', getOpenRoles);
router.get('/applications/me', getMyApplications);
router.post('/:roleId/apply', applyForRole);
router.get('/:roleId/applications', getApplications);
router.patch('/:roleId/applications/:appId', updateApplicationStatus);

export default router;
