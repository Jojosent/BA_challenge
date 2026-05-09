import { LoadingSpinner } from '@components/shared/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';
import { useChallenge } from '@hooks/useChallenge';
import { Challenge } from '@/types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const D = {
  bg: '#F6F4FF',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF0FF',
  border: '#E4DFFF',

  violet: '#7C5CFC',
  violetLight: '#EDE9FF',
  violetDark: '#5B3FD4',

  emerald: '#10B981',
  emeraldLight: '#D1FAE5',

  amber: '#F59E0B',
  amberLight: '#FEF3C7',

  rose: '#F43F5E',
  roseLight: '#FFE4E6',

  sky: '#0EA5E9',
  skyLight: '#E0F2FE',

  textPrimary: '#1A1040',
  textSecondary: '#6B7280',
  textMuted: '#A0A8BF',
};

type FilterType = 'all' | 'active' | 'pending' | 'completed';

const FILTERS: { key: FilterType; label: string; color: string }[] = [
  { key: 'all',       label: 'Барлығы',  color: D.violet },
  { key: 'active',    label: 'Активті',  color: D.emerald },
  { key: 'pending',   label: 'Күту',     color: D.amber },
  { key: 'completed', label: 'Аяқталды', color: D.textMuted },
];

function getStatus(status: string) {
  switch (status) {
    case 'active':    return { label: 'Активті',   color: D.emerald,  bg: D.emeraldLight, icon: 'flash' as const };
    case 'pending':   return { label: 'Күту',      color: D.amber,    bg: D.amberLight,   icon: 'time' as const };
    case 'completed': return { label: 'Аяқталды',  color: D.textMuted, bg: '#F1F5F9',    icon: 'checkmark-circle' as const };
    default:          return { label: status,       color: D.violet,   bg: D.violetLight,  icon: 'ellipse' as const };
  }
}

// ─── Challenge Card ────────────────────────────────────────────────────────────
const ACCENTS = [D.violet, D.emerald, D.sky, D.rose, D.amber];
const ACCENT_LIGHTS = [D.violetLight, D.emeraldLight, D.skyLight, D.roseLight, D.amberLight];

function ChallengeCard({ challenge, index }: { challenge: Challenge; index: number }) {
  const st = getStatus(challenge.status);
  const accent = ACCENTS[index % ACCENTS.length];
  const accentLight = ACCENT_LIGHTS[index % ACCENT_LIGHTS.length];

  return (
    <View style={card.wrapper}>
      <View style={[card.stripe, { backgroundColor: accent }]} />
      <View style={card.body}>
        <View style={card.topRow}>
          <View style={[card.statusPill, { backgroundColor: st.bg }]}>
            <Ionicons name={st.icon} size={11} color={st.color} />
            <Text style={[card.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
          {challenge.betAmount > 0 && (
            <View style={[card.betBadge, { backgroundColor: accentLight }]}>
              <Ionicons name="diamond" size={11} color={accent} />
              <Text style={[card.betText, { color: accent }]}>{challenge.betAmount} RC</Text>
            </View>
          )}
        </View>

        <Text style={card.title} numberOfLines={2}>{challenge.title}</Text>

        {(challenge.startDate || challenge.endDate) && (
          <View style={card.dates}>
            {challenge.startDate && (
              <View style={card.dateItem}>
                <Ionicons name="play-circle-outline" size={13} color={D.textMuted} />
                <Text style={card.dateText}>{challenge.startDate}</Text>
              </View>
            )}
            {challenge.endDate && (
              <View style={card.dateItem}>
                <Ionicons name="stop-circle-outline" size={13} color={D.textMuted} />
                <Text style={card.dateText}>{challenge.endDate}</Text>
              </View>
            )}
          </View>
        )}

        {challenge.status === 'active' && (
          <View style={card.progressWrap}>
            <View style={card.progressTrack}>
              <View style={[card.progressFill, { backgroundColor: accent, width: '42%' }]} />
            </View>
            <Text style={[card.progressLabel, { color: accent }]}>42%</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const card = StyleSheet.create({
  wrapper: {
    backgroundColor: D.surface,
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: D.border,
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  stripe: { height: 4 },
  body: { padding: 16, gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99,
  },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  betBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99,
  },
  betText: { fontSize: 11, fontWeight: '700' },
  title: {
    fontSize: 17, fontWeight: '800', color: D.textPrimary,
    lineHeight: 24, letterSpacing: -0.4,
  },
  dates: { flexDirection: 'row', gap: 16 },
  dateItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateText: { fontSize: 12, color: D.textMuted, fontWeight: '500' },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  progressTrack: {
    flex: 1, height: 6, backgroundColor: D.surfaceAlt,
    borderRadius: 99, overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 99 },
  progressLabel: { fontSize: 11, fontWeight: '700', minWidth: 32, textAlign: 'right' },
});

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function ChallengesScreen() {
  const router = useRouter();
  const { challenges, isLoading, fetchChallenges } = useChallenge();
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchChallenges(); }, []);

  const filtered = challenges.filter((c: Challenge) => {
    const matchesFilter = filter === 'all' || c.status === filter;
    const matchesSearch =
      search.trim() === '' || c.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (isLoading && challenges.length === 0) return <LoadingSpinner />;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* HEADER */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Челлендждер</Text>
        </View>
        <TouchableOpacity style={s.createBtn} onPress={() => router.push('/challenge/create')}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* STATS */}
      <View style={s.statsRow}>
        {[
          { label: 'Барлығы',  value: challenges.length,                                       color: D.violet,  bg: D.violetLight },
          { label: 'Активті',  value: challenges.filter(c => c.status === 'active').length,    color: D.emerald, bg: D.emeraldLight },
          { label: 'Аяқталды', value: challenges.filter(c => c.status === 'completed').length, color: D.amber,   bg: D.amberLight },
        ].map((stat) => (
          <View key={stat.label} style={[s.statCard, { borderTopColor: stat.color, backgroundColor: stat.bg }]}>
            <Text style={[s.statNum, { color: stat.color }]}>{stat.value}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* SEARCH */}
      <View style={s.searchBox}>
        <Ionicons name="search" size={16} color={D.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Іздеу..."
          placeholderTextColor={D.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={17} color={D.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* FILTERS */}
      <View style={s.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterChip, filter === f.key && { backgroundColor: f.color, borderColor: f.color }]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[s.filterLabel, filter === f.key && { color: '#fff' }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LIST */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => <ChallengeCard challenge={item} index={index} />}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchChallenges} tintColor={D.violet} />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="layers-outline" size={30} color={D.violet} />
            </View>
            <Text style={s.emptyTitle}>Челлендж жоқ</Text>
            <Text style={s.emptyText}>Алғашқы челленджіңді жасап, мақсатқа қадам жаса</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/challenge/create')}>
              <Ionicons name="add-circle" size={18} color="#fff" />
              <Text style={s.emptyBtnText}>Жасау</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: D.bg },

  header: {
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.violet, marginBottom: 2 },
  title: { fontSize: 32, fontWeight: '900', color: D.textPrimary, letterSpacing: -1 },
  createBtn: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: D.violet,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: D.violet, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },

  statsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginBottom: 14 },
  statCard: {
    flex: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 10,
    alignItems: 'center', borderTopWidth: 3, borderWidth: 1, borderColor: D.border,
  },
  statNum: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: D.textSecondary, fontWeight: '600', marginTop: 2 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: D.surface,
    marginHorizontal: 20, borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: 12, gap: 10, borderWidth: 1.5, borderColor: D.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: D.textPrimary, fontWeight: '500' },

  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 12, marginBottom: 4 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99,
    backgroundColor: D.surface, borderWidth: 1.5, borderColor: D.border,
  },
  filterLabel: { fontSize: 12, fontWeight: '700', color: D.textSecondary },

  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  empty: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 24, backgroundColor: D.violetLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    shadowColor: D.violet, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 5,
  },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: D.textPrimary, letterSpacing: -0.4 },
  emptyText: { fontSize: 13, color: D.textSecondary, textAlign: 'center', lineHeight: 20, maxWidth: 240 },
  emptyBtn: {
    marginTop: 12, backgroundColor: D.violet, paddingHorizontal: 28,
    paddingVertical: 14, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: D.violet, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});