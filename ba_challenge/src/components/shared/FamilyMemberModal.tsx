import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  FamilyMember,
  Relation,
  RELATION_LABELS,
} from '@types/index';
import { useTheme } from '@/theme/ThemeContext';

interface FamilyMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (params: {
    name: string;
    relation: Relation;
    birthYear?: number;
    bio?: string;
    parentId?: number;
  }) => Promise<void>;
  editMember?: FamilyMember | null;
  members: FamilyMember[];
  isLoading?: boolean;
}

const RELATIONS = Object.keys(RELATION_LABELS) as Relation[];

export const FamilyMemberModal: React.FC<FamilyMemberModalProps> = ({
  visible,
  onClose,
  onSave,
  editMember,
  members,
  isLoading,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [name, setName] = useState('');
  const [relation, setRelation] = useState<Relation>('other');
  const [birthYear, setBirthYear] = useState('');
  const [bio, setBio] = useState('');
  const [parentId, setParentId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (editMember) {
      setName(editMember.name);
      setRelation(editMember.relation);
      setBirthYear(editMember.birthYear?.toString() || '');
      setBio(editMember.bio || '');
      setParentId(editMember.parentId);
    } else {
      setName('');
      setRelation('other');
      setBirthYear('');
      setBio('');
      setParentId(undefined);
    }
  }, [editMember, visible]);

  const handleSave = async () => {
    if (!name.trim()) return;

    await onSave({
      name: name.trim(),
      relation,
      birthYear: birthYear ? parseInt(birthYear) : undefined,
      bio: bio.trim() || undefined,
      parentId,
    });
  };

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
            {editMember
              ? t('familyMemberModal.editTitle')
              : t('familyMemberModal.addTitle')}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Имя */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              {t('familyMemberModal.nameLabel')}
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.textPrimary }]}
              value={name}
              onChangeText={setName}
              placeholder={t('familyMemberModal.namePlaceholder')}
              placeholderTextColor={theme.textMuted}
              autoFocus
            />

            {/* Родство */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              {t('familyMemberModal.relationLabel')}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.relationsRow}
            >
              {RELATIONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.relationChip,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    relation === r && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setRelation(r)}
                >
                  <Text
                    style={[
                      styles.relationChipTxt,
                      { color: theme.textSecondary },
                      relation === r && { color: '#ffffff', fontWeight: '600' },
                    ]}
                  >
                    {RELATION_LABELS[r]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Год рождения */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              {t('familyMemberModal.birthYearLabel')}
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.textPrimary }]}
              value={birthYear}
              onChangeText={setBirthYear}
              placeholder={t('familyMemberModal.birthYearPlaceholder')}
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              maxLength={4}
            />

            {/* Родитель в дереве */}
            {members.length > 0 && !editMember && (
              <>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  {t('familyMemberModal.parentLabel')}
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.relationsRow}
                >
                  <TouchableOpacity
                    style={[
                      styles.relationChip,
                      { backgroundColor: theme.card, borderColor: theme.border },
                      !parentId && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                    onPress={() => setParentId(undefined)}
                  >
                    <Text
                      style={[
                        styles.relationChipTxt,
                        { color: theme.textSecondary },
                        !parentId && { color: '#ffffff', fontWeight: '600' },
                      ]}
                    >
                      {t('familyMemberModal.none')}
                    </Text>
                  </TouchableOpacity>

                  {members.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.relationChip,
                        { backgroundColor: theme.card, borderColor: theme.border },
                        parentId === m.id && { backgroundColor: theme.primary, borderColor: theme.primary },
                      ]}
                      onPress={() => setParentId(m.id)}
                    >
                      <Text
                        style={[
                          styles.relationChipTxt,
                          { color: theme.textSecondary },
                          parentId === m.id && { color: '#ffffff', fontWeight: '600' },
                        ]}
                      >
                        {m.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Описание */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              {t('familyMemberModal.bioLabel')}
            </Text>

            <TextInput
              style={[styles.input, styles.inputMulti, { backgroundColor: theme.card, borderColor: theme.border, color: theme.textPrimary }]}
              value={bio}
              onChangeText={setBio}
              placeholder={t('familyMemberModal.bioPlaceholder')}
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </ScrollView>

          <View style={styles.btns}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: theme.border }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelTxt, { color: theme.textSecondary }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!name.trim() || isLoading) && styles.saveBtnDisabled,
                { backgroundColor: theme.primary },
              ]}
              onPress={handleSave}
              disabled={!name.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#ffffff"
                />
              ) : (
                <Text style={styles.saveTxt}>
                  {editMember
                    ? t('common.save')
                    : t('familyMemberModal.addButton')}
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
    maxHeight: '90%',
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
    minHeight: 80,
    textAlignVertical: 'top',
  },

  relationsRow: {
    marginBottom: 16,
  },

  relationChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },

  relationChipActive: {},

  relationChipTxt: {
    fontSize: 12,
  },

  relationChipTxtActive: {},

  btns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
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