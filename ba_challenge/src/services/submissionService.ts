import { Submission } from '@/types/index';
import api from './api';

export const submissionService = {

    // Загрузка фото/видео
    upload: async (taskId: number, fileUri: string, fileType: string): Promise<Submission> => {
        // FormData нужен для отправки файла
        const formData = new FormData();

        formData.append('taskId', String(taskId));
        formData.append('media', {
            uri: fileUri,
            type: fileType,
            name: `submission.${fileType.split('/')[1]}`,
        } as any);

        const response = await api.post('/submissions', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

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