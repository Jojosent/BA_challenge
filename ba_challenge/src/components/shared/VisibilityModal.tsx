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
import { Colors } from '@/constants/colors';
import { privacyService } from '@services/privacyService';

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
      color: Colors.accent,
    },
    {
      key: 'protected' as Visibility,
      icon: 'lock-closed-outline',
      label: t('visibilityModal.protected'),
      desc: t('visibilityModal.protectedDesc'),
      color: Colors.warning,
    },
    {
      key: 'secret' as Visibility,
      icon: 'eye-off-outline',
      label: t('visibilityModal.secret'),
      desc: t('visibilityModal.secretDesc'),
      color: Colors.error,
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
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {t('visibilityModal.title')}
            </Text>

            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
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
                          isActive && { color: opt.color },
                        ]}
                      >
                        {opt.label}
                      </Text>

                      <Text style={styles.optionDesc}>
                        {opt.desc}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.radioOuter,
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
              <View style={styles.passwordSection}>
                <Text style={styles.passwordLabel}>
                  {t('visibilityModal.passwordLabel')}
                </Text>

                <View style={styles.passwordRow}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t('visibilityModal.passwordPlaceholder')}
                    placeholderTextColor={Colors.textMuted}
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
                      color={Colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.passwordHint}>
                  {t('visibilityModal.passwordHint')}
                </Text>
              </View>
            )}

            <View style={styles.currentStatus}>
              <Text style={styles.currentStatusLabel}>
                {t('visibilityModal.currentVisibility')}
              </Text>

              <View style={styles.currentStatusBadge}>
                <Text style={styles.currentStatusText}>
                  {currentOption?.label}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.btns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelTxt}>
                {t('visibilityModal.cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!changed || isLoading) && styles.saveBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={!changed || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.white} />
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
    backgroundColor: Colors.surface,
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
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
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
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  passwordSection: {
    backgroundColor: Colors.warning + '12',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  passwordLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.warning,
    marginBottom: 10,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  eyeBtn: {
    padding: 8,
  },
  passwordHint: {
    fontSize: 11,
    color: Colors.textSecondary,
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
    color: Colors.textMuted,
  },
  currentStatusBadge: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currentStatusText: {
    fontSize: 12,
    color: Colors.textSecondary,
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
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelTxt: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveTxt: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});