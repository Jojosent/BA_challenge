import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { useChallenge } from '@hooks/useChallenge';
import { useAuthStore } from '@store/authStore';
import { Header } from '@components/shared/Header';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { ParticipantList } from '@components/shared/ParticipantList';
import { LoadingSpinner } from '@components/shared/LoadingSpinner';
import { AITaskGenerator } from '@components/shared/AITaskGenerator';
import { TaskFormModal } from '@components/shared/TaskFormModal';
import { taskService } from '@services/taskService';
import { Task } from '@/types/index';
import { InviteToChallengeModal } from '@components/shared/InviteToChallengeModal';

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    currentChallenge,
    currentTasks,
    isLoading,
    fetchChallenge,
    fetchTasks,
    joinChallenge,
    setCurrentTasks,
  } = useChallenge();

  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskLoading, setTaskLoading] = useState(false);

  // ✅ Состояния для модального окна пароля
  const [passwordModal, setPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    if (id) {
      fetchChallenge(Number(id));
      fetchTasks(Number(id));
    }
  }, [id]);

  if (isLoading && !currentChallenge) return <LoadingSpinner />;
  if (!currentChallenge) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Челлендж не найден</Text>
      </View>
    );
  }

  const c = currentChallenge;
  const isParticipant = c.participants?.some((p) => p.userId === user?.id);
  const isCreator = c.creatorId === user?.id;
  const isFamilyChallenge = !!c.familyOwnerId;
  const canEdit = isCreator;
  const isProtected = c.visibility === 'protected';

  const totalDays = Math.ceil(
    (new Date(c.endDate).getTime() - new Date(c.startDate).getTime()) /
    (1000 * 60 * 60 * 24)
  );

  const participantCount = c.participants?.length ?? 0;
  const prizePool = c.prizePool ?? (c.betAmount * participantCount);
  const prizeInfo = c.prizeInfo;

  // ✅ Основная кнопка "Вступить" — открывает пароль или сразу подтверждение
  const handleJoin = () => {
    if (isProtected) {
      setPasswordInput('');
      setPasswordError('');
      setPasswordVisible(false);
      setPasswordModal(true);
      return;
    }
    confirmJoin();
  };

  // ✅ Выполняет вступление (с паролем или без)
  const confirmJoin = (password?: string) => {
    const msg = c.betAmount > 0
      ? `Вступить? Спишется ${c.betAmount} 🪙 и добавится в призовой пул.`
      : 'Вступить в этот челлендж?';

    Alert.alert('Вступить в челлендж?', msg, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Вступить',
        onPress: async () => {
          const result = await joinChallenge(Number(id), password);
          if (result) {
            const poolMsg = c.betAmount > 0
              ? `\nПризовой пул: ${result.prizePool} 🪙`
              : '';
            Alert.alert('🎉', `Ты в игре!${poolMsg}`);
            setPasswordModal(false);
          }
        },
      },
    ]);
  };

  // ✅ Обработка отправки пароля
  const handlePasswordSubmit = () => {
    if (!passwordInput.trim()) {
      setPasswordError('Введи пароль');
      return;
    }
    confirmJoin(passwordInput.trim());
  };

  // Добавить задачу
  const handleAddTask = async (title: string, description: string) => {
    try {
      setTaskLoading(true);
      const updatedTasks = await taskService.create(Number(id), title, description);
      setCurrentTasks(updatedTasks);
      setTaskModalVisible(false);
    } catch (e: any) {
      Alert.alert('Нельзя добавить задачу', e.message || 'Ошибка при добавлении задачи');
    } finally {
      setTaskLoading(false);
    }
  };

  // Изменить задачу
  const handleEditTask = async (title: string, description: string) => {
    if (!editingTask) return;
    try {
      setTaskLoading(true);
      await taskService.update(editingTask.id, title, description);
      await fetchTasks(Number(id));
      setEditingTask(null);
      setTaskModalVisible(false);
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setTaskLoading(false);
    }
  };

  // Удалить задачу
  const handleDeleteTask = (task: Task) => {
    Alert.alert(
      'Удалить задачу?',
      `"${task.title}" будет удалена. Дедлайны остальных задач пересчитаются.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedTasks = await taskService.delete(task.id);
              setCurrentTasks(updatedTasks);
            } catch (e: any) {
              Alert.alert('Ошибка', e.message);
            }
          },
        },
      ]
    );
  };

  // Сдвинуть задачу
  const handleReorder = async (task: Task, direction: 'up' | 'down') => {
    try {
      const updatedTasks = await taskService.reorder(task.id, direction);
      setCurrentTasks(updatedTasks);
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Детали"
        showBack
        rightElement={
          canEdit ? (
            <TouchableOpacity onPress={() => { }}>
              <Ionicons name="settings-outline" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Главная инфо ── */}
        <View style={styles.heroSection}>
          <Text style={styles.challengeTitle}>{c.title}</Text>
          <Text style={styles.challengeDesc}>{c.description}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>
                {new Date(c.startDate).toLocaleDateString('ru-RU')} —{' '}
                {new Date(c.endDate).toLocaleDateString('ru-RU')}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{totalDays} дней</Text>
            </View>
            {c.betAmount > 0 && (
              <View style={styles.metaItem}>
                <Text style={styles.metaText}>🪙 {c.betAmount} взнос</Text>
              </View>
            )}
            {/* ✅ Бейдж защищённого */}
            {isProtected && (
              <View style={styles.protectedBadge}>
                <Ionicons name="shield-checkmark" size={12} color={Colors.warning} />
                <Text style={styles.protectedBadgeText}>Защищён паролем</Text>
              </View>
            )}
          </View>
        </View>

        {/* ✅ ── Призовой пул ── */}
        {c.betAmount > 0 && (
          <View style={styles.prizeSection}>
            <View style={styles.prizeHeader}>
              <Text style={styles.prizeHeaderIcon}>🏆</Text>
              <View style={styles.prizeHeaderTexts}>
                <Text style={styles.prizeHeaderTitle}>Призовой пул</Text>
                <Text style={styles.prizeHeaderSub}>
                  {c.betAmount} 🪙 × {participantCount} участников
                </Text>
              </View>
              <Text style={styles.prizeTotal}>{prizePool} 🪙</Text>
            </View>

            {prizeInfo && prizeInfo.prizes.length > 0 ? (
              <View style={styles.prizeTiers}>
                {prizeInfo.prizes.map((tier) => (
                  <View key={tier.place} style={styles.prizeTierRow}>
                    <Text style={styles.prizeTierLabel}>{tier.label}</Text>
                    <View style={styles.prizeTierRight}>
                      <Text style={styles.prizeTierPercent}>{tier.percent}%</Text>
                      <Text style={styles.prizeTierAmount}>{tier.amount} 🪙</Text>
                    </View>
                  </View>
                ))}
                {participantCount > 3 && (
                  <View style={styles.prizeLosers}>
                    <Text style={styles.prizeLosersText}>
                      😔 4+ место — монеты не возвращаются
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.prizeTiers}>
                <View style={styles.prizeTierRow}>
                  <Text style={styles.prizeTierLabel}>🥇 1 место</Text>
                  <View style={styles.prizeTierRight}>
                    <Text style={styles.prizeTierPercent}>50%</Text>
                    <Text style={styles.prizeTierAmount}>{Math.floor(prizePool * 0.5)} 🪙</Text>
                  </View>
                </View>
                <View style={styles.prizeTierRow}>
                  <Text style={styles.prizeTierLabel}>🥈 2 место</Text>
                  <View style={styles.prizeTierRight}>
                    <Text style={styles.prizeTierPercent}>30%</Text>
                    <Text style={styles.prizeTierAmount}>{Math.floor(prizePool * 0.3)} 🪙</Text>
                  </View>
                </View>
                <View style={styles.prizeTierRow}>
                  <Text style={styles.prizeTierLabel}>🥉 3 место</Text>
                  <View style={styles.prizeTierRight}>
                    <Text style={styles.prizeTierPercent}>20%</Text>
                    <Text style={styles.prizeTierAmount}>{Math.floor(prizePool * 0.2)} 🪙</Text>
                  </View>
                </View>
                {participantCount > 3 && (
                  <View style={styles.prizeLosers}>
                    <Text style={styles.prizeLosersText}>
                      😔 4+ место — монеты не возвращаются
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* ── Кнопка вступить ── */}
        {!isParticipant && !canEdit && c.status !== 'completed' && (
          <View style={styles.joinSection}>
            <Button
              title={
                isProtected
                  ? c.betAmount > 0
                    ? `🛡️ Вступить (взнос ${c.betAmount} 🪙)`
                    : '🛡️ Вступить (нужен пароль)'
                  : c.betAmount > 0
                    ? `🎯 Вступить (взнос ${c.betAmount} 🪙)`
                    : '🎯 Вступить в челлендж'
              }
              onPress={handleJoin}
              isLoading={isLoading}
            />
          </View>
        )}

        {isParticipant && !canEdit && (
          <View style={styles.joinedBadge}>
            <Text style={styles.joinedText}>✅ Ты участвуешь в этом челлендже</Text>
          </View>
        )}

        {/* ── AI генератор ── */}
        {canEdit && (
          <View style={styles.aiSection}>
            <AITaskGenerator
              challengeId={Number(id)}
              totalDays={totalDays}
              onGenerated={() => fetchTasks(Number(id))}
            />
          </View>
        )}

        {/* ── AI чат ── */}
        {(canEdit || isParticipant) && (
          <TouchableOpacity
            style={styles.aiChatBtn}
            onPress={() => router.push(`/challenge/ai-chat/${id}`)}
          >
            <Text style={styles.aiChatIcon}>🤖</Text>
            <View style={styles.aiChatTexts}>
              <Text style={styles.aiChatTitle}>AI Помощник</Text>
              <Text style={styles.aiChatSub}>Советы, мотивация, вопросы</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {/* ── Чат участников ── */}
        {(canEdit || isParticipant) && (
          <TouchableOpacity
            style={chatBtnChallStyle}
            onPress={() =>
              router.push(
                `/chat?roomType=challenge&roomId=${id}&title=${encodeURIComponent(`Чат: ${c.title}`)}`
              )
            }
          >
            <Text style={{ fontSize: 22 }}>💬</Text>
            <View style={{ flex: 1 }}>
              <Text style={chatTitleStyle}>Чат участников</Text>
              <Text style={chatSubStyle}>Обсуждение челленджа</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.accent} />
          </TouchableOpacity>
        )}

        {/* ── Кнопка пригласить ── */}
        {canEdit && c.visibility === 'secret' && !isFamilyChallenge && (
          <TouchableOpacity
            style={styles.inviteBtn}
            onPress={() => setInviteModalVisible(true)}
          >
            <Ionicons name="person-add-outline" size={18} color={Colors.white} />
            <Text style={styles.inviteBtnTxt}>Пригласить участника</Text>
          </TouchableOpacity>
        )}

        {/* ── Задачи ── */}
        <View style={styles.tasksTitleRow}>
          <Text style={styles.sectionTitle}>Задачи ({currentTasks.length})</Text>
          {canEdit && (
            <TouchableOpacity
              style={styles.addTaskBtn}
              onPress={() => {
                setEditingTask(null);
                setTaskModalVisible(true);
              }}
            >
              <Ionicons name="add" size={18} color={Colors.white} />
              <Text style={styles.addTaskTxt}>Добавить</Text>
            </TouchableOpacity>
          )}
        </View>

        {currentTasks.length > 0 ? (
          <View style={styles.tasksSection}>
            {currentTasks.map((task, index) => {
              const now = new Date();
              const deadline = task.deadline ? new Date(task.deadline) : null;
              const isExpired = deadline ? now > deadline : false;
              const daysLeft = deadline
                ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                : null;
              const isFirst = index === 0;
              const isLast = index === currentTasks.length - 1;

              return (
                <Card key={task.id} style={[styles.taskCard, isExpired && styles.taskExpired]}>
                  <View style={styles.taskInner}>

                    {canEdit && (
                      <View style={styles.reorderCol}>
                        <TouchableOpacity
                          style={[styles.arrowBtn, (isFirst || isExpired) && styles.arrowBtnDisabled]}
                          onPress={() => !isFirst && !isExpired && handleReorder(task, 'up')}
                          disabled={isFirst || isExpired}
                        >
                          <Ionicons
                            name="chevron-up"
                            size={18}
                            color={(isFirst || isExpired) ? Colors.textMuted : Colors.primary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.arrowBtn, (isLast || isExpired) && styles.arrowBtnDisabled]}
                          onPress={() => !isLast && !isExpired && handleReorder(task, 'down')}
                          disabled={isLast || isExpired}
                        >
                          <Ionicons
                            name="chevron-down"
                            size={18}
                            color={(isLast || isExpired) ? Colors.textMuted : Colors.primary}
                          />
                        </TouchableOpacity>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.taskContent}
                      onPress={() => {
                        if (isExpired) {
                          Alert.alert('⏰ Дедлайн прошёл', 'Время для загрузки истекло.');
                          return;
                        }
                        if (!isParticipant && !canEdit) {
                          Alert.alert('', 'Вступи в челлендж чтобы выполнять задачи');
                          return;
                        }
                        router.push(`/challenge/task/${task.id}?challengeId=${id}`);
                      }}
                      activeOpacity={isExpired ? 0.6 : 0.8}
                    >
                      <View style={styles.taskHeader}>
                        <View style={styles.dayBadge}>
                          <Text style={styles.dayText}>Задача {task.day}</Text>
                        </View>

                        {task.isAiGenerated ? (
                          <View style={styles.aiBadge}>
                            <Text style={styles.aiText}>🤖 AI</Text>
                          </View>
                        ) : (
                          <View style={styles.humanBadge}>
                            <Text style={styles.humanText}>👤 Вручную</Text>
                          </View>
                        )}

                        {isExpired ? (
                          <View style={styles.expiredBadge}>
                            <Text style={styles.expiredText}>⏰ Просрочено</Text>
                          </View>
                        ) : daysLeft !== null && daysLeft <= 2 ? (
                          <View style={styles.urgentBadge}>
                            <Text style={styles.urgentText}>🔥 {daysLeft} дн.</Text>
                          </View>
                        ) : deadline ? (
                          <View style={styles.deadlineBadge}>
                            <Text style={styles.deadlineText}>
                              до {deadline.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={[styles.taskTitle, isExpired && styles.textExpired]}>
                        {task.title}
                      </Text>
                      <Text style={[styles.taskDesc, isExpired && styles.textExpired]} numberOfLines={2}>
                        {task.description}
                      </Text>

                      {isExpired ? (
                        <Text style={styles.expiredHint}>🔒 Дедлайн прошёл</Text>
                      ) : (isParticipant || canEdit) ? (
                        <Text style={styles.tapHint}>Нажми чтобы загрузить доказательство →</Text>
                      ) : null}
                    </TouchableOpacity>

                    {canEdit && !isExpired && (
                      <View style={styles.taskActions}>
                        <TouchableOpacity
                          style={styles.editTaskBtn}
                          onPress={() => {
                            setEditingTask(task);
                            setTaskModalVisible(true);
                          }}
                        >
                          <Ionicons name="pencil" size={15} color={Colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteTaskBtn}
                          onPress={() => handleDeleteTask(task)}
                        >
                          <Ionicons name="trash-outline" size={15} color={Colors.error} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Задачи ещё не добавлены</Text>
            {canEdit ? (
              <Text style={styles.emptyText}>Сгенерируй через AI или добавь вручную</Text>
            ) : (
              <Text style={styles.emptyText}>Создатель пока не добавил задачи</Text>
            )}
          </Card>
        )}

        {/* ── Участники ── */}
        <Text style={[styles.sectionTitle, styles.sectionTitlePadded]}>
          Участники ({c.participants?.length ?? 0})
        </Text>
        <Card style={styles.participantsCard}>
          <ParticipantList
            participants={c.participants ?? []}
            creatorId={c.creatorId}
            betAmount={c.betAmount}
            prizePool={prizePool}
          />
        </Card>

      </ScrollView>

      {/* ✅ ── Модальное окно пароля ── */}
      <Modal
        visible={passwordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Заголовок */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="shield-checkmark" size={22} color={Colors.warning} />
                <Text style={styles.modalTitle}>Защищённый челлендж</Text>
              </View>
              <TouchableOpacity onPress={() => setPasswordModal(false)}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Этот челлендж защищён паролем. Введи пароль чтобы вступить.
            </Text>

            {/* Поле пароля */}
            <View style={[
              styles.passwordInputWrapper,
              passwordError ? styles.passwordInputError : null,
            ]}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.passwordInput}
                value={passwordInput}
                onChangeText={(t) => {
                  setPasswordInput(t);
                  setPasswordError('');
                }}
                placeholder="Введи пароль..."
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!passwordVisible}
                autoFocus
                autoCapitalize="none"
                onSubmitEditing={handlePasswordSubmit}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                <Ionicons
                  name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {passwordError ? (
              <Text style={styles.passwordErrorText}>{passwordError}</Text>
            ) : null}

            {/* Кнопки */}
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setPasswordModal(false)}
              >
                <Text style={styles.modalCancelTxt}>Отмена</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.passwordSubmitBtn,
                  (!passwordInput.trim() || isLoading) && styles.passwordSubmitBtnDisabled,
                ]}
                onPress={handlePasswordSubmit}
                disabled={!passwordInput.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.passwordSubmitTxt}>Вступить 🛡️</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Модалки задач */}
      <TaskFormModal
        visible={taskModalVisible}
        onClose={() => { setTaskModalVisible(false); setEditingTask(null); }}
        onSave={editingTask ? handleEditTask : handleAddTask}
        editTask={editingTask}
        isLoading={taskLoading}
      />

      <InviteToChallengeModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        challengeId={Number(id)}
      />
    </SafeAreaView>
  );
}

const chatBtnChallStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  backgroundColor: Colors.surface,
  marginHorizontal: 20,
  marginBottom: 16,
  borderRadius: 14,
  padding: 16,
  borderWidth: 1,
  borderColor: Colors.accent + '44',
  gap: 12,
};
const chatTitleStyle = { fontSize: 15, fontWeight: '700' as const, color: Colors.textPrimary };
const chatSubStyle = { fontSize: 12, color: Colors.textSecondary, marginTop: 2 };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: Colors.textSecondary, fontSize: 16 },

  heroSection: { padding: 20 },
  challengeTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  challengeDesc: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: 14 },
  metaRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: Colors.textSecondary },

  // ✅ Бейдж защищённого
  protectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.warning + '50',
  },
  protectedBadgeText: {
    fontSize: 11,
    color: Colors.warning,
    fontWeight: '600',
  },

  // Призовой пул
  prizeSection: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.rikon + '40',
    overflow: 'hidden',
  },
  prizeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.rikon + '12',
    borderBottomWidth: 1,
    borderBottomColor: Colors.rikon + '25',
    gap: 12,
  },
  prizeHeaderIcon: { fontSize: 28 },
  prizeHeaderTexts: { flex: 1 },
  prizeHeaderTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  prizeHeaderSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  prizeTotal: { fontSize: 22, fontWeight: '800', color: Colors.rikon },
  prizeTiers: { padding: 12, gap: 2 },
  prizeTierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  prizeTierLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  prizeTierRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  prizeTierPercent: { fontSize: 13, color: Colors.textMuted, width: 36, textAlign: 'right' },
  prizeTierAmount: { fontSize: 15, fontWeight: '700', color: Colors.rikon, minWidth: 60, textAlign: 'right' },
  prizeLosers: { paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center' },
  prizeLosersText: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic' },

  joinSection: { paddingHorizontal: 20, marginBottom: 12 },
  joinedBadge: {
    marginHorizontal: 20, backgroundColor: Colors.accent + '22',
    borderRadius: 10, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.accent,
  },
  joinedText: { color: Colors.accent, textAlign: 'center', fontWeight: '600' },

  aiSection: { paddingHorizontal: 20, marginBottom: 12 },
  aiChatBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, marginHorizontal: 20,
    marginBottom: 16, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.primary + '44', gap: 12,
  },
  aiChatIcon: { fontSize: 28 },
  aiChatTexts: { flex: 1 },
  aiChatTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  aiChatSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  inviteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.secondary,
    marginHorizontal: 20, marginBottom: 12,
    borderRadius: 12, padding: 14,
  },
  inviteBtnTxt: { color: Colors.white, fontWeight: '700', fontSize: 14 },

  sectionTitlePadded: { paddingHorizontal: 20 },
  tasksTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20,
    marginBottom: 10, marginTop: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  addTaskBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, paddingHorizontal: 12,
    paddingVertical: 7, borderRadius: 10,
  },
  addTaskTxt: { color: Colors.white, fontWeight: '600', fontSize: 13 },

  tasksSection: { paddingHorizontal: 20, marginBottom: 16 },
  taskCard: { marginBottom: 10, padding: 0, overflow: 'hidden' },
  taskExpired: { opacity: 0.5, borderColor: Colors.textMuted },
  taskInner: { flexDirection: 'row', alignItems: 'stretch' },

  reorderCol: {
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4, paddingVertical: 12,
    borderRightWidth: 1, borderRightColor: Colors.border, gap: 4,
  },
  arrowBtn: { padding: 6, borderRadius: 6 },
  arrowBtnDisabled: { opacity: 0.25 },

  taskContent: { flex: 1, padding: 12 },
  taskHeader: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  dayBadge: { backgroundColor: Colors.primary + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  dayText: { color: Colors.primary, fontSize: 11, fontWeight: '600' },
  aiBadge: { backgroundColor: Colors.secondary + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  aiText: { color: Colors.secondary, fontSize: 11, fontWeight: '600' },
  humanBadge: { backgroundColor: Colors.accent + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  humanText: { color: Colors.accent, fontSize: 11, fontWeight: '600' },
  expiredBadge: { backgroundColor: Colors.error + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  expiredText: { color: Colors.error, fontSize: 11, fontWeight: '600' },
  urgentBadge: { backgroundColor: Colors.warning + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  urgentText: { color: Colors.warning, fontSize: 11, fontWeight: '600' },
  deadlineBadge: { backgroundColor: Colors.accent + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  deadlineText: { color: Colors.accent, fontSize: 11, fontWeight: '600' },

  taskTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  taskDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 6 },
  textExpired: { color: Colors.textMuted },
  tapHint: { fontSize: 11, color: Colors.primary, fontStyle: 'italic' },
  expiredHint: { fontSize: 11, color: Colors.error, fontStyle: 'italic' },

  taskActions: {
    justifyContent: 'center', gap: 6,
    paddingHorizontal: 8, paddingVertical: 12,
    borderLeftWidth: 1, borderLeftColor: Colors.border,
  },
  editTaskBtn: {
    padding: 8, borderRadius: 8,
    backgroundColor: Colors.primary + '15',
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  deleteTaskBtn: {
    padding: 8, borderRadius: 8,
    backgroundColor: Colors.error + '15',
    borderWidth: 1, borderColor: Colors.error + '30',
  },

  emptyCard: { marginHorizontal: 20, marginBottom: 16, alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },

  participantsCard: { marginHorizontal: 20, marginBottom: 30 },

  // ✅ Модальное окно пароля
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  passwordInputError: {
    borderColor: Colors.error,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  passwordErrorText: {
    color: Colors.error,
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  modalCancelTxt: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  passwordSubmitBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordSubmitBtnDisabled: {
    opacity: 0.45,
  },
  passwordSubmitTxt: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});