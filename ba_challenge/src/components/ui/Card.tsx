import { Colors } from '@constants/colors';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'; // Добавили StyleProp

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>; // Изменили тип здесь
}

export const Card: React.FC<CardProps> = ({ children, style }) => (
    // Теперь View корректно примет массив стилей
    <View style={[styles.card, style]}>{children}</View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
});