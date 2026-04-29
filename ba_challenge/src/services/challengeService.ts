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
    const response = await api.get('/challenges');
    const allChallenges = response.data;

    // ✅ Получаем id текущего пользователя из SecureStore
    const userStr = await import('expo-secure-store').then(m =>
        m.getItemAsync('ba_challenge_user')
    );
    if (!userStr) return [];
    const currentUser = JSON.parse(userStr);
    const userId = currentUser.id;

    // ✅ Только те челленджи где пользователь является участником
    const myChallenges = allChallenges.filter((c: any) =>
        c.participants?.some((p: any) => p.userId === userId)
    );

    const result: {
        taskId: number;
        taskTitle: string;
        taskDay: number;
        deadline: string;
        challengeId: number;
        challengeTitle: string;
        isExpired: boolean;
        daysLeft: number;
    }[] = [];

    const now = new Date();

    for (const challenge of myChallenges) {
        if (challenge.status === 'completed' || challenge.status === 'cancelled') continue;

        try {
            const tasksResponse = await api.get(`/challenges/${challenge.id}/tasks`);
            const tasks = tasksResponse.data;

            for (const task of tasks) {
                if (!task.deadline) continue;
                const deadline = new Date(task.deadline);
                const daysLeft = Math.ceil(
                    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );
                result.push({
                    taskId: task.id,
                    taskTitle: task.title,
                    taskDay: task.day,
                    deadline: task.deadline,
                    challengeId: challenge.id,
                    challengeTitle: challenge.title,
                    isExpired: deadline < now,
                    daysLeft,
                });
            }
        } catch (e) {
            console.log('getMyTaskDeadlines task fetch error:', e);
        }
    }

    return result.sort((a, b) =>
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );
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