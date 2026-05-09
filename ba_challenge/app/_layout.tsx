import { useAuthStore } from '@store/authStore';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useNotificationStore } from '@hooks/useNotifications';
import { ThemeProvider } from './(tabs)/theme/ThemeContext';

const POLL_INTERVAL = 30000;

// 🔔 Notification Poller
function NotificationPoller() {
  const { isAuthenticated } = useAuthStore();
  const { refresh } = useNotificationStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      useNotificationStore.getState().setCount(0);
      return;
    }

    refresh();

    intervalRef.current = setInterval(() => {
      refresh();
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated]);

  return null;
}

export default function RootLayout() {
  const { loadStoredAuth, isLoading } = useAuthStore();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0B0F19',
        }}
      >
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <StatusBar style="light" />

      <NotificationPoller />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}