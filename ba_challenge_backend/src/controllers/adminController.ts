import { Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { AuthRequest } from '../types';
import { Challenge, Participant, Task, User, Submission } from '../models';
import { deleteChallengFiles } from '../utils/cleanupFiles';

export const adminController = {
  // Просмотр детальной информации челленджа (любого типа)
  getChallengeDetail: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const challenge = await Challenge.findByPk(req.params.id, {
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

      if (!challenge) {
        res.status(404).json({ message: 'Челлендж не найден' });
        return;
      }

      res.json(challenge);
    } catch (error: any) {
      res.status(500).json({ message: 'Ошибка при получении челленджа: ' + error.message });
    }
  },

  // Поиск челленджей (по названию, статусу, категории)
  searchChallenges: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { q, status, visibility } = req.query;
      const whereClause: any = {};

      if (q) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${q}%` } },
          { description: { [Op.iLike]: `%${q}%` } }
        ];
      }
      if (status) whereClause.status = status;
      if (visibility) whereClause.visibility = visibility;

      const challenges = await Challenge.findAll({
        where: whereClause,
        include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }],
        order: [['createdAt', 'DESC']],
      });

      res.json(challenges);
    } catch (error: any) {
      res.status(500).json({ message: 'Ошибка поиска: ' + error.message });
    }
  },

  // Завершение челленджа (срабатывает логика очистки и распределения из оригинального контроллера)
  completeChallenge: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const challenge = await Challenge.findByPk(req.params.id);
      if (!challenge) {
        res.status(404).json({ message: 'Челлендж не найден' });
        return;
      }

      await challenge.update({ status: 'completed' });
      // Здесь можно вызвать distributePrizePool из challengeController, если вынесешь её в utils
      
      res.json({ message: 'Челлендж принудительно завершен администратором', challenge });
    } catch (error: any) {
      res.status(500).json({ message: 'Ошибка завершения: ' + error.message });
    }
  },

  // Разрешение спора: Админ назначает победителя вручную
  resolveDispute: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const challengeId = Number(req.params.id);
      const { winnerUserId } = req.body; // Админ передает ID победителя

      const transaction = await sequelize.transaction();

      try {
        const challenge = await Challenge.findByPk(challengeId, { transaction });
        if (!challenge) throw new Error('Челлендж не найден');

        const participants = await Participant.findAll({ where: { challengeId }, transaction });
        
        // Начисляем весь пул победителю
        const totalPool = challenge.betAmount * participants.length;
        if (totalPool > 0) {
          await User.increment('rikonCoins', { 
            by: totalPool, 
            where: { id: winnerUserId }, 
            transaction 
          });
        }

        // Закрываем челлендж
        await challenge.update({ status: 'completed' }, { transaction });
        
        await transaction.commit();
        res.json({ message: `Спор разрешен. Победитель: ${winnerUserId}, Выигрыш: ${totalPool}` });
      } catch (err: any) {
        await transaction.rollback();
        throw err;
      }
    } catch (error: any) {
      res.status(500).json({ message: 'Ошибка разрешения спора: ' + error.message });
    }
  },

  // Удаление челленджа с возвратом коинов (Refund)
  deleteChallenge: async (req: AuthRequest, res: Response): Promise<void> => {
    const challengeId = Number(req.params.id);
    const transaction = await sequelize.transaction();

    try {
      const challenge = await Challenge.findByPk(challengeId, { transaction });
      if (!challenge) {
        await transaction.rollback();
        res.status(404).json({ message: 'Челлендж не найден' });
        return;
      }

      // 1. Находим всех участников
      const participants = await Participant.findAll({ where: { challengeId }, transaction });

      // 2. Оформляем возврат средств (Refund)
      if (challenge.betAmount > 0) {
        for (const participant of participants) {
          await User.increment('rikonCoins', {
            by: challenge.betAmount,
            where: { id: participant.userId },
            transaction,
          });
        }
      }

      // 3. Удаляем связанные данные (Каскадное удаление обычно настраивается в моделях, 
      // но если нет — удаляем участников вручную)
      await Participant.destroy({ where: { challengeId }, transaction });
      
      // 4. Удаляем сам челлендж
      await challenge.destroy({ transaction });

      await transaction.commit();

      // Асинхронно удаляем файлы, не блокируя ответ
      setImmediate(async () => {
        await deleteChallengFiles(challengeId);
      });

      res.json({ 
        message: 'Челлендж успешно удален. Коины возвращены участникам.',
        refundedAmountPerUser: challenge.betAmount
      });
    } catch (error: any) {
      await transaction.rollback();
      res.status(500).json({ message: 'Ошибка при удалении: ' + error.message });
    }
  },
};
