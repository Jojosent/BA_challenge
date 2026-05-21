import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@hooks/useAuth';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { z } from 'zod';
import { useTheme } from '@/theme/ThemeContext';
import { ThemePicker } from '@/theme/ThemePicker';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { register, isLoading, error } = useAuth();
  const { theme } = useTheme();
  const [showThemePicker, setShowThemePicker] = useState(false);

  const registerSchema = z.object({
    username: z.string().min(3, t('auth.minUsername')),
    email: z.string().email(t('auth.invalidEmail')),
    password: z.string().min(6, t('auth.minPassword')),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth.passwordsMismatch'),
    path: ['confirmPassword'],
  });

  type RegisterForm = z.infer<typeof registerSchema>;

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterForm) => {
    register(data.username, data.email, data.password);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={[
              styles.themeBtn,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            onPress={() => setShowThemePicker(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="color-palette-outline" size={22} color={theme.primary} />
          </TouchableOpacity>

          <Text style={[styles.logo, { color: theme.primary }]}>BA Challenge</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{t('auth.createAccount')}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('auth.registerSubtitle')}</Text>
        </View>

        <View style={styles.form}>
          {error && (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: theme.key === 'midnight' ? '#3B1820' : '#FFF1F2',
                  borderColor: theme.key === 'midnight' ? '#5E1B2A' : '#FECDD3',
                },
              ]}
            >
              <Text style={[styles.errorBoxText, { color: theme.rose }]}>{error}</Text>
            </View>
          )}

          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('auth.username')}
                placeholder="cooluser123"
                onChangeText={onChange}
                value={value}
                error={errors.username?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('auth.email')}
                placeholder="example@mail.com"
                onChangeText={onChange}
                value={value}
                keyboardType="email-address"
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('auth.password')}
                placeholder="••••••••"
                onChangeText={onChange}
                value={value}
                isPassword
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('auth.confirmPassword')}
                placeholder="••••••••"
                onChangeText={onChange}
                value={value}
                isPassword
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Button
            title={t('auth.register')}
            onPress={handleSubmit(onSubmit)}
            isLoading={isLoading}
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>{t('auth.haveAccount')}</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.link, { color: theme.primary }]}>{t('auth.login')}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>

      <ThemePicker
        visible={showThemePicker}
        onClose={() => setShowThemePicker(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40, position: 'relative', width: '100%' },
  themeBtn: {
    position: 'absolute',
    top: -20,
    right: 0,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  logo: {
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  form: { width: '100%' },
  errorBox: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  errorBoxText: { fontSize: 14 },
  button: { marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 15 },
  link: { fontSize: 15, fontWeight: '600' },
});