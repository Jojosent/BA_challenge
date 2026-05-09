import { Header } from '@components/shared/Header';
import { Button } from '@components/ui/Button';
import { DatePicker } from '@components/ui/DatePicker';
import { Input } from '@components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useChallenge } from '@hooks/useChallenge';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const D = {
  bg: '#F6F4FF',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF0FF',
  border: '#E4DFFF',

  violet: '#7C5CFC',
  violetLight: '#EDE9FF',

  emerald: '#10B981',
  emeraldLight: '#D1FAE5',

  amber: '#F59E0B',
  amberLight: '#FEF3C7',

  rose: '#F43F5E',
  roseLight: '#FFE4E6',

  textPrimary: '#1A1040',
  textSecondary: '#6B7280',
  textMuted: '#A0A8BF',
};

// ─── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  title: z.string().min(3, 'Минимум 3 символ'),
  description: z.string().min(10, 'Минимум 10 символ'),
  betAmount: z.string().optional(),
  password: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

// ─── Visibility options ────────────────────────────────────────────────────────
const VISIBILITY: {
  key: 'public' | 'secret' | 'protected';
  label: string;
  sublabel: string;
  icon: any;
  color: string;
  bg: string;
}[] = [
  { key: 'public',    label: 'Публичный',    sublabel: 'Барлығына көрінеді', icon: 'globe-outline',            color: D.emerald, bg: D.emeraldLight },
  { key: 'protected', label: 'Құпиясөзбен', sublabel: 'Кіруге пароль керек', icon: 'shield-checkmark-outline', color: D.amber,   bg: D.amberLight },
  { key: 'secret',    label: 'Шақыру',       sublabel: 'Тек шақырылғандар',   icon: 'lock-closed-outline',      color: D.rose,    bg: D.roseLight },
];

// ─── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <View style={sec.row}>
      <Text style={sec.text}>{label}</Text>
      <View style={sec.line} />
    </View>
  );
}
const sec = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 12 },
  text: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8, color: D.violet, textTransform: 'uppercase' },
  line: { flex: 1, height: 1.5, backgroundColor: D.border },
});

// ─── Visibility Card ───────────────────────────────────────────────────────────
function VisCard({
  opt, selected, onPress,
}: {
  opt: typeof VISIBILITY[0];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        vis.card,
        selected && { borderColor: opt.color, backgroundColor: opt.bg },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[vis.iconBox, { backgroundColor: selected ? opt.color : D.surfaceAlt }]}>
        <Ionicons name={opt.icon} size={18} color={selected ? '#fff' : D.textMuted} />
      </View>
      <Text style={[vis.label, selected && { color: opt.color }]}>{opt.label}</Text>
      <Text style={vis.sub}>{opt.sublabel}</Text>
      {selected && (
        <View style={[vis.check, { backgroundColor: opt.color }]}>
          <Ionicons name="checkmark" size={9} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}
const vis = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: D.surface, borderRadius: 16,
    padding: 14, alignItems: 'center', borderWidth: 1.5,
    borderColor: D.border, gap: 6, position: 'relative',
  },
  iconBox: {
    width: 42, height: 42, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  label: { fontSize: 11, fontWeight: '800', color: D.textSecondary, textAlign: 'center' },
  sub: { fontSize: 9, color: D.textMuted, textAlign: 'center', lineHeight: 13 },
  check: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
});

// ─── Info Banner ───────────────────────────────────────────────────────────────
function InfoBanner({ icon, text, color, bg }: { icon: any; text: string; color: string; bg: string }) {
  return (
    <View style={[ib.wrap, { backgroundColor: bg, borderColor: color + '40' }]}>
      <View style={[ib.iconBox, { backgroundColor: color + '25' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={ib.text}>{text}</Text>
    </View>
  );
}
const ib = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1,
  },
  iconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, fontSize: 13, color: D.textSecondary, lineHeight: 19 },
});

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function CreateChallengeScreen() {
  const router = useRouter();
  const { createChallenge, isLoading } = useChallenge();

  const [visibility, setVisibility] = useState<'public' | 'secret' | 'protected'>('public');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { betAmount: '0', password: '' },
  });

  const getDayCount = () => {
    if (!startDate || !endDate) return 0;
    return Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000);
  };

  const validateDates = () => {
    if (!startDate) { setDateError('Басталу күнін таңда'); return false; }
    if (!endDate) { setDateError('Аяқталу күнін таңда'); return false; }
    if (getDayCount() < 1) { setDateError('Аяқталу күні кеш болуы керек'); return false; }
    setDateError('');
    return true;
  };

  const onSubmit = async (data: FormData) => {
    if (!validateDates()) return;
    if (visibility === 'protected' && !data.password?.trim()) {
      Alert.alert('Қате', 'Қорғалған челлендж үшін құпиясөз керек');
      return;
    }
    const challenge = await createChallenge({
      title: data.title,
      description: data.description,
      startDate,
      endDate,
      visibility,
      betAmount: parseInt(data.betAmount || '0') || 0,
      ...(visibility === 'protected' && { password: data.password?.trim() }),
    } as any);

    if (challenge) {
      Alert.alert('Челлендж жасалды', 'AI арқылы тапсырмалар қос', [
        { text: 'OK', onPress: () => router.replace(`/challenge/${challenge.id}`) },
      ]);
    }
  };

  const dayCount = getDayCount();

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <Header title="Жаңа челлендж" showBack />

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Негізгі ── */}
        <SectionLabel label="Негізгі" />

        <Controller
          control={control} name="title"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Атауы"
              placeholder="Мысалы: Бокс 30 күн"
              onChangeText={onChange} value={value}
              error={errors.title?.message}
            />
          )}
        />
        <Controller
          control={control} name="description"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Сипаттама"
              placeholder="Ережелер мен мақсаттарды жаз..."
              onChangeText={onChange} value={value}
              multiline numberOfLines={3}
              error={errors.description?.message}
            />
          )}
        />

        {/* ── Кезең ── */}
        <SectionLabel label="Кезең" />

        <DatePicker
          label="Басталу күні"
          value={startDate}
          onChange={(d) => { setStartDate(d); setDateError(''); }}
          minimumDate={new Date()}
        />
        <DatePicker
          label="Аяқталу күні"
          value={endDate}
          onChange={(d) => { setEndDate(d); setDateError(''); }}
          minimumDate={startDate ? new Date(startDate) : new Date()}
          error={dateError}
        />

        {dayCount > 0 && (
          <View style={s.daysCard}>
            <View>
              <Text style={s.daysNum}>{dayCount}</Text>
              <Text style={s.daysSub}>күн</Text>
            </View>
            <View style={s.daysRight}>
              <View style={s.daysTrack}>
                <View style={[s.daysFill, { width: `${Math.min((dayCount / 90) * 100, 100)}%` }]} />
              </View>
              <Text style={s.daysHint}>Ұзақтық</Text>
            </View>
          </View>
        )}

        {/* ── Көрінімділік ── */}
        <SectionLabel label="Көрінімділік" />
        <View style={s.visRow}>
          {VISIBILITY.map((opt) => (
            <VisCard
              key={opt.key} opt={opt}
              selected={visibility === opt.key}
              onPress={() => setVisibility(opt.key)}
            />
          ))}
        </View>

        {visibility === 'protected' && (
          <>
            <InfoBanner
              icon="shield-checkmark-outline"
              text="Қатысушылар кіру үшін құпиясөз енгізуі керек"
              color={D.amber} bg={D.amberLight}
            />
            <Controller
              control={control} name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Кіру үшін құпиясөз"
                  placeholder="Құпиясөз ойлап тап..."
                  onChangeText={onChange} value={value}
                  isPassword autoCapitalize="none"
                  error={errors.password?.message}
                />
              )}
            />
          </>
        )}

        {/* ── Ставка ── */}
        <SectionLabel label="Ставка" />
        <InfoBanner
          icon="diamond-outline"
          text="Rikon монеталары — ішкі валюта. Қатысушылар жеңіске ставка тігеді."
          color={D.violet} bg={D.violetLight}
        />
        <Controller
          control={control} name="betAmount"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Ставка мөлшері (RC)"
              placeholder="0"
              onChangeText={onChange} value={value}
              keyboardType="numeric"
            />
          )}
        />

        <View style={s.submitWrap}>
          <Button
            title="Челлендж жасау"
            onPress={handleSubmit(onSubmit)}
            isLoading={isLoading}
            style={s.submitBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: D.bg },
  scroll: { padding: 20, paddingBottom: 52 },

  // Days card
  daysCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: D.violetLight,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: D.border,
    marginBottom: 4,
  },
  daysNum: {
    fontSize: 28, fontWeight: '900', color: D.violet, letterSpacing: -1,
  },
  daysSub: {
    fontSize: 12, fontWeight: '600', color: D.violet, opacity: 0.7,
  },
  daysRight: { flex: 1, gap: 6 },
  daysTrack: {
    height: 6, backgroundColor: D.surface, borderRadius: 99, overflow: 'hidden',
  },
  daysFill: {
    height: 6, backgroundColor: D.violet, borderRadius: 99,
  },
  daysHint: {
    fontSize: 11, color: D.textMuted, fontWeight: '600',
  },

  // Visibility
  visRow: { flexDirection: 'row', gap: 8 },

  // Submit
  submitWrap: { marginTop: 32 },
  submitBtn: {
    backgroundColor: D.violet,
    shadowColor: D.violet,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
});