import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@constants/colors';
import { Participant } from '@/types/index';

interface ParticipantListProps {
  participants: Participant[];
  creatorId?: number;
  betAmount?: number;
  prizePool?: number;
}

const MEDAL = ['🥇', '🥈', '🥉'];

// Распределение призов по количеству участников
const getPrizePercent = (place: number, total: number): number | null => {
  if (total === 1) return place === 1 ? 100 : null;
  if (total === 2) {
    if (place === 1) return 70;
    if (place === 2) return 30;
    return null;
  }
  // 3+
  if (place === 1) return 50;
  if (place === 2) return 30;
  if (place === 3) return 20;
  return null;
};

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  creatorId,
  betAmount = 0,
  prizePool = 0,
}) => {
  const sorted = [...participants].sort((a, b) => b.score - a.score);
  const total = sorted.length;
  const hasPrize = betAmount > 0 && prizePool > 0;

  return (
    <View style={styles.container}>

      {/* Призовой пул — компактная шапка */}
      {hasPrize && (
        <View style={styles.prizeHeader}>
          <View style={styles.prizeHeaderLeft}>
            <Text style={styles.prizeHeaderIcon}>🏆</Text>
            <View>
              <Text style={styles.prizeHeaderLabel}>Призовой пул</Text>
              <Text style={styles.prizeHeaderSub}>
                {betAmount} 🪙 × {total} участн.
              </Text>
            </View>
          </View>
          <Text style={styles.prizeHeaderTotal}>{prizePool} 🪙</Text>
        </View>
      )}

      {/* Список участников */}
      {sorted.map((p, index) => {
        const isCreator = p.userId === creatorId;
        const percent = hasPrize ? getPrizePercent(index + 1, total) : null;
        const prizeAmount = percent !== null ? Math.floor(prizePool * percent / 100) : null;
        const isWinner = percent !== null;

        return (
          <View
            key={p.id}
            style={[
              styles.row,
              isCreator && styles.rowCreator,
              index === 0 && hasPrize && styles.rowFirst,
            ]}
          >
            {/* Место */}
            <View style={styles.rankCol}>
              {index < 3 ? (
                <Text style={styles.medal}>{MEDAL[index]}</Text>
              ) : (
                <Text style={styles.rankNum}>#{index + 1}</Text>
              )}
            </View>

            {/* Аватар */}
            <View style={[
              styles.avatar,
              isCreator && styles.avatarCreator,
              index === 0 && styles.avatarFirst,
              index === 1 && styles.avatarSecond,
              index === 2 && styles.avatarThird,
            ]}>
              <Text style={styles.avatarText}>
                {p.user?.username?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>

            {/* Имя + метки */}
            <View style={styles.nameCol}>
              <View style={styles.nameRow}>
                <Text style={styles.username} numberOfLines={1}>
                  {p.user?.username ?? `Участник ${p.userId}`}
                </Text>
                {isCreator && (
                  <View style={styles.creatorBadge}>
                    <Text style={styles.creatorBadgeTxt}>👑</Text>
                  </View>
                )}
              </View>

              {/* Приз */}
              {hasPrize && prizeAmount !== null && (
                <Text style={styles.prizeHint}>
                  {percent}% → {prizeAmount} 🪙
                </Text>
              )}
              {hasPrize && prizeAmount === null && index >= 3 && (
                <Text style={styles.loseHint}>монеты не возвращаются</Text>
              )}

              {p.user?.rating !== undefined && !hasPrize && (
                <Text style={styles.rating}>⭐ {p.user.rating}</Text>
              )}
            </View>

            {/* Очки */}
            <View style={styles.scoreCol}>
              <Text style={[styles.score, index === 0 && styles.scoreFirst]}>
                {p.score}
              </Text>
              <Text style={styles.scoreLabel}>очков</Text>
            </View>
          </View>
        );
      })}

      {/* Заглушка */}
      {participants.length === 0 && (
        <Text style={styles.empty}>Пока нет участников</Text>
      )}

      {/* Сноска для проигравших */}
      {hasPrize && total > 3 && (
        <View style={styles.losersNote}>
          <Text style={styles.losersNoteText}>
            😔 Участники с 4-го места теряют взнос {betAmount} 🪙
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},

  // Шапка призового пула
  prizeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.rikon + '12',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.rikon + '30',
  },
  prizeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prizeHeaderIcon:  { fontSize: 22 },
  prizeHeaderLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  prizeHeaderSub:   { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  prizeHeaderTotal: { fontSize: 20, fontWeight: '800', color: Colors.rikon },

  // Строка участника
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  rowCreator: {
    backgroundColor: Colors.rikon + '06',
  },
  rowFirst: {
    backgroundColor: Colors.rikon + '08',
  },

  rankCol: { width: 32, alignItems: 'center' },
  medal:   { fontSize: 18 },
  rankNum: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarCreator: {
    borderColor: Colors.rikon,
    backgroundColor: Colors.primary,
  },
  avatarFirst: {
    backgroundColor: Colors.rikon,
    borderColor: Colors.rikon,
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarSecond: {
    backgroundColor: '#A8A8A8',
    borderColor: '#C0C0C0',
  },
  avatarThird: {
    backgroundColor: '#CD7F32',
    borderColor: '#CD7F32',
  },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 15 },

  nameCol:  { flex: 1 },
  nameRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  username: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  rating:   { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  prizeHint: {
    fontSize: 11,
    color: Colors.rikon,
    fontWeight: '600',
    marginTop: 2,
  },
  loseHint: {
    fontSize: 11,
    color: Colors.error,
    marginTop: 2,
    opacity: 0.7,
  },

  creatorBadge: {
    backgroundColor: Colors.rikon + '25',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.rikon + '50',
  },
  creatorBadgeTxt: { fontSize: 10 },

  scoreCol:   { alignItems: 'flex-end', paddingRight: 4 },
  score:      { fontSize: 16, fontWeight: '800', color: Colors.accent },
  scoreFirst: { color: Colors.rikon, fontSize: 18 },
  scoreLabel: { fontSize: 10, color: Colors.textMuted },

  empty: { color: Colors.textMuted, textAlign: 'center', paddingVertical: 16 },

  losersNote: {
    marginTop: 8,
    padding: 10,
    backgroundColor: Colors.error + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error + '25',
    alignItems: 'center',
  },
  losersNoteText: {
    fontSize: 11,
    color: Colors.error,
    opacity: 0.8,
    fontStyle: 'italic',
  },
});