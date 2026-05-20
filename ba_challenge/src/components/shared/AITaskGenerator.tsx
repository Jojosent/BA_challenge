import { aiService } from '@services/aiService';
import React, { useState } from 'react';
import {
ActivityIndicator,
Alert,
Modal,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';

interface AITaskGeneratorProps {
challengeId: number;
totalDays: number;
onGenerated: () => void;
}

export const AITaskGenerator: React.FC<AITaskGeneratorProps> = ({
challengeId,
totalDays,
onGenerated,
}) => {

const { t } = useTranslation();
const { theme } = useTheme();

const [isLoading, setIsLoading] = useState(false);
const [showModal, setShowModal] = useState(false);
const [taskCount, setTaskCount] = useState('5');
const [countError, setCountError] = useState('');

// Считаем интервал для предпросмотра
const count = parseInt(taskCount) || 0;
const interval = count > 0 ? Math.floor(totalDays / count) : 0;

const validate = () => {
    if (!count || count < 1) {
        setCountError(t('aiTaskGenerator.minTasks'));
        return false;
    }

    if (count > totalDays) {
        setCountError(
            t('aiTaskGenerator.maxTasksPerDay', {
                totalDays,
            })
        );
        return false;
    }

    if (count > 30) {
        setCountError(t('aiTaskGenerator.maxTasksLimit'));
        return false;
    }

    setCountError('');
    return true;
};

const handleGenerate = async () => {
    if (!validate()) return;
    setShowModal(false);

    try {
        setIsLoading(true);

        const result = await aiService.generateTasks(challengeId, count);

        Alert.alert(
            t('aiTaskGenerator.successTitle'),
            t('aiTaskGenerator.successMessage', {
                count: result.tasks.length,
                summary: result.summary,
            })
        );

        onGenerated();

    } catch (e: any) {

        Alert.alert(t('common.error'), e.message);

    } finally {
        setIsLoading(false);
    }
};

return (
    <>
        {/* Кнопка */}
        <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.primary }, isLoading && styles.btnDisabled]}
            onPress={() => setShowModal(true)}
            disabled={isLoading}
        >
            {isLoading ? (
                <View style={styles.row}>
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text style={styles.btnText}>
                        {t('aiTaskGenerator.aiThinking')}
                    </Text>
                </View>
            ) : (
                <View style={styles.row}>
                    <Text style={styles.icon}>🤖</Text>

                    <View>
                        <Text style={styles.btnText}>
                            {t('aiTaskGenerator.generateWithAI')}
                        </Text>

                        <Text style={styles.btnSub}>
                            {t('aiTaskGenerator.generateSubtitle')}
                        </Text>
                    </View>
                </View>
            )}
        </TouchableOpacity>

        {/* Модалка выбора количества */}
        <Modal
            visible={showModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowModal(false)}
        >
            <View style={styles.overlay}>
                <View style={[styles.modal, { backgroundColor: theme.surface }]}>

                    <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                        🤖 {t('aiTaskGenerator.modalTitle')}
                    </Text>

                    <View style={[styles.infoRow, { backgroundColor: theme.surfaceAlt }]}>
                        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                            📅 {t('aiTaskGenerator.challengeDuration')}
                        </Text>

                        <Text style={[styles.infoValue, { color: theme.primary }]}>
                            {t('aiTaskGenerator.daysCount', {
                                count: totalDays,
                            })}
                        </Text>
                    </View>

                    {/* Выбор числа */}
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                        {t('aiTaskGenerator.taskCount')}
                    </Text>

                    <TextInput
                        style={[
                            styles.input,
                            { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary },
                            countError ? { borderColor: theme.rose } : null
                        ]}
                        value={taskCount}
                        onChangeText={(v) => {
                            setTaskCount(v);
                            setCountError('');
                        }}
                        keyboardType="numeric"
                        placeholder={t('aiTaskGenerator.placeholder')}
                        placeholderTextColor={theme.textMuted}
                        maxLength={2}
                    />

                    {countError ? (
                        <Text style={[styles.error, { color: theme.rose }]}>
                            {countError}
                        </Text>
                    ) : null}

                    {/* Быстрые кнопки */}
                    <View style={styles.quickRow}>
                        {[3, 5, 7, 10].map((n) => {
                            const isActive = taskCount === String(n);
                            return (
                                <TouchableOpacity
                                    key={n}
                                    style={[
                                        styles.quickBtn,
                                        { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                                        isActive && { borderColor: theme.primary, backgroundColor: theme.primary + '20' },
                                    ]}
                                    onPress={() => {
                                        setTaskCount(String(n));
                                        setCountError('');
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.quickTxt,
                                            { color: theme.textSecondary },
                                            isActive && { color: theme.primary },
                                        ]}
                                    >
                                        {n}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Предпросмотр интервала */}
                    {count > 0 && count <= totalDays && (
                        <View style={[styles.preview, { backgroundColor: theme.surfaceAlt }]}>

                            <Text style={[styles.previewTitle, { color: theme.textSecondary }]}>
                                📋 {t('aiTaskGenerator.preview')}
                            </Text>

                            <Text style={[styles.previewText, { color: theme.textSecondary }]}>
                                {t('aiTaskGenerator.taskEvery')}{' '}

                                <Text style={[styles.previewHighlight, { color: theme.primary }]}>
                                    {t('aiTaskGenerator.daysInterval', {
                                        count: interval,
                                    })}
                                </Text>
                            </Text>

                            <View style={styles.timeline}>
                                {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
                                    <View key={i} style={styles.timelineItem}>
                                        <View style={[styles.timelineDot, { backgroundColor: theme.primary }]} />

                                        <Text style={[styles.timelineDay, { color: theme.textMuted }]}>
                                            {t('aiTaskGenerator.dayNumber', {
                                                day: (i + 1) * interval,
                                            })}
                                        </Text>
                                    </View>
                                ))}

                                {count > 6 && (
                                    <Text style={[styles.timelineMore, { color: theme.textMuted }]}>
                                        {t('aiTaskGenerator.moreItems', {
                                            count: count - 6,
                                        })}
                                    </Text>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Кнопки */}
                    <View style={styles.modalBtns}>

                        <TouchableOpacity
                            style={[styles.cancelBtn, { borderColor: theme.border }]}
                            onPress={() => setShowModal(false)}
                        >
                            <Text style={[styles.cancelTxt, { color: theme.textSecondary }]}>
                                {t('common.cancel')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.generateBtn, { backgroundColor: theme.primary }]}
                            onPress={handleGenerate}
                        >
                            <Text style={styles.generateTxt}>
                                🤖 {t('aiTaskGenerator.create')}
                            </Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </View>
        </Modal>
    </>
);

};

const styles = StyleSheet.create({
btn: {
borderRadius: 14,
padding: 16,
},

btnDisabled: { opacity: 0.7 },

row: {
flexDirection: 'row',
alignItems: 'center',
gap: 12
},

icon: {
fontSize: 28
},

btnText: {
color: '#ffffff',
fontWeight: '700',
fontSize: 15
},

btnSub: {
color: 'rgba(255,255,255,0.75)',
fontSize: 12,
marginTop: 2
},

overlay: {
flex: 1,
backgroundColor: 'rgba(0,0,0,0.7)',
justifyContent: 'flex-end',
},

modal: {
borderTopLeftRadius: 24,
borderTopRightRadius: 24,
padding: 24,
paddingBottom: 40,
},

modalTitle: {
fontSize: 20,
fontWeight: '700',
marginBottom: 16,
},

infoRow: {
flexDirection: 'row',
justifyContent: 'space-between',
padding: 12,
borderRadius: 10,
marginBottom: 16,
},

infoText: {
fontSize: 13
},

infoValue: {
fontWeight: '700',
fontSize: 13
},

inputLabel: {
fontSize: 13,
marginBottom: 8,
},

input: {
borderRadius: 12,
padding: 14,
fontSize: 20,
fontWeight: '700',
borderWidth: 1,
textAlign: 'center',
},

inputError: {},

error: {
fontSize: 12,
marginTop: 4,
textAlign: 'center'
},

quickRow: {
flexDirection: 'row',
gap: 10,
marginTop: 12,
marginBottom: 16,
},

quickBtn: {
flex: 1,
borderRadius: 10,
paddingVertical: 10,
alignItems: 'center',
borderWidth: 1,
},

quickBtnActive: {},

quickTxt: {
fontWeight: '600',
fontSize: 16
},

quickTxtActive: {},

preview: {
borderRadius: 12,
padding: 14,
marginBottom: 20,
},

previewTitle: {
fontSize: 13,
fontWeight: '600',
marginBottom: 6,
},

previewText: {
fontSize: 13,
marginBottom: 10
},

previewHighlight: {},

timeline: {
flexDirection: 'row',
flexWrap: 'wrap',
gap: 6
},

timelineItem: {
alignItems: 'center',
gap: 3
},

timelineDot: {
width: 8,
height: 8,
borderRadius: 4,
},

timelineDay: {
fontSize: 10,
},

timelineMore: {
fontSize: 10,
alignSelf: 'center'
},

modalBtns: {
flexDirection: 'row',
gap: 12
},

cancelBtn: {
flex: 1,
padding: 14,
borderRadius: 12,
borderWidth: 1,
alignItems: 'center',
},

cancelTxt: {
fontWeight: '600'
},

generateBtn: {
flex: 1,
padding: 14,
borderRadius: 12,
alignItems: 'center',
},

generateTxt: {
color: '#ffffff',
fontWeight: '700'
},

});