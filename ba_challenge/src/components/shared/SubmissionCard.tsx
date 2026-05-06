import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { Submission } from '@/types/index';
import { StarRating } from '@components/shared/StarRating';
import { aiService } from '@services/aiService';
import { useAuthStore } from '@store/authStore';
import { useUserStore } from '@/store/userStore';
import { userService } from '@/services/userService';
import { voteService } from '@/services/voteService';
import * as SecureStore from 'expo-secure-store';
import { Config } from '@constants/config';

interface SubmissionCardProps {
    submission: Submission;
}

// ─── Хук для загрузки защищённого медиа с токеном ───────────
const useProtectedMedia = (mediaUrl: string, mediaType: 'photo' | 'video') => {
    const [dataUri, setDataUri] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        // Загружаем только фото — видео пока показываем плейсхолдер
        if (mediaType !== 'photo' || !mediaUrl) return;

        let cancelled = false;

        const loadImage = async () => {
            try {
                setIsLoading(true);
                setError(false);

                const token = await SecureStore.getItemAsync(Config.TOKEN_KEY);

                // Если URL — защищённый endpoint (содержит /api/submissions/)
                // загружаем с токеном
                if (mediaUrl.includes('/api/submissions/') && token) {
                    const response = await fetch(mediaUrl, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    // Конвертируем blob в base64
                    const blob = await response.blob();
                    const base64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = () => reject(new Error('FileReader error'));
                        reader.readAsDataURL(blob);
                    });

                    if (!cancelled) {
                        setDataUri(base64);
                    }
                } else {
                    // Старый формат — прямой URL, используем как есть
                    if (!cancelled) {
                        setDataUri(mediaUrl);
                    }
                }
            } catch (e: any) {
                console.log('❌ Ошибка загрузки медиа:', e.message);
                if (!cancelled) setError(true);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        loadImage();

        return () => { cancelled = true; };
    }, [mediaUrl, mediaType]);

    return { dataUri, isLoading, error };
};

// ─── Компонент медиа ─────────────────────────────────────────
const ProtectedMedia: React.FC<{
    mediaUrl: string;
    mediaType: 'photo' | 'video';
}> = ({ mediaUrl, mediaType }) => {
    const { dataUri, isLoading, error } = useProtectedMedia(mediaUrl, mediaType);

    if (mediaType === 'video') {
        return (
            <View style={styles.videoPlaceholder}>
                <Ionicons name="play-circle" size={52} color={Colors.white} />
                <Text style={styles.videoText}>Видео доказательство</Text>
            </View>
        );
    }

    if (isLoading) {
        return (
            <View style={styles.mediaLoading}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.mediaLoadingText}>Загрузка фото...</Text>
            </View>
        );
    }

    if (error || !dataUri) {
        return (
            <View style={styles.mediaError}>
                <Ionicons name="image-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.mediaErrorText}>Не удалось загрузить фото</Text>
            </View>
        );
    }

    return (
        <Image
            source={{ uri: dataUri }}
            style={styles.media}
            resizeMode="cover"
        />
    );
};

// ─── Основной компонент ──────────────────────────────────────
export const SubmissionCard: React.FC<SubmissionCardProps> = ({ submission }) => {
    const { user } = useAuthStore();
    const [currentScore, setCurrentScore] = useState(submission.score);
    const [aiScore, setAiScore] = useState(submission.aiScore);
    const [aiComment, setAiComment] = useState(submission.aiComment);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [showVoting, setShowVoting] = useState(false);

    const [receivedVotes, setReceivedVotes] = useState<any[]>([]);
    const [votesLoaded, setVotesLoaded] = useState(false);
    const [showMyVotes, setShowMyVotes] = useState(false);

    const loadMyVotes = async () => {
        if (votesLoaded) {
            setShowMyVotes(!showMyVotes);
            return;
        }
        try {
            const data = await voteService.getVotesBySubmission(submission.id);
            setReceivedVotes(data.votes);
            setVotesLoaded(true);
            setShowMyVotes(true);
        } catch (e) {
            console.log('Ошибка загрузки голосов:', e);
        }
    };

    const isOwner = user?.id === submission.userId;

    const date = new Date(submission.createdAt).toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit',
    });

    const handleAIEvaluate = async () => {
        try {
            setIsEvaluating(true);
            const result = await aiService.evaluateSubmission(submission.id);
            setAiScore(result.score);
            setAiComment(result.comment);
            Alert.alert(
                '🤖 AI оценил!',
                `Оценка: ${result.score}/100\n\n${result.comment}`
            );
        } catch (e: any) {
            Alert.alert('Ошибка', e.message);
        } finally {
            setIsEvaluating(false);
        }
    };

    const { setProfile } = useUserStore();

    return (
        <View style={styles.card}>

            {/* ── Медиа ── */}
            <View style={styles.mediaWrapper}>
                <ProtectedMedia
                    mediaUrl={submission.mediaUrl}
                    mediaType={submission.mediaType}
                />
                <View style={styles.typeBadge}>
                    <Text style={styles.typeTxt}>
                        {submission.mediaType === 'video' ? '🎥' : '📷'}
                    </Text>
                </View>
            </View>

            {/* ── Инфо ── */}
            <View style={styles.info}>

                {/* Пользователь */}
                <View style={styles.userRow}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarTxt}>
                            {submission.user?.username?.charAt(0).toUpperCase() ?? '?'}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.username}>
                            {submission.user?.username ?? 'Пользователь'}
                        </Text>
                        <Text style={styles.date}>{date}</Text>
                    </View>
                    {currentScore > 0 && (
                        <View style={styles.scoreBadge}>
                            <Ionicons name="star" size={12} color={Colors.rikon} />
                            <Text style={styles.scoreText}>
                                {typeof currentScore === 'number' && currentScore > 0
                                    ? currentScore.toFixed(2)
                                    : '—'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* AI оценка */}
                {aiScore !== undefined && aiScore !== null ? (
                    <View style={styles.aiBlock}>
                        <View style={styles.aiHeader}>
                            <Text style={styles.aiLabel}>🤖 AI оценка:</Text>
                            <Text style={styles.aiScore}>{aiScore}/100</Text>
                        </View>
                        {aiComment && (
                            <Text style={styles.aiComment}>{aiComment}</Text>
                        )}
                    </View>
                ) : (
                    !isOwner && (
                        <TouchableOpacity
                            style={styles.aiBtn}
                            onPress={handleAIEvaluate}
                            disabled={isEvaluating}
                        >
                            {isEvaluating ? (
                                <ActivityIndicator size="small" color={Colors.secondary} />
                            ) : (
                                <Text style={styles.aiBtnTxt}>🤖 Оценить через AI</Text>
                            )}
                        </TouchableOpacity>
                    )
                )}

                {/* Голосование — только не за своё */}
                {!isOwner && (
                    <>
                        <TouchableOpacity
                            style={styles.voteToggle}
                            onPress={() => setShowVoting(!showVoting)}
                        >
                            <Ionicons
                                name={showVoting ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                color={Colors.primary}
                            />
                            <Text style={styles.voteToggleTxt}>
                                {showVoting ? 'Скрыть голосование' : '⭐ Проголосовать'}
                            </Text>
                        </TouchableOpacity>

                        {showVoting && (
                            <StarRating
                                submissionId={submission.id}
                                onVoted={(newScore) => {
                                    setCurrentScore(newScore);
                                    setShowVoting(false);
                                    userService.getProfile()
                                        .then((p) => setProfile(p))
                                        .catch(() => { });
                                }}
                            />
                        )}
                    </>
                )}

                {/* Кто оценил меня */}
                {isOwner && (
                    <View>
                        <TouchableOpacity style={styles.myVotesBtn} onPress={loadMyVotes}>
                            <Ionicons
                                name={showMyVotes ? 'chevron-up' : 'chevron-down'}
                                size={14}
                                color={Colors.primary}
                            />
                            <Text style={styles.myVotesBtnTxt}>
                                {showMyVotes
                                    ? 'Скрыть оценки'
                                    : `👥 Кто меня оценил (${currentScore > 0 ? currentScore.toFixed(2) : '—'} ⭐)`}
                            </Text>
                        </TouchableOpacity>

                        {showMyVotes && (
                            <View style={styles.receivedList}>
                                {receivedVotes.length === 0 ? (
                                    <Text style={styles.noVotesTxt}>Пока никто не оценил</Text>
                                ) : (
                                    receivedVotes.map((v) => (
                                        <View key={v.id} style={styles.receivedRow}>
                                            <View style={[
                                                styles.receivedAvatar,
                                                v.voter.id === null && styles.receivedAvatarAnon,
                                            ]}>
                                                <Text style={styles.receivedAvatarTxt}>
                                                    {v.voter.username.charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={styles.receivedInfo}>
                                                <Text style={styles.receivedName}>{v.voter.username}</Text>
                                                {v.comment && (
                                                    <Text style={styles.receivedComment}>💬 {v.comment}</Text>
                                                )}
                                            </View>
                                            <View style={styles.receivedStars}>
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Ionicons
                                                        key={s}
                                                        name={s <= v.score ? 'star' : 'star-outline'}
                                                        size={13}
                                                        color={Colors.rikon}
                                                    />
                                                ))}
                                                <Text style={styles.receivedScore}>{v.score}</Text>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },

    // ── Медиа ──
    mediaWrapper: { position: 'relative' },
    media: { width: '100%', height: 200 },

    // Загрузка фото
    mediaLoading: {
        width: '100%',
        height: 200,
        backgroundColor: Colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    mediaLoadingText: {
        color: Colors.textSecondary,
        fontSize: 13,
    },

    // Ошибка загрузки фото
    mediaError: {
        width: '100%',
        height: 200,
        backgroundColor: Colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    mediaErrorText: {
        color: Colors.textMuted,
        fontSize: 13,
    },

    videoPlaceholder: {
        width: '100%',
        height: 200,
        backgroundColor: Colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    videoText: { color: Colors.white, fontSize: 14 },
    typeBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 8,
        padding: 4,
    },
    typeTxt: { fontSize: 16 },

    // ── Инфо ──
    info: { padding: 14 },

    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarTxt: { color: Colors.white, fontWeight: '700', fontSize: 14 },
    userInfo: { flex: 1 },
    username: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    date: { fontSize: 11, color: Colors.textMuted },
    scoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: Colors.rikon + '22',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    scoreText: { color: Colors.rikon, fontWeight: '700', fontSize: 13 },

    aiBlock: {
        backgroundColor: Colors.card,
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
    },
    aiHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    aiLabel: { fontSize: 12, color: Colors.textSecondary },
    aiScore: { fontSize: 13, fontWeight: '700', color: Colors.secondary },
    aiComment: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontStyle: 'italic',
        lineHeight: 17,
    },

    aiBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.secondary,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    aiBtnTxt: { color: Colors.secondary, fontSize: 12, fontWeight: '600' },

    voteToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
    },
    voteToggleTxt: { color: Colors.primary, fontSize: 13, fontWeight: '600' },

    // Кто меня оценил
    myVotesBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        marginTop: 4,
    },
    myVotesBtnTxt: {
        color: Colors.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    receivedList: {
        backgroundColor: Colors.card,
        borderRadius: 10,
        overflow: 'hidden',
        marginTop: 4,
    },
    receivedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    receivedAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    receivedAvatarAnon: { backgroundColor: Colors.textMuted },
    receivedAvatarTxt: { color: Colors.white, fontWeight: '700', fontSize: 12 },
    receivedInfo: { flex: 1 },
    receivedName: { flex: 1, fontSize: 13, color: Colors.textPrimary },
    receivedComment: {
        fontSize: 11,
        color: Colors.textSecondary,
        fontStyle: 'italic',
        marginTop: 2,
        lineHeight: 16,
    },
    receivedStars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    receivedScore: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.rikon,
        marginLeft: 3,
    },
    noVotesTxt: {
        color: Colors.textMuted,
        fontSize: 13,
        textAlign: 'center',
        padding: 12,
    },
});