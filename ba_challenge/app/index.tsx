import { useAuthStore } from '@store/authStore';
import { Redirect } from 'expo-router';

export default function Index() {
  const { isAuthenticated } = useAuthStore();

  // Если залогинен — на главную, если нет — на логин
  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/login'} />;
}