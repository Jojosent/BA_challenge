import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Colors } from '@constants/colors';
import { Participant } from '@/types/index';

interface ParticipantListProps {
  participants: Participant[];
  creatorId?: number;
  betAmount?: number;
  prizePool?: number;
  currentUserId?: number;
  onKick?: (participant: Participant) => Promise<void>;
}

const MEDAL = ['🥇', '🥈', '🥉'];

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  creatorId,
  currentUserId,
  onKick,
}) => {
  const sorted = [...participants].sort((a, b) => b.score - a.score);

  return (
    <View style={styles.container}>
      {sorted.map((p, index) => {
        const isCreator = p.userId === creatorId;
        const isMe = p.userId === currentUserId;
        const avatarUrl = p.user?.avatarUrl;
        const canKick = !!onKick && currentUserId === creatorId && !isCreator && !isMe;

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
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarText}>
                  {p.user?.username?.charAt(0).toUpperCase() ?? '?'}
                </Text>
              )}
            </View>

            {/* Имя + метка создателя */}
            <View style={styles.nameCol}>
              <View style={styles.nameRow}>
                <Text style={styles.username} numberOfLines={1}>
                  {p.user?.username ?? `Участник ${p.userId}`}
                  {isMe && <Text style={styles.youLabel}> (ты)</Text>}
                </Text>
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

            {/* Кнопка кик */}
            {canKick && (
              <TouchableOpacity
                style={styles.kickBtn}
                onPress={() => onKick(p)}
              >
                <Text style={styles.kickBtnTxt}>✕</Text>
              </TouchableOpacity>
            )}
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
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  rowCreator: {
    backgroundColor: Colors.rikon + '08',
  },

  rankCol: { width: 32, alignItems: 'center' },
  medal: { fontSize: 18 },
  rankNum: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarCreator: {
    backgroundColor: Colors.rikon,
    borderWidth: 2,
    borderColor: Colors.rikon,
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 15 },

  nameCol: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  username: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  youLabel: { color: Colors.primary, fontWeight: '400', fontSize: 13 },
  rating: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

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
  score: { fontSize: 16, fontWeight: '800', color: Colors.accent },
  scoreLabel: { fontSize: 10, color: Colors.textMuted },

  kickBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.error + '18',
    borderWidth: 1,
    borderColor: Colors.error + '50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kickBtnTxt: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '700',
  },

  empty: { color: Colors.textMuted, textAlign: 'center', paddingVertical: 16 },
});