import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { voteService } from '@services/voteService';

export const ReceivedVotes: React.FC = () => {
  const [data, setData]           = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded]   = useState<number | null>(null);

  useEffect(() => {
    voteService.getMyReceivedVotes()
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <ActivityIndicator color={Colors.primary} />;

  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>⭐</Text>
        <Text style={styles.emptyTxt}>Пока никто не оценил твои работы</Text>
      </View>
    );
  }

  // Считаем общий средний рейтинг
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
      <View style={styles.overallCard}>
        <View style={styles.overallLeft}>
          <Text style={styles.overallAvg}>{overallAvg > 0 ? overallAvg.toFixed(2) : '—'}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons
                key={s}
                name={s <= overallAvg ? 'star' : s - overallAvg < 1 ? 'star-half' : 'star-outline'}
                size={14}
                color={Colors.rikon}
              />
            ))}
          </View>
        </View>
        <View style={styles.overallRight}>
          <Text style={styles.voterCount}>
            {allVotes.length} оценок
          </Text>
          <Text style={styles.voterCount}>
            от {uniqueVoters} оценщиков
          </Text>
        </View>
      </View>

      {/* Список сабмишенов с голосами */}
      {data.map((item) => (
        <View key={item.submissionId} style={styles.submissionBlock}>
          {/* Заголовок задачи */}
          <TouchableOpacity
            style={styles.submissionHeader}
            onPress={() => setExpanded(
              expanded === item.submissionId ? null : item.submissionId
            )}
          >
            <View style={styles.submissionInfo}>
              <Text style={styles.taskName}>
                Задача {item.task?.day} — {item.task?.title}
              </Text>
              <View style={styles.avgRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={s <= item.avgScore ? 'star' : 'star-outline'}
                    size={12}
                    color={Colors.rikon}
                  />
                ))}
                <Text style={styles.avgTxt}>
                  {item.avgScore > 0 ? item.avgScore.toFixed(2) : '—'}
                </Text>
                <Text style={styles.voteCountTxt}>
                  ({item.votes.length})
                </Text>
              </View>
            </View>
            <Ionicons
              name={expanded === item.submissionId ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Colors.textMuted}
            />
          </TouchableOpacity>

          {/* Список голосов */}
          {expanded === item.submissionId && (
            <View style={styles.votesList}>
              {item.votes.map((vote: any) => (
                <View key={vote.id} style={styles.voteRow}>
                  {/* Аватар */}
                  <View style={[
                    styles.avatar,
                    vote.voter.id === null && styles.avatarAnon,
                  ]}>
                    <Text style={styles.avatarTxt}>
                      {vote.voter.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  {/* Имя */}
                  <Text style={styles.voterName}>{vote.voter.username}</Text>

                  {/* Звёзды */}
                  <View style={styles.voteStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name={s <= vote.score ? 'star' : 'star-outline'}
                        size={14}
                        color={Colors.rikon}
                      />
                    ))}
                    <Text style={styles.voteScore}>{vote.score}</Text>
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
  emptyTxt:  { color: Colors.textMuted, fontSize: 14 },

  overallCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.rikon + '40',
  },
  overallLeft:  { alignItems: 'center', gap: 4 },
  overallAvg:   { fontSize: 32, fontWeight: '800', color: Colors.rikon },
  starsRow:     { flexDirection: 'row', gap: 2 },
  overallRight: { alignItems: 'flex-end' },
  voterCount:   { fontSize: 13, color: Colors.textSecondary },

  submissionBlock: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  avgRow:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  avgTxt:     { fontSize: 13, fontWeight: '700', color: Colors.rikon, marginLeft: 4 },
  voteCountTxt: { fontSize: 12, color: Colors.textMuted },

  votesList: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  voteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarAnon: { backgroundColor: Colors.textMuted },
  avatarTxt:  { color: Colors.white, fontWeight: '700', fontSize: 13 },
  voterName:  { flex: 1, fontSize: 14, color: Colors.textPrimary },
  voteStars:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
  voteScore:  { fontSize: 13, fontWeight: '700', color: Colors.rikon, marginLeft: 4 },
});