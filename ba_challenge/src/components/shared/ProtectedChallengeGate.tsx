import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { privacyService } from '@services/privacyService';

interface ProtectedChallengeGateProps {
    challengeId: number;
    challengeTitle: string;
    onGranted: () => void;
}

export const ProtectedChallengeGate: React.FC<ProtectedChallengeGateProps> = ({
    challengeId,
    challengeTitle,
    onGranted,
}) => {
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleVerify = async () => {
        if (!password.trim()) {
            setError('Введи пароль');
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            const result = await privacyService.verifyAccess(challengeId, password);

            if (result.granted) {
                onGranted();
            } else {
                setError('Неверный пароль. Попробуй ещё раз.');
                setPassword('');
            }
        } catch {
            setError('Ошибка проверки. Попробуй позже.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                {/* Иконка замка */}
                <View style={styles.lockWrapper}>
                    <Text style={styles.lockIcon}>🔐</Text>
                </View>

                <Text style={styles.title}>Защищённый челлендж</Text>
                <Text style={styles.challengeName} numberOfLines={2}>
                    {challengeTitle}
                </Text>
                <Text style={styles.desc}>
                    Этот челлендж защищён паролем. Введи пароль чтобы получить доступ.
                </Text>

                {/* Поле пароля */}
                <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
                    <Ionicons name="key-outline" size={18} color={Colors.textMuted} />
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={(t) => { setPassword(t); setError(''); }}
                        placeholder="Введи пароль..."
                        placeholderTextColor={Colors.textMuted}
                        secureTextEntry={!showPass}
                        autoCapitalize="none"
                        onSubmitEditing={handleVerify}
                    />
                    <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                        <Ionicons
                            name={showPass ? 'eye-off' : 'eye'}
                            size={18}
                            color={Colors.textMuted}
                        />
                    </TouchableOpacity>
                </View>

                {error ? (
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                ) : null}

                {/* Кнопка */}
                <TouchableOpacity
                    style={[styles.btn, (isLoading || !password.trim()) && styles.btnDisabled]}
                    onPress={handleVerify}
                    disabled={isLoading || !password.trim()}
                >
                    {isLoading
                        ? <ActivityIndicator size="small" color={Colors.white} />
                        : (
                            <>
                                <Ionicons name="lock-open-outline" size={18} color={Colors.white} />
                                <Text style={styles.btnTxt}>Войти</Text>
                            </>
                        )
                    }
                </TouchableOpacity>

                <Text style={styles.hint}>
                    Пароль выдаёт создатель челленджа
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 28,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.warning + '40',
    },
    lockWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.warning + '18',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: Colors.warning + '40',
    },
    lockIcon: { fontSize: 36 },
    title: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
    challengeName: {
        fontSize: 15,
        color: Colors.warning,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 12,
    },
    desc: {
        fontSize: 13,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 24,
    },

    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 14,
        gap: 10,
        width: '100%',
        marginBottom: 8,
    },
    inputRowError: { borderColor: Colors.error },
    input: {
        flex: 1,
        paddingVertical: 13,
        fontSize: 15,
        color: Colors.textPrimary,
    },

    errorText: { fontSize: 12, color: Colors.error, marginBottom: 12, alignSelf: 'flex-start' },

    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        width: '100%',
        marginTop: 4,
        marginBottom: 12,
    },
    btnDisabled: { opacity: 0.4 },
    btnTxt: { color: Colors.white, fontWeight: '700', fontSize: 15 },
    hint: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
});