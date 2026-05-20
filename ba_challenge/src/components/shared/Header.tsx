import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  rightElement,
}) => {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>

      <View style={styles.right}>
        {rightElement || <View style={styles.placeholder} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 12,
    borderBottomWidth: 1,
  },
  left: { width: 40 },
  right: { width: 40, alignItems: 'flex-end' },
  backBtn: { padding: 4 },
  placeholder: { width: 40 },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
});