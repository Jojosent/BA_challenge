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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { Header } from '@components/shared/Header';
import { chatService, ChatMessage, ChatRoomType } from '@services/chatService';
import { useAuthStore } from '@store/authStore';

const POLL_INTERVAL = 4000; // опрашиваем каждые 4 сек

export default function ChatScreen() {
  const { roomType, roomId, title } = useLocalSearchParams<{
    roomType: string;
    roomId: string;
    title: string;
  }>();

  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages]     = useState<ChatMessage[]>([]);
  const [text, setText]             = useState('');
  const [isLoading, setIsLoading]   = useState(true);
  const [isSending, setIsSending]   = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const rType  = roomType as ChatRoomType;
  const rId    = Number(roomId);

  // ── Загрузка сообщений ──────────────────────────────────────────
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

  // Первая загрузка
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Polling — обновление каждые 4 сек
  useEffect(() => {
    const interval = setInterval(() => fetchMessages(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // ── Отправка сообщения ──────────────────────────────────────────
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
      setText(trimmed); // возвращаем текст если ошибка
    } finally {
      setIsSending(false);
    }
  };

  // ── Удаление сообщения ──────────────────────────────────────────
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

  // ── Форматирование времени ──────────────────────────────────────
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

  // ── Рендер одного сообщения ─────────────────────────────────────
  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isMe      = item.userId === user?.id;
    const prevItem  = index > 0 ? messages[index - 1] : null;
    const showMeta  = !prevItem || prevItem.userId !== item.userId;

    return (
      <TouchableOpacity
        activeOpacity={isMe ? 0.7 : 1}
        onLongPress={() => isMe && handleDelete(item)}
        style={[styles.msgRow, isMe && styles.msgRowMe]}
      >
        {/* Аватар — только для чужих и только первое в группе */}
        {!isMe && (
          <View style={[styles.avatar, !showMeta && styles.avatarHidden]}>
            {showMeta && (
              <Text style={styles.avatarTxt}>
                {item.user.username.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        )}

        <View style={[styles.msgCol, isMe && styles.msgColMe]}>
          {/* Имя — только первое в группе и только чужие */}
          {!isMe && showMeta && (
            <Text style={styles.senderName}>{item.user.username}</Text>
          )}

          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
            <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
              {item.text}
            </Text>
          </View>

          <Text style={[styles.time, isMe && styles.timeMe]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Разделитель по датам ────────────────────────────────────────
  const renderDateSeparator = (dateStr: string) => (
    <View style={styles.dateSep}>
      <View style={styles.dateLine} />
      <Text style={styles.dateText}>{dateStr}</Text>
      <View style={styles.dateLine} />
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

  // ── Пустое состояние ────────────────────────────────────────────
  const EmptyState = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>
        {rType === 'family' ? '👨‍👩‍👧‍👦' : '🏆'}
      </Text>
      <Text style={styles.emptyTitle}>Чат пустой</Text>
      <Text style={styles.emptyText}>
        {rType === 'family'
          ? 'Напиши первое сообщение своей семье!'
          : 'Обсудите детали челленджа здесь!'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title={decodeURIComponent(title || 'Чат')}
        showBack
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Список сообщений */}
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.listContent,
              messages.length === 0 && styles.listContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => { setIsRefreshing(true); fetchMessages(); }}
                tintColor={Colors.primary}
              />
            }
            ListEmptyComponent={<EmptyState />}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Поле ввода */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Написать сообщение..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={2000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!text.trim() || isSending) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!text.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="send" size={18} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  flex:       { flex: 1 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  listContent:      { padding: 12, paddingBottom: 8 },
  listContentEmpty: { flex: 1, justifyContent: 'center' },

  // Пустой чат
  empty:      { alignItems: 'center', paddingVertical: 32 },
  emptyIcon:  { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptyText:  { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Разделитель дат
  dateSep:  { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 8 },
  dateLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dateText: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },

  // Строка сообщения
  msgRow: {
    flexDirection: 'row',
    alignItems:    'flex-end',
    marginBottom:  4,
    gap:           8,
  },
  msgRowMe: { flexDirection: 'row-reverse' },

  // Аватар
  avatar: {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: Colors.primary,
    justifyContent:  'center',
    alignItems:      'center',
  },
  avatarHidden: { backgroundColor: 'transparent' },
  avatarTxt:    { color: Colors.white, fontWeight: '700', fontSize: 13 },

  // Колонка сообщения
  msgCol:   { maxWidth: '75%' },
  msgColMe: { alignItems: 'flex-end' },

  senderName: {
    fontSize:     11,
    color:        Colors.textMuted,
    marginBottom: 3,
    marginLeft:   4,
    fontWeight:   '500',
  },

  // Пузырь
  bubble: {
    paddingHorizontal: 14,
    paddingVertical:   10,
    borderRadius:      18,
  },
  bubbleThem: {
    backgroundColor:      Colors.surface,
    borderWidth:          1,
    borderColor:          Colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleMe: {
    backgroundColor:       Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleText:   { fontSize: 15, color: Colors.textPrimary, lineHeight: 21 },
  bubbleTextMe: { color: Colors.white },

  // Время
  time:   { fontSize: 10, color: Colors.textMuted, marginTop: 3, marginLeft: 4 },
  timeMe: { marginLeft: 0, marginRight: 4 },

  // Поле ввода
  inputBar: {
    flexDirection:   'row',
    alignItems:      'flex-end',
    padding:         12,
    gap:             10,
    borderTopWidth:  1,
    borderTopColor:  Colors.border,
    backgroundColor: Colors.background,
  },
  input: {
    flex:              1,
    minHeight:         42,
    maxHeight:         120,
    backgroundColor:   Colors.surface,
    borderRadius:      21,
    paddingHorizontal: 16,
    paddingVertical:   10,
    fontSize:          15,
    color:             Colors.textPrimary,
    borderWidth:       1,
    borderColor:       Colors.border,
  },
  sendBtn: {
    width:           42,
    height:          42,
    borderRadius:    21,
    backgroundColor: Colors.primary,
    justifyContent:  'center',
    alignItems:      'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});