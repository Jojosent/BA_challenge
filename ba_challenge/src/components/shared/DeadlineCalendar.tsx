import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { challengeService } from '@services/challengeService';
import { useRouter } from 'expo-router';
import { PartyPopper } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

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

export const DeadlineCalendar: React.FC = () => {
    const router = useRouter();
    const { t, i18n } = useTranslation();


    const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    const locale =
        i18n.language === 'kz'
            ? 'kk-KZ'
            : i18n.language === 'en'
                ? 'en-US'
                : 'ru-RU';

    const monthNames = t('calendar.months', { returnObjects: true }) as string[];
    const dayNames = t('calendar.weekDays', { returnObjects: true }) as string[];

    const navigateToTask = (taskId: number, challengeId: number) => {
        router.push(`/challenge/task/${taskId}?challengeId=${challengeId}` as any);
    };

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

    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const getDateStr = (day: number) => {
        return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const getDeadlinesForDate = (day: number) => {
        const dateStr = getDateStr(day);
        return deadlines.filter((d) => d.deadline.startsWith(dateStr));
    };

    const isToday = (day: number) => {
        return (
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear()
        );
    };

    const isSelected = (day: number) => selectedDate === getDateStr(day);

    const handleDayPress = (day: number) => {
        const dateStr = getDateStr(day);
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

    const upcomingDeadlines = deadlines.filter((d) => {
        return !d.isExpired && d.daysLeft <= 7 && d.daysLeft >= 0;
    });

    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

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
            {upcomingDeadlines.length > 0 && (
                <View style={styles.urgentBanner}>
                    <Ionicons name="alarm-outline" size={16} color={Colors.warning} />
                    <Text style={styles.urgentTxt}>
                        {upcomingDeadlines.length === 1
                            ? t('calendar.deadlineInDays', {
                                count: upcomingDeadlines[0].daysLeft,
                                title: upcomingDeadlines[0].taskTitle,
                            })
                            : t('calendar.deadlinesInNextDays', {
                                count: upcomingDeadlines.length,
                            })}
                    </Text>
                </View>
            )}

            <View style={styles.calendar}>
                <View style={styles.monthNav}>
                    <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
                        <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
                    </TouchableOpacity>

                    <Text style={styles.monthTitle}>
                        {monthNames[currentMonth]} {currentYear}
                    </Text>

                    <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.weekRow}>
                    {dayNames.map((d) => (
                        <Text key={d} style={styles.weekDay}>{d}</Text>
                    ))}
                </View>

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

                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                        <Text style={styles.legendTxt}>{t('calendar.legendDeadline')}</Text>
                    </View>

                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
                        <Text style={styles.legendTxt}>{t('calendar.legendUrgent')}</Text>
                    </View>

                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
                        <Text style={styles.legendTxt}>{t('calendar.legendOverdue')}</Text>
                    </View>
                </View>
            </View>

            {selectedDate && (
                <View style={styles.selectedBlock}>
                    <Text style={styles.selectedDateTitle}>
                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString(locale, {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </Text>

                    {selectedDeadlines.length === 0 ? (
                        <Text style={styles.noTasksTxt}>{t('calendar.noDeadlinesThisDay')}</Text>
                    ) : (
                        selectedDeadlines.map((item) => {
                            const urgent = !item.isExpired && item.daysLeft <= 2;
                            const expired = item.isExpired;
                            const accent = expired ? Colors.error : urgent ? Colors.warning : Colors.primary;

                            return (
                                <TouchableOpacity
                                    key={item.taskId}
                                    style={[
                                        styles.taskCard,
                                        { borderLeftColor: accent },
                                        item.isExpired && styles.cardExpired,
                                    ]}
                                    onPress={() => {
                                        if (item.isExpired) return;
                                        navigateToTask(item.taskId, item.challengeId);
                                    }}
                                    activeOpacity={item.isExpired ? 1 : 0.8}
                                    disabled={item.isExpired}
                                >
                                    <View style={styles.taskCardTop}>
                                        <Text style={styles.taskCardChallenge} numberOfLines={1}>
                                            {item.challengeTitle}
                                        </Text>

                                        <View style={[
                                            styles.statusPill,
                                            { backgroundColor: accent + '22', borderColor: accent },
                                        ]}>
                                            <Text style={[styles.statusPillTxt, { color: accent }]}>
                                                {expired
                                                    ? t('calendar.overdue')
                                                    : item.daysLeft === 0
                                                        ? t('calendar.today')
                                                        : t('calendar.daysShort', { count: item.daysLeft })}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={styles.taskCardTitle}>
                                        {t('calendar.taskWithDay', {
                                            day: item.taskDay,
                                            title: item.taskTitle,
                                        })}
                                    </Text>

                                    <View style={styles.taskCardFooter}>
                                        <Ionicons name="arrow-forward-circle-outline" size={14} color={accent} />
                                        <Text style={[styles.taskCardLink, { color: accent }]}>
                                            {t('calendar.goToTask')}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            )}

            {!selectedDate && (
                <View style={styles.upcomingBlock}>
                    <Text style={styles.upcomingTitle}>{t('calendar.upcomingDeadlines')}</Text>

                    {deadlines.filter((d) => !d.isExpired).length === 0 ? (
                        <View style={styles.emptyBox}>
                            <PartyPopper
                                size={42}
                                color={Colors.primary}
                                strokeWidth={2.4}
                            />
                            <Text style={styles.emptyTxt}>{t('calendar.allTasksDone')}</Text>
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
                                                {t('calendar.taskWithDay', {
                                                    day: item.taskDay,
                                                    title: item.taskTitle,
                                                })}
                                            </Text>
                                        </View>

                                        <View style={styles.upcomingRight}>
                                            <Text style={[styles.upcomingDays, { color: accent }]}>
                                                {item.daysLeft === 0
                                                    ? t('calendar.today')
                                                    : t('calendar.daysShort', { count: item.daysLeft })}
                                            </Text>

                                            <Text style={styles.upcomingDate}>
                                                {new Date(item.deadline).toLocaleDateString(locale, {
                                                    day: 'numeric',
                                                    month: 'short',
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

    upcomingBlock: {
        marginBottom: 8,
    },
    upcomingTitle: {
        fontSize: 18,
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
    emptyTxt: {
        fontSize: 14,
        color: Colors.textMuted,
    },

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
    upcomingLeft: {
        flex: 1,
    },
    upcomingChallenge: {
        fontSize: 12,
        color: Colors.textMuted,
        marginBottom: 3,
    },
    upcomingTask: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    upcomingRight: {
        alignItems: 'flex-end',
    },
    upcomingDays: {
        fontSize: 14,
        fontWeight: '800',
    },
    upcomingDate: {
        fontSize: 11,
        color: Colors.textMuted,
        marginTop: 2,
    },
});