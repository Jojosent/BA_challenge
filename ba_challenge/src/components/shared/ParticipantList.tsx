import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@constants/colors';
import { Participant } from '@/types/index';

interface ParticipantListProps {
  participants: Participant[];
  creatorId?: number;          // ✅ передаём ID создателя
}

const MEDAL = ['🥇', '🥈', '🥉'];

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  creatorId,
}) => {
  const sorted = [...participants].sort((a, b) => b.score - a.score);

  return (
    <View style={styles.container}>
      {sorted.map((p, index) => {
        const isCreator = p.userId === creatorId;

        return (
          <View key={p.id} style={[styles.row, isCreator && styles.rowCreator]}>
            {/* Место */}
            <View style={styles.rankCol}>
              {index < 3 ? (
                <Text style={styles.medal}>{MEDAL[index]}</Text>
              ) : (
                <Text style={styles.rankNum}>#{index + 1}</Text>
              )}
            </View>

            {/* Аватар */}
            <View style={[styles.avatar, isCreator && styles.avatarCreator]}>
              <Text style={styles.avatarText}>
                {p.user?.username?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>

            {/* Имя + метка создателя */}
            <View style={styles.nameCol}>
              <View style={styles.nameRow}>
                <Text style={styles.username} numberOfLines={1}>
                  {p.user?.username ?? `Участник ${p.userId}`}
                </Text>
                {/* ✅ Метка создателя */}
                {isCreator && (
                  <View style={styles.creatorBadge}>
                    <Text style={styles.creatorBadgeTxt}>👑 Создатель</Text>
                  </View>
                )}
              </View>
              {p.user?.rating !== undefined && (
                <Text style={styles.rating}>⭐ рейтинг {p.user.rating}</Text>
              )}
            </View>

            {/* Очки */}
            <View style={styles.scoreCol}>
              <Text style={styles.score}>{p.score}</Text>
              <Text style={styles.scoreLabel}>очков</Text>
            </View>
          </View>
        );
      })}

      {participants.length === 0 && (
        <Text style={styles.empty}>Пока нет участников</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},

row: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  paddingHorizontal: 4,    // ✅ добавили
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
  gap: 10,
},
  rowCreator: {
    backgroundColor: Colors.rikon + '08',
  },

  rankCol:  { width: 32, alignItems: 'center' },
  medal:    { fontSize: 18 },
  rankNum:  { fontSize: 13, fontWeight: '700', color: Colors.textMuted },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCreator: {
    backgroundColor: Colors.rikon,
    borderWidth: 2,
    borderColor: Colors.rikon,
  },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 15 },

  nameCol:  { flex: 1 },
  nameRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  username: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  rating:   { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  // ✅ Метка создателя
  creatorBadge: {
    backgroundColor: Colors.rikon + '25',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.rikon + '60',
  },
  creatorBadgeTxt: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.rikon,
  },

  scoreCol: { alignItems: 'flex-end', paddingRight: 4 },

  score:      { fontSize: 16, fontWeight: '800', color: Colors.accent },
  scoreLabel: { fontSize: 10, color: Colors.textMuted },

  empty: { color: Colors.textMuted, textAlign: 'center', paddingVertical: 16 },
});