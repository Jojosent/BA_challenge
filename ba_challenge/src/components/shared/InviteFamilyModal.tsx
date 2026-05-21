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
import { useTranslation } from 'react-i18next';
import { familyService } from '@services/familyService';
import { FamilyMember, RELATION_LABELS, Relation } from '@/types/index';
import { useTheme } from '@/theme/ThemeContext';

const RELATIONS = Object.keys(RELATION_LABELS) as Relation[];

interface InviteFamilyModalProps {
  visible: boolean;
  onClose: () => void;
  members: FamilyMember[];
  onInviteSent: () => void;
}

export const InviteFamilyModal: React.FC<InviteFamilyModalProps> = ({
  visible,
  onClose,
  members,
  onInviteSent,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [step, setStep] = useState<1 | 2>(1);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [relation, setRelation] = useState<Relation>('other');
  const [parentId, setParentId] = useState<number | undefined>(undefined);
  const [birthYear, setBirthYear] = useState('');
  const [sending, setSending] = useState(false);

  const handleSearch = async (text: string) => {
    setQuery(text);

    if (text.trim().length < 2) {
      setResults([]);
      return;
    }

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
        toUserId: selectedUser.id,
        relation,
        parentId,
        birthYear: birthYear ? parseInt(birthYear, 10) : undefined,
      });

      Alert.alert(
        t('inviteFamilyModal.inviteSentTitle'),
        t('inviteFamilyModal.inviteSentMessage', {
          username: selectedUser.username,
        })
      );

      onInviteSent();
      handleClose();
    } catch (e: any) {
      Alert.alert(t('inviteFamilyModal.error'), e.message);
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
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          {step === 1 && (
            <>
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.textPrimary }]}>
                  {t('inviteFamilyModal.inviteToFamily')}
                </Text>

                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={22} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {t('inviteFamilyModal.findUserByName')}
              </Text>

              <View style={[styles.searchRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="search-outline" size={18} color={theme.textMuted} />

                <TextInput
                  style={[styles.searchInput, { color: theme.textPrimary }]}
                  value={query}
                  onChangeText={handleSearch}
                  placeholder={t('inviteFamilyModal.usernamePlaceholder')}
                  placeholderTextColor={theme.textMuted}
                  autoFocus
                />

                {searching && <ActivityIndicator size="small" color={theme.primary} />}
              </View>

              <FlatList
                data={results}
                keyExtractor={(item) => String(item.id)}
                style={styles.resultsList}
                ListEmptyComponent={
                  query.length >= 2 && !searching ? (
                    <Text style={[styles.noResults, { color: theme.textMuted }]}>
                      {t('inviteFamilyModal.usersNotFound')}
                    </Text>
                  ) : null
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.userRow, { borderBottomColor: theme.border }]}
                    onPress={() => handleSelectUser(item)}
                  >
                    <View style={[styles.userAvatar, { backgroundColor: theme.primary }]}>
                      <Text style={styles.userAvatarTxt}>
                        {item.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.userInfo}>
                      <Text style={[styles.username, { color: theme.textPrimary }]}>{item.username}</Text>

                      <Text style={[styles.userRating, { color: theme.textMuted }]}>
                        {t('inviteFamilyModal.rating', {
                          rating: item.rating,
                        })}
                      </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                  </TouchableOpacity>
                )}
              />
            </>
          )}

          {step === 2 && selectedUser && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => setStep(1)}>
                  <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
                </TouchableOpacity>

                <Text style={[styles.title, { color: theme.textPrimary }]}>
                  {t('inviteFamilyModal.setupRole')}
                </Text>

                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={22} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={[styles.selectedUserCard, { backgroundColor: theme.card, borderColor: theme.primary + '40' }]}>
                <View style={[styles.userAvatar, { backgroundColor: theme.primary }]}>
                  <Text style={styles.userAvatarTxt}>
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <Text style={[styles.selectedUserName, { color: theme.textPrimary }]}>
                  {selectedUser.username}
                </Text>
              </View>

              <Text style={[styles.label, { color: theme.textSecondary }]}>
                {t('inviteFamilyModal.relationQuestion')}
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.relationsScroll}
              >
                {RELATIONS.filter((r) => r !== 'self').map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.chip, { backgroundColor: theme.card, borderColor: theme.border }, relation === r && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    onPress={() => setRelation(r)}
                  >
                    <Text
                      style={[
                        styles.chipTxt,
                        { color: theme.textSecondary },
                        relation === r && { color: '#ffffff', fontWeight: '600' },
                      ]}
                    >
                      {RELATION_LABELS[r]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {members.length > 0 && (
                <>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>
                    {t('inviteFamilyModal.connectedWith')}
                  </Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.relationsScroll}
                  >
                    <TouchableOpacity
                      style={[styles.chip, { backgroundColor: theme.card, borderColor: theme.border }, !parentId && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                      onPress={() => setParentId(undefined)}
                    >
                      <Text
                        style={[
                          styles.chipTxt,
                          { color: theme.textSecondary },
                          !parentId && { color: '#ffffff', fontWeight: '600' },
                        ]}
                      >
                        {t('inviteFamilyModal.nobody')}
                      </Text>
                    </TouchableOpacity>

                    {members.map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        style={[styles.chip, { backgroundColor: theme.card, borderColor: theme.border }, parentId === m.id && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                        onPress={() => setParentId(m.id)}
                      >
                        <Text
                          style={[
                            styles.chipTxt,
                            { color: theme.textSecondary },
                            parentId === m.id && { color: '#ffffff', fontWeight: '600' },
                          ]}
                        >
                          {m.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <Text style={[styles.label, { color: theme.textSecondary }]}>
                {t('inviteFamilyModal.birthYear')}
              </Text>

              <TextInput
                style={[styles.textInput, { backgroundColor: theme.card, borderColor: theme.border, color: theme.textPrimary }]}
                value={birthYear}
                onChangeText={setBirthYear}
                placeholder={t('inviteFamilyModal.birthYearPlaceholder')}
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                maxLength={4}
              />

              <TouchableOpacity
                style={[styles.sendBtn, sending && styles.sendBtnDisabled, { backgroundColor: theme.primary }]}
                onPress={handleSendInvite}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.sendBtnTxt}>
                    {t('inviteFamilyModal.sendInvite', {
                      username: selectedUser.username,
                    })}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },

  sheet: {
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

  title: {
    fontSize: 18,
    fontWeight: '700',
  },

  subtitle: {
    fontSize: 13,
    marginBottom: 16,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },

  resultsList: {
    maxHeight: 300,
  },

  noResults: {
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
  },

  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  userAvatarTxt: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },

  userInfo: {
    flex: 1,
  },

  username: {
    fontSize: 15,
    fontWeight: '600',
  },

  userRating: {
    fontSize: 12,
    marginTop: 2,
  },

  selectedUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
  },

  selectedUserName: {
    fontSize: 16,
    fontWeight: '700',
  },

  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },

  relationsScroll: {
    marginBottom: 16,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },

  chipActive: {},

  chipTxt: {
    fontSize: 12,
  },

  chipTxtActive: {},

  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    marginBottom: 20,
  },

  sendBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },

  sendBtnDisabled: {
    opacity: 0.45,
  },

  sendBtnTxt: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});