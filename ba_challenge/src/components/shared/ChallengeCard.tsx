import { Colors } from '@constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Challenge } from '@/types/index';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ChallengeCardProps {
    challenge: Challenge;
}

const statusConfig = {
    active: { label: 'Активен', color: Colors.accent, icon: '🔥' },
    pending: { label: 'Ожидание', color: Colors.warning, icon: '⏳' },
    completed: { label: 'Завершён', color: Colors.primary, icon: '🏆' },
    cancelled: { label: 'Отменён', color: Colors.error, icon: '❌' },
};

const visibilityIcon = {
    secret: '🔒',
    protected: '🛡️',
    public: '🌍',
};

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge }) => {
    const router = useRouter();
    const status = statusConfig[challenge.status];

    const daysLeft = () => {
        const end = new Date(challenge.endDate);
        const now = new Date();
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return 'Завершён';
        if (diff === 0) return 'Последний день!';
        return `${diff} дн. осталось`;
    };

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/challenge/${challenge.id}`)}
            activeOpacity={0.85}
        >
            {/* Верхняя строка */}
            <View style={styles.topRow}>
                <View style={[styles.statusBadge, { backgroundColor: status.color + '22', borderColor: status.color }]}>
                    <Text style={styles.statusIcon}>{status.icon}</Text>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
                <Text style={styles.visibilityIcon}>
                    {visibilityIcon[challenge.visibility]}
                </Text>
            </View>

            {/* Название */}
            <Text style={styles.title} numberOfLines={2}>{challenge.title}</Text>
            <Text style={styles.description} numberOfLines={2}>
                {challenge.description}
            </Text>

            {/* Нижняя строка */}
            {/* Нижняя строка */}
            <View style={styles.bottomRow}>
                {/* ✅ Создатель */}
                {challenge.creator && (
                    <View style={styles.infoItem}>
                        <Ionicons name="person-outline" size={13} color={Colors.textSecondary} />
                        <Text style={styles.infoText}>{challenge.creator.username}</Text>
                    </View>
                )}

                <View style={styles.infoItem}>
                    <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.infoText}>
                        {challenge.participants?.length ?? 0} участников
                    </Text>
                </View>

                <View style={styles.infoItem}>
                    <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.infoText}>{daysLeft()}</Text>
                </View>

                {challenge.betAmount > 0 && (
                    <View style={styles.infoItem}>
                        <Text style={styles.coinIcon}>🪙</Text>
                        <Text style={[styles.infoText, { color: Colors.rikon }]}>
                            {challenge.betAmount}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        gap: 4,
    },
    statusIcon: { fontSize: 11 },
    statusText: { fontSize: 12, fontWeight: '600' },
    visibilityIcon: { fontSize: 18 },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 6,
    },
    description: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
        marginBottom: 12,
    },
    bottomRow: {
        flexDirection: 'row',
        gap: 14,
        flexWrap: 'wrap',
    },
    infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    infoText: { fontSize: 12, color: Colors.textSecondary },
    coinIcon: { fontSize: 12 },
});