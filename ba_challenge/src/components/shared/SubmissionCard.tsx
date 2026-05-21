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
import { useTranslation } from 'react-i18next';
import { Submission } from '@/types/index';
import { StarRating } from '@components/shared/StarRating';
import { aiService } from '@services/aiService';
import { useAuthStore } from '@store/authStore';
import { useUserStore } from '@/store/userStore';
import { userService } from '@/services/userService';
import { voteService } from '@/services/voteService';
import { useTheme } from '@/theme/ThemeContext';

interface SubmissionCardProps {
  submission: Submission;
}

export const SubmissionCard: React.FC<SubmissionCardProps> = ({ submission }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const { setProfile } = useUserStore();
  const { theme } = useTheme();

  const [currentScore, setCurrentScore] = useState(submission.score);
  const [aiScore, setAiScore] = useState(submission.aiScore);
  const [aiComment, setAiComment] = useState(submission.aiComment);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showVoting, setShowVoting] = useState(false);

  const [receivedVotes, setReceivedVotes] = useState<any[]>([]);
  const [votesLoaded, setVotesLoaded] = useState(false);
  const [showMyVotes, setShowMyVotes] = useState(false);

  const isOwner = user?.id === submission.userId;

  const locale =
    i18n.language === 'kz'
      ? 'kk-KZ'
      : i18n.language === 'en'
        ? 'en-US'
        : 'ru-RU';

  const date = new Date(submission.createdAt).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

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
      console.log('Votes loading error:', e);
    }
  };

  const handleAIEvaluate = async () => {
    try {
      setIsEvaluating(true);

      const result = await aiService.evaluateSubmission(submission.id);

      setAiScore(result.score);
      setAiComment(result.comment);

      Alert.alert(
        t('submissionCard.aiEvaluatedTitle'),
        t('submissionCard.aiEvaluatedMessage', {
          score: result.score,
          comment: result.comment,
        })
      );
    } catch (e: any) {
      Alert.alert(t('submissionCard.error'), e.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.mediaWrapper}>
        {submission.mediaType === 'photo' ? (
          <Image
            source={{ uri: submission.mediaUrl }}
            style={styles.media}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.videoPlaceholder, { backgroundColor: theme.card }]}>
            <Ionicons name="play-circle" size={52} color={theme.textPrimary} />
            <Text style={[styles.videoText, { color: theme.textPrimary }]}>
              {t('submissionCard.videoProof')}
            </Text>
          </View>
        )}

        <View style={styles.typeBadge}>
          <Ionicons
            name={submission.mediaType === 'video' ? 'videocam' : 'camera'}
            size={16}
            color="#ffffff"
          />
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.userRow}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            {submission.user?.avatarUrl ? (
              <Image
                source={{ uri: submission.user.avatarUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarTxt}>
                {submission.user?.username?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            )}
          </View>

          <View style={styles.userInfo}>
            <Text style={[styles.username, { color: theme.textPrimary }]}>
              {submission.user?.username ?? t('submissionCard.userFallback')}
            </Text>
            <Text style={[styles.date, { color: theme.textMuted }]}>{date}</Text>
          </View>

          {currentScore > 0 && (
            <View style={[styles.scoreBadge, { backgroundColor: theme.amber + '22' }]}>
              <Ionicons name="star" size={12} color={theme.amber} />
              <Text style={[styles.scoreText, { color: theme.amber }]}>
                {typeof currentScore === 'number' && currentScore > 0
                  ? currentScore.toFixed(2)
                  : '—'}
              </Text>
            </View>
          )}
        </View>

        {aiScore !== undefined && aiScore !== null ? (
          <View style={[styles.aiBlock, { backgroundColor: theme.card }]}>
            <View style={styles.aiHeader}>
              <Text style={[styles.aiLabel, { color: theme.textSecondary }]}>
                {t('submissionCard.aiScoreLabel')}
              </Text>
              <Text style={[styles.aiScore, { color: theme.secondary }]}>{aiScore}/100</Text>
            </View>

            {aiComment && (
              <Text style={[styles.aiComment, { color: theme.textSecondary }]}>{aiComment}</Text>
            )}
          </View>
        ) : (
          !isOwner && (
            <TouchableOpacity
              style={[styles.aiBtn, { borderColor: theme.secondary }]}
              onPress={handleAIEvaluate}
              disabled={isEvaluating}
            >
              {isEvaluating ? (
                <ActivityIndicator size="small" color={theme.secondary} />
              ) : (
                <Text style={[styles.aiBtnTxt, { color: theme.secondary }]}>
                  {t('submissionCard.evaluateWithAi')}
                </Text>
              )}
            </TouchableOpacity>
          )
        )}

        {!isOwner && (
          <>
            <TouchableOpacity
              style={styles.voteToggle}
              onPress={() => setShowVoting(!showVoting)}
            >
              <Ionicons
                name={showVoting ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={theme.primary}
              />

              <Text style={[styles.voteToggleTxt, { color: theme.primary }]}>
                {showVoting
                  ? t('submissionCard.hideVoting')
                  : t('submissionCard.vote')}
              </Text>
            </TouchableOpacity>

            {showVoting && (
              <StarRating
                submissionId={submission.id}
                onVoted={(newScore) => {
                  setCurrentScore(newScore);
                  setShowVoting(false);
                  userService.getProfile().then((p) => setProfile(p)).catch(() => {});
                }}
              />
            )}
          </>
        )}

        {isOwner && (
          <View>
            <TouchableOpacity style={[styles.myVotesBtn, { borderTopColor: theme.border }]} onPress={loadMyVotes}>
              <Ionicons
                name={showMyVotes ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={theme.primary}
              />

              <Text style={[styles.myVotesBtnTxt, { color: theme.primary }]}>
                {showMyVotes
                  ? t('submissionCard.hideScores')
                  : t('submissionCard.whoRatedMe', {
                      score: currentScore > 0 ? currentScore.toFixed(2) : '—',
                    })}
              </Text>
            </TouchableOpacity>

            {showMyVotes && (
              <View style={[styles.receivedList, { backgroundColor: theme.card }]}>
                {receivedVotes.length === 0 ? (
                  <Text style={[styles.noVotesTxt, { color: theme.textMuted }]}>
                    {t('submissionCard.noVotesYet')}
                  </Text>
                ) : (
                  receivedVotes.map((v) => (
                    <View key={v.id} style={[styles.receivedRow, { borderBottomColor: theme.border }]}>
                      <View
                        style={[
                          styles.receivedAvatar,
                          { backgroundColor: theme.primary },
                          v.voter.id === null && { backgroundColor: theme.textMuted },
                        ]}
                      >
                        {v.voter.avatarUrl && v.voter.id !== null ? (
                          <Image
                            source={{ uri: v.voter.avatarUrl }}
                            style={styles.receivedAvatarImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={styles.receivedAvatarTxt}>
                            {v.voter.username.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>

                      <View style={styles.receivedInfo}>
                        <Text style={[styles.receivedName, { color: theme.textPrimary }]}>
                          {v.voter.username}
                        </Text>

                        {v.comment && (
                          <Text style={[styles.receivedComment, { color: theme.textSecondary }]}>
                            {t('submissionCard.commentPrefix')} {v.comment}
                          </Text>
                        )}
                      </View>

                      <View style={styles.receivedStars}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons
                            key={s}
                            name={s <= v.score ? 'star' : 'star-outline'}
                            size={13}
                            color={theme.amber}
                          />
                        ))}
                        <Text style={[styles.receivedScore, { color: theme.amber }]}>{v.score}</Text>
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
  receivedInfo: { flex: 1 },
  receivedComment: {
    fontSize: 11,
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
    marginTop: 4,
  },
  myVotesBtnTxt: {
    fontSize: 13,
    fontWeight: '600',
  },
  receivedList: {
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
  },
  receivedAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  receivedAvatarAnon: {},
  receivedAvatarImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  receivedAvatarTxt: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  receivedName: { fontSize: 13 },
  receivedStars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  receivedScore: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 3,
  },
  noVotesTxt: {
    fontSize: 13,
    textAlign: 'center',
    padding: 12,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
  },
  mediaWrapper: { position: 'relative' },
  media: { width: '100%', height: 200 },
  videoPlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  videoText: { fontSize: 14 },
  typeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    padding: 4,
  },
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
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarTxt: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  userInfo: { flex: 1 },
  username: { fontSize: 14, fontWeight: '600' },
  date: { fontSize: 11 },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreText: { fontWeight: '700', fontSize: 13 },
  aiBlock: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  aiLabel: { fontSize: 12 },
  aiScore: { fontSize: 13, fontWeight: '700' },
  aiComment: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  aiBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  aiBtnTxt: { fontSize: 12, fontWeight: '600' },
  voteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  voteToggleTxt: { fontSize: 13, fontWeight: '600' },
});