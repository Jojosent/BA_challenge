import { ChallengeCard } from '@components/shared/ChallengeCard';
import { LoadingSpinner } from '@components/shared/LoadingSpinner';
import { Colors } from '@constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useChallenge } from '@hooks/useChallenge';
import { Challenge } from '@/types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FilterType = 'all' | 'active' | 'pending' | 'completed';

export default function ChallengesScreen() {
    const router = useRouter();
    const { challenges, isLoading, fetchChallenges } = useChallenge();
    const [filter, setFilter] = useState<FilterType>('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchChallenges();
    }, []);

    const filtered = challenges.filter((c: Challenge) => {
        const matchesFilter = filter === 'all' || c.status === filter;
        const matchesSearch =
            search.trim() === '' ||
            c.title.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const filters: { key: FilterType; label: string }[] = [
        { key: 'all', label: 'Все' },
        { key: 'active', label: '🔥 Активные' },
        { key: 'pending', label: '⏳ Ожидание' },
        { key: 'completed', label: '🏆 Завершённые' },
    ];

    if (isLoading && challenges.length === 0) return <LoadingSpinner />;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Шапка */}
            <View style={styles.header}>
                <Text style={styles.title}>Челленджи</Text>
                <TouchableOpacity
                    style={styles.createBtn}
                    onPress={() => router.push('/challenge/create')}
                >
                    <Ionicons name="add" size={22} color={Colors.white} />
                </TouchableOpacity>
            </View>

            {/* Поиск */}
            <View style={styles.searchWrapper}>
                <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Поиск челленджей..."
                    placeholderTextColor={Colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Фильтры */}
            <View style={styles.filtersRow}>
                {filters.map((f) => (
                    <TouchableOpacity
                        key={f.key}
                        style={[styles.filterChip, filter === f.key && styles.filterActive]}
                        onPress={() => setFilter(f.key)}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                filter === f.key && styles.filterTextActive,
                            ]}
                        >
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Список */}
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <ChallengeCard challenge={item} />}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={fetchChallenges}
                        tintColor={Colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>🎯</Text>
                        <Text style={styles.emptyTitle}>Пока нет челленджей</Text>
                        <Text style={styles.emptyText}>
                            Создай первый и пригласи друзей!
                        </Text>
                        <TouchableOpacity
                            style={styles.emptyBtn}
                            onPress={() => router.push('/challenge/create')}
                        >
                            <Text style={styles.emptyBtnText}>Создать челлендж</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
    createBtn: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        padding: 10,
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        marginHorizontal: 20,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 8,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        color: Colors.textPrimary,
        fontSize: 15,
    },
    filtersRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 12,
        flexWrap: 'wrap',
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
    filterTextActive: { color: Colors.white },
    list: { paddingHorizontal: 20, paddingBottom: 20 },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
    emptyText: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24 },
    emptyBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 28,
        paddingVertical: 13,
        borderRadius: 12,
    },
    emptyBtnText: { color: Colors.white, fontWeight: '600', fontSize: 15 },
});