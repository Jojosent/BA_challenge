import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

export const LoadingSpinner: React.FC = () => {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});