import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  color,
}) => {
  const { theme } = useTheme();
  const activeColor = color ?? theme.primary;
  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border, borderTopColor: activeColor }]}>
      <View style={styles.icon}>
        {icon}
      </View>
      <Text style={[styles.value, { color: activeColor }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 3,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  icon: { fontSize: 24, marginBottom: 6 },
  value: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  label: { fontSize: 11, textAlign: 'center' },
});