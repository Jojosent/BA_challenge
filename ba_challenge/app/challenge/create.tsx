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
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';

const schema = z.object({
    title: z.string().min(3, 'Минимум 3 символа'),
    description: z.string().min(10, 'Минимум 10 символов'),
    betAmount: z.string().optional(),
    password: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type Visibility = 'public' | 'protected' | 'secret';

const visibilityOptions: {
    key: Visibility;
    label: string;
    icon: string;
    desc: string;
    color: string;
}[] = [
        {
            key: 'public',
            label: 'Публичный',
            icon: '🌍',
            desc: 'Виден всем в ленте',
            color: Colors.accent,
        },
        {
            key: 'protected',
            label: 'Защищённый',
            icon: '🔐',
            desc: 'Вступить только по паролю',
            color: Colors.warning,
        },
        {
            key: 'secret',
            label: 'По приглашению',
            icon: '🔒',
            desc: 'Только приглашённые',
            color: Colors.error,
        },
    ];

export default function CreateChallengeScreen() {
    const router = useRouter();
    const { createChallenge, isLoading } = useChallenge();

    const [visibility, setVisibility] = useState<Visibility>('public');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dateError, setDateError] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [passError, setPassError] = useState('');

    const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { betAmount: '0' },
    });

    const getDayCount = () => {
        if (!startDate || !endDate) return 0;
        const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const validateDates = () => {
        if (!startDate) { setDateError('Выбери дату начала'); return false; }
        if (!endDate) { setDateError('Выбери дату окончания'); return false; }
        if (getDayCount() < 1) { setDateError('Дата окончания должна быть позже начала'); return false; }
        setDateError('');
        return true;
    };

    const onSubmit = async (data: FormData) => {
        if (!validateDates()) return;

        // Проверка пароля для protected
        if (visibility === 'protected' && !password.trim()) {
            setPassError('Укажи пароль для защищённого челленджа');
            return;
        }
        setPassError('');

        const challenge = await createChallenge({
            title: data.title,
            description: data.description,
            startDate,
            endDate,
            visibility,
            betAmount: parseInt(data.betAmount || '0') || 0,
            // пароль передаётся отдельно если protected
            ...(visibility === 'protected' && { accessPassword: password.trim() }),
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

                {/* Даты */}
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

                {/* Количество дней */}
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
                <View style={styles.visibilityGrid}>
                    {visibilityOptions.map((opt) => {
                        const isActive = visibility === opt.key;
                        return (
                            <TouchableOpacity
                                key={opt.key}
                                style={[
                                    styles.visCard,
                                    isActive && { borderColor: opt.color, backgroundColor: opt.color + '12' },
                                ]}
                                onPress={() => {
                                    setVisibility(opt.key);
                                    setPassError('');
                                    if (opt.key !== 'protected') setPassword('');
                                }}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.visIcon}>{opt.icon}</Text>
                                <Text style={[styles.visLabel, isActive && { color: opt.color }]}>
                                    {opt.label}
                                </Text>
                                <Text style={styles.visDesc}>{opt.desc}</Text>
                                {isActive && (
                                    <View style={[styles.visDot, { backgroundColor: opt.color }]} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Поле пароля — только для protected */}
                {visibility === 'protected' && (
                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { onChange, value } }) => {
                            // Берем ошибку из react-hook-form, если она есть
                            const errorMessage = errors.password?.message;

                            return (
                                <View style={[styles.passwordBox, errorMessage ? styles.passwordBoxError : null]}>
                                    <Text style={styles.passwordLabel}>🔑 Пароль для входа</Text>
                                    <Text style={styles.passwordSub}>
                                        Участники должны ввести этот пароль чтобы вступить
                                    </Text>
                                    <View style={styles.passwordRow}>
                                        <Ionicons name="key-outline" size={18} color={Colors.textMuted} />
                                        <TextInput
                                            style={styles.passwordInput}
                                            // Связываем значение с react-hook-form
                                            value={value}
                                            // Передаем изменения в react-hook-form
                                            onChangeText={onChange}
                                            placeholder="Придумай пароль..."
                                            placeholderTextColor={Colors.textMuted}
                                            secureTextEntry={!showPass}
                                            autoCapitalize="none"
                                        />
                                        {/* Состояние showPass остается локальным (useState), 
                            так как оно нужно только для интерфейса */}
                                        <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                                            <Ionicons
                                                name={showPass ? 'eye-off' : 'eye'}
                                                size={18}
                                                color={Colors.textMuted}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    {/* Выводим ошибку от react-hook-form */}
                                    {errorMessage ? (
                                        <Text style={styles.passError}>⚠️ {errorMessage}</Text>
                                    ) : null}
                                </View>
                            );
                        }}
                    />
                )}

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

    // Сетка 3 карточки
    visibilityGrid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    visCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.border,
        gap: 4,
        position: 'relative',
    },
    visIcon: { fontSize: 22 },
    visLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
    visDesc: { fontSize: 9, color: Colors.textMuted, textAlign: 'center', lineHeight: 12 },
    visDot: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 7,
        height: 7,
        borderRadius: 4,
    },

    // Блок пароля
    passwordBox: {
        backgroundColor: Colors.warning + '12',
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.warning + '40',
        gap: 6,
    },
    passwordBoxError: {
        borderColor: Colors.error,
        backgroundColor: Colors.error + '08',
    },
    passwordLabel: { fontSize: 14, fontWeight: '700', color: Colors.warning },
    passwordSub: { fontSize: 12, color: Colors.textSecondary, lineHeight: 16, marginBottom: 4 },
    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 12,
        gap: 8,
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: Colors.textPrimary,
    },
    passError: { fontSize: 12, color: Colors.error },

    submitBtn: { marginTop: 8 },
});