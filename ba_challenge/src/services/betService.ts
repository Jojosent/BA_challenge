import api from './api';

export type BetStatus = 'open' | 'active' | 'settled' | 'cancelled';

export interface BetParticipantEntry {
  userId: number;
  username: string;
  amount: number;
}

export interface Bet {
  id: number;
  challengeId: number;
  amount: number;
  totalPool: number;
  status: BetStatus;
  winnerId?: number;
  createdAt: string;
  isMyBet: boolean;
  hasJoined: boolean;
  participantCount: number;
  creator:     { id: number; username: string } | null;
  targetUser:  { id: number; username: string } | null;
  participants?: BetParticipantEntry[];
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

  // Создать ставку (ставишь на победителя)
  create: async (params: {
    challengeId: number;
    targetUserId: number;
    amount: number;
  }): Promise<Bet> => {
    const r = await api.post('/bets', params);
    return r.data;
  },

  // Принять ставку (ставишь против)
  join: async (betId: number): Promise<{ message: string }> => {
    const r = await api.post(`/bets/${betId}/join`);
    return r.data;
  },

  cancel: async (betId: number): Promise<{ message: string }> => {
    const r = await api.patch(`/bets/${betId}/cancel`);
    return r.data;
  },

  // НОВЫЙ МЕТОД: Ответить на ставку (принять или отклонить)
  respond: async (betId: number, accept: boolean): Promise<{ message: string }> => {
    // Отправляем POST запрос на бэкенд с указанием статуса (accept)
    const r = await api.post(`/bets/${betId}/respond`, { accept });
    return r.data;
  },
};