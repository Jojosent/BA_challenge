import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    RefreshControl, Alert, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@components/shared/Header';
import { Colors } from '@constants/colors';
import { familyService } from '@services/familyService';
import { challengeService } from '@services/challengeService';
import { RELATION_LABELS } from '@/types/index';
import api from '@services/api';

export default function NotificationsScreen() {
    const [familyInvites, setFamilyInvites] = useState<any[]>([]);
    const [challengeInvites, setChallengeInvites] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const fetchAll = async () => {
        try {
            setIsLoading(true);
            const [fi, ci] = await Promise.all([
                familyService.getMyInvites(),
                api.get('/challenges/my-invites').then(r => r.data),
            ]);
            setFamilyInvites(fi);
            setChallengeInvites(ci);
        } catch (e) {
            console.log('Notifications error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

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

    const total = familyInvites.length + challengeInvites.length;

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
                        <Text style={styles.emptyText}>Здесь будут приглашения в семью и челленджи</Text>
                    </View>
                )}

                {/* Приглашения в семью */}
                {familyInvites.length > 0 && (
                    <>
                        <Text style={styles.section}>👨‍👩‍👧 Приглашения в семью</Text>
                        {familyInvites.map((invite) => (
                            <View key={invite.id} style={styles.card}>
                                <View style={styles.cardIcon}>
                                    <Text style={styles.cardIconTxt}>🌳</Text>
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardTitle}>
                                        {invite.sender?.username ?? 'Пользователь'} приглашает тебя
                                    </Text>
                                    <Text style={styles.cardDetail}>
                                        Роль:{' '}
                                        {RELATION_LABELS[invite.relation as keyof typeof RELATION_LABELS] ?? invite.relation}
                                        {invite.birthYear ? ` · ${invite.birthYear} г.р.` : ''}
                                    </Text>
                                </View>
                                <View style={styles.cardBtns}>
                                    <TouchableOpacity
                                        style={styles.rejectBtn}
                                        onPress={() => handleFamilyRespond(invite.id, false)}
                                        disabled={loadingId === `f-${invite.id}`}
                                    >
                                        {loadingId === `f-${invite.id}`
                                            ? <ActivityIndicator size="small" color={Colors.error} />
                                            : <Text style={styles.rejectTxt}>✗</Text>
                                        }
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.acceptBtn}
                                        onPress={() => handleFamilyRespond(invite.id, true)}
                                        disabled={loadingId === `f-${invite.id}`}
                                    >
                                        {loadingId === `f-${invite.id}`
                                            ? <ActivityIndicator size="small" color={Colors.white} />
                                            : <Text style={styles.acceptTxt}>✓</Text>
                                        }
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </>
                )}

                {/* Приглашения в челлендж */}
                {challengeInvites.length > 0 && (
                    <>
                        <Text style={styles.section}>🏆 Приглашения в челлендж</Text>
                        {challengeInvites.map((invite) => (
                            <View key={invite.id} style={styles.card}>
                                <View style={styles.cardIcon}>
                                    <Text style={styles.cardIconTxt}>🏆</Text>
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardTitle}>
                                        {invite.inviteSender?.username ?? 'Пользователь'} приглашает тебя
                                    </Text>
                                    <Text style={styles.cardDetail}>
                                        {invite.challenge?.title ?? 'Челлендж'}
                                        {invite.challenge?.betAmount > 0
                                            ? ` · 🪙 ${invite.challenge.betAmount}`
                                            : ''}
                                    </Text>
                                </View>
                                <View style={styles.cardBtns}>
                                    <TouchableOpacity
                                        style={styles.rejectBtn}
                                        onPress={() => handleChallengeRespond(invite.id, false)}
                                        disabled={loadingId === `c-${invite.id}`}
                                    >
                                        {loadingId === `c-${invite.id}`
                                            ? <ActivityIndicator size="small" color={Colors.error} />
                                            : <Text style={styles.rejectTxt}>✗</Text>
                                        }
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.acceptBtn}
                                        onPress={() => handleChallengeRespond(invite.id, true)}
                                        disabled={loadingId === `c-${invite.id}`}
                                    >
                                        {loadingId === `c-${invite.id}`
                                            ? <ActivityIndicator size="small" color={Colors.white} />
                                            : <Text style={styles.acceptTxt}>✓</Text>
                                        }
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: 20 },

    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
    emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

    section: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 10,
        marginTop: 8,
    },

    card: {
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
    cardIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardIconTxt: { fontSize: 22 },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
    cardDetail: { fontSize: 12, color: Colors.textSecondary },

    cardBtns: { flexDirection: 'row', gap: 8 },
    rejectBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: Colors.error,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rejectTxt: { color: Colors.error, fontWeight: '700', fontSize: 16 },
    acceptBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptTxt: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});