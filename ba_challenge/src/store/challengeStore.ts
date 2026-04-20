import { Challenge, Task } from '@/types/index';
import { create } from 'zustand';

interface ChallengeState {
    challenges: Challenge[];
    currentChallenge: Challenge | null;
    currentTasks: Task[];
    isLoading: boolean;
    error: string | null;

    setChallenges: (challenges: Challenge[]) => void;
    setCurrentChallenge: (challenge: Challenge | null) => void;
    setCurrentTasks: (tasks: Task[]) => void; // Метод в интерфейсе
    addChallenge: (challenge: Challenge) => void;
    setLoading: (val: boolean) => void;
    setError: (err: string | null) => void;
}

export const useChallengeStore = create<ChallengeState>((set) => ({
    challenges: [],
    currentChallenge: null,
    currentTasks: [],
    isLoading: false,
    error: null,

    setChallenges: (challenges) => set({ challenges, error: null }),
    setCurrentChallenge: (challenge) => set({ currentChallenge: challenge, error: null }),
    
    // ✅ Метод для установки задач текущего челленджа
    setCurrentTasks: (tasks: Task[]) => set({ currentTasks: tasks }),

    addChallenge: (challenge) =>
        set((state) => ({ challenges: [challenge, ...state.challenges], error: null })),
    
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));