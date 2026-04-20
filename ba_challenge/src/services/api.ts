import { Config } from '@constants/config';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

console.log('🔧 API базовый URL:', Config.API_URL);

const api = axios.create({
  baseURL: Config.API_URL,
  timeout: Config.REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  console.log(`🌐 ЗАПРОС: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  console.log(`📦 ДАННЫЕ:`, config.data);

  const token = await SecureStore.getItemAsync(Config.TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`✅ ОТВЕТ ${response.status}:`, response.data);
    return response;
  },
  (error) => {
    console.log(`❌ ОШИБКА:`, error.message);
    console.log(`❌ КОД:`, error.response?.status);
    console.log(`❌ ДЕТАЛИ:`, JSON.stringify(error.response?.data));
    console.log(`❌ URL был:`, error.config?.baseURL + error.config?.url);

    const message = error.response?.data?.message || 'Что-то пошло не так';
    return Promise.reject(new Error(message));
  }
);

export default api;