import api from './api';

export interface CreateBetData {
  title: string;
  description: string;
  endDate: string;
  betAmount: number;
}

export const betService = {
  createBet: async (data: CreateBetData) => {
    const response = await api.post('/bets', data);
    return response.data;
  },

  joinBet: async (id: number) => {
    const response = await api.post(`/bets/${id}/join`);
    return response.data;
  },

  getBets: async () => {
    const response = await api.get('/bets');
    return response.data;
  },

  getBetDetails: async (id: number) => {
    const response = await api.get(`/bets/${id}`);
    return response.data;
  },
};
