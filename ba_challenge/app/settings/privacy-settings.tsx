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
import { Header } from '@components/shared/Header';
import { privacyService, ProfilePrivacySettings } from '@services/privacyService';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';

// Статикалық семантикалық accent түстер — темаға байланбайды
const ACCENT = {
  teal:   { color: '#00B894', soft: '#D4F5EE' },
  violet: { color: '#6C5CE7', soft: '#EDE9FE' },
  coral:  { color: '#E17055', soft: '#FDE8E4' },
  amber:  { color: '#FDCB6E', soft: '#FEF5DC' },
};

interface SettingCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  accent: { color: string; soft: string };
  isLast?: boolean;
  theme: any;
}

const SettingCard: React.FC<SettingCardProps> = ({
  icon,
  title,
  desc,
  value,
  onToggle,
  accent,
  isLast,
  theme,
}) => (
  <View
    style={[
      card.wrap,
      { backgroundColor: theme.surface },
      !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border },
    ]}
  >
    <View style={[card.iconBox, { backgroundColor: accent.soft }]}>
      <Ionicons name={icon} size={18} color={accent.color} />
    </View>

    <View style={card.texts}>
      <Text style={[card.title, { color: theme.textPrimary }]}>{title}</Text>
      <Text style={[card.desc, { color: theme.textSecondary }]}>{desc}</Text>
    </View>

    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: theme.border, true: accent.color + 'AA' }}
      thumbColor={value ? accent.color : '#C4BEDD'}
      ios_backgroundColor={theme.border}
    />
  </View>
);

const card = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  texts: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  desc: { fontSize: 12, lineHeight: 17 },
});

interface VisibilityBadgeProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
  accent: { color: string; soft: string };
  theme: any;
}

const VisibilityBadge: React.FC<VisibilityBadgeProps> = ({
  icon,
  label,
  desc,
  accent,
  theme,
}) => (
  <View style={badge.wrap}>
    <View style={[badge.dot, { backgroundColor: accent.color }]} />

    <View style={[badge.iconBox, { backgroundColor: accent.soft }]}>
      <Ionicons name={icon} size={15} color={accent.color} />
    </View>

    <View style={badge.texts}>
      <Text style={[badge.label, { color: accent.color }]}>{label}</Text>
      <Text style={[badge.desc, { color: theme.textSecondary }]}>{desc}</Text>
    </View>
  </View>
);

const badge = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  texts: { flex: 1 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  desc: { fontSize: 12, lineHeight: 16 },
});

const SectionLabel = ({ children, theme }: { children: string; theme: any }) => (
  <Text style={[sec.label, { color: theme.textSecondary }]}>{children}</Text>
);

const sec = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 2,
    opacity: 0.6,
  },
});

export default function PrivacySettingsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [settings, setSettings] = useState<ProfilePrivacySettings>({
    showChallengesPublic: true,
    allowFamilyInvites: true,
    allowChallengeInvites: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [original, setOriginal] = useState<ProfilePrivacySettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await privacyService.getProfilePrivacy();
      setSettings(data);
      setOriginal(data);
    } catch {
      Alert.alert(t('common.error'), t('privacy.loadError'));
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
      Alert.alert(t('privacy.savedTitle'), t('privacy.savedMessage'));
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: theme.bg }]} edges={['top']}>
        <Header title={t('privacy.title')} showBack />
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const anyInviteOff =
    !settings.allowFamilyInvites || !settings.allowChallengeInvites;

  return (
    <SafeAreaView style={[s.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <Header
        title={t('privacy.title')}
        showBack
        rightElement={
          hasChanges ? (
            <TouchableOpacity
              style={[s.saveHeaderBtn, { backgroundColor: theme.primary }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.saveHeaderTxt}>{t('common.save')}</Text>
              )}
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >
        <View
          style={[
            s.heroBanner,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={s.heroLeft}>
            <View style={[s.heroIconBox, { backgroundColor: ACCENT.violet.soft }]}>
              <Ionicons name="shield-checkmark" size={24} color={ACCENT.violet.color} />
            </View>

            <View>
              <Text style={[s.heroTitle, { color: theme.textPrimary }]}>
                {t('privacy.heroTitle')}
              </Text>
              <Text style={[s.heroSub, { color: theme.textSecondary }]}>
                {t('privacy.heroSub')}
              </Text>
            </View>
          </View>

          <View style={[s.heroPill, { backgroundColor: ACCENT.teal.soft }]}>
            <View style={[s.heroDot, { backgroundColor: ACCENT.teal.color }]} />
            <Text style={[s.heroPillTxt, { color: ACCENT.teal.color }]}>
              {t('privacy.protected')}
            </Text>
          </View>
        </View>

        <SectionLabel theme={theme}>{t('privacy.profileSection')}</SectionLabel>

        <View
          style={[
            s.section,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <SettingCard
            icon="trophy-outline"
            title={t('privacy.showChallenges')}
            desc={t('privacy.showChallengesDesc')}
            value={settings.showChallengesPublic}
            onToggle={handleToggle('showChallengesPublic')}
            accent={ACCENT.teal}
            isLast
            theme={theme}
          />
        </View>

        <SectionLabel theme={theme}>{t('privacy.invitesSection')}</SectionLabel>

        <View
          style={[
            s.section,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <SettingCard
            icon="git-branch-outline"
            title={t('privacy.familyInvites')}
            desc={t('privacy.familyInvitesDesc')}
            value={settings.allowFamilyInvites}
            onToggle={handleToggle('allowFamilyInvites')}
            accent={ACCENT.violet}
            theme={theme}
          />

          <SettingCard
            icon="flag-outline"
            title={t('privacy.challengeInvites')}
            desc={t('privacy.challengeInvitesDesc')}
            value={settings.allowChallengeInvites}
            onToggle={handleToggle('allowChallengeInvites')}
            accent={ACCENT.coral}
            isLast
            theme={theme}
          />
        </View>

        {anyInviteOff && (
          <View
            style={[
              s.warnCard,
              {
                backgroundColor: ACCENT.coral.soft,
                borderColor: ACCENT.coral.color + '33',
              },
            ]}
          >
            <View style={s.warnIconBox}>
              <Ionicons name="alert-circle-outline" size={18} color={ACCENT.coral.color} />
            </View>

            <Text style={[s.warnText, { color: ACCENT.coral.color }]}>
              {t('privacy.invitesOffWarning')}
            </Text>
          </View>
        )}

        <SectionLabel theme={theme}>{t('privacy.visibilityLevels')}</SectionLabel>

        <View
          style={[
            s.section,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={s.visGuide}>
            <VisibilityBadge
              icon="globe-outline"
              label={t('privacy.public')}
              desc={t('privacy.publicDesc')}
              accent={ACCENT.teal}
              theme={theme}
            />

            <View style={[s.vDivider, { backgroundColor: theme.border }]} />

            <VisibilityBadge
              icon="lock-closed-outline"
              label={t('privacy.protectedVisibility')}
              desc={t('privacy.protectedVisibilityDesc')}
              accent={ACCENT.amber}
              theme={theme}
            />

            <View style={[s.vDivider, { backgroundColor: theme.border }]} />

            <VisibilityBadge
              icon="eye-off-outline"
              label={t('privacy.secret')}
              desc={t('privacy.secretDesc')}
              accent={ACCENT.coral}
              theme={theme}
            />
          </View>
        </View>

        {hasChanges && (
          <TouchableOpacity
            style={[
              s.saveBtn,
              { backgroundColor: theme.primary, shadowColor: theme.primary },
              isSaving && s.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={s.saveBtnTxt}>{t('privacy.saveChanges')}</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={s.footerRow}>
          <Ionicons name="lock-closed" size={12} color={theme.textSecondary} />
          <Text style={[s.footerTxt, { color: theme.textSecondary }]}>
            {t('privacy.footer')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 48 },

  saveHeaderBtn: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  saveHeaderTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },

  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  heroSub: { fontSize: 12, lineHeight: 16 },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroDot: { width: 6, height: 6, borderRadius: 3 },
  heroPillTxt: { fontSize: 12, fontWeight: '600' },

  section: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },

  warnCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
  },
  warnIconBox: { marginTop: 1 },
  warnText: { flex: 1, fontSize: 13, lineHeight: 18 },

  visGuide: { padding: 16, gap: 0 },
  vDivider: { height: 1, marginVertical: 10, marginLeft: 44 },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  footerTxt: { fontSize: 12, textAlign: 'center', lineHeight: 17, opacity: 0.6 },
});