import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    RefreshControl, Alert, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '@components/shared/Header';
import { Colors } from '@constants/colors';
import { familyService } from '@services/familyService';
import { betService } from '@services/betService';
import { RELATION_LABELS } from '@/types/index';
import api from '@services/api';
import { useUserStore } from '@store/userStore';
import { userService } from '@services/userService';
import { useNotificationStore } from '@hooks/useNotifications';

export default function NotificationsScreen() {
    const router = useRouter();
    const { setProfile } = useUserStore();
    const { refresh: refreshGlobalCount } = useNotificationStore();

    const [familyInvites, setFamilyInvites] = useState<any[]>([]);
    const [challengeInvites, setChallengeInvites] = useState<any[]>([]);
    const [pendingBets, setPendingBets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        try {
            setIsLoading(true);
            const [fi, ci, bets] = await Promise.all([
                familyService.getMyInvites(),
                api.get('/challenges/my-invites').then(r => r.data),
                betService.getMy(),
            ]);
            setFamilyInvites(fi);
            setChallengeInvites(ci);
            setPendingBets(bets.filter((b: any) => b.status === 'pending' && b.isTarget));
        } catch (e) {
            console.log('Notifications error:', e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // После любого действия — обновляем и локальный список и глобальный счётчик
    const afterAction = useCallback(() => {
        fetchAll();
        refreshGlobalCount();
    }, [fetchAll, refreshGlobalCount]);

    // ── Семейные приглашения ──────────────────────────────────────
    const handleFamilyRespond = async (inviteId: number, accept: boolean) => {
        try {
            setLoadingId(`f-${inviteId}`);
            const result = await familyService.respondInvite(inviteId, accept);
            Alert.alert(accept ? '✅ Принято!' : '❌ Отклонено', result.message);
            afterAction();
        } catch (e: any) {
            Alert.alert('Ошибка', e.message);
        } finally {
            setLoadingId(null);
        }
    };

    // ── Приглашения в челлендж ────────────────────────────────────
    const handleChallengeRespond = async (inviteId: number, accept: boolean) => {
        try {
            setLoadingId(`c-${inviteId}`);
            const result = await api.patch(`/challenges/invites/${inviteId}`, { accept });
            Alert.alert(accept ? '✅ Принято!' : '❌ Отклонено', result.data.message);
            afterAction();
        } catch (e: any) {
            Alert.alert('Ошибка', e.message);
        } finally {
            setLoadingId(null);
        }
    };

    // ── Ставки ────────────────────────────────────────────────────
    const handleBetRespond = async (bet: any, accept: boolean) => {
        const confirmMsg = accept
            ? `Принять ставку? Спишется ${bet.amount} 🪙. Банк: ${bet.amount * 2} 🪙`
            : 'Отклонить ставку?';

        Alert.alert(
            accept ? '💰 Принять ставку' : '❌ Отклонить',
            confirmMsg,
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: accept ? 'Принять' : 'Отклонить',
                    style: accept ? 'default' : 'destructive',
                    onPress: async () => {
                        try {
                            setLoadingId(`b-${bet.id}`);
                            const result = await betService.respond(bet.id, accept);
                            Alert.alert(accept ? '🔥 Принято!' : '❌ Отклонено', result.message);
                            userService.getProfile().then(p => setProfile(p)).catch(() => {});
                            afterAction();
                        } catch (e: any) {
                            Alert.alert('Ошибка', e.message);
                        } finally {
                            setLoadingId(null);
                        }
                    },
                },
            ]
        );
    };

    const total = familyInvites.length + challengeInvites.length + pendingBets.length;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title="🔔 Уведомления" showBack />

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={afterAction}
                        tintColor={Colors.primary}
                    />
                }
            >
                {/* Счётчик */}
                {total > 0 && (
                    <View style={styles.totalBanner}>
                        <View style={styles.totalLeft}>
                            <View style={styles.totalBadge}>
                                <Text style={styles.totalBadgeTxt}>{total}</Text>
                            </View>
                            <Text style={styles.totalTxt}>
                                {total === 1 ? 'уведомление' : total < 5 ? 'уведомления' : 'уведомлений'}
                            </Text>
                        </View>
                        <Text style={styles.totalSub}>Требуют твоего ответа</Text>
                    </View>
                )}

                {/* Пустое состояние */}
                {total === 0 && !isLoading && (
                    <View style={styles.empty}>
                        <View style={styles.emptyIconWrapper}>
                            <Text style={styles.emptyIcon}>🔕</Text>
                        </View>
                        <Text style={styles.emptyTitle}>Всё спокойно</Text>
                        <Text style={styles.emptyText}>
                            Здесь появятся приглашения в семью, челленджи и ставки
                        </Text>
                    </View>
                )}

                {/* ── Ставки ── */}
                {pendingBets.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.section}>💰 Входящие ставки</Text>
                            <View style={[styles.sectionBadge, {
                                backgroundColor: Colors.rikon + '22',
                                borderColor: Colors.rikon + '60',
                            }]}>
                                <Text style={[styles.sectionBadgeTxt, { color: Colors.rikon }]}>
                                    {pendingBets.length}
                                </Text>
                            </View>
                        </View>

                        {pendingBets.map((bet) => {
                            const isLoadingThis = loadingId === `b-${bet.id}`;
                            return (
                                <View key={bet.id} style={[styles.card, styles.betCard]}>
                                    <View style={[styles.cardIcon, { backgroundColor: Colors.rikon + '20' }]}>
                                        <Text style={styles.cardIconTxt}>💰</Text>
                                    </View>

                                    <View style={styles.cardInfo}>
                                        <Text style={styles.cardTitle}>
                                            {bet.fromUser?.username ?? 'Пользователь'} предлагает ставку
                                        </Text>
                                        <Text style={styles.cardDetail}>
                                            Сумма:{' '}
                                            <Text style={[styles.cardDetailBold, { color: Colors.rikon }]}>
                                                {bet.amount} 🪙
                                            </Text>
                                            {' '}· Банк: {bet.amount * 2} 🪙
                                        </Text>
                                        <Text style={styles.cardDesc} numberOfLines={2}>
                                            {bet.description}
                                        </Text>
                                        <View style={styles.betPredictionRow}>
                                            <Ionicons name="trophy-outline" size={12} color={Colors.rikon} />
                                            <Text style={styles.betPredictionTxt}>
                                                Ставит на победу:{' '}
                                                <Text style={{ color: Colors.rikon, fontWeight: '700' }}>
                                                    {bet.targetUser?.username}
                                                </Text>
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardBtns}>
                                        <TouchableOpacity
                                            style={styles.rejectBtn}
                                            onPress={() => handleBetRespond(bet, false)}
                                            disabled={isLoadingThis}
                                        >
                                            {isLoadingThis
                                                ? <ActivityIndicator size="small" color={Colors.error} />
                                                : <Text style={styles.rejectTxt}>✗</Text>
                                            }
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.acceptBtn}
                                            onPress={() => handleBetRespond(bet, true)}
                                            disabled={isLoadingThis}
                                        >
                                            {isLoadingThis
                                                ? <ActivityIndicator size="small" color={Colors.white} />
                                                : <Text style={styles.acceptTxt}>✓</Text>
                                            }
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </>
                )}

                {/* ── Приглашения в семью ── */}
                {familyInvites.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.section}>👨‍👩‍👧 Приглашения в семью</Text>
                            <View style={[styles.sectionBadge, {
                                backgroundColor: Colors.accent + '22',
                                borderColor: Colors.accent + '60',
                            }]}>
                                <Text style={[styles.sectionBadgeTxt, { color: Colors.accent }]}>
                                    {familyInvites.length}
                                </Text>
                            </View>
                        </View>

                        {familyInvites.map((invite) => {
                            const isLoadingThis = loadingId === `f-${invite.id}`;
                            return (
                                <View key={invite.id} style={styles.card}>
                                    <View style={[styles.cardIcon, { backgroundColor: Colors.accent + '18' }]}>
                                        <Text style={styles.cardIconTxt}>🌳</Text>
                                    </View>
                                    <View style={styles.cardInfo}>
                                        <Text style={styles.cardTitle}>
                                            {invite.sender?.username ?? 'Пользователь'} приглашает тебя
                                        </Text>
                                        <Text style={styles.cardDetail}>
                                            Роль:{' '}
                                            <Text style={styles.cardDetailBold}>
                                                {RELATION_LABELS[invite.relation as keyof typeof RELATION_LABELS] ?? invite.relation}
                                            </Text>
                                            {invite.birthYear ? ` · ${invite.birthYear} г.р.` : ''}
                                        </Text>
                                    </View>
                                    <View style={styles.cardBtns}>
                                        <TouchableOpacity
                                            style={styles.rejectBtn}
                                            onPress={() => handleFamilyRespond(invite.id, false)}
                                            disabled={isLoadingThis}
                                        >
                                            {isLoadingThis
                                                ? <ActivityIndicator size="small" color={Colors.error} />
                                                : <Text style={styles.rejectTxt}>✗</Text>
                                            }
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.acceptBtn}
                                            onPress={() => handleFamilyRespond(invite.id, true)}
                                            disabled={isLoadingThis}
                                        >
                                            {isLoadingThis
                                                ? <ActivityIndicator size="small" color={Colors.white} />
                                                : <Text style={styles.acceptTxt}>✓</Text>
                                            }
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </>
                )}

                {/* ── Приглашения в челлендж ── */}
                {challengeInvites.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.section}>🏆 Приглашения в челлендж</Text>
                            <View style={[styles.sectionBadge, {
                                backgroundColor: Colors.primary + '22',
                                borderColor: Colors.primary + '60',
                            }]}>
                                <Text style={[styles.sectionBadgeTxt, { color: Colors.primary }]}>
                                    {challengeInvites.length}
                                </Text>
                            </View>
                        </View>

                        {challengeInvites.map((invite) => {
                            const isLoadingThis = loadingId === `c-${invite.id}`;
                            return (
                                <View key={invite.id} style={styles.card}>
                                    <View style={[styles.cardIcon, { backgroundColor: Colors.primary + '18' }]}>
                                        <Text style={styles.cardIconTxt}>🏆</Text>
                                    </View>
                                    <View style={styles.cardInfo}>
                                        <Text style={styles.cardTitle}>
                                            {invite.inviteSender?.username ?? 'Пользователь'} приглашает тебя
                                        </Text>
                                        <Text style={styles.cardDetail}>
                                            {invite.challenge?.title ?? 'Челлендж'}
                                        </Text>
                                        {invite.challenge?.betAmount > 0 && (
                                            <Text style={[styles.cardDetail, { color: Colors.rikon }]}>
                                                Ставка: {invite.challenge.betAmount} 🪙
                                            </Text>
                                        )}
                                    </View>
                                    <View style={styles.cardBtns}>
                                        <TouchableOpacity
                                            style={styles.rejectBtn}
                                            onPress={() => handleChallengeRespond(invite.id, false)}
                                            disabled={isLoadingThis}
                                        >
                                            {isLoadingThis
                                                ? <ActivityIndicator size="small" color={Colors.error} />
                                                : <Text style={styles.rejectTxt}>✗</Text>
                                            }
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.acceptBtn}
                                            onPress={() => handleChallengeRespond(invite.id, true)}
                                            disabled={isLoadingThis}
                                        >
                                            {isLoadingThis
                                                ? <ActivityIndicator size="small" color={Colors.white} />
                                                : <Text style={styles.acceptTxt}>✓</Text>
                                            }
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </>
                )}

                {total === 0 && !isLoading && (
                    <TouchableOpacity
                        style={styles.exploreBtn}
                        onPress={() => router.push('/(tabs)/challenges')}
                    >
                        <Ionicons name="trophy-outline" size={18} color={Colors.primary} />
                        <Text style={styles.exploreBtnTxt}>Посмотреть челленджи</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: 20, paddingBottom: 40 },

    totalBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.primary + '15',
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    totalLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    totalBadge: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: Colors.primary,
        justifyContent: 'center', alignItems: 'center',
    },
    totalBadgeTxt: { color: Colors.white, fontWeight: '800', fontSize: 15 },
    totalTxt: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
    totalSub: { fontSize: 12, color: Colors.textSecondary },

    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyIconWrapper: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: Colors.surface,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1, borderColor: Colors.border,
    },
    emptyIcon: { fontSize: 36 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
    emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginBottom: 10, marginTop: 8,
    },
    section: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
    sectionBadge: {
        paddingHorizontal: 8, paddingVertical: 2,
        borderRadius: 10, borderWidth: 1,
    },
    sectionBadgeTxt: { fontSize: 12, fontWeight: '700' },

    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 12,
    },
    betCard: {
        borderColor: Colors.rikon + '30',
    },
    cardIcon: {
        width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center',
        flexShrink: 0,
    },
    cardIconTxt: { fontSize: 22 },
    cardInfo: { flex: 1, gap: 3 },
    cardTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    cardDetail: { fontSize: 12, color: Colors.textSecondary },
    cardDetailBold: { fontWeight: '700', color: Colors.textPrimary },
    cardDesc: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', marginTop: 2 },

    betPredictionRow: {
        flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4,
    },
    betPredictionTxt: { fontSize: 11, color: Colors.textSecondary },

    cardBtns: { flexDirection: 'row', gap: 8, alignItems: 'center', flexShrink: 0 },
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

    exploreBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, marginTop: 24,
        padding: 14, borderRadius: 12,
        borderWidth: 1, borderColor: Colors.primary + '40',
        backgroundColor: Colors.primary + '10',
    },
    exploreBtnTxt: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
});