import api from './api';

export interface ProfilePrivacySettings {
    showChallengesPublic: boolean;
    allowFamilyInvites: boolean;
    allowChallengeInvites: boolean;
}

export const privacyService = {

    getProfilePrivacy: async (): Promise<ProfilePrivacySettings> => {
        const response = await api.get('/privacy/profile');
        return response.data;
    },

    updateProfilePrivacy: async (
        settings: Partial<ProfilePrivacySettings>
    ): Promise<ProfilePrivacySettings> => {
        const response = await api.patch('/privacy/profile', settings);
        return response.data;
    },

    updateChallengeVisibility: async (
        challengeId: number,
        visibility: 'secret' | 'protected' | 'public',
        password?: string
    ): Promise<{ message: string; visibility: string; hasPassword: boolean }> => {
        const response = await api.patch(`/challenges/${challengeId}/visibility`, {
            visibility,
            password,
        });
        return response.data;
    },

    verifyAccess: async (
        challengeId: number,
        password?: string
    ): Promise<{ granted: boolean; needsPassword?: boolean }> => {
        try {
            const response = await api.post(`/challenges/${challengeId}/verify-access`, { password });
            return response.data;
        } catch {
            return { granted: false, needsPassword: true };
        }
    },
};