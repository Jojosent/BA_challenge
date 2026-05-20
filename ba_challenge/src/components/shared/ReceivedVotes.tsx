import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { voteService } from '@services/voteService';
import { useTheme } from '@/theme/ThemeContext';

export const ReceivedVotes: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    voteService.getMyReceivedVotes()
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <ActivityIndicator color={theme.primary} />;

  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>⭐</Text>
        <Text style={[styles.emptyTxt, { color: theme.textMuted }]}>Пока никто не оценил твои работы</Text>
      </View>
    );
  }

  const allVotes = data.flatMap((d) => d.votes);
  const overallAvg = allVotes.length > 0
    ? Math.round(
      allVotes.reduce((sum: number, v: any) => sum + v.score, 0)
      / allVotes.length * 100
    ) / 100
    : 0;

  const uniqueVoters = new Set(
    allVotes
      .filter((v: any) => v.voter.id !== null)
      .map((v: any) => v.voter.id)
  ).size;

  return (
    <View style={styles.container}>
      {/* Общая статистика */}
      <View style={[styles.overallCard, { backgroundColor: theme.card, borderColor: theme.amber + '40' }]}>
        <View style={styles.overallLeft}>
          <Text style={[styles.overallAvg, { color: theme.amber }]}>{overallAvg > 0 ? overallAvg.toFixed(2) : '—'}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons
                key={s}
                name={s <= overallAvg ? 'star' : s - overallAvg < 1 ? 'star-half' : 'star-outline'}
                size={14}
                color={theme.amber}
              />
            ))}
          </View>
        </View>
        <View style={styles.overallRight}>
          <Text style={[styles.voterCount, { color: theme.textSecondary }]}>
            {allVotes.length} оценок
          </Text>
          <Text style={[styles.voterCount, { color: theme.textSecondary }]}>
            от {uniqueVoters} оценщиков
          </Text>
        </View>
      </View>

      {/* Список сабмишенов с голосами */}
      {data.map((item) => (
        <View key={item.submissionId} style={[styles.submissionBlock, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Заголовок задачи */}
          <TouchableOpacity
            style={styles.submissionHeader}
            onPress={() => setExpanded(
              expanded === item.submissionId ? null : item.submissionId
            )}
          >
            <View style={styles.submissionInfo}>
              <Text style={[styles.taskName, { color: theme.textPrimary }]}>
                Задача {item.task?.day} — {item.task?.title}
              </Text>
              <View style={styles.avgRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={s <= item.avgScore ? 'star' : 'star-outline'}
                    size={12}
                    color={theme.amber}
                  />
                ))}
                <Text style={[styles.avgTxt, { color: theme.amber }]}>
                  {item.avgScore > 0 ? item.avgScore.toFixed(2) : '—'}
                </Text>
                <Text style={[styles.voteCountTxt, { color: theme.textMuted }]}>
                  ({item.votes.length})
                </Text>
              </View>
            </View>
            <Ionicons
              name={expanded === item.submissionId ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.textMuted}
            />
          </TouchableOpacity>

          {/* Список голосов */}
          {expanded === item.submissionId && (
            <View style={[styles.votesList, { borderTopColor: theme.border }]}>
              {item.votes.map((vote: any) => (
                <View key={vote.id} style={[styles.voteRow, { borderBottomColor: theme.border }]}>
                  {/* Аватар оценщика */}
                  <View style={[
                    styles.avatar,
                    { backgroundColor: theme.primary },
                    vote.voter.id === null && { backgroundColor: theme.textMuted },
                  ]}>
                    {vote.voter.avatarUrl && vote.voter.id !== null ? (
                      <Image
                        source={{ uri: vote.voter.avatarUrl }}
                        style={styles.avatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.avatarTxt}>
                        {vote.voter.username.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>

                  {/* Имя */}
                  <Text style={[styles.voterName, { color: theme.textPrimary }]}>{vote.voter.username}</Text>

                  {/* Звёзды */}
                  <View style={styles.voteStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name={s <= vote.score ? 'star' : 'star-outline'}
                        size={14}
                        color={theme.amber}
                      />
                    ))}
                    <Text style={[styles.voteScore, { color: theme.amber }]}>{vote.score}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  empty: { alignItems: 'center', paddingVertical: 24 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyTxt: { fontSize: 14 },

  overallCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  overallLeft: { alignItems: 'center', gap: 4 },
  overallAvg: { fontSize: 32, fontWeight: '800' },
  starsRow: { flexDirection: 'row', gap: 2 },
  overallRight: { alignItems: 'flex-end' },
  voterCount: { fontSize: 13 },

  submissionBlock: {
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
  },
  submissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  submissionInfo: { flex: 1 },
  taskName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  avgRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  avgTxt: { fontSize: 13, fontWeight: '700', marginLeft: 4 },
  voteCountTxt: { fontSize: 12 },

  votesList: {
    borderTopWidth: 1,
  },
  voteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
  },

  // Аватар оценщика
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarAnon: {},
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarTxt: { color: '#ffffff', fontWeight: '700', fontSize: 13 },

  voterName: { flex: 1, fontSize: 14 },
  voteStars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  voteScore: { fontSize: 13, fontWeight: '700', marginLeft: 4 },
});