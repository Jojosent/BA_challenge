import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/colors';
import { voteService } from '@services/voteService';
import { useAuthStore } from '@store/authStore';
import { LoadingSpinner } from '@components/shared/LoadingSpinner';

interface RankedUser {
  id: number;
  username: string;
  avatarUrl?: string;
  rating: number;
  rikonCoins: number;
}

const MEDAL = ['🥇', '🥈', '🥉'];

export default function ScoreboardScreen() {
  const { user } = useAuthStore();
  const [rankings, setRankings]   = useState<RankedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRankings = async () => {
    try {
      setIsLoading(true);
      const data = await voteService.getGlobalRanking();
      setRankings(data);
    } catch (e) {
      console.log('Ошибка загрузки рейтинга:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRankings(); }, []);

  const myRank = rankings.findIndex((r) => r.id === user?.id) + 1;

  if (isLoading && rankings.length === 0) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchRankings}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Шапка */}
        <View style={styles.header}>
          <Text style={styles.title}>🏆 Рейтинг</Text>
          {myRank > 0 && (
            <View style={styles.myRankBadge}>
              <Text style={styles.myRankTxt}>Твоё место: #{myRank}</Text>
            </View>
          )}
        </View>

        {/* Топ 3 */}
        {rankings.length >= 3 && (
          <View style={styles.podium}>
            {/* 2 место */}
            <View style={[styles.podiumItem, styles.podiumSecond]}>
              <Text style={styles.podiumMedal}>🥈</Text>
              <View style={styles.podiumAvatar}>
                <Text style={styles.podiumAvatarTxt}>
                  {rankings[1].username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>
                {rankings[1].username}
              </Text>
              <Text style={styles.podiumRating}>
                ⭐ {rankings[1].rating}
              </Text>
              <View style={[styles.podiumBar, styles.podiumBar2]} />
            </View>

            {/* 1 место */}
            <View style={[styles.podiumItem, styles.podiumFirst]}>
              <Text style={styles.podiumMedal}>🥇</Text>
              <View style={[styles.podiumAvatar, styles.podiumAvatarFirst]}>
                <Text style={styles.podiumAvatarTxt}>
                  {rankings[0].username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>
                {rankings[0].username}
              </Text>
              <Text style={styles.podiumRating}>
                ⭐ {rankings[0].rating}
              </Text>
              <View style={[styles.podiumBar, styles.podiumBar1]} />
            </View>

            {/* 3 место */}
            <View style={[styles.podiumItem, styles.podiumThird]}>
              <Text style={styles.podiumMedal}>🥉</Text>
              <View style={styles.podiumAvatar}>
                <Text style={styles.podiumAvatarTxt}>
                  {rankings[2].username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>
                {rankings[2].username}
              </Text>
              <Text style={styles.podiumRating}>
                ⭐ {rankings[2].rating}
              </Text>
              <View style={[styles.podiumBar, styles.podiumBar3]} />
            </View>
          </View>
        )}

        {/* Полный список */}
        <Text style={styles.sectionTitle}>Все участники</Text>
        <View style={styles.list}>
          {rankings.map((u, index) => {
            const isMe = u.id === user?.id;
            return (
              <View
                key={u.id}
                style={[styles.row, isMe && styles.rowMe]}
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
                  isMe && styles.avatarMe,
                ]}>
                  <Text style={styles.avatarTxt}>
                    {u.username.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Имя */}
                <View style={styles.nameCol}>
                  <Text style={styles.username} numberOfLines={1}>
                    {u.username}
                    {isMe && (
                      <Text style={styles.youLabel}> (ты)</Text>
                    )}
                  </Text>
                  <Text style={styles.coins}>🪙 {u.rikonCoins} Rikon</Text>
                </View>

                {/* Рейтинг */}
                <View style={styles.ratingCol}>
                  <Text style={styles.ratingNum}>⭐ {u.rating}</Text>
                </View>
              </View>
            );
          })}

          {rankings.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyTitle}>Рейтинг пуст</Text>
              <Text style={styles.emptyText}>
                Участвуй в челленджах чтобы заработать очки
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  myRankBadge: {
    backgroundColor: Colors.primary + '22',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  myRankTxt: { color: Colors.primary, fontWeight: '700', fontSize: 13 },

  // Подиум
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginVertical: 20,
    gap: 8,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  podiumFirst:  {},
  podiumSecond: { marginBottom: 0 },
  podiumThird:  { marginBottom: 0 },

  podiumMedal: { fontSize: 28 },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  podiumAvatarFirst: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderColor: Colors.rikon,
    borderWidth: 3,
  },
  podiumAvatarTxt: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 18,
  },
  podiumName:   { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  podiumRating: { fontSize: 11, color: Colors.textSecondary },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    marginTop: 6,
  },
  podiumBar1: { height: 60, backgroundColor: Colors.rikon + '40' },
  podiumBar2: { height: 44, backgroundColor: Colors.textMuted + '30' },
  podiumBar3: { height: 30, backgroundColor: Colors.accent + '30' },

  // Список
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  list: { paddingHorizontal: 16, paddingBottom: 30 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowMe: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '0D',
  },

  rankCol:  { width: 36, alignItems: 'center' },
  medal:    { fontSize: 20 },
  rankNum:  { fontSize: 14, fontWeight: '700', color: Colors.textMuted },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMe: { backgroundColor: Colors.primary },
  avatarTxt: { color: Colors.white, fontWeight: '700', fontSize: 16 },

  nameCol:  { flex: 1 },
  username: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  youLabel: { color: Colors.primary, fontWeight: '400' },
  coins:    { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  ratingCol: { alignItems: 'flex-end' },
  ratingNum: { fontSize: 14, fontWeight: '700', color: Colors.warning },

  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon:  { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  emptyText:  { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});