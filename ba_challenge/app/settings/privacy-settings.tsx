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

const T = {
  violet: '#6C5CE7',
  violetMid: '#8B7CF6',
  violetSoft: '#EDE9FE',
  teal: '#00B894',
  tealSoft: '#D4F5EE',
  coral: '#E17055',
  coralSoft: '#FDE8E4',
  amber: '#FDCB6E',
  amberSoft: '#FEF5DC',
  surface: '#FFFFFF',
  bg: '#F8FAFF',
  border: '#E5E3EF',
  text: '#1A1730',
  textSub: '#6B6585',
  textMuted: '#A09CB8',
};

interface SettingCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  accent: string;
  accentSoft: string;
  isLast?: boolean;
}

const SettingCard: React.FC<SettingCardProps> = ({
  icon,
  title,
  desc,
  value,
  onToggle,
  accent,
  accentSoft,
  isLast,
}) => (
  <View style={[card.wrap, !isLast && card.separator]}>
    <View style={[card.iconBox, { backgroundColor: accentSoft }]}>
      <Ionicons name={icon} size={18} color={accent} />
    </View>

    <View style={card.texts}>
      <Text style={card.title}>{title}</Text>
      <Text style={card.desc}>{desc}</Text>
    </View>

    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: T.border, true: accent + 'AA' }}
      thumbColor={value ? accent : '#C4BEDD'}
      ios_backgroundColor={T.border}
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
    backgroundColor: T.surface,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  texts: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: T.text, marginBottom: 3 },
  desc: { fontSize: 12, color: T.textSub, lineHeight: 17 },
});

interface VisibilityBadgeProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
  color: string;
  soft: string;
}

const VisibilityBadge: React.FC<VisibilityBadgeProps> = ({
  icon,
  label,
  desc,
  color,
  soft,
}) => (
  <View style={badge.wrap}>
    <View style={[badge.dot, { backgroundColor: color }]} />

    <View style={[badge.iconBox, { backgroundColor: soft }]}>
      <Ionicons name={icon} size={15} color={color} />
    </View>

    <View style={badge.texts}>
      <Text style={[badge.label, { color }]}>{label}</Text>
      <Text style={badge.desc}>{desc}</Text>
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
  desc: { fontSize: 12, color: T.textSub, lineHeight: 16 },
});

const SectionLabel = ({ children }: { children: string }) => (
  <Text style={sec.label}>{children}</Text>
);

const sec = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: T.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 2,
  },
});

export default function PrivacySettingsScreen() {
  const { t } = useTranslation();

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
      <SafeAreaView style={s.container} edges={['top']}>
        <Header title={t('privacy.title')} showBack />
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={T.violet} />
        </View>
      </SafeAreaView>
    );
  }

  const anyInviteOff =
    !settings.allowFamilyInvites || !settings.allowChallengeInvites;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <Header
        title={t('privacy.title')}
        showBack
        rightElement={
          hasChanges ? (
            <TouchableOpacity
              style={s.saveHeaderBtn}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={T.surface} />
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
        <View style={s.heroBanner}>
          <View style={s.heroLeft}>
            <View style={s.heroIconBox}>
              <Ionicons name="shield-checkmark" size={24} color={T.violet} />
            </View>

            <View>
              <Text style={s.heroTitle}>{t('privacy.heroTitle')}</Text>
              <Text style={s.heroSub}>{t('privacy.heroSub')}</Text>
            </View>
          </View>

          <View style={s.heroPill}>
            <View style={[s.heroDot, { backgroundColor: T.teal }]} />
            <Text style={s.heroPillTxt}>{t('privacy.protected')}</Text>
          </View>
        </View>

        <SectionLabel>{t('privacy.profileSection')}</SectionLabel>

        <View style={s.section}>
          <SettingCard
            icon="trophy-outline"
            title={t('privacy.showChallenges')}
            desc={t('privacy.showChallengesDesc')}
            value={settings.showChallengesPublic}
            onToggle={handleToggle('showChallengesPublic')}
            accent={T.teal}
            accentSoft={T.tealSoft}
            isLast
          />
        </View>

        <SectionLabel>{t('privacy.invitesSection')}</SectionLabel>

        <View style={s.section}>
          <SettingCard
            icon="git-branch-outline"
            title={t('privacy.familyInvites')}
            desc={t('privacy.familyInvitesDesc')}
            value={settings.allowFamilyInvites}
            onToggle={handleToggle('allowFamilyInvites')}
            accent={T.violet}
            accentSoft={T.violetSoft}
          />

          <SettingCard
            icon="flag-outline"
            title={t('privacy.challengeInvites')}
            desc={t('privacy.challengeInvitesDesc')}
            value={settings.allowChallengeInvites}
            onToggle={handleToggle('allowChallengeInvites')}
            accent={T.coral}
            accentSoft={T.coralSoft}
            isLast
          />
        </View>

        {anyInviteOff && (
          <View style={s.warnCard}>
            <View style={s.warnIconBox}>
              <Ionicons name="alert-circle-outline" size={18} color={T.coral} />
            </View>

            <Text style={s.warnText}>{t('privacy.invitesOffWarning')}</Text>
          </View>
        )}

        <SectionLabel>{t('privacy.visibilityLevels')}</SectionLabel>

        <View style={s.section}>
          <View style={s.visGuide}>
            <VisibilityBadge
              icon="globe-outline"
              label={t('privacy.public')}
              desc={t('privacy.publicDesc')}
              color={T.teal}
              soft={T.tealSoft}
            />

            <View style={s.vDivider} />

            <VisibilityBadge
              icon="lock-closed-outline"
              label={t('privacy.protectedVisibility')}
              desc={t('privacy.protectedVisibilityDesc')}
              color={T.amber}
              soft={T.amberSoft}
            />

            <View style={s.vDivider} />

            <VisibilityBadge
              icon="eye-off-outline"
              label={t('privacy.secret')}
              desc={t('privacy.secretDesc')}
              color={T.coral}
              soft={T.coralSoft}
            />
          </View>
        </View>

        {hasChanges && (
          <TouchableOpacity
            style={[s.saveBtn, isSaving && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={T.surface} />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={T.surface}
                />
                <Text style={s.saveBtnTxt}>{t('privacy.saveChanges')}</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={s.footerRow}>
          <Ionicons name="lock-closed" size={12} color={T.textMuted} />
          <Text style={s.footerTxt}>{t('privacy.footer')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 48 },

  saveHeaderBtn: {
    backgroundColor: T.violet,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  saveHeaderTxt: { color: T.surface, fontWeight: '700', fontSize: 13 },

  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: T.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: T.border,
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: T.violetSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: { fontSize: 14, fontWeight: '700', color: T.text, marginBottom: 2 },
  heroSub: { fontSize: 12, color: T.textSub, lineHeight: 16 },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: T.tealSoft,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroDot: { width: 6, height: 6, borderRadius: 3 },
  heroPillTxt: { fontSize: 12, fontWeight: '600', color: T.teal },

  section: {
    backgroundColor: T.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
    marginBottom: 24,
  },

  warnCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: T.coralSoft,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: T.coral + '33',
  },
  warnIconBox: { marginTop: 1 },
  warnText: { flex: 1, fontSize: 13, color: T.coral, lineHeight: 18 },

  visGuide: { padding: 16, gap: 0 },
  vDivider: { height: 1, backgroundColor: T.border, marginVertical: 10, marginLeft: 44 },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: T.violet,
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 20,
    shadowColor: T.violet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnTxt: { color: T.surface, fontWeight: '700', fontSize: 15 },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  footerTxt: { fontSize: 12, color: T.textMuted, textAlign: 'center', lineHeight: 17 },
});