import { Router } from 'express';
import { challengeController } from '../controllers/challengeController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/family', challengeController.getFamilyChallenges);

// ✅ Статические роуты ПЕРВЫМИ — до /:id
router.get('/my-invites',           challengeController.getMyChallengeInvites);
router.get('/search-users',         challengeController.searchUsersForInvite);
router.patch('/invites/:inviteId',  challengeController.respondChallengeInvite);

// Динамические
router.get('/',                     challengeController.getAll);
router.post('/',                    challengeController.create);
router.get('/:id',                  challengeController.getById);
router.post('/:id/join',            challengeController.join);
router.get('/:id/tasks',            challengeController.getTasks);
router.patch('/:id/status',         challengeController.updateStatus);
router.post('/:id/invite',          challengeController.inviteUser);

// ✅ Новый роут — информация о призовом пуле
router.get('/:id/prize-pool',       challengeController.getPrizePool);

export default router;