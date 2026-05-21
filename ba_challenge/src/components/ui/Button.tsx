import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  style,
}) => {
  const { theme } = useTheme();
  
  const textColor = variant === 'outline' ? theme.primary : '#ffffff';

  const buttonStyle = [
    styles.base,
    {
      shadowColor: theme.key === 'midnight' ? '#000000' : '#1E293B',
    },
    variant === 'primary' && { backgroundColor: theme.primary },
    variant === 'secondary' && { backgroundColor: theme.accent },
    variant === 'outline' && {
      backgroundColor: theme.surface,
      borderColor: theme.primary,
      borderWidth: 1.5,
      shadowOpacity: 0.04,
    },
    (disabled || isLoading) && styles.disabled,
    style,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.85}
    >
      {isLoading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
  },
});