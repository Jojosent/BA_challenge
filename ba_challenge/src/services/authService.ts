import { AuthUser } from '@/types';
import api from './api';

interface LoginParams {
  email: string;
  password: string;
}

interface RegisterParams {
  username: string;
  email: string;
  password: string;
}

export const authService = {
  login: async (params: LoginParams): Promise<AuthUser> => {
    const response = await api.post('/auth/login', params);
    return response.data;
  },

  register: async (params: RegisterParams): Promise<AuthUser> => {
    const response = await api.post('/auth/register', params);
    return response.data;
  },

  getMe: async (): Promise<AuthUser> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};