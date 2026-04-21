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
import { Colors } from '@constants/colors';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { DatePicker } from '@components/ui/DatePicker';
import { Header } from '@components/shared/Header';
import { challengeService } from '@services/challengeService';
import { useAuthStore } from '@store/authStore';

const schema = z.object({
    title: z.string().min(3, 'Минимум 3 символа'),
    description: z.string().min(10, 'Минимум 10 символов'),
});

type FormData = z.infer<typeof schema>;

export default function CreateFamilyChallengeScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dateError, setDateError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
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
        if (!startDate) { setDateError('Выбери дату начала'); return; }
        if (!endDate) { setDateError('Выбери дату окончания'); return; }
        if (getDayCount() < 1) { setDateError('Дата окончания должна быть позже'); return; }

        try {
            setIsLoading(true);

            const challenge = await challengeService.create({
                title: data.title,
                description: data.description,
                startDate,
                endDate,
                visibility: 'secret',
                betAmount: 0,                        // ✅ всегда бесплатно
                familyOwnerId: user!.id,
            });

            Alert.alert('🎉 Семейный челлендж создан!', 'Все члены твоей семьи увидят его', [
                { text: 'OK', onPress: () => router.replace(`/challenge/${challenge.id}`) },
            ]);
        } catch (e: any) {
            Alert.alert('Ошибка', e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const dayCount = getDayCount();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title="🏆 Семейный челлендж" showBack />

            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
            >
                {/* Инфо карточка */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoIcon}>👨‍👩‍👧‍👦</Text>
                    <View style={styles.infoTexts}>
                        <Text style={styles.infoTitle}>Только для твоей семьи</Text>
                        <Text style={styles.infoDesc}>
                            Этот челлендж будут видеть только члены твоей семьи.
                            Участие бесплатное — монеты не требуются.
                        </Text>
                    </View>
                </View>

                <Controller
                    control={control}
                    name="title"
                    render={({ field: { onChange, value } }) => (
                        <Input
                            label="Название"
                            placeholder="Например: Семейный марафон"
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
                            label="Описание"
                            placeholder="Опиши правила для семьи..."
                            onChangeText={onChange}
                            value={value}
                            multiline
                            numberOfLines={3}
                            error={errors.description?.message}
                        />
                    )}
                />

                <DatePicker
                    label="📅 Дата начала"
                    value={startDate}
                    onChange={(d) => { setStartDate(d); setDateError(''); }}
                    minimumDate={new Date()}
                />

                <DatePicker
                    label="📅 Дата окончания"
                    value={endDate}
                    onChange={(d) => { setEndDate(d); setDateError(''); }}
                    minimumDate={startDate ? new Date(startDate) : new Date()}
                    error={dateError}
                />

                {dayCount > 0 && (
                    <View style={styles.daysInfo}>
                        <Text style={styles.daysIcon}>📊</Text>
                        <Text style={styles.daysText}>
                            Продолжительность:{' '}
                            <Text style={styles.daysCount}>{dayCount} дней</Text>
                        </Text>
                    </View>
                )}

                {/* Бесплатно — информационный блок вместо ввода монет */}
                <View style={styles.freeCard}>
                    <Text style={styles.freeIcon}>✅</Text>
                    <View style={styles.freeTexts}>
                        <Text style={styles.freeTitle}>Бесплатное участие</Text>
                        <Text style={styles.freeDesc}>
                            Семейные челленджи не требуют ставки монет
                        </Text>
                    </View>
                </View>

                <Button
                    title="Создать семейный челлендж 👨‍👩‍👧‍👦"
                    onPress={handleSubmit(onSubmit)}
                    isLoading={isLoading}
                    style={styles.submitBtn}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: 20, paddingBottom: 40 },

    infoCard: {
        flexDirection: 'row',
        backgroundColor: Colors.primary + '15',
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
        gap: 12,
        alignItems: 'flex-start',
    },
    infoIcon: { fontSize: 28 },
    infoTexts: { flex: 1 },
    infoTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
    infoDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },

    daysInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary + '15',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    daysIcon: { fontSize: 16 },
    daysText: { fontSize: 14, color: Colors.textSecondary },
    daysCount: { color: Colors.primary, fontWeight: '700' },

    // Карточка "бесплатно" вместо ввода монет
    freeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.accent + '15',
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.accent + '30',
        gap: 12,
    },
    freeIcon: { fontSize: 24 },
    freeTexts: { flex: 1 },
    freeTitle: { fontSize: 14, fontWeight: '700', color: Colors.accent, marginBottom: 2 },
    freeDesc: { fontSize: 12, color: Colors.textSecondary },

    submitBtn: { marginTop: 8 },
});