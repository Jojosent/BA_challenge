import { LoadingSpinner } from '@components/shared/LoadingSpinner';
import { Button } from '@components/ui/Button';
import { Colors } from '@constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '@hooks/useProfile';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { betService } from '../../../src/services/betService';

export default function BetDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { displayUser } = useProfile();
  const [bet, setBet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  const fetchBetDetails = async () => {
    try {
      setIsLoading(true);
      const data = await betService.getBetDetails(Number(id));
      setBet(data);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные спора');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBetDetails();
  }, [id]);

  const handleJoin = async () => {
    Alert.alert(
      'Вступить в спор',
      `С вашего баланса будет списано ${bet.betAmount} Rikon. Продолжить?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Вступить',
          onPress: async () => {
            try {
              setIsJoining(true);
              await betService.joinBet(bet.id);
              fetchBetDetails();
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось вступить в спор');
            } finally {
              setIsJoining(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading || !bet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  const isParticipant = bet.participants?.some((p: any) => p.userId === displayUser?.id);
  const isCreator = bet.creatorId === displayUser?.id;
  const isFull = bet.participants?.length >= 2;
  const totalPool = bet.betAmount * bet.participants?.length;
  const task = bet.tasks?.[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Спор 1 на 1</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.infoCard}>
          <Text style={styles.title}>{bet.title}</Text>
          <Text style={styles.description}>{bet.description}</Text>

          <View style={styles.poolContainer}>
            <Text style={styles.poolLabel}>Призовой фонд</Text>
            <Text style={styles.poolValue}>{totalPool} Rikon</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Участники</Text>
        
        {bet.participants?.map((p: any) => (
          <View key={p.id} style={styles.participantCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {p.user.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.participantName}>{p.user.username}</Text>
              <Text style={styles.participantRating}>Рейтинг: {p.user.rating}</Text>
            </View>
            {p.userId === bet.creatorId && (
              <View style={styles.creatorBadge}>
                <Text style={styles.creatorBadgeText}>Создатель</Text>
              </View>
            )}
          </View>
        ))}

        {!isFull && (
          <View style={styles.waitingCard}>
            <Ionicons name="time-outline" size={32} color={Colors.textSecondary} />
            <Text style={styles.waitingText}>Ожидание второго участника...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {!isParticipant && !isFull && !isCreator && (
          <Button
            title={`Принять вызов (${bet.betAmount} Rikon)`}
            onPress={handleJoin}
            isLoading={isJoining}
          />
        )}
        
        {isParticipant && task && (
          <Button
            title="Загрузить доказательство"
            onPress={() => router.push(`/challenge/task/${task.id}`)}
          />
        )}
      </View>
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
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  poolContainer: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  poolLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  poolValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.rikon,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  participantRating: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  creatorBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  creatorBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  waitingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    marginTop: 8,
  },
  waitingText: {
    color: Colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
});
