import { Response } from 'express';
import { Op } from 'sequelize';
import { AuthRequest } from '../types';
import { Challenge, Participant, Task, User, ChallengeInvite, FamilyMember } from '../models';

export const challengeController = {

    // GET /api/challenges/family
    getFamilyChallenges: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user!.id;
            const { familyOwnerId } = req.query;

            let ownerIds: number[];

            if (familyOwnerId) {
                const ownerId = Number(familyOwnerId);
                if (ownerId === userId) {
                    ownerIds = [userId];
                } else {
                    const membership = await FamilyMember.findOne({
                        where: { userId: ownerId, appUserId: userId },
                    });
                    if (!membership) {
                        res.status(403).json({ message: 'Нет доступа к этой семье' });
                        return;
                    }
                    ownerIds = [ownerId];
                }
            } else {
                const memberEntries = await FamilyMember.findAll({
                    where: { appUserId: userId },
                    attributes: ['userId'],
                });
                ownerIds = [userId, ...memberEntries.map((m) => m.userId)];
            }

            const challenges = await Challenge.findAll({
                where: { familyOwnerId: ownerIds },
                include: [
                    {
                        model: Participant,
                        as: 'participants',
                        include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatarUrl'] }],
                    },
                    { model: User, as: 'creator', attributes: ['id', 'username'] },
                ],
                order: [['createdAt', 'DESC']],
            });

            // ✅ Не отдаём пароль клиенту
            const safe = challenges.map((c) => {
                const obj = c.toJSON() as any;
                delete obj.password;
                return obj;
            });

            res.json(safe);
        } catch (error: any) {
            console.error('getFamilyChallenges error:', error.message);
            res.status(500).json({ message: 'Ошибка: ' + error.message });
        }
    },

    // GET /api/challenges
    getAll: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user!.id;
            const challenges = await Challenge.findAll({
                include: [
                    {
                        model: Participant,
                        as: 'participants',
                        include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatarUrl'] }],
                    },
                    { model: User, as: 'creator', attributes: ['id', 'username'] },
                ],
                where: {
                    familyOwnerId: { [Op.is]: null as any },
                    [Op.or]: [
                        { visibility: 'public' },
                        { visibility: 'protected' },  // ✅ защищённые тоже видны в ленте
                        { creatorId: userId },
                        { '$participants.userId$': userId },
                    ],
                },
                order: [['createdAt', 'DESC']],
            });

            // ✅ Никогда не отдаём пароль в списке
            const safe = challenges.map((c) => {
                const obj = c.toJSON() as any;
                delete obj.password;
                return obj;
            });

            res.json(safe);
        } catch (error) {
            res.status(500).json({ message: 'Ошибка' });
        }
    },

    // GET /api/challenges/:id
    getById: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user!.id;
            const challenge = await Challenge.findByPk(req.params.id, {
                include: [
                    {
                        model: Participant,
                        as: 'participants',
                        include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatarUrl', 'rating'] }],
                    },
                    { model: Task, as: 'tasks', order: [['day', 'ASC']] },
                    { model: User, as: 'creator', attributes: ['id', 'username'] },
                ],
            });

            if (!challenge) {
                res.status(404).json({ message: 'Челлендж не найден' });
                return;
            }

            if (challenge.familyOwnerId) {
                const isFamilyMember = await FamilyMember.findOne({
                    where: { userId: challenge.familyOwnerId, appUserId: userId },
                });
                const isOwner = challenge.familyOwnerId === userId;
                if (!isOwner && !isFamilyMember) {
                    res.status(403).json({ message: 'Нет доступа к этому семейному челленджу' });
                    return;
                }
            }

            // ✅ Сообщаем клиенту есть ли пароль, но не передаём его значение
            const obj = challenge.toJSON() as any;
            obj.hasPassword = !!challenge.password;
            delete obj.password;

            res.json(obj);
        } catch (error) {
            res.status(500).json({ message: 'Ошибка' });
        }
    },

    // POST /api/challenges
    create: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const {
                title, description, startDate, endDate,
                visibility, betAmount, familyOwnerId, password,
            } = req.body;
            const creatorId = req.user!.id;

            if (familyOwnerId && Number(familyOwnerId) !== creatorId) {
                res.status(403).json({
                    message: 'Только владелец семьи может создавать семейные челленджи',
                });
                return;
            }

            // ✅ Пароль только для protected
            const challengePassword =
                visibility === 'protected' && password && password.trim()
                    ? password.trim()
                    : null;

            const challenge = await Challenge.create({
                title, description, startDate, endDate,
                creatorId,
                visibility: visibility || 'public',
                betAmount: betAmount || 0,
                status: 'pending',
                familyOwnerId: familyOwnerId ? Number(familyOwnerId) : undefined,
                password: challengePassword ?? undefined,
            });

            await Participant.create({
                challengeId: challenge.id,
                userId: creatorId,
                hasConsented: true,
            });

            if (betAmount > 0) {
                await User.decrement('rikonCoins', { by: betAmount, where: { id: creatorId } });
            }

            const full = await Challenge.findByPk(challenge.id, {
                include: [
                    {
                        model: Participant,
                        as: 'participants',
                        include: [{ model: User, as: 'user', attributes: ['id', 'username'] }],
                    },
                    { model: User, as: 'creator', attributes: ['id', 'username'] },
                ],
            });

            const obj = (full as any).toJSON();
            obj.hasPassword = !!challenge.password;
            delete obj.password;

            res.status(201).json(obj);
        } catch (error) {
            res.status(500).json({ message: 'Ошибка создания челленджа' });
        }
    },

    // POST /api/challenges/:id/join
    join: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const challengeId = Number(req.params.id);
            const userId = req.user!.id;
            const { password } = req.body;  // ✅ принимаем пароль

            const challenge = await Challenge.findByPk(challengeId);
            if (!challenge) {
                res.status(404).json({ message: 'Не найден' });
                return;
            }

            // ✅ Для семейного — только члены семьи
            if (challenge.familyOwnerId) {
                const isMember = await FamilyMember.findOne({
                    where: { userId: challenge.familyOwnerId, appUserId: userId },
                });
                const isOwner = challenge.familyOwnerId === userId;
                if (!isOwner && !isMember) {
                    res.status(403).json({ message: 'Только члены семьи могут участвовать' });
                    return;
                }
            }

            // ✅ Проверяем пароль для protected-челленджей
            if (challenge.visibility === 'protected' && challenge.password) {
                if (!password || password.trim() !== challenge.password) {
                    res.status(403).json({ message: 'Неверный пароль', wrongPassword: true });
                    return;
                }
            }

            const existing = await Participant.findOne({ where: { challengeId, userId } });
            if (existing) {
                res.status(400).json({ message: 'Уже участвуешь' });
                return;
            }

            const user = await User.findByPk(userId);
            if (user && challenge.betAmount > user.rikonCoins) {
                res.status(400).json({ message: 'Недостаточно Rikon монет' });
                return;
            }

            await Participant.create({ challengeId, userId, hasConsented: true });

            if (challenge.betAmount > 0) {
                await User.decrement('rikonCoins', { by: challenge.betAmount, where: { id: userId } });
            }

            res.json({ message: 'Ты вступил в челлендж!' });
        } catch (error) {
            res.status(500).json({ message: 'Ошибка' });
        }
    },

    // GET /api/challenges/:id/tasks
    getTasks: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const tasks = await Task.findAll({
                where: { challengeId: req.params.id },
                order: [['day', 'ASC']],
            });
            res.json(tasks);
        } catch (error) {
            res.status(500).json({ message: 'Ошибка' });
        }
    },

    // PATCH /api/challenges/:id/status
    updateStatus: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { status } = req.body;
            const challenge = await Challenge.findByPk(req.params.id);

            if (!challenge) {
                res.status(404).json({ message: 'Не найден' });
                return;
            }

            if (challenge.creatorId !== req.user!.id) {
                res.status(403).json({ message: 'Нет прав' });
                return;
            }

            await challenge.update({ status });
            res.json(challenge);
        } catch (error) {
            res.status(500).json({ message: 'Ошибка' });
        }
    },

    inviteUser: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const challengeId = Number(req.params.id);
            const { toUserId } = req.body;
            const fromUserId = req.user!.id;

            const challenge = await Challenge.findByPk(challengeId);
            if (!challenge) {
                res.status(404).json({ message: 'Челлендж не найден' });
                return;
            }

            if (challenge.creatorId !== fromUserId) {
                res.status(403).json({ message: 'Только создатель может приглашать' });
                return;
            }

            const existing = await ChallengeInvite.findOne({
                where: { challengeId, toUserId, status: 'pending' },
            });

            if (existing) {
                res.status(400).json({ message: 'Приглашение уже отправлено' });
                return;
            }

            await ChallengeInvite.create({ challengeId, fromUserId, toUserId: Number(toUserId) });
            res.status(201).json({ message: 'Приглашение отправлено!' });
        } catch (error) {
            res.status(500).json({ message: 'Ошибка' });
        }
    },

    getMyChallengeInvites: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user!.id;

            const invites = await ChallengeInvite.findAll({
                where: { toUserId: userId, status: 'pending' },
                order: [['createdAt', 'DESC']],
            });

            const result = await Promise.all(
                invites.map(async (invite) => {
                    const challenge = await Challenge.findByPk(invite.challengeId, {
                        attributes: ['id', 'title', 'description', 'betAmount'],
                    });
                    const sender = await User.findByPk(invite.fromUserId, {
                        attributes: ['id', 'username'],
                    });

                    return {
                        id: invite.id,
                        challengeId: invite.challengeId,
                        status: invite.status,
                        createdAt: invite.createdAt,
                        challenge,
                        inviteSender: sender,
                    };
                })
            );

            res.json(result);
        } catch (error: any) {
            console.error('getMyChallengeInvites error:', error.message);
            res.status(500).json({ message: 'Ошибка получения приглашений: ' + error.message });
        }
    },

    respondChallengeInvite: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { inviteId } = req.params;
            const { accept } = req.body;
            const userId = req.user!.id;

            const invite = await ChallengeInvite.findByPk(inviteId);
            if (!invite || invite.toUserId !== userId) {
                res.status(404).json({ message: 'Не найдено' });
                return;
            }

            if (accept) {
                const existing = await Participant.findOne({
                    where: { challengeId: invite.challengeId, userId },
                });

                if (!existing) {
                    await Participant.create({
                        challengeId: invite.challengeId,
                        userId,
                        hasConsented: true,
                    });
                }
                await invite.update({ status: 'accepted' });
                res.json({ message: 'Принято! Ты в челлендже.' });
            } else {
                await invite.update({ status: 'rejected' });
                res.json({ message: 'Отклонено' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Ошибка' });
        }
    },
getPrizePool: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const challenge = await Challenge.findByPk(req.params.id, {
            include: [{
                model: Participant,
                as: 'participants',
            }],
        });

        if (!challenge) {
            res.status(404).json({ message: 'Не найден' });
            return;
        }

        const participantCount = (challenge as any).participants?.length ?? 0;
        const prizePool = participantCount * challenge.betAmount;

        res.json({ prizePool, participantCount, betAmount: challenge.betAmount });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка' });
    }
},
    searchUsersForInvite: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { q } = req.query;
            const userId = req.user!.id;

            if (!q || String(q).trim().length < 2) {
                res.json([]);
                return;
            }

            const users = await User.findAll({
                where: {
                    username: { [Op.iLike]: `%${q}%` },
                    id: { [Op.ne]: userId },
                },
                attributes: ['id', 'username', 'avatarUrl', 'rating'],
                limit: 10,
            });

            res.json(users);
        } catch (error) {
            res.status(500).json({ message: 'Ошибка поиска' });
        }
    },
};