import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from './ThemeContext';
import { THEME_ORDER, THEMES, ThemeKey } from './themes';

interface ThemePickerProps {
  visible: boolean;
  onClose: () => void;
}

const PREVIEW_SWATCHES: Record<ThemeKey, string[]> = {
  violet:   ['#7C5CFC', '#A78BFA', '#EDE9FF'],
  midnight: ['#4F8EF7', '#818CF8', '#1A1D27'],
  forest:   ['#16A34A', '#34D399', '#F0FBF4'],
  rose:     ['#F43F5E', '#FB7185', '#FFF0F3'],
};

export function ThemePicker({ visible, onClose }: ThemePickerProps) {
  const { themeKey, setTheme, theme: D } = useTheme();

  const handleSelect = (key: ThemeKey) => {
    setTheme(key);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={[s.sheet, { backgroundColor: D.surface }]} onPress={() => {}}>
          <View style={[s.handle, { backgroundColor: D.border }]} />

          <Text style={[s.title, { color: D.textPrimary }]}>Тақырып</Text>
          <Text style={[s.subtitle, { color: D.textMuted }]}>
            Қолданбаның түсін таңдаңыз
          </Text>

          <View style={s.grid}>
            {THEME_ORDER.map((key) => {
              const t = THEMES[key];
              const swatches = PREVIEW_SWATCHES[key];
              const isSelected = themeKey === key;

              return (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.8}
                  style={[
                    s.card,
                    {
                      backgroundColor: D.surface,
                      borderColor: isSelected ? t.primary : D.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleSelect(key)}
                >
                  <View style={[s.preview, { backgroundColor: t.bg }]}>
                    <View style={s.swatchRow}>
                      {swatches.map((color, i) => (
                        <View
                          key={i}
                          style={[
                            s.swatch,
                            { backgroundColor: color },
                            i === 0 && s.swatchLarge,
                          ]}
                        />
                      ))}
                    </View>
                    <View style={[s.mockBar, { backgroundColor: t.surface, borderColor: t.border }]}>
                      <View style={[s.mockDot, { backgroundColor: t.primary }]} />
                      <View style={[s.mockLine, { backgroundColor: t.primary }]} />
                      <View style={[s.mockLineShort, { backgroundColor: t.primary }]} />
                    </View>
                  </View>

                  <View style={s.labelRow}>
                    <View>
                      <Text style={[s.cardName, { color: D.textPrimary }]}>{t.name}</Text>
                      <Text style={[s.cardLabel, { color: D.textMuted }]}>{t.label}</Text>
                    </View>
                    {isSelected && (
                      <View style={[s.checkBox, { backgroundColor: t.primary }]}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[s.closeBtn, { backgroundColor: D.surfaceAlt, borderColor: D.border }]}
            onPress={onClose}
          >
            <Text style={[s.closeTxt, { color: D.textSecondary }]}>Жабу</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  title:    { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 20 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    width: '47%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  preview: {
    height: 80, padding: 10,
    justifyContent: 'space-between',
  },
  swatchRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch:     { width: 14, height: 14, borderRadius: 7 },
  swatchLarge:{ width: 20, height: 20, borderRadius: 10 },
  mockBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: 6, borderRadius: 8, borderWidth: 1,
  },
  mockDot:      { width: 10, height: 10, borderRadius: 5 },
  mockLine:     { height: 4, flex: 1, borderRadius: 2, opacity: 0.5 },
  mockLineShort:{ height: 4, width: 24, borderRadius: 2, opacity: 0.3 },

  labelRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10, paddingTop: 8,
  },
  cardName:  { fontSize: 13, fontWeight: '700' },
  cardLabel: { fontSize: 11, marginTop: 1 },
  checkBox: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtn: {
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1,
  },
  closeTxt: { fontSize: 15, fontWeight: '700' },
});