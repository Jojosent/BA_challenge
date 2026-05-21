import { UserRole } from '@/types/index';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface RoleBadgeProps {
  role: UserRole;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const roleConfig = {
    admin: {
      label: t('roleBadge.admin'),
      color: theme.rose,
      icon: '👑',
    },

    moderator: {
      label: t('roleBadge.moderator'),
      color: theme.amber,
      icon: '🛡️',
    },

    user: {
      label: t('roleBadge.user'),
      color: theme.primary,
      icon: '⚡',
    },
  };

  const config = roleConfig[role] || roleConfig.user;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.color + '22',
          borderColor: config.color,
        },
      ]}
    >
      <Text style={styles.icon}>{config.icon}</Text>

      <Text
        style={[
          styles.label,
          {
            color: config.color,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },

  icon: {
    fontSize: 12,
  },

  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});