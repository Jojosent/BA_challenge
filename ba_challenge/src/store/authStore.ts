import { AuthUser } from '@/types';
import { Config } from '@constants/config';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Действия
  setUser: (user: AuthUser) => void;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: async (user: AuthUser) => {
    // Сохраняем токен безопасно на устройстве
    await SecureStore.setItemAsync(Config.TOKEN_KEY, user.token);
    await SecureStore.setItemAsync(Config.USER_KEY, JSON.stringify(user));
    set({ user, token: user.token, isAuthenticated: true });
  },

  logout: async () => {
    // Удаляем всё с устройства
    await SecureStore.deleteItemAsync(Config.TOKEN_KEY);
    await SecureStore.deleteItemAsync(Config.USER_KEY);
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadStoredAuth: async () => {
    try {
      // При запуске приложения проверяем — есть ли сохранённый токен
      const token = await SecureStore.getItemAsync(Config.TOKEN_KEY);
      const userStr = await SecureStore.getItemAsync(Config.USER_KEY);

      if (token && userStr) {
        const user = JSON.parse(userStr) as AuthUser;
        set({ user, token, isAuthenticated: true });
      }
    } catch (e) {
      // Если ошибка — просто не авторизован
    } finally {
      set({ isLoading: false });
    }
  },
}));