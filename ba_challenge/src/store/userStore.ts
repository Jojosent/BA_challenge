import { User } from '@/types';
import { create } from 'zustand';


interface UserState {
    profile: User | null;
    isLoading: boolean;
    error: string | null;

    setProfile: (user: User) => void;
    updateProfile: (updates: Partial<User>) => void;
    clearProfile: () => void;
}

export const useUserStore = create<UserState>((set) => ({
    profile: null,
    isLoading: false,
    error: null,

    setProfile: (user) => set({ profile: user }),

    updateProfile: (updates) =>
        set((state) => ({
            profile: state.profile ? { ...state.profile, ...updates } : null,
        })),

    clearProfile: () => set({ profile: null }),
}));