import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';

interface DatePickerProps {
    label: string;
    value: string;           // YYYY-MM-DD
    onChange: (date: string) => void;
    minimumDate?: Date;
    error?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
    label,
    value,
    onChange,
    minimumDate,
    error,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const { t, i18n } = useTranslation();
    const { theme } = useTheme();

    const locale =
        i18n.language === 'kz'
            ? 'kk-KZ'
            : i18n.language === 'en'
                ? 'en-US'
                : 'ru-RU';

    const displayDate = value
        ? new Date(value).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
        : t('datePicker.selectDate');

    const handleConfirm = (date: Date) => {
        setIsVisible(false);
        onChange(date.toISOString().split('T')[0]);
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>

            <TouchableOpacity
                style={[styles.btn, { backgroundColor: theme.surface, borderColor: theme.border }, error ? { borderColor: theme.rose } : null]}
                onPress={() => setIsVisible(true)}
                activeOpacity={0.8}
            >
                <Ionicons
                    name="calendar"
                    size={20}
                    color={value ? theme.primary : theme.textMuted}
                />
                <Text style={[styles.dateText, { color: theme.textPrimary }, !value && { color: theme.textMuted }]}>
                    {displayDate}
                </Text>
                <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
            </TouchableOpacity>

            {error && <Text style={[styles.error, { color: theme.rose }]}>{error}</Text>}

            <DateTimePickerModal
                isVisible={isVisible}
                mode="date"
                onConfirm={handleConfirm}
                onCancel={() => setIsVisible(false)}
                minimumDate={minimumDate || new Date()}
                date={value ? new Date(value) : new Date()}
                isDarkModeEnabled={theme.dark}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 16 },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 10,
    },
    btnError: {},
    dateText: {
        flex: 1,
        fontSize: 16,
    },
    placeholder: {},
    error: { fontSize: 12, marginTop: 4 },
});