import { Colors } from '@constants/colors';
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

    const displayDate = value
        ? new Date(value).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
        : 'Выбери дату';

    const handleConfirm = (date: Date) => {
        setIsVisible(false);
        onChange(date.toISOString().split('T')[0]);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>

            <TouchableOpacity
                style={[styles.btn, error ? styles.btnError : null]}
                onPress={() => setIsVisible(true)}
                activeOpacity={0.8}
            >
                <Ionicons
                    name="calendar"
                    size={20}
                    color={value ? Colors.primary : Colors.textMuted}
                />
                <Text style={[styles.dateText, !value && styles.placeholder]}>
                    {displayDate}
                </Text>
                <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
            </TouchableOpacity>

            {error && <Text style={styles.error}>{error}</Text>}

            <DateTimePickerModal
                isVisible={isVisible}
                mode="date"
                onConfirm={handleConfirm}
                onCancel={() => setIsVisible(false)}
                minimumDate={minimumDate || new Date()}
                date={value ? new Date(value) : new Date()}
                // Стили под тёмную тему
                isDarkModeEnabled={true}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 16 },
    label: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '500',
        marginBottom: 8,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 10,
    },
    btnError: { borderColor: Colors.error },
    dateText: {
        flex: 1,
        fontSize: 16,
        color: Colors.textPrimary,
    },
    placeholder: { color: Colors.textMuted },
    error: { color: Colors.error, fontSize: 12, marginTop: 4 },
});