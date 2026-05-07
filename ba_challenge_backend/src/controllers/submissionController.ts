import { Response } from 'express';
import { AuthRequest } from '../types';
import { Submission, SubmissionMedia, Task, Participant, User } from '../models';

export const submissionController = {

    // POST /api/submissions
    // Загружает ОДИН файл и добавляет его к submission (создаёт если нет)
    create: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { taskId } = req.body;
            const userId = req.user!.id;
            const file = req.file;

            if (!file) {
                res.status(400).json({ message: 'Файл не загружен' });
                return;
            }

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

            const isVideo = file.mimetype.startsWith('video/');
            const mediaType = isVideo ? 'video' : 'photo';
            const { ENV } = await import('../config/env');
            const mediaUrl = `${ENV.BASE_URL}/uploads/${isVideo ? 'videos' : 'photos'}/${file.filename}`;

            // ✅ Ищем существующий submission для этой задачи и пользователя
            let submission = await Submission.findOne({
                where: { taskId: Number(taskId), userId },
            });

            // Если нет — создаём новый
            if (!submission) {
                submission = await Submission.create({
                    taskId: Number(taskId),
                    userId,
                });
            }

            // ✅ Считаем текущий порядок медиа
            const mediaCount = await SubmissionMedia.count({
                where: { submissionId: submission.id },
            });

            // ✅ Добавляем медиафайл к submission
            const media = await SubmissionMedia.create({
                submissionId: submission.id,
                mediaUrl,
                mediaType,
                order: mediaCount,
            });

            // Возвращаем submission со всеми медиа
            const full = await Submission.findByPk(submission.id, {
                include: [
                    {
                        model: SubmissionMedia,
                        as: 'media',
                        order: [['order', 'ASC']],
                    },
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'avatarUrl'],
                    },
                ],
            });

            res.status(201).json(full);
        } catch (error: any) {
            console.error('Submission create error:', error);
            res.status(500).json({ message: 'Ошибка загрузки файла' });
        }
    },

    // DELETE /api/submissions/media/:mediaId
    // Удаляет один медиафайл из submission
    deleteMedia: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { mediaId } = req.params;
            const userId = req.user!.id;

            const media = await SubmissionMedia.findByPk(mediaId);
            if (!media) {
                res.status(404).json({ message: 'Медиафайл не найден' });
                return;
            }

            // Проверяем что submission принадлежит пользователю
            const submission = await Submission.findByPk(media.submissionId);
            if (!submission || submission.userId !== userId) {
                res.status(403).json({ message: 'Нет прав' });
                return;
            }

            // Удаляем файл с диска
            const path = await import('path');
            const fs = await import('fs');
            const filename = media.mediaUrl.split('/').pop();
            const folder = media.mediaType === 'video' ? 'videos' : 'photos';
            const filePath = path.join(process.cwd(), 'uploads', folder, filename || '');
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            await media.destroy();

            // Пересчитываем order оставшихся медиа
            const remaining = await SubmissionMedia.findAll({
                where: { submissionId: submission.id },
                order: [['order', 'ASC']],
            });
            await Promise.all(
                remaining.map((m, i) => m.update({ order: i }))
            );

            // Если медиа не осталось — удаляем весь submission
            if (remaining.length === 0) {
                await submission.destroy();
                res.json({ message: 'Медиа удалено, submission удалён' });
                return;
            }

            const full = await Submission.findByPk(submission.id, {
                include: [
                    {
                        model: SubmissionMedia,
                        as: 'media',
                        order: [['order', 'ASC']],
                    },
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'avatarUrl'],
                    },
                ],
            });

            res.json(full);
        } catch (error: any) {
            console.error('deleteMedia error:', error.message);
            res.status(500).json({ message: 'Ошибка удаления медиа' });
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
                        model: SubmissionMedia,
                        as: 'media',
                        order: [['order', 'ASC']],
                    },
                    {
                        model: User,
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

            const tasks = await Task.findAll({
                where: { challengeId: Number(challengeId) },
            });
            const taskIds = tasks.map((t) => t.id);

            const submissions = await Submission.findAll({
                where: { userId, taskId: taskIds },
                include: [
                    {
                        model: SubmissionMedia,
                        as: 'media',
                        order: [['order', 'ASC']],
                    },
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