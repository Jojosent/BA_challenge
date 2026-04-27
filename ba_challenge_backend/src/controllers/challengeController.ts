// import { Response } from 'express';
// import { Op } from 'sequelize';
// import { AuthRequest } from '../types';
// import { Challenge, Participant, Task, User, ChallengeInvite, FamilyMember } from '../models';

// export const challengeController = {

//     // GET /api/challenges/family
//     getFamilyChallenges: async (req: AuthRequest, res: Response): Promise<void> => {
//         try {
//             const userId = req.user!.id;
//             // ✅ Принимаем конкретный familyOwnerId из query
//             const { familyOwnerId } = req.query;

//             let ownerIds: number[];

//             if (familyOwnerId) {
//                 // Конкретная семья — проверяем что пользователь имеет к ней доступ
//                 const ownerId = Number(familyOwnerId);

//                 // Это его семья?
//                 if (ownerId === userId) {
//                     ownerIds = [userId];
//                 } else {
//                     // Он член этой семьи?
//                     const membership = await FamilyMember.findOne({
//                         where: { userId: ownerId, appUserId: userId },
//                     });

//                     if (!membership) {
//                         res.status(403).json({ message: 'Нет доступа к этой семье' });
//                         return;
//                     }
//                     ownerIds = [ownerId];
//                 }
//             } else {
//                 // Все семьи пользователя
//                 const memberEntries = await FamilyMember.findAll({
//                     where: { appUserId: userId },
//                     attributes: ['userId'],
//                 });
//                 ownerIds = [userId, ...memberEntries.map((m) => m.userId)];
//             }

//             const challenges = await Challenge.findAll({
//                 where: { familyOwnerId: ownerIds },
//                 include: [
//                     {
//                         model: Participant,
//                         as: 'participants',
//                         include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatarUrl'] }],
//                     },
//                     { model: User, as: 'creator', attributes: ['id', 'username'] },
//                 ],
//                 order: [['createdAt', 'DESC']],
//             });

//             res.json(challenges);
//         } catch (error: any) {
//             console.error('getFamilyChallenges error:', error.message);
//             res.status(500).json({ message: 'Ошибка: ' + error.message });
//         }
//     },

//     // GET /api/challenges
//     getAll: async (req: AuthRequest, res: Response): Promise<void> => {
//         try {
//             const userId = req.user!.id;
//             const challenges = await Challenge.findAll({
//                 include: [
//                     {
//                         model: Participant,
//                         as: 'participants',
//                         include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatarUrl'] }],
//                     },
//                     { model: User, as: 'creator', attributes: ['id', 'username'] },
//                 ],
//                 where: {
//                     // ✅ Только НЕ семейные челленджи
//                     familyOwnerId: { [Op.is]: null as any },
//                     [Op.or]: [
//                         { visibility: 'public' },
//                         { creatorId: userId },
//                         { '$participants.userId$': userId },
//                     ],
//                 },
//                 order: [['createdAt', 'DESC']],
//             });
//             res.json(challenges);
//         } catch (error) {
//             res.status(500).json({ message: 'Ошибка' });
//         }
//     },

//     // GET /api/challenges/:id
//     getById: async (req: AuthRequest, res: Response): Promise<void> => {
//         try {
//             const userId = req.user!.id;
//             const challenge = await Challenge.findByPk(req.params.id, {
//                 include: [
//                     {
//                         model: Participant,
//                         as: 'participants',
//                         include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatarUrl', 'rating'] }],
//                     },
//                     { model: Task, as: 'tasks', order: [['day', 'ASC']] },
//                     { model: User, as: 'creator', attributes: ['id', 'username'] },
//                 ],
//             });

//             if (!challenge) {
//                 res.status(404).json({ message: 'Челлендж не найден' });
//                 return;
//             }

//             // ✅ Если семейный — проверяем что пользователь член этой семьи
//             if (challenge.familyOwnerId) {
//                 const isFamilyMember = await FamilyMember.findOne({
//                     where: {
//                         userId: challenge.familyOwnerId,
//                         appUserId: userId,
//                     },
//                 });

//                 const isOwner = challenge.familyOwnerId === userId;

//                 if (!isOwner && !isFamilyMember) {
//                     res.status(403).json({ message: 'Нет доступа к этому семейному челленджу' });
//                     return;
//                 }
//             }

//             res.json(challenge);
//         } catch (error) {
//             res.status(500).json({ message: 'Ошибка' });
//         }
//     },

//     // POST /api/challenges
//     create: async (req: AuthRequest, res: Response): Promise<void> => {
//         try {
//             const {
//                 title, description, startDate, endDate,
//                 visibility, betAmount, familyOwnerId,   // ✅ добавили
//             } = req.body;
//             const creatorId = req.user!.id;

//             // Если семейный — проверяем что создатель является владельцем этой семьи
//             if (familyOwnerId) {
//                 if (Number(familyOwnerId) !== creatorId) {
//                     res.status(403).json({
//                         message: 'Только владелец семьи может создавать семейные челленджи',
//                     });
//                     return;
//                 }
//             }

//             const challenge = await Challenge.create({
//                 title, description, startDate, endDate,
//                 creatorId,
//                 visibility: visibility || 'public',
//                 betAmount: betAmount || 0,
//                 status: 'pending',
//                 familyOwnerId: familyOwnerId ? Number(familyOwnerId) : undefined,
//             });

//             // Создатель автоматически участник
//             await Participant.create({
//                 challengeId: challenge.id,
//                 userId: creatorId,
//                 hasConsented: true,
//             });

//             if (betAmount > 0) {
//                 await User.decrement('rikonCoins', { by: betAmount, where: { id: creatorId } });
//             }

//             const full = await Challenge.findByPk(challenge.id, {
//                 include: [
//                     {
//                         model: Participant,
//                         as: 'participants',
//                         include: [{ model: User, as: 'user', attributes: ['id', 'username'] }],
//                     },
//                     { model: User, as: 'creator', attributes: ['id', 'username'] },
//                 ],
//             });

//             res.status(201).json(full);
//         } catch (error) {
//             res.status(500).json({ message: 'Ошибка создания челленджа' });
//         }
//     },
//     // POST /api/challenges/:id/join
//     join: async (req: AuthRequest, res: Response): Promise<void> => {
//         try {
//             const challengeId = Number(req.params.id);
//             const userId = req.user!.id;

//             const challenge = await Challenge.findByPk(challengeId);
//             if (!challenge) {
//                 res.status(404).json({ message: 'Не найден' });
//                 return;
//             }

//             // ✅ Семейный челлендж — только члены этой семьи
//             if (challenge.familyOwnerId) {
//                 const isMember = await FamilyMember.findOne({
//                     where: { userId: challenge.familyOwnerId, appUserId: userId },
//                 });
//                 const isOwner = challenge.familyOwnerId === userId;

//                 if (!isOwner && !isMember) {
//                     res.status(403).json({ message: 'Только члены семьи могут участвовать' });
//                     return;
//                 }
//             }

//             const existing = await Participant.findOne({ where: { challengeId, userId } });
//             if (existing) {
//                 res.status(400).json({ message: 'Уже участвуешь' });
//                 return;
//             }

//             const user = await User.findByPk(userId);
//             if (user && challenge.betAmount > user.rikonCoins) {
//                 res.status(400).json({ message: 'Недостаточно Rikon монет' });
//                 return;
//             }

//             await Participant.create({ challengeId, userId, hasConsented: true });

//             if (challenge.betAmount > 0) {
//                 await User.decrement('rikonCoins', { by: challenge.betAmount, where: { id: userId } });
//             }

//             res.json({ message: 'Ты вступил в семейный челлендж!' });
//         } catch (error) {
//             res.status(500).json({ message: 'Ошибка' });
//         }
//     },

//     // GET /api/challenges/:id/tasks
//     getTasks: async (req: AuthRequest, res: Response): Promise<void> => {
//         try {
//             const tasks = await Task.findAll({
//                 where: { challengeId: req.params.id },
//                 order: [['day', 'ASC']],
//             });
//             res.json(tasks);
//         } catch (error) {
//             res.status(500).json({ message: 'Ошибка' });
//         }
//     },

//     updateStatus: async (req: AuthRequest, res: Response): Promise<void> => {
//         try {
//             const { status } = req.body;
//             const challenge = await Challenge.findByPk(req.params.id);

//             if (!challenge) {
//                 res.status(404).json({ message: 'Не найден' });
//                 return;
//             }

//             if (challenge.creatorId !== req.user!.id) {
//                 res.status(403).json({ message: 'Нет прав' });
//                 return;
//             }

//             await challenge.update({ status });

//             // Автоматически завершаем все ставки при завершении челленджа
//             if (status === 'completed') {
//                 const { betController } = await import('./betController');
//                 await betController.settleChallengeBets(challenge.id);
//             }

//             res.json(challenge);
//         } catch (error) {
//             res.status(500).json({ message: 'Ошибка' });
//         }
//     },

//     inviteUser: async (req: AuthRequest, res: Response): Promise<void> => {
//         try {
//             const challengeId = Number(req.params.id);
//             const { toUserId } = req.body;
//             const fromUserId = req.user!.id;

//             const challenge = await Challenge.findByPk(challengeId);
//             if (!challenge) {
//                 res.status(404).json({ message: 'Челлендж не найден' });
//                 return;
//             }

//             if (challenge.creatorId !== fromUserId) {
//                 res.status(403).json({ message: 'Только создатель может приглашать' });
//                 return;
//             }

//             const existing = await ChallengeInvite.findOne({
//                 where: { challengeId, toUserId, status: 'pending' },
//             });

//             if (existing) {
//                 res.status(400).json({ message: 'Приглашение уже отправлено' });
//                 return;
//             }

//             await ChallengeInvite.create({ challengeId, fromUserId, toUserId: Number(toUserId) });
//             res.status(201).json({ message: 'Приглашение отправлено!' });
//         } catch (error) {
//             res.status(500).json({ message: 'Ошибка' });
//         }
//     },

//     // GET /api/challenges/my-invites
//     getMyChallengeInvites: async (req: AuthRequest, res: Response): Promise<void> => {
//         try {
//             const userId = req.user!.id;

//             const invites = await ChallengeInvite.findAll({
//                 where: { toUserId: userId, status: 'pending' },
//                 order: [['createdAt', 'DESC']],
//             });

//             // ✅ Загружаем данные вручную без сложных include
//             const result = await Promise.all(
//                 invites.map(async (invite) => {
//                     const challenge = await Challenge.findByPk(invite.challengeId, {
//                         attributes: ['id', 'title', 'description', 'betAmount'],
//                     });
//                     const sender = await User.findByPk(invite.fromUserId, {
//                         attributes: ['id', 'username'],
//                     });

//                     return {
//                         id: invite.id,
//                         challengeId: invite.challengeId,
//                         status: invite.status,
//                         createdAt: invite.createdAt,
//                         challenge,
//                         inviteSender: sender,
//                     };
//                 })
//             );

//             res.json(result);
//         } catch (error: any) {
//             console.error('getMyChallengeInvites error:', error.message);
//             res.status(500).json({ message: 'Ошибка получения приглашений: ' + error.message });
//         }
//     },

//     // PATCH /api/challenges/invites/:inviteId
//     respondChallengeInvite: async (req: AuthRequest, res: Response): Promise<void> => {
//         try {
//             const { inviteId } = req.params;
//             const { accept } = req.body;
//             const userId = req.user!.id;

//             const invite = await ChallengeInvite.findByPk(inviteId);
//             if (!invite || invite.toUserId !== userId) {
//                 res.status(404).json({ message: 'Не найдено' });
//                 return;
//             }

//             if (accept) {
//                 // Добавляем как участника
//                 const existing = await Participant.findOne({
//                     where: { challengeId: invite.challengeId, userId },
//                 });

//                 if (!existing) {
//                     await Participant.create({
//                         challengeId: invite.challengeId,
//                         userId,
//                         hasConsented: true,
//                     });
//                 }
//                 await invite.update({ status: 'accepted' });
//                 res.json({ message: 'Принято! Ты в челлендже.' });
//             } else {
//                 await invite.update({ status: 'rejected' });
//                 res.json({ message: 'Отклонено' });
//             }
//         } catch (error) {
//             res.status(500).json({ message: 'Ошибка' });
//         }
//     },

//     // GET /api/challenges/search-users?q=
//     searchUsersForInvite: async (req: AuthRequest, res: Response): Promise<void> => {
//         try {
//             const { q } = req.query;
//             const userId = req.user!.id;

//             if (!q || String(q).trim().length < 2) {
//                 res.json([]);
//                 return;
//             }

//             const users = await User.findAll({
//                 where: {
//                     username: { [Op.iLike]: `%${q}%` },
//                     id: { [Op.ne]: userId },
//                 },
//                 attributes: ['id', 'username', 'avatarUrl', 'rating'],
//                 limit: 10,
//             });

//             res.json(users);
//         } catch (error) {
//             res.status(500).json({ message: 'Ошибка поиска' });
//         }
//     },

// };

import { Response } from 'express';
import { Op } from 'sequelize';
import { AuthRequest } from '../types';
import { Challenge, Participant, Task, User, ChallengeInvite, FamilyMember } from '../models';

// ─────────────────────────────────────────────────────────────
// Вспомогательная функция — распределение призового пула
// 1 место: 50%, 2 место: 30%, 3 место: 20%
// Если 2 участника: 70% / 30%
// Если 1 участник: возврат монет
// ─────────────────────────────────────────────────────────────
const distributePrizePool = async (challengeId: number): Promise<void> => {
    try {
        const challenge = await Challenge.findByPk(challengeId);
        if (!challenge || challenge.betAmount === 0) return;

        const participants = await Participant.findAll({
            where: { challengeId },
            order: [['score', 'DESC']],
        });

        if (participants.length === 0) return;

        const totalPool = challenge.betAmount * participants.length;

        console.log(`💰 Призовой пул челленджа #${challengeId}: ${totalPool} монет`);
        console.log(`👥 Участников: ${participants.length}`);

        const prizes: { userId: number; prize: number; place: number }[] = [];

        if (participants.length === 1) {
            // Один участник — возвращаем монеты
            prizes.push({ userId: participants[0].userId, prize: totalPool, place: 1 });

        } else if (participants.length === 2) {
            // Два участника — 70% / 30%
            prizes.push({ userId: participants[0].userId, prize: Math.floor(totalPool * 0.7), place: 1 });
            prizes.push({ userId: participants[1].userId, prize: Math.floor(totalPool * 0.3), place: 2 });

        } else {
            // Три и более — 50% / 30% / 20%
            prizes.push({ userId: participants[0].userId, prize: Math.floor(totalPool * 0.5), place: 1 });
            prizes.push({ userId: participants[1].userId, prize: Math.floor(totalPool * 0.3), place: 2 });
            prizes.push({ userId: participants[2].userId, prize: Math.floor(totalPool * 0.2), place: 3 });
            // Остальные теряют монеты
        }

        for (const { userId, prize, place } of prizes) {
            await User.increment('rikonCoins', { by: prize, where: { id: userId } });
            console.log(`🏆 Место #${place}: userId ${userId} получает ${prize} монет`);
        }

        console.log(`✅ Призовой пул распределён для челленджа #${challengeId}`);
    } catch (error: any) {
        console.error('distributePrizePool error:', error.message);
    }
};

// ─────────────────────────────────────────────────────────────
// Вспомогательная функция — формат призового пула для ответа
// ─────────────────────────────────────────────────────────────
const buildPrizeInfo = (totalPool: number, participantCount: number) => {
    if (participantCount === 0 || totalPool === 0) {
        return { totalPool: 0, prizes: [] };
    }

    if (participantCount === 1) {
        return {
            totalPool,
            prizes: [
                { place: 1, percent: 100, amount: totalPool, label: '🥇 1 место' },
            ],
        };
    }

    if (participantCount === 2) {
        return {
            totalPool,
            prizes: [
                { place: 1, percent: 70, amount: Math.floor(totalPool * 0.7), label: '🥇 1 место' },
                { place: 2, percent: 30, amount: Math.floor(totalPool * 0.3), label: '🥈 2 место' },
            ],
        };
    }

    return {
        totalPool,
        prizes: [
            { place: 1, percent: 50, amount: Math.floor(totalPool * 0.5), label: '🥇 1 место' },
            { place: 2, percent: 30, amount: Math.floor(totalPool * 0.3), label: '🥈 2 место' },
            { place: 3, percent: 20, amount: Math.floor(totalPool * 0.2), label: '🥉 3 место' },
        ],
    };
};

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

            const result = challenges.map((c: any) => {
                const participantCount = c.participants?.length ?? 0;
                const prizePool = c.betAmount * participantCount;
                return { ...c.toJSON(), prizePool };
            });

            res.json(result);
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
                    // НЕ семейные
                    familyOwnerId: { [Op.is]: null as any },
                    [Op.or]: [
                        { visibility: 'public' },                    // ✅ публичный — всем
                        { visibility: 'protected' },                 // ✅ protected — тоже виден в списке
                        { creatorId: userId },                       // ✅ свои secret тоже видишь
                        { '$participants.userId$': userId },         // ✅ участник secret — видишь
                    ],
                },
                order: [['createdAt', 'DESC']],
            });

            const result = challenges.map((c: any) => {
                const participantCount = c.participants?.length ?? 0;
                const prizePool = c.betAmount * participantCount;
                const plain = c.toJSON();
                delete plain.accessPassword; // ❌ никогда не отдаём пароль клиенту
                return {
                    ...plain,
                    prizePool,
                    hasPassword: plain.visibility === 'protected' && !!c.accessPassword,
                };
            });

            res.json(result);
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

            const participantCount = (challenge as any).participants?.length ?? 0;
            const totalPool = challenge.betAmount * participantCount;
            const prizeInfo = buildPrizeInfo(totalPool, participantCount);

            res.json({
                ...challenge.toJSON(),
                prizePool: totalPool,
                prizeInfo,
            });
        } catch (error) {
            res.status(500).json({ message: 'Ошибка' });
        }
    },

    // POST /api/challenges
    create: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const {
                title, description, startDate, endDate,
                visibility, betAmount, familyOwnerId,
            } = req.body;
            const creatorId = req.user!.id;

            if (familyOwnerId && Number(familyOwnerId) !== creatorId) {
                res.status(403).json({
                    message: 'Только владелец семьи может создавать семейные челленджи',
                });
                return;
            }

            if (betAmount > 0) {
                const creator = await User.findByPk(creatorId);
                if (!creator || creator.rikonCoins < betAmount) {
                    res.status(400).json({
                        message: `Недостаточно монет. У тебя ${creator?.rikonCoins ?? 0} 🪙`,
                    });
                    return;
                }
            }

            const challenge = await Challenge.create({
                title, description, startDate, endDate,
                creatorId,
                visibility: visibility || 'public',
                betAmount: betAmount || 0,
                status: 'pending',
                familyOwnerId: familyOwnerId ? Number(familyOwnerId) : undefined,
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

            const prizePool = betAmount || 0;
            const prizeInfo = buildPrizeInfo(prizePool, 1);

            res.status(201).json({ ...(full as any).toJSON(), prizePool, prizeInfo });
        } catch (error) {
            res.status(500).json({ message: 'Ошибка создания челленджа' });
        }
    },

    // POST /api/challenges/:id/join
    join: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const challengeId = Number(req.params.id);
            const userId = req.user!.id;

            const challenge = await Challenge.findByPk(challengeId);
            if (!challenge) {
                res.status(404).json({ message: 'Не найден' });
                return;
            }

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

            const existing = await Participant.findOne({ where: { challengeId, userId } });
            if (existing) {
                res.status(400).json({ message: 'Уже участвуешь' });
                return;
            }

            if (challenge.betAmount > 0) {
                const user = await User.findByPk(userId);
                if (!user || user.rikonCoins < challenge.betAmount) {
                    res.status(400).json({
                        message: `Недостаточно монет. Нужно ${challenge.betAmount} 🪙, у тебя ${user?.rikonCoins ?? 0} 🪙`,
                    });
                    return;
                }
            }

            await Participant.create({ challengeId, userId, hasConsented: true });

            if (challenge.betAmount > 0) {
                await User.decrement('rikonCoins', { by: challenge.betAmount, where: { id: userId } });
            }

            const participantCount = await Participant.count({ where: { challengeId } });
            const totalPool = challenge.betAmount * participantCount;
            const prizeInfo = buildPrizeInfo(totalPool, participantCount);

            res.json({
                message: challenge.betAmount > 0
                    ? `🎉 Ты в игре! ${challenge.betAmount} 🪙 добавлены в призовой пул.`
                    : '🎉 Ты вступил в челлендж!',
                prizePool: totalPool,
                prizeInfo,
            });
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

            // ✅ Автоматически распределяем призы при завершении
            if (status === 'completed' && challenge.betAmount > 0) {
                await distributePrizePool(challenge.id);
            }

            res.json(challenge);
        } catch (error) {
            res.status(500).json({ message: 'Ошибка' });
        }
    },

    // GET /api/challenges/:id/prize-pool
    // ✅ Новый роут — детальная информация о призовом пуле
    getPrizePool: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const challenge = await Challenge.findByPk(req.params.id);
            if (!challenge) {
                res.status(404).json({ message: 'Челлендж не найден' });
                return;
            }

            const participants = await Participant.findAll({
                where: { challengeId: challenge.id },
                include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatarUrl'] }],
                order: [['score', 'DESC']],
            });

            const participantCount = participants.length;
            const totalPool = challenge.betAmount * participantCount;
            const prizeInfo = buildPrizeInfo(totalPool, participantCount);

            // Добавляем имена призёров если челлендж завершён
            const enrichedPrizes = prizeInfo.prizes.map((prize, i) => ({
                ...prize,
                user: participants[i]
                    ? {
                        id: (participants[i] as any).user?.id,
                        username: (participants[i] as any).user?.username,
                    }
                    : null,
            }));

            res.json({
                challengeId: challenge.id,
                betAmount: challenge.betAmount,
                participantCount,
                totalPool,
                status: challenge.status,
                prizes: enrichedPrizes,
            });
        } catch (error: any) {
            console.error('getPrizePool error:', error.message);
            res.status(500).json({ message: 'Ошибка' });
        }
    },

    // POST /api/challenges/:id/invite
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

    // GET /api/challenges/my-invites
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

                    const participantCount = await Participant.count({
                        where: { challengeId: invite.challengeId },
                    });
                    const prizePool = (challenge?.betAmount ?? 0) * participantCount;

                    return {
                        id: invite.id,
                        challengeId: invite.challengeId,
                        status: invite.status,
                        createdAt: invite.createdAt,
                        challenge: challenge ? { ...challenge.toJSON(), prizePool } : null,
                        inviteSender: sender,
                    };
                })
            );

            res.json(result);
        } catch (error: any) {
            console.error('getMyChallengeInvites error:', error.message);
            res.status(500).json({ message: 'Ошибка: ' + error.message });
        }
    },

    // PATCH /api/challenges/invites/:inviteId
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
                const challenge = await Challenge.findByPk(invite.challengeId);

                if (challenge && challenge.betAmount > 0) {
                    const user = await User.findByPk(userId);
                    if (!user || user.rikonCoins < challenge.betAmount) {
                        res.status(400).json({
                            message: `Недостаточно монет. Нужно ${challenge.betAmount} 🪙 для участия`,
                        });
                        return;
                    }
                }

                const existing = await Participant.findOne({
                    where: { challengeId: invite.challengeId, userId },
                });

                if (!existing) {
                    await Participant.create({
                        challengeId: invite.challengeId,
                        userId,
                        hasConsented: true,
                    });

                    if (challenge && challenge.betAmount > 0) {
                        await User.decrement('rikonCoins', {
                            by: challenge.betAmount,
                            where: { id: userId },
                        });
                    }
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

    // GET /api/challenges/search-users?q=
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