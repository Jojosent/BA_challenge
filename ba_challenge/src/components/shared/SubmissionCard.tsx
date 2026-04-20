import React, { useState } from 'react';
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

interface SubmissionCardProps {
    submission: Submission;
}

export const SubmissionCard: React.FC<SubmissionCardProps> = ({
    submission,
}) => {
    const { user } = useAuthStore();
    const [currentScore, setCurrentScore] = useState(submission.score);
    const [aiScore, setAiScore] = useState(submission.aiScore);
    const [aiComment, setAiComment] = useState(submission.aiComment);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [showVoting, setShowVoting] = useState(false);

    const [receivedVotes, setReceivedVotes] = useState<any[]>([]);
const [votesLoaded, setVotesLoaded]     = useState(false);
const [showMyVotes, setShowMyVotes]     = useState(false);

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

            {/* Медиа */}
            <View style={styles.mediaWrapper}>
                {submission.mediaType === 'photo' ? (
                    <Image
                        source={{ uri: submission.mediaUrl }}
                        style={styles.media}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.videoPlaceholder}>
                        <Ionicons name="play-circle" size={52} color={Colors.white} />
                        <Text style={styles.videoText}>Видео доказательство</Text>
                    </View>
                )}

                <View style={styles.typeBadge}>
                    <Text style={styles.typeTxt}>
                        {submission.mediaType === 'video' ? '🎥' : '📷'}
                    </Text>
                </View>
            </View>

            {/* Инфо */}
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
                    {/* Текущий score */}
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
                                // currentScore={currentScore}
                                onVoted={(newScore) => {
                                    setCurrentScore(newScore);
                                    setShowVoting(false);
                                    // ✅ Обновляем профиль чтобы рейтинг обновился
                                    userService.getProfile().then((p) => setProfile(p)).catch(() => { });
                                }}
                            />
                        )}
                    </>
                )}

{isOwner ? (
  <View>
    {/* Кнопка показать оценщиков */}
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

    {/* Список оценщиков */}
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

    {/* ✅ Имя + комментарий в колонку */}
    <View style={styles.receivedInfo}>
      <Text style={styles.receivedName}>{v.voter.username}</Text>
      {v.comment && (
        <Text style={styles.receivedComment}>💬 {v.comment}</Text>
      )}
    </View>

    {/* Звёзды */}
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
) : null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({

    receivedInfo:    { flex: 1 },
receivedComment: {
  fontSize: 11,
  color: Colors.textSecondary,
  fontStyle: 'italic',
  marginTop: 2,
  lineHeight: 16,
},
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
receivedAvatarTxt:  { color: Colors.white, fontWeight: '700', fontSize: 12 },
receivedName:  { flex: 1, fontSize: 13, color: Colors.textPrimary },
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


    card: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    mediaWrapper: { position: 'relative' },
    media: { width: '100%', height: 200 },
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

    ownerBadge: {
        backgroundColor: Colors.primary + '15',
        borderRadius: 8,
        padding: 8,
        alignItems: 'center',
        marginTop: 4,
    },
    ownerTxt: { color: Colors.primary, fontSize: 12, fontWeight: '500' },
});