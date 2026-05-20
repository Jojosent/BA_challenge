import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Task } from '@/types/index';
import { useTheme } from '@/theme/ThemeContext';

interface TaskFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (title: string, description: string) => Promise<void>;
  editTask?: Task | null;
  isLoading?: boolean;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  visible,
  onClose,
  onSave,
  editTask,
  isLoading,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDesc] = useState('');

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDesc(editTask.description);
    } else {
      setTitle('');
      setDesc('');
    }
  }, [editTask, visible]);

  const handleSave = async () => {
    if (!title.trim()) return;
    await onSave(title.trim(), description.trim());
  };

  const isEdit = !!editTask;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {isEdit
              ? t('taskFormModal.editTitle')
              : t('taskFormModal.newTitle')}
          </Text>

          <Text style={[styles.label, { color: theme.textSecondary }]}>
            {t('taskFormModal.taskTitleLabel')}
          </Text>

          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
            value={title}
            onChangeText={setTitle}
            placeholder={t('taskFormModal.taskTitlePlaceholder')}
            placeholderTextColor={theme.textMuted}
            maxLength={200}
            autoFocus
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>
            {t('taskFormModal.descriptionLabel')}
          </Text>

          <TextInput
            style={[styles.input, styles.inputMulti, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
            value={description}
            onChangeText={setDesc}
            placeholder={t('taskFormModal.descriptionPlaceholder')}
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={4}
            maxLength={1000}
            textAlignVertical="top"
          />

          <View style={styles.btns}>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.border }]} onPress={onClose}>
              <Text style={[styles.cancelTxt, { color: theme.textSecondary }]}>
                {t('taskFormModal.cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!title.trim() || isLoading) && styles.saveBtnDisabled,
                { backgroundColor: theme.primary },
              ]}
              onPress={handleSave}
              disabled={!title.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveTxt}>
                  {isEdit
                    ? t('taskFormModal.save')
                    : t('taskFormModal.add')}
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
  },
  inputMulti: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  btns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
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
    opacity: 0.45,
  },
  saveTxt: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});