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
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';

type Tab = 'tree' | 'challenges';

const EVENT_EMOJIS = ['📅', '🎂', '💍', '🏠', '✈️', '🎓', '⭐', '❤️', '🕊️', '🌟'];

export default function FamilyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme } = useTheme();

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

  const [eventModal, setEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventYear, setEventYear] = useState('');
  const [eventEmoji, setEventEmoji] = useState('📅');

  const allFamilies = ownFamily ? [ownFamily, ...otherFamilies] : otherFamilies;
  const activeFamily = allFamilies[activeFamilyIdx] ?? null;
  const members = activeFamily?.members ?? [];

  const isActiveFamilyOwner = activeFamily?.ownerId === user?.id;

  const fetchAll = async () => {
    try {
      setIsLoading(true);

      const familyData = await familyService.getAllFamilyMembers();
      setOwnFamily(familyData.ownFamily);
      setOtherFamilies(familyData.otherFamilies);

      const allFams = familyData.ownFamily
        ? [familyData.ownFamily, ...familyData.otherFamilies]
        : familyData.otherFamilies;

      const currentFamily = allFams[activeFamilyIdx] ?? familyData.ownFamily;
      const currentOwnerId = currentFamily?.ownerId;

      const familyChalls = await challengeService.getFamilyChallenges(currentOwnerId);
      setFamilyChallenges(familyChalls);
    } catch (err) {
      console.log('Family fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

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
      Alert.alert(t('common.error'), e.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteMember = (member: any) => {
    if (!isActiveFamilyOwner) {
      Alert.alert(t('family.noPermission'), t('family.onlyOwnerCanDelete'));
      return;
    }
    Alert.alert(
      t('family.deleteMemberTitle'),
      t('family.deleteMemberMessage', { name: member.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await familyService.deleteMember(member.id);
            setSelectedMember(null);
            fetchAll();
          },
        },
      ]
    );
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
      Alert.alert(t('common.error'), e.message);
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <Header
        title={t('family.headerTitle')}
        rightElement={
          isActiveFamilyOwner ? (
            <TouchableOpacity
              style={[s.addBtn, { backgroundColor: theme.primary }]}
              onPress={() => setInviteModal(true)}
            >
              <Ionicons name="person-add-outline" size={20} color="#fff" />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Переключатель семей */}
      <View style={s.familyTabsWrapper}>
        {allFamilies.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.familyTabsContent}
          >
            {allFamilies.map((family, idx) => (
              <TouchableOpacity
                key={family.ownerId}
                style={[
                  s.familyTab,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  activeFamilyIdx === idx && {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  },
                ]}
                onPress={() => setActiveFamilyIdx(idx)}
              >
                <Text
                  style={[
                    s.familyTabTxt,
                    { color: theme.textSecondary },
                    activeFamilyIdx === idx && { color: '#fff', fontWeight: '700' },
                  ]}
                  numberOfLines={1}
                >
                  {family.isOwn
                    ? t('family.myFamily')
                    : t('family.ownerFamily', { name: family.ownerName })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Табы */}
      <View
        style={[
          s.tabs,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <TouchableOpacity
          style={[
            s.tab,
            tab === 'tree' && { backgroundColor: theme.primary },
          ]}
          onPress={() => setTab('tree')}
        >
          <Text
            style={[
              s.tabTxt,
              { color: theme.textSecondary },
              tab === 'tree' && { color: '#fff', fontWeight: '700' },
            ]}
          >
            {t('family.treeTab')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            s.tab,
            tab === 'challenges' && { backgroundColor: theme.primary },
          ]}
          onPress={() => setTab('challenges')}
        >
          <Text
            style={[
              s.tabTxt,
              { color: theme.textSecondary },
              tab === 'challenges' && { color: '#fff', fontWeight: '700' },
            ]}
          >
            {t('family.challengesTab')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── ВКЛАДКА ДЕРЕВО ── */}
      {tab === 'tree' && (
        <View style={s.treeContainer}>
          <FamilyTree members={members} onSelect={setSelectedMember} />

          {selectedMember && (
            <View
              style={[
                s.selectedCard,
                {
                  backgroundColor: theme.surface,
                  borderTopColor: theme.border,
                },
              ]}
            >
              <View style={s.selectedHeader}>
                <View style={s.selectedLeft}>
                  <Text style={[s.selectedName, { color: theme.textPrimary }]}>
                    {selectedMember.name}
                  </Text>
                  <Text style={[s.selectedRelation, { color: theme.textSecondary }]}>
                    {RELATION_LABELS[
                      selectedMember.relation as keyof typeof RELATION_LABELS
                    ] ?? selectedMember.relation}
                    {selectedMember.birthYear
                      ? t('family.birthYearShort', { year: selectedMember.birthYear })
                      : ''}
                  </Text>
                </View>

                <View style={s.selectedActions}>
                  <TouchableOpacity
                    style={[
                      s.editMemberBtn,
                      {
                      backgroundColor: theme.primary + '15',
                        borderColor: theme.primary + '30',
                      },
                      !isActiveFamilyOwner && {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        opacity: 0.5,
                      },
                    ]}
                    onPress={() => {
                      if (!isActiveFamilyOwner) {
                        Alert.alert(
                          t('family.noPermission'),
                          t('family.onlyOwnerCanEdit')
                        );
                        return;
                      }
                      setEditMember(selectedMember);
                      setModalVisible(true);
                    }}
                  >
                    <Ionicons
                      name="pencil"
                      size={15}
                      color={
                        isActiveFamilyOwner
                          ? theme.primary
                          : theme.textSecondary
                      }
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      s.deleteMemberBtn,
                      {
                        backgroundColor: theme.roseError + '15',
                        borderColor: theme.roseError + '30',
                      },
                      !isActiveFamilyOwner && {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        opacity: 0.5,
                      },
                    ]}
                    onPress={() => handleDeleteMember(selectedMember)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={15}
                      color={
                        isActiveFamilyOwner ? theme.rose : theme.textSecondary
                      }
                    />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setSelectedMember(null)}>
                    <Ionicons name="close" size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {selectedMember.bio && (
                <Text style={[s.selectedBio, { color: theme.textSecondary }]}>
                  {selectedMember.bio}
                </Text>
              )}

              {!isActiveFamilyOwner && (
                <Text style={[s.readOnlyHint, { color: theme.textSecondary }]}>
                  {t('family.readOnlyHint')}
                </Text>
              )}
            </View>
          )}

          {!selectedMember && (
            <TouchableOpacity
              style={[
                s.chatBtn,
                {
                  backgroundColor: theme.primary,
                  shadowColor: theme.primary,
                },
              ]}
              onPress={() =>
                router.push(
                  `/chat?roomType=family&roomId=${activeFamily?.ownerId}&title=${encodeURIComponent(
                    activeFamily?.isOwn
                      ? t('family.familyChatTitle')
                      : t('family.ownerFamilyChatTitle', {
                          name: activeFamily?.ownerName,
                        })
                  )}`
                )
              }
            >
              <Ionicons name="chatbubbles" size={20} color="#fff" />
              <Text style={s.chatBtnTxt}>{t('family.familyChat')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── ВКЛАДКА ЧЕЛЛЕНДЖИ ── */}
      {tab === 'challenges' && (
        <ScrollView
          contentContainerStyle={s.challengesContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={fetchAll}
              tintColor={theme.primary}
            />
          }
        >
          <FamilyInvitesBanner onAccepted={fetchAll} />

          {isActiveFamilyOwner && activeFamily?.isOwn ? (
            <TouchableOpacity
              style={[
                s.createChallengeBtn,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.primary + '40',
                },
              ]}
              onPress={() => router.push('/family/create-challenge')}
            >
              <Text style={s.createChallengeIcon}>🏆</Text>
              <View style={s.createChallengeTexts}>
                <Text style={[s.createChallengeTxt, { color: theme.textPrimary }]}>
                  {t('family.createFamilyChallenge')}
                </Text>
                <Text style={[s.createChallengeSub, { color: theme.textSecondary }]}>
                  {t('family.createFamilyChallengeSub')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.primary} />
            </TouchableOpacity>
          ) : (
            !isActiveFamilyOwner && (
              <View
                style={[
                  s.viewOnlyBanner,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[s.viewOnlyTxt, { color: theme.textSecondary }]}>
                  {t('family.viewOnlyFamily', {
                    name: activeFamily?.ownerName || t('family.partner'),
                  })}
                </Text>
              </View>
            )
          )}

          {familyChallenges.length === 0 ? (
            <View style={s.emptyTimeline}>
              <Text style={s.emptyIcon}>🏆</Text>
              <Text style={[s.emptyTitle, { color: theme.textPrimary }]}>
                {t('family.noFamilyChallenges')}
              </Text>
              <Text style={[s.emptyText, { color: theme.textSecondary }]}>
                {isActiveFamilyOwner && activeFamily?.isOwn
                  ? t('family.createFirstFamilyChallenge')
                  : t('family.noActiveFamilyChallenges')}
              </Text>
            </View>
          ) : (
            familyChallenges.map((challenge) => (
              <View key={challenge.id}>
                <View style={s.challengeMeta}>
                  <View style={[s.creatorDot, { backgroundColor: theme.primary }]} />
                  <Text style={[s.challengeMetaTxt, { color: theme.textSecondary }]}>
                    {challenge.creator?.username ?? t('family.unknown')} ·{' '}
                    {challenge.familyOwnerId === ownFamily?.ownerId
                      ? t('family.yourFamily')
                      : t('family.ownerFamilyPlain', {
                          name: challenge.creator?.username,
                        })}
                  </Text>
                </View>
                <ChallengeCard challenge={challenge} />
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Модалки */}
      <FamilyMemberModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditMember(null);
        }}
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

      {eventModal && (
        <View style={s.eventModalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[s.eventModalSheet, { backgroundColor: theme.surface }]}>
              <Text style={[s.eventModalTitle, { color: theme.textPrimary }]}>
                {t('family.newEvent')}
              </Text>

              <Text style={[s.label, { color: theme.textSecondary }]}>
                {t('family.eventNameRequired')}
              </Text>
              <TextInput
                style={[
                  s.eventTextInput,
                  {
                    backgroundColor: theme.bg,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  },
                ]}
                value={eventTitle}
                onChangeText={setEventTitle}
                placeholder={t('family.eventTitlePlaceholder')}
                placeholderTextColor={theme.textSecondary}
                autoFocus
              />

              <Text style={[s.label, { color: theme.textSecondary }]}>
                {t('family.eventYearRequired')}
              </Text>
              <TextInput
                style={[
                  s.eventTextInput,
                  {
                    backgroundColor: theme.bg,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  },
                ]}
                value={eventYear}
                onChangeText={setEventYear}
                placeholder="2024"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                maxLength={4}
              />

              <Text style={[s.label, { color: theme.textSecondary }]}>
                {t('family.emoji')}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 16 }}
              >
                {EVENT_EMOJIS.map((e) => (
                  <TouchableOpacity
                    key={e}
                    style={[
                      s.emojiBtn,
                      { backgroundColor: theme.bg, borderColor: theme.border },
                      eventEmoji === e && {
                        borderColor: theme.primary,
                        backgroundColor: theme.primary + '20',
                      },
                    ]}
                    onPress={() => setEventEmoji(e)}
                  >
                    <Text style={s.emojiTxt}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={s.btns}>
                <TouchableOpacity
                  style={[s.cancelBtn, { borderColor: theme.border }]}
                  onPress={() => setEventModal(false)}
                >
                  <Text style={[s.cancelTxt, { color: theme.textSecondary }]}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    s.saveBtn,
                    { backgroundColor: theme.primary },
                    (!eventTitle.trim() || !eventYear) && s.saveBtnDisabled,
                  ]}
                  onPress={handleAddEvent}
                  disabled={!eventTitle.trim() || !eventYear}
                >
                  <Text style={s.saveTxt}>{t('family.add')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  addBtn: {
    borderRadius: 10,
    padding: 8,
  },

  familyTabsWrapper: {
    height: 48,
    justifyContent: 'center',
  },
  familyTabsContent: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  familyTab: {
    height: 36,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
  },
  familyTabTxt: { fontSize: 13, fontWeight: '500' },

  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 8,
    height: 46,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabTxt: { fontSize: 13, fontWeight: '500' },

  treeContainer: { flex: 1 },

  selectedCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderTopWidth: 1,
  },
  selectedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  selectedLeft: { flex: 1 },
  selectedName: { fontSize: 18, fontWeight: '700' },
  selectedRelation: { fontSize: 13, marginTop: 2 },
  selectedActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  selectedBio: { fontSize: 13, lineHeight: 18 },

  editMemberBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  deleteMemberBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  readOnlyHint: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
    opacity: 0.7,
  },

  chatBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  chatBtnTxt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  viewOnlyBanner: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  viewOnlyTxt: { fontSize: 13, fontStyle: 'italic' },

  challengesContent: { padding: 20 },
  createChallengeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  createChallengeTexts: { flex: 1 },
  createChallengeIcon: { fontSize: 28 },
  createChallengeTxt: { fontSize: 15, fontWeight: '700' },
  createChallengeSub: { fontSize: 12, marginTop: 2 },

  challengeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  creatorDot: { width: 6, height: 6, borderRadius: 3 },
  challengeMetaTxt: { fontSize: 12, fontWeight: '500' },

  emptyTimeline: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyText: { fontSize: 14, textAlign: 'center' },

  // Event modal
  eventModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  eventModalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  eventModalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  eventTextInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
  },
  emojiTxt: { fontSize: 22 },

  btns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelTxt: { fontWeight: '600' },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});