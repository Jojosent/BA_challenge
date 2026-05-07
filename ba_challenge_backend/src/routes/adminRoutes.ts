import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Применяем защиту ко всем маршрутам в этом файле
router.use(authMiddleware);
router.use(requireRole(['admin', 'moderator']));

// Поиск и просмотр
router.get('/challenges/search', adminController.searchChallenges);
router.get('/challenges/:id', adminController.getChallengeDetail);

// Управление статусами и спорами
router.patch('/challenges/:id/complete', adminController.completeChallenge);
router.post('/challenges/:id/resolve-dispute', adminController.resolveDispute);

// Удаление с возвратом средств
router.delete('/challenges/:id', adminController.deleteChallenge);

export default router;
