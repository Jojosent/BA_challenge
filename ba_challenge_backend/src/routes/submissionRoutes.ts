import { Router } from 'express';
import { submissionController } from '../controllers/submissionController';
import { authMiddleware } from '../middleware/auth';
import { upload } from '../config/upload';

const router = Router();

router.use(authMiddleware);

// ✅ Загрузка одного файла — добавляет к существующему submission или создаёт новый
router.post('/', upload.single('media'), submissionController.create);

// ✅ Удалить конкретный медиафайл
router.delete('/media/:mediaId', submissionController.deleteMedia);

router.get('/task/:taskId', submissionController.getByTask);
router.get('/my/:challengeId', submissionController.getMySubmissions);

export default router;