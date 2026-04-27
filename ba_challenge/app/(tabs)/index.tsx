import { RoleBadge } from '@/components/shared/RoleBadge';
import { LoadingSpinner } from '@components/shared/LoadingSpinner';
import { StatCard } from '@components/shared/StatCard';
import { Card } from '@components/ui/Card';
import { Colors } from '@constants/colors';
import { useProfile } from '@hooks/useProfile';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { userService } from '@services/userService';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '@hooks/useNotifications';

import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { displayUser, isLoading, fetchProfile } = useProfile();

  // Берём счётчик из глобального store — polling уже идёт в _layout.tsx
  const notifCount = useNotificationStore((state) => state.count);

  const [stats, setStats] = useState({
    avgRating: 0,
    totalVoters: 0,
    totalVoteCount: 0,
    challengeCount: 0,
    wonCount: 0,
    submissionCount: 0,
  });

  useEffect(() => {
    userService.getStats()
      .then((data) => {
        console.log('📊 Stats загружены:', data);
        setStats(data);
      })
      .catch((e) => console.log('❌ Stats ошибка:', e.message));
  }, [displayUser?.id]);

  if (isLoading && !displayUser) return <LoadingSpinner />;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              fetchProfile();
              useNotificationStore.getState().refresh();
            }}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Шапка */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{greeting()} 👋</Text>
            <Text style={styles.username}>
              {displayUser?.username || 'Пользователь'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
            {notifCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeTxt}>
                  {notifCount > 9 ? '9+' : notifCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Карточка баланса Rikon */}
        <View style={styles.rikonCard}>
          <View style={styles.rikonLeft}>
            <Text style={styles.rikonLabel}>Баланс монет</Text>
            <Text style={styles.rikonAmount}>
              🪙 {displayUser?.rikonCoins ?? 0}
            </Text>
            <Text style={styles.rikonSub}>Rikon Coins</Text>
          </View>
          <View style={styles.rikonRight}>
            {displayUser?.role && <RoleBadge role={displayUser.role} />}
            <Text style={styles.rikonRating}>
              ⭐ {stats.avgRating > 0
                ? `${stats.avgRating.toFixed(2)} (${stats.totalVoters})`
                : 'нет оценок'}
            </Text>
          </View>
        </View>

        {/* Статистика */}
        <Text style={styles.sectionTitle}>Твоя статистика</Text>
        <View style={styles.statsRow}>
          <StatCard
            icon="🏆"
            label="Победы"
            value={stats.wonCount}
            color={Colors.rikon}
          />
          <StatCard
            icon="⚡"
            label="Челленджи"
            value={stats.challengeCount}
            color={Colors.primary}
          />
          <StatCard
            icon="⭐"
            label={`(${stats.totalVoters})`}
            value={stats.avgRating > 0 ? stats.avgRating.toFixed(2) : '—'}
            color={Colors.warning}
          />
        </View>

        {/* Быстрые действия */}
        <Text style={styles.sectionTitle}>Быстрые действия</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/challenges')}
          >
            <Text style={styles.actionIcon}>🎯</Text>
            <Text style={styles.actionLabel}>Челленджи</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => {}}>
            <Text style={styles.actionIcon}>🤖</Text>
            <Text style={styles.actionLabel}>AI Генератор</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/family')}
          >
            <Text style={styles.actionIcon}>🌳</Text>
            <Text style={styles.actionLabel}>Семейное дерево</Text>
          </TouchableOpacity>

          {/* Уведомления с живым бейджем */}
          <TouchableOpacity
            style={[styles.actionCard, notifCount > 0 && styles.actionCardAlert]}
            onPress={() => router.push('/notifications')}
          >
            <View style={styles.actionIconWrapper}>
              <Text style={styles.actionIcon}>🔔</Text>
              {notifCount > 0 && (
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeTxt}>
                    {notifCount > 9 ? '9+' : notifCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[
              styles.actionLabel,
              notifCount > 0 && styles.actionLabelAlert,
            ]}>
              Уведомления
            </Text>
          </TouchableOpacity>
        </View>

        {/* Лента активности */}
        <Text style={styles.sectionTitle}>Последние события</Text>
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🌟</Text>
          <Text style={styles.emptyTitle}>Пока тихо!</Text>
          <Text style={styles.emptyText}>
            Создай первый челлендж и начни соревноваться
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push('/(tabs)/challenges')}
          >
            <Text style={styles.emptyBtnText}>Создать челлендж</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: { fontSize: 14, color: Colors.textSecondary },
  username: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },

  notifBtn: {
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  notifBadgeTxt: { color: Colors.white, fontSize: 10, fontWeight: '700' },

  rikonCard: {
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rikonLeft: {},
  rikonLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  rikonAmount: { fontSize: 32, fontWeight: '800', color: Colors.white },
  rikonSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  rikonRight: { alignItems: 'flex-end', gap: 8 },
  rikonRating: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 8 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    width: '46%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionCardAlert: {
    borderColor: Colors.error + '60',
    backgroundColor: Colors.error + '08',
  },
  actionIconWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  actionIcon: { fontSize: 32 },
  actionBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: Colors.error,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  actionBadgeTxt: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  actionLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  actionLabelAlert: { color: Colors.error },

  emptyCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
});