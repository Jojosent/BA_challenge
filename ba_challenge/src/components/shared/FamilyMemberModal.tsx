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
import { Colors } from '@constants/colors';
import {
  FamilyMember,
  Relation,
  RELATION_LABELS,
} from '@types/index';

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
  visible, onClose, onSave, editMember, members, isLoading,
}) => {
  const [name, setName]           = useState('');
  const [relation, setRelation]   = useState<Relation>('other');
  const [birthYear, setBirthYear] = useState('');
  const [bio, setBio]             = useState('');
  const [parentId, setParentId]   = useState<number | undefined>(undefined);

  useEffect(() => {
    if (editMember) {
      setName(editMember.name);
      setRelation(editMember.relation);
      setBirthYear(editMember.birthYear?.toString() || '');
      setBio(editMember.bio || '');
      setParentId(editMember.parentId);
    } else {
      setName(''); setRelation('other');
      setBirthYear(''); setBio(''); setParentId(undefined);
    }
  }, [editMember, visible]);

  const handleSave = async () => {
    if (!name.trim()) return;
    await onSave({
      name:      name.trim(),
      relation,
      birthYear: birthYear ? parseInt(birthYear) : undefined,
      bio:       bio.trim() || undefined,
      parentId,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>
            {editMember ? '✏️ Изменить' : '👤 Добавить родственника'}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Имя */}
            <Text style={styles.label}>Имя *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Имя родственника"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />

            {/* Родство */}
            <Text style={styles.label}>Родство *</Text>
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
                    relation === r && styles.relationChipActive,
                  ]}
                  onPress={() => setRelation(r)}
                >
                  <Text style={[
                    styles.relationChipTxt,
                    relation === r && styles.relationChipTxtActive,
                  ]}>
                    {RELATION_LABELS[r]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Год рождения */}
            <Text style={styles.label}>Год рождения</Text>
            <TextInput
              style={styles.input}
              value={birthYear}
              onChangeText={setBirthYear}
              placeholder="Например: 1965"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              maxLength={4}
            />

            {/* Родитель в дереве */}
            {members.length > 0 && !editMember && (
              <>
                <Text style={styles.label}>Связан с (родитель в дереве)</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.relationsRow}
                >
                  <TouchableOpacity
                    style={[styles.relationChip, !parentId && styles.relationChipActive]}
                    onPress={() => setParentId(undefined)}
                  >
                    <Text style={[styles.relationChipTxt, !parentId && styles.relationChipTxtActive]}>
                      Нет
                    </Text>
                  </TouchableOpacity>
                  {members.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.relationChip, parentId === m.id && styles.relationChipActive]}
                      onPress={() => setParentId(m.id)}
                    >
                      <Text style={[
                        styles.relationChipTxt,
                        parentId === m.id && styles.relationChipTxtActive,
                      ]}>
                        {m.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Описание */}
            <Text style={styles.label}>О человеке</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={bio}
              onChangeText={setBio}
              placeholder="Краткая биография..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </ScrollView>

          <View style={styles.btns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelTxt}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, (!name.trim() || isLoading) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!name.trim() || isLoading}
            >
              {isLoading
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Text style={styles.saveTxt}>{editMember ? 'Сохранить' : 'Добавить'}</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  title:  { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 20 },
  label:  { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', marginBottom: 8 },
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
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },

  relationsRow:         { marginBottom: 16 },
  relationChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  relationChipActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  relationChipTxt:       { fontSize: 12, color: Colors.textSecondary },
  relationChipTxtActive: { color: Colors.white, fontWeight: '600' },

  btns:      { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  cancelTxt:       { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn:         { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.45 },
  saveTxt:         { color: Colors.white, fontWeight: '700', fontSize: 15 },
});