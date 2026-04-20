import { Response } from 'express';
import path from 'path';
import { AuthRequest } from '../types';
import { Submission, Task, Participant, Challenge } from '../models';
import { ENV } from '../config/env';

export const submissionController = {

    // POST /api/submissions  (с файлом)
    create: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { taskId } = req.body;
            const userId = req.user!.id;
            const file = req.file;

            if (!file) {
                res.status(400).json({ message: 'Файл не загружен' });
                return;
            }

            // Проверяем что задача существует
            const task = await Task.findByPk(taskId);
            if (!task) {
                res.status(404).json({ message: 'Задача не найдена' });
                return;
            }

            // Проверяем что пользователь участник челленджа
            const participant = await Participant.findOne({
                where: { challengeId: task.challengeId, userId },
            });

            if (!participant) {
                res.status(403).json({ message: 'Ты не участник этого челленджа' });
                return;
            }

            // Определяем тип файла
            const isVideo = file.mimetype.startsWith('video/');
            const mediaType = isVideo ? 'video' : 'photo';

            // Формируем URL для доступа к файлу
            const mediaUrl = `${ENV.BASE_URL}/uploads/${isVideo ? 'videos' : 'photos'}/${file.filename}`;

            const submission = await Submission.create({
                taskId: Number(taskId),
                userId,
                mediaUrl,
                mediaType,
            });

            res.status(201).json(submission);
        } catch (error) {
            console.error('Submission error:', error);
            res.status(500).json({ message: 'Ошибка загрузки файла' });
        }
    },

    // GET /api/submissions/task/:taskId
    getByTask: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { taskId } = req.params;

            const submissions = await Submission.findAll({
                where: { taskId: Number(taskId) },
                include: [
                    {
                        model: require('../models').User,
                        as: 'user',
                        attributes: ['id', 'username', 'avatarUrl'],
                    },
                ],
                order: [['createdAt', 'DESC']],
            });

            res.json(submissions);
        } catch (error) {
            res.status(500).json({ message: 'Ошибка' });
        }
    },

    // GET /api/submissions/my/:challengeId
    getMySubmissions: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { challengeId } = req.params;
            const userId = req.user!.id;

            // Получаем все задачи этого челленджа
            const tasks = await Task.findAll({
                where: { challengeId: Number(challengeId) },
            });
            const taskIds = tasks.map((t) => t.id);

            const submissions = await Submission.findAll({
                where: { userId, taskId: taskIds },
                include: [
                    {
                        model: Task,
                        as: 'task',
                        attributes: ['id', 'title', 'day'],
                    },
                ],
                order: [['createdAt', 'DESC']],
            });

            res.json(submissions);
        } catch (error) {
            res.status(500).json({ message: 'Ошибка' });
        }
    },
};