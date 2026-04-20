import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Colors } from '@constants/colors';
import { familyService } from '@services/familyService';
import { RELATION_LABELS } from '@/types/index';

export const FamilyInvitesBanner: React.FC<{ onAccepted: () => void }> = ({ onAccepted }) => {
    const [invites, setInvites] = useState<any[]>([]);
    const [loading, setLoading] = useState<number | null>(null);

    useEffect(() => {
        familyService.getMyInvites().then(setInvites).catch(console.log);
    }, []);

    const handleRespond = async (inviteId: number, accept: boolean) => {
        try {
            setLoading(inviteId);
            const result = await familyService.respondInvite(inviteId, accept);
            Alert.alert(accept ? '✅ Принято!' : '❌ Отклонено', result.message);
            setInvites((prev) => prev.filter((i) => i.id !== inviteId));
            if (accept) onAccepted();
        } catch (e: any) {
            Alert.alert('Ошибка', e.message);
        } finally {
            setLoading(null);
        }
    };

    if (invites.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🔔 Приглашения в семью ({invites.length})</Text>
            {invites.map((invite) => (
                <View key={invite.id} style={styles.card}>
                    <View style={styles.info}>
                        <Text style={styles.from}>
                            👤 {invite.sender?.username ?? 'Пользователь'}
                        </Text>
                        <Text style={styles.detail}>
                            приглашает тебя как{' '}
                            <Text style={styles.role}>
                                {RELATION_LABELS[invite.relation as keyof typeof RELATION_LABELS] ?? invite.relation}
                            </Text>
                            {invite.birthYear ? ` · ${invite.birthYear} г.р.` : ''}
                        </Text>
                    </View>
                    <View style={styles.btns}>
                        <TouchableOpacity
                            style={styles.rejectBtn}
                            onPress={() => handleRespond(invite.id, false)}
                            disabled={loading === invite.id}
                        >
                            {loading === invite.id
                                ? <ActivityIndicator size="small" color={Colors.error} />
                                : <Text style={styles.rejectTxt}>Отклонить</Text>
                            }
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.acceptBtn}
                            onPress={() => handleRespond(invite.id, true)}
                            disabled={loading === invite.id}
                        >
                            {loading === invite.id
                                ? <ActivityIndicator size="small" color={Colors.white} />
                                : <Text style={styles.acceptTxt}>Принять</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginHorizontal: 20, marginBottom: 16 },
    title: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.primary + '40',
    },
    info: { marginBottom: 12 },
    from: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
    detail: { fontSize: 13, color: Colors.textSecondary },
    role: { color: Colors.primary, fontWeight: '600' },
    btns: { flexDirection: 'row', gap: 10 },
    rejectBtn: {
        flex: 1, padding: 10, borderRadius: 10,
        borderWidth: 1, borderColor: Colors.error,
        alignItems: 'center',
    },
    rejectTxt: { color: Colors.error, fontWeight: '600', fontSize: 13 },
    acceptBtn: {
        flex: 1, padding: 10, borderRadius: 10,
        backgroundColor: Colors.primary, alignItems: 'center',
    },
    acceptTxt: { color: Colors.white, fontWeight: '700', fontSize: 13 },
});