import { Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { AuthRequest } from '../types';
import { Challenge, Participant, Task, User, Submission } from '../models';

export const betController = {
  createBet: async (req: AuthRequest, res: Response): Promise<void> => {
    const transaction = await sequelize.transaction();
    try {
      const { title, description, endDate, betAmount } = req.body;
      const userId = req.user!.id;

      if (!betAmount || betAmount <= 0) {
        await transaction.rollback();
        res.status(400).json({ message: 'Неверная сумма ставки' });
        return;
      }

      const user = await User.findByPk(userId, { transaction });
      if (!user || user.rikonCoins < betAmount) {
        await transaction.rollback();
        res.status(400).json({ message: 'Недостаточно Rikon' });
        return;
      }

      const bet = await Challenge.create(
        {
          title,
          description,
          startDate: new Date(),
          endDate,
          creatorId: userId,
          status: 'pending',
          visibility: 'public',
          betAmount,
        },
        { transaction }
      );

      await Task.create(
        {
          challengeId: bet.id,
          title: 'Доказательство спора',
          description: 'Загрузите медиа для подтверждения выполнения',
          day: 1,
        } as any,
        { transaction }
      );

      await Participant.create(
        {
          challengeId: bet.id,
          userId,
          hasConsented: true,
        },
        { transaction }
      );

      await user.decrement('rikonCoins', { by: betAmount, transaction });

      await transaction.commit();
      res.status(201).json(bet);
    } catch (error: any) {
      await transaction.rollback();
      res.status(500).json({ message: error.message });
    }
  },

  joinBet: async (req: AuthRequest, res: Response): Promise<void> => {
    const transaction = await sequelize.transaction();
    try {
      const betId = Number(req.params.id);
      const userId = req.user!.id;

      const bet = await Challenge.findByPk(betId, { transaction });
      
      if (!bet || bet.betAmount === 0 || bet.status !== 'pending') {
        await transaction.rollback();
        res.status(400).json({ message: 'Спор недоступен' });
        return;
      }

      if (bet.creatorId === userId) {
        await transaction.rollback();
        res.status(400).json({ message: 'Нельзя вступить в свой спор' });
        return;
      }

      const participantsCount = await Participant.count({
        where: { challengeId: betId },
        transaction,
      });

      if (participantsCount >= 2) {
        await transaction.rollback();
        res.status(400).json({ message: 'В споре уже 2 участника' });
        return;
      }

      const user = await User.findByPk(userId, { transaction });
      if (!user || user.rikonCoins < bet.betAmount) {
        await transaction.rollback();
        res.status(400).json({ message: 'Недостаточно Rikon' });
        return;
      }

      await Participant.create(
        {
          challengeId: betId,
          userId,
          hasConsented: true,
        },
        { transaction }
      );

      await user.decrement('rikonCoins', { by: bet.betAmount, transaction });
      await bet.update({ status: 'active' }, { transaction });

      await transaction.commit();
      res.json(bet);
    } catch (error: any) {
      await transaction.rollback();
      res.status(500).json({ message: error.message });
    }
  },

  getBets: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const bets = await Challenge.findAll({
        where: {
          betAmount: { [Op.gt]: 0 },
          familyOwnerId: { [Op.is]: null as any },
        },
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

      res.json(bets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  getBetDetails: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const betId = Number(req.params.id);
      
      const bet = await Challenge.findOne({
        where: { id: betId, betAmount: { [Op.gt]: 0 } },
        include: [
          {
            model: Participant,
            as: 'participants',
            include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatarUrl', 'rating'] }],
          },
          { model: Task, as: 'tasks' },
          { model: User, as: 'creator', attributes: ['id', 'username'] },
        ],
      });

      if (!bet) {
        res.status(404).json({ message: 'Спор не найден' });
        return;
      }

      const taskIds = (bet as any).tasks?.map((t: any) => t.id) || [];
      const submissions = await Submission.findAll({
        where: { taskId: taskIds },
      });

      res.json({ ...bet.toJSON(), submissions });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },
};
