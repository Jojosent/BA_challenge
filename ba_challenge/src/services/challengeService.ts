import { Challenge, Task, PrizeInfo } from '@/types';
import api from './api';

export const challengeService = {

    getFamilyChallenges: async (familyOwnerId?: number): Promise<Challenge[]> => {
        const url = familyOwnerId
            ? `/challenges/family?familyOwnerId=${familyOwnerId}`
            : '/challenges/family';
        const response = await api.get(url);
        return response.data;
    },

    getAll: async (): Promise<Challenge[]> => {
        const response = await api.get('/challenges');
        return response.data;
    },

    getById: async (id: number): Promise<Challenge> => {
        const response = await api.get(`/challenges/${id}`);
        return response.data;
    },

    // ----------------------------
    getMyTaskDeadlines: async (): Promise<{
        taskId: number;
        taskTitle: string;
        taskDay: number;
        deadline: string;
        challengeId: number;
        challengeTitle: string;
        isExpired: boolean;
        daysLeft: number;
    }[]> => {
        try {
            const challengesRes = await api.get('/challenges');
            const challenges = challengesRes.data;
            const now = new Date();
            const result: any[] = [];

            for (const challenge of challenges) {
                if (challenge.status === 'completed' || challenge.status === 'cancelled') continue;
                try {
                    const tasksRes = await api.get(`/challenges/${challenge.id}/tasks`);
                    for (const task of tasksRes.data) {
                        if (!task.deadline) continue;
                        const deadlineDate = new Date(task.deadline);
                        const daysLeft = Math.ceil(
                            (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                        );
                        result.push({
                            taskId: task.id,
                            taskTitle: task.title,
                            taskDay: task.day,
                            deadline: task.deadline,
                            challengeId: challenge.id,
                            challengeTitle: challenge.title,
                            isExpired: daysLeft < 0,
                            daysLeft: Math.max(daysLeft, 0),
                        });
                    }
                } catch (e) { /* нет доступа */ }
            }

            return result.sort((a, b) => a.daysLeft - b.daysLeft);
        } catch (e) {
            return [];
        }
    },
    // ----------------------------

    create: async (params: {
        title: string;
        description: string;
        startDate: string;
        endDate: string;
        visibility: string;
        betAmount: number;
        familyOwnerId?: number;
    }): Promise<Challenge> => {
        const response = await api.post('/challenges', params);
        return response.data;
    },

    // ✅ Передаём пароль если он есть (для protected челленджей)
    join: async (id: number, password?: string): Promise<{
        message: string;
        prizePool: number;
        prizeInfo: PrizeInfo;
    }> => {
        const response = await api.post(`/challenges/${id}/join`, {
            ...(password ? { password } : {}),
        });
        return response.data;
    },

    getTasks: async (id: number): Promise<Task[]> => {
        const response = await api.get(`/challenges/${id}/tasks`);
        return response.data;
    },

    updateStatus: async (id: number, status: string): Promise<Challenge> => {
        const response = await api.patch(`/challenges/${id}/status`, { status });
        return response.data;
    },

    getPrizePool: async (id: number): Promise<{
        challengeId: number;
        betAmount: number;
        participantCount: number;
        totalPool: number;
        status: string;
        prizes: PrizeInfo['prizes'];
    }> => {
        const response = await api.get(`/challenges/${id}/prize-pool`);
        return response.data;
    },
};