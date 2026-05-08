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
import { Header } from '@components/shared/Header';
import { Colors } from '@constants/colors';
import { familyService } from '@services/familyService';
import { notificationService, AppNotification } from '@services/notificationService';
import { RELATION_LABELS } from '@/types/index';
import api from '@services/api';
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

const NOTIF_CONFIG = {
    new_vote: { icon: Star, color: '#FFB800' },
    vote_updated: { icon: Pencil, color: '#7B61FF' },
    new_participant: { icon: UserPlus, color: '#32D583' },
    challenge_started: { icon: Zap, color: '#FF8A00' },
    challenge_ended: { icon: Trophy, color: '#7B61FF' },
    new_bet: { icon: Coins, color: '#00B2FF' },
    bet_joined: { icon: Swords, color: '#FF5C8A' },
    family_invite: { icon: Users, color: '#7B61FF' },
    challenge_invite: { icon: Trophy, color: '#FFB800' },
};

const formatTime = (iso: string): string => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);

    if (diffMin < 1) return 'только что';
    if (diffMin < 60) return `${diffMin} мин. назад`;
    if (diffH < 24) return `${diffH} ч. назад`;
    if (diffD < 7) return `${diffD} дн. назад`;

    return d.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
    });
};

export default function NotificationsScreen() {
    const router = useRouter();

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
                accept ? 'Принято' : 'Отклонено',
                result.message
            );

            fetchAll();
        } catch (e: any) {
            Alert.alert('Ошибка', e.message);
        } finally {
            setLoadingId(null);
        }
    };

    const handleChallengeRespond = async (inviteId: number, accept: boolean) => {
        try {
            setLoadingId(`c-${inviteId}`);

            const result = await api.patch(`/challenges/invites/${inviteId}`, {
                accept,
            });

            Alert.alert(
                accept ? 'Принято' : 'Отклонено',
                result.data.message
            );

            fetchAll();
        } catch (e: any) {
            Alert.alert('Ошибка', e.message);
        } finally {
            setLoadingId(null);
        }
    };

    const handleNotifPress = async (notif: AppNotification) => {
        if (!notif.isRead) {
            await notificationService.markRead(notif.id);

            setInAppNotifs(prev =>
                prev.map(n =>
                    n.id === notif.id ? { ...n, isRead: true } : n
                )
            );
        }

        const d = notif.data;
        if (!d) return;

        if (d.challengeId) {
            router.push(`/challenge/${d.challengeId}`);
        }
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
            'Очистить уведомления?',
            'Все in-app уведомления будут удалены',
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Очистить',
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
    const total =
        familyInvites.length + challengeInvites.length + inAppNotifs.length;

    const renderInAppNotif = (notif: AppNotification) => {
        const cfg = NOTIF_CONFIG[notif.type as keyof typeof NOTIF_CONFIG] ?? {
            icon: Bell,
            color: Colors.primary,
        };

        const Icon = cfg.icon;

        return (
            <TouchableOpacity
                key={notif.id}
                style={[
                    styles.notifCard,
                    !notif.isRead && styles.notifCardUnread,
                ]}
                onPress={() => handleNotifPress(notif)}
                activeOpacity={0.8}
            >
                {!notif.isRead && (
                    <View
                        style={[
                            styles.unreadBar,
                            { backgroundColor: cfg.color },
                        ]}
                    />
                )}

                <View
                    style={[
                        styles.notifIcon,
                        { backgroundColor: cfg.color + '15' },
                    ]}
                >
                    <Icon
                        size={22}
                        color={cfg.color}
                        strokeWidth={2.2}
                    />
                </View>

                <View style={styles.notifBody}>
                    <View style={styles.notifTopRow}>
                        <Text
                            style={[
                                styles.notifTitle,
                                !notif.isRead && styles.notifTitleBold,
                            ]}
                        >
                            {notif.title}
                        </Text>

                        {!notif.isRead && (
                            <View
                                style={[
                                    styles.dotBadge,
                                    { backgroundColor: cfg.color },
                                ]}
                            />
                        )}
                    </View>

                    <Text style={styles.notifText}>{notif.body}</Text>

                    <Text style={styles.notifTime}>
                        {formatTime(notif.createdAt)}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.deleteNotifBtn}
                    onPress={() => handleNotifDelete(notif.id)}
                    hitSlop={{
                        top: 8,
                        bottom: 8,
                        left: 8,
                        right: 8,
                    }}
                >
                    <Ionicons
                        name="close"
                        size={16}
                        color={Colors.textMuted}
                    />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    const renderInviteCard = (
        invite: any,
        type: 'family' | 'challenge'
    ) => {
        const isFamily = type === 'family';
        const id = invite.id;
        const loadKey = isFamily ? `f-${id}` : `c-${id}`;

        return (
            <View key={id} style={styles.inviteCard}>
                <View
                    style={[
                        styles.inviteIconBox,
                        {
                            backgroundColor: isFamily
                                ? '#7B61FF15'
                                : '#FFB80015',
                        },
                    ]}
                >
                    {isFamily ? (
                        <Users
                            size={22}
                            color="#7B61FF"
                            strokeWidth={2.2}
                        />
                    ) : (
                        <Trophy
                            size={22}
                            color="#FFB800"
                            strokeWidth={2.2}
                        />
                    )}
                </View>

                <View style={styles.inviteInfo}>
                    <Text style={styles.inviteTitle}>
                        {isFamily
                            ? `${invite.sender?.username ?? 'Пользователь'} приглашает тебя`
                            : `${invite.inviteSender?.username ?? 'Пользователь'} приглашает тебя`}
                    </Text>

                    <Text style={styles.inviteDetail}>
                        {isFamily
                            ? `Роль: ${
                                  RELATION_LABELS[
                                      invite.relation as keyof typeof RELATION_LABELS
                                  ] ?? invite.relation
                              }${
                                  invite.birthYear
                                      ? ` · ${invite.birthYear} г.р.`
                                      : ''
                              }`
                            : `${invite.challenge?.title ?? 'Челлендж'}${
                                  invite.challenge?.betAmount > 0
                                      ? ` · ${invite.challenge.betAmount} монет`
                                      : ''
                              }`}
                    </Text>
                </View>

                <View style={styles.inviteBtns}>
                    <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() =>
                            isFamily
                                ? handleFamilyRespond(id, false)
                                : handleChallengeRespond(id, false)
                        }
                        disabled={loadingId === loadKey}
                    >
                        {loadingId === loadKey ? (
                            <ActivityIndicator
                                size="small"
                                color={Colors.error}
                            />
                        ) : (
                            <Text style={styles.rejectTxt}>✗</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() =>
                            isFamily
                                ? handleFamilyRespond(id, true)
                                : handleChallengeRespond(id, true)
                        }
                        disabled={loadingId === loadKey}
                    >
                        {loadingId === loadKey ? (
                            <ActivityIndicator
                                size="small"
                                color={Colors.white}
                            />
                        ) : (
                            <Text style={styles.acceptTxt}>✓</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title="Уведомления" showBack />

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={fetchAll}
                        tintColor={Colors.primary}
                    />
                }
            >
                {total === 0 && !isLoading && (
                    <View style={styles.empty}>
                        <View style={styles.emptyIconBox}>
                            <Bell
                                size={34}
                                color={Colors.textMuted}
                                strokeWidth={2.1}
                            />
                        </View>

                        <Text style={styles.emptyTitle}>
                            Нет уведомлений
                        </Text>

                        <Text style={styles.emptyText}>
                            Здесь будут оценки, ставки, приглашения и события по челленджам
                        </Text>
                    </View>
                )}

                {familyInvites.length > 0 && (
                    <>
                        <Text style={styles.section}>
                            Приглашения в семью
                        </Text>

                        {familyInvites.map(invite =>
                            renderInviteCard(invite, 'family')
                        )}
                    </>
                )}

                {challengeInvites.length > 0 && (
                    <>
                        <Text style={styles.section}>
                            Приглашения в челлендж
                        </Text>

                        {challengeInvites.map(invite =>
                            renderInviteCard(invite, 'challenge')
                        )}
                    </>
                )}

                {inAppNotifs.length > 0 && (
                    <>
                        <View style={styles.inAppHeader}>
                            <Text style={styles.section}>
                                Уведомления
                                {unreadCount > 0 && (
                                    <Text style={styles.unreadBadge}>
                                        {' '}
                                        ({unreadCount} новых)
                                    </Text>
                                )}
                            </Text>

                            <View style={styles.inAppActions}>
                                {unreadCount > 0 && (
                                    <TouchableOpacity
                                        onPress={handleMarkAllRead}
                                        style={styles.actionBtn}
                                    >
                                        <Text style={styles.actionBtnTxt}>
                                            Все прочитаны
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    onPress={handleClearAll}
                                    style={styles.clearBtn}
                                >
                                    <Ionicons
                                        name="trash-outline"
                                        size={15}
                                        color={Colors.error}
                                    />
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    content: {
        padding: 20,
        paddingBottom: 40,
    },

    empty: {
        alignItems: 'center',
        paddingVertical: 60,
    },

    emptyIconBox: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 16,
    },

    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 8,
    },

    emptyText: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },

    section: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 10,
        marginTop: 8,
    },

    unreadBadge: {
        color: Colors.primary,
        fontWeight: '700',
    },

    inAppHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        marginTop: 8,
    },

    inAppActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    actionBtn: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: Colors.primary + '18',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.primary + '40',
    },

    actionBtnTxt: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '600',
    },

    clearBtn: {
        padding: 6,
        backgroundColor: Colors.error + '15',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.error + '30',
    },

    notifCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 12,
        overflow: 'hidden',
    },

    notifCardUnread: {
        borderColor: Colors.primary + '50',
        backgroundColor: Colors.primary + '08',
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

    notifBody: {
        flex: 1,
    },

    notifTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },

    notifTitle: {
        fontSize: 14,
        color: Colors.textPrimary,
        flex: 1,
    },

    notifTitleBold: {
        fontWeight: '700',
    },

    dotBadge: {
        width: 8,
        height: 8,
        borderRadius: 4,
        flexShrink: 0,
    },

    notifText: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
        marginBottom: 4,
    },

    notifTime: {
        fontSize: 11,
        color: Colors.textMuted,
    },

    deleteNotifBtn: {
        padding: 4,
        flexShrink: 0,
    },

    inviteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 12,
    },

    inviteIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },

    inviteInfo: {
        flex: 1,
    },

    inviteTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 2,
    },

    inviteDetail: {
        fontSize: 12,
        color: Colors.textSecondary,
    },

    inviteBtns: {
        flexDirection: 'row',
        gap: 8,
    },

    rejectBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: Colors.error,
        justifyContent: 'center',
        alignItems: 'center',
    },

    rejectTxt: {
        color: Colors.error,
        fontWeight: '700',
        fontSize: 16,
    },

    acceptBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },

    acceptTxt: {
        color: Colors.white,
        fontWeight: '700',
        fontSize: 16,
    },
});