import { Challenge } from '@/types';
import { LoadingSpinner } from '@components/shared/LoadingSpinner';
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
import { useTheme } from '@/theme/ThemeContext';

type FilterType = 'all' | 'active' | 'pending' | 'completed';

const FILTERS: { key: FilterType; labelKey: string }[] = [
  { key: 'all', labelKey: 'challenges.filterAll' },
  { key: 'active', labelKey: 'challenges.filterActive' },
  { key: 'pending', labelKey: 'challenges.filterPending' },
  { key: 'completed', labelKey: 'challenges.filterCompleted' },
];

function getStatus(status: string, t: any, theme: any) {
  switch (status) {
    case 'active':
      return { label: t('challengeStatus.active'), color: theme.emerald, bg: theme.emerald + '20', icon: 'flash' as const };
    case 'pending':
      return { label: t('challengeStatus.pending'), color: theme.amber, bg: theme.amber + '20', icon: 'time' as const };
    case 'completed':
      return { label: t('challengeStatus.completed'), color: theme.textMuted, bg: theme.textMuted + '20', icon: 'checkmark-circle' as const };
    default:
      return { label: status, color: theme.primary, bg: theme.primaryLight, icon: 'ellipse' as const };
  }
}

function ChallengeCard({ challenge, index, t }: any) {
  const { theme } = useTheme();
  const st = getStatus(challenge.status, t, theme);
  const accents = [theme.primary, theme.emerald, theme.accent, theme.amber, theme.rose];
  const accent = accents[index % accents.length];

  return (
    <View style={[card.wrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      
      <View style={[card.glow, { backgroundColor: accent }]} />

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

        <Text style={[card.title, { color: theme.textPrimary }]} numberOfLines={2}>
          {challenge.title}
        </Text>

        {(challenge.startDate || challenge.endDate) && (
          <View style={card.dates}>
            {challenge.startDate && (
              <Text style={[card.dateText, { color: theme.textSecondary }]}>
                📅 {challenge.startDate}
              </Text>
            )}
            {challenge.endDate && (
              <Text style={[card.dateText, { color: theme.textSecondary }]}>
                ⏳ {challenge.endDate}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

export default function ChallengesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
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

  if (isLoading && challenges.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {t('challenges.title')}
        </Text>

        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/challenge/create')}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.textPrimary }]}
          placeholder={t('challenges.search')}
          placeholderTextColor={theme.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* FILTERS */}
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === f.key ? theme.primary : theme.surface,
                borderColor: theme.border,
              },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={{ color: filter === f.key ? '#fff' : theme.textSecondary }}>
              {t(f.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LIST */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => router.push(`/challenge/${item.id}`)}>
            <ChallengeCard challenge={item} index={index} t={t} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchChallenges}
            tintColor={theme.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

/* ===== STYLES (ONLY UI UPGRADE) ===== */

const card = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  glow: {
    height: 4,
    width: '100%',
  },
  body: {
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  betBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  betText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  dates: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  dateText: {
    fontSize: 12,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
  },

  createBtn: {
    padding: 10,
    borderRadius: 12,
  },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 8,
  },

  searchInput: {
    flex: 1,
  },

  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },

  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },

  list: {
    padding: 16,
  },
});