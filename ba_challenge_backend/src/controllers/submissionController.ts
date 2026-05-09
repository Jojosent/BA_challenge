import { Response } from 'express';
import { AuthRequest } from '../types';

import {
    Submission,
    SubmissionMedia,
    Task,
    Participant,
    Challenge,
    User,
} from '../models';

import { ENV } from '../config/env';
import { encryptFile } from '../utils/fileEncryption';

export const submissionController = {

    // POST /api/submissions
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

            // Проверяем участие
            const participant = await Participant.findOne({
                where: {
                    challengeId: task.challengeId,
                    userId,
                },
            });

            if (!participant) {
                res.status(403).json({
                    message: 'Ты не участник этого челленджа',
                });
                return;
            }

            const isVideo = file.mimetype.startsWith('video/');
            const mediaType = isVideo ? 'video' : 'photo';

            // --- ШИФРОВАНИЕ ---
            const encryptedPath = encryptFile(file.path);

            console.log(`🔐 Файл зашифрован: ${encryptedPath}`);

            const storedPath = `enc:${encryptedPath}`;

            // Ищем submission
            let submission = await Submission.findOne({
                where: {
                    taskId: Number(taskId),
                    userId,
                },
            });

            // Если нет — создаём
            if (!submission) {
                submission = await Submission.create({
                    taskId: Number(taskId),
                    userId,
                });
            }

            // Порядок медиа
            const mediaCount = await SubmissionMedia.count({
                where: {
                    submissionId: submission.id,
                },
            });

            // Создаём media
            await SubmissionMedia.create({
                submissionId: submission.id,
                mediaUrl: storedPath,
                mediaType,
                order: mediaCount,
            });

            // === ЛОГИКА СТРИКА ===

            const user = await User.findByPk(userId);

            if (user) {

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const lastActive = user.lastActiveDate
                    ? new Date(user.lastActiveDate)
                    : null;

                if (lastActive) {
                    lastActive.setHours(0, 0, 0, 0);
                }

                if (!lastActive) {

                    user.streakCount = 1;

                } else {

                    const diffDays = Math.round(
                        (today.getTime() - lastActive.getTime()) /
                        (1000 * 60 * 60 * 24)
                    );

                    if (diffDays === 1) {

                        user.streakCount += 1;

                    } else if (diffDays > 1) {

                        user.streakCount = 1;
                    }
                }

                user.lastActiveDate = new Date();

                await user.save();
            }

            // === END STREAK ===

            const full = await Submission.findByPk(submission.id, {
                include: [
                    {
                        model: SubmissionMedia,
                        as: 'media',
                    },
                    {
                        model: User,
                        as: 'user',
                        attributes: [
                            'id',
                            'username',
                            'avatarUrl',
                        ],
                    },
                ],
            });

            res.status(201).json(full);

        } catch (error: any) {

            console.error('Submission create error:', error);

            res.status(500).json({
                message: 'Ошибка загрузки файла',
            });
        }
    },

    // DELETE /api/submissions/media/:mediaId
    deleteMedia: async (req: AuthRequest, res: Response): Promise<void> => {

        try {

            const { mediaId } = req.params;

            const userId = req.user!.id;

            const media = await SubmissionMedia.findByPk(mediaId);

            if (!media) {
                res.status(404).json({
                    message: 'Медиафайл не найден',
                });
                return;
            }

            const submission = await Submission.findByPk(
                media.submissionId
            );

            if (!submission || submission.userId !== userId) {

                res.status(403).json({
                    message: 'Нет прав',
                });

                return;
            }

            const fs = await import('fs');

            // Удаляем encrypted файл
            if (media.mediaUrl.startsWith('enc:')) {

                const encPath = media.mediaUrl.replace('enc:', '');

                if (fs.existsSync(encPath)) {
                    fs.unlinkSync(encPath);
                }
            }

            await media.destroy();

            // Пересчитываем order
            const remaining = await SubmissionMedia.findAll({
                where: {
                    submissionId: submission.id,
                },
                order: [['order', 'ASC']],
            });

            await Promise.all(
                remaining.map((m, i) =>
                    m.update({ order: i })
                )
            );

            // Если медиа не осталось
            if (remaining.length === 0) {

                await submission.destroy();

                res.json({
                    message: 'Медиа удалено, submission удалён',
                });

                return;
            }

            const full = await Submission.findByPk(
                submission.id,
                {
                    include: [
                        {
                            model: SubmissionMedia,
                            as: 'media',
                        },
                        {
                            model: User,
                            as: 'user',
                            attributes: [
                                'id',
                                'username',
                                'avatarUrl',
                            ],
                        },
                    ],
                }
            );

            res.json(full);

        } catch (error: any) {

            console.error('deleteMedia error:', error.message);

            res.status(500).json({
                message: 'Ошибка удаления медиа',
            });
        }
    },

    // GET /api/submissions/task/:taskId
    getByTask: async (req: AuthRequest, res: Response): Promise<void> => {

        try {

            const { taskId } = req.params;

            const userId = req.user!.id;

            const task = await Task.findByPk(taskId);

            if (!task) {

                res.status(404).json({
                    message: 'Задача не найдена',
                });

                return;
            }

            const participant = await Participant.findOne({
                where: {
                    challengeId: task.challengeId,
                    userId,
                },
            });

            const challenge = await Challenge.findByPk(
                task.challengeId
            );

            const isCreator =
                challenge?.creatorId === userId;

            if (!participant && !isCreator) {

                res.status(403).json({
                    message: 'Нет доступа',
                });

                return;
            }

            const submissions = await Submission.findAll({
                where: {
                    taskId: Number(taskId),
                },
                include: [
                    {
                        model: SubmissionMedia,
                        as: 'media',
                        order: [['order', 'ASC']],
                    },
                    {
                        model: User,
                        as: 'user',
                        attributes: [
                            'id',
                            'username',
                            'avatarUrl',
                        ],
                    },
                ],
                order: [['createdAt', 'DESC']],
            });

            res.json(submissions);

        } catch (error) {

            res.status(500).json({
                message: 'Ошибка',
            });
        }
    },

    // GET /api/submissions/my/:challengeId
    getMySubmissions: async (
        req: AuthRequest,
        res: Response
    ): Promise<void> => {

        try {

            const { challengeId } = req.params;

            const userId = req.user!.id;

            const tasks = await Task.findAll({
                where: {
                    challengeId: Number(challengeId),
                },
            });

            const taskIds = tasks.map((t) => t.id);

            const submissions = await Submission.findAll({
                where: {
                    userId,
                    taskId: taskIds,
                },
                include: [
                    {
                        model: SubmissionMedia,
                        as: 'media',
                        order: [['order', 'ASC']],
                    },
                    {
                        model: Task,
                        as: 'task',
                        attributes: [
                            'id',
                            'title',
                            'day',
                        ],
                    },
                ],
                order: [['createdAt', 'DESC']],
            });

            res.json(submissions);

        } catch (error) {

            res.status(500).json({
                message: 'Ошибка',
            });
        }
    },

    // GET /api/submissions/media/:mediaId
    serveMedia: async (
        req: AuthRequest,
        res: Response
    ): Promise<void> => {

        try {

            const { mediaId } = req.params;

            const userId = req.user!.id;

            const media = await SubmissionMedia.findByPk(
                mediaId
            );

            if (!media) {

                res.status(404).json({
                    message: 'Медиа не найдено',
                });

                return;
            }

            const submission = await Submission.findByPk(
                media.submissionId
            );

            if (!submission) {

                res.status(404).json({
                    message: 'Submission не найден',
                });

                return;
            }

            const task = await Task.findByPk(
                submission.taskId
            );

            if (!task) {

                res.status(404).json({
                    message: 'Задача не найдена',
                });

                return;
            }

            const participant = await Participant.findOne({
                where: {
                    challengeId: task.challengeId,
                    userId,
                },
            });

            const challenge = await Challenge.findByPk(
                task.challengeId
            );

            const isCreator =
                challenge?.creatorId === userId;

            const isOwner =
                submission.userId === userId;

            if (
                !participant &&
                !isCreator &&
                !isOwner
            ) {

                res.status(403).json({
                    message: 'Нет доступа к файлу',
                });

                return;
            }

            if (media.mediaUrl.startsWith('enc:')) {

                const encPath = media.mediaUrl.replace(
                    'enc:',
                    ''
                );

                const fs = await import('fs');

                if (!fs.existsSync(encPath)) {

                    res.status(404).json({
                        message: 'Файл не найден',
                    });

                    return;
                }

                const {
                    decryptFile,
                    getMimeType,
                } = await import(
                    '../utils/fileEncryption'
                );

                const decryptedBuffer =
                    decryptFile(encPath);

                const mimeType =
                    getMimeType(encPath);

                res.set('Content-Type', mimeType);

                res.set(
                    'Content-Length',
                    String(decryptedBuffer.length)
                );

                res.set(
                    'Cache-Control',
                    'private, max-age=3600'
                );

                res.send(decryptedBuffer);

                return;
            }

            res.redirect(media.mediaUrl);

        } catch (error: any) {

            console.error(
                'serveMedia error:',
                error.message
            );

            res.status(500).json({
                message: 'Ошибка получения файла',
            });
        }
    },
};
