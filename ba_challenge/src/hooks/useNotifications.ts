import { create } from 'zustand';
import { notificationService } from '@services/notificationService';

// ── Zustand store для глобального счётчика ──────────────────────
interface NotificationState {
    count: number;
    isLoading: boolean;
    setCount: (count: number) => void;
    increment: () => void;
    decrement: () => void;
    refresh: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    count: 0,
    isLoading: false,

    setCount: (count) => set({ count: Math.max(0, count) }),

    increment: () => set((state) => ({ count: state.count + 1 })),

    decrement: () => set((state) => ({ count: Math.max(0, state.count - 1) })),

    refresh: async () => {
        try {
            set({ isLoading: true });
            const count = await notificationService.getCount();
            set({ count });
        } catch {
            // тихо игнорируем
        } finally {
            set({ isLoading: false });
        }
    },
}));

// ── Хук для использования в компонентах ─────────────────────────
export const useNotifications = () => {
    const { count, isLoading, refresh, decrement } = useNotificationStore();
    return { count, isLoading, refresh, decrement };
};