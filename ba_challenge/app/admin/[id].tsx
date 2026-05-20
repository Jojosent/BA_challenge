import { LoadingSpinner } from '@components/shared/LoadingSpinner';
import { Config } from '@constants/config';
import { Colors } from '@constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminService } from '../../src/services/adminService';
import { useTheme } from '@/theme/ThemeContext';

export default function AdminChallengeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const result = await adminService.getChallengeDetail(Number(id));
      setData(result);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить детали');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const getAvatarUrl = (url?: string | null) => {
    if (!url) return null;
    const baseUrl = Config.API_URL.split('/api')[0];
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const handleDelete = () => {
    Alert.alert('Удаление', 'Удалить челлендж и вернуть коины участникам?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.deleteChallenge(Number(id));
            router.back();
          } catch (e) {
            Alert.alert('Ошибка', 'Не удалось удалить');
          }
        },
      },
    ]);
  };

  const handleComplete = () => {
    Alert.alert('Завершение', 'Принудительно завершить челлендж?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Завершить',
        style: 'default',
        onPress: async () => {
          try {
            await adminService.completeChallenge(Number(id));
            fetchData();
          } catch (e) {
            Alert.alert('Ошибка', 'Не удалось завершить');
          }
        },
      },
    ]);
  };

  if (isLoading || !data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  const isCompleted = data.status === 'completed';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Челлендж: #{data.id}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{data.title}</Text>
            <Text style={[styles.status, { color: theme.amber }, isCompleted && { color: theme.emerald }]}>
              {data.status}
            </Text>
          </View>
          <Text style={[styles.description, { color: theme.textSecondary }]}>{data.description}</Text>
          
          <View style={[styles.infoGrid, { borderTopColor: theme.border }]}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Приватность</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{data.visibility}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Создатель</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{data.creator?.username}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Участники ({data.participants?.length || 0})</Text>
        {data.participants?.map((p: any) => (
          <View key={p.id} style={[styles.participantCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.participantInfo}>
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                {p.user.avatarUrl ? (
                  <Image 
                    source={{ uri: getAvatarUrl(p.user.avatarUrl)! }} 
                    style={{ width: '100%', height: '100%', borderRadius: 20 }} 
                  />
                ) : (
                  <Text style={[styles.avatarText, { color: '#ffffff' }]}>{p.user.username.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <View>
                <Text style={[styles.participantName, { color: theme.textPrimary }]}>{p.user.username}</Text>
                <Text style={[styles.participantScore, { color: theme.textSecondary }]}>Рейтинг: {p.user.rating}</Text>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.actionsContainer}>
          {!isCompleted && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primary }]} onPress={handleComplete}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
              <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>Завершить принудительно</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.rose }]} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#ffffff" />
            <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>Удалить и вернуть средства</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  scrollContent: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, flex: 1, marginRight: 10 },
  status: { fontSize: 12, color: Colors.warning, fontWeight: '700', textTransform: 'uppercase' },
  statusCompleted: { color: Colors.success },
  description: { fontSize: 15, color: Colors.textSecondary, marginBottom: 20, lineHeight: 22 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  infoItem: { width: '45%' },
  infoLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  infoValue: { fontSize: 15, color: Colors.textPrimary, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  participantInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  participantName: { fontSize: 16, color: Colors.textPrimary, fontWeight: '600', marginBottom: 2 },
  participantScore: { fontSize: 13, color: Colors.textSecondary },
  
  actionsContainer: { marginTop: 24, gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 10 },
  completeBtn: { backgroundColor: Colors.primary },
  deleteBtn: { backgroundColor: Colors.error },
  actionBtnText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});
