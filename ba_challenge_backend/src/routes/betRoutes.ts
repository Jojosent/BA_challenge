import { Router } from 'express';
import { betController } from '../controllers/betController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', betController.createBet);
router.post('/:id/join', betController.joinBet);
router.get('/', betController.getBets);
router.get('/:id', betController.getBetDetails);

export default router;
