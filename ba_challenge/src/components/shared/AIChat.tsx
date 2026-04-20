import { Colors } from '@constants/colors';
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

interface Message {
    id: string;
    role: 'user' | 'ai';
    text: string;
}

interface AIChatProps {
    challengeId?: number;
}

export const AIChat: React.FC<AIChatProps> = ({ challengeId }) => {
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
            style={styles.container}
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
                            msg.role === 'user' ? styles.userBubble : styles.aiBubble,
                        ]}
                    >
                        {msg.role === 'ai' && (
                            <Text style={styles.aiLabel}>🤖 AI</Text>
                        )}
                        <Text
                            style={[
                                styles.bubbleText,
                                msg.role === 'user' ? styles.userText : styles.aiText,
                            ]}
                        >
                            {msg.text}
                        </Text>
                    </View>
                ))}

                {isLoading && (
                    <View style={styles.aiBubble}>
                        <Text style={styles.aiLabel}>🤖 AI</Text>
                        <View style={styles.typingRow}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text style={styles.typingText}>думает...</Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Поле ввода */}
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Спроси AI..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
                    onPress={sendMessage}
                    disabled={!input.trim() || isLoading}
                >
                    <Ionicons name="send" size={18} color={Colors.white} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
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
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    aiLabel: { fontSize: 10, color: Colors.textMuted, marginBottom: 4 },
    bubbleText: { fontSize: 14, lineHeight: 20 },
    userText: { color: Colors.white },
    aiText: { color: Colors.textPrimary },

    typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    typingText: { color: Colors.textSecondary, fontSize: 13 },

    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: Colors.background,
    },
    input: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: Colors.textPrimary,
        fontSize: 14,
        maxHeight: 100,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    sendBtn: {
        backgroundColor: Colors.primary,
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: { opacity: 0.4 },
});