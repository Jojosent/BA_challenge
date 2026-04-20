import api from './api';

export const notificationService = {
    getCount: async (): Promise<number> => {
        try {
            const [familyInvites, challengeInvites] = await Promise.all([
                api.get('/family/invites'),
                api.get('/challenges/my-invites'),
            ]);
            return familyInvites.data.length + challengeInvites.data.length;
        } catch {
            return 0;
        }
    },
};