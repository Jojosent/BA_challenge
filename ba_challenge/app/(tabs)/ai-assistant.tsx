import { Ionicons } from '@expo/vector-icons';
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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';

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
  activeChallenges: any[];
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
  const { theme } = useTheme();

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
    setMessages([
      {
        id: '0',
        role: 'assistant',
        text: t('ai.welcomeMessage', {
          username: user?.username ?? t('ai.friend'),
        }),
        timestamp: new Date(),
      },
    ]);
  }, [i18n.language, user?.username, t]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);

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

  useEffect(() => {
    loadUserContext();
  }, []);

  const loadUserContext = async () => {
    try {
      setIsLoadingContext(true);

      const [challengesRes, statsRes, familyRes, invitesRes] =
        await Promise.all([
          api.get('/challenges').catch(() => ({ data: [] })),
          api.get('/users/stats').catch(() => ({ data: {} })),
          api.get('/family/members').catch(() => ({ data: [] })),
          api.get('/family/invites').catch(() => ({ data: [] })),
        ]);

      setUserContext({
        username: user?.username ?? '',
        rikonCoins: user?.rikonCoins ?? 0,
        stats: statsRes.data,
        activeChallenges: challengesRes.data || [],
        familyMemberCount: (familyRes.data || []).length,
        pendingInvites: (invitesRes.data || []).length,
      });
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoadingContext(false);
    }
  };

  const buildSystemPrompt = (): string => {
    const ctx = userContext;

    return t('ai.systemPrompt', {
      username: ctx?.username ?? user?.username,
      rikonCoins: ctx?.rikonCoins ?? 0,
      avgRating: ctx?.stats?.avgRating?.toFixed?.(2) ?? '0',
      totalVoters: ctx?.stats?.totalVoters ?? 0,
      challengeCount: ctx?.stats?.challengeCount ?? 0,
      wonCount: ctx?.stats?.wonCount ?? 0,
      submissionCount: ctx?.stats?.submissionCount ?? 0,
      familyMemberCount: ctx?.familyMemberCount ?? 0,
      pendingInvites: ctx?.pendingInvites ?? 0,
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

    setMessages((p) => [...p, userMsg]);
    setInput('');
    setIsLoading(true);
    setShowQuickQuestions(false);
    Keyboard.dismiss();

    try {
      const systemPrompt = buildSystemPrompt();

      const response = await api.post('/ai/chat', {
        message: `${systemPrompt}\n\n${msgText}`,
        language: getAiLanguage(),
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.data?.reply,
        timestamp: new Date(),
      };

      setMessages((p) => [...p, aiMsg]);
    } catch {
      setMessages((p) => [
        ...p,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: t('ai.connectionError'),
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[msg.row, isUser && msg.rowUser]}>
        {!isUser && (
          <View style={[msg.avatarWrap, { shadowColor: theme.primary ?? '#5E4BDB' }]}>
            <Image
              source={require('../../assets/images/ai-avatar.png')}
              style={msg.avatarImg}
            />
          </View>
        )}

        <View
          style={[
            msg.bubble,
            isUser
              ? {
                  backgroundColor: theme.primary ?? '#5E4BDB',
                  borderColor: 'transparent',
                  shadowColor: theme.primary ?? '#5E4BDB',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 10,
                  elevation: 4,
                }
              : {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  shadowColor: theme.textPrimary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                },
          ]}
        >
          <Text
            style={[
              msg.text,
              { color: isUser ? '#fff' : theme.textPrimary },
            ]}
          >
            {item.text}
          </Text>

          <Text
            style={[
              msg.time,
              { color: isUser ? 'rgba(255,255,255,0.55)' : theme.textSecondary },
            ]}
          >
            {item.timestamp.toLocaleTimeString(getLocale(), {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderQuickQuestions = () => {
    if (!showQuickQuestions) return null;

    return (
      <View style={quick.wrap}>
        {QUICK_QUESTION_KEYS.map((key) => (
          <TouchableOpacity
            key={key}
            style={[
              quick.chip,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            onPress={() => sendMessage(t(key))}
            activeOpacity={0.75}
          >
            <Ionicons
              name="sparkles-outline"
              size={13}
              color={theme.primary ?? '#5E4BDB'}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[quick.text, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {t(key)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isLoading) return null;

    return (
      <View style={[msg.row]}>
        <View style={[msg.avatarWrap, { shadowColor: theme.primary ?? '#5E4BDB' }]}>
          <Image
            source={require('../../assets/images/ai-avatar.png')}
            style={msg.avatarImg}
          />
        </View>

        <View
          style={[
            typing.bubble,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <ActivityIndicator size="small" color={theme.primary ?? '#5E4BDB'} />
          <Text style={[typing.text, { color: theme.textSecondary }]}>
            {t('ai.thinking')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: theme.bg }]}>
      {/* HEADER */}
      <View
        style={[
          s.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <View style={[s.headerIcon, { backgroundColor: (theme.primary ?? '#5E4BDB') + '18' }]}>
          <Ionicons name="sparkles" size={18} color={theme.primary ?? '#5E4BDB'} />
        </View>

        <View style={s.headerText}>
          <Text style={[s.title, { color: theme.textPrimary }]}>
            {t('ai.title')}
          </Text>
          <Text style={[s.subtitle, { color: theme.textSecondary }]}>
            {isLoadingContext ? t('ai.loadingContext') : t('ai.online')}
          </Text>
        </View>

        <View
          style={[
            s.statusDot,
            {
              backgroundColor: isLoadingContext
                ? (theme.textSecondary ?? '#9CA3AF')
                : '#22C55E',
            },
          ]}
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(i) => i.id}
          renderItem={renderMessage}
          contentContainerStyle={s.list}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListFooterComponent={
            <>
              {renderTypingIndicator()}
              {renderQuickQuestions()}
            </>
          }
        />

        {/* INPUT BAR */}
        <View
          style={[
            s.inputBar,
            {
              borderTopColor: theme.border,
              backgroundColor: theme.surface,
            },
          ]}
        >
          <View
            style={[
              s.inputWrap,
              {
                backgroundColor: theme.bg,
                borderColor: theme.border,
              },
            ]}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              style={[s.input, { color: theme.textPrimary }]}
              placeholder={t('ai.placeholder')}
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={500}
              onSubmitEditing={() => sendMessage()}
            />
          </View>

          <TouchableOpacity
            style={[
              s.sendBtn,
              {
                backgroundColor:
                  input.trim()
                    ? (theme.primary ?? '#5E4BDB')
                    : (theme.border ?? '#E8E3FF'),
                shadowColor: input.trim()
                  ? (theme.primary ?? '#5E4BDB')
                  : 'transparent',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
                elevation: input.trim() ? 6 : 0,
              },
            ]}
            onPress={() => sendMessage()}
            activeOpacity={0.8}
            disabled={!input.trim() || isLoading}
          >
            <Ionicons
              name="send"
              size={18}
              color={input.trim() ? '#fff' : (theme.textSecondary ?? '#9CA3AF')}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ── Message bubble styles ── */
const msg = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 10,
    alignItems: 'flex-end',
  },
  rowUser: {
    flexDirection: 'row-reverse',
  },
  avatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  time: {
    fontSize: 10,
    fontWeight: '500',
    alignSelf: 'flex-end',
  },
});

/* ── Typing indicator ── */
const typing = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: '60%',
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
});

/* ── Quick questions ── */
const quick = StyleSheet.create({
  wrap: {
    paddingHorizontal: 4,
    paddingBottom: 8,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
});

/* ── Screen-level styles ── */
const s = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Message list
  list: {
    padding: 16,
    paddingBottom: 8,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    lineHeight: 20,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});