import { Ionicons } from '@expo/vector-icons';
import { aiService } from '@services/aiService';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface Message {
    id: string;
    role: 'user' | 'ai';
    text: string;
}

interface AIChatProps {
    challengeId?: number;
}

export const AIChat: React.FC<AIChatProps> = ({ challengeId }) => {
    const { theme } = useTheme();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '0',
            role: 'ai',
            text: '👋 Привет! Я AI помощник B&A Challenge. Могу помочь с советами, мотивацией или вопросами о челлендже!',
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: input.trim(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const reply = await aiService.chat(userMsg.text, challengeId);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                text: reply,
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (e: any) {
            const errMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                text: e.message?.includes('перегружен')
                    ? '⏳ AI перегружен, подожди минуту и попробуй снова.'
                    : '❌ AI сейчас недоступен. Попробуй позже.',
            };
            setMessages((prev) => [...prev, errMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.bg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Сообщения */}
            <ScrollView
                style={styles.messages}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
            >
                {messages.map((msg) => (
                    <View
                        key={msg.id}
                        style={[
                            styles.bubble,
                            msg.role === 'user'
                                ? [styles.userBubble, { backgroundColor: theme.primary }]
                                : [styles.aiBubble, { backgroundColor: theme.surface, borderColor: theme.border }],
                        ]}
                    >
                        {msg.role === 'ai' && (
                            <Text style={[styles.aiLabel, { color: theme.textMuted }]}>🤖 AI</Text>
                        )}
                        <Text
                            style={[
                                styles.bubbleText,
                                msg.role === 'user' ? styles.userText : [styles.aiText, { color: theme.textPrimary }],
                            ]}
                        >
                            {msg.text}
                        </Text>
                    </View>
                ))}

                {isLoading && (
                    <View style={[styles.bubble, styles.aiBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.aiLabel, { color: theme.textMuted }]}>🤖 AI</Text>
                        <View style={styles.typingRow}>
                            <ActivityIndicator size="small" color={theme.primary} />
                            <Text style={[styles.typingText, { color: theme.textSecondary }]}>думает...</Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Поле ввода */}
            <View style={[styles.inputRow, { borderTopColor: theme.border, backgroundColor: theme.bg }]}>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Спроси AI..."
                    placeholderTextColor={theme.textMuted}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, { backgroundColor: theme.primary }, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
                    onPress={sendMessage}
                    disabled={!input.trim() || isLoading}
                >
                    <Ionicons name="send" size={18} color="#ffffff" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    messages: { flex: 1 },
    messagesContent: { padding: 16, gap: 10 },

    bubble: {
        maxWidth: '85%',
        padding: 12,
        borderRadius: 16,
    },
    userBubble: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
    },
    aiLabel: { fontSize: 10, marginBottom: 4 },
    bubbleText: { fontSize: 14, lineHeight: 20 },
    userText: { color: '#ffffff' },
    aiText: {},

    typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    typingText: { fontSize: 13 },

    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        gap: 8,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        maxHeight: 100,
        borderWidth: 1,
    },
    sendBtn: {
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: { opacity: 0.4 },
});