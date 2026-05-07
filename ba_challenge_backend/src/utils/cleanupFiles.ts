import { Submission, SubmissionMedia, Task, Challenge } from '../models';
import { deleteEncryptedFile } from './fileEncryption';

/**
 * Удаляет все зашифрованные файлы сабмишенов конкретного челленджа.
 * Вызывается при завершении (status = 'completed') или отмене ('cancelled').
 */
export const deleteChallengFiles = async (challengeId: number): Promise<void> => {
    try {
        console.log(`🗑️ Начинаем удаление файлов челленджа #${challengeId}...`);

        // Получаем все задачи этого челленджа
        const tasks = await Task.findAll({
            where: { challengeId },
            attributes: ['id'],
        });

        if (tasks.length === 0) {
            console.log(`ℹ️ Челлендж #${challengeId} — задач нет, файлов для удаления нет`);
            return;
        }

        const taskIds = tasks.map((t) => t.id);

        // Получаем все сабмишены этих задач
        const submissions = await Submission.findAll({
            where: { taskId: taskIds },
            attributes: ['id'],
        });

        if (submissions.length === 0) {
            console.log(`ℹ️ Челлендж #${challengeId} — сабмишенов нет`);
            return;
        }

        const submissionIds = submissions.map((s) => s.id);

        // ✅ Получаем все медиафайлы этих сабмишенов
        const mediaItems = await SubmissionMedia.findAll({
            where: { submissionId: submissionIds },
            attributes: ['id', 'submissionId', 'mediaUrl'],
        });

        if (mediaItems.length === 0) {
            console.log(`ℹ️ Челлендж #${challengeId} — медиафайлов нет`);
            return;
        }

        let deletedCount = 0;
        let skippedCount = 0;

        for (const mediaItem of mediaItems) {
            if (mediaItem.mediaUrl.startsWith('enc:')) {
                // Зашифрованный файл — удаляем с диска
                const encPath = mediaItem.mediaUrl.replace('enc:', '');
                deleteEncryptedFile(encPath);
                deletedCount++;
            } else {
                // Старый формат без шифрования — просто логируем
                console.log(`⚠️ Media #${mediaItem.id} (submission #${mediaItem.submissionId}) — старый формат, пропускаем`);
                skippedCount++;
            }
        }

        console.log(
            `✅ Удаление файлов челленджа #${challengeId} завершено: ` +
            `удалено ${deletedCount}, пропущено ${skippedCount}`
        );

    } catch (error: any) {
        console.error(
            `❌ Ошибка удаления файлов челленджа #${challengeId}:`,
            error.message
        );
    }
};

/**
 * Проверяет все завершённые челленджи и удаляет файлы старше N дней.
 * Можно запускать по расписанию (cron) как дополнительную очистку.
 *
 * @param daysAfterCompletion — сколько дней после завершения хранить файлы (по умолчанию 0 = сразу)
 */
export const cleanupCompletedChallenges = async (
    daysAfterCompletion: number = 0
): Promise<void> => {
    try {
        console.log('🧹 Запуск плановой очистки файлов завершённых челленджей...');

        const completedChallenges = await Challenge.findAll({
            where: { status: 'completed' },
            attributes: ['id', 'updatedAt'],
        });

        const now = Date.now();
        const threshold = daysAfterCompletion * 24 * 60 * 60 * 1000;

        for (const challenge of completedChallenges) {
            const completedAt = new Date(challenge.updatedAt).getTime();
            const elapsed = now - completedAt;

            if (elapsed >= threshold) {
                await deleteChallengFiles(challenge.id);
            }
        }

        console.log('✅ Плановая очистка завершена');
    } catch (error: any) {
        console.error('❌ Ошибка плановой очистки:', error.message);
    }
};