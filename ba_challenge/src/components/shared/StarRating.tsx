// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Switch,
//   Alert,
//   ActivityIndicator,
//   TextInput,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { Colors } from '@constants/colors';
// import { voteService } from '@services/voteService';

// interface VoteEntry {
//   id: number;
//   score: number;
//   comment?: string | null;
//   isAnonymous: boolean;
//   isMyVote: boolean;
//   voter: {
//     id: number | null;
//     username: string;
//     avatarUrl?: string;
//   };
// }

// interface StarRatingProps {
//   submissionId: number;
//   onVoted: (newScore: number) => void;
// }

// export const StarRating: React.FC<StarRatingProps> = ({
//   submissionId,
//   onVoted,
// }) => {
//   const [votes, setVotes]           = useState<VoteEntry[]>([]);
//   const [myVote, setMyVote]         = useState<number | null>(null);
//   const [myComment, setMyComment]   = useState<string | null>(null);
//   const [avgScore, setAvgScore]     = useState(0);
//   const [totalVotes, setTotalVotes] = useState(0);

//   // ✅ selectedStars — только предварительный выбор, не отправка
//   const [selectedStars, setSelectedStars] = useState(0);
//   const [hovered, setHovered]             = useState(0);
//   const [comment, setComment]             = useState('');
//   const [anonymous, setAnonymous]         = useState(false);
//   const [isLoading, setIsLoading]         = useState(false);
//   const [isFetching, setIsFetching]       = useState(true);
//   const [showVotes, setShowVotes]         = useState(false);

//   useEffect(() => { fetchVotes(); }, [submissionId]);

//   const fetchVotes = async () => {
//     try {
//       setIsFetching(true);
//       const data = await voteService.getVotesBySubmission(submissionId);
//       setVotes(data.votes);
//       setMyVote(data.myVote);
//       setMyComment(data.myComment ?? null);
//       setAvgScore(data.avgScore);
//       setTotalVotes(data.totalVotes);
//     } catch (e) {
//       console.log('Ошибка загрузки голосов:', e);
//     } finally {
//       setIsFetching(false);
//     }
//   };

//   // ✅ Отдельная функция отправки — вызывается только по кнопке
//   const handleSubmitVote = async () => {
//     if (selectedStars === 0) {
//       Alert.alert('', 'Выбери количество звёзд');
//       return;
//     }
//     if (myVote !== null) {
//       Alert.alert('Уже проголосовал', `Ты уже поставил ${myVote} ⭐`);
//       return;
//     }

//     try {
//       setIsLoading(true);
//       const result = await voteService.vote(
//         submissionId,
//         selectedStars,
//         anonymous,
//         comment
//       );
//       setMyVote(selectedStars);
//       setMyComment(comment.trim() || null);
//       setAvgScore(result.newScore);
//       setTotalVotes((prev) => prev + 1);
//       onVoted(result.newScore);
//       setComment('');
//       setSelectedStars(0);
//       Alert.alert('⭐ Голос принят!', `Ты поставил ${selectedStars} из 5`);
//       await fetchVotes();
//     } catch (e: any) {
//       if (e.response?.data?.alreadyVoted) {
//         setMyVote(e.response.data.myScore);
//         setMyComment(e.response.data.myComment ?? null);
//         Alert.alert('', 'Ты уже голосовал за это доказательство');
//       } else {
//         Alert.alert('Ошибка', e.message);
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (isFetching) {
//     return (
//       <View style={styles.loading}>
//         <ActivityIndicator size="small" color={Colors.primary} />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>

//       {/* Средняя оценка */}
//       <View style={styles.summary}>
//         <View style={styles.avgRow}>
//           {[1, 2, 3, 4, 5].map((s) => (
//             <Ionicons
//               key={s}
//               name={s <= Math.round(avgScore) ? 'star' : 'star-outline'}
//               size={16}
//               color={Colors.rikon}
//             />
//           ))}
//           <Text style={styles.avgNum}>
//             {avgScore > 0 ? avgScore.toFixed(2) : '—'}
//           </Text>
//           <Text style={styles.voteCount}>({totalVotes} голосов)</Text>
//         </View>
//       </View>

//       {/* Уже голосовал */}
//       {myVote !== null ? (
//         <View style={styles.alreadyVoted}>
//           <View style={styles.alreadyTop}>
//             <Text style={styles.alreadyTxt}>✅ Твоя оценка: </Text>
//             <View style={styles.alreadyStars}>
//               {[1, 2, 3, 4, 5].map((s) => (
//                 <Ionicons
//                   key={s}
//                   name={s <= myVote ? 'star' : 'star-outline'}
//                   size={16}
//                   color={Colors.rikon}
//                 />
//               ))}
//             </View>
//             <Text style={styles.alreadyScore}>{myVote}</Text>
//           </View>
//           {myComment ? (
//             <Text style={styles.alreadyComment}>💬 {myComment}</Text>
//           ) : (
//             <Text style={styles.alreadySub}>Без комментария</Text>
//           )}
//           <Text style={styles.alreadyLocked}>🔒 Изменить нельзя</Text>
//         </View>
//       ) : (
//         // ✅ Форма голосования — звёзды только выбирают, кнопка отправляет
//         <View style={styles.voteForm}>
//           <Text style={styles.label}>Выбери оценку:</Text>

//           {/* Звёзды — только выбор */}
//           <View style={styles.starsRow}>
//             {[1, 2, 3, 4, 5].map((s) => (
//               <TouchableOpacity
//                 key={s}
//                 onPress={() => setSelectedStars(s)}  // ✅ только выбор
//                 onPressIn={() => setHovered(s)}
//                 onPressOut={() => setHovered(0)}
//                 disabled={isLoading}
//                 style={styles.starBtn}
//               >
//                 <Ionicons
//                   name={
//                     s <= (hovered || selectedStars) ? 'star' : 'star-outline'
//                   }
//                   size={34}
//                   color={
//                     s <= (hovered || selectedStars)
//                       ? Colors.rikon
//                       : Colors.textMuted
//                   }
//                 />
//               </TouchableOpacity>
//             ))}
//           </View>

//           {/* Подпись выбранного значения */}
//           {selectedStars > 0 && (
//             <Text style={styles.selectedLabel}>
//               {['', '😕 Плохо', '😐 Нормально', '🙂 Хорошо', '😊 Отлично', '🤩 Супер!'][selectedStars]}
//             </Text>
//           )}

//           {/* Комментарий */}
//           <TextInput
//             style={styles.commentInput}
//             value={comment}
//             onChangeText={setComment}
//             placeholder="Оставь комментарий (необязательно)..."
//             placeholderTextColor={Colors.textMuted}
//             multiline
//             maxLength={300}
//           />
//           {comment.length > 0 && (
//             <Text style={styles.charCount}>{comment.length}/300</Text>
//           )}

//           {/* Анонимность */}
//           <View style={styles.anonRow}>
//             <Text style={styles.anonLabel}>🕵️ Анонимно</Text>
//             <Switch
//               value={anonymous}
//               onValueChange={setAnonymous}
//               trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
//               thumbColor={anonymous ? Colors.primary : Colors.textMuted}
//             />
//           </View>

//           {/* ✅ Кнопка отправки */}
//           <TouchableOpacity
//             style={[
//               styles.submitBtn,
//               (selectedStars === 0 || isLoading) && styles.submitBtnDisabled,
//             ]}
//             onPress={handleSubmitVote}
//             disabled={selectedStars === 0 || isLoading}
//           >
//             {isLoading ? (
//               <ActivityIndicator size="small" color={Colors.white} />
//             ) : (
//               <Text style={styles.submitBtnTxt}>
//                 {selectedStars > 0
//                   ? `Отправить оценку ${selectedStars} ⭐`
//                   : 'Выбери звёзды'}
//               </Text>
//             )}
//           </TouchableOpacity>
//         </View>
//       )}

//       {/* Список голосов */}
//       {totalVotes > 0 && (
//         <TouchableOpacity
//           style={styles.showVotesBtn}
//           onPress={() => setShowVotes(!showVotes)}
//         >
//           <Text style={styles.showVotesTxt}>
//             {showVotes
//               ? '▲ Скрыть голоса'
//               : `▼ Показать все голоса (${totalVotes})`}
//           </Text>
//         </TouchableOpacity>
//       )}

//       {showVotes && (
//         <View style={styles.votesList}>
//           {votes.map((v) => (
//             <View key={v.id} style={[
//               styles.voteRow,
//               v.isMyVote && styles.voteRowMe,
//             ]}>
//               <View style={[
//                 styles.voterAvatar,
//                 v.voter.id === null && styles.voterAvatarAnon,
//               ]}>
//                 <Text style={styles.voterAvatarTxt}>
//                   {v.voter.username.charAt(0).toUpperCase()}
//                 </Text>
//               </View>

//               <View style={styles.voteContent}>
//                 <View style={styles.voteTopRow}>
//                   <Text style={styles.voterName}>{v.voter.username}</Text>
//                   <View style={styles.voteStars}>
//                     {[1, 2, 3, 4, 5].map((s) => (
//                       <Ionicons
//                         key={s}
//                         name={s <= v.score ? 'star' : 'star-outline'}
//                         size={12}
//                         color={Colors.rikon}
//                       />
//                     ))}
//                     <Text style={styles.voteScoreTxt}>{v.score}</Text>
//                   </View>
//                 </View>
//                 {v.comment && (
//                   <Text style={styles.voteComment}>💬 {v.comment}</Text>
//                 )}
//               </View>

//               {v.isMyVote && (
//                 <Text style={styles.myVoteLabel}>ты</Text>
//               )}
//             </View>
//           ))}
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { paddingTop: 8 },
//   loading:   { padding: 16, alignItems: 'center' },

//   summary:   { marginBottom: 12 },
//   avgRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
//   avgNum:    { fontSize: 16, fontWeight: '700', color: Colors.rikon, marginLeft: 4 },
//   voteCount: { fontSize: 12, color: Colors.textMuted },

//   alreadyVoted: {
//     backgroundColor: Colors.accent + '15',
//     borderRadius: 10,
//     padding: 12,
//     marginBottom: 10,
//     borderWidth: 1,
//     borderColor: Colors.accent + '40',
//     gap: 6,
//   },
//   alreadyTop:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
//   alreadyTxt:    { fontSize: 14, color: Colors.accent, fontWeight: '600' },
//   alreadyStars:  { flexDirection: 'row', gap: 2 },
//   alreadyScore:  { fontSize: 14, fontWeight: '700', color: Colors.rikon, marginLeft: 2 },
//   alreadyComment: {
//     fontSize: 13,
//     color: Colors.textSecondary,
//     fontStyle: 'italic',
//     lineHeight: 18,
//   },
//   alreadySub:    { fontSize: 12, color: Colors.textMuted },
//   alreadyLocked: { fontSize: 11, color: Colors.textMuted },

//   voteForm: { marginBottom: 8 },
//   label:    { fontSize: 13, color: Colors.textSecondary, marginBottom: 8, fontWeight: '500' },

//   starsRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
//   starBtn:  { padding: 4 },

//   selectedLabel: {
//     fontSize: 14,
//     color: Colors.textSecondary,
//     marginBottom: 12,
//     textAlign: 'center',
//   },

//   commentInput: {
//     backgroundColor: Colors.card,
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: Colors.border,
//     padding: 12,
//     fontSize: 14,
//     color: Colors.textPrimary,
//     minHeight: 72,
//     textAlignVertical: 'top',
//     marginBottom: 4,
//   },
//   charCount: {
//     fontSize: 11,
//     color: Colors.textMuted,
//     textAlign: 'right',
//     marginBottom: 10,
//   },

//   anonRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: Colors.card,
//     padding: 10,
//     borderRadius: 10,
//     marginBottom: 12,
//   },
//   anonLabel: { fontSize: 13, color: Colors.textSecondary },

//   // ✅ Кнопка отправки
//   submitBtn: {
//     backgroundColor: Colors.primary,
//     borderRadius: 12,
//     paddingVertical: 13,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   submitBtnDisabled: { opacity: 0.45 },
//   submitBtnTxt: {
//     color: Colors.white,
//     fontWeight: '700',
//     fontSize: 15,
//   },

//   showVotesBtn: { paddingVertical: 8, alignItems: 'center', marginTop: 4 },
//   showVotesTxt: { fontSize: 12, color: Colors.primary, fontWeight: '500' },

//   votesList: {
//     backgroundColor: Colors.card,
//     borderRadius: 10,
//     overflow: 'hidden',
//     marginTop: 4,
//   },
//   voteRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     padding: 10,
//     gap: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: Colors.border,
//   },
//   voteRowMe: { backgroundColor: Colors.primary + '10' },

//   voterAvatar: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: Colors.primary,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 2,
//   },
//   voterAvatarAnon: { backgroundColor: Colors.textMuted },
//   voterAvatarTxt:  { color: Colors.white, fontSize: 12, fontWeight: '700' },

//   voteContent:  { flex: 1 },
//   voteTopRow:   {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   voterName:    { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
//   voteStars:    { flexDirection: 'row', alignItems: 'center', gap: 2 },
//   voteScoreTxt: { fontSize: 12, fontWeight: '700', color: Colors.rikon, marginLeft: 2 },
//   voteComment:  {
//     fontSize: 12,
//     color: Colors.textSecondary,
//     fontStyle: 'italic',
//     marginTop: 4,
//     lineHeight: 17,
//   },

//   myVoteLabel: {
//     fontSize: 10,
//     color: Colors.primary,
//     fontWeight: '600',
//     backgroundColor: Colors.primary + '20',
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 6,
//     alignSelf: 'center',
//   },
// });

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { voteService } from '@services/voteService';
import { useTheme } from '@/theme/ThemeContext';

interface VoteEntry {
  id: number;
  score: number;
  comment?: string | null;
  isAnonymous: boolean;
  isMyVote: boolean;
  voter: { id: number | null; username: string; avatarUrl?: string };
}

interface StarRatingProps {
  submissionId: number;
  onVoted: (newScore: number) => void;
}

const STAR_LABELS = ['', '😕 Плохо', '😐 Нормально', '🙂 Хорошо', '😊 Отлично', '🤩 Супер!'];

export const StarRating: React.FC<StarRatingProps> = ({ submissionId, onVoted }) => {
  const [votes, setVotes]             = useState<VoteEntry[]>([]);
  const [myVote, setMyVote]           = useState<number | null>(null);
  const [myVoteId, setMyVoteId]       = useState<number | null>(null);
  const [myComment, setMyComment]     = useState<string | null>(null);
  const [myAnonymous, setMyAnonymous] = useState(false);
  const [avgScore, setAvgScore]       = useState(0);
  const [totalVotes, setTotalVotes]   = useState(0);

  // Форма голосования
  const [selectedStars, setSelectedStars] = useState(0);
  const [hovered, setHovered]             = useState(0);
  const [comment, setComment]             = useState('');
  const [anonymous, setAnonymous]         = useState(false);
  const [isLoading, setIsLoading]         = useState(false);
  const [isFetching, setIsFetching]       = useState(true);
  const [showVotes, setShowVotes]         = useState(false);

  // Режим редактирования
  const [isEditing, setIsEditing]         = useState(false);
  const [editStars, setEditStars]         = useState(0);
  const [editComment, setEditComment]     = useState('');
  const [editAnonymous, setEditAnonymous] = useState(false);
  const [editHovered, setEditHovered]     = useState(0);

  const { theme } = useTheme();

  useEffect(() => { fetchVotes(); }, [submissionId]);

  const fetchVotes = async () => {
    try {
      setIsFetching(true);
      const data = await voteService.getVotesBySubmission(submissionId);
      setVotes(data.votes);
      setMyVote(data.myVote);
      setMyComment(data.myComment ?? null);
      setAvgScore(data.avgScore);
      setTotalVotes(data.totalVotes);

      // Находим свой голос чтобы получить его id
      const mine = data.votes.find((v: VoteEntry) => v.isMyVote);
      if (mine) {
        setMyVoteId(mine.id);
        setMyAnonymous(mine.isAnonymous);
      }
    } catch (e) {
      console.log('Ошибка загрузки голосов:', e);
    } finally {
      setIsFetching(false);
    }
  };

  // Отправка нового голоса
  const handleSubmitVote = async () => {
    if (selectedStars === 0) {
      Alert.alert('', 'Выбери количество звёзд');
      return;
    }
    try {
      setIsLoading(true);
      const result = await voteService.vote(submissionId, selectedStars, anonymous, comment);
      setMyVote(selectedStars);
      setMyComment(comment.trim() || null);
      setAvgScore(result.newScore);
      setTotalVotes((p) => p + 1);
      onVoted(result.newScore);
      setComment('');
      setSelectedStars(0);
      Alert.alert('⭐ Голос принят!', `Ты поставил ${selectedStars} из 5`);
      await fetchVotes();
    } catch (e: any) {
      if (e.response?.data?.alreadyVoted) {
        setMyVote(e.response.data.myScore);
        Alert.alert('', 'Ты уже голосовал');
      } else {
        Alert.alert('Ошибка', e.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Открыть режим редактирования
  const openEdit = () => {
    setEditStars(myVote || 0);
    setEditComment(myComment || '');
    setEditAnonymous(myAnonymous);
    setIsEditing(true);
  };

  // Сохранить изменения
  const handleUpdate = async () => {
    if (!myVoteId || editStars === 0) return;
    try {
      setIsLoading(true);
      const result = await voteService.updateVote(
        myVoteId, editStars, editComment, editAnonymous
      );
      setMyVote(editStars);
      setMyComment(editComment.trim() || null);
      setMyAnonymous(editAnonymous);
      setAvgScore(result.newScore);
      onVoted(result.newScore);
      setIsEditing(false);
      Alert.alert('✅ Обновлено!', 'Твоя оценка изменена');
      await fetchVotes();
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Удалить голос
  const handleDelete = () => {
    Alert.alert(
      'Удалить оценку?',
      'Твоя оценка и комментарий будут удалены',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            if (!myVoteId) return;
            try {
              setIsLoading(true);
              const result = await voteService.deleteVote(myVoteId);
              setMyVote(null);
              setMyVoteId(null);
              setMyComment(null);
              setAvgScore(result.newScore);
              setTotalVotes((p) => Math.max(0, p - 1));
              onVoted(result.newScore);
              setIsEditing(false);
              await fetchVotes();
            } catch (e: any) {
              Alert.alert('Ошибка', e.message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  if (isFetching) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Средняя оценка */}
      <View style={styles.avgRow}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Ionicons
            key={s}
            name={s <= Math.round(avgScore) ? 'star' : 'star-outline'}
            size={16}
            color={theme.amber}
          />
        ))}
        <Text style={[styles.avgNum, { color: theme.amber }]}>
          {avgScore > 0 ? avgScore.toFixed(2) : '—'}
        </Text>
        <Text style={[styles.voteCount, { color: theme.textMuted }]}>({totalVotes} голосов)</Text>
      </View>

      {/* ── Уже голосовал ── */}
      {myVote !== null && !isEditing && (
        <View style={[styles.alreadyBox, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '40' }]}>
          <View style={styles.alreadyHeader}>
            <View style={styles.alreadyLeft}>
              <Text style={[styles.alreadyLabel, { color: theme.textMuted }]}>Твоя оценка:</Text>
              <View style={styles.alreadyStars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={s <= myVote ? 'star' : 'star-outline'}
                    size={16}
                    color={theme.amber}
                  />
                ))}
                <Text style={[styles.alreadyScore, { color: theme.amber }]}>{myVote}</Text>
              </View>
            </View>

            {/* Кнопки редактировать / удалить */}
            <View style={styles.alreadyActions}>
              <TouchableOpacity style={[styles.editBtn, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '40' }]} onPress={openEdit}>
                <Ionicons name="pencil" size={14} color={theme.primary} />
                <Text style={[styles.editBtnTxt, { color: theme.primary }]}>Изменить</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: theme.rose + '18', borderColor: theme.rose + '40' }]} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={14} color={theme.rose} />
              </TouchableOpacity>
            </View>
          </View>

          {myComment ? (
            <Text style={[styles.alreadyComment, { color: theme.textSecondary }]}>💬 {myComment}</Text>
          ) : (
            <Text style={[styles.alreadySub, { color: theme.textMuted }]}>Без комментария</Text>
          )}
          {myAnonymous && (
            <Text style={[styles.anonNote, { color: theme.textMuted }]}>🕵️ Анонимно</Text>
          )}
        </View>
      )}

      {/* ── Режим редактирования ── */}
      {isEditing && (
        <View style={[styles.editForm, { backgroundColor: theme.surface, borderColor: theme.primary + '30' }]}>
          <Text style={[styles.editTitle, { color: theme.textPrimary }]}>✏️ Изменить оценку</Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setEditStars(s)}
                onPressIn={() => setEditHovered(s)}
                onPressOut={() => setEditHovered(0)}
                style={styles.starBtn}
              >
                <Ionicons
                  name={s <= (editHovered || editStars) ? 'star' : 'star-outline'}
                  size={34}
                  color={s <= (editHovered || editStars) ? theme.amber : theme.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>

          {editStars > 0 && (
            <Text style={[styles.selectedLabel, { color: theme.textSecondary }]}>{STAR_LABELS[editStars]}</Text>
          )}

          <TextInput
            style={[styles.commentInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
            value={editComment}
            onChangeText={setEditComment}
            placeholder="Комментарий (необязательно)..."
            placeholderTextColor={theme.textMuted}
            multiline
            maxLength={300}
          />

          <View style={[styles.anonRow, { backgroundColor: theme.surface }]}>
            <Text style={[styles.anonLabel, { color: theme.textSecondary }]}>🕵️ Анонимно</Text>
            <Switch
              value={editAnonymous}
              onValueChange={setEditAnonymous}
              trackColor={{ false: theme.border, true: theme.primary + '80' }}
              thumbColor={editAnonymous ? theme.primary : theme.textMuted}
            />
          </View>

          <View style={styles.editBtns}>
            <TouchableOpacity
              style={[styles.cancelEditBtn, { borderColor: theme.border }]}
              onPress={() => setIsEditing(false)}
            >
              <Text style={[styles.cancelEditTxt, { color: theme.textSecondary }]}>Отмена</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, (editStars === 0 || isLoading) && styles.saveBtnDisabled, { backgroundColor: theme.primary }]}
              onPress={handleUpdate}
              disabled={editStars === 0 || isLoading}
            >
              {isLoading
                ? <ActivityIndicator size="small" color="#ffffff" />
                : <Text style={styles.saveBtnTxt}>Сохранить</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Форма нового голоса ── */}
      {myVote === null && (
        <View style={styles.voteForm}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Выбери оценку:</Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setSelectedStars(s)}
                onPressIn={() => setHovered(s)}
                onPressOut={() => setHovered(0)}
                disabled={isLoading}
                style={styles.starBtn}
              >
                <Ionicons
                  name={s <= (hovered || selectedStars) ? 'star' : 'star-outline'}
                  size={34}
                  color={
                    s <= (hovered || selectedStars) ? theme.amber : theme.textMuted
                  }
                />
              </TouchableOpacity>
            ))}
          </View>

          {selectedStars > 0 && (
            <Text style={[styles.selectedLabel, { color: theme.textSecondary }]}>{STAR_LABELS[selectedStars]}</Text>
          )}

          <TextInput
            style={[styles.commentInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
            value={comment}
            onChangeText={setComment}
            placeholder="Оставь комментарий (необязательно)..."
            placeholderTextColor={theme.textMuted}
            multiline
            maxLength={300}
          />
          {comment.length > 0 && (
            <Text style={[styles.charCount, { color: theme.textMuted }]}>{comment.length}/300</Text>
          )}

          <View style={[styles.anonRow, { backgroundColor: theme.surface }]}>
            <Text style={[styles.anonLabel, { color: theme.textSecondary }]}>🕵️ Анонимно</Text>
            <Switch
              value={anonymous}
              onValueChange={setAnonymous}
              trackColor={{ false: theme.border, true: theme.primary + '80' }}
              thumbColor={anonymous ? theme.primary : theme.textMuted}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              (selectedStars === 0 || isLoading) && styles.submitBtnDisabled,
              { backgroundColor: theme.primary },
            ]}
            onPress={handleSubmitVote}
            disabled={selectedStars === 0 || isLoading}
          >
            {isLoading
              ? <ActivityIndicator size="small" color="#ffffff" />
              : <Text style={styles.submitBtnTxt}>
                  {selectedStars > 0
                    ? `Отправить оценку ${selectedStars} ⭐`
                    : 'Выбери звёзды'}
                </Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* ── Список голосов ── */}
      {totalVotes > 0 && (
        <TouchableOpacity
          style={styles.showVotesBtn}
          onPress={() => setShowVotes(!showVotes)}
        >
          <Text style={[styles.showVotesTxt, { color: theme.primary }]}>
            {showVotes
              ? '▲ Скрыть голоса'
              : `▼ Все голоса (${totalVotes})`}
          </Text>
        </TouchableOpacity>
      )}

      {showVotes && (
        <View style={[styles.votesList, { backgroundColor: theme.surface }]}>
          {votes.map((v) => (
            <View key={v.id} style={[styles.voteRow, { borderBottomColor: theme.border }, v.isMyVote && { backgroundColor: theme.primary + '10' }]}>
              <View style={[
                styles.voterAvatar,
                { backgroundColor: theme.primary },
                v.voter.id === null && { backgroundColor: theme.textMuted },
              ]}>
                <Text style={styles.voterAvatarTxt}>
                  {v.voter.username.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.voteContent}>
                <View style={styles.voteTopRow}>
                  <Text style={[styles.voterName, { color: theme.textPrimary }]}>{v.voter.username}</Text>
                  <View style={styles.voteStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name={s <= v.score ? 'star' : 'star-outline'}
                        size={12}
                        color={theme.amber}
                      />
                    ))}
                    <Text style={[styles.voteScoreTxt, { color: theme.amber }]}>{v.score}</Text>
                  </View>
                </View>
                {v.comment && (
                  <Text style={[styles.voteComment, { color: theme.textSecondary }]}>💬 {v.comment}</Text>
                )}
              </View>

              {v.isMyVote && (
                <Text style={[styles.myVoteLabel, { color: theme.primary, backgroundColor: theme.primary + '20' }]}>ты</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:  { paddingTop: 8 },
  loading:    { padding: 16, alignItems: 'center' },

  avgRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  avgNum:    { fontSize: 16, fontWeight: '700', marginLeft: 4 },
  voteCount: { fontSize: 12 },

  // Уже голосовал
  alreadyBox: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    gap: 6,
  },
  alreadyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alreadyLeft:    { gap: 4 },
  alreadyLabel:   { fontSize: 12 },
  alreadyStars:   { flexDirection: 'row', alignItems: 'center', gap: 2 },
  alreadyScore:   { fontSize: 14, fontWeight: '700', marginLeft: 3 },
  alreadyComment: { fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  alreadySub:     { fontSize: 12 },
  anonNote:       { fontSize: 11 },

  alreadyActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  editBtnTxt: { fontSize: 12, fontWeight: '600' },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
  },

  // Форма редактирования
  editForm: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    gap: 10,
  },
  editTitle: { fontSize: 14, fontWeight: '700' },
  editBtns:  { flexDirection: 'row', gap: 10 },
  cancelEditBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelEditTxt: { fontWeight: '600' },
  saveBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnTxt:      { color: '#ffffff', fontWeight: '700' },

  // Форма голосования
  voteForm:      { marginBottom: 8 },
  label:         { fontSize: 13, marginBottom: 8, fontWeight: '500' },
  starsRow:      { flexDirection: 'row', gap: 4, marginBottom: 6 },
  starBtn:       { padding: 4 },
  selectedLabel: { fontSize: 14, marginBottom: 10, textAlign: 'center' },

  commentInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: 'top',
    marginBottom: 4,
  },
  charCount: { fontSize: 11, textAlign: 'right', marginBottom: 10 },

  anonRow:   {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  anonLabel: { fontSize: 13 },

  submitBtn:         { borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnTxt:      { color: '#ffffff', fontWeight: '700', fontSize: 15 },

  // Список голосов
  showVotesBtn: { paddingVertical: 8, alignItems: 'center', marginTop: 4 },
  showVotesTxt: { fontSize: 12, fontWeight: '500' },

  votesList: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 4,
  },
  voteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  voteRowMe:       {},
  voterAvatar:     {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  voterAvatarAnon: {},
  voterAvatarTxt:  { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  voteContent:     { flex: 1 },
  voteTopRow:      { flexDirection: 'row', alignItems: 'center', justifyContext: 'space-between' },
  voterName:       { fontSize: 13, fontWeight: '600' },
  voteStars:       { flexDirection: 'row', alignItems: 'center', gap: 2 },
  voteScoreTxt:    { fontSize: 12, fontWeight: '700', marginLeft: 2 },
  voteComment:     { fontSize: 12, fontStyle: 'italic', marginTop: 4, lineHeight: 17 },
  myVoteLabel:     {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'center',
  },
});