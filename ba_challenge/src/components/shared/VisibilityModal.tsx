import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { privacyService } from '@services/privacyService';
import { useTheme } from '@/theme/ThemeContext';

type Visibility = 'secret' | 'protected' | 'public';

interface VisibilityModalProps {
  visible: boolean;
  onClose: () => void;
  challengeId: number;
  currentVisibility: Visibility;
  onUpdated: (visibility: Visibility) => void;
}

export const VisibilityModal: React.FC<VisibilityModalProps> = ({
  visible,
  onClose,
  challengeId,
  currentVisibility,
  onUpdated,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [selected, setSelected] = useState<Visibility>(currentVisibility);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelected(currentVisibility);
      setPassword('');
      setShowPass(false);
    }
  }, [visible, currentVisibility]);

  const visibilityOptions = [
    {
      key: 'public' as Visibility,
      icon: 'earth-outline',
      label: t('visibilityModal.public'),
      desc: t('visibilityModal.publicDesc'),
      color: theme.accent,
    },
    {
      key: 'protected' as Visibility,
      icon: 'lock-closed-outline',
      label: t('visibilityModal.protected'),
      desc: t('visibilityModal.protectedDesc'),
      color: theme.amber,
    },
    {
      key: 'secret' as Visibility,
      icon: 'eye-off-outline',
      label: t('visibilityModal.secret'),
      desc: t('visibilityModal.secretDesc'),
      color: theme.rose,
    },
  ];

  const currentOption = visibilityOptions.find((o) => o.key === currentVisibility);

  const handleSave = async () => {
    if (selected === 'protected' && !password.trim()) {
      Alert.alert(
        t('visibilityModal.passwordRequiredTitle'),
        t('visibilityModal.passwordRequiredMessage')
      );
      return;
    }

    try {
      setIsLoading(true);

      const result = await privacyService.updateChallengeVisibility(
        challengeId,
        selected,
        selected === 'protected' ? password.trim() : undefined
      );

      Alert.alert(t('visibilityModal.doneTitle'), result.message);

      onUpdated(selected);
      handleClose();
    } catch (e: any) {
      Alert.alert(t('visibilityModal.error'), e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelected(currentVisibility);
    setPassword('');
    setShowPass(false);
    onClose();
  };

  const changed = selected !== currentVisibility;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {t('visibilityModal.title')}
            </Text>

            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t('visibilityModal.subtitle')}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {visibilityOptions.map((opt) => {
              const isActive = selected === opt.key;

              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.optionCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    isActive && {
                      borderColor: opt.color,
                      backgroundColor: opt.color + '12',
                    },
                  ]}
                  onPress={() => setSelected(opt.key)}
                  activeOpacity={0.8}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.optionIconBox,
                        { backgroundColor: opt.color + '18' },
                      ]}
                    >
                      <Ionicons name={opt.icon as any} size={22} color={opt.color} />
                    </View>

                    <View style={styles.optionTexts}>
                      <Text
                        style={[
                          styles.optionLabel,
                          { color: theme.textPrimary },
                          isActive && { color: opt.color },
                        ]}
                      >
                        {opt.label}
                      </Text>

                      <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                        {opt.desc}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.radioOuter,
                      { borderColor: theme.border },
                      isActive && { borderColor: opt.color },
                    ]}
                  >
                    {isActive && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: opt.color },
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {selected === 'protected' && (
              <View style={[styles.passwordSection, { backgroundColor: theme.amber + '12', borderColor: theme.amber + '40' }]}>
                <Text style={[styles.passwordLabel, { color: theme.amber }]}>
                  {t('visibilityModal.passwordLabel')}
                </Text>

                <View style={[styles.passwordRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <TextInput
                    style={[styles.passwordInput, { color: theme.textPrimary }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t('visibilityModal.passwordPlaceholder')}
                    placeholderTextColor={theme.textMuted}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                  />

                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPass(!showPass)}
                  >
                    <Ionicons
                      name={showPass ? 'eye-off' : 'eye'}
                      size={18}
                      color={theme.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.passwordHint, { color: theme.textSecondary }]}>
                  {t('visibilityModal.passwordHint')}
                </Text>
              </View>
            )}

            <View style={styles.currentStatus}>
              <Text style={[styles.currentStatusLabel, { color: theme.textMuted }]}>
                {t('visibilityModal.currentVisibility')}
              </Text>

              <View style={[styles.currentStatusBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.currentStatusText, { color: theme.textSecondary }]}>
                  {currentOption?.label}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.btns}>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.border }]} onPress={handleClose}>
              <Text style={[styles.cancelTxt, { color: theme.textSecondary }]}>
                {t('visibilityModal.cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!changed || isLoading) && styles.saveBtnDisabled,
                { backgroundColor: theme.primary },
              ]}
              onPress={handleSave}
              disabled={!changed || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveTxt}>
                  {t('visibilityModal.save')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTexts: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  passwordSection: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  passwordLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
  eyeBtn: {
    padding: 8,
  },
  passwordHint: {
    fontSize: 11,
    lineHeight: 15,
  },
  currentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    marginBottom: 8,
  },
  currentStatusLabel: {
    fontSize: 12,
  },
  currentStatusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  currentStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  btns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelTxt: {
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveTxt: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});