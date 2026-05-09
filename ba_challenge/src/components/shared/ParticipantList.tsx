import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '@constants/colors';
import { Participant } from '@/types/index';
import { Ionicons } from '@expo/vector-icons';

interface ParticipantListProps {
  participants: Participant[];
  creatorId?: number;
  betAmount?: number;
  prizePool?: number;
  currentUserId?: number;        // ✅ кто сейчас смотрит
  onKick?: (participant: Participant) => void;  // ✅ коллбэк кика
}

const MEDAL = ['🥇', '🥈', '🥉'];

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  creatorId,
  betAmount = 0,
  prizePool = 0,
  currentUserId,
  onKick,
}) => {
  const sorted = [...participants].sort((a, b) => b.score - a.score);
  const isCreator = currentUserId === creatorId;

  const handleKick = (p: Participant) => {
    const refundMsg = betAmount > 0
      ? `\n\n${betAmount} 🪙 будут возвращены участнику.`
      : '';

    Alert.alert(
      '👢 Удалить участника?',
      `Удалить ${p.user?.username ?? 'участника'} из челленджа?${refundMsg}`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => onKick?.(p),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {sorted.map((p, index) => {
        const isThisCreator = p.userId === creatorId;
        const isMe = p.userId === currentUserId;
        const canKick = isCreator && !isThisCreator && !isMe && onKick;

        return (
          <View key={p.id} style={[styles.row, isThisCreator && styles.rowCreator]}>

            {/* Место */}
            <View style={styles.rankCol}>
              {index < 3 ? (
                <Text style={styles.medal}>{MEDAL[index]}</Text>
              ) : (
                <Text style={styles.rankNum}>#{index + 1}</Text>
              )}
            </View>

            {/* Аватар */}
            <View style={[styles.avatar, isThisCreator && styles.avatarCreator]}>
              <Text style={styles.avatarText}>
                {p.user?.username?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>

            {/* Имя + метка */}
            <View style={styles.nameCol}>
              <View style={styles.nameRow}>
                <Text style={styles.username} numberOfLines={1}>
                  {p.user?.username ?? `Участник ${p.userId}`}
                </Text>
                {isThisCreator && (
                  <View style={styles.creatorBadge}>
                    <Text style={styles.creatorBadgeTxt}>👑 Создатель</Text>
                  </View>
                )}
                {isMe && !isThisCreator && (
                  <View style={styles.meBadge}>
                    <Text style={styles.meBadgeTxt}>ты</Text>
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

            {/* Кнопка кика — только для создателя */}
            {canKick && (
              <TouchableOpacity
                style={styles.kickBtn}
                onPress={() => handleKick(p)}
              >
                <Ionicons name="person-remove-outline" size={16} color={Colors.error} />
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

  meBadge: {
    backgroundColor: Colors.primary + '25',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary + '60',
  },
  meBadgeTxt: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },

  scoreCol: { alignItems: 'flex-end', paddingRight: 4 },
  score:      { fontSize: 16, fontWeight: '800', color: Colors.accent },
  scoreLabel: { fontSize: 10, color: Colors.textMuted },

  kickBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.error + '15',
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },

  empty: { color: Colors.textMuted, textAlign: 'center', paddingVertical: 16 },
});