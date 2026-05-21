import { RoleBadge } from '@/components/shared/RoleBadge';
import { LoadingSpinner } from '@components/shared/LoadingSpinner';
import { StatCard } from '@components/shared/StatCard';
import { Card } from '@components/ui/Card';
import { useNotificationStore } from '@hooks/useNotifications';
import { useProfile } from '@hooks/useProfile';
import { DeadlineCalendar } from '@components/shared/DeadlineCalendar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { userService } from '@services/userService';
import { notificationService } from '@services/notificationService';
import { ImageBackground, Dimensions } from 'react-native';
import { TrendingUp, Zap, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { ThemePicker } from '@/theme/ThemePicker';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const CARD_WIDTH = width - 40;
const IS_SMALL = width < 380;

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const { displayUser, isLoading, fetchProfile } = useProfile();
  const { theme } = useTheme();

  const [notifCount, setNotifCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showThemePicker, setShowThemePicker] = useState(false);

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
    userService
      .getStats()
      .then(setStats)
      .catch((e) => console.log('Stats ошибка:', e.message));
  }, [refreshKey]);

  useEffect(() => {
    fetchProfile();
    notificationService
      .getCount()
      .then(setNotifCount)
      .catch((e) => console.log('Unread count error:', e));
  }, [refreshKey]);

  if (isLoading && !displayUser) return <LoadingSpinner />;

  const greeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return t('home.morningGreeting');
    if (hrs < 18) return t('home.afternoonGreeting');
    return t('home.eveningGreeting');
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg }]}
      edges={['top']}
    >
      <ThemePicker visible={showThemePicker} onClose={() => setShowThemePicker(false)} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              fetchProfile();
              setRefreshKey((k) => k + 1);
            }}
            tintColor={theme.primary}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextBlock}>
            <Text style={[styles.greetingTitle, { color: theme.textPrimary }]}>
              {greeting()}, {displayUser?.username || 'User'}
            </Text>

            <Text style={[styles.greetingSubtitle, { color: theme.textSecondary }]}>
              {t('home.readyText')}
            </Text>
          </View>

          <View style={styles.headerButtonsRow}>
            <TouchableOpacity
              style={[
                styles.themeBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => setShowThemePicker(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="color-palette-outline"
                size={22}
                color={theme.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.notifBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color={theme.textPrimary}
              />

              {notifCount > 0 && (
                <View style={[styles.notifBadge, { backgroundColor: theme.rose }]}>
                  <Text style={styles.notifBadgeTxt}>
                    {notifCount > 9 ? '9+' : notifCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* BALANCE */}
        <ImageBackground
          source={require('../../assets/images/balance-bg.png')}
          style={styles.balanceCard}
          imageStyle={styles.balanceBgImage}
          resizeMode="stretch"
        >
          <View style={styles.balanceContent}>
            <View style={styles.balanceMain}>
              <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>
                {t('home.coinBalance')}
              </Text>

              <View style={styles.coinRow}>
                <Text style={[styles.balanceAmount, { color: theme.textPrimary }]}>
                  {displayUser?.rikonCoins || 98}
                </Text>

                <Text style={[styles.coinText, { color: theme.textPrimary }]}>
                  {t('home.rikonCoins')}
                </Text>
              </View>

              <View style={styles.ratingRow}>
                <Text style={styles.star}>★</Text>
                <Text style={[styles.ratingText, { color: theme.textPrimary }]}>
                  5.00
                </Text>
                <Text style={[styles.ratingCount, { color: theme.textSecondary }]}>
                  (16)
                </Text>
              </View>
            </View>

            <View style={[styles.streakCircle, { borderColor: theme.border }]}>
              <Text style={[styles.streakNumber, { color: theme.textPrimary }]}>
                {stats.streakCount || 0}
              </Text>

              <Text style={[styles.streakText, { color: theme.textPrimary }]}>
                {t('home.daysInRow')}
              </Text>
            </View>
          </View>
        </ImageBackground>

        {/* STATS */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {t('home.yourStats')}
        </Text>

        <View style={styles.statsRow}>
          <StatCard
            icon={<TrendingUp size={24} color={theme.primary} />}
            label={t('profile.wins')}
            value={stats.wonCount}
            color={theme.primary}
          />

          <StatCard
            icon={<Zap size={24} color={theme.primary} />}
            label={t('home.challenges')}
            value={stats.challengeCount}
            color={theme.primary}
          />

          <StatCard
            icon={<Star size={24} color={theme.warning} />}
            label={t('home.experience')}
            value={stats.avgRating > 0 ? stats.avgRating.toFixed(2) : '—'}
            color={theme.warning}
          />
        </View>

        {/* QUICK ACTIONS */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {t('home.quickActions')}
        </Text>

        <View style={styles.quickSection}>
          <View style={styles.quickGrid}>
            <TouchableOpacity
              style={[styles.quickItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => router.push('/(tabs)/challenges')}
            >
              <ImageBackground
                source={require('../../assets/images/challenge.png')}
                style={styles.quickBg}
                imageStyle={styles.quickBgImage}
              >
                <View style={styles.quickOverlay}>
                  <Text style={[styles.quickTitle, { color: theme.textPrimary }]}>
                    {t('home.challenges')}
                  </Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => router.push('/family')}
            >
              <ImageBackground
                source={require('../../assets/images/family.png')}
                style={styles.quickBg}
                imageStyle={styles.quickBgImage}
              >
                <View style={styles.quickOverlay}>
                  <Text style={[styles.quickTitle, { color: theme.textPrimary }]}>
                    {t('home.familyTree')}
                  </Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => router.push('/notifications')}
            >
              <ImageBackground
                source={require('../../assets/images/notification.png')}
                style={styles.quickBg}
                imageStyle={styles.quickBgImage}
              >
                <View style={styles.quickOverlay}>
                  <Text style={[styles.quickTitle, { color: theme.textPrimary }]}>
                    {t('home.notifications')}
                  </Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          </View>
        </View>

        {/* CALENDAR */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
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
  container: { flex: 1 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },

  headerTextBlock: { flex: 1 },

  greetingTitle: { fontSize: 28, fontWeight: '900' },

  greetingSubtitle: { fontSize: 15, marginTop: 4 },

  headerButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },

  themeBtn: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },

  notifBtn: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },

  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 10,
    paddingHorizontal: 4,
  },

  notifBadgeTxt: { color: '#fff', fontSize: 10 },

  balanceCard: {
    width: CARD_WIDTH,
    height: IS_SMALL ? 145 : 160,
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 30,
    overflow: 'hidden',
  },

  balanceBgImage: {
    borderRadius: 30,
    resizeMode: 'cover',
  },

  balanceContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: width * 0.24,
    paddingRight: width * 0.06,
  },

  balanceMain: {
    width: '60%',
  },

  balanceLabel: { fontSize: 16 },

  balanceAmount: {
    fontSize: IS_SMALL ? 40 : 50,
    fontWeight: '900',
  },

  coinRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },

  coinText: {},

  ratingRow: { flexDirection: 'row', marginTop: 10 },

  star: { color: '#FFD84D' },

  ratingText: { marginHorizontal: 6 },

  ratingCount: {},

  streakCircle: {
    width: IS_SMALL ? 68 : 80,
    height: IS_SMALL ? 68 : 80,
    borderRadius: IS_SMALL ? 34 : 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },

  streakNumber: { fontSize: 24, fontWeight: '900' },

  streakText: { fontSize: 12 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginTop: 10,
  },

  statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 10},

  quickSection: { paddingHorizontal: 20 },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  quickItem: {
    width: '48%',
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    marginTop: 10,
  },

  quickBg: { flex: 1, justifyContent: 'center' },

  quickOverlay: { paddingLeft: 16 },

  quickTitle: { fontWeight: '900', fontSize: 14 },

  calendarWrapper: { padding: 20 },
});