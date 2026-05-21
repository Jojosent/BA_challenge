import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { privacyService } from '@services/privacyService';
import { useTheme } from '@/theme/ThemeContext';

interface ProtectedChallengeGateProps {
  challengeId: number;
  challengeTitle: string;
  onGranted: () => void;
}

export const ProtectedChallengeGate: React.FC<ProtectedChallengeGateProps> = ({
  challengeId,
  challengeTitle,
  onGranted,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!password.trim()) {
      setError(t('protectedChallengeGate.enterPasswordError'));
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const result = await privacyService.verifyAccess(challengeId, password);

      if (result.granted) {
        onGranted();
      } else {
        setError(t('protectedChallengeGate.wrongPassword'));
        setPassword('');
      }
    } catch {
      setError(t('protectedChallengeGate.verifyError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.amber + '40' }]}>
        <View style={[styles.lockWrapper, { backgroundColor: theme.amber + '18', borderColor: theme.amber + '40' }]}>
          <Ionicons name="lock-closed" size={34} color={theme.amber} />
        </View>

        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {t('protectedChallengeGate.title')}
        </Text>

        <Text style={[styles.challengeName, { color: theme.amber }]} numberOfLines={2}>
          {challengeTitle}
        </Text>

        <Text style={[styles.desc, { color: theme.textSecondary }]}>
          {t('protectedChallengeGate.description')}
        </Text>

        <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: theme.border }, error ? { borderColor: theme.rose } : null]}>
          <Ionicons name="key-outline" size={18} color={theme.textMuted} />

          <TextInput
            style={[styles.input, { color: theme.textPrimary }]}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError('');
            }}
            placeholder={t('protectedChallengeGate.passwordPlaceholder')}
            placeholderTextColor={theme.textMuted}
            secureTextEntry={!showPass}
            autoCapitalize="none"
            onSubmitEditing={handleVerify}
          />

          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Ionicons
              name={showPass ? 'eye-off' : 'eye'}
              size={18}
              color={theme.textMuted}
            />
          </TouchableOpacity>
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: theme.rose }]}>
            {t('protectedChallengeGate.errorPrefix')} {error}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[styles.btn, (isLoading || !password.trim()) && styles.btnDisabled, { backgroundColor: theme.primary }]}
          onPress={handleVerify}
          disabled={isLoading || !password.trim()}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="lock-open-outline" size={18} color="#ffffff" />
              <Text style={styles.btnTxt}>
                {t('protectedChallengeGate.enter')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.hint, { color: theme.textMuted }]}>
          {t('protectedChallengeGate.hint')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  card: {
    borderRadius: 20,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
  },

  lockWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },

  challengeName: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },

  desc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
    width: '100%',
    marginBottom: 8,
  },

  inputRowError: {
  },

  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
  },

  errorText: {
    fontSize: 12,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    marginTop: 4,
    marginBottom: 12,
  },

  btnDisabled: {
    opacity: 0.4,
  },

  btnTxt: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },

  hint: {
    fontSize: 11,
    textAlign: 'center',
  },
});