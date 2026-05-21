export type ThemeKey = 'violet' | 'midnight' | 'forest' | 'rose';

export interface ThemeTokens {
  key: ThemeKey;
  name: string;
  label: string;
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderLight: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  emerald: string;
  emeraldLight: string;
  amber: string;
  amberLight: string;
  rose: string;
  roseLight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  white: string;
  avatarRing: string;
  warning: string;
  warningLight: string;
  roseError: string;
  roseErrorBg: string;
}

export const THEMES: Record<ThemeKey, ThemeTokens> = {
  violet: {
    key: 'violet', name: 'Violet', label: 'Фиолетовый',
    bg: '#F8FAFF', surface: '#FFFFFF', surfaceAlt: '#F0EDFF',
    border: '#E4DFFF', borderLight: '#F0EDFF',
    primary: '#7C5CFC', primaryLight: '#EDE9FF', primaryDark: '#5B3FD4',
    accent: '#A78BFA', accentLight: '#EDE9FF',
    emerald: '#10B981', emeraldLight: '#D1FAE5',
    amber: '#F59E0B', amberLight: '#FEF3C7',
    rose: '#F43F5E', roseLight: '#FFE4E6',
    textPrimary: '#1A1040', textSecondary: '#6B7280', textMuted: '#A0A8BF',
    white: '#FFFFFF', avatarRing: '#7C5CFC',
    warning: '#F59E0B', warningLight: '#FEF3C7',
    roseError: '#F43F5E', roseErrorBg: '#FFF1F2',
  },
  midnight: {
    key: 'midnight', name: 'Midnight', label: 'Полночь',
    bg: '#0F1117', surface: '#1A1D27', surfaceAlt: '#22263A',
    border: '#2E334D', borderLight: '#252940',
    primary: '#4F8EF7', primaryLight: '#1C2E4A', primaryDark: '#2563EB',
    accent: '#818CF8', accentLight: '#1E2040',
    emerald: '#34D399', emeraldLight: '#064E3B',
    amber: '#FBBF24', amberLight: '#451A03',
    rose: '#FB7185', roseLight: '#4C0519',
    textPrimary: '#F1F5F9', textSecondary: '#94A3B8', textMuted: '#64748B',
    white: '#FFFFFF', avatarRing: '#4F8EF7',
    warning: '#FBBF24', warningLight: '#451A03',
    roseError: '#FB7185', roseErrorBg: '#2D0A14',
  },
  forest: {
    key: 'forest', name: 'Forest', label: 'Лесной',
    bg: '#F0FBF4', surface: '#FFFFFF', surfaceAlt: '#E8F7EE',
    border: '#C6EACF', borderLight: '#E8F7EE',
    primary: '#16A34A', primaryLight: '#DCFCE7', primaryDark: '#15803D',
    accent: '#34D399', accentLight: '#D1FAE5',
    emerald: '#059669', emeraldLight: '#D1FAE5',
    amber: '#D97706', amberLight: '#FEF3C7',
    rose: '#E11D48', roseLight: '#FFE4E6',
    textPrimary: '#0A2614', textSecondary: '#4B5563', textMuted: '#86A893',
    white: '#FFFFFF', avatarRing: '#16A34A',
    warning: '#D97706', warningLight: '#FEF3C7',
    roseError: '#E11D48', roseErrorBg: '#FFF1F2',
  },
  rose: {
    key: 'rose', name: 'Rose', label: 'Розовый',
    bg: '#FFF0F3', surface: '#FFFFFF', surfaceAlt: '#FFE4E8',
    border: '#FCCDD4', borderLight: '#FFE4E8',
    primary: '#F43F5E', primaryLight: '#FFE4E8', primaryDark: '#BE123C',
    accent: '#FB7185', accentLight: '#FFE4E8',
    emerald: '#10B981', emeraldLight: '#D1FAE5',
    amber: '#F59E0B', amberLight: '#FEF3C7',
    rose: '#E11D48', roseLight: '#FFE4E6',
    textPrimary: '#2D0A14', textSecondary: '#6B7280', textMuted: '#C08090',
    white: '#FFFFFF', avatarRing: '#F43F5E',
    warning: '#F59E0B', warningLight: '#FEF3C7',
    roseError: '#E11D48', roseErrorBg: '#FFF1F2',
  },
};

export const THEME_ORDER: ThemeKey[] = ['violet', 'midnight', 'forest', 'rose'];