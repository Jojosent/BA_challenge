import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Header } from '@components/shared/Header';
import { familyService } from '@services/familyService';
import { notificationService, AppNotification } from '@services/notificationService';
import { RELATION_LABELS } from '@/types/index';
import api from '@services/api';
import { useTheme } from '@/theme/ThemeContext';
import {
  Trophy,
  Star,
  Pencil,
  Users,
  UserPlus,
  Zap,
  Coins,
  Bell,
  Swords,
} from 'lucide-react-native';

// Статикалық семантикалық accent түстер — темаға байланбайды
const A = {
  new_vote:          { color: '#FFB800' },
  vote_updated:      { color: '#7B61FF' },
  new_participant:   { color: '#32D583' },
  challenge_started: { color: '#FF8A00' },
  challenge_ended:   { color: '#7B61FF' },
  new_bet:           { color: '#00B2FF' },
  bet_joined:        { color: '#FF5C8A' },
  family_invite:     { color: '#7B61FF' },
  challenge_invite:  { color: '#FFB800' },
};

const NOTIF_ICONS: Record<string, any> = {
  new_vote: Star,
  vote_updated: Pencil,
  new_participant: UserPlus,
  challenge_started: Zap,
  challenge_ended: Trophy,
  new_bet: Coins,
  bet_joined: Swords,
  family_invite: Users,
  challenge_invite: Trophy,
};


const formatTime = (iso: string, t: any, locale: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return t('notifications.justNow');
  if (diffMin < 60) return t('notifications.minutesAgoFull', { count: diffMin });
  if (diffH < 24) return t('notifications.hoursAgoFull', { count: diffH });
  if (diffD < 7) return t('notifications.daysAgoFull', { count: diffD });

  const dateLocale =
    locale === 'ru' ? 'ru-RU' :
    locale === 'kz' ? 'kk-KZ' :
    'en-US';

  return d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' });
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();

  const [familyInvites, setFamilyInvites] = useState<any[]>([]);
  const [challengeInvites, setChallengeInvites] = useState<any[]>([]);
  const [inAppNotifs, setInAppNotifs] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);

      const [fi, ci, notifs] = await Promise.all([
        familyService.getMyInvites(),
        api.get('/challenges/my-invites').then(r => r.data),
        notificationService.getAll(50),
      ]);

      setFamilyInvites(fi);
      setChallengeInvites(ci);
      setInAppNotifs(notifs);
    } catch (e) {
      console.log('Notifications error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleFamilyRespond = async (inviteId: number, accept: boolean) => {
    try {
      setLoadingId(`f-${inviteId}`);
      const result = await familyService.respondInvite(inviteId, accept);
      Alert.alert(
        accept ? t('notifications.acceptedTitle') : t('notifications.declinedTitle'),
        result.message
      );
      fetchAll();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleChallengeRespond = async (inviteId: number, accept: boolean) => {
    try {
      setLoadingId(`c-${inviteId}`);
      const result = await api.patch(`/challenges/invites/${inviteId}`, { accept });
      Alert.alert(
        accept ? t('notifications.acceptedTitle') : t('notifications.declinedTitle'),
        result.data.message
      );
      fetchAll();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleNotifPress = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await notificationService.markRead(notif.id);
      setInAppNotifs(prev =>
        prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
      );
    }
    const d = notif.data;
    if (!d) return;
    if (d.challengeId) router.push(`/challenge/${d.challengeId}`);
  };

  const handleNotifDelete = async (id: number) => {
    await notificationService.deleteOne(id);
    setInAppNotifs(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    setInAppNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleClearAll = () => {
    Alert.alert(
      t('notifications.clearTitle'),
      t('notifications.clearMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('notifications.clearButton'),
          style: 'destructive',
          onPress: async () => {
            await notificationService.clearAll();
            setInAppNotifs([]);
          },
        },
      ]
    );
  };

  const unreadCount = inAppNotifs.filter(n => !n.isRead).length;
  const total = familyInvites.length + challengeInvites.length + inAppNotifs.length;

  const renderInAppNotif = (notif: AppNotification) => {
    const accentColor =
      A[notif.type as keyof typeof A]?.color ?? theme.primary;
    const Icon = NOTIF_ICONS[notif.type] ?? Bell;

    return (
      <TouchableOpacity
        key={notif.id}
        style={[
          s.notifCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
          !notif.isRead && {
          borderColor: theme.primary + '50',
            backgroundColor: theme.primary + '08',
          },
        ]}
        onPress={() => handleNotifPress(notif)}
        activeOpacity={0.8}
      >
        {!notif.isRead && (
          <View style={[s.unreadBar, { backgroundColor: accentColor }]} />
        )}

        <View style={[s.notifIcon, { backgroundColor: accentColor + '15' }]}>
          <Icon size={22} color={accentColor} strokeWidth={2.2} />
        </View>

        <View style={s.notifBody}>
          <View style={s.notifTopRow}>
            <Text
              style={[
                s.notifTitle,
                { color: theme.textPrimary },
                !notif.isRead && s.notifTitleBold,
              ]}
            >
              {notif.title}
            </Text>

            {!notif.isRead && (
              <View style={[s.dotBadge, { backgroundColor: accentColor }]} />
            )}
          </View>

          <Text style={[s.notifText, { color: theme.textSecondary }]}>
            {notif.body}
          </Text>

          <Text style={[s.notifTime, { color: theme.textSecondary, opacity: 0.6 }]}>
            {formatTime(notif.createdAt, t, i18n.language)}
          </Text>
        </View>

        <TouchableOpacity
          style={s.deleteNotifBtn}
          onPress={() => handleNotifDelete(notif.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderInviteCard = (invite: any, type: 'family' | 'challenge') => {
    const isFamily = type === 'family';
    const id = invite.id;
    const loadKey = isFamily ? `f-${id}` : `c-${id}`;
    const iconColor = isFamily ? theme.accent : theme.warning;

    return (
      <View
        key={id}
        style={[s.inviteCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View style={[s.inviteIconBox, { backgroundColor: iconColor + '15' }]}>
          {isFamily
            ? <Users size={22} color={iconColor} strokeWidth={2.2} />
            : <Trophy size={22} color={iconColor} strokeWidth={2.2} />
          }
        </View>

        <View style={s.inviteInfo}>
          <Text style={[s.inviteTitle, { color: theme.textPrimary }]}>
            {isFamily
              ? t('notifications.familyInviteTitle', {
                  username: invite.sender?.username ?? t('notifications.userFallback'),
                })
              : t('notifications.challengeInviteTitle', {
                  username: invite.inviteSender?.username ?? t('notifications.userFallback'),
                })}
          </Text>

          <Text style={[s.inviteDetail, { color: theme.textSecondary }]}>
            {isFamily
              ? `${t('notifications.role')}: ${
                  RELATION_LABELS[invite.relation as keyof typeof RELATION_LABELS] ??
                  invite.relation
                }${invite.birthYear ? t('notifications.birthYearShort', { year: invite.birthYear }) : ''}`
              : `${invite.challenge?.title ?? t('notifications.challengeFallback')}${
                  invite.challenge?.betAmount > 0
                    ? t('notifications.coinsAmount', { amount: invite.challenge.betAmount })
                    : ''
                }`}
          </Text>
        </View>

        <View style={s.inviteBtns}>
          <TouchableOpacity
            style={[s.rejectBtn, { borderColor: theme.rose }]}
            onPress={() =>
              isFamily ? handleFamilyRespond(id, false) : handleChallengeRespond(id, false)
            }
            disabled={loadingId === loadKey}
          >
            {loadingId === loadKey
              ? <ActivityIndicator size="small" color={theme.rose} />
              : <Text style={[s.rejectTxt, { color: theme.rose }]}>✗</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.acceptBtn, { backgroundColor: theme.primary }]}
            onPress={() =>
              isFamily ? handleFamilyRespond(id, true) : handleChallengeRespond(id, true)
            }
            disabled={loadingId === loadKey}
          >
            {loadingId === loadKey
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.acceptTxt}>✓</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <Header title={t('notifications.title')} showBack />

      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchAll}
            tintColor={theme.primary}
          />
        }
      >
        {total === 0 && !isLoading && (
          <View style={s.empty}>
            <View
              style={[
                s.emptyIconBox,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Bell size={34} color={theme.textSecondary} strokeWidth={2.1} />
            </View>

            <Text style={[s.emptyTitle, { color: theme.textPrimary }]}>
              {t('notifications.emptyTitle')}
            </Text>

            <Text style={[s.emptyText, { color: theme.textSecondary }]}>
              {t('notifications.emptyText')}
            </Text>
          </View>
        )}

        {familyInvites.length > 0 && (
          <>
            <Text style={[s.section, { color: theme.textPrimary }]}>
              {t('notifications.familyInvites')}
            </Text>
            {familyInvites.map(invite => renderInviteCard(invite, 'family'))}
          </>
        )}

        {challengeInvites.length > 0 && (
          <>
            <Text style={[s.section, { color: theme.textPrimary }]}>
              {t('notifications.challengeInvites')}
            </Text>
            {challengeInvites.map(invite => renderInviteCard(invite, 'challenge'))}
          </>
        )}

        {inAppNotifs.length > 0 && (
          <>
            <View style={s.inAppHeader}>
              <Text style={[s.section, { color: theme.textPrimary, marginBottom: 0, marginTop: 0 }]}>
                {t('notifications.title')}
                {unreadCount > 0 && (
                  <Text style={[s.unreadBadge, { color: theme.primary }]}>
                    {' '}{t('notifications.newCount', { count: unreadCount })}
                  </Text>
                )}
              </Text>

              <View style={s.inAppActions}>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    onPress={handleMarkAllRead}
                    style={[
                      s.actionBtn,
                      {
                        backgroundColor: theme.primary + '18',
                        borderColor: theme.primary + '40',
                      },
                    ]}
                  >
                    <Text style={[s.actionBtnTxt, { color: theme.primary }]}>
                      {t('notifications.markAllRead')}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={handleClearAll}
                  style={[
                    s.clearBtn,
                    {
                      backgroundColor: theme.roseError + '15',
                      borderColor: theme.roseError + '30',
                    },
                  ]}
                >
                  <Ionicons name="trash-outline" size={15} color={theme.roseError} />
                </TouchableOpacity>
              </View>
            </View>

            {inAppNotifs.map(renderInAppNotif)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  section: { fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 8 },
  unreadBadge: { fontWeight: '700' },

  inAppHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 8,
  },
  inAppActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnTxt: { fontSize: 12, fontWeight: '600' },
  clearBtn: { padding: 6, borderRadius: 8, borderWidth: 1 },

  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
  },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 3,
  },
  notifIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  notifBody: { flex: 1 },
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  notifTitle: { fontSize: 14, flex: 1 },
  notifTitleBold: { fontWeight: '700' },
  dotBadge: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  notifText: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: 11 },
  deleteNotifBtn: { padding: 4, flexShrink: 0 },

  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    gap: 12,
  },
  inviteIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteInfo: { flex: 1 },
  inviteTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  inviteDetail: { fontSize: 12 },

  inviteBtns: { flexDirection: 'row', gap: 8 },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectTxt: { fontWeight: '700', fontSize: 16 },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
});