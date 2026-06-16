import { Router } from 'express';
import { getMediaObject } from '../controllers/mediaController';

const router = Router();

router.get('/', getMediaObject);

export default router;
