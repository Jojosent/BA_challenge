import { Submission } from '@/types/index';
import { Header } from '@components/shared/Header';
import { LoadingSpinner } from '@components/shared/LoadingSpinner';
import { MediaUploader } from '@components/shared/MediaUploader';
import { SubmissionCard } from '@components/shared/SubmissionCard';
import { Card } from '@components/ui/Card';
import { useChallenge } from '@hooks/useChallenge';
import { submissionService } from '@services/submissionService';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';

export default function TaskScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();

    const { taskId, challengeId } = useLocalSearchParams<{
        taskId: string;
        challengeId: string;
    }>();

    const { currentTasks } = useChallenge();
    const task = currentTasks.find((t) => t.id === Number(taskId));

    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchSubmissions = async () => {
        if (!taskId) return;
        try {
            setIsLoading(true);
            const data = await submissionService.getByTask(Number(taskId));
            setSubmissions(data);
        } catch (e) {
            console.log('Ошибка загрузки сабмишенов:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taskId]);

    if (!task) return <LoadingSpinner />;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
            <Header title={t('taskScreen.headerTitle', { day: task.day })} showBack />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={fetchSubmissions}
                        tintColor={theme.primary}
                    />
                }
            >
                {/* Описание задачи */}
                <Card style={styles.taskCard}>
                    <View style={styles.taskHeader}>
                        <View style={[styles.dayBadge, { backgroundColor: theme.primary + '22' }]}>
                            <Text style={[styles.dayText, { color: theme.primary }]}>
                                {t('taskScreen.taskDay', { day: task.day })}
                            </Text>
                        </View>

                        {/* ✅ AI или человек */}
                        {task.isAiGenerated ? (
                            <View style={[styles.aiBadge, { backgroundColor: theme.rose + '22' }]}>
                                <Text style={[styles.aiText, { color: theme.rose }]}>
                                    🤖 {t('taskScreen.aiTask')}
                                </Text>
                            </View>
                        ) : (
                            <View style={[styles.humanBadge, { backgroundColor: theme.accent + '22' }]}>
                                <Text style={[styles.humanText, { color: theme.accent }]}>
                                    👤 {t('taskScreen.manualTask')}
                                </Text>
                            </View>
                        )}
                    </View>

                    <Text style={[styles.taskTitle, { color: theme.textPrimary }]}>{task.title}</Text>
                    <Text style={[styles.taskDesc, { color: theme.textSecondary }]}>{task.description}</Text>
                </Card>

                {/* Загрузка доказательства */}
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                    {t('taskScreen.uploadProof')}
                </Text>
                <View style={styles.uploaderWrapper}>
                    <MediaUploader taskId={Number(taskId)} onSuccess={fetchSubmissions} />
                </View>

                {/* Список сабмишенов */}
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                    {t('taskScreen.proofsCount', { count: submissions.length })}
                </Text>

                {isLoading && submissions.length === 0 ? (
                    <LoadingSpinner />
                ) : submissions.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                            {t('taskScreen.noProofs')}
                        </Text>
                    </Card>
                ) : (
                    <View style={styles.submissionsList}>
                        {submissions.map((s) => (
                            <SubmissionCard
                                key={s.id}
                                submission={s}
                                onUpdated={fetchSubmissions}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    humanBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    humanText: {
        fontSize: 11,
        fontWeight: '600',
    },
    container: { flex: 1 },

    taskCard: { margin: 20, marginBottom: 8 },
    taskHeader: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    dayBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    dayText: { fontSize: 12, fontWeight: '600' },
    aiBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    aiText: { fontSize: 12, fontWeight: '600' },
    taskTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    taskDesc: {
        fontSize: 14,
        lineHeight: 20,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        paddingHorizontal: 20,
        marginTop: 16,
        marginBottom: 12,
    },
    uploaderWrapper: { paddingHorizontal: 20 },
    submissionsList: { paddingHorizontal: 20, paddingBottom: 30 },

    emptyCard: {
        marginHorizontal: 20,
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyText: { fontSize: 14 },
});