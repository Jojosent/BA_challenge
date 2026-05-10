import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/colors';
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

// Генерируем стабильный цвет по имени пользователя
const AVATAR_COLORS = [
  '#6C63FF', '#FF6584', '#43D9AD', '#378ADD', '#D4537E',
  '#1D9E75', '#ED93B1', '#BA7517', '#EF9F27', '#5DCAA5',
  '#F0997B', '#534AB7', '#993556', '#639922', '#97C459',
];

const getAvatarColor = (username?: string): string => {
  if (!username) return Colors.primary;
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const Avatar: React.FC<{
  avatarUrl?: string | null;
  username?: string;
  size?: number;
  borderColor?: string;
  borderWidth?: number;
}> = ({ avatarUrl, username, size = 38, borderColor, borderWidth = 0 }) => {
  const radius = size / 2;
  const color = getAvatarColor(username);

  const borderStyle = borderColor
    ? { borderWidth, borderColor }
    : {};

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[{ width: size, height: size, borderRadius: radius }, borderStyle]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: color,
          justifyContent: 'center',
          alignItems: 'center',
        },
        borderStyle,
      ]}
    >
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.42 }}>
        {username?.charAt(0).toUpperCase() ?? '?'}
      </Text>
    </View>
  );
};

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  creatorId,
  currentUserId,
  onKick,
}) => {
  const { t } = useTranslation();

  const sorted = [...participants].sort((a, b) => b.score - a.score);

  return (
    <View style={styles.container}>
      {sorted.map((p, index) => {
        const isCreator = p.userId === creatorId;
        const isMe = p.userId === currentUserId;
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
            <Avatar
              avatarUrl={p.user?.avatarUrl}
              username={p.user?.username}
              size={38}
              borderColor={isCreator ? Colors.rikon : undefined}
              borderWidth={isCreator ? 2 : 0}
            />

            {/* Имя + метки */}
            <View style={styles.nameCol}>
              <View style={styles.nameRow}>
                <Text style={styles.username} numberOfLines={1}>
                  {p.user?.username ?? t('participants.participantFallback', { id: p.userId })}
                  {isMe && (
                    <Text style={styles.youLabel}>
                      {' '}
                      {t('participants.youLabel')}
                    </Text>
                  )}
                </Text>

                {isCreator && (
                  <View style={styles.creatorBadge}>
                    <Text style={styles.creatorBadgeTxt}>
                      👑 {t('participants.creator')}
                    </Text>
                  </View>
                )}
              </View>

              {p.user?.rating !== undefined && (
                <Text style={styles.rating}>
                  ⭐ {t('participants.rating')} {p.user.rating}
                </Text>
              )}
            </View>

            {/* Очки */}
            <View style={styles.scoreCol}>
              <Text style={styles.score}>{p.score}</Text>
              <Text style={styles.scoreLabel}>
                {t('participants.points')}
              </Text>
            </View>

            {/* Кик */}
            {canKick && (
              <TouchableOpacity style={styles.kickBtn} onPress={() => onKick(p)}>
                <Text style={styles.kickBtnTxt}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {participants.length === 0 && (
        <Text style={styles.empty}>
          {t('participants.empty')}
        </Text>
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

  rankCol: {
    width: 32,
    alignItems: 'center',
  },

  medal: {
    fontSize: 18,
  },

  rankNum: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },

  nameCol: {
    flex: 1,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },

  username: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  youLabel: {
    color: Colors.primary,
    fontWeight: '400',
    fontSize: 13,
  },

  rating: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },

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

  scoreCol: {
    alignItems: 'flex-end',
    paddingRight: 4,
  },

  score: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.accent,
  },

  scoreLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },

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

  empty: {
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
  },
});