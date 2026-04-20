import { Router } from 'express';
import { submissionController } from '../controllers/submissionController';
import { authMiddleware } from '../middleware/auth';
import { upload } from '../config/upload';

const router = Router();

router.use(authMiddleware);

// upload.single('media') — принимает один файл с полем 'media'
router.post('/', upload.single('media'), submissionController.create);
router.get('/task/:taskId', submissionController.getByTask);
router.get('/my/:challengeId', submissionController.getMySubmissions);

export default router;