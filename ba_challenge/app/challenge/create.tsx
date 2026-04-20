import { Header } from '@components/shared/Header';
import { Button } from '@components/ui/Button';
import { DatePicker } from '@components/ui/DatePicker';
import { Input } from '@components/ui/Input';
import { Colors } from '@constants/colors';
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

const schema = z.object({
    title: z.string().min(3, 'Минимум 3 символа'),
    description: z.string().min(10, 'Минимум 10 символов'),
    betAmount: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type Visibility = 'secret' | 'protected' | 'public';

const visibilityOptions: {
    key: 'public' | 'secret';
    label: string;
    icon: string;
    desc: string;
}[] = [
        {
            key: 'public',
            label: 'Публичный',
            icon: '🌍',
            desc: 'Виден всем в ленте',
        },
        {
            key: 'secret',
            label: 'По приглашению',
            icon: '🔒',
            desc: 'Только приглашённые',
        },
    ];

export default function CreateChallengeScreen() {
    const router = useRouter();
    const { createChallenge, isLoading } = useChallenge();

    const [visibility, setVisibility] = useState<'public' | 'secret'>('public');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dateError, setDateError] = useState('');

    const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { betAmount: '0' },
    });

    // Считаем сколько дней между датами
    const getDayCount = () => {
        if (!startDate || !endDate) return 0;
        const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const validateDates = () => {
        if (!startDate) { setDateError('Выбери дату начала'); return false; }
        if (!endDate) { setDateError('Выбери дату окончания'); return false; }
        if (getDayCount() < 1) {
            setDateError('Дата окончания должна быть позже начала');
            return false;
        }
        setDateError('');
        return true;
    };

    const onSubmit = async (data: FormData) => {
        if (!validateDates()) return;

        const challenge = await createChallenge({
            title: data.title,
            description: data.description,
            startDate,
            endDate,
            visibility,
            betAmount: parseInt(data.betAmount || '0') || 0,
        });

        if (challenge) {
            Alert.alert('🎉 Челлендж создан!', 'Теперь добавь задачи через AI', [
                { text: 'OK', onPress: () => router.replace(`/challenge/${challenge.id}`) },
            ]);
        }
    };

    const dayCount = getDayCount();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title="Новый челлендж" showBack />

            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Controller
                    control={control}
                    name="title"
                    render={({ field: { onChange, value } }) => (
                        <Input
                            label="Название"
                            placeholder="Например: Бокс за месяц"
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
                            placeholder="Опиши правила и цели..."
                            onChangeText={onChange}
                            value={value}
                            multiline
                            numberOfLines={3}
                            error={errors.description?.message}
                        />
                    )}
                />

                {/* Даты с удобным picker */}
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

                {/* Показываем сколько дней */}
                {dayCount > 0 && (
                    <View style={styles.daysInfo}>
                        <Text style={styles.daysIcon}>📊</Text>
                        <Text style={styles.daysText}>
                            Продолжительность: <Text style={styles.daysCount}>{dayCount} дней</Text>
                        </Text>
                    </View>
                )}

                {/* Видимость */}
                <Text style={styles.sectionLabel}>Видимость</Text>
                <View style={styles.visibilityRow}>
                    {visibilityOptions.map((opt) => (
                        <TouchableOpacity
                            key={opt.key}
                            style={[
                                styles.visCard,
                                visibility === opt.key && styles.visCardActive,
                            ]}
                            onPress={() => setVisibility(opt.key)}
                        >
                            <Text style={styles.visIcon}>{opt.icon}</Text>
                            <Text style={[
                                styles.visLabel,
                                visibility === opt.key && styles.visLabelActive,
                            ]}>
                                {opt.label}
                            </Text>
                            <Text style={styles.visDesc}>{opt.desc}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Ставка */}
                <Controller
                    control={control}
                    name="betAmount"
                    render={({ field: { onChange, value } }) => (
                        <Input
                            label="🪙 Ставка (Rikon монет)"
                            placeholder="0"
                            onChangeText={onChange}
                            value={value}
                            keyboardType="numeric"
                        />
                    )}
                />

                <Button
                    title="Создать челлендж 🚀"
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

    sectionLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '500',
        marginBottom: 10,
    },
    visibilityRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    visCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    visCardActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '15',
    },
    visIcon: { fontSize: 22, marginBottom: 4 },
    visLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
    visLabelActive: { color: Colors.primary },
    visDesc: { fontSize: 10, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
    submitBtn: { marginTop: 8 },
});