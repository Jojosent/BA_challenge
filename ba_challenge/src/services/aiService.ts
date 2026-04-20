import api from './api';

interface GeneratedTask {
    day: number;
    title: string;
    description: string;
}

interface AITaskPlan {
    tasks: GeneratedTask[];
    summary: string;
}

interface AIEvaluation {
    score: number;
    comment: string;
    isCompleted: boolean;
}

export const aiService = {

    generateTasks: async (
        challengeId: number,
        taskCount: number,       // ✅ добавили
        language: string = 'ru'
    ): Promise<{ tasks: any[]; summary: string }> => {
        const response = await api.post('/ai/generate-tasks', {
            challengeId,
            taskCount,             // ✅ отправляем
            language,
        });
        return response.data;
    },

    evaluateSubmission: async (
        submissionId: number,
        language: string = 'ru'
    ): Promise<AIEvaluation> => {
        const response = await api.post(`/ai/evaluate/${submissionId}`, {
            language,
        });
        return response.data;
    },

    chat: async (
        message: string,
        challengeId?: number,
        language: string = 'ru'
    ): Promise<string> => {
        const response = await api.post('/ai/chat', {
            message,
            challengeId,
            language,
        });
        return response.data.reply;
    },
};