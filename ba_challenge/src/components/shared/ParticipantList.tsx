import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@constants/colors';
import { Participant } from '@/types/index';
import { Config } from '@constants/config';

interface ParticipantListProps {
  participants: Participant[];
  creatorId?: number;
  betAmount?: number;
  prizePool?: number;
}

const MEDAL = ['🥇', '🥈', '🥉'];

const getAvatarUrl = (avatarUrl?: string | null): string | null => {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith('http')) return avatarUrl;

  const base = Config.API_URL.replace('/api', '');
  return `${base}${avatarUrl}`;
};

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  creatorId,
}) => {
  const { t } = useTranslation();

  const sorted = [...participants].sort((a, b) => b.score - a.score);

  return (
    <View style={styles.container}>
      {sorted.map((p, index) => {
        const isCreator = p.userId === creatorId;
        const avatarUrl = getAvatarUrl(p.user?.avatarUrl);
        const initial = p.user?.username?.charAt(0).toUpperCase() ?? '?';

        return (
          <View key={p.id} style={[styles.row, isCreator && styles.rowCreator]}>
            <View style={styles.rankCol}>
              {index < 3 ? (
                <Text style={styles.medal}>{MEDAL[index]}</Text>
              ) : (
                <Text style={styles.rankNum}>#{index + 1}</Text>
              )}
            </View>

            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={[styles.avatar, isCreator && styles.avatarCreator]}
                resizeMode="cover"
                onError={() => console.log('ParticipantList avatar error:', avatarUrl)}
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  isCreator ? styles.avatarCreator : styles.avatarDefault,
                ]}
              >
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}

            <View style={styles.nameCol}>
              <View style={styles.nameRow}>
                <Text style={styles.username} numberOfLines={1}>
                  {p.user?.username ??
                    t('participantList.participantFallback', {
                      id: p.userId,
                    })}
                </Text>

                {isCreator && (
                  <View style={styles.creatorBadge}>
                    <Text style={styles.creatorBadgeTxt}>
                      {t('participantList.creator')}
                    </Text>
                  </View>
                )}
              </View>

              {p.user?.rating !== undefined && (
                <Text style={styles.rating}>
                  {t('participantList.rating', {
                    rating: p.user.rating,
                  })}
                </Text>
              )}
            </View>

            <View style={styles.scoreCol}>
              <Text style={styles.score}>{p.score}</Text>
              <Text style={styles.scoreLabel}>
                {t('participantList.points')}
              </Text>
            </View>
          </View>
        );
      })}

      {participants.length === 0 && (
        <Text style={styles.empty}>
          {t('participantList.empty')}
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

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarDefault: {
    backgroundColor: Colors.primary,
  },

  avatarCreator: {
    backgroundColor: Colors.rikon,
    borderWidth: 2,
    borderColor: Colors.rikon,
  },

  avatarText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
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

  empty: {
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
  },
});