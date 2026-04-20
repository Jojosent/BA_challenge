import { ReceivedVotes } from '@/components/shared/ReceivedVotes';
import { userService } from '@/services/userService';
import { LoadingSpinner } from '@components/shared/LoadingSpinner';
import { RoleBadge } from '@components/shared/RoleBadge';
import { StatCard } from '@components/shared/StatCard';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Colors } from '@constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@hooks/useAuth';
import { useProfile } from '@hooks/useProfile';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { displayUser, isLoading, editProfile, fetchProfile } = useProfile();
  const { logout } = useAuth();
  const [editModal, setEditModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [stats, setStats] = useState({
  avgRating: 0, totalVoters: 0,
  challengeCount: 0, wonCount: 0,
});

useEffect(() => {
  userService.getStats().then(setStats).catch(console.error);
}, []);

  if (isLoading && !displayUser) return <LoadingSpinner />;

  const handleEdit = async () => {
    if (!newUsername.trim()) return;
    const success = await editProfile({ username: newUsername.trim() });
    if (success) {
      setEditModal(false);
      fetchProfile();
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Выйти',
      'Ты уверен что хочешь выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Выйти', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Шапка профиля */}
        <View style={styles.profileHeader}>
          {/* Аватар */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {displayUser?.username?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
            <TouchableOpacity style={styles.avatarEdit}>
              <Ionicons name="camera" size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.username}>{displayUser?.username}</Text>
          <Text style={styles.email}>{displayUser?.email}</Text>

          

          {displayUser?.role && (
            <View style={styles.badgeRow}>
              <RoleBadge role={displayUser.role} />
            </View>
          )}

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              setNewUsername(displayUser?.username ?? '');
              setEditModal(true);
            }}
          >
            <Ionicons name="pencil" size={14} color={Colors.primary} />
            <Text style={styles.editBtnText}>Редактировать</Text>
          </TouchableOpacity>
        </View>

        {/* Статистика */}
        <Text style={styles.sectionTitle}>Статистика</Text>
<View style={styles.statsRow}>
  <StatCard
    icon="🪙"
    label="Rikon"
    value={displayUser?.rikonCoins ?? 0}
    color={Colors.rikon}
  />
  <StatCard
    icon="⭐"
    label={`(${stats.totalVoters})`}
    value={stats.avgRating > 0 ? stats.avgRating.toFixed(2) : '—'}
    color={Colors.warning}
  />
  <StatCard
    icon="🏆"
    label="Победы"
    value={stats.wonCount}
    color={Colors.accent}
  />
</View>

        {/* Информация */}
        <Text style={styles.sectionTitle}>Информация</Text>
        <Card style={styles.infoCard}>
          <InfoRow
            icon="person-outline"
            label="Имя пользователя"
            value={displayUser?.username ?? '-'}
          />
          <View style={styles.divider} />
          <InfoRow
            icon="mail-outline"
            label="Email"
            value={displayUser?.email ?? '-'}
          />
          <View style={styles.divider} />
          <InfoRow
            icon="shield-checkmark-outline"
            label="Роль"
            value={displayUser?.role ?? '-'}
          />
        </Card>

        {/* Настройки */}
        <Text style={styles.sectionTitle}>Настройки</Text>
        <Card style={styles.settingsCard}>
          <SettingsRow icon="notifications-outline" label="Уведомления" />
          <View style={styles.divider} />
          <SettingsRow icon="lock-closed-outline" label="Приватность" />
          <View style={styles.divider} />
          <SettingsRow icon="language-outline" label="Язык" />
          <View style={styles.divider} />
          <SettingsRow icon="color-palette-outline" label="Тема" />
        </Card>

        {/* Кнопка выхода */}
        <View style={styles.logoutSection}>
          <Button
            title="Выйти из аккаунта"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutBtn}
          />
          <Text style={styles.version}>B&A Challenge v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Модалка редактирования */}
      <Modal
        visible={editModal}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Изменить имя</Text>

            <TextInput
              style={styles.modalInput}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Новое имя пользователя"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoFocus
            />

            <View style={styles.modalBtns}>
              <Button
                title="Отмена"
                onPress={() => setEditModal(false)}
                variant="outline"
                style={styles.modalBtn}
              />
              <Button
                title="Сохранить"
                onPress={handleEdit}
                isLoading={isLoading}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Вспомогательные компоненты
const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => (
  <View style={infoStyles.row}>
    <Ionicons name={icon as any} size={18} color={Colors.textSecondary} />
    <View style={infoStyles.texts}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  </View>
);

const SettingsRow = ({ icon, label }: { icon: string; label: string }) => (
  <TouchableOpacity style={infoStyles.row}>
    <Ionicons name={icon as any} size={18} color={Colors.textSecondary} />
    <Text style={[infoStyles.label, { flex: 1, marginLeft: 12 }]}>{label}</Text>
    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
  </TouchableOpacity>
);

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  texts: { flex: 1 },
  label: { fontSize: 14, color: Colors.textSecondary },
  value: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Шапка профиля
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.border,
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: Colors.white },
  avatarEdit: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  username: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  email: { fontSize: 14, color: Colors.textSecondary, marginBottom: 12 },
  badgeRow: { marginBottom: 16 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  editBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '500' },

  // Общие
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  infoCard: { marginHorizontal: 20, marginBottom: 20 },
  settingsCard: { marginHorizontal: 20, marginBottom: 20 },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },

  // Logout
  logoutSection: { paddingHorizontal: 20, paddingBottom: 32, alignItems: 'center' },
  logoutBtn: { width: '100%', marginBottom: 16, borderColor: Colors.error },
  version: { fontSize: 12, color: Colors.textMuted },

  // Модалка
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
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
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1 },
});