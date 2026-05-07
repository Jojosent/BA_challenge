import api from './api';

export const adminService = {
  searchChallenges: async (query?: string, status?: string, visibility?: string) => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (status) params.append('status', status);
    if (visibility) params.append('visibility', visibility);

    const response = await api.get(`/admin/challenges/search?${params.toString()}`);
    return response.data;
  },

  getChallengeDetail: async (id: number) => {
    const response = await api.get(`/admin/challenges/${id}`);
    return response.data;
  },

  completeChallenge: async (id: number) => {
    const response = await api.patch(`/admin/challenges/${id}/complete`);
    return response.data;
  },

  resolveDispute: async (id: number, winnerUserId: number) => {
    const response = await api.post(`/admin/challenges/${id}/resolve-dispute`, { winnerUserId });
    return response.data;
  },

  deleteChallenge: async (id: number) => {
    const response = await api.delete(`/admin/challenges/${id}`);
    return response.data;
  },
};
