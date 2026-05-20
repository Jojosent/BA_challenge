import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Config } from '@constants/config';
import { Header } from '@components/shared/Header';
import { chatService, ChatMessage, ChatRoomType } from '@services/chatService';
import { useAuthStore } from '@store/authStore';
import { useTheme } from '@/theme/ThemeContext';

const POLL_INTERVAL = 4000;

export default function ChatScreen() {
  const { roomType, roomId, title } = useLocalSearchParams<{
    roomType: string;
    roomId: string;
    title: string;
  }>();

  const { user } = useAuthStore();
  const { theme } = useTheme();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const rType = roomType as ChatRoomType;
  const rId = Number(roomId);

  const getAvatarUrl = (url?: string | null) => {
    if (!url) return null;
    const baseUrl = Config.API_URL.split('/api')[0];
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const fetchMessages = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await chatService.getMessages(rType, rId);
      setMessages(data);
    } catch (e: any) {
      if (!silent) console.log('Chat fetch error:', e.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [rType, rId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const interval = setInterval(() => fetchMessages(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    try {
      setIsSending(true);
      setText('');
      const newMsg = await chatService.sendMessage(rType, rId, trimmed);
      setMessages((prev) => [...prev, newMsg]);
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
      setText(trimmed);
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = (msg: ChatMessage) => {
    if (msg.userId !== user?.id) return;
    Alert.alert('Удалить сообщение?', msg.text.slice(0, 60), [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await chatService.deleteMessage(msg.id);
            setMessages((prev) => prev.filter((m) => m.id !== msg.id));
          } catch (e: any) {
            Alert.alert('Ошибка', e.message);
          }
        },
      },
    ]);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isMe = item.userId === user?.id;
    const prevItem = index > 0 ? messages[index - 1] : null;
    const showMeta = !prevItem || prevItem.userId !== item.userId;

    return (
      <TouchableOpacity
        activeOpacity={isMe ? 0.7 : 1}
        onLongPress={() => isMe && handleDelete(item)}
        style={[styles.msgRow, isMe && styles.msgRowMe]}
      >
        {!isMe && (
          <View style={[styles.avatar, !showMeta && styles.avatarHidden, { backgroundColor: theme.primary }]}>
            {showMeta && (
              item.user.avatarUrl ? (
                <Image 
                  source={{ uri: getAvatarUrl(item.user.avatarUrl)! }} 
                  style={{ width: '100%', height: '100%', borderRadius: 16 }} 
                />
              ) : (
                <Text style={styles.avatarTxt}>
                  {item.user.username.charAt(0).toUpperCase()}
                </Text>
              )
            )}
          </View>
        )}

        <View style={[styles.msgCol, isMe && styles.msgColMe]}>
          {!isMe && showMeta && (
            <Text style={[styles.senderName, { color: theme.textMuted }]}>{item.user.username}</Text>
          )}

          <View
            style={[
              styles.bubble,
              isMe
                ? [styles.bubbleMe, { backgroundColor: theme.primary }]
                : [styles.bubbleThem, { backgroundColor: theme.surface, borderColor: theme.border }],
            ]}
          >
            <Text style={[styles.bubbleText, isMe ? { color: '#ffffff' } : { color: theme.textPrimary }]}>
              {item.text}
            </Text>
          </View>

          <Text style={[styles.time, isMe && styles.timeMe, { color: theme.textMuted }]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDateSeparator = (dateStr: string) => (
    <View style={styles.dateSep}>
      <View style={[styles.dateLine, { backgroundColor: theme.border }]} />
      <Text style={[styles.dateText, { color: theme.textMuted }]}>{dateStr}</Text>
      <View style={[styles.dateLine, { backgroundColor: theme.border }]} />
    </View>
  );

  const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const prev = index > 0 ? messages[index - 1] : null;
    const currDate = new Date(item.createdAt).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long',
    });
    const prevDate = prev
      ? new Date(prev.createdAt).toLocaleDateString('ru-RU', {
          day: 'numeric', month: 'long',
        })
      : null;

    return (
      <>
        {currDate !== prevDate && renderDateSeparator(currDate)}
        {renderMessage({ item, index })}
      </>
    );
  };

  const EmptyState = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>
        {rType === 'family' ? '👨‍👩‍👧‍👦' : '🏆'}
      </Text>
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Чат пустой</Text>
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        {rType === 'family'
          ? 'Напиши первое сообщение своей семье!'
          : 'Обсудите детали челленджа здесь!'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <Header title={decodeURIComponent(title || 'Чат')} showBack />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={[styles.listContent, messages.length === 0 && styles.listContentEmpty]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  setIsRefreshing(true);
                  fetchMessages();
                }}
                tintColor={theme.primary}
              />
            }
            ListEmptyComponent={<EmptyState />}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        <View style={[styles.inputBar, { borderTopColor: theme.border, backgroundColor: theme.bg }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
            value={text}
            onChangeText={setText}
            placeholder="Написать сообщение..."
            placeholderTextColor={theme.textMuted}
            multiline
            maxLength={2000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: theme.primary },
              (!text.trim() || isSending) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!text.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="send" size={18} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1 },
  flex:       { flex: 1 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  listContent:      { padding: 12, paddingBottom: 8 },
  listContentEmpty: { flex: 1, justifyContent: 'center' },

  empty:      { alignItems: 'center', paddingVertical: 32 },
  emptyIcon:  { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyText:  { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  dateSep:  { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 8 },
  dateLine: { flex: 1, height: 1 },
  dateText: { fontSize: 11, fontWeight: '500' },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4, gap: 8 },
  msgRowMe: { flexDirection: 'row-reverse' },

  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarHidden: { backgroundColor: 'transparent' },
  avatarTxt:    { color: '#ffffff', fontWeight: '700', fontSize: 13 },

  msgCol:   { maxWidth: '75%' },
  msgColMe: { alignItems: 'flex-end' },

  senderName: { fontSize: 11, marginBottom: 3, marginLeft: 4, fontWeight: '500' },

  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleThem: { borderWidth: 1, borderBottomLeftRadius: 4 },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubbleText:   { fontSize: 15, lineHeight: 21 },

  time:   { fontSize: 10, marginTop: 3, marginLeft: 4 },
  timeMe: { marginLeft: 0, marginRight: 4 },

  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 10, borderTopWidth: 1 },
  input: { flex: 1, minHeight: 42, maxHeight: 120, borderRadius: 21, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, borderWidth: 1 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});
