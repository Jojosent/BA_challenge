import { Response } from 'express';
import { Op } from 'sequelize';
import { AuthRequest } from '../types';
import { Bet, User, Challenge, Participant } from '../models';

export const betController = {

  // ─────────────────────────────────────────────────────────────
  // POST /api/bets
  // Создать ставку: fromUser ставит amount монет,
  // targetUserId — тот, на чью победу ставит
  // toUserId — тот, кто должен принять вызов (оппонент)
  // ─────────────────────────────────────────────────────────────
  create: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const fromUserId = req.user!.id;
      const { challengeId, toUserId, targetUserId, amount, description } = req.body;

      // Валидация полей
      if (!challengeId || !toUserId || !targetUserId || !amount || !description) {
        res.status(400).json({ message: 'Заполни все поля' });
        return;
      }
      if (amount < 1) {
        res.status(400).json({ message: 'Минимальная ставка — 1 монета' });
        return;
      }
      if (fromUserId === toUserId) {
        res.status(400).json({ message: 'Нельзя ставить на самого себя' });
        return;
      }

      // targetUserId должен быть либо fromUser либо toUser
      if (targetUserId !== fromUserId && Number(targetUserId) !== Number(toUserId)) {
        res.status(400).json({ message: 'targetUserId должен быть одним из участников ставки' });
        return;
      }

      // Проверяем что оба участники челленджа
      const challenge = await Challenge.findByPk(challengeId);
      if (!challenge) {
        res.status(404).json({ message: 'Челлендж не найден' });
        return;
      }

      const fromParticipant = await Participant.findOne({
        where: { challengeId, userId: fromUserId },
      });
      const toParticipant = await Participant.findOne({
        where: { challengeId, userId: Number(toUserId) },
      });

      if (!fromParticipant) {
        res.status(403).json({ message: 'Ты не участник этого челленджа' });
        return;
      }
      if (!toParticipant) {
        res.status(400).json({ message: 'Оппонент не участник этого челленджа' });
        return;
      }

      // Проверяем баланс
      const fromUser = await User.findByPk(fromUserId);
      if (!fromUser || fromUser.rikonCoins < amount) {
        res.status(400).json({ message: `Недостаточно монет. У тебя ${fromUser?.rikonCoins ?? 0} 🪙` });
        return;
      }

      // Проверяем нет ли уже активной ставки между этими двумя в этом челлендже
      const existingBet = await Bet.findOne({
        where: {
          challengeId,
          status: { [Op.in]: ['pending', 'active'] },
          [Op.or]: [
            { fromUserId, toUserId: Number(toUserId) },
            { fromUserId: Number(toUserId), toUserId: fromUserId },
          ],
        },
      });
      if (existingBet) {
        res.status(400).json({ message: 'Между вами уже есть активная ставка в этом челлендже' });
        return;
      }

      // Списываем монеты у создателя и замораживаем
      await User.decrement('rikonCoins', { by: amount, where: { id: fromUserId } });

      const bet = await Bet.create({
        challengeId: Number(challengeId),
        fromUserId,
        toUserId: Number(toUserId),
        targetUserId: Number(targetUserId),
        amount: Number(amount),
        description: description.trim(),
        status: 'pending',
      });

      res.status(201).json(bet);
    } catch (error: any) {
      console.error('bet create error:', error.message);
      res.status(500).json({ message: 'Ошибка создания ставки' });
    }
  },

  // ─────────────────────────────────────────────────────────────
  // PATCH /api/bets/:betId/respond
  // toUser принимает или отклоняет ставку
  // accept: true → блокируем монеты toUser, ставка активна
  // accept: false → возвращаем монеты fromUser
  // ─────────────────────────────────────────────────────────────
  respond: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { betId } = req.params;
      const { accept } = req.body;
      const userId = req.user!.id;

      const bet = await Bet.findByPk(betId);
      if (!bet) {
        res.status(404).json({ message: 'Ставка не найдена' });
        return;
      }
      if (bet.toUserId !== userId) {
        res.status(403).json({ message: 'Эта ставка не адресована тебе' });
        return;
      }
      if (bet.status !== 'pending') {
        res.status(400).json({ message: 'Ставка уже обработана' });
        return;
      }

      if (!accept) {
        // Отклонили — возвращаем монеты
        await User.increment('rikonCoins', { by: bet.amount, where: { id: bet.fromUserId } });
        await bet.update({ status: 'declined' });
        res.json({ message: 'Ставка отклонена, монеты возвращены' });
        return;
      }

      // Принимаем — проверяем баланс toUser (он тоже ставит столько же)
      const toUser = await User.findByPk(userId);
      if (!toUser || toUser.rikonCoins < bet.amount) {
        res.status(400).json({
          message: `Недостаточно монет. У тебя ${toUser?.rikonCoins ?? 0} 🪙, нужно ${bet.amount} 🪙`,
        });
        return;
      }

      // Списываем монеты у toUser
      await User.decrement('rikonCoins', { by: bet.amount, where: { id: userId } });
      await bet.update({ status: 'active' });

      res.json({ message: `Ставка принята! Банк: ${bet.amount * 2} 🪙. Удачи!` });
    } catch (error: any) {
      console.error('bet respond error:', error.message);
      res.status(500).json({ message: 'Ошибка ответа на ставку' });
    }
  },

  // ─────────────────────────────────────────────────────────────
  // PATCH /api/bets/:betId/cancel
  // Создатель отменяет pending ставку
  // ─────────────────────────────────────────────────────────────
  cancel: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { betId } = req.params;
      const userId = req.user!.id;

      const bet = await Bet.findByPk(betId);
      if (!bet) {
        res.status(404).json({ message: 'Ставка не найдена' });
        return;
      }
      if (bet.fromUserId !== userId) {
        res.status(403).json({ message: 'Только создатель может отменить ставку' });
        return;
      }
      if (bet.status !== 'pending') {
        res.status(400).json({ message: 'Отменить можно только ставку в статусе "ожидание"' });
        return;
      }

      // Возвращаем монеты
      await User.increment('rikonCoins', { by: bet.amount, where: { id: userId } });
      await bet.update({ status: 'cancelled' });

      res.json({ message: 'Ставка отменена, монеты возвращены' });
    } catch (error: any) {
      console.error('bet cancel error:', error.message);
      res.status(500).json({ message: 'Ошибка отмены ставки' });
    }
  },

  // ─────────────────────────────────────────────────────────────
  // PATCH /api/bets/:betId/resolve
  // Ручное завершение ставки: создатель указывает победителя
  // Только если оба участника соглашаются (для простоты — создатель указывает)
  // ─────────────────────────────────────────────────────────────
  resolve: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { betId } = req.params;
      const { winnerId } = req.body;
      const userId = req.user!.id;

      const bet = await Bet.findByPk(betId);
      if (!bet) {
        res.status(404).json({ message: 'Ставка не найдена' });
        return;
      }
      if (bet.status !== 'active') {
        res.status(400).json({ message: 'Завершить можно только активную ставку' });
        return;
      }

      // Завершить может любой из двух участников
      if (bet.fromUserId !== userId && bet.toUserId !== userId) {
        res.status(403).json({ message: 'Нет доступа' });
        return;
      }

      // winnerId должен быть одним из участников
      if (Number(winnerId) !== bet.fromUserId && Number(winnerId) !== bet.toUserId) {
        res.status(400).json({ message: 'Победитель должен быть участником ставки' });
        return;
      }

      const loserId = Number(winnerId) === bet.fromUserId ? bet.toUserId : bet.fromUserId;
      const prize   = bet.amount * 2; // весь банк

      // Начисляем победителю
      await User.increment('rikonCoins', { by: prize, where: { id: Number(winnerId) } });

      await bet.update({
        status:   Number(winnerId) === bet.fromUserId ? 'won' : 'lost',
        winnerId: Number(winnerId),
      });

      const winner = await User.findByPk(Number(winnerId), { attributes: ['username'] });

      res.json({
        message: `🏆 ${winner?.username} выиграл ${prize} 🪙!`,
        winnerId: Number(winnerId),
        prize,
      });
    } catch (error: any) {
      console.error('bet resolve error:', error.message);
      res.status(500).json({ message: 'Ошибка завершения ставки' });
    }
  },

  // ─────────────────────────────────────────────────────────────
  // GET /api/bets/challenge/:challengeId
  // Все ставки по челленджу
  // ─────────────────────────────────────────────────────────────
  getByChallengeId: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { challengeId } = req.params;
      const userId = req.user!.id;

      const bets = await Bet.findAll({
        where: { challengeId: Number(challengeId) },
        order: [['createdAt', 'DESC']],
      });

      // Подгружаем пользователей
      const userIds = [...new Set(bets.flatMap((b) => [b.fromUserId, b.toUserId, b.targetUserId]))];
      const users   = await User.findAll({
        where: { id: userIds },
        attributes: ['id', 'username', 'avatarUrl', 'rikonCoins'],
      });
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

      const result = bets.map((b) => ({
        id:          b.id,
        challengeId: b.challengeId,
        amount:      b.amount,
        description: b.description,
        status:      b.status,
        winnerId:    b.winnerId,
        createdAt:   b.createdAt,
        isMyBet:     b.fromUserId === userId || b.toUserId === userId,
        isMine:      b.fromUserId === userId,   // я создатель?
        isTarget:    b.toUserId === userId,      // мне адресовано?
        fromUser:    userMap[b.fromUserId]  ? { id: userMap[b.fromUserId].id,   username: userMap[b.fromUserId].username }   : null,
        toUser:      userMap[b.toUserId]    ? { id: userMap[b.toUserId].id,     username: userMap[b.toUserId].username }     : null,
        targetUser:  userMap[b.targetUserId]? { id: userMap[b.targetUserId].id, username: userMap[b.targetUserId].username } : null,
      }));

      res.json(result);
    } catch (error: any) {
      console.error('getByChallengeId error:', error.message);
      res.status(500).json({ message: 'Ошибка загрузки ставок' });
    }
  },

  // ─────────────────────────────────────────────────────────────
  // GET /api/bets/my
  // Мои ставки (все, где я fromUser или toUser)
  // ─────────────────────────────────────────────────────────────
  getMy: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      const bets = await Bet.findAll({
        where: {
          [Op.or]: [
            { fromUserId: userId },
            { toUserId: userId },
          ],
        },
        order: [['createdAt', 'DESC']],
      });

      const userIds = [...new Set(bets.flatMap((b) => [b.fromUserId, b.toUserId]))];
      const users   = await User.findAll({
        where: { id: userIds },
        attributes: ['id', 'username', 'avatarUrl'],
      });
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

      const result = bets.map((b) => ({
        id:          b.id,
        challengeId: b.challengeId,
        amount:      b.amount,
        description: b.description,
        status:      b.status,
        winnerId:    b.winnerId,
        createdAt:   b.createdAt,
        isMine:      b.fromUserId === userId,
        isTarget:    b.toUserId === userId,
        fromUser:    userMap[b.fromUserId]  ? { id: userMap[b.fromUserId].id,  username: userMap[b.fromUserId].username }  : null,
        toUser:      userMap[b.toUserId]    ? { id: userMap[b.toUserId].id,    username: userMap[b.toUserId].username }    : null,
        targetUser:  userMap[b.targetUserId]? { id: userMap[b.targetUserId].id, username: userMap[b.targetUserId].username }: null,
      }));

      res.json(result);
    } catch (error: any) {
      console.error('getMy error:', error.message);
      res.status(500).json({ message: 'Ошибка загрузки моих ставок' });
    }
  },
};