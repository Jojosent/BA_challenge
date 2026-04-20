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
import { Colors } from '@constants/colors';
import { Task } from '@/types/index';

interface TaskFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (title: string, description: string) => Promise<void>;
  editTask?: Task | null;   // если передана — режим редактирования
  isLoading?: boolean;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  visible,
  onClose,
  onSave,
  editTask,
  isLoading,
}) => {
  const [title, setTitle]       = useState('');
  const [description, setDesc]  = useState('');

  // Заполняем поля если редактируем
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
        <View style={styles.sheet}>
          <Text style={styles.title}>
            {isEdit ? '✏️ Изменить задачу' : '➕ Новая задача'}
          </Text>

          <Text style={styles.label}>Название задачи *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Например: Пробежать 5 км"
            placeholderTextColor={Colors.textMuted}
            maxLength={200}
            autoFocus
          />

          <Text style={styles.label}>Описание</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={description}
            onChangeText={setDesc}
            placeholder="Подробное описание что нужно сделать..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            maxLength={1000}
            textAlignVertical="top"
          />

          <View style={styles.btns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelTxt}>Отмена</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!title.trim() || isLoading) && styles.saveBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={!title.trim() || isLoading}
            >
              {isLoading
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Text style={styles.saveTxt}>
                    {isEdit ? 'Сохранить' : 'Добавить'}
                  </Text>
              }
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
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  inputMulti: { minHeight: 100, textAlignVertical: 'top' },

  btns:      { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelTxt: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveTxt: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});