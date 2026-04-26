import api from './api';

export type BetStatus = 'pending' | 'active' | 'declined' | 'cancelled' | 'won' | 'lost';

export interface Bet {
  id: number;
  challengeId: number;
  amount: number;
  description: string;
  status: BetStatus;
  winnerId?: number;
  createdAt: string;
  isMine: boolean;
  isTarget: boolean;
  isMyBet: boolean;
  fromUser:   { id: number; username: string } | null;
  toUser:     { id: number; username: string } | null;
  targetUser: { id: number; username: string } | null;
}

export const betService = {

  getByChallengeId: async (challengeId: number): Promise<Bet[]> => {
    const r = await api.get(`/bets/challenge/${challengeId}`);
    return r.data;
  },

  getMy: async (): Promise<Bet[]> => {
    const r = await api.get('/bets/my');
    return r.data;
  },

  create: async (params: {
    challengeId: number;
    toUserId: number;
    targetUserId: number;
    amount: number;
    description: string;
  }): Promise<Bet> => {
    const r = await api.post('/bets', params);
    return r.data;
  },

  respond: async (betId: number, accept: boolean): Promise<{ message: string }> => {
    const r = await api.patch(`/bets/${betId}/respond`, { accept });
    return r.data;
  },

  cancel: async (betId: number): Promise<{ message: string }> => {
    const r = await api.patch(`/bets/${betId}/cancel`);
    return r.data;
  },

  resolve: async (betId: number, winnerId: number): Promise<{ message: string; prize: number }> => {
    const r = await api.patch(`/bets/${betId}/resolve`, { winnerId });
    return r.data;
  },
};