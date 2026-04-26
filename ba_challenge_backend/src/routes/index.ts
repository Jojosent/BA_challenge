import { Router } from 'express';
import authRoutes       from './authRoutes';
import userRoutes       from './userRoutes';
import challengeRoutes  from './challengeRoutes';
import submissionRoutes from './submissionRoutes';
import aiRoutes         from './aiRoutes';
import voteRoutes       from './voteRoutes';
import taskRoutes       from './taskRoutes';
import familyRoutes     from './familyRoutes';
import chatRoutes       from './chatRoutes';
import betRoutes        from './betRoutes';

const router = Router();

router.use('/auth',        authRoutes);
router.use('/users',       userRoutes);
router.use('/challenges',  challengeRoutes);
router.use('/submissions', submissionRoutes);
router.use('/ai',          aiRoutes);
router.use('/votes',       voteRoutes);
router.use('/tasks',       taskRoutes);
router.use('/family',      familyRoutes);
router.use('/chat',        chatRoutes);
router.use('/bets',        betRoutes);

export default router;