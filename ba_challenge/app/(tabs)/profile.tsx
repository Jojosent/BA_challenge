import { userService } from '@/services/userService';
import { LoadingSpinner } from '@components/shared/LoadingSpinner';
import { RoleBadge } from '@components/shared/RoleBadge';
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
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Theme — relative import (файлдар app/(tabs)/theme/ ішінде) ───────────────
import { ThemePicker } from './theme/ThemePicker';
import { useTheme } from './theme/ThemeContext';
import { ThemeTokens } from './theme/themes';

// ─── StatCol ──────────────────────────────────────────────────────────────────
function StatCol({ value, label, D }: { value: number | string; label: string; D: ThemeTokens }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 20, fontWeight: '900', color: D.textPrimary, letterSpacing: -0.5 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 12, color: D.textSecondary, marginTop: 2, fontWeight: '500' }}>
        {label}
      </Text>
    </View>
  );
}

// ─── SettingsRow ──────────────────────────────────────────────────────────────
function SettingsRow({
  icon, label, onPress, color, danger, D,
}: {
  icon: string; label: string; onPress: () => void;
  color?: string; danger?: boolean; D: ThemeTokens;
}) {
  const c = danger ? D.rose : (color ?? D.primary);
  return (
    <TouchableOpacity
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, paddingHorizontal: 18 }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c + '18', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon as any} size={18} color={c} />
      </View>
      <Text style={{ flex: 1, fontSize: 15, color: danger ? D.rose : D.textPrimary, fontWeight: '500' }}>
        {label}
      </Text>
      {!danger && <Ionicons name="chevron-forward" size={16} color={D.textMuted} />}
    </TouchableOpacity>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────
function SectionCard({ children, D }: { children: React.ReactNode; D: ThemeTokens }) {
  return (
    <View style={{ backgroundColor: D.surface, marginHorizontal: 16, borderRadius: 18, borderWidth: 1, borderColor: D.border, marginBottom: 14, overflow: 'hidden' }}>
      {children}
    </View>
  );
}

function Divider({ D }: { D: ThemeTokens }) {
  return <View style={{ height: 1, backgroundColor: D.borderLight, marginHorizontal: 18 }} />;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { theme: D } = useTheme();
  const { displayUser, isLoading, editProfile, fetchProfile } = useProfile();
  const { logout } = useAuth();

  const [editModal,   setEditModal]   = useState(false);
  const [themeModal,  setThemeModal]  = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [stats, setStats] = useState({ challengeCount: 0, wonCount: 0, streakCount: 0 });
  const router = useRouter();

  useEffect(() => {
    userService.getStats().then(setStats).catch(console.error);
  }, []);

  if (isLoading && !displayUser) return <LoadingSpinner />;

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Қате', 'Галереяға рұқсат керек');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5,
      });
      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Қате', 'Суретті таңдай алмады');
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      const filename = uri.split('/').pop() ?? 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      formData.append('avatar', { uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''), name: filename, type } as any);
      await userService.uploadAvatar(formData);
      await fetchProfile();
      Alert.alert('Сәтті', 'Аватар жаңартылды');
    } catch {
      Alert.alert('Қате', 'Фотоны жүктеу мүмкін болмады');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = async () => {
    if (!newUsername.trim()) return;
    const success = await editProfile({ username: newUsername.trim() });
    if (success) { setEditModal(false); fetchProfile(); }
  };

  const handleLogout = () => {
    Alert.alert('Шығу', 'Аккаунттан шығуды қалайсың ба?', [
      { text: 'Болдырмау', style: 'cancel' },
      { text: 'Шығу', style: 'destructive', onPress: logout },
    ]);
  };

  const getFullAvatarUrl = () => {
    if (!displayUser?.avatarUrl) return null;
    return `${Config.API_URL.split('/api')[0]}${displayUser.avatarUrl}`;
  };

  const isAdminOrModerator = displayUser?.role === 'admin' || displayUser?.role === 'moderator';
  const initial = displayUser?.username?.charAt(0).toUpperCase() ?? '?';

  return (
    <SafeAreaView style={[s.container, { backgroundColor: D.bg }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Top bar */}
        <View style={s.topBar}>
          <Text style={[s.topUsername, { color: D.textPrimary }]}>{displayUser?.username ?? ''}</Text>
          <TouchableOpacity style={s.menuBtn}>
            <Ionicons name="menu" size={24} color={D.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Profile row */}
        <View style={s.profileRow}>
          <View style={s.avatarWrap}>
            <View style={[s.avatarRing, { backgroundColor: D.avatarRing, shadowColor: D.avatarRing }]}>
              <View style={[s.avatarInner, { borderColor: D.bg }]}>
                {displayUser?.avatarUrl ? (
                  <Image source={{ uri: getFullAvatarUrl()! }} style={s.avatarImg} />
                ) : (
                  <View style={[s.avatarFallback, { backgroundColor: D.primary }]}>
                    <Text style={[s.avatarInitial, { color: D.white }]}>{initial}</Text>
                  </View>
                )}
                {isUploading && (
                  <View style={s.uploadOverlay}>
                    <ActivityIndicator color={D.white} />
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={[s.cameraBtn, { backgroundColor: D.primary, borderColor: D.bg }]}
              onPress={handlePickAvatar}
              disabled={isUploading}
            >
              <Ionicons name="add" size={14} color={D.white} />
            </TouchableOpacity>
          </View>
          <View style={s.statsRow}>
            <StatCol D={D} value={stats.challengeCount} label="Челлендж" />
            <StatCol D={D} value={stats.wonCount}       label="Жеңіс" />
            <StatCol D={D} value={stats.streakCount}    label="Серия" />
          </View>
        </View>

        {/* Name */}
        <View style={s.nameBlock}>
          <View style={s.nameRow}>
            <Text style={[s.displayName, { color: D.textPrimary }]}>{displayUser?.username ?? ''}</Text>
            {displayUser?.role && <RoleBadge role={displayUser.role} />}
          </View>
          <Text style={[s.emailText, { color: D.textMuted }]}>{displayUser?.email ?? ''}</Text>
        </View>

        {/* Edit button */}
        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: D.surface, borderColor: D.border }]}
            onPress={() => { setNewUsername(displayUser?.username ?? ''); setEditModal(true); }}
          >
            <Text style={[s.actionBtnText, { color: D.textPrimary }]}>Өңдеу</Text>
          </TouchableOpacity>
        </View>

        {/* Admin */}
        {isAdminOrModerator && (
          <>
            <Text style={[s.sectionLabel, { color: D.textMuted }]}>Басқару</Text>
            <SectionCard D={D}>
              <SettingsRow D={D} icon="shield-half-outline" label="Администратор панелі" onPress={() => router.push('/admin')} color={D.rose} />
            </SectionCard>
          </>
        )}

        {/* Settings */}
        <Text style={[s.sectionLabel, { color: D.textMuted }]}>Параметрлер</Text>
        <SectionCard D={D}>
          <SettingsRow D={D} icon="notifications-outline" label="Хабарландырулар" onPress={() => router.push('/notifications')} color={D.amber} />
          <Divider D={D} />
          <SettingsRow D={D} icon="lock-closed-outline" label="Құпиялылық" onPress={() => router.push('/settings/privacy-settings')} color={D.primary} />
          <Divider D={D} />
          <SettingsRow D={D} icon="language-outline" label="Тіл" onPress={() => {}} color={D.emerald} />
          <Divider D={D} />
          <SettingsRow D={D} icon="color-palette-outline" label="Тақырып" onPress={() => setThemeModal(true)} color={D.primary} />
        </SectionCard>

        {/* Logout */}
        <SectionCard D={D}>
          <SettingsRow D={D} icon="log-out-outline" label="Аккаунттан шығу" onPress={handleLogout} danger />
        </SectionCard>

        <Text style={[s.version, { color: D.textMuted }]}>B&A Challenge v1.0.0</Text>
      </ScrollView>

      {/* Theme picker */}
      <ThemePicker visible={themeModal} onClose={() => setThemeModal(false)} />

      {/* Edit modal */}
      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <Pressable style={m.overlay} onPress={() => setEditModal(false)}>
          <Pressable style={[m.sheet, { backgroundColor: D.surface }]} onPress={() => {}}>
            <View style={[m.handle, { backgroundColor: D.border }]} />
            <Text style={[m.title, { color: D.textPrimary }]}>Атты өзгерту</Text>
            <TextInput
              style={[m.input, { backgroundColor: D.bg, borderColor: D.border, color: D.textPrimary }]}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Жаңа пайдаланушы аты"
              placeholderTextColor={D.textMuted}
              autoCapitalize="none"
              autoFocus
            />
            <View style={m.btnRow}>
              <TouchableOpacity style={[m.cancelBtn, { backgroundColor: D.bg, borderColor: D.border }]} onPress={() => setEditModal(false)}>
                <Text style={[m.cancelText, { color: D.textSecondary }]}>Болдырмау</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[m.saveBtn, { backgroundColor: D.primary, shadowColor: D.primary }]} onPress={handleEdit}>
                {isLoading
                  ? <ActivityIndicator color={D.white} size="small" />
                  : <Text style={[m.saveText, { color: D.white }]}>Сақтау</Text>
                }
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1 },
  scroll:     { paddingBottom: 40 },
  topBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 10, position: 'relative' },
  topUsername:{ fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  menuBtn:    { position: 'absolute', right: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, gap: 20 },
  avatarWrap: { position: 'relative' },
  avatarRing: { width: 92, height: 92, borderRadius: 46, padding: 3, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  avatarInner:{ flex: 1, borderRadius: 43, borderWidth: 2.5, overflow: 'hidden' },
  avatarImg:  { width: '100%', height: '100%' },
  avatarFallback:{ flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 34, fontWeight: '900' },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  cameraBtn:  { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  statsRow:   { flex: 1, flexDirection: 'row' },
  nameBlock:  { paddingHorizontal: 18, marginBottom: 14, gap: 4 },
  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  displayName:{ fontSize: 16, fontWeight: '800' },
  emailText:  { fontSize: 13 },
  actionRow:  { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  actionBtn:  { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  actionBtnText:{ fontSize: 13, fontWeight: '700' },
  sectionLabel: { fontSize: 13, fontWeight: '700', paddingHorizontal: 20, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  version:    { fontSize: 12, textAlign: 'center', marginTop: 8 },
});

const m = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(26,16,64,0.5)', justifyContent: 'flex-end' },
  sheet:      { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 },
  handle:     { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title:      { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, marginBottom: 18 },
  input:      { borderRadius: 14, padding: 14, fontSize: 16, borderWidth: 1.5, marginBottom: 20 },
  btnRow:     { flexDirection: 'row', gap: 12 },
  cancelBtn:  { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5 },
  cancelText: { fontSize: 15, fontWeight: '700' },
  saveBtn:    { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
  saveText:   { fontSize: 15, fontWeight: '800' },
});