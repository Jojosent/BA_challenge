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
import { useTranslation } from 'react-i18next';
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
import { useTheme } from '@/theme/ThemeContext';

// Тема өзгермейтін статикалық accent токендер
const A = {
  violet: '#5E4BDB',
  violetMid: '#7B6AEA',
  violetLight: '#EDE9FF',
  violetSoft: '#F5F3FF',

  emerald: '#059669',
  emeraldLight: '#ECFDF5',

  amber: '#D97706',
  amberLight: '#FFFBEB',

  rose: '#E11D48',
  roseLight: '#FFF1F4',

  shadowViolet: '#5E4BDB',
  shadowNeutral: '#1A1040',
};

type FormData = {
  title: string;
  description: string;
  betAmount?: string;
  password?: string;
};

type VisibilityKey = 'public' | 'secret' | 'protected';

function SectionLabel({ label }: { label: string }) {
  const { theme } = useTheme();
  return (
    <View style={sec.row}>
      <Text style={[sec.text, { color: theme.primary }]}>{label}</Text>
      <View style={[sec.line, { backgroundColor: theme.border }]} />
    </View>
  );
}

const sec = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 28,
    marginBottom: 14,
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  line: {
    flex: 1,
    height: 1,
  },
});

function VisCard({
  opt,
  selected,
  onPress,
}: {
  opt: {
    key: VisibilityKey;
    label: string;
    sublabel: string;
    icon: any;
    color: string;
    bg: string;
  };
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[
        vis.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        selected && {
          borderColor: opt.color,
          backgroundColor: opt.bg,
          shadowColor: opt.color,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.18,
          shadowRadius: 14,
          elevation: 6,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View
        style={[
          vis.iconBox,
          {
            backgroundColor: selected ? opt.color : (theme.surfaceAlt ?? A.violetSoft),
            shadowColor: selected ? opt.color : 'transparent',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: selected ? 0.35 : 0,
            shadowRadius: 8,
            elevation: selected ? 4 : 0,
          },
        ]}
      >
        <Ionicons
          name={opt.icon}
          size={18}
          color={selected ? '#fff' : theme.textSecondary}
        />
      </View>

      <Text style={[vis.label, { color: selected ? opt.color : theme.textSecondary }]}>
        {opt.label}
      </Text>

      <Text style={[vis.sub, { color: theme.textSecondary, opacity: 0.7 }]}>
        {opt.sublabel}
      </Text>

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
    flex: 1,
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    gap: 6,
    position: 'relative',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  sub: {
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 13,
  },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function InfoBanner({
  icon,
  text,
  color,
  bg,
}: {
  icon: any;
  text: string;
  color: string;
  bg: string;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        ib.wrap,
        {
          backgroundColor: bg,
          borderColor: color + '30',
          shadowColor: color,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 2,
        },
      ]}
    >
      <View style={[ib.iconBox, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>

      <Text style={[ib.text, { color: theme.textSecondary }]}>{text}</Text>
    </View>
  );
}

const ib = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
});

export default function CreateChallengeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { createChallenge, isLoading } = useChallenge();

  const schema = z.object({
    title: z.string().min(3, t('createChallenge.validationTitle')),
    description: z.string().min(10, t('createChallenge.validationDescription')),
    betAmount: z.string().optional(),
    password: z.string().optional(),
  });

  const VISIBILITY: {
    key: VisibilityKey;
    label: string;
    sublabel: string;
    icon: any;
    color: string;
    bg: string;
  }[] = [
    {
      key: 'public',
      label: t('createChallenge.visibilityPublic'),
      sublabel: t('createChallenge.visibilityPublicSub'),
      icon: 'globe-outline',
      color: A.emerald,
      bg: A.emeraldLight,
    },
    {
      key: 'protected',
      label: t('createChallenge.visibilityProtected'),
      sublabel: t('createChallenge.visibilityProtectedSub'),
      icon: 'shield-checkmark-outline',
      color: A.amber,
      bg: A.amberLight,
    },
    {
      key: 'secret',
      label: t('createChallenge.visibilitySecret'),
      sublabel: t('createChallenge.visibilitySecretSub'),
      icon: 'lock-closed-outline',
      color: A.rose,
      bg: A.roseLight,
    },
  ];

  const [visibility, setVisibility] = useState<VisibilityKey>('public');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { betAmount: '0', password: '' },
  });

  const getDayCount = () => {
    if (!startDate || !endDate) return 0;
    return Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
    );
  };

  const validateDates = () => {
    if (!startDate) {
      setDateError(t('createChallenge.startDateRequired'));
      return false;
    }
    if (!endDate) {
      setDateError(t('createChallenge.endDateRequired'));
      return false;
    }
    if (getDayCount() < 1) {
      setDateError(t('createChallenge.endDateAfterStart'));
      return false;
    }
    setDateError('');
    return true;
  };

  const onSubmit = async (data: FormData) => {
    if (!validateDates()) return;

    if (visibility === 'protected' && !data.password?.trim()) {
      Alert.alert(t('common.error'), t('createChallenge.passwordRequired'));
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
      Alert.alert(
        t('createChallenge.createdTitle'),
        t('createChallenge.createdMessage'),
        [
          {
            text: 'OK',
            onPress: () => router.replace(`/challenge/${challenge.id}`),
          },
        ]
      );
    }
  };

  const dayCount = getDayCount();

  return (
    <SafeAreaView style={[s.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <Header title={t('createChallenge.title')} showBack />

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel label={t('createChallenge.sectionMain')} />

        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, value } }) => (
            <Input
              label={t('createChallenge.challengeTitle')}
              placeholder={t('createChallenge.challengeTitlePlaceholder')}
              onChangeText={onChange}
              value={value}
              error={errors.title?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <Input
              label={t('createChallenge.description')}
              placeholder={t('createChallenge.descriptionPlaceholder')}
              onChangeText={onChange}
              value={value}
              multiline
              numberOfLines={3}
              error={errors.description?.message}
            />
          )}
        />

        <SectionLabel label={t('createChallenge.sectionPeriod')} />

        <DatePicker
          label={t('createChallenge.startDate')}
          value={startDate}
          onChange={(date) => {
            setStartDate(date);
            setDateError('');
          }}
          minimumDate={new Date()}
        />

        <DatePicker
          label={t('createChallenge.endDate')}
          value={endDate}
          onChange={(date) => {
            setEndDate(date);
            setDateError('');
          }}
          minimumDate={startDate ? new Date(startDate) : new Date()}
          error={dateError}
        />

        {dayCount > 0 && (
          <View
            style={[
              s.daysCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                shadowColor: theme.primary ?? A.shadowViolet,
              },
            ]}
          >
            <View style={[s.daysLeft, { backgroundColor: theme.surfaceAlt ?? theme.primaryLight }]}>
              <Text style={[s.daysNum, { color: theme.primary ?? A.violet }]}>
                {dayCount}
              </Text>
              <Text style={[s.daysSub, { color: theme.textSecondary }]}>
                {t('createChallenge.days')}
              </Text>
            </View>

            <View style={s.daysRight}>
              <View style={[s.daysTrack, { backgroundColor: theme.border }]}>
                <View
                  style={[
                    s.daysFill,
                    {
                      width: `${Math.min((dayCount / 90) * 100, 100)}%`,
                      backgroundColor: theme.primary ?? A.violet,
                    },
                  ]}
                />
              </View>

              <Text style={[s.daysHint, { color: theme.textSecondary }]}>
                {t('createChallenge.duration')}
              </Text>
            </View>
          </View>
        )}

        <SectionLabel label={t('createChallenge.sectionVisibility')} />

        <View style={s.visRow}>
          {VISIBILITY.map((opt) => (
            <VisCard
              key={opt.key}
              opt={opt}
              selected={visibility === opt.key}
              onPress={() => setVisibility(opt.key)}
            />
          ))}
        </View>

        {visibility === 'protected' && (
          <>
            <InfoBanner
              icon="shield-checkmark-outline"
              text={t('createChallenge.protectedInfo')}
              color={A.amber}
              bg={A.amberLight}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t('createChallenge.password')}
                  placeholder={t('createChallenge.passwordPlaceholder')}
                  onChangeText={onChange}
                  value={value}
                  isPassword
                  autoCapitalize="none"
                  error={errors.password?.message}
                />
              )}
            />
          </>
        )}

        <SectionLabel label={t('createChallenge.sectionBet')} />

        <InfoBanner
          icon="diamond-outline"
          text={t('createChallenge.betInfo')}
          color={theme.primary}
          bg={theme.primaryLight}
        />

        <Controller
          control={control}
          name="betAmount"
          render={({ field: { onChange, value } }) => (
            <Input
              label={t('createChallenge.betAmount')}
              placeholder="0"
              onChangeText={onChange}
              value={value}
              keyboardType="numeric"
            />
          )}
        />

        <View style={s.submitWrap}>
          <Button
            title={t('createChallenge.submit')}
            onPress={handleSubmit(onSubmit)}
            isLoading={isLoading}
            style={[
              s.submitBtn,
              {
                backgroundColor: theme.primary ?? A.violet,
                shadowColor: theme.primary ?? A.shadowViolet,
              },
            ]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 60,
  },

  // Days card
  daysCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    marginBottom: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  daysLeft: {
    alignItems: 'center',
    minWidth: 52,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  daysNum: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 34,
  },
  daysSub: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  daysRight: {
    flex: 1,
    gap: 8,
  },
  daysTrack: {
    height: 7,
    borderRadius: 99,
    overflow: 'hidden',
  },
  daysFill: {
    height: 7,
    borderRadius: 99,
    opacity: 0.9,
  },
  daysHint: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Visibility row
  visRow: {
    flexDirection: 'row',
    gap: 10,
  },

  // Submit
  submitWrap: {
    marginTop: 36,
  },
  submitBtn: {
    borderRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 22,
    elevation: 12,
  },
});