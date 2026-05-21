import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { familyService } from '@services/familyService';
import { RELATION_LABELS } from '@/types/index';
import { useTheme } from '@/theme/ThemeContext';

export const FamilyInvitesBanner: React.FC<{ onAccepted: () => void }> = ({ onAccepted }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();

    const [invites, setInvites] = useState<any[]>([]);
    const [loading, setLoading] = useState<number | null>(null);

    useEffect(() => {
        familyService.getMyInvites().then(setInvites).catch(console.log);
    }, []);

    const handleRespond = async (inviteId: number, accept: boolean) => {
        try {
            setLoading(inviteId);

            const result = await familyService.respondInvite(inviteId, accept);

            Alert.alert(
                accept
                    ? t('familyInvitesBanner.acceptedTitle')
                    : t('familyInvitesBanner.declinedTitle'),
                result.message
            );

            setInvites((prev) => prev.filter((i) => i.id !== inviteId));

            if (accept) onAccepted();
        } catch (e: any) {
            Alert.alert(t('common.error'), e.message);
        } finally {
            setLoading(null);
        }
    };

    if (invites.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
                🔔 {t('familyInvitesBanner.title', { count: invites.length })}
            </Text>

            {invites.map((invite) => (
                <View key={invite.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '40' }]}>
                    <View style={styles.info}>
                        <Text style={[styles.from, { color: theme.textPrimary }]}>
                            👤 {invite.sender?.username ?? t('familyInvitesBanner.userFallback')}
                        </Text>

                        <Text style={[styles.detail, { color: theme.textSecondary }]}>
                            {t('familyInvitesBanner.invitesAs')}{' '}
                            <Text style={[styles.role, { color: theme.primary }]}>
                                {RELATION_LABELS[
                                    invite.relation as keyof typeof RELATION_LABELS
                                ] ?? invite.relation}
                            </Text>
                            {invite.birthYear
                                ? t('familyInvitesBanner.birthYearShort', {
                                      year: invite.birthYear,
                                  })
                                : ''}
                        </Text>
                    </View>

                    <View style={styles.btns}>
                        <TouchableOpacity
                            style={[styles.rejectBtn, { borderColor: theme.rose }]}
                            onPress={() => handleRespond(invite.id, false)}
                            disabled={loading === invite.id}
                        >
                            {loading === invite.id ? (
                                <ActivityIndicator size="small" color={theme.rose} />
                            ) : (
                                <Text style={[styles.rejectTxt, { color: theme.rose }]}>
                                    {t('familyInvitesBanner.decline')}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.acceptBtn, { backgroundColor: theme.primary }]}
                            onPress={() => handleRespond(invite.id, true)}
                            disabled={loading === invite.id}
                        >
                            {loading === invite.id ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Text style={styles.acceptTxt}>
                                    {t('familyInvitesBanner.accept')}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginHorizontal: 20, marginBottom: 16 },

    title: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 10,
    },

    card: {
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
    },

    info: { marginBottom: 12 },

    from: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },

    detail: {
        fontSize: 13,
    },

    role: {
        fontWeight: '600',
    },

    btns: {
        flexDirection: 'row',
        gap: 10,
    },

    rejectBtn: {
        flex: 1,
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
    },

    rejectTxt: {
        fontWeight: '600',
        fontSize: 13,
    },

    acceptBtn: {
        flex: 1,
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
    },

    acceptTxt: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 13,
    },
});