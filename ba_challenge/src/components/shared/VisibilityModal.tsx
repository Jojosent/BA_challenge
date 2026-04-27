import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { privacyService } from '@services/privacyService';

type Visibility = 'secret' | 'protected' | 'public';

interface VisibilityOption {
    key: Visibility;
    icon: string;
    label: string;
    desc: string;
    color: string;
}

const VISIBILITY_OPTIONS: VisibilityOption[] = [
    {
        key: 'public',
        icon: '🌍',
        label: 'Публичный',
        desc: 'Виден всем пользователям в общем списке',
        color: Colors.accent,
    },
    {
        key: 'protected',
        icon: '🔐',
        label: 'Защищённый',
        desc: 'Виден всем, но войти можно только по паролю',
        color: Colors.warning,
    },
    {
        key: 'secret',
        icon: '🔒',
        label: 'Секретный',
        desc: 'Только участники по приглашению могут его видеть',
        color: Colors.error,
    },
];

interface VisibilityModalProps {
    visible: boolean;
    onClose: () => void;
    challengeId: number;
    currentVisibility: Visibility;
    onUpdated: (visibility: Visibility) => void;
}

export const VisibilityModal: React.FC<VisibilityModalProps> = ({
    visible,
    onClose,
    challengeId,
    currentVisibility,
    onUpdated,
}) => {
    const [selected, setSelected] = useState<Visibility>(currentVisibility);
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (selected === 'protected' && !password.trim()) {
            Alert.alert('Нужен пароль', 'Укажи пароль для защищённого челленджа');
            return;
        }

        try {
            setIsLoading(true);
            const result = await privacyService.updateChallengeVisibility(
                challengeId,
                selected,
                selected === 'protected' ? password : undefined
            );
            Alert.alert('✅ Готово', result.message);
            onUpdated(selected);
            handleClose();
        } catch (e: any) {
            Alert.alert('Ошибка', e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setSelected(currentVisibility);
        setPassword('');
        onClose();
    };

    const changed = selected !== currentVisibility;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.sheet}>
                    {/* Заголовок */}
                    <View style={styles.header}>
                        <Text style={styles.title}>🔐 Видимость челленджа</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={22} color={Colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>
                        Выбери кто может видеть и вступать в этот челлендж
                    </Text>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Карточки вариантов */}
                        {VISIBILITY_OPTIONS.map((opt) => {
                            const isActive = selected === opt.key;
                            return (
                                <TouchableOpacity
                                    key={opt.key}
                                    style={[
                                        styles.optionCard,
                                        isActive && { borderColor: opt.color, backgroundColor: opt.color + '12' },
                                    ]}
                                    onPress={() => setSelected(opt.key)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.optionLeft}>
                                        <Text style={styles.optionIcon}>{opt.icon}</Text>
                                        <View style={styles.optionTexts}>
                                            <Text style={[styles.optionLabel, isActive && { color: opt.color }]}>
                                                {opt.label}
                                            </Text>
                                            <Text style={styles.optionDesc}>{opt.desc}</Text>
                                        </View>
                                    </View>
                                    <View style={[
                                        styles.radioOuter,
                                        isActive && { borderColor: opt.color },
                                    ]}>
                                        {isActive && (
                                            <View style={[styles.radioInner, { backgroundColor: opt.color }]} />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Поле пароля — только для protected */}
                        {selected === 'protected' && (
                            <View style={styles.passwordSection}>
                                <Text style={styles.passwordLabel}>
                                    🔑 Пароль для входа
                                </Text>
                                <View style={styles.passwordRow}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder="Придумай пароль..."
                                        placeholderTextColor={Colors.textMuted}
                                        secureTextEntry={!showPass}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeBtn}
                                        onPress={() => setShowPass(!showPass)}
                                    >
                                        <Ionicons
                                            name={showPass ? 'eye-off' : 'eye'}
                                            size={18}
                                            color={Colors.textMuted}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.passwordHint}>
                                    Участники должны ввести этот пароль чтобы вступить
                                </Text>
                            </View>
                        )}

                        {/* Текущий статус */}
                        <View style={styles.currentStatus}>
                            <Text style={styles.currentStatusLabel}>Текущая видимость:</Text>
                            <View style={styles.currentStatusBadge}>
                                <Text style={styles.currentStatusText}>
                                    {VISIBILITY_OPTIONS.find(o => o.key === currentVisibility)?.icon}{' '}
                                    {VISIBILITY_OPTIONS.find(o => o.key === currentVisibility)?.label}
                                </Text>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Кнопки */}
                    <View style={styles.btns}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                            <Text style={styles.cancelTxt}>Отмена</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.saveBtn,
                                (!changed || isLoading) && styles.saveBtnDisabled,
                            ]}
                            onPress={handleSave}
                            disabled={!changed || isLoading}
                        >
                            {isLoading
                                ? <ActivityIndicator size="small" color={Colors.white} />
                                : <Text style={styles.saveTxt}>Сохранить</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
    subtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20, lineHeight: 18 },

    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.card,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.border,
        padding: 14,
        marginBottom: 10,
    },
    optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    optionIcon: { fontSize: 26 },
    optionTexts: { flex: 1 },
    optionLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
    optionDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 16 },

    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioInner: {
        width: 11,
        height: 11,
        borderRadius: 6,
    },

    passwordSection: {
        backgroundColor: Colors.warning + '12',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.warning + '40',
    },
    passwordLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.warning,
        marginBottom: 10,
    },
    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: Colors.textPrimary,
    },
    eyeBtn: { padding: 8 },
    passwordHint: { fontSize: 11, color: Colors.textSecondary, lineHeight: 15 },

    currentStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        marginBottom: 8,
    },
    currentStatusLabel: { fontSize: 12, color: Colors.textMuted },
    currentStatusBadge: {
        backgroundColor: Colors.card,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    currentStatusText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },

    btns: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    cancelTxt: { color: Colors.textSecondary, fontWeight: '600' },
    saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
    saveBtnDisabled: { opacity: 0.4 },
    saveTxt: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});