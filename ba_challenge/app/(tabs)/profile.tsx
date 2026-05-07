import { userService } from '@/services/userService';
import { LoadingSpinner } from '@components/shared/LoadingSpinner';
import { RoleBadge } from '@components/shared/RoleBadge';
import { StatCard } from '@components/shared/StatCard';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Colors } from '@constants/colors';
import { Config } from '@constants/config';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@hooks/useAuth';
import { useProfile } from '@hooks/useProfile';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { displayUser, isLoading, editProfile, fetchProfile } = useProfile();
  const { logout } = useAuth();
  const [editModal, setEditModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [stats, setStats] = useState({
    avgRating: 0,
    totalVoters: 0,
    challengeCount: 0,
    wonCount: 0,
    streakCount: 0,
  });
  const router = useRouter();

  useEffect(() => {
    userService.getStats().then(setStats).catch(console.error);
  }, []);

  if (isLoading && !displayUser) return <LoadingSpinner />;

  // Выбор и загрузка фото
  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Нужен доступ к галерее для выбора фото');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('avatar', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: filename,
        type,
      } as any);

      await userService.uploadAvatar(formData);
      await fetchProfile(); // Обновляем данные пользователя
      Alert.alert('Успех', 'Аватар обновлен');
    } catch (error) {
      console.error(error);
      Alert.alert('Ошибка', 'Не удалось загрузить фото');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = async () => {
    if (!newUsername.trim()) return;
    const success = await editProfile({ username: newUsername.trim() });
    if (success) {
      setEditModal(false);
      fetchProfile();
    }
  };

  const handleLogout = () => {
    Alert.alert('Выйти', 'Ты уверен что хочешь выйти?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: logout },
    ]);
  };

  const getFullAvatarUrl = () => {
    if (!displayUser?.avatarUrl) return null;
    const baseUrl = Config.API_URL.split('/api')[0];
    return `${baseUrl}${displayUser.avatarUrl}`;
  };

  const isAdminOrModerator =
    displayUser?.role === 'admin' || displayUser?.role === 'moderator';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              {displayUser?.avatarUrl ? (
                <Image source={{ uri: getFullAvatarUrl()! }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {displayUser?.username?.charAt(0).toUpperCase() ?? '?'}
                </Text>
              )}
              {isUploading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator color={Colors.white} />
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.avatarEdit}
              onPress={handlePickAvatar}
              disabled={isUploading}
            >
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

        <Text style={styles.sectionTitle}>Статистика</Text>
        <View style={styles.statsRow}>
          {/* ✅ Карточка серии меняет цвет на серый, если стрик 0 */}
          <StatCard
            icon="🔥"
            label="Серия"
            value={stats.streakCount}
            color={stats.streakCount > 0 ? Colors.error : Colors.textMuted}
          />
          <StatCard
            icon="🪙"
            label="Rikon"
            value={displayUser?.rikonCoins ?? 0}
            color={Colors.rikon}
          />
          <StatCard 
            icon="🏆" 
            label="Победы" 
            value={stats.wonCount} 
            color={Colors.accent} 
          />
        </View>

        <Text style={styles.sectionTitle}>Информация</Text>
        <Card style={styles.infoCard}>
          <InfoRow
            icon="person-outline"
            label="Имя пользователя"
            value={displayUser?.username ?? '-'}
          />
          <View style={styles.divider} />
          <InfoRow icon="mail-outline" label="Email" value={displayUser?.email ?? '-'} />
          <View style={styles.divider} />
          <InfoRow
            icon="shield-checkmark-outline"
            label="Роль"
            value={displayUser?.role ?? '-'}
          />
        </Card>

        {isAdminOrModerator && (
          <>
            <Text style={styles.sectionTitle}>Управление</Text>
            <Card style={styles.settingsCard}>
              <SettingsRow
                icon="shield-half-outline"
                label="Панель администратора"
                onPress={() => router.push('/admin')}
              />
            </Card>
          </>
        )}

        <Text style={styles.sectionTitle}>Настройки</Text>
        <Card style={styles.settingsCard}>
          <SettingsRow
            icon="notifications-outline"
            label="Уведомления"
            onPress={() => router.push('/notifications')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="lock-closed-outline"
            label="Приватность"
            onPress={() => router.push('/settings/privacy-settings')}
          />
          <View style={styles.divider} />
          <SettingsRow icon="language-outline" label="Язык" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingsRow icon="color-palette-outline" label="Тема" onPress={() => {}} />
        </Card>

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

const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <View style={infoStyles.row}>
    <Ionicons name={icon as any} size={18} color={Colors.textSecondary} />
    <View style={infoStyles.texts}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  </View>
);

const SettingsRow = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
  <TouchableOpacity style={infoStyles.row} onPress={onPress}>
    <Ionicons name={icon as any} size={18} color={Colors.textSecondary} />
    <Text style={[infoStyles.label, { flex: 1, marginLeft: 12 }]}>{label}</Text>
    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
  </TouchableOpacity>
);

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  texts: { flex: 1 },
  label: { fontSize: 14, color: Colors.textSecondary },
  value: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  profileHeader: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
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
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
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
  username: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 20 },
  infoCard: { marginHorizontal: 20, marginBottom: 20 },
  settingsCard: { marginHorizontal: 20, marginBottom: 20 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 2 },
  logoutSection: { paddingHorizontal: 20, paddingBottom: 32, alignItems: 'center' },
  logoutBtn: { width: '100%', marginBottom: 16, borderColor: Colors.error },
  version: { fontSize: 12, color: Colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 20 },
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
