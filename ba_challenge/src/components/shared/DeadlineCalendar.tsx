import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { challengeService } from '@services/challengeService';
import { useRouter } from 'expo-router';
import { Linking } from 'react-native';

interface DeadlineItem {
    taskId: number;
    taskTitle: string;
    taskDay: number;
    deadline: string;
    challengeId: number;
    challengeTitle: string;
    isExpired: boolean;
    daysLeft: number;
}

const MONTH_NAMES_RU = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];



const DAY_NAMES_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const DeadlineCalendar: React.FC = () => {
    const router = useRouter();
    const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const navigateToTask = (taskId: number, challengeId: number) => {
        router.push(`/challenge/task/${taskId}?challengeId=${challengeId}` as any);
    };
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    const fetchDeadlines = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await challengeService.getMyTaskDeadlines();
            setDeadlines(data);
        } catch (e) {
            console.log('DeadlineCalendar fetch error:', e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDeadlines();
    }, [fetchDeadlines]);

    // Дни в месяце
    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    // День недели первого числа (0=Пн...6=Вс)
    const getFirstDayOfMonth = (month: number, year: number) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    // Дедлайны на конкретную дату
    const getDeadlinesForDate = (day: number) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return deadlines.filter((d) => d.deadline.startsWith(dateStr));
    };

    // Есть ли дедлайн в этот день
    const hasDeadline = (day: number) => getDeadlinesForDate(day).length > 0;

    const isToday = (day: number) => {
        return (
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear()
        );
    };

    const isSelected = (day: number) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return selectedDate === dateStr;
    };

    const handleDayPress = (day: number) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setSelectedDate(selectedDate === dateStr ? null : dateStr);
    };

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear((y) => y - 1);
        } else {
            setCurrentMonth((m) => m - 1);
        }
        setSelectedDate(null);
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear((y) => y + 1);
        } else {
            setCurrentMonth((m) => m + 1);
        }
        setSelectedDate(null);
    };

    const selectedDeadlines = selectedDate
        ? deadlines.filter((d) => d.deadline.startsWith(selectedDate))
        : [];

    // Ближайшие дедлайны (не просроченные, следующие 7 дней)
    const upcomingDeadlines = deadlines.filter((d) => {
        return !d.isExpired && d.daysLeft <= 7 && d.daysLeft >= 0;
    });

    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

    // Все ячейки: пустые + дни
    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    // Дополняем до кратного 7
    while (cells.length % 7 !== 0) cells.push(null);

    const getDayLabelColor = (day: number) => {
        const items = getDeadlinesForDate(day);
        if (items.length === 0) return null;
        const hasExpired = items.some((d) => d.isExpired);
        const hasUrgent = items.some((d) => !d.isExpired && d.daysLeft <= 2);
        if (hasExpired) return Colors.error;
        if (hasUrgent) return Colors.warning;
        return Colors.primary;
    };

    if (isLoading) {
        return (
            <View style={styles.loadingBox}>
                <ActivityIndicator color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.wrapper}>

            {/* Уведомление о ближайших дедлайнах */}
            {upcomingDeadlines.length > 0 && (
                <View style={styles.urgentBanner}>
                    <Ionicons name="alarm-outline" size={16} color={Colors.warning} />
                    <Text style={styles.urgentTxt}>
                        {upcomingDeadlines.length === 1
                            ? `🔥 Дедлайн через ${upcomingDeadlines[0].daysLeft} дн: "${upcomingDeadlines[0].taskTitle}"`
                            : `🔥 ${upcomingDeadlines.length} дедлайна в ближайшие 7 дней`}
                    </Text>
                </View>
            )}

            {/* Календарь */}
            <View style={styles.calendar}>

                {/* Навигация по месяцу */}
                <View style={styles.monthNav}>
                    <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
                        <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.monthTitle}>
                        {MONTH_NAMES_RU[currentMonth]} {currentYear}
                    </Text>
                    <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Дни недели */}
                <View style={styles.weekRow}>
                    {DAY_NAMES_RU.map((d) => (
                        <Text key={d} style={styles.weekDay}>{d}</Text>
                    ))}
                </View>

                {/* Сетка дней */}
                <View style={styles.grid}>
                    {cells.map((day, idx) => {
                        if (!day) {
                            return <View key={`empty-${idx}`} style={styles.cell} />;
                        }

                        const dotColor = getDayLabelColor(day);
                        const todayCell = isToday(day);
                        const selectedCell = isSelected(day);

                        return (
                            <TouchableOpacity
                                key={`day-${day}`}
                                style={[
                                    styles.cell,
                                    todayCell && styles.cellToday,
                                    selectedCell && styles.cellSelected,
                                ]}
                                onPress={() => handleDayPress(day)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.cellTxt,
                                    todayCell && styles.cellTxtToday,
                                    selectedCell && styles.cellTxtSelected,
                                ]}>
                                    {day}
                                </Text>
                                {dotColor && (
                                    <View style={[styles.dot, { backgroundColor: dotColor }]} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Легенда */}
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                        <Text style={styles.legendTxt}>Дедлайн</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
                        <Text style={styles.legendTxt}>Срочно (≤2 дн.)</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
                        <Text style={styles.legendTxt}>Просрочено</Text>
                    </View>
                </View>
            </View>

            {/* Задачи выбранного дня */}
            {selectedDate && (
                <View style={styles.selectedBlock}>
                    <Text style={styles.selectedDateTitle}>
                        📅 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ru-RU', {
                            day: 'numeric', month: 'long', year: 'numeric',
                        })}
                    </Text>

                    {selectedDeadlines.length === 0 ? (
                        <Text style={styles.noTasksTxt}>Нет дедлайнов в этот день</Text>
                    ) : (
                        selectedDeadlines.map((item) => {
                            const urgent = !item.isExpired && item.daysLeft <= 2;
                            const expired = item.isExpired;
                            const accent = expired ? Colors.error : urgent ? Colors.warning : Colors.primary;

                            return (
                                <TouchableOpacity
                                    key={item.taskId}
                                    style={[styles.taskCard, { borderLeftColor: accent }, item.isExpired && styles.cardExpired]}
                                    onPress={() => {
                                        if (item.isExpired) return;
                                        navigateToTask(item.taskId, item.challengeId);
                                    }}
                                    activeOpacity={item.isExpired ? 1 : 0.8}
                                    disabled={item.isExpired}
                                >
                                    <View style={styles.taskCardTop}>
                                        <Text style={styles.taskCardChallenge} numberOfLines={1}>
                                            🏆 {item.challengeTitle}
                                        </Text>
                                        <View style={[styles.statusPill, { backgroundColor: accent + '22', borderColor: accent }]}>
                                            <Text style={[styles.statusPillTxt, { color: accent }]}>
                                                {expired
                                                    ? '⏰ Просрочено'
                                                    : item.daysLeft === 0
                                                        ? '🔥 Сегодня!'
                                                        : `${item.daysLeft} дн.`}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.taskCardTitle}>
                                        Задача {item.taskDay}: {item.taskTitle}
                                    </Text>
                                    <View style={styles.taskCardFooter}>
                                        <Ionicons name="arrow-forward-circle-outline" size={14} color={accent} />
                                        <Text style={[styles.taskCardLink, { color: accent }]}>
                                            Перейти к задаче
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            )}

            {/* Все предстоящие дедлайны (если ничего не выбрано) */}
            {!selectedDate && (
                <View style={styles.upcomingBlock}>
                    <Text style={styles.upcomingTitle}>📋 Предстоящие дедлайны</Text>

                    {deadlines.filter((d) => !d.isExpired).length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyIcon}>🎉</Text>
                            <Text style={styles.emptyTxt}>Все задачи выполнены!</Text>
                        </View>
                    ) : (
                        deadlines
                            .filter((d) => !d.isExpired)
                            .slice(0, 5)
                            .map((item) => {
                                const urgent = item.daysLeft <= 2;
                                const accent = urgent ? Colors.warning : Colors.accent;

                                return (
                                    <TouchableOpacity
                                        key={item.taskId}
                                        style={[styles.upcomingCard, { borderLeftColor: accent }]}
                                        onPress={() => navigateToTask(item.taskId, item.challengeId)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.upcomingLeft}>
                                            <Text style={styles.upcomingChallenge} numberOfLines={1}>
                                                {item.challengeTitle}
                                            </Text>
                                            <Text style={styles.upcomingTask} numberOfLines={1}>
                                                Задача {item.taskDay}: {item.taskTitle}
                                            </Text>
                                        </View>
                                        <View style={styles.upcomingRight}>
                                            <Text style={[styles.upcomingDays, { color: accent }]}>
                                                {item.daysLeft === 0 ? 'Сегодня!' : `${item.daysLeft} дн.`}
                                            </Text>
                                            <Text style={styles.upcomingDate}>
                                                {new Date(item.deadline).toLocaleDateString('ru-RU', {
                                                    day: 'numeric', month: 'short',
                                                })}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                    )}
                </View>
            )}
        </View>
    );
};

const CELL_SIZE = 42;

const styles = StyleSheet.create({
    cardExpired: {
        opacity: 0.4,
    },
    wrapper: {},

    loadingBox: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Баннер срочных дедлайнов
    urgentBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.warning + '18',
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.warning + '40',
    },
    urgentTxt: {
        flex: 1,
        fontSize: 13,
        color: Colors.warning,
        fontWeight: '600',
    },

    // Сам календарь
    calendar: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 16,
    },

    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    navBtn: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    monthTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
    },

    weekRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    weekDay: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textMuted,
    },

    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    cell: {
        width: `${100 / 7}%`,
        height: CELL_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cellToday: {
        backgroundColor: Colors.primary + '20',
        borderRadius: 10,
    },
    cellSelected: {
        backgroundColor: Colors.primary,
        borderRadius: 10,
    },
    cellTxt: {
        fontSize: 14,
        color: Colors.textPrimary,
        fontWeight: '500',
    },
    cellTxtToday: {
        color: Colors.primary,
        fontWeight: '800',
    },
    cellTxtSelected: {
        color: Colors.white,
        fontWeight: '800',
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        marginTop: 2,
    },

    // Легенда
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendTxt: {
        fontSize: 11,
        color: Colors.textMuted,
    },

    // Карточки выбранного дня
    selectedBlock: {
        marginBottom: 16,
    },
    selectedDateTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 10,
    },
    noTasksTxt: {
        color: Colors.textMuted,
        fontSize: 13,
        textAlign: 'center',
        paddingVertical: 16,
    },
    taskCard: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        borderLeftWidth: 4,
        gap: 6,
    },
    taskCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    taskCardChallenge: {
        flex: 1,
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    statusPill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
    },
    statusPillTxt: {
        fontSize: 11,
        fontWeight: '700',
    },
    taskCardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    taskCardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    taskCardLink: {
        fontSize: 12,
        fontWeight: '600',
    },

    // Предстоящие дедлайны
    upcomingBlock: {
        marginBottom: 8,
    },
    upcomingTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 10,
    },
    emptyBox: {
        alignItems: 'center',
        paddingVertical: 24,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    emptyIcon: { fontSize: 36, marginBottom: 8 },
    emptyTxt: { fontSize: 14, color: Colors.textMuted },

    upcomingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        borderLeftWidth: 4,
        gap: 10,
    },
    upcomingLeft: { flex: 1 },
    upcomingChallenge: { fontSize: 12, color: Colors.textMuted, marginBottom: 3 },
    upcomingTask: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    upcomingRight: { alignItems: 'flex-end' },
    upcomingDays: { fontSize: 14, fontWeight: '800' },
    upcomingDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});