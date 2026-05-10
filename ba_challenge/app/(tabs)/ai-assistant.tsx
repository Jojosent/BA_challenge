import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import api from '@services/api';
import { useAuthStore } from '@store/authStore';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const QUICK_QUESTION_KEYS = [
  'ai.quick.activeChallenges',
  'ai.quick.tasks',
  'ai.quick.createChallenge',
  'ai.quick.inviteFamily',
  'ai.quick.points',
];

export default function AIAssistantScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: t('ai.welcomeMessage', {
        username: user?.username ?? t('ai.friend'),
      }),
      timestamp: new Date(),
    },
  ]);
    useEffect(() => {
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id === '0') {
          return [
            {
              id: '0',
              role: 'assistant',
              text: t('ai.welcomeMessage', {
                username: user?.username ?? t('ai.friend'),
              }),
              timestamp: new Date(),
            },
          ];
        }

        return prev;
      });
    }, [i18n.language, user?.username, t]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);

  useEffect(() => {
    loadUserContext();
  }, []);

  const getLocale = () => {
    if (i18n.language === 'kz') return 'kk-KZ';
    if (i18n.language === 'en') return 'en-US';
    return 'ru-RU';
  };

  const getAiLanguage = () => {
    if (i18n.language === 'kz') return 'kk';
    if (i18n.language === 'en') return 'en';
    return 'ru';
  };

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

            const mappedTasks = tasks.map((task: any) => {
              const deadline = task.deadline ? new Date(task.deadline) : null;
              const isExpired = deadline ? now > deadline : false;

              return {
                id: task.id,
                title: task.title,
                day: task.day,
                deadline: deadline
                  ? deadline.toLocaleDateString(getLocale(), {
                      day: 'numeric',
                      month: 'long',
                    })
                  : t('ai.noDeadline'),
                isExpired,
              };
            });

            return {
              id: c.id,
              title: c.title,
              status: c.status,
              endDate: new Date(c.endDate).toLocaleDateString(getLocale(), {
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
              endDate: new Date(c.endDate).toLocaleDateString(getLocale(), {
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

  const buildSystemPrompt = (): string => {
    const ctx = userContext;

    return t('ai.systemPrompt', {
      username: ctx?.username ?? user?.username ?? t('ai.unknown'),
      rikonCoins: ctx?.rikonCoins ?? user?.rikonCoins ?? 0,
      avgRating: ctx?.stats?.avgRating?.toFixed?.(2) ?? '0',
      totalVoters: ctx?.stats?.totalVoters ?? 0,
      challengeCount: ctx?.stats?.challengeCount ?? 0,
      wonCount: ctx?.stats?.wonCount ?? 0,
      submissionCount: ctx?.stats?.submissionCount ?? 0,
      familyMemberCount: ctx?.familyMemberCount ?? 0,
      pendingInvites: ctx?.pendingInvites ?? 0,
      activeChallenges:
        ctx?.activeChallenges && ctx.activeChallenges.length > 0
          ? ctx.activeChallenges
              .map((c, i) => {
                const tasksText =
                  c.tasks.length > 0
                    ? c.tasks
                        .map((task) =>
                          t('ai.promptTaskItem', {
                            day: task.day,
                            title: task.title,
                            deadline: task.deadline,
                            status: task.isExpired
                              ? t('ai.expired')
                              : t('ai.activeTask'),
                          })
                        )
                        .join('\n')
                    : t('ai.noTasksAdded');

                return t('ai.promptChallengeItem', {
                  index: i + 1,
                  title: c.title,
                  status:
                    c.status === 'active'
                      ? t('ai.statusActive')
                      : t('ai.statusPending'),
                  endDate: c.endDate,
                  participantCount: c.participantCount,
                  tasks: tasksText,
                });
              })
              .join('\n\n')
          : t('ai.noActiveChallenges'),
    });
  };

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
      const systemPrompt = buildSystemPrompt();
      const fullMessage = `${systemPrompt}\n\n${t('ai.userQuestion')}: ${msgText}`;

      const response = await api.post('/ai/chat', {
        message: fullMessage,
        language: getAiLanguage(),
      });

      const reply = response.data?.reply ?? t('ai.defaultError');

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: t('ai.connectionError'),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString(getLocale(), {
      hour: '2-digit',
      minute: '2-digit',
    });

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Image
              source={require('../../assets/images/ai-avatar.png')}
              style={styles.aiAvatarImage}
            />
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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Image
              source={require('../../assets/images/ai-avatar.png')}
              style={styles.aiAvatarImageLarge}
            />
          </View>

          <View>
            <Text style={styles.headerTitle}>{t('ai.title')}</Text>
            <Text style={styles.headerSub}>
              {isLoadingContext
                ? t('ai.loadingData')
                : t('ai.readyStatus', {
                    count: userContext?.activeChallenges?.length ?? 0,
                  })}
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

        <View style={styles.quickSection}>
          <TouchableOpacity
            style={styles.quickHeader}
            onPress={() => setShowQuickQuestions((v) => !v)}
          >
            <Text style={styles.quickTitle}>{t('ai.quickTitle')}</Text>
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
              {QUICK_QUESTION_KEYS.map((key) => {
                const question = t(key);

                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.quickChip}
                    onPress={() => sendMessage(question)}
                    disabled={isLoading}
                  >
                    <Text style={styles.quickChipTxt}>{question}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {isLoading && (
          <View style={styles.typingRow}>
            <View style={styles.botAvatar}>
              <Image
                source={require('../../assets/images/ai-avatar.png')}
                style={styles.aiAvatarImage}
              />
            </View>

            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.typingText}>{t('ai.thinking')}</Text>
            </View>
          </View>
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={t('ai.placeholder')}
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
  aiAvatarImage: {
    width: '100%',
    height: '100%',
  },
  aiAvatarImageLarge: {
    width: '100%',
    height: '100%',
  },
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
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
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
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
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