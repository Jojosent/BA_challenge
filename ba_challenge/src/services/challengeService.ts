import { Challenge, Task } from '@/types';
import api from './api';

interface CreateChallengeParams {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    visibility: 'secret' | 'protected' | 'public';
    betAmount: number;
}

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

    create: async (params: {
        title: string;
        description: string;
        startDate: string;
        endDate: string;
        visibility: string;
        betAmount: number;
        familyOwnerId?: number;   // ✅ добавили
    }): Promise<Challenge> => {
        const response = await api.post('/challenges', params);
        return response.data;
    },

    join: async (id: number): Promise<void> => {
        await api.post(`/challenges/${id}/join`);
    },

    getTasks: async (id: number): Promise<Task[]> => {
        const response = await api.get(`/challenges/${id}/tasks`);
        return response.data;
    },

    updateStatus: async (
        id: number,
        status: string
    ): Promise<Challenge> => {
        const response = await api.patch(`/challenges/${id}/status`, { status });
        return response.data;
    },
};