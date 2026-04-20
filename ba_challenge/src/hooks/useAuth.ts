import { authService } from '@services/authService';
import { useAuthStore } from '@store/authStore';
import { useChallengeStore } from '@store/challengeStore';
import { useUserStore } from '@store/userStore';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export const useAuth = () => {
  const router = useRouter();
  const { setUser, logout: storeLogout } = useAuthStore();

  // ✅ Получаем функции очистки из других сторов
  const { clearProfile } = useUserStore();
  const { setChallenges, setCurrentChallenge } = useChallengeStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // ✅ Очищаем старые данные перед новым логином
      clearProfile();
      setChallenges([]);
      setCurrentChallenge(null);

      const user = await authService.login({ email, password });
      await setUser(user);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // ✅ Очищаем старые данные
      clearProfile();
      setChallenges([]);
      setCurrentChallenge(null);

      const user = await authService.register({ username, email, password });
      await setUser(user);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // ✅ Очищаем ВСЕ сторы при выходе
    clearProfile();
    setChallenges([]);
    setCurrentChallenge(null);
    await storeLogout();
    router.replace('/(auth)/login');
  };

  return { login, register, logout, isLoading, error };
};