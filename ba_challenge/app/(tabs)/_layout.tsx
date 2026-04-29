import { Colors } from '@constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { useNotificationStore } from '@hooks/useNotifications';

// Кастомная иконка с точкой фокуса
const TabIcon = ({
    name,
    color,
    focused,
}: {
    name: any;
    color: string;
    focused: boolean;
}) => (
    <View style={tabStyles.iconWrapper}>
        <Ionicons name={name} size={24} color={color} />
        {focused && <View style={tabStyles.dot} />}
    </View>
);


// Иконка главной вкладки с бейджем уведомлений
const HomeTabIcon = ({
    color,
    focused,
}: {
    color: string;
    focused: boolean;
}) => {
    const count = useNotificationStore((state) => state.count);

    return (
        <View style={tabStyles.iconWrapper}>
            <View style={tabStyles.iconWithBadge}>
                <Ionicons
                    name={focused ? 'home' : 'home-outline'}
                    size={24}
                    color={color}
                />
                {count > 0 && (
                    <View style={tabStyles.badge}>
                        <Text style={tabStyles.badgeTxt}>
                            {count > 9 ? '9+' : count}
                        </Text>
                    </View>
                )}
            </View>
            {focused && <View style={tabStyles.dot} />}
        </View>
    );
};

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: Colors.surface,
                    borderTopColor: Colors.border,
                    borderTopWidth: 1,
                    height: 65,
                    paddingBottom: 10,
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Главная',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="challenges"
                options={{
                    title: 'Челленджи',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name={focused ? 'trophy' : 'trophy-outline'} color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="ai-assistant"
                options={{
                    title: 'AI',
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
                    title: 'Профиль',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name={focused ? 'person' : 'person-outline'} color={color} focused={focused} />
                    ),
                }}
            />
        </Tabs>
    );
}

const tabStyles = StyleSheet.create({
    iconWrapper: { alignItems: 'center', justifyContent: 'center' },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.primary,
        marginTop: 3,
    },
    iconWithBadge: {
        position: 'relative',
    },

    badge: {
        position: 'absolute',
        top: -6,
        right: -10,
        backgroundColor: Colors.error,
        borderRadius: 9,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: Colors.surface,
    },
    badgeTxt: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: '800',
    },
});