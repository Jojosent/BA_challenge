import { User } from '@/types';
import api from './api';

interface UpdateProfileParams {
    username?: string;
    avatarUrl?: string;
}

export const userService = {
    getProfile: async (): Promise<User> => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    updateProfile: async (params: UpdateProfileParams): Promise<User> => {
        const response = await api.put('/users/profile', params);
        return response.data;
    },

    getUserById: async (id: number): Promise<User> => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

getStats: async (): Promise<{
  avgRating: number;
  totalVoters: number;
  totalVoteCount: number;  // ✅ добавили
  challengeCount: number;
  wonCount: number;
  submissionCount: number;
}> => {
  const response = await api.get('/users/stats');
  return response.data;
},
};