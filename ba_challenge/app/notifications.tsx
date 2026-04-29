import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    RefreshControl, Alert, TouchableOpacity, ActivityIndicator,
    SectionList,
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

// ── Конфиг иконок и цветов по типу уведомления ────────────────────────────
const NOTIF_CONFIG: Record<string, { icon: string; color: string; emoji: string }> = {
    new_vote: { icon: 'star', color: Colors.rikon, emoji: '⭐' },
    vote_updated: { icon: 'pencil', color: Colors.warning, emoji: '✏️' },
    new_participant: { icon: 'person-add', color: Colors.accent, emoji: '🎉' },
    challenge_started: { icon: 'flash', color: Colors.primary, emoji: '🔥' },
    challenge_ended: { icon: 'trophy', color: Colors.rikon, emoji: '🏆' },
    new_bet: { icon: 'cash', color: Colors.secondary, emoji: '🎯' },
    bet_joined: { icon: 'swap-horizontal', color: Colors.accent, emoji: '⚔️' },
    family_invite: { icon: 'people', color: Colors.primary, emoji: '🌳' },
    challenge_invite: { icon: 'trophy-outline', color: Colors.primary, emoji: '🏆' },
};

// ── Форматирование времени ─────────────────────────────────────────────────
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
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

// ── Разделение по секциям ──────────────────────────────────────────────────
interface SectionData {
    title: string;
    data: any[];
    type: 'invites_family' | 'invites_challenge' | 'inapp';
}

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

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Инвайты — принять/отклонить ────────────────────────────────────────
    const handleFamilyRespond = async (inviteId: number, accept: boolean) => {
        try {
            setLoadingId(`f-${inviteId}`);
            const result = await familyService.respondInvite(inviteId, accept);
            Alert.alert(accept ? '✅ Принято!' : '❌ Отклонено', result.message);
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
            const result = await api.patch(`/challenges/invites/${inviteId}`, { accept });
            Alert.alert(accept ? '✅ Принято!' : '❌ Отклонено', result.data.message);
            fetchAll();
        } catch (e: any) {
            Alert.alert('Ошибка', e.message);
        } finally {
            setLoadingId(null);
        }
    };

    // ── In-app уведомление — прочитать и перейти ───────────────────────────
    const handleNotifPress = async (notif: AppNotification) => {
        if (!notif.isRead) {
            await notificationService.markRead(notif.id);
            setInAppNotifs(prev =>
                prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
            );
        }

        // Навигация по типу
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
        Alert.alert('Очистить уведомления?', 'Все in-app уведомления будут удалены', [
            { text: 'Отмена', style: 'cancel' },
            {
                text: 'Очистить',
                style: 'destructive',
                onPress: async () => {
                    await notificationService.clearAll();
                    setInAppNotifs([]);
                },
            },
        ]);
    };

    const unreadCount = inAppNotifs.filter(n => !n.isRead).length;
    const total = familyInvites.length + challengeInvites.length + inAppNotifs.length;

    // ── Рендер in-app уведомления ──────────────────────────────────────────
    const renderInAppNotif = (notif: AppNotification) => {
        const cfg = NOTIF_CONFIG[notif.type] ?? { emoji: '🔔', color: Colors.primary };

        return (
            <TouchableOpacity
                key={notif.id}
                style={[styles.notifCard, !notif.isRead && styles.notifCardUnread]}
                onPress={() => handleNotifPress(notif)}
                activeOpacity={0.8}
            >
                {/* Цветная полоска слева у непрочитанных */}
                {!notif.isRead && <View style={[styles.unreadBar, { backgroundColor: cfg.color }]} />}

                <View style={[styles.notifIcon, { backgroundColor: cfg.color + '22' }]}>
                    <Text style={styles.notifEmoji}>{cfg.emoji}</Text>
                </View>

                <View style={styles.notifBody}>
                    <View style={styles.notifTopRow}>
                        <Text style={[styles.notifTitle, !notif.isRead && styles.notifTitleBold]}>
                            {notif.title}
                        </Text>
                        {!notif.isRead && <View style={[styles.dotBadge, { backgroundColor: cfg.color }]} />}
                    </View>
                    <Text style={styles.notifText}>{notif.body}</Text>
                    <Text style={styles.notifTime}>{formatTime(notif.createdAt)}</Text>
                </View>

                <TouchableOpacity
                    style={styles.deleteNotifBtn}
                    onPress={() => handleNotifDelete(notif.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="close" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    // ── Рендер карточки инвайта ────────────────────────────────────────────
    const renderInviteCard = (invite: any, type: 'family' | 'challenge') => {
        const isFamily = type === 'family';
        const id = invite.id;
        const loadKey = isFamily ? `f-${id}` : `c-${id}`;

        return (
            <View key={id} style={styles.inviteCard}>
                <View style={[styles.inviteIconBox, { backgroundColor: isFamily ? Colors.primary + '20' : Colors.accent + '20' }]}>
                    <Text style={styles.inviteEmoji}>{isFamily ? '🌳' : '🏆'}</Text>
                </View>
                <View style={styles.inviteInfo}>
                    <Text style={styles.inviteTitle}>
                        {isFamily
                            ? `${invite.sender?.username ?? 'Пользователь'} приглашает тебя`
                            : `${invite.inviteSender?.username ?? 'Пользователь'} приглашает тебя`
                        }
                    </Text>
                    <Text style={styles.inviteDetail}>
                        {isFamily
                            ? `Роль: ${RELATION_LABELS[invite.relation as keyof typeof RELATION_LABELS] ?? invite.relation}${invite.birthYear ? ` · ${invite.birthYear} г.р.` : ''}`
                            : `${invite.challenge?.title ?? 'Челлендж'}${invite.challenge?.betAmount > 0 ? ` · 🪙 ${invite.challenge.betAmount}` : ''}`
                        }
                    </Text>
                </View>
                <View style={styles.inviteBtns}>
                    <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => isFamily ? handleFamilyRespond(id, false) : handleChallengeRespond(id, false)}
                        disabled={loadingId === loadKey}
                    >
                        {loadingId === loadKey
                            ? <ActivityIndicator size="small" color={Colors.error} />
                            : <Text style={styles.rejectTxt}>✗</Text>
                        }
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => isFamily ? handleFamilyRespond(id, true) : handleChallengeRespond(id, true)}
                        disabled={loadingId === loadKey}
                    >
                        {loadingId === loadKey
                            ? <ActivityIndicator size="small" color={Colors.white} />
                            : <Text style={styles.acceptTxt}>✓</Text>
                        }
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title="🔔 Уведомления" showBack />

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={fetchAll} tintColor={Colors.primary} />
                }
            >
                {total === 0 && !isLoading && (
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>🔕</Text>
                        <Text style={styles.emptyTitle}>Нет уведомлений</Text>
                        <Text style={styles.emptyText}>Здесь будут оценки, ставки, приглашения и события по челленджам</Text>
                    </View>
                )}

                {/* ── Инвайты в семью ─────────────────────────────────────── */}
                {familyInvites.length > 0 && (
                    <>
                        <Text style={styles.section}>👨‍👩‍👧 Приглашения в семью</Text>
                        {familyInvites.map(invite => renderInviteCard(invite, 'family'))}
                    </>
                )}

                {/* ── Инвайты в челлендж ──────────────────────────────────── */}
                {challengeInvites.length > 0 && (
                    <>
                        <Text style={styles.section}>🏆 Приглашения в челлендж</Text>
                        {challengeInvites.map(invite => renderInviteCard(invite, 'challenge'))}
                    </>
                )}

                {/* ── In-app уведомления ──────────────────────────────────── */}
                {inAppNotifs.length > 0 && (
                    <>
                        <View style={styles.inAppHeader}>
                            <Text style={styles.section}>
                                🔔 Уведомления
                                {unreadCount > 0 && (
                                    <Text style={styles.unreadBadge}> ({unreadCount} новых)</Text>
                                )}
                            </Text>
                            <View style={styles.inAppActions}>
                                {unreadCount > 0 && (
                                    <TouchableOpacity onPress={handleMarkAllRead} style={styles.actionBtn}>
                                        <Text style={styles.actionBtnTxt}>Все прочитаны</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
                                    <Ionicons name="trash-outline" size={15} color={Colors.error} />
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
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: 20, paddingBottom: 40 },

    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
    emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

    section: {
        fontSize: 16, fontWeight: '700',
        color: Colors.textPrimary, marginBottom: 10, marginTop: 8,
    },
    unreadBadge: { color: Colors.primary, fontWeight: '700' },

    // Хедер секции in-app
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
        backgroundColor: Colors.primary + '18',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.primary + '40',
    },
    actionBtnTxt: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
    clearBtn: {
        padding: 6,
        backgroundColor: Colors.error + '15',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.error + '30',
    },

    // In-app карточка уведомления
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
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    notifEmoji: { fontSize: 22 },

    notifBody: { flex: 1 },
    notifTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    notifTitle: { fontSize: 14, color: Colors.textPrimary, flex: 1 },
    notifTitleBold: { fontWeight: '700' },
    dotBadge: {
        width: 8,
        height: 8,
        borderRadius: 4,
        flexShrink: 0,
    },
    notifText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 4 },
    notifTime: { fontSize: 11, color: Colors.textMuted },

    deleteNotifBtn: { padding: 4, flexShrink: 0 },

    // Карточка инвайта
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
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inviteEmoji: { fontSize: 22 },
    inviteInfo: { flex: 1 },
    inviteTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
    inviteDetail: { fontSize: 12, color: Colors.textSecondary },

    inviteBtns: { flexDirection: 'row', gap: 8 },
    rejectBtn: {
        width: 36, height: 36, borderRadius: 18,
        borderWidth: 1, borderColor: Colors.error,
        justifyContent: 'center', alignItems: 'center',
    },
    rejectTxt: { color: Colors.error, fontWeight: '700', fontSize: 16 },
    acceptBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: Colors.primary,
        justifyContent: 'center', alignItems: 'center',
    },
    acceptTxt: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});