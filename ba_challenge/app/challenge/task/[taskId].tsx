import { Submission } from '@/types/index';
import { Header } from '@components/shared/Header';
import { LoadingSpinner } from '@components/shared/LoadingSpinner';
import { MediaUploader } from '@components/shared/MediaUploader';
import { SubmissionCard } from '@components/shared/SubmissionCard';
import { Card } from '@components/ui/Card';
import { Colors } from '@constants/colors';
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

export default function TaskScreen() {
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
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title={`Задача ${task.day}`} showBack />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={fetchSubmissions}
                        tintColor={Colors.primary}
                    />
                }
            >
{/* Описание задачи */}
<Card style={styles.taskCard}>
  <View style={styles.taskHeader}>
    <View style={styles.dayBadge}>
      <Text style={styles.dayText}>Задача {task.day}</Text>
    </View>

    {/* ✅ AI или человек */}
    {task.isAiGenerated ? (
      <View style={styles.aiBadge}>
        <Text style={styles.aiText}>🤖 AI задача</Text>
      </View>
    ) : (
      <View style={styles.humanBadge}>
        <Text style={styles.humanText}>👤 Создана вручную</Text>
      </View>
    )}
  </View>

  <Text style={styles.taskTitle}>{task.title}</Text>
  <Text style={styles.taskDesc}>{task.description}</Text>
</Card>

                {/* Загрузка доказательства */}
                <Text style={styles.sectionTitle}>Загрузи доказательство</Text>
                <View style={styles.uploaderWrapper}>
                    <MediaUploader taskId={Number(taskId)} onSuccess={fetchSubmissions} />
                </View>

                {/* Список сабмишенов */}
                <Text style={styles.sectionTitle}>
                    Доказательства ({submissions.length})
                </Text>

                {isLoading && submissions.length === 0 ? (
                    <LoadingSpinner />
                ) : submissions.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Text style={styles.emptyText}>
                            Пока никто не загрузил доказательства
                        </Text>
                    </Card>
                ) : (
                    <View style={styles.submissionsList}>
                        {submissions.map((s) => (
                            <SubmissionCard key={s.id} submission={s} />
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // В StyleSheet.create добавь:
humanBadge: {
  backgroundColor: Colors.accent + '22',
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 6,
},
humanText: {
  color: Colors.accent,
  fontSize: 11,
  fontWeight: '600',
},
    container: { flex: 1, backgroundColor: Colors.background },

    taskCard: { margin: 20, marginBottom: 8 },
    taskHeader: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    dayBadge: {
        backgroundColor: Colors.primary + '22',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    dayText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
    aiBadge: {
        backgroundColor: Colors.secondary + '22',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    aiText: { color: Colors.secondary, fontSize: 12, fontWeight: '600' },
    taskTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    taskDesc: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
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
    emptyText: { color: Colors.textMuted, fontSize: 14 },
});