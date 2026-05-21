import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { challengeService } from '@services/challengeService';
import { useTheme } from '@/theme/ThemeContext';
import { Colors } from '@constants/colors';

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'ru';
  const { user } = useAuthStore();
  const { theme } = useTheme();

  const {
    currentChallenge,
    currentTasks,
    isLoading,
    fetchChallenge,
    fetchTasks,
    joinChallenge,
    setCurrentTasks,
    kickParticipant,
  } = useChallenge();

  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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
      <View style={[styles.centered, { backgroundColor: theme.bg }]}>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>
          {t('challengeDetails.notFound')}
        </Text>
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
  const prizePool = c.prizePool ?? c.betAmount * participantCount;
  const prizeInfo = c.prizeInfo;

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

  const handleActivate = () => {
    Alert.alert(
      t('challengeDetails.activateTitle'),
      t('challengeDetails.activateMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('challengeDetails.activateButton'),
          onPress: async () => {
            try {
              setIsUpdatingStatus(true);
              await challengeService.updateStatus(Number(id), 'active');
              await fetchChallenge(Number(id));
            } catch (e: any) {
              Alert.alert(t('common.error'), e.message);
            } finally {
              setIsUpdatingStatus(false);
            }
          },
        },
      ]
    );
  };

  const confirmJoin = (password?: string) => {
    const msg =
      c.betAmount > 0
        ? t('challengeDetails.joinWithBet', { amount: c.betAmount })
        : t('challengeDetails.joinSimple');

    Alert.alert(t('challengeDetails.joinTitle'), msg, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('challengeDetails.joinButton'),
        onPress: async () => {
          const result = await joinChallenge(Number(id), password);

          if (result) {
            const poolMsg =
              c.betAmount > 0
                ? t('challengeDetails.prizePoolResult', {
                    amount: result.prizePool,
                  })
                : '';

            Alert.alert(
              '🎉',
              t('challengeDetails.joinSuccess', {
                pool: poolMsg,
              })
            );

            setPasswordModal(false);
          }
        },
      },
    ]);
  };

  const handlePasswordSubmit = () => {
    if (!passwordInput.trim()) {
      setPasswordError(t('challengeDetails.enterPassword'));
      return;
    }

    confirmJoin(passwordInput.trim());
  };

  const handleAddTask = async (title: string, description: string) => {
    try {
      setTaskLoading(true);
      const updatedTasks = await taskService.create(Number(id), title, description);
      setCurrentTasks(updatedTasks);
      setTaskModalVisible(false);
    } catch (e: any) {
      Alert.alert(
        t('challengeDetails.cannotAddTask'),
        e.message || t('challengeDetails.addTaskError')
      );
    } finally {
      setTaskLoading(false);
    }
  };

  const handleEditTask = async (title: string, description: string) => {
    if (!editingTask) return;

    try {
      setTaskLoading(true);
      await taskService.update(editingTask.id, title, description);
      await fetchTasks(Number(id));
      setEditingTask(null);
      setTaskModalVisible(false);
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setTaskLoading(false);
    }
  };

  const handleDeleteTask = (task: Task) => {
    Alert.alert(
      t('challengeDetails.deleteTaskTitle'),
      t('challengeDetails.deleteTaskMessage', {
        title: task.title,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedTasks = await taskService.delete(task.id);
              setCurrentTasks(updatedTasks);
            } catch (e: any) {
              Alert.alert(t('common.error'), e.message);
            }
          },
        },
      ]
    );
  };

  const handleReorder = async (task: Task, direction: 'up' | 'down') => {
    try {
      const updatedTasks = await taskService.reorder(task.id, direction);
      setCurrentTasks(updatedTasks);
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    }
  };
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <Header
        title={t('challengeDetails.title')}
        showBack
        rightElement={
          canEdit ? (
            <TouchableOpacity onPress={() => {}}>
              <Ionicons name="settings-outline" size={22} color={theme.textPrimary} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={[styles.challengeTitle, { color: theme.textPrimary }]}>{c.title}</Text>
          <Text style={[styles.challengeDesc, { color: theme.textSecondary }]}>{c.description}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {new Date(c.startDate).toLocaleDateString(locale)} —{' '}
                {new Date(c.endDate).toLocaleDateString(locale)}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {t('challengeDetails.daysCount', { count: totalDays })}
              </Text>
            </View>

            {c.betAmount > 0 && (
              <View style={styles.metaItem}>
                <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                  {t('challengeDetails.betAmount', { amount: c.betAmount })}
                </Text>
              </View>
            )}

            {isProtected && (
              <View style={[styles.protectedBadge, { backgroundColor: theme.amber + '20', borderColor: theme.amber + '50' }]}>
                <Ionicons name="shield-checkmark" size={12} color={theme.amber} />
                <Text style={[styles.protectedBadgeText, { color: theme.amber }]}>
                  {t('challengeDetails.protected')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {c.betAmount > 0 && (
          <View style={[styles.prizeSection, { backgroundColor: theme.surface, borderColor: theme.amber + '40' }]}>
            <View style={[styles.prizeHeader, { backgroundColor: theme.amber + '12', borderBottomColor: theme.amber + '25' }]}>
              <Text style={styles.prizeHeaderIcon}>🏆</Text>

              <View style={styles.prizeHeaderTexts}>
                <Text style={[styles.prizeHeaderTitle, { color: theme.textPrimary }]}>
                  {t('challengeDetails.prizePool')}
                </Text>
                <Text style={[styles.prizeHeaderSub, { color: theme.textSecondary }]}>
                  {t('challengeDetails.poolFormula', {
                    amount: c.betAmount,
                    count: participantCount,
                  })}
                </Text>
              </View>

              <Text style={[styles.prizeTotal, { color: theme.amber }]}>{prizePool} 🪙</Text>
            </View>

            {prizeInfo && prizeInfo.prizes.length > 0 ? (
              <View style={styles.prizeTiers}>
                {prizeInfo.prizes.map((tier) => (
                  <View key={tier.place} style={[styles.prizeTierRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.prizeTierLabel, { color: theme.textPrimary }]}>{tier.label}</Text>
                    <View style={styles.prizeTierRight}>
                      <Text style={[styles.prizeTierPercent, { color: theme.textMuted }]}>{tier.percent}%</Text>
                      <Text style={[styles.prizeTierAmount, { color: theme.amber }]}>{tier.amount} 🪙</Text>
                    </View>
                  </View>
                ))}

                {participantCount > 3 && (
                  <View style={styles.prizeLosers}>
                    <Text style={[styles.prizeLosersText, { color: theme.textMuted }]}>
                      {t('challengeDetails.noCoinsForFourthPlace')}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.prizeTiers}>
                <View style={[styles.prizeTierRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.prizeTierLabel, { color: theme.textPrimary }]}>
                    {t('challengeDetails.firstPlace')}
                  </Text>
                  <View style={styles.prizeTierRight}>
                    <Text style={[styles.prizeTierPercent, { color: theme.textMuted }]}>50%</Text>
                    <Text style={[styles.prizeTierAmount, { color: theme.amber }]}>
                      {Math.floor(prizePool * 0.5)} 🪙
                    </Text>
                  </View>
                </View>

                <View style={[styles.prizeTierRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.prizeTierLabel, { color: theme.textPrimary }]}>
                    {t('challengeDetails.secondPlace')}
                  </Text>
                  <View style={styles.prizeTierRight}>
                    <Text style={[styles.prizeTierPercent, { color: theme.textMuted }]}>30%</Text>
                    <Text style={[styles.prizeTierAmount, { color: theme.amber }]}>
                      {Math.floor(prizePool * 0.3)} 🪙
                    </Text>
                  </View>
                </View>

                <View style={[styles.prizeTierRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.prizeTierLabel, { color: theme.textPrimary }]}>
                    {t('challengeDetails.thirdPlace')}
                  </Text>
                  <View style={styles.prizeTierRight}>
                    <Text style={[styles.prizeTierPercent, { color: theme.textMuted }]}>20%</Text>
                    <Text style={[styles.prizeTierAmount, { color: theme.amber }]}>
                      {Math.floor(prizePool * 0.2)} 🪙
                    </Text>
                  </View>
                </View>

                {participantCount > 3 && (
                  <View style={styles.prizeLosers}>
                    <Text style={[styles.prizeLosersText, { color: theme.textMuted }]}>
                      {t('challengeDetails.noCoinsForFourthPlace')}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {!isParticipant && !canEdit && c.status !== 'completed' && (
          <View style={styles.joinSection}>
            <Button
              title={
                isProtected
                  ? c.betAmount > 0
                    ? t('challengeDetails.joinProtectedWithBet', {
                        amount: c.betAmount,
                      })
                    : t('challengeDetails.joinProtected')
                  : c.betAmount > 0
                    ? t('challengeDetails.joinPublicWithBet', {
                        amount: c.betAmount,
                      })
                    : t('challengeDetails.joinChallenge')
              }
              onPress={handleJoin}
              isLoading={isLoading}
            />
          </View>
        )}

        {canEdit && c.status === 'pending' && (
          <View style={styles.joinSection}>
            <Button
              title={
                isUpdatingStatus
                  ? t('challengeDetails.activating')
                  : t('challengeDetails.activateChallenge')
              }
              onPress={handleActivate}
              isLoading={isUpdatingStatus}
              variant="outline"
            />
            <Text style={[styles.activateHint, { color: theme.textMuted }]}>
              {t('challengeDetails.autoStartHint')}
            </Text>
          </View>
        )}

        {isParticipant && !canEdit && (
          <View style={[styles.joinedBadge, { backgroundColor: theme.accent + '22', borderColor: theme.accent }]}>
            <Text style={[styles.joinedText, { color: theme.accent }]}>
              {t('challengeDetails.youParticipate')}
            </Text>
          </View>
        )}

        {canEdit && (
          <View style={styles.aiSection}>
            <AITaskGenerator
              challengeId={Number(id)}
              totalDays={totalDays}
              onGenerated={() => fetchTasks(Number(id))}
            />
          </View>
        )}

        {/* ── Чат участников ── */}
        {(canEdit || isParticipant) && (
          <TouchableOpacity
            style={[styles.chatBtnChall,
              {
                backgroundColor: theme.surface,
                borderColor: theme.accent + '44',
              },
            ]}
            onPress={() =>
              router.push(
                `/chat?roomType=challenge&roomId=${id}&title=${encodeURIComponent(
                  t('challengeDetails.chatWithTitle', { title: c.title })
                )}`
              )
            }
          >
            <Text style={{ fontSize: 22 }}>💬</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.chatTitle, { color: theme.textPrimary }]}>{t('challengeDetails.chat')}</Text>
              <Text style={[styles.chatSub, { color: theme.textSecondary }]}>{t('challengeDetails.chatSub')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.accent} />
          </TouchableOpacity>
        )}

        {/* ── Кнопка пригласить ── */}
        {canEdit && c.visibility === 'secret' && !isFamilyChallenge && (
          <TouchableOpacity
            style={[styles.inviteBtn, { backgroundColor: theme.rose }]}
            onPress={() => setInviteModalVisible(true)}
          >
            <Ionicons name="person-add-outline" size={18} color="#ffffff" />
            <Text style={styles.inviteBtnTxt}>
              {t('challengeDetails.inviteParticipant')}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Задачи ── */}
        <View style={styles.tasksTitleRow}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {t('challengeDetails.tasks')} ({currentTasks.length})
          </Text>

          {canEdit && (
            <TouchableOpacity
              style={[styles.addTaskBtn, { backgroundColor: theme.primary }]}
              onPress={() => {
                setEditingTask(null);
                setTaskModalVisible(true);
              }}
            >
              <Ionicons name="add" size={18} color="#ffffff" />
              <Text style={styles.addTaskTxt}>{t('common.create')}</Text>
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
                <Card key={task.id} style={[styles.taskCard, isExpired && styles.taskExpired, { borderColor: theme.border }]}>
                  <View style={styles.taskInner}>
                    {canEdit && (
                      <View style={[styles.reorderCol, { borderRightColor: theme.border }]}>
                        <TouchableOpacity
                          style={[styles.arrowBtn, (isFirst || isExpired) && styles.arrowBtnDisabled]}
                          onPress={() => !isFirst && !isExpired && handleReorder(task, 'up')}
                          disabled={isFirst || isExpired}
                        >
                          <Ionicons
                            name="chevron-up"
                            size={18}
                            color={(isFirst || isExpired) ? theme.textMuted : theme.primary}
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
                            color={(isLast || isExpired) ? theme.textMuted : theme.primary}
                          />
                        </TouchableOpacity>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.taskContent}
                      onPress={() => {
                        if (isExpired) {
                          Alert.alert(
                            t('challengeDetails.deadlinePassed'),
                            t('challengeDetails.deadlineExpiredMessage')
                          );
                          return;
                        }

                        if (!isParticipant && !canEdit) {
                          Alert.alert('', t('challengeDetails.joinToComplete'));
                          return;
                        }

                        router.push(`/challenge/task/${task.id}?challengeId=${id}`);
                      }}
                      activeOpacity={isExpired ? 0.6 : 0.8}
                    >
                      <View style={styles.taskHeader}>
                        <View style={[styles.dayBadge, { backgroundColor: theme.primary + '22' }]}>
                          <Text style={[styles.dayText, { color: theme.primary }]}>
                            {t('challengeDetails.taskDay', { day: task.day })}
                          </Text>
                        </View>

                        {task.isAiGenerated ? (
                          <View style={[styles.aiBadge, { backgroundColor: theme.rose + '22' }]}>
                            <Text style={[styles.aiText, { color: theme.rose }]}>🤖 AI</Text>
                          </View>
                        ) : (
                          <View style={[styles.humanBadge, { backgroundColor: theme.accent + '22' }]}>
                            <Text style={[styles.humanText, { color: theme.accent }]}>
                              {t('challengeDetails.manual')}
                            </Text>
                          </View>
                        )}

                        {isExpired ? (
                          <View style={[styles.expiredBadge, { backgroundColor: theme.rose + '22' }]}>
                            <Text style={[styles.expiredText, { color: theme.rose }]}>
                              {t('challengeDetails.expired')}
                            </Text>
                          </View>
                        ) : daysLeft !== null && daysLeft <= 2 ? (
                          <View style={[styles.urgentBadge, { backgroundColor: theme.amber + '22' }]}>
                            <Text style={[styles.urgentText, { color: theme.amber }]}>
                              🔥 {t('challengeDetails.daysLeftShort', { count: daysLeft })}
                            </Text>
                          </View>
                        ) : deadline ? (
                          <View style={[styles.deadlineBadge, { backgroundColor: theme.accent + '22' }]}>
                            <Text style={[styles.deadlineText, { color: theme.accent }]}>
                              {t('challengeDetails.until')}{' '}
                              {deadline.toLocaleDateString(locale, {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={[styles.taskTitle, { color: isExpired ? theme.textMuted : theme.textPrimary }]}>
                        {task.title}
                      </Text>

                      <Text
                        style={[styles.taskDesc, { color: isExpired ? theme.textMuted : theme.textSecondary }]}
                        numberOfLines={2}
                      >
                        {task.description}
                      </Text>

                      {isExpired ? (
                        <Text style={[styles.expiredHint, { color: theme.rose }]}>
                          🔒 {t('challengeDetails.deadlinePassed')}
                        </Text>
                      ) : (isParticipant || canEdit) ? (
                        <Text style={[styles.tapHint, { color: theme.primary }]}>
                          {t('challengeDetails.uploadProof')}
                        </Text>
                      ) : null}
                    </TouchableOpacity>

                    {canEdit && !isExpired && (
                      <View style={[styles.taskActions, { borderLeftColor: theme.border }]}>
                        <TouchableOpacity
                          style={[styles.editTaskBtn, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}
                          onPress={() => {
                            setEditingTask(task);
                            setTaskModalVisible(true);
                          }}
                        >
                          <Ionicons name="pencil" size={15} color={theme.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.deleteTaskBtn, { backgroundColor: theme.rose + '15', borderColor: theme.rose + '30' }]}
                          onPress={() => handleDeleteTask(task)}
                        >
                          <Ionicons name="trash-outline" size={15} color={theme.rose} />
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

            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {t('challengeDetails.noTasks')}
            </Text>

            {canEdit ? (
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {t('challengeDetails.noTasksCreator')}
              </Text>
            ) : (
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {t('challengeDetails.noTasksParticipant')}
              </Text>
            )}
          </Card>
        )}

        {/* ── Участники ── */}
        <Text style={[styles.sectionTitle, styles.sectionTitlePadded, { color: theme.textPrimary }]}>
          {t('challengeDetails.participants')} ({c.participants?.length ?? 0})
        </Text>

        <Card style={styles.participantsCard}>
          <ParticipantList
            participants={c.participants ?? []}
            creatorId={c.creatorId}
            betAmount={c.betAmount}
            prizePool={prizePool}
            currentUserId={user?.id}
            onKick={async (participant) => {
              const result = await kickParticipant(Number(id), participant.userId);

              if (result) {
                Alert.alert(t('common.success'), result.message);
              } else {
                Alert.alert(
                  t('common.error'),
                  t('challengeDetails.kickParticipantError')
                );
              }
            }}
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
            <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <Ionicons name="shield-checkmark" size={22} color={theme.amber} />
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                    {t('challengeDetails.protectedModalTitle')}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => setPasswordModal(false)}>
                  <Ionicons name="close" size={22} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                {t('challengeDetails.protectedModalSubtitle')}
              </Text>

              <View
                style={[
                  styles.passwordInputWrapper,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  passwordError ? { borderColor: theme.rose } : null,
                ]}
              >
                <Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} />

                <TextInput
                  style={[styles.passwordInput, { color: theme.textPrimary }]}
                  value={passwordInput}
                  onChangeText={(value) => {
                    setPasswordInput(value);
                    setPasswordError('');
                  }}
                  placeholder={t('challengeDetails.passwordPlaceholder')}
                  placeholderTextColor={theme.textMuted}
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
                    color={theme.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {passwordError ? (
                <Text style={[styles.passwordErrorText, { color: theme.rose }]}>{passwordError}</Text>
              ) : null}

              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { borderColor: theme.border }]}
                  onPress={() => setPasswordModal(false)}
                >
                  <Text style={[styles.modalCancelTxt, { color: theme.textSecondary }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.passwordSubmitBtn,
                    (!passwordInput.trim() || isLoading) && styles.passwordSubmitBtnDisabled,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={handlePasswordSubmit}
                  disabled={!passwordInput.trim() || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.passwordSubmitTxt}>
                      {t('challengeDetails.joinProtected')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Модалки задач */}
        <TaskFormModal
          visible={taskModalVisible}
          onClose={() => {
            setTaskModalVisible(false);
            setEditingTask(null);
          }}
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

const styles = StyleSheet.create({
          activateHint: {
            fontSize: 12,
            color: Colors.textMuted,
            textAlign: 'center',
            marginTop: 6,
          },
          container: { flex: 1, backgroundColor: Colors.background },
          centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
          errorText: { color: Colors.textSecondary, fontSize: 16 },

          heroSection: { padding: 20 },
          challengeTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
          challengeDesc: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: 14 },
          metaRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
          metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
          metaText: { fontSize: 13, color: Colors.textSecondary },

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
            marginHorizontal: 20,
            backgroundColor: Colors.accent + '22',
            borderRadius: 10,
            padding: 12,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: Colors.accent,
          },
          joinedText: { color: Colors.accent, textAlign: 'center', fontWeight: '600' },

          aiSection: { paddingHorizontal: 20, marginBottom: 12 },
          aiChatBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colors.surface,
            marginHorizontal: 20,
            marginBottom: 16,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: Colors.primary + '44',
            gap: 12,
          },
          aiChatIcon: { fontSize: 28 },
          aiChatTexts: { flex: 1 },
          aiChatTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
          aiChatSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

          chatBtnChall: {
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: Colors.surface,
                      marginHorizontal: 20,
                      marginBottom: 16,
                      borderRadius: 14,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: Colors.primary + '44',
                      gap: 12,
                    },
                    chatIcon: { fontSize: 28 },
                    chatTexts: { flex: 1 },
                    chatTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
                    chatSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

          inviteBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: Colors.secondary,
            marginHorizontal: 20,
            marginBottom: 12,
            borderRadius: 12,
            padding: 14,
          },
          inviteBtnTxt: { color: Colors.white, fontWeight: '700', fontSize: 14 },

          sectionTitlePadded: { paddingHorizontal: 20 },
          tasksTitleRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            marginBottom: 10,
            marginTop: 4,
          },
          sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
          addTaskBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: Colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 10,
          },
          addTaskTxt: { color: Colors.white, fontWeight: '600', fontSize: 13 },

          tasksSection: { paddingHorizontal: 20, marginBottom: 16 },
          taskCard: { marginBottom: 10, padding: 0, overflow: 'hidden' },
          taskExpired: { opacity: 0.5, borderColor: Colors.textMuted },
          taskInner: { flexDirection: 'row', alignItems: 'stretch' },

          reorderCol: {
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 4,
            paddingVertical: 12,
            borderRightWidth: 1,
            borderRightColor: Colors.border,
            gap: 4,
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
            justifyContent: 'center',
            gap: 6,
            paddingHorizontal: 8,
            paddingVertical: 12,
            borderLeftWidth: 1,
            borderLeftColor: Colors.border,
          },
          editTaskBtn: {
            padding: 8,
            borderRadius: 8,
            backgroundColor: Colors.primary + '15',
            borderWidth: 1,
            borderColor: Colors.primary + '30',
          },
          deleteTaskBtn: {
            padding: 8,
            borderRadius: 8,
            backgroundColor: Colors.error + '15',
            borderWidth: 1,
            borderColor: Colors.error + '30',
          },

          emptyCard: {
            marginHorizontal: 20,
            marginBottom: 16,
            alignItems: 'center',
            paddingVertical: 32,
          },
          emptyIcon: { fontSize: 40, marginBottom: 12 },
          emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
          emptyText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },

          participantsCard: { marginHorizontal: 20, marginBottom: 30 },

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