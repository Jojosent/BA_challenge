import { Colors } from '@constants/colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  color = Colors.primary,
}) => (
  <View style={[styles.container, { borderTopColor: color }]}>
    <Text style={styles.icon}>{icon}</Text>
    <Text style={[styles.value, { color }]}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 4,
  },
  icon: { fontSize: 24, marginBottom: 6 },
  value: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  label: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
});