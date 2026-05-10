import { Challenge } from '@/types';
import { LoadingSpinner } from '@components/shared/LoadingSpinner';
import { Colors } from '@constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useChallenge } from '@hooks/useChallenge';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FilterType = 'all' | 'active' | 'pending' | 'completed';

const FILTERS: { key: FilterType; labelKey: string }[] = [
  { key: 'all', labelKey: 'challenges.filterAll' },
  { key: 'active', labelKey: 'challenges.filterActive' },
  { key: 'pending', labelKey: 'challenges.filterPending' },
  { key: 'completed', labelKey: 'challenges.filterCompleted' },
];

function getStatus(status: string, t: any) {
  switch (status) {
    case 'active':
      return {
        label: t('challengeStatus.active'),
        color: Colors.success,
        bg: '#D1FAE5',
        icon: 'flash' as const,
      };
    case 'pending':
      return {
        label: t('challengeStatus.pending'),
        color: Colors.warning,
        bg: '#FEF3C7',
        icon: 'time' as const,
      };
    case 'completed':
      return {
        label: t('challengeStatus.completed'),
        color: Colors.textMuted,
        bg: '#F1F5F9',
        icon: 'checkmark-circle' as const,
      };
    default:
      return {
        label: status,
        color: Colors.primary,
        bg: '#EDE9FF',
        icon: 'ellipse' as const,
      };
  }
}

const ACCENTS = [
  Colors.primary,
  Colors.success,
  Colors.info,
  Colors.secondary,
  Colors.warning,
];

function ChallengeCard({
  challenge,
  index,
  t,
}: {
  challenge: Challenge;
  index: number;
  t: any;
}) {
  const st = getStatus(challenge.status, t);
  const accent = ACCENTS[index % ACCENTS.length];

  return (
    <View style={card.wrapper}>
      <View style={[card.stripe, { backgroundColor: accent }]} />

      <View style={card.body}>
        <View style={card.topRow}>
          <View style={[card.statusPill, { backgroundColor: st.bg }]}>
            <Ionicons name={st.icon} size={12} color={st.color} />
            <Text style={[card.statusText, { color: st.color }]}>
              {st.label}
            </Text>
          </View>

          {challenge.betAmount > 0 && (
            <View style={[card.betBadge, { backgroundColor: accent + '20' }]}>
              <Ionicons name="diamond" size={12} color={accent} />
              <Text style={[card.betText, { color: accent }]}>
                {challenge.betAmount} RC
              </Text>
            </View>
          )}
        </View>

        <Text style={card.title} numberOfLines={2}>
          {challenge.title}
        </Text>

        {(challenge.startDate || challenge.endDate) && (
          <View style={card.dates}>
            {challenge.startDate && (
              <Text style={card.dateText}>📅 {challenge.startDate}</Text>
            )}
            {challenge.endDate && (
              <Text style={card.dateText}>⏳ {challenge.endDate}</Text>
            )}
          </View>
        )}

        {challenge.status === 'active' && (
          <View style={card.progressWrap}>
            <View style={card.progressTrack}>
              <View
                style={[
                  card.progressFill,
                  { backgroundColor: accent, width: '42%' },
                ]}
              />
            </View>
            <Text style={[card.progressLabel, { color: accent }]}>42%</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function ChallengesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { challenges, isLoading, fetchChallenges } = useChallenge();

  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchChallenges();
    }, [fetchChallenges])
  );

  const filtered = challenges.filter((c: Challenge) => {
    const matchesFilter = filter === 'all' || c.status === filter;
    const matchesSearch =
      search.trim() === '' ||
      c.title.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: challenges.length,
    active: challenges.filter((c) => c.status === 'active').length,
    pending: challenges.filter((c) => c.status === 'pending').length,
    completed: challenges.filter((c) => c.status === 'completed').length,
  };

  if (isLoading && challenges.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('challenges.title')}</Text>

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/challenge/create')}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('challenges.search')}
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filtersRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f.key && styles.filterTextActive,
              ]}
            >
              {t(f.labelKey)}
            </Text>

            {counts[f.key] > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeTxt}>{counts[f.key]}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push(`/challenge/${item.id}`)}
          >
            <ChallengeCard challenge={item} index={index} t={t} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchChallenges}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="layers-outline" size={40} color={Colors.primary} />
            <Text style={styles.emptyTitle}>{t('challenges.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('challenges.emptyText')}</Text>

            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/challenge/create')}
            >
              <Text style={styles.emptyBtnText}>
                {t('challenges.createChallenge')}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const card = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stripe: { height: 4 },
  body: { padding: 14, gap: 10 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  betBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  betText: { fontSize: 12, fontWeight: '700' },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dates: { flexDirection: 'row', gap: 12 },
  dateText: { fontSize: 12, color: Colors.textMuted },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
  },
  progressFill: { height: 6, borderRadius: 999 },
  progressLabel: { fontSize: 12, fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  createBtn: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 10,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  searchInput: { flex: 1, padding: 10, color: Colors.textPrimary },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  filterActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: { fontSize: 13, color: Colors.textSecondary },
  filterTextActive: { color: '#fff' },
  filterBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 6,
  },
  filterBadgeTxt: { fontSize: 11 },
  list: { padding: 16 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 10 },
  emptyText: { color: Colors.textMuted, marginTop: 4 },
  emptyBtn: {
    marginTop: 14,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
});