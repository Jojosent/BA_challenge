import { Colors } from '@/constants/colors';
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
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={() => setShowModal(true)}
            disabled={isLoading}
        >
            {isLoading ? (
                <View style={styles.row}>
                    <ActivityIndicator color={Colors.white} size="small" />
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
                <View style={styles.modal}>

                    <Text style={styles.modalTitle}>
                        🤖 {t('aiTaskGenerator.modalTitle')}
                    </Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoText}>
                            📅 {t('aiTaskGenerator.challengeDuration')}
                        </Text>

                        <Text style={styles.infoValue}>
                            {t('aiTaskGenerator.daysCount', {
                                count: totalDays,
                            })}
                        </Text>
                    </View>

                    {/* Выбор числа */}
                    <Text style={styles.inputLabel}>
                        {t('aiTaskGenerator.taskCount')}
                    </Text>

                    <TextInput
                        style={[styles.input, countError ? styles.inputError : null]}
                        value={taskCount}
                        onChangeText={(v) => {
                            setTaskCount(v);
                            setCountError('');
                        }}
                        keyboardType="numeric"
                        placeholder={t('aiTaskGenerator.placeholder')}
                        placeholderTextColor={Colors.textMuted}
                        maxLength={2}
                    />

                    {countError ? (
                        <Text style={styles.error}>
                            {countError}
                        </Text>
                    ) : null}

                    {/* Быстрые кнопки */}
                    <View style={styles.quickRow}>
                        {[3, 5, 7, 10].map((n) => (
                            <TouchableOpacity
                                key={n}
                                style={[
                                    styles.quickBtn,
                                    taskCount === String(n) && styles.quickBtnActive,
                                ]}
                                onPress={() => {
                                    setTaskCount(String(n));
                                    setCountError('');
                                }}
                            >
                                <Text
                                    style={[
                                        styles.quickTxt,
                                        taskCount === String(n) && styles.quickTxtActive,
                                    ]}
                                >
                                    {n}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Предпросмотр интервала */}
                    {count > 0 && count <= totalDays && (
                        <View style={styles.preview}>

                            <Text style={styles.previewTitle}>
                                📋 {t('aiTaskGenerator.preview')}
                            </Text>

                            <Text style={styles.previewText}>
                                {t('aiTaskGenerator.taskEvery')}{' '}

                                <Text style={styles.previewHighlight}>
                                    {t('aiTaskGenerator.daysInterval', {
                                        count: interval,
                                    })}
                                </Text>
                            </Text>

                            <View style={styles.timeline}>
                                {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
                                    <View key={i} style={styles.timelineItem}>
                                        <View style={styles.timelineDot} />

                                        <Text style={styles.timelineDay}>
                                            {t('aiTaskGenerator.dayNumber', {
                                                day: (i + 1) * interval,
                                            })}
                                        </Text>
                                    </View>
                                ))}

                                {count > 6 && (
                                    <Text style={styles.timelineMore}>
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
                            style={styles.cancelBtn}
                            onPress={() => setShowModal(false)}
                        >
                            <Text style={styles.cancelTxt}>
                                {t('common.cancel')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.generateBtn}
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
backgroundColor: Colors.secondary,
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
color: Colors.white,
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
backgroundColor: Colors.surface,
borderTopLeftRadius: 24,
borderTopRightRadius: 24,
padding: 24,
paddingBottom: 40,
},

modalTitle: {
fontSize: 20,
fontWeight: '700',
color: Colors.textPrimary,
marginBottom: 16,
},

infoRow: {
flexDirection: 'row',
justifyContent: 'space-between',
backgroundColor: Colors.card,
padding: 12,
borderRadius: 10,
marginBottom: 16,
},

infoText: {
color: Colors.textSecondary,
fontSize: 13
},

infoValue: {
color: Colors.primary,
fontWeight: '700',
fontSize: 13
},

inputLabel: {
fontSize: 13,
color: Colors.textSecondary,
marginBottom: 8,
},

input: {
backgroundColor: Colors.card,
borderRadius: 12,
padding: 14,
fontSize: 20,
fontWeight: '700',
color: Colors.textPrimary,
borderWidth: 1,
borderColor: Colors.border,
textAlign: 'center',
},

inputError: {
borderColor: Colors.error
},

error: {
color: Colors.error,
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
backgroundColor: Colors.card,
borderRadius: 10,
paddingVertical: 10,
alignItems: 'center',
borderWidth: 1,
borderColor: Colors.border,
},

quickBtnActive: {
borderColor: Colors.primary,
backgroundColor: Colors.primary + '20',
},

quickTxt: {
color: Colors.textSecondary,
fontWeight: '600',
fontSize: 16
},

quickTxtActive: {
color: Colors.primary
},

preview: {
backgroundColor: Colors.card,
borderRadius: 12,
padding: 14,
marginBottom: 20,
},

previewTitle: {
fontSize: 13,
fontWeight: '600',
color: Colors.textSecondary,
marginBottom: 6,
},

previewText: {
fontSize: 13,
color: Colors.textSecondary,
marginBottom: 10
},

previewHighlight: {
color: Colors.primary,
fontWeight: '700'
},

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
backgroundColor: Colors.primary,
},

timelineDay: {
fontSize: 10,
color: Colors.textMuted
},

timelineMore: {
fontSize: 10,
color: Colors.textMuted,
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
borderColor: Colors.border,
alignItems: 'center',
},

cancelTxt: {
color: Colors.textSecondary,
fontWeight: '600'
},

generateBtn: {
flex: 1,
padding: 14,
borderRadius: 12,
backgroundColor: Colors.secondary,
alignItems: 'center',
},

generateTxt: {
color: Colors.white,
fontWeight: '700'
},

});