import api from './api';

export type NotificationType =
    | 'new_vote'
    | 'vote_updated'
    | 'new_participant'
    | 'challenge_started'
    | 'challenge_ended'
    | 'new_bet'
    | 'bet_joined'
    | 'family_invite'
    | 'challenge_invite';

export interface AppNotification {
    id: number;
    type: NotificationType;
    title: string;
    body: string;
    data: Record<string, any> | null;
    isRead: boolean;
    createdAt: string;
}

export const notificationService = {

    // Общий счётчик всех непрочитанных (инвайты + in-app уведомления)
    getCount: async (): Promise<number> => {
        try {
            const [familyInvites, challengeInvites, inApp] = await Promise.all([
                api.get('/family/invites'),
                api.get('/challenges/my-invites'),
                api.get('/notifications/count').catch(() => ({ data: { count: 0 } })),
            ]);
            return (
                familyInvites.data.length +
                challengeInvites.data.length +
                (inApp.data.count ?? 0)
            );
        } catch {
            return 0;
        }
    },

    // Все in-app уведомления (голоса, ставки, участники, смена статуса)
    getAll: async (limit = 50): Promise<AppNotification[]> => {
        const response = await api.get(`/notifications?limit=${limit}`);
        return response.data;
    },

    // Пометить одно прочитанным
    markRead: async (id: number): Promise<void> => {
        await api.patch(`/notifications/${id}/read`);
    },

    // Пометить все прочитанными
    markAllRead: async (): Promise<void> => {
        await api.patch('/notifications/read-all');
    },

    // Удалить одно
    deleteOne: async (id: number): Promise<void> => {
        await api.delete(`/notifications/${id}`);
    },

    // Очистить все
    clearAll: async (): Promise<void> => {
        await api.delete('/notifications/clear-all');
    },
};