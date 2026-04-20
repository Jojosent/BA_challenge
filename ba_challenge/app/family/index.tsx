import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { familyService } from '@services/familyService';
import { RELATION_LABELS } from '@/types/index';
import { FamilyTree } from '@components/shared/FamilyTree';
import { FamilyMemberModal } from '@components/shared/FamilyMemberModal';
import { Header } from '@components/shared/Header';
import { useRouter } from 'expo-router';
import { ChallengeCard } from '@components/shared/ChallengeCard';
import { FamilyInvitesBanner } from '@components/shared/FamilyInvitesBanner';
import { challengeService } from '@services/challengeService';
import { InviteFamilyModal } from '@components/shared/InviteFamilyModal';
import { useAuthStore } from '@store/authStore';

type Tab = 'tree' | 'challenges';

const EVENT_EMOJIS = ['📅', '🎂', '💍', '🏠', '✈️', '🎓', '⭐', '❤️', '🕊️', '🌟'];

export default function FamilyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [tab, setTab] = useState<Tab>('tree');
  const [familyChallenges, setFamilyChallenges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMember, setEditMember] = useState<any | null>(null);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [ownFamily, setOwnFamily] = useState<any>(null);
  const [otherFamilies, setOtherFamilies] = useState<any[]>([]);
  const [activeFamilyIdx, setActiveFamilyIdx] = useState<number>(0);
  const [inviteModal, setInviteModal] = useState(false);

  // Для модалки событий (на случай если вернём)
  const [eventModal, setEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventYear, setEventYear] = useState('');
  const [eventEmoji, setEventEmoji] = useState('📅');

  // Все семьи где состоит пользователь
  const allFamilies = ownFamily ? [ownFamily, ...otherFamilies] : otherFamilies;
  const activeFamily = allFamilies[activeFamilyIdx] ?? null;
  const members = activeFamily?.members ?? [];

  // ✅ Является ли пользователь владельцем активной семьи
  const isActiveFamilyOwner = activeFamily?.ownerId === user?.id;

  // const fetchAll = async () => {
  //   try {
  //     setIsLoading(true);
  //     const [familyData, familyChalls] = await Promise.all([
  //       familyService.getAllFamilyMembers(),
  //       challengeService.getFamilyChallenges(),
  //     ]);
  //     setOwnFamily(familyData.ownFamily);
  //     setOtherFamilies(familyData.otherFamilies);
  //     setFamilyChallenges(familyChalls);
  //   } catch (err) {
  //     console.log('Family fetch error:', err);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const fetchAll = async () => {
  try {
    setIsLoading(true);

    const familyData = await familyService.getAllFamilyMembers();
    setOwnFamily(familyData.ownFamily);
    setOtherFamilies(familyData.otherFamilies);

    // ✅ Определяем чью семью показываем
    const allFams = familyData.ownFamily
      ? [familyData.ownFamily, ...familyData.otherFamilies]
      : familyData.otherFamilies;

    const currentFamily = allFams[activeFamilyIdx] ?? familyData.ownFamily;
    const currentOwnerId = currentFamily?.ownerId;

    // ✅ Загружаем челленджи конкретной семьи
    const familyChalls = await challengeService.getFamilyChallenges(currentOwnerId);
    setFamilyChallenges(familyChalls);

  } catch (err) {
    console.log('Family fetch error:', err);
  } finally {
    setIsLoading(false);
  }
};

  // useEffect(() => { fetchAll(); }, []);
  useEffect(() => {
  fetchAll();
}, [activeFamilyIdx]);

  const handleAddMember = async (params: any) => {
    try {
      setModalLoading(true);
      if (editMember) {
        await familyService.updateMember(editMember.id, params);
      } else {
        await familyService.addMember(params);
      }
      await fetchAll();
      setModalVisible(false);
      setEditMember(null);
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteMember = (member: any) => {
    // ✅ Только владелец активной семьи может удалять
    if (!isActiveFamilyOwner) {
      Alert.alert('Нет прав', 'Только создатель семьи может удалять участников');
      return;
    }
    Alert.alert('Удалить?', `Удалить ${member.name} из дерева?`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          await familyService.deleteMember(member.id);
          setSelectedMember(null);
          fetchAll();
        },
      },
    ]);
  };

  const handleAddEvent = async () => {
    if (!eventTitle.trim() || !eventYear) return;
    try {
      await familyService.addEvent({
        title: eventTitle.trim(),
        year: parseInt(eventYear),
        emoji: eventEmoji,
      });
      setEventTitle('');
      setEventYear('');
      setEventEmoji('📅');
      setEventModal(false);
      fetchAll();
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="🌳 Семейное дерево"
        rightElement={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setInviteModal(true)}
          >
            <Ionicons name="person-add-outline" size={20} color={Colors.white} />
          </TouchableOpacity>
        }
      />

      {/* Переключатель семей */}
      {allFamilies.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.familyTabs}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {allFamilies.map((family, idx) => (
            <TouchableOpacity
              key={family.ownerId}
              style={[
                styles.familyTab,
                activeFamilyIdx === idx && styles.familyTabActive,
              ]}
              onPress={() => setActiveFamilyIdx(idx)}
            >
              <Text style={[
                styles.familyTabTxt,
                activeFamilyIdx === idx && styles.familyTabTxtActive,
              ]}>
                {family.isOwn ? '🌳 Моя семья' : `🌳 ${family.ownerName}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Табы */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'tree' && styles.tabActive]}
          onPress={() => setTab('tree')}
        >
          <Text style={[styles.tabTxt, tab === 'tree' && styles.tabTxtActive]}>
            🌳 Дерево
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'challenges' && styles.tabActive]}
          onPress={() => setTab('challenges')}
        >
          <Text style={[styles.tabTxt, tab === 'challenges' && styles.tabTxtActive]}>
            🏆 Челленджи
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── ВАБ ДЕРЕВО ── */}
      {tab === 'tree' && (
        <View style={styles.treeContainer}>
          <FamilyTree members={members} onSelect={setSelectedMember} />

          {/* Карточка выбранного члена */}
          {selectedMember && (
            <View style={styles.selectedCard}>
              <View style={styles.selectedHeader}>
                <View style={styles.selectedLeft}>
                  <Text style={styles.selectedName}>{selectedMember.name}</Text>
                  <Text style={styles.selectedRelation}>
                    {RELATION_LABELS[selectedMember.relation as keyof typeof RELATION_LABELS] ?? selectedMember.relation}
                    {selectedMember.birthYear ? ` · ${selectedMember.birthYear} г.р.` : ''}
                  </Text>
                </View>

                <View style={styles.selectedActions}>
                  {/* ✅ Кнопка редактировать — серая если не владелец */}
                  <TouchableOpacity
                    style={[
                      styles.editMemberBtn,
                      !isActiveFamilyOwner && styles.btnDisabled,
                    ]}
                    onPress={() => {
                      if (!isActiveFamilyOwner) {
                        Alert.alert('Нет прав', 'Только создатель семьи может редактировать');
                        return;
                      }
                      setEditMember(selectedMember);
                      setModalVisible(true);
                    }}
                  >
                    <Ionicons
                      name="pencil"
                      size={15}
                      color={isActiveFamilyOwner ? Colors.primary : Colors.textMuted}
                    />
                  </TouchableOpacity>

                  {/* ✅ Кнопка удалить — серая если не владелец */}
                  <TouchableOpacity
                    style={[
                      styles.deleteMemberBtn,
                      !isActiveFamilyOwner && styles.btnDisabled,
                    ]}
                    onPress={() => handleDeleteMember(selectedMember)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={15}
                      color={isActiveFamilyOwner ? Colors.error : Colors.textMuted}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setSelectedMember(null)}>
                    <Ionicons name="close" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              {selectedMember.bio && (
                <Text style={styles.selectedBio}>{selectedMember.bio}</Text>
              )}

              {/* ✅ Подсказка если не владелец */}
              {!isActiveFamilyOwner && (
                <Text style={styles.readOnlyHint}>
                  🔒 Ты участник этой семьи — только просмотр
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* ── ВАБ ЧЕЛЛЕНДЖИ ── */}
{/* ── ВКЛАДКА ЧЕЛЛЕНДЖИ ── */}
      {tab === 'challenges' && (
        <ScrollView
          contentContainerStyle={styles.challengesContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchAll} tintColor={Colors.primary} />
          }
        >
          {/* Баннер входящих приглашений в семью */}
          <FamilyInvitesBanner onAccepted={fetchAll} />

          {/* ✅ Кнопка создать ТОЛЬКО если активная семья — своя и юзер её владелец */}
          {isActiveFamilyOwner && activeFamily?.isOwn ? (
            <TouchableOpacity
              style={styles.createChallengeBtn}
              onPress={() => router.push('/family/create-challenge')}
            >
              <Text style={styles.createChallengeIcon}>🏆</Text>
              <View style={styles.createChallengeTexts}>
                <Text style={styles.createChallengeTxt}>Создать семейный челлендж</Text>
                <Text style={styles.createChallengeSub}>Виден только членам твоей семьи</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
            </TouchableOpacity>
          ) : (
            /* 👀 Если смотрим чужую семью или не владелец — показываем информацию */
            !isActiveFamilyOwner && (
              <View style={styles.viewOnlyBanner}>
                <Text style={styles.viewOnlyTxt}>
                  👀 Семья {activeFamily?.ownerName || 'партнера'} — только просмотр
                </Text>
              </View>
            )
          )}

          {/* Список семейных челленджей */}
          {familyChallenges.length === 0 ? (
            <View style={styles.emptyTimeline}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyTitle}>Нет семейных челленджей</Text>
              <Text style={styles.emptyText}>
                {isActiveFamilyOwner && activeFamily?.isOwn
                  ? 'Создай первый семейный челлендж!'
                  : 'В этой семье пока нет активных челленджей'}
              </Text>
            </View>
          ) : (
            familyChallenges.map((challenge) => (
              <View key={challenge.id}>
                <View style={styles.challengeMeta}>
                  <View style={styles.creatorDot} />
                  <Text style={styles.challengeMetaTxt}>
                    {challenge.creator?.username ?? 'Неизвестно'} ·{' '}
                    {challenge.familyOwnerId === ownFamily?.ownerId
                      ? 'Твоя семья'
                      : `Семья ${challenge.creator?.username}`}
                  </Text>
                </View>
                <ChallengeCard challenge={challenge} />
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Модалки остаются без изменений внизу */}
      <FamilyMemberModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditMember(null); }}
        onSave={handleAddMember}
        editMember={editMember}
        members={members}
        isLoading={modalLoading}
      />

      <InviteFamilyModal
        visible={inviteModal}
        onClose={() => setInviteModal(false)}
        members={members}
        onInviteSent={() => {
          setInviteModal(false);
          fetchAll();
        }}
      />

      {/* Модалка событий (если понадобится) */}
      {eventModal && (
        <View style={styles.eventModalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.eventModalSheet}>
              <Text style={styles.eventModalTitle}>📅 Новое событие</Text>

              <Text style={styles.label}>Название *</Text>
              <TextInput
                style={styles.eventTextInput}
                value={eventTitle}
                onChangeText={setEventTitle}
                placeholder="Например: Рождение первенца"
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />

              <Text style={styles.label}>Год *</Text>
              <TextInput
                style={styles.eventTextInput}
                value={eventYear}
                onChangeText={setEventYear}
                placeholder="2024"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                maxLength={4}
              />

              <Text style={styles.label}>Эмодзи</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {EVENT_EMOJIS.map((e) => (
                  <TouchableOpacity
                    key={e}
                    style={[styles.emojiBtn, eventEmoji === e && styles.emojiBtnActive]}
                    onPress={() => setEventEmoji(e)}
                  >
                    <Text style={styles.emojiTxt}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.btns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEventModal(false)}>
                  <Text style={styles.cancelTxt}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, (!eventTitle.trim() || !eventYear) && styles.saveBtnDisabled]}
                  onPress={handleAddEvent}
                  disabled={!eventTitle.trim() || !eventYear}
                >
                  <Text style={styles.saveTxt}>Добавить</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  viewOnlyBanner: {
  backgroundColor: Colors.card,
  borderRadius:    10,
  padding:         12,
  marginBottom:    16,
  borderWidth:     1,
  borderColor:     Colors.border,
  alignItems:      'center',
},
viewOnlyTxt: {
  color:      Colors.textSecondary,
  fontSize:   13,
  fontStyle:  'italic',
},
  container: { flex: 1, backgroundColor: Colors.background },

  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 8,
  },

  // Переключатель семей
  familyTabs:         { marginBottom: 8 },
  familyTab: {
    paddingHorizontal: 14,
    paddingVertical:   8,
    backgroundColor:   Colors.surface,
    borderRadius:      20,
    borderWidth:       1,
    borderColor:       Colors.border,
    marginRight:       8,
  },
  familyTabActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  familyTabTxt:       { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  familyTabTxtActive: { color: Colors.white, fontWeight: '700' },

  // Табы дерево / челленджи
  tabs: {
    flexDirection:   'row',
    marginHorizontal: 20,
    marginVertical:  12,
    backgroundColor: Colors.surface,
    borderRadius:    12,
    padding:         4,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  tab:        { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive:  { backgroundColor: Colors.primary },
  tabTxt:     { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  tabTxtActive: { color: Colors.white, fontWeight: '700' },

  // Дерево
  treeContainer: { flex: 1 },

  // Карточка выбранного члена
  selectedCard: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    backgroundColor:   Colors.surface,
    borderTopLeftRadius:  20,
    borderTopRightRadius: 20,
    padding:           20,
    borderTopWidth:    1,
    borderTopColor:    Colors.border,
  },
  selectedHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  selectedLeft:     { flex: 1 },
  selectedName:     { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  selectedRelation: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  selectedActions:  { flexDirection: 'row', gap: 8, alignItems: 'center' },
  selectedBio:      { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },

  // ✅ Кнопки редактировать/удалить
  editMemberBtn: {
    padding:         8,
    borderRadius:    8,
    backgroundColor: Colors.primary + '15',
    borderWidth:     1,
    borderColor:     Colors.primary + '30',
  },
  deleteMemberBtn: {
    padding:         8,
    borderRadius:    8,
    backgroundColor: Colors.error + '15',
    borderWidth:     1,
    borderColor:     Colors.error + '30',
  },
  // ✅ Серый стиль для заблокированных кнопок
  btnDisabled: {
    backgroundColor: Colors.surface,
    borderColor:     Colors.border,
    opacity:         0.5,
  },
  // ✅ Подсказка для не-владельца
  readOnlyHint: {
    fontSize:   12,
    color:      Colors.textMuted,
    marginTop:  8,
    fontStyle:  'italic',
  },

  // Челленджи
  challengesContent: { padding: 20 },
  createChallengeBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            12,
    backgroundColor: Colors.surface,
    borderRadius:   14,
    padding:        16,
    marginBottom:   16,
    borderWidth:    1,
    borderColor:    Colors.primary + '40',
  },
  createChallengeTexts: { flex: 1 },
  createChallengeIcon:  { fontSize: 28 },
  createChallengeTxt:   { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  createChallengeSub:   { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  challengeMeta: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             6,
    marginBottom:    6,
    paddingHorizontal: 4,
  },
  creatorDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  challengeMetaTxt: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },

  // Пустое состояние
  emptyTimeline: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon:     { fontSize: 48, marginBottom: 12 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptyText:     { fontSize: 14, color: Colors.textSecondary },

  // Модалка событий
  eventModalOverlay: {
    position:        'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent:  'flex-end',
  },
  eventModalSheet: {
    backgroundColor:    Colors.surface,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    padding:            24,
    paddingBottom:      40,
  },
  eventModalTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 20 },
  label:           { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', marginBottom: 8 },
  eventTextInput: {
    backgroundColor: Colors.card,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         14,
    fontSize:        15,
    color:           Colors.textPrimary,
    marginBottom:    16,
  },
  emojiBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.card,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  emojiBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '20' },
  emojiTxt:       { fontSize: 22 },

  btns:      { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  cancelTxt: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn:   { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.45 },
  saveTxt:   { color: Colors.white, fontWeight: '700', fontSize: 15 },
});