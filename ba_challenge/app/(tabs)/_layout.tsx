import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '@hooks/useNotifications';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

const TabIcon = ({
  name,
  color,
  focused,
  theme,
}: {
  name: any;
  color: string;
  focused: boolean;
  theme: any;
}) => (
  <View
    style={[
      styles.iconWrapper,
      focused && {
        backgroundColor: theme.primaryLight,
      },
    ]}
  >
    <Ionicons name={name} size={22} color={color} />
  </View>
);

const HomeTabIcon = ({
  color,
  focused,
  theme,
}: {
  color: string;
  focused: boolean;
  theme: any;
}) => {
  const count = useNotificationStore((state) => state.count);

  return (
    <View
      style={[
        styles.iconWrapper,
        focused && {
          backgroundColor: theme.primaryLight,
        },
      ]}
    >
      <Ionicons
        name={focused ? 'home' : 'home-outline'}
        size={22}
        color={color}
      />

      {count > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.rose, borderColor: theme.bg }]}>
          <Text style={styles.badgeTxt}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </View>
  );
};

export default function TabsLayout() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const isDark = theme.key === 'midnight';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // 🔥 TAB BAR FIX
        tabBarStyle: {
          backgroundColor: theme.bg,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 76,
          paddingTop: 8,
          paddingBottom: 14,
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.35 : 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -6 },
          elevation: 10,
        },

        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <HomeTabIcon color={color} focused={focused} theme={theme} />
          ),
        }}
      />

      <Tabs.Screen
        name="challenges"
        options={{
          title: t('tabs.challenges'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'trophy' : 'trophy-outline'}
              color={color}
              focused={focused}
              theme={theme}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'person' : 'person-outline'}
              color={color}
              focused={focused}
              theme={theme}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    width: 38,
    height: 30,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badge: {
    position: 'absolute',
    top: -5,
    right: -7,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
  },

  badgeTxt: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
});