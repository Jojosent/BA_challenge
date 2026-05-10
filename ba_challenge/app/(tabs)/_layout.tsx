import { Colors } from '@constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '@hooks/useNotifications';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

const TabIcon = ({
  name,
  color,
  focused,
}: {
  name: any;
  color: string;
  focused: boolean;
}) => (
  <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
    <Ionicons name={name} size={22} color={color} />
  </View>
);

const HomeTabIcon = ({
  color,
  focused,
}: {
  color: string;
  focused: boolean;
}) => {
  const count = useNotificationStore((state) => state.count);

  return (
    <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
      <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />

      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </View>
  );
};

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.softBorder,
          borderTopWidth: 1,
          height: 76,
          paddingTop: 8,
          paddingBottom: 14,
          shadowColor: Colors.shadow,
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -6 },
          elevation: 10,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
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
            <HomeTabIcon color={color} focused={focused} />
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
            />
          ),
        }}
      />

      <Tabs.Screen
        name="ai-assistant"
        options={{
          title: t('tabs.ai'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'sparkles' : 'sparkles-outline'}
              color={color}
              focused={focused}
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
  iconWrapperActive: {
    backgroundColor: '#F1EEFF',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -7,
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  badgeTxt: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '900',
  },
});