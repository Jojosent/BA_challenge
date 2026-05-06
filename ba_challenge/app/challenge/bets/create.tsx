import { Button } from '@components/ui/Button';
import { Colors } from '@constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { betService } from '../../../src/services/betService';

export default function CreateBetScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [days, setDays] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !description.trim() || !betAmount) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    const amount = Number(betAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Ошибка', 'Введите корректную сумму');
      return;
    }

    try {
      setIsLoading(true);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const bet = await betService.createBet({
        title,
        description,
        betAmount: amount,
        endDate: endDate.toISOString(),
      });

      router.replace(`/challenge/bets/${bet.id}`);
    } catch (error: any) {
      Alert.alert('Ошибка', 'Не удалось создать спор. Проверьте баланс.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Бросить вызов</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Название спора</Text>
            <TextInput
              style={styles.input}
              placeholder="Например: Кто больше отожмется"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Условия спора</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Опишите правила и что нужно снять на видео"
              placeholderTextColor={Colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ставка (Rikon)</Text>
            <TextInput
              style={styles.input}
              placeholder="Сумма"
              placeholderTextColor={Colors.textMuted}
              value={betAmount}
              onChangeText={setBetAmount}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Срок на выполнение</Text>
            <View style={styles.daysContainer}>
              {[1, 3, 7].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayBtn, days === d && styles.dayBtnActive]}
                  onPress={() => setDays(d)}
                >
                  <Text style={[styles.dayText, days === d && styles.dayTextActive]}>
                    {d} {d === 1 ? 'день' : d === 3 ? 'дня' : 'дней'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Создать спор"
            onPress={handleCreate}
            isLoading={isLoading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scroll: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  textArea: {
    height: 120,
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dayBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
  },
  dayBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dayTextActive: {
    color: Colors.white,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
