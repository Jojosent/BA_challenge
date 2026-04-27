import api from './api';

export interface NotificationCounts {
    familyInvites: number;
    challengeInvites: number;
    pendingBets: number;
    total: number;
}

export const notificationService = {
    getCount: async (): Promise<number> => {
        try {
            const [familyInvites, challengeInvites, bets] = await Promise.all([
                api.get('/family/invites'),
                api.get('/challenges/my-invites'),
                api.get('/bets/my'),
            ]);

            const pendingBetsCount = (bets.data as any[]).filter(
                (b: any) => b.status === 'pending' && b.isTarget
            ).length;

            return familyInvites.data.length + challengeInvites.data.length + pendingBetsCount;
        } catch {
            return 0;
        }
    },

    getCounts: async (): Promise<NotificationCounts> => {
        try {
            const [familyInvites, challengeInvites, bets] = await Promise.all([
                api.get('/family/invites'),
                api.get('/challenges/my-invites'),
                api.get('/bets/my'),
            ]);

            const pendingBetsCount = (bets.data as any[]).filter(
                (b: any) => b.status === 'pending' && b.isTarget
            ).length;

            const familyCount = familyInvites.data.length;
            const challengeCount = challengeInvites.data.length;

            return {
                familyInvites: familyCount,
                challengeInvites: challengeCount,
                pendingBets: pendingBetsCount,
                total: familyCount + challengeCount + pendingBetsCount,
            };
        } catch {
            return { familyInvites: 0, challengeInvites: 0, pendingBets: 0, total: 0 };
        }
    },
};