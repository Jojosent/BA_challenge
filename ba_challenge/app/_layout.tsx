import { Colors } from '@constants/colors';
import { useAuthStore } from '@store/authStore';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useNotificationStore } from '@hooks/useNotifications';

const POLL_INTERVAL = 30000; // 30 секунд

// Компонент который управляет глобальным polling уведомлений
function NotificationPoller() {
    const { isAuthenticated } = useAuthStore();
    const { refresh } = useNotificationStore();
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            // Очищаем polling если вышли
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            useNotificationStore.getState().setCount(0);
            return;
        }

        // Первый запрос сразу после авторизации
        refresh();

        // Запускаем polling
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

    return null; // Этот компонент ничего не рендерит
}

export default function RootLayout() {
    const { loadStoredAuth, isLoading, isAuthenticated } = useAuthStore();

    useEffect(() => {
        loadStoredAuth();
    }, []);

    if (isLoading) {
        return (
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: Colors.background,
            }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <>
            <StatusBar style="light" backgroundColor={Colors.background} />
            {/* Глобальный polling — работает на всех экранах */}
            <NotificationPoller />
            <Stack screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
            }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
            </Stack>
        </>
    );
}