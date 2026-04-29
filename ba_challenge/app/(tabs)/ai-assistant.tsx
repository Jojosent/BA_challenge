import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Keyboard,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { useAuthStore } from '@store/authStore';
import api from '@services/api';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: Date;
}

interface UserContext {
    username: string;
    rikonCoins: number;
    stats: {
        avgRating: number;
        totalVoters: number;
        challengeCount: number;
        wonCount: number;
        submissionCount: number;
    };
    activeChallenges: {
        id: number;
        title: string;
        status: string;
        endDate: string;
        participantCount: number;
        tasks: {
            id: number;
            title: string;
            day: number;
            deadline: string;
            isExpired: boolean;
        }[];
    }[];
    familyMemberCount: number;
    pendingInvites: number;
}

const QUICK_QUESTIONS = [
    'Какие у меня активные челленджи?',
    'Какие задачи нужно выполнить?',
    'Как создать челлендж?',
    'Как пригласить в семью?',
    'Как начисляются очки?',
];

export default function AIAssistantScreen() {
    const { user } = useAuthStore();
    const flatListRef = useRef<FlatList>(null);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '0',
            role: 'assistant',
            text: `Привет, ${user?.username ?? 'друг'}! 👋\n\nЯ AI-ассистент приложения B&A Challenge. Могу помочь тебе с:\n\n🏆 Информацией о твоих челленджах и задачах\n👨‍👩‍👧 Семейным деревом и приглашениями\n🎯 Как создавать и участвовать в челленджах\n⭐ Системой оценок и рейтингов\n\nСпрашивай всё что хочешь!`,
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingContext, setIsLoadingContext] = useState(true);
    const [userContext, setUserContext] = useState<UserContext | null>(null);
    // ✅ Теги всегда показываются
    const [showQuickQuestions, setShowQuickQuestions] = useState(true);

    useEffect(() => {
        loadUserContext();
    }, []);

    // ── Загрузка всех данных пользователя ──────────────────────
    const loadUserContext = async () => {
        try {
            setIsLoadingContext(true);

            const [challengesRes, statsRes, familyRes, invitesRes] = await Promise.all([
                api.get('/challenges').catch(() => ({ data: [] })),
                api.get('/users/stats').catch(() => ({ data: {} })),
                api.get('/family/members').catch(() => ({ data: [] })),
                api.get('/family/invites').catch(() => ({ data: [] })),
            ]);

            const challenges = challengesRes.data || [];
            const now = new Date();

            const myChallenges = challenges.filter((c: any) =>
                c.participants?.some((p: any) => p.userId === user?.id)
            );

            const activeChallenges = myChallenges.filter(
                (c: any) => c.status === 'active' || c.status === 'pending'
            );

            const challengesWithTasks = await Promise.all(
                activeChallenges.slice(0, 5).map(async (c: any) => {
                    try {
                        const tasksRes = await api.get(`/challenges/${c.id}/tasks`);
                        const tasks = tasksRes.data || [];

                        const mappedTasks = tasks.map((t: any) => {
                            const deadline = t.deadline ? new Date(t.deadline) : null;
                            const isExpired = deadline ? now > deadline : false;
                            return {
                                id: t.id,
                                title: t.title,
                                day: t.day,
                                deadline: deadline
                                    ? deadline.toLocaleDateString('ru-RU', {
                                        day: 'numeric',
                                        month: 'long',
                                    })
                                    : 'нет дедлайна',
                                isExpired,
                            };
                        });

                        return {
                            id: c.id,
                            title: c.title,
                            status: c.status,
                            endDate: new Date(c.endDate).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                            }),
                            participantCount: c.participants?.length ?? 0,
                            tasks: mappedTasks,
                        };
                    } catch {
                        return {
                            id: c.id,
                            title: c.title,
                            status: c.status,
                            endDate: new Date(c.endDate).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                            }),
                            participantCount: c.participants?.length ?? 0,
                            tasks: [],
                        };
                    }
                })
            );

            setUserContext({
                username: user?.username ?? '',
                rikonCoins: user?.rikonCoins ?? 0,
                stats: statsRes.data,
                activeChallenges: challengesWithTasks,
                familyMemberCount: (familyRes.data || []).length,
                pendingInvites: (invitesRes.data || []).length,
            });
        } catch (e) {
            console.log('Context load error:', e);
        } finally {
            setIsLoadingContext(false);
        }
    };

    // ── Системный промпт ────────────────────────────────────────
    const buildSystemPrompt = (): string => {
        const ctx = userContext;

        let prompt = `Ты AI-ассистент мобильного приложения "B&A Challenge".
Отвечай кратко, дружелюбно, на русском языке.
Используй эмодзи для наглядности.
Максимум 3-4 коротких абзаца в ответе.

ДАННЫЕ ПОЛЬЗОВАТЕЛЯ:
Имя: ${ctx?.username ?? user?.username ?? 'Неизвестно'}
Монеты Rikon: ${ctx?.rikonCoins ?? user?.rikonCoins ?? 0} 🪙
Средний рейтинг: ${ctx?.stats?.avgRating?.toFixed?.(2) ?? '0'} ⭐ (от ${ctx?.stats?.totalVoters ?? 0} оценщиков)
Участвует в челленджах: ${ctx?.stats?.challengeCount ?? 0}
Побед: ${ctx?.stats?.wonCount ?? 0}
Загрузил доказательств: ${ctx?.stats?.submissionCount ?? 0}
Членов семьи в дереве: ${ctx?.familyMemberCount ?? 0}
Входящих приглашений в семью: ${ctx?.pendingInvites ?? 0}`;

        if (ctx?.activeChallenges && ctx.activeChallenges.length > 0) {
            prompt += `\n\nАКТИВНЫЕ ЧЕЛЛЕНДЖИ ПОЛЬЗОВАТЕЛЯ:`;
            ctx.activeChallenges.forEach((c, i) => {
                prompt += `\n\n${i + 1}. "${c.title}"
   Статус: ${c.status === 'active' ? '🔥 Активен' : '⏳ Ожидает'}
   Дата окончания: ${c.endDate}
   Участников: ${c.participantCount}`;

                if (c.tasks.length > 0) {
                    prompt += `\n   Задачи:`;
                    c.tasks.forEach((t) => {
                        const status = t.isExpired ? '❌ просрочена' : '✅ активна';
                        prompt += `\n   - День ${t.day}: "${t.title}" (дедлайн: ${t.deadline}, ${status})`;
                    });

                    const activeTasks = c.tasks.filter((t) => !t.isExpired);
                    if (activeTasks.length > 0) {
                        prompt += `\n   Следующая задача: День ${activeTasks[0].day} — "${activeTasks[0].title}" до ${activeTasks[0].deadline}`;
                    } else {
                        prompt += `\n   Все задачи просрочены`;
                    }
                } else {
                    prompt += `\n   Задачи ещё не добавлены`;
                }
            });
        } else {
            prompt += `\n\nУ пользователя нет активных челленджей.`;
        }

        prompt += `

КАК РАБОТАЕТ ПРИЛОЖЕНИЕ:

ЧЕЛЛЕНДЖИ — соревнования между друзьями или семьёй.
Создаёшь челлендж, добавляешь задачи, приглашаешь участников.
Каждая задача имеет дедлайн — нужно успеть загрузить доказательство (фото или видео).
Другие участники голосуют за твоё доказательство звёздами от 1 до 5.
Можно поставить ставку в монетах — победитель получает призовой пул.

КАК СОЗДАТЬ ЧЕЛЛЕНДЖ:
1. Вкладка "Челленджи" → кнопка "+" в правом верхнем углу
2. Заполни название и описание
3. Выбери даты начала и окончания
4. Выбери видимость: Публичный (виден всем) или По приглашению
5. Укажи ставку в монетах (0 = бесплатно)
6. После создания добавь задачи вручную или через AI генератор
7. Для закрытых — пригласи участников через кнопку "Пригласить участника"

КАК ВЫПОЛНИТЬ ЗАДАЧУ:
1. Открой свой челлендж
2. Нажми на нужную задачу
3. Загрузи фото или видео как доказательство
4. Жди пока другие участники оценят твою работу

КАК РАБОТАЕТ СЕМЬЯ:
Семейное дерево — визуальная схема твоих родственников.
Кнопка "person+" вверху → поиск пользователя по нику → выбери родство → отправь приглашение.
Приглашённый увидит уведомление в колокольчике.
После принятия он появляется в твоём дереве.
Семейные челленджи создаются отдельно и видны только членам семьи.

КАК НАЧИСЛЯЮТСЯ ОЧКИ:
Другие участники голосуют за твои доказательства от 1 до 5 звёзд.
Средняя оценка всех голосов = рейтинг за доказательство.
Сумма рейтингов всех доказательств = твои очки в челлендже.

RIKON МОНЕТЫ:
Стартовый баланс 100 монет при регистрации.
Тратятся при вступлении в платный челлендж.
Победитель получает 50% пула, 2-е место 30%, 3-е место 20%.
При 2 участниках: 70% и 30%.

Если пользователь спрашивает о своих данных — используй информацию выше.`;

        return prompt;
    };

    // ── Отправка через бэкенд (Google Gemini) ──────────────────
    const sendMessage = async (text?: string) => {
        const msgText = (text ?? input).trim();
        if (!msgText || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: msgText,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        Keyboard.dismiss();

        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            // ✅ Используем существующий бэкенд AI чат через Gemini
            const systemPrompt = buildSystemPrompt();

            // Формируем полный запрос с контекстом
            const fullMessage = `${systemPrompt}\n\nВопрос пользователя: ${msgText}`;

            const response = await api.post('/ai/chat', {
                message: fullMessage,
                language: 'ru',
            });

            const reply = response.data?.reply ?? 'Извини, не смог обработать запрос.';

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: reply,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, aiMsg]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (e: any) {
            const errMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: '❌ Не удалось связаться с AI. Проверь соединение и попробуй снова.',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (date: Date) =>
        date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.role === 'user';
        return (
            <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
                {!isUser && (
                    <View style={styles.botAvatar}>
                        <Text style={styles.botAvatarTxt}>🤖</Text>
                    </View>
                )}
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
                    <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
                        {item.text}
                    </Text>
                    <Text style={[styles.timeText, isUser && styles.timeTextUser]}>
                        {formatTime(item.timestamp)}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Шапка */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.headerAvatar}>
                        <Text style={styles.headerAvatarTxt}>🤖</Text>
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>AI Ассистент</Text>
                        <Text style={styles.headerSub}>
                            {isLoadingContext
                                ? '⏳ Загружаю твои данные...'
                                : `✅ Готов · ${userContext?.activeChallenges?.length ?? 0} челленджей`}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.refreshBtn}
                    onPress={loadUserContext}
                    disabled={isLoadingContext}
                >
                    {isLoadingContext ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                        <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                {/* Список сообщений */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() =>
                        flatListRef.current?.scrollToEnd({ animated: false })
                    }
                />

                {/* ✅ Быстрые вопросы — всегда видны, можно скрыть */}
                <View style={styles.quickSection}>
                    <TouchableOpacity
                        style={styles.quickHeader}
                        onPress={() => setShowQuickQuestions((v) => !v)}
                    >
                        <Text style={styles.quickTitle}>💡 Быстрые вопросы</Text>
                        <Ionicons
                            name={showQuickQuestions ? 'chevron-down' : 'chevron-up'}
                            size={14}
                            color={Colors.textMuted}
                        />
                    </TouchableOpacity>

                    {showQuickQuestions && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.quickList}
                        >
                            {QUICK_QUESTIONS.map((q) => (
                                <TouchableOpacity
                                    key={q}
                                    style={styles.quickChip}
                                    onPress={() => sendMessage(q)}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.quickChipTxt}>{q}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Индикатор набора */}
                {isLoading && (
                    <View style={styles.typingRow}>
                        <View style={styles.botAvatar}>
                            <Text style={styles.botAvatarTxt}>🤖</Text>
                        </View>
                        <View style={styles.typingBubble}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text style={styles.typingText}>думает...</Text>
                        </View>
                    </View>
                )}

                {/* Поле ввода */}
                <View style={styles.inputBar}>
                    <TextInput
                        style={styles.input}
                        value={input}
                        onChangeText={setInput}
                        placeholder="Спроси что-нибудь..."
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        maxLength={500}
                        returnKeyType="default"
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendBtn,
                            (!input.trim() || isLoading) && styles.sendBtnDisabled,
                        ]}
                        onPress={() => sendMessage()}
                        disabled={!input.trim() || isLoading}
                    >
                        <Ionicons name="send" size={18} color={Colors.white} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    flex: { flex: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.background,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary + '22',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.primary + '44',
    },
    headerAvatarTxt: { fontSize: 22 },
    headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
    headerSub: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
    refreshBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },

    messagesList: { padding: 16, paddingBottom: 8, gap: 12 },

    msgRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: 4,
    },
    msgRowUser: { flexDirection: 'row-reverse' },

    botAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary + '22',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.primary + '33',
    },
    botAvatarTxt: { fontSize: 16 },

    bubble: { maxWidth: '78%', padding: 12, borderRadius: 18, gap: 4 },
    bubbleBot: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderBottomLeftRadius: 4,
    },
    bubbleUser: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    bubbleText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 21 },
    bubbleTextUser: { color: Colors.white },
    timeText: { fontSize: 10, color: Colors.textMuted, alignSelf: 'flex-end' },
    timeTextUser: { color: 'rgba(255,255,255,0.6)' },

    // ✅ Быстрые вопросы с кнопкой скрыть/показать
    quickSection: {
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: Colors.background,
    },
    quickHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    quickTitle: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
    quickList: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
    quickChip: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: Colors.primary + '44',
    },
    quickChipTxt: { fontSize: 12, color: Colors.primary, fontWeight: '500' },

    typingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    typingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.surface,
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        borderBottomLeftRadius: 4,
    },
    typingText: { fontSize: 13, color: Colors.textSecondary },

    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: Colors.background,
    },
    input: {
        flex: 1,
        minHeight: 42,
        maxHeight: 120,
        backgroundColor: Colors.surface,
        borderRadius: 21,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        color: Colors.textPrimary,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    sendBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: { opacity: 0.4 },
});