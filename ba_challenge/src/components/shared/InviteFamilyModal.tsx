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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { familyService } from '@services/familyService';
import { FamilyMember, RELATION_LABELS, Relation } from '@/types/index';

const RELATIONS = Object.keys(RELATION_LABELS) as Relation[];

interface InviteFamilyModalProps {
  visible: boolean;
  onClose: () => void;
  members: FamilyMember[];
  onInviteSent: () => void;
}

export const InviteFamilyModal: React.FC<InviteFamilyModalProps> = ({
  visible, onClose, members, onInviteSent,
}) => {
  const [step, setStep]             = useState<1 | 2>(1);
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState<any[]>([]);
  const [searching, setSearching]   = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [relation, setRelation]     = useState<Relation>('other');
  const [parentId, setParentId]     = useState<number | undefined>(undefined);
  const [birthYear, setBirthYear]   = useState('');
  const [sending, setSending]       = useState(false);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) { setResults([]); return; }
    try {
      setSearching(true);
      const data = await familyService.searchUsers(text);
      setResults(data);
    } catch (e) {
      console.log('Search error:', e);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setStep(2);
  };

  const handleSendInvite = async () => {
    if (!selectedUser || !relation) return;
    try {
      setSending(true);
      await familyService.sendInvite({
        toUserId:  selectedUser.id,
        relation,
        parentId,
        birthYear: birthYear ? parseInt(birthYear) : undefined,
      });
      Alert.alert(
        '✅ Приглашение отправлено!',
        `${selectedUser.username} получит уведомление`
      );
      onInviteSent();
      handleClose();
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setQuery('');
    setResults([]);
    setSelectedUser(null);
    setRelation('other');
    setParentId(undefined);
    setBirthYear('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>

          {/* Шаг 1 — Поиск пользователя */}
          {step === 1 && (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>👤 Пригласить в семью</Text>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={22} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>
                Найди пользователя по имени
              </Text>

              {/* Поиск */}
              <View style={styles.searchRow}>
                <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={handleSearch}
                  placeholder="Имя пользователя..."
                  placeholderTextColor={Colors.textMuted}
                  autoFocus
                />
                {searching && <ActivityIndicator size="small" color={Colors.primary} />}
              </View>

              {/* Результаты */}
              <FlatList
                data={results}
                keyExtractor={(item) => String(item.id)}
                style={styles.resultsList}
                ListEmptyComponent={
                  query.length >= 2 && !searching ? (
                    <Text style={styles.noResults}>Пользователи не найдены</Text>
                  ) : null
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.userRow}
                    onPress={() => handleSelectUser(item)}
                  >
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarTxt}>
                        {item.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.username}>{item.username}</Text>
                      <Text style={styles.userRating}>⭐ рейтинг {item.rating}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
              />
            </>
          )}

          {/* Шаг 2 — Настройка роли */}
          {step === 2 && selectedUser && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => setStep(1)}>
                  <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Настроить роль</Text>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={22} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Выбранный пользователь */}
              <View style={styles.selectedUserCard}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarTxt}>
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.selectedUserName}>{selectedUser.username}</Text>
              </View>

              {/* Роль */}
              <Text style={styles.label}>Кем он тебе приходится? *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.relationsScroll}
              >
                {RELATIONS.filter(r => r !== 'self').map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.chip, relation === r && styles.chipActive]}
                    onPress={() => setRelation(r)}
                  >
                    <Text style={[styles.chipTxt, relation === r && styles.chipTxtActive]}>
                      {RELATION_LABELS[r]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Привязать к члену дерева */}
              {members.length > 0 && (
                <>
                  <Text style={styles.label}>Связан с кем в дереве?</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.relationsScroll}
                  >
                    <TouchableOpacity
                      style={[styles.chip, !parentId && styles.chipActive]}
                      onPress={() => setParentId(undefined)}
                    >
                      <Text style={[styles.chipTxt, !parentId && styles.chipTxtActive]}>
                        Никто
                      </Text>
                    </TouchableOpacity>
                    {members.map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        style={[styles.chip, parentId === m.id && styles.chipActive]}
                        onPress={() => setParentId(m.id)}
                      >
                        <Text style={[styles.chipTxt, parentId === m.id && styles.chipTxtActive]}>
                          {m.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Год рождения */}
              <Text style={styles.label}>Год рождения</Text>
              <TextInput
                style={styles.textInput}
                value={birthYear}
                onChangeText={setBirthYear}
                placeholder="Например: 1990"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                maxLength={4}
              />

              {/* Кнопка отправить */}
              <TouchableOpacity
                style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
                onPress={handleSendInvite}
                disabled={sending}
              >
                {sending
                  ? <ActivityIndicator size="small" color={Colors.white} />
                  : <Text style={styles.sendBtnTxt}>
                      Отправить приглашение {selectedUser.username}
                    </Text>
                }
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title:    { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  resultsList: { maxHeight: 300 },
  noResults:   { color: Colors.textMuted, textAlign: 'center', padding: 20, fontSize: 14 },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  userAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  userAvatarTxt: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  userInfo:      { flex: 1 },
  username:      { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  userRating:    { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  selectedUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  selectedUserName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  label: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', marginBottom: 8 },

  relationsScroll: { marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  chipActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipTxt:       { fontSize: 12, color: Colors.textSecondary },
  chipTxtActive: { color: Colors.white, fontWeight: '600' },

  textInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 20,
  },

  sendBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
  sendBtnTxt:      { color: Colors.white, fontWeight: '700', fontSize: 15 },
});