import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { Header } from '@components/shared/Header';
import { privacyService, ProfilePrivacySettings } from '@services/privacyService';

interface SettingRowProps {
  icon:     string;
  title:    string;
  desc:     string;
  value:    boolean;
  onToggle: (v: boolean) => void;
  color?:   string;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon, title, desc, value, onToggle, color = Colors.primary,
}) => (
  <View style={rowStyles.row}>
    <View style={[rowStyles.iconBox, { backgroundColor: color + '18' }]}>
      <Text style={rowStyles.icon}>{icon}</Text>
    </View>
    <View style={rowStyles.texts}>
      <Text style={rowStyles.title}>{title}</Text>
      <Text style={rowStyles.desc}>{desc}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: Colors.border, true: color + '80' }}
      thumbColor={value ? color : Colors.textMuted}
    />
  </View>
);

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon:  { fontSize: 20 },
  texts: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  desc:  { fontSize: 12, color: Colors.textSecondary, lineHeight: 16 },
});

export default function PrivacySettingsScreen() {
  const [settings, setSettings] = useState<ProfilePrivacySettings>({
    showChallengesPublic:  true,
    allowFamilyInvites:    true,
    allowChallengeInvites: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving,  setIsSaving]  = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [original,  setOriginal]  = useState<ProfilePrivacySettings | null>(null);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await privacyService.getProfilePrivacy();
      setSettings(data);
      setOriginal(data);
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить настройки');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof ProfilePrivacySettings) => (value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    setHasChanges(JSON.stringify(updated) !== JSON.stringify(original));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await privacyService.updateProfilePrivacy(settings);
      setOriginal(settings);
      setHasChanges(false);
      Alert.alert('✅ Сохранено', 'Настройки приватности обновлены');
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="🔒 Приватность" showBack />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="🔒 Приватность"
        showBack
        rightElement={
          hasChanges ? (
            <TouchableOpacity
              style={styles.saveHeaderBtn}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Text style={styles.saveHeaderTxt}>Сохранить</Text>
              }
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Информационная карточка */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🛡️</Text>
          <View style={styles.infoTexts}>
            <Text style={styles.infoTitle}>Управление приватностью</Text>
            <Text style={styles.infoDesc}>
              Настрой кто может видеть твою информацию и кто может тебя приглашать
            </Text>
          </View>
        </View>

        {/* Профиль */}
        <Text style={styles.sectionTitle}>Профиль</Text>
        <View style={styles.section}>
          <SettingRow
            icon="🏆"
            title="Показывать мои челленджи"
            desc="Другие пользователи смогут видеть твои публичные челленджи"
            value={settings.showChallengesPublic}
            onToggle={handleToggle('showChallengesPublic')}
            color={Colors.accent}
          />
        </View>

        {/* Приглашения */}
        <Text style={styles.sectionTitle}>Приглашения</Text>
        <View style={styles.section}>
          <SettingRow
            icon="🌳"
            title="Приглашения в семью"
            desc="Если выключено — никто не сможет пригласить тебя в семейное дерево"
            value={settings.allowFamilyInvites}
            onToggle={handleToggle('allowFamilyInvites')}
            color={Colors.primary}
          />
          <SettingRow
            icon="🎯"
            title="Приглашения в челленджи"
            desc="Если выключено — никто не сможет пригласить тебя в челлендж"
            value={settings.allowChallengeInvites}
            onToggle={handleToggle('allowChallengeInvites')}
            color={Colors.secondary}
          />
        </View>

        {/* Подсказка */}
        {(!settings.allowFamilyInvites || !settings.allowChallengeInvites) && (
          <View style={styles.warningCard}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              Когда кто-то попытается тебя пригласить — он увидит сообщение что ты отключил приглашения
            </Text>
          </View>
        )}

        {/* Уровни видимости */}
        <Text style={styles.sectionTitle}>Уровни видимости челленджей</Text>
        <View style={styles.visibilityGuide}>
          {[
            {
              icon:  '🌍',
              label: 'Публичный',
              desc:  'Все пользователи видят и могут вступить свободно',
              color: Colors.accent,
            },
            {
              icon:  '🔐',
              label: 'Защищённый',
              desc:  'Виден всем в поиске, но вступить можно только по паролю',
              color: Colors.warning,
            },
            {
              icon:  '🔒',
              label: 'Секретный',
              desc:  'Виден только приглашённым участникам, скрыт из поиска',
              color: Colors.error,
            },
          ].map((item) => (
            <View key={item.label} style={styles.guideRow}>
              <View style={[styles.guideDot, { backgroundColor: item.color }]} />
              <Text style={styles.guideIcon}>{item.icon}</Text>
              <View style={styles.guideTexts}>
                <Text style={[styles.guideLabel, { color: item.color }]}>{item.label}</Text>
                <Text style={styles.guideDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Кнопка сохранить */}
        {hasChanges && (
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving
              ? <ActivityIndicator size="small" color={Colors.white} />
              : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
                  <Text style={styles.saveBtnTxt}>Сохранить изменения</Text>
                </>
              )
            }
          </TouchableOpacity>
        )}

        <Text style={styles.note}>
          🔐 Твои личные данные защищены и не передаются третьим лицам
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content:    { padding: 20, paddingBottom: 40 },

  saveHeaderBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveHeaderTxt: { color: Colors.white, fontWeight: '700', fontSize: 13 },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.primary + '15',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  infoIcon:  { fontSize: 28 },
  infoTexts: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  infoDesc:  { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 24,
  },

  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.warning + '15',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  warningIcon: { fontSize: 18 },
  warningText: { flex: 1, fontSize: 13, color: Colors.warning, lineHeight: 18 },

  visibilityGuide: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  guideRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  guideDot:   { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  guideIcon:  { fontSize: 18 },
  guideTexts: { flex: 1 },
  guideLabel: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  guideDesc:  { fontSize: 12, color: Colors.textSecondary, lineHeight: 16 },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 16,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnTxt:      { color: Colors.white, fontWeight: '700', fontSize: 15 },

  note: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 17 },
});