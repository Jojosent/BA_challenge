import { Colors } from '@constants/colors';
import { UserRole } from '@/types/index';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface RoleBadgeProps {
    role: UserRole;
}

const roleConfig = {
    admin: { label: 'Admin', color: Colors.secondary, icon: '👑' },
    moderator: { label: 'Moderator', color: Colors.warning, icon: '🛡️' },
    user: { label: 'User', color: Colors.accent, icon: '⚡' },
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
    const config = roleConfig[role];

    return (
        <View style={[styles.badge, { backgroundColor: config.color + '22', borderColor: config.color }]}>
            <Text style={styles.icon}>{config.icon}</Text>
            <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
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
    icon: { fontSize: 12 },
    label: { fontSize: 12, fontWeight: '600' },
});