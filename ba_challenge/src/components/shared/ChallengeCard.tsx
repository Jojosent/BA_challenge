import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Challenge } from '@/types/index';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image,
} from 'react-native';

interface ChallengeCardProps {
    challenge: Challenge;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge }) => {
    const router = useRouter();
    const { t } = useTranslation();

    const statusConfig = {
        active: {
            label: t('challengeCard.active'),
            color: Colors.accent,
            icon: '🔥',
        },
        pending: {
            label: t('challengeCard.pending'),
            color: Colors.warning,
            icon: '⏳',
        },
        completed: {
            label: t('challengeCard.completed'),
            color: Colors.primary,
            icon: '🏆',
        },
        cancelled: {
            label: t('challengeCard.cancelled'),
            color: Colors.error,
            icon: '❌',
        },
    };

    const visibilityIcon = {
        secret: '🔒',
        protected: '🛡️',
        public: '🌍',
    };

    const status = statusConfig[challenge.status];

    const daysLeft = () => {
        const end = new Date(challenge.endDate);
        const now = new Date();

        const diff = Math.ceil(
            (end.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if (diff < 0) return t('challengeCard.finished');
        if (diff === 0) return t('challengeCard.lastDay');

        return t('challengeCard.daysLeft', { count: diff });
    };

    const prizePool =
        challenge.prizePool ??
        (challenge.betAmount *
            (challenge.participants?.length ?? 0));

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() =>
                router.push(`/challenge/${challenge.id}`)
            }
            activeOpacity={0.85}
        >
            {/* Верхняя строка */}
            <View style={styles.topRow}>
                <View
                    style={[
                        styles.statusBadge,
                        {
                            backgroundColor:
                                status.color + '22',
                            borderColor: status.color,
                        },
                    ]}
                >
                    <Text style={styles.statusIcon}>
                        {status.icon}
                    </Text>

                    <Text
                        style={[
                            styles.statusText,
                            { color: status.color },
                        ]}
                    >
                        {status.label}
                    </Text>
                </View>

                <Text style={styles.visibilityIcon}>
                    {
                        visibilityIcon[
                            challenge.visibility
                        ]
                    }
                </Text>
            </View>

            {/* Название */}
            <Text
                style={styles.title}
                numberOfLines={2}
            >
                {challenge.title}
            </Text>

            <Text
                style={styles.description}
                numberOfLines={2}
            >
                {challenge.description}
            </Text>

            {/* Нижняя строка */}
            <View style={styles.bottomRow}>
                {challenge.creator && (
                    <View style={styles.creatorRow}>
                        {/* Аватар создателя */}
                        <View style={styles.creatorAvatar}>
                            {(challenge.creator as any)
                                .avatarUrl ? (
                                <Image
                                    source={{
                                        uri: (
                                            challenge.creator as any
                                        ).avatarUrl,
                                    }}
                                    style={
                                        styles.creatorAvatarImage
                                    }
                                    resizeMode="cover"
                                />
                            ) : (
                                <Text
                                    style={
                                        styles.creatorAvatarText
                                    }
                                >
                                    {challenge.creator.username
                                        ?.charAt(0)
                                        .toUpperCase()}
                                </Text>
                            )}
                        </View>

                        <Text style={styles.infoText}>
                            {challenge.creator.username}
                        </Text>
                    </View>
                )}

                <View style={styles.infoItem}>
                    <Ionicons
                        name="people-outline"
                        size={14}
                        color={Colors.textSecondary}
                    />

                    <Text style={styles.infoText}>
                        {t(
                            'challengeCard.participants',
                            {
                                count:
                                    challenge.participants
                                        ?.length ?? 0,
                            }
                        )}
                    </Text>
                </View>

                <View style={styles.infoItem}>
                    <Ionicons
                        name="time-outline"
                        size={14}
                        color={Colors.textSecondary}
                    />

                    <Text style={styles.infoText}>
                        {daysLeft()}
                    </Text>
                </View>

                {challenge.betAmount > 0 && (
                    <View style={styles.prizeItem}>
                        <Text style={styles.prizeCoin}>
                            🏆
                        </Text>

                        <Text style={styles.prizeText}>
                            {prizePool} 🪙
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

    statusIcon: {
        fontSize: 11,
    },

    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },

    visibilityIcon: {
        fontSize: 18,
    },

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
        gap: 10,
        flexWrap: 'wrap',
        alignItems: 'center',
    },

    // Создатель с аватаркой
    creatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    creatorAvatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },

    creatorAvatarImage: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },

    creatorAvatarText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: '700',
    },

    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },

    infoText: {
        fontSize: 12,
        color: Colors.textSecondary,
    },

    prizeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.rikon + '18',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.rikon + '40',
    },

    prizeCoin: {
        fontSize: 11,
    },

    prizeText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.rikon,
    },
});