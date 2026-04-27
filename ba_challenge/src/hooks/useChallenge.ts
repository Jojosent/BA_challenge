import { challengeService } from '@services/challengeService';
import { useChallengeStore } from '@store/challengeStore';
import { useCallback, useState } from 'react';

export const useChallenge = () => {
    const {
        challenges,
        currentChallenge,
        currentTasks,
        setChallenges,
        setCurrentChallenge,
        setCurrentTasks,
        addChallenge,
    } = useChallengeStore();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchChallenges = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await challengeService.getAll();
            setChallenges(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchChallenge = useCallback(async (id: number) => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await challengeService.getById(id);
            setCurrentChallenge(data);
            return data;
        } catch (e: any) {
            setError(e.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createChallenge = async (params: {
        title: string;
        description: string;
        startDate: string;
        endDate: string;
        visibility: 'secret' | 'protected' | 'public';
        betAmount: number;
    }) => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await challengeService.create(params);
            addChallenge(data);
            return data;
        } catch (e: any) {
            setError(e.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ joinChallenge принимает опциональный пароль для protected челленджей
    const joinChallenge = async (id: number, password?: string) => {
        try {
            setIsLoading(true);
            const result = await challengeService.join(id, password);
            // Обновляем текущий челлендж чтобы prizePool обновился
            await fetchChallenge(id);
            return result; // { message, prizePool, prizeInfo }
        } catch (e: any) {
            setError(e.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTasks = async (id: number) => {
        try {
            const data = await challengeService.getTasks(id);
            setCurrentTasks(data);
        } catch (e: any) {
            setError(e.message);
        }
    };

    return {
        challenges,
        currentChallenge,
        currentTasks,
        isLoading,
        error,
        fetchChallenges,
        fetchChallenge,
        createChallenge,
        joinChallenge,
        fetchTasks,
        setCurrentTasks,
    };
};