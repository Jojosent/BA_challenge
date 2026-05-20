import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '@services/api';
import { useTheme } from '@/theme/ThemeContext';

interface InviteToChallengeModalProps {
  visible: boolean;
  onClose: () => void;
  challengeId: number;
}

export const InviteToChallengeModal: React.FC<InviteToChallengeModalProps> = ({
  visible, onClose, challengeId,
}) => {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending]   = useState<number | null>(null);
  const [invited, setInvited]   = useState<number[]>([]);
  const { theme } = useTheme();

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) { setResults([]); return; }
    try {
      setSearching(true);
      const response = await api.get(`/challenges/search-users?q=${encodeURIComponent(text)}`);
      setResults(response.data);
    } catch (e) {
      console.log('Search error:', e);
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async (userId: number, username: string) => {
    try {
      setSending(userId);
      await api.post(`/challenges/${challengeId}/invite`, { toUserId: userId });
      setInvited((prev) => [...prev, userId]);
      Alert.alert('✅', `${username} получит приглашение`);
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setSending(null);
    }
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setInvited([]);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>🔒 Пригласить участника</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Найди пользователя — он получит приглашение
          </Text>

          <View style={[styles.searchRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="search-outline" size={18} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              value={query}
              onChangeText={handleSearch}
              placeholder="Имя пользователя..."
              placeholderTextColor={theme.textMuted}
              autoFocus
            />
            {searching && <ActivityIndicator size="small" color={theme.primary} />}
          </View>

          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            style={styles.list}
            ListEmptyComponent={
              query.length >= 2 && !searching ? (
                <Text style={[styles.noResults, { color: theme.textMuted }]}>Пользователи не найдены</Text>
              ) : null
            }
            renderItem={({ item }) => {
              const isInvited = invited.includes(item.id);
              const isSending = sending === item.id;

              return (
                <View style={[styles.userRow, { borderBottomColor: theme.border }]}>
                  <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                    <Text style={styles.avatarTxt}>
                      {item.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={s.userInfo || styles.userInfo}>
                    <Text style={[styles.username, { color: theme.textPrimary }]}>{item.username}</Text>
                    <Text style={[styles.rating, { color: theme.textMuted }]}>⭐ {item.rating}</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.inviteBtn,
                      { backgroundColor: theme.primary },
                      isInvited && { backgroundColor: theme.accent },
                    ]}
                    onPress={() => !isInvited && handleInvite(item.id, item.username)}
                    disabled={isInvited || isSending}
                  >
                    {isSending
                      ? <ActivityIndicator size="small" color="#ffffff" />
                      : <Text style={styles.inviteBtnTxt}>
                          {isInvited ? '✓ Отправлено' : 'Пригласить'}
                        </Text>
                    }
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title:    { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 13, marginBottom: 16 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12, gap: 8, marginBottom: 12,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15 },
  list:        { maxHeight: 350 },
  noResults:   { textAlign: 'center', padding: 20 },

  userRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, gap: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarTxt:  { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  userInfo:   { flex: 1 },
  username:   { fontSize: 15, fontWeight: '600' },
  rating:     { fontSize: 12, marginTop: 2 },

  inviteBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, minWidth: 90, alignItems: 'center',
  },
  invitedBtn:    {},
  inviteBtnTxt:  { color: '#ffffff', fontWeight: '600', fontSize: 13 },
});