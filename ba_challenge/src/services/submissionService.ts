import { Submission } from '@/types/index';
import api from './api';

export const submissionService = {

    // ✅ Загружает ОДИН файл — добавляет к submission или создаёт новый
    upload: async (taskId: number, fileUri: string, fileType: string): Promise<Submission> => {
        const formData = new FormData();
        formData.append('taskId', String(taskId));
        formData.append('media', {
            uri: fileUri,
            type: fileType,
            name: `submission.${fileType.split('/')[1]}`,
        } as any);

        const response = await api.post('/submissions', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // ✅ Удалить один медиафайл
    deleteMedia: async (mediaId: number): Promise<Submission | null> => {
        const response = await api.delete(`/submissions/media/${mediaId}`);
        return response.data;
    },

    getByTask: async (taskId: number): Promise<Submission[]> => {
        const response = await api.get(`/submissions/task/${taskId}`);
        return response.data;
    },

    getMySubmissions: async (challengeId: number): Promise<Submission[]> => {
        const response = await api.get(`/submissions/my/${challengeId}`);
        return response.data;
    },
};