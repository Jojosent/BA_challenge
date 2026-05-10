import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { DatePicker } from '@components/ui/DatePicker';
import { Header } from '@components/shared/Header';
import { challengeService } from '@services/challengeService';
import { useAuthStore } from '@store/authStore';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';

export default function CreateFamilyChallengeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme } = useTheme();

  const schema = z.object({
    title: z.string().min(3, t('createFamilyChallenge.validationTitle')),
    description: z.string().min(10, t('createFamilyChallenge.validationDescription')),
  });

  type FormData = z.infer<typeof schema>;

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const getDayCount = () => {
    if (!startDate || !endDate) return 0;
    return Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  };

  const onSubmit = async (data: FormData) => {
    if (!startDate) {
      setDateError(t('createFamilyChallenge.startDateRequired'));
      return;
    }
    if (!endDate) {
      setDateError(t('createFamilyChallenge.endDateRequired'));
      return;
    }
    if (getDayCount() < 1) {
      setDateError(t('createFamilyChallenge.endDateAfterStart'));
      return;
    }

    try {
      setIsLoading(true);

      const challenge = await challengeService.create({
        title: data.title,
        description: data.description,
        startDate,
        endDate,
        visibility: 'secret',
        betAmount: 0,
        familyOwnerId: user!.id,
      });

      Alert.alert(
        t('createFamilyChallenge.createdTitle'),
        t('createFamilyChallenge.createdMessage'),
        [
          {
            text: 'OK',
            onPress: () => router.replace(`/challenge/${challenge.id}`),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const dayCount = getDayCount();

  // Accent color — emerald (semantic, theme-independent)
  const accentColor = '#059669';

  return (
    <SafeAreaView style={[s.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <Header title={t('createFamilyChallenge.headerTitle')} showBack />

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Инфо карточка */}
        <View
          style={[
            s.infoCard,
            {
              backgroundColor: (theme.primary ?? '#5E4BDB') + '15',
              borderColor: (theme.primary ?? '#5E4BDB') + '30',
            },
          ]}
        >
          <Text style={s.infoIcon}>👨‍👩‍👧‍👦</Text>
          <View style={s.infoTexts}>
            <Text style={[s.infoTitle, { color: theme.textPrimary }]}>
              {t('createFamilyChallenge.infoTitle')}
            </Text>
            <Text style={[s.infoDesc, { color: theme.textSecondary }]}>
              {t('createFamilyChallenge.infoDesc')}
            </Text>
          </View>
        </View>

        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, value } }) => (
            <Input
              label={t('createFamilyChallenge.titleLabel')}
              placeholder={t('createFamilyChallenge.titlePlaceholder')}
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
              label={t('createFamilyChallenge.descriptionLabel')}
              placeholder={t('createFamilyChallenge.descriptionPlaceholder')}
              onChangeText={onChange}
              value={value}
              multiline
              numberOfLines={3}
              error={errors.description?.message}
            />
          )}
        />

        <DatePicker
          label={t('createFamilyChallenge.startDate')}
          value={startDate}
          onChange={(d) => {
            setStartDate(d);
            setDateError('');
          }}
          minimumDate={new Date()}
        />

        <DatePicker
          label={t('createFamilyChallenge.endDate')}
          value={endDate}
          onChange={(d) => {
            setEndDate(d);
            setDateError('');
          }}
          minimumDate={startDate ? new Date(startDate) : new Date()}
          error={dateError}
        />

        {dayCount > 0 && (
          <View
            style={[
              s.daysInfo,
              {
                backgroundColor: (theme.primary ?? '#5E4BDB') + '15',
                borderColor: (theme.primary ?? '#5E4BDB') + '30',
              },
            ]}
          >
            <Text style={s.daysIcon}>📊</Text>
            <Text style={[s.daysText, { color: theme.textSecondary }]}>
              {t('createFamilyChallenge.duration')}{' '}
              <Text style={[s.daysCount, { color: theme.primary ?? '#5E4BDB' }]}>
                {t('createFamilyChallenge.daysCount', { count: dayCount })}
              </Text>
            </Text>
          </View>
        )}

        {/* Карточка "бесплатно" */}
        <View
          style={[
            s.freeCard,
            {
              backgroundColor: accentColor + '15',
              borderColor: accentColor + '30',
            },
          ]}
        >
          <Text style={s.freeIcon}>✅</Text>
          <View style={s.freeTexts}>
            <Text style={[s.freeTitle, { color: accentColor }]}>
              {t('createFamilyChallenge.freeTitle')}
            </Text>
            <Text style={[s.freeDesc, { color: theme.textSecondary }]}>
              {t('createFamilyChallenge.freeDesc')}
            </Text>
          </View>
        </View>

        <Button
          title={t('createFamilyChallenge.submit')}
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
          style={[
            s.submitBtn,
            {
              backgroundColor: theme.primary ?? '#5E4BDB',
              shadowColor: theme.primary ?? '#5E4BDB',
            },
          ]}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },

  infoCard: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoIcon: { fontSize: 28 },
  infoTexts: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  infoDesc: { fontSize: 13, lineHeight: 18 },

  daysInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
  },
  daysIcon: { fontSize: 16 },
  daysText: { fontSize: 14 },
  daysCount: { fontWeight: '700' },

  freeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    gap: 12,
  },
  freeIcon: { fontSize: 24 },
  freeTexts: { flex: 1 },
  freeTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  freeDesc: { fontSize: 12 },

  submitBtn: {
    marginTop: 8,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
});