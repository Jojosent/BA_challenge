import { RoleBadge } from '@/components/shared/RoleBadge';
import { LoadingSpinner } from '@components/shared/LoadingSpinner';
import { StatCard } from '@components/shared/StatCard';
import { Card } from '@components/ui/Card';
import { Colors } from '@constants/colors';
import { useNotificationStore } from '@hooks/useNotifications';
import { useProfile } from '@hooks/useProfile';
import { DeadlineCalendar } from '@components/shared/DeadlineCalendar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { userService } from '@services/userService';
import { ImageBackground } from 'react-native';
import { TrendingUp, Zap, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  const { displayUser, isLoading, fetchProfile } = useProfile();

  const [notifCount, setNotifCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [stats, setStats] = useState({
    avgRating: 0,
    totalVoters: 0,
    totalVoteCount: 0,
    challengeCount: 0,
    wonCount: 0,
    submissionCount: 0,
    streakCount: 0,
  });

  useEffect(() => {
    userService.getStats()
      .then((data) => {
        console.log('Stats загружены:', data);
        setStats(data);
      })
      .catch((e) => console.log('Stats ошибка:', e.message));
  }, [displayUser?.id, refreshKey]);

  if (isLoading && !displayUser) return <LoadingSpinner />;

  const greeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return t('home.morningGreeting');
    if (hour < 18) return t('home.afternoonGreeting');

    return t('home.eveningGreeting');
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
              setRefreshKey((k) => k + 1);
            }}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Шапка */}
        <View style={styles.headerRow}>
          <View>
            <View style={styles.headerTextBlock}>
              <Text style={styles.greetingTitle}>
                {greeting()}, {displayUser?.username || 'User'}
              </Text>

              <Text style={styles.greetingSubtitle}>
                {t('home.readyText')}
              </Text>

              {/*
              <View style={[
                styles.streakBadge,
                stats.streakCount === 0 && styles.streakBadgeZero
              ]}>
                <Text style={[
                  styles.streakTxt,
                  stats.streakCount === 0 && styles.streakTxtZero
                ]}>
                  🔥 {stats.streakCount}
                </Text>
              </View>
              */}
            </View>
          </View>

          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={Colors.textPrimary}
            />

            {notifCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeTxt}>
                  {notifCount > 9 ? '9+' : notifCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Карточка баланса */}
        <ImageBackground
          source={require('../../assets/images/balance-bg.png')}
          style={styles.balanceCard}
          imageStyle={styles.balanceBgImage}
          resizeMode="cover"
        >
          <View style={styles.balanceContent}>
            <View style={styles.balanceMain}>
              <Text style={styles.balanceLabel}>
                {t('home.coinBalance')}
              </Text>

              <View style={styles.coinRow}>
                <Text style={styles.balanceAmount}>
                  {displayUser?.rikonCoins || 98}
                </Text>

                <Text style={styles.coinText}>
                  {t('home.rikonCoins')}
                </Text>
              </View>

              <View style={styles.ratingRow}>
                <Text style={styles.star}>★</Text>

                <Text style={styles.ratingText}>5.00</Text>

                <Text style={styles.ratingCount}>(16)</Text>
              </View>
            </View>

            <View style={styles.streakCircle}>
              <Text style={styles.streakNumber}>
                {stats.streakCount || 0}
              </Text>

              <Text style={styles.streakText}>
                {t('home.daysInRow')}
              </Text>
            </View>
          </View>
        </ImageBackground>

        {/* Статистика */}
        <Text style={styles.sectionTitle}>
          {t('home.yourStats')}
        </Text>

        <View style={styles.statsRow}>
          <StatCard
            icon={<TrendingUp size={24} color={Colors.rikon} />}
            label={t('profile.wins')}
            value={stats.wonCount}
            color={Colors.rikon}
          />

          <StatCard
            icon={<Zap size={24} color={Colors.primary} />}
            label={t('home.challenges')}
            value={stats.challengeCount}
            color={Colors.primary}
          />

          <StatCard
            icon={<Star size={24} color={Colors.warning} />}
            label={t('home.experience')}
            value={stats.avgRating > 0 ? stats.avgRating.toFixed(2) : '—'}
            color={Colors.warning}
          />
        </View>

        {/* Быстрые действия */}
        <Text style={styles.sectionTitle}>
          {t('home.quickActions')}
        </Text>

        <View style={styles.quickSection}>
          <View style={styles.quickGrid}>
            <TouchableOpacity
              style={styles.quickItem}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/challenges')}
            >
              <ImageBackground
                source={require('../../assets/images/challenge.png')}
                style={styles.quickBg}
                imageStyle={styles.quickBgImage}
                resizeMode="cover"
              >
                <View style={styles.quickOverlay}>
                  <Text style={styles.quickTitle}>
                    {t('home.challenges')}
                  </Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickItem}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/ai-assistant')}
            >
              <ImageBackground
                source={require('../../assets/images/ai.png')}
                style={styles.quickBg}
                imageStyle={styles.quickBgImage}
                resizeMode="cover"
              >
                <View style={styles.quickOverlay}>
                  <Text style={styles.quickTitle}>
                    {t('home.aiAssistant')}
                  </Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickItem}
              activeOpacity={0.85}
              onPress={() => router.push('/family')}
            >
              <ImageBackground
                source={require('../../assets/images/family.png')}
                style={styles.quickBg}
                imageStyle={styles.quickBgImage}
                resizeMode="cover"
              >
                <View style={styles.quickOverlay}>
                  <Text style={styles.quickTitle}>
                    {t('home.familyTree')}
                  </Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickItem}
              activeOpacity={0.85}
              onPress={() => router.push('/notifications')}
            >
              <ImageBackground
                source={require('../../assets/images/notification.png')}
                style={styles.quickBg}
                imageStyle={styles.quickBgImage}
                resizeMode="cover"
              >
                <View style={styles.quickOverlay}>
                  <Text style={styles.quickTitle}>
                    {t('home.notifications')}
                  </Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          </View>
        </View>

        {/* Календарь */}
        <Text style={styles.sectionTitle}>
          {t('home.taskCalendar')}
        </Text>

        <View style={styles.calendarWrapper}>
          <DeadlineCalendar key={refreshKey} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  quickSection: {
    paddingHorizontal: 20,
  },

  mainSectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginTop: 28,
    marginBottom: 16,
    paddingHorizontal: 20,
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },

  quickItem: {
    width: '48.5%',
    height: 118,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  quickBg: {
    flex: 1,
    justifyContent: 'center',
  },

  quickBgImage: {
    borderRadius: 20,
  },

  quickTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 18,
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 5,
  },

  quickOverlay: {
    height: '100%',
    width: '60%',
    justifyContent: 'center',
    paddingLeft: 18,
  },

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  calendarWrapper: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },

  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  username: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  headerTextBlock: {
    flex: 1,
  },

  greetingTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },

  greetingSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 4,
  },

  balanceCard: {
    height: 160,
    marginHorizontal: 20,
    marginTop: 26,
    borderRadius: 30,
    overflow: 'hidden',
  },

  balanceBgImage: {
    borderRadius: 30,
  },

  balanceContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 100,
    paddingRight: 60,
  },

  balanceMain: {
    flex: 1,
  },

  balanceLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },

  coinRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },

  balanceAmount: {
    color: Colors.white,
    fontSize: 54,
    fontWeight: '900',
    lineHeight: 58,
  },

  coinText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  star: {
    color: '#FFD84D',
    fontSize: 16,
    marginRight: 8,
  },

  ratingText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
    marginRight: 8,
  },

  ratingCount: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    fontWeight: '700',
  },

  streakCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  streakNumber: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 34,
  },

  streakText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 15,
  },

  streakBadge: {
    backgroundColor: Colors.error + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },

  streakTxt: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.error,
  },

  streakBadgeZero: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },

  streakTxtZero: {
    color: Colors.textMuted,
  },

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

  notifBadgeTxt: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },

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
});