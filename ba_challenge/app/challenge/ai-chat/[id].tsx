import { AIChat } from '@components/shared/AIChat';
import { Header } from '@components/shared/Header';
import { Colors } from '@constants/colors';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AIChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title="🤖 AI Помощник" showBack />
            <AIChat challengeId={id ? Number(id) : undefined} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
});