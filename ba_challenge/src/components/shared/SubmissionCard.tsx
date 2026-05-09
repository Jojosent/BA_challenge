import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { Submission, SubmissionMediaItem } from '@/types/index';
import { StarRating } from '@components/shared/StarRating';
import { aiService } from '@services/aiService';
import { useAuthStore } from '@store/authStore';
import { useUserStore } from '@/store/userStore';
import { userService } from '@/services/userService';
import { voteService } from '@/services/voteService';
import { submissionService } from '@/services/submissionService';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface SubmissionCardProps {
  submission: Submission;
  onUpdated?: () => void; // ✅ Callback при удалении медиа
}

export const SubmissionCard: React.FC<SubmissionCardProps> = ({
  submission,
  onUpdated,
}) => {
  const { user } = useAuthStore();
  const { setProfile } = useUserStore();

  const [currentScore, setCurrentScore] = useState(submission.score);
  const [aiScore, setAiScore] = useState(submission.aiScore);
  const [aiComment, setAiComment] = useState(submission.aiComment);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showVoting, setShowVoting] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<number | null>(null);

  // ✅ Просмотр медиа на весь экран
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerMedia, setViewerMedia] = useState<SubmissionMediaItem | null>(null);

  // Голоса
  const [receivedVotes, setReceivedVotes] = useState<any[]>([]);
  const [votesLoaded, setVotesLoaded] = useState(false);
  const [showMyVotes, setShowMyVotes] = useState(false);

  const isOwner = user?.id === submission.userId;

  // ✅ Получаем список медиа (с защитой от undefined)
  const mediaList: SubmissionMediaItem[] = submission.media ?? [];

  const date = new Date(submission.createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  // ✅ Открыть просмотр медиа
  const openViewer = (media: SubmissionMediaItem) => {
    setViewerMedia(media);
    setViewerVisible(true);
  };

  // ✅ Удалить медиафайл (только владелец)
  const handleDeleteMedia = (media: SubmissionMediaItem) => {
    Alert.alert(
      'Удалить файл?',
      'Этот медиафайл будет удалён безвозвратно',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingMediaId(media.id);
              await submissionService.deleteMedia(media.id);
              onUpdated?.();
            } catch (e: any) {
              Alert.alert('Ошибка', e.message);
            } finally {
              setDeletingMediaId(null);
            }
          },
        },
      ]
    );
  };

  // AI оценка
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

  // Загрузить голоса
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

  return (
    <View style={styles.card}>

      {/* ── Горизонтальный скролл медиа ── */}
      {mediaList.length > 0 ? (
        <View style={styles.mediaSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled={mediaList.length === 1}
            contentContainerStyle={styles.mediaScroll}
          >
            {mediaList.map((media, index) => (
              <TouchableOpacity
                key={media.id}
                style={styles.mediaItem}
                onPress={() => openViewer(media)}
                activeOpacity={0.9}
              >
                {media.mediaType === 'photo' ? (
                  <Image
                    source={{ uri: media.mediaUrl }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.videoPlaceholder}>
                    <Ionicons name="play-circle" size={44} color={Colors.white} />
                    <Text style={styles.videoText}>Видео</Text>
                  </View>
                )}

                {/* Бейдж типа */}
                <View style={styles.typeBadge}>
                  <Text style={styles.typeTxt}>
                    {media.mediaType === 'video' ? '🎥' : '📷'}
                  </Text>
                </View>

                {/* Номер если несколько */}
                {mediaList.length > 1 && (
                  <View style={styles.indexBadge}>
                    <Text style={styles.indexTxt}>
                      {index + 1}/{mediaList.length}
                    </Text>
                  </View>
                )}

                {/* ✅ Кнопка удалить — только владелец */}
                {isOwner && (
                  <TouchableOpacity
                    style={styles.deleteMediaBtn}
                    onPress={() => handleDeleteMedia(media)}
                    disabled={deletingMediaId === media.id}
                  >
                    {deletingMediaId === media.id ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Ionicons name="trash" size={14} color={Colors.white} />
                    )}
                  </TouchableOpacity>
                )}

                {/* Оверлей загрузки */}
                {deletingMediaId === media.id && (
                  <View style={styles.deletingOverlay}>
                    <ActivityIndicator size="large" color={Colors.white} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Индикаторы точек */}
          {mediaList.length > 1 && (
            <View style={styles.dots}>
              {mediaList.map((_, i) => (
                <View key={i} style={styles.dot} />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.emptyMedia}>
          <Ionicons name="images-outline" size={32} color={Colors.textMuted} />
          <Text style={styles.emptyMediaTxt}>Медиа удалено</Text>
        </View>
      )}

      {/* ── Инфо ── */}
      <View style={styles.info}>

        {/* Пользователь + score */}
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

        {/* Количество медиа */}
        {mediaList.length > 0 && (
          <View style={styles.mediaCountRow}>
            <Ionicons name="images-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.mediaCountTxt}>
              {mediaList.length} {mediaList.length === 1 ? 'файл' : 'файлов'} · листай вправо
            </Text>
          </View>
        )}

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
                    .catch(() => {});
                }}
              />
            )}
          </>
        )}

        {/* Кто оценил — только владелец */}
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

      {/* ✅ Полноэкранный просмотр медиа */}
      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={styles.viewerOverlay}>
          {/* Кнопка закрыть */}
          <TouchableOpacity
            style={styles.viewerClose}
            onPress={() => setViewerVisible(false)}
          >
            <Ionicons name="close" size={28} color={Colors.white} />
          </TouchableOpacity>

          {/* Медиа */}
          {viewerMedia && (
            viewerMedia.mediaType === 'photo' ? (
              <Image
                source={{ uri: viewerMedia.mediaUrl }}
                style={styles.viewerImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.viewerVideo}>
                <Ionicons name="play-circle" size={80} color={Colors.white} />
                <Text style={styles.viewerVideoTxt}>
                  Видео — открой в плеере
                </Text>
              </View>
            )
          )}

          {/* Навигация если несколько */}
          {mediaList.length > 1 && (
            <View style={styles.viewerNav}>
              {mediaList.map((media, i) => (
                <TouchableOpacity
                  key={media.id}
                  style={[
                    styles.viewerNavDot,
                    viewerMedia?.id === media.id && styles.viewerNavDotActive,
                  ]}
                  onPress={() => setViewerMedia(media)}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const MEDIA_SIZE = 200;

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
  mediaSection: { position: 'relative' },
  mediaScroll: {
    gap: 2,
  },
  mediaItem: {
    width: MEDIA_SIZE,
    height: MEDIA_SIZE,
    position: 'relative',
    backgroundColor: Colors.card,
  },
  mediaImage: {
    width: MEDIA_SIZE,
    height: MEDIA_SIZE,
  },
  videoPlaceholder: {
    width: MEDIA_SIZE,
    height: MEDIA_SIZE,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  videoText: { color: Colors.white, fontSize: 13, fontWeight: '600' },

  typeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    padding: 4,
  },
  typeTxt: { fontSize: 13 },

  indexBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  indexTxt: { color: Colors.white, fontSize: 11, fontWeight: '600' },

  deleteMediaBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.error,
    borderRadius: 16,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deletingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
  },

  emptyMedia: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.card,
    gap: 6,
  },
  emptyMediaTxt: { color: Colors.textMuted, fontSize: 13 },

  // ── Инфо ──
  info: { padding: 14 },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
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

  mediaCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  mediaCountTxt: { fontSize: 11, color: Colors.textMuted },

  // AI
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
  aiLabel:   { fontSize: 12, color: Colors.textSecondary },
  aiScore:   { fontSize: 13, fontWeight: '700', color: Colors.secondary },
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

  // Голосование
  voteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  voteToggleTxt: { color: Colors.primary, fontSize: 13, fontWeight: '600' },

  // Кто оценил
  myVotesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 4,
  },
  myVotesBtnTxt: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
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
  receivedInfo:       { flex: 1 },
  receivedName:       { fontSize: 13, color: Colors.textPrimary },
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

  // ── Просмотрщик ──
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 8,
  },
  viewerImage: {
    width: SCREEN_W,
    height: SCREEN_H * 0.75,
  },
  viewerVideo: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  viewerVideoTxt: {
    color: Colors.white,
    fontSize: 15,
    // color: Colors.textSecondary,
  },
  viewerNav: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: 8,
  },
  viewerNavDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  viewerNavDotActive: {
    backgroundColor: Colors.white,
    width: 20,
    borderRadius: 4,
  },
});