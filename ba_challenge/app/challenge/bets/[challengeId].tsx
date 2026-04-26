// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   View, Text, StyleSheet, ScrollView, TouchableOpacity,
//   Alert, ActivityIndicator, Modal, TextInput, RefreshControl,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useLocalSearchParams } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import { Colors } from '@constants/colors';
// import { Header } from '@components/shared/Header';
// import { betService, Bet, BetStatus } from '@services/betService';
// import { useAuthStore } from '@store/authStore';
// import { useUserStore } from '@store/userStore';
// import { userService } from '@services/userService';

// // ─── Участник челленджа (передаём через params) ───────────────
// interface Participant {
//   userId: number;
//   username: string;
//   score: number;
// }

// // ─── Конфиг статусов ─────────────────────────────────────────
// const STATUS_CONFIG: Record<BetStatus, { label: string; color: string; icon: string }> = {
//   pending:   { label: 'Ожидает',   color: Colors.warning, icon: '⏳' },
//   active:    { label: 'Активна',   color: Colors.accent,  icon: '🔥' },
//   declined:  { label: 'Отклонена', color: Colors.error,   icon: '❌' },
//   cancelled: { label: 'Отменена',  color: Colors.textMuted,icon: '🚫' },
//   won:       { label: 'Выиграл',   color: Colors.rikon,   icon: '🏆' },
//   lost:      { label: 'Проиграл',  color: Colors.error,   icon: '💸' },
// };

// export default function ChallengeBetsScreen() {
//   const { challengeId, challengeTitle, participantsJson } = useLocalSearchParams<{
//     challengeId: string;  
//     challengeTitle: string;
//     participantsJson: string;
//   }>();

//   const { user } = useAuthStore();
//   const { setProfile } = useUserStore();

//   const participants: Participant[] = participantsJson
//     ? JSON.parse(decodeURIComponent(participantsJson))
//     : [];

//   const [bets, setBets]               = useState<Bet[]>([]);
//   const [isLoading, setIsLoading]     = useState(true);
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   // Форма создания ставки
//   const [createModal, setCreateModal] = useState(false);
//   const [selOpponent, setSelOpponent] = useState<Participant | null>(null);
//   const [selTarget, setSelTarget]     = useState<'me' | 'opponent' | null>(null);
//   const [amount, setAmount]           = useState('');
//   const [description, setDescription] = useState('');
//   const [creating, setCreating]       = useState(false);

//   // Модалка завершения
//   const [resolveModal, setResolveModal] = useState(false);
//   const [resolveBet, setResolveBet]     = useState<Bet | null>(null);
//   const [resolving, setResolving]       = useState(false);

//   const cId = Number(challengeId);

//   // ── Загрузка ──────────────────────────────────────────────
//   const fetchBets = useCallback(async (silent = false) => {
//     try {
//       if (!silent) setIsLoading(true);
//       const data = await betService.getByChallengeId(cId);
//       setBets(data);
//     } catch (e: any) {
//       if (!silent) Alert.alert('Ошибка', e.message);
//     } finally {
//       setIsLoading(false);
//       setIsRefreshing(false);
//     }
//   }, [cId]);

//   useEffect(() => { fetchBets(); }, [fetchBets]);

//   // Обновляем профиль после операции с монетами
//   const refreshProfile = async () => {
//     try {
//       const p = await userService.getProfile();
//       setProfile(p);
//     } catch {}
//   };

//   // ── Создать ставку ────────────────────────────────────────
//   const handleCreate = async () => {
//     if (!selOpponent || !selTarget || !amount || !description.trim()) {
//       Alert.alert('Заполни все поля');
//       return;
//     }
//     const amt = parseInt(amount);
//     if (isNaN(amt) || amt < 1) {
//       Alert.alert('Некорректная сумма');
//       return;
//     }

//     const targetUserId = selTarget === 'me' ? user!.id : selOpponent.userId;

//     try {
//       setCreating(true);
//       await betService.create({
//         challengeId: cId,
//         toUserId: selOpponent.userId,
//         targetUserId,
//         amount: amt,
//         description: description.trim(),
//       });
//       setCreateModal(false);
//       setSelOpponent(null);
//       setSelTarget(null);
//       setAmount('');
//       setDescription('');
//       await fetchBets(true);
//       await refreshProfile();
//       Alert.alert('✅ Ставка создана!', `${amt} 🪙 заморожены. Ждём ответа ${selOpponent.username}`);
//     } catch (e: any) {
//       Alert.alert('Ошибка', e.message);
//     } finally {
//       setCreating(false);
//     }
//   };

//   // ── Ответить на ставку ────────────────────────────────────
//   const handleRespond = async (bet: Bet, accept: boolean) => {
//     const confirmMsg = accept
//       ? `Принять ставку? Спишется ${bet.amount} 🪙. Банк: ${bet.amount * 2} 🪙`
//       : 'Отклонить ставку?';

//     Alert.alert(accept ? '💰 Принять ставку' : '❌ Отклонить', confirmMsg, [
//       { text: 'Отмена', style: 'cancel' },
//       {
//         text: accept ? 'Принять' : 'Отклонить',
//         style: accept ? 'default' : 'destructive',
//         onPress: async () => {
//           try {
//             const result = await betService.respond(bet.id, accept);
//             Alert.alert(accept ? '🔥 Принято!' : '❌ Отклонено', result.message);
//             await fetchBets(true);
//             await refreshProfile();
//           } catch (e: any) {
//             Alert.alert('Ошибка', e.message);
//           }
//         },
//       },
//     ]);
//   };

//   // ── Отменить ставку ───────────────────────────────────────
//   const handleCancel = async (bet: Bet) => {
//     Alert.alert('Отменить ставку?', `Монеты (${bet.amount} 🪙) вернутся тебе`, [
//       { text: 'Нет', style: 'cancel' },
//       {
//         text: 'Отменить',
//         style: 'destructive',
//         onPress: async () => {
//           try {
//             const result = await betService.cancel(bet.id);
//             Alert.alert('🚫 Отменено', result.message);
//             await fetchBets(true);
//             await refreshProfile();
//           } catch (e: any) {
//             Alert.alert('Ошибка', e.message);
//           }
//         },
//       },
//     ]);
//   };

//   // ── Завершить ставку ──────────────────────────────────────
//   const handleResolve = async (winnerId: number) => {
//     if (!resolveBet) return;
//     try {
//       setResolving(true);
//       const result = await betService.resolve(resolveBet.id, winnerId);
//       setResolveModal(false);
//       setResolveBet(null);
//       Alert.alert('🏆 Ставка завершена!', result.message);
//       await fetchBets(true);
//       await refreshProfile();
//     } catch (e: any) {
//       Alert.alert('Ошибка', e.message);
//     } finally {
//       setResolving(false);
//     }
//   };

//   // ── Рендер одной ставки ───────────────────────────────────
//   const renderBet = (bet: Bet) => {
//     const cfg    = STATUS_CONFIG[bet.status];
//     const bank   = bet.amount * 2;
//     const isActive = bet.status === 'active';
//     const isPending = bet.status === 'pending';
//     const isFinished = ['won', 'lost', 'declined', 'cancelled'].includes(bet.status);

//     return (
//       <View key={bet.id} style={[styles.betCard, isFinished && styles.betCardFinished]}>

//         {/* Заголовок */}
//         <View style={styles.betHeader}>
//           <View style={[styles.statusBadge, { backgroundColor: cfg.color + '22', borderColor: cfg.color }]}>
//             <Text style={styles.statusIcon}>{cfg.icon}</Text>
//             <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
//           </View>
//           <Text style={styles.betBank}>💰 Банк: {bank} 🪙</Text>
//         </View>

//         {/* Участники */}
//         <View style={styles.betVs}>
//           <View style={styles.betUser}>
//             <View style={[styles.betAvatar, { backgroundColor: Colors.primary }]}>
//               <Text style={styles.betAvatarTxt}>
//                 {bet.fromUser?.username.charAt(0).toUpperCase()}
//               </Text>
//             </View>
//             <Text style={styles.betUsername} numberOfLines={1}>
//               {bet.fromUser?.username}
//             </Text>
//             <Text style={styles.betRole}>ставит</Text>
//           </View>

//           <View style={styles.vsBox}>
//             <Text style={styles.vsTxt}>VS</Text>
//             <Text style={styles.betAmountTxt}>{bet.amount} 🪙</Text>
//           </View>

//           <View style={styles.betUser}>
//             <View style={[styles.betAvatar, { backgroundColor: Colors.secondary }]}>
//               <Text style={styles.betAvatarTxt}>
//                 {bet.toUser?.username.charAt(0).toUpperCase()}
//               </Text>
//             </View>
//             <Text style={styles.betUsername} numberOfLines={1}>
//               {bet.toUser?.username}
//             </Text>
//             <Text style={styles.betRole}>оппонент</Text>
//           </View>
//         </View>

//         {/* Прогноз */}
//         <View style={styles.betPrediction}>
//           <Ionicons name="trophy-outline" size={14} color={Colors.rikon} />
//           <Text style={styles.betPredictionTxt}>
//             Прогноз победителя:{' '}
//             <Text style={styles.betPredictionName}>
//               {bet.targetUser?.username}
//             </Text>
//           </Text>
//         </View>

//         {/* Условие */}
//         <Text style={styles.betDesc}>{bet.description}</Text>

//         {/* Победитель */}
//         {bet.winnerId && (
//           <View style={styles.winnerBadge}>
//             <Text style={styles.winnerTxt}>
//               🏆 Победитель: {
//                 bet.winnerId === bet.fromUser?.id
//                   ? bet.fromUser?.username
//                   : bet.toUser?.username
//               }
//             </Text>
//           </View>
//         )}

//         {/* Кнопки действий */}
//         {!isFinished && (
//           <View style={styles.betActions}>

//             {/* Мне адресована (pending) — принять/отклонить */}
//             {isPending && bet.isTarget && (
//               <>
//                 <TouchableOpacity
//                   style={styles.rejectBtn}
//                   onPress={() => handleRespond(bet, false)}
//                 >
//                   <Text style={styles.rejectBtnTxt}>❌ Отклонить</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   style={styles.acceptBtn}
//                   onPress={() => handleRespond(bet, true)}
//                 >
//                   <Text style={styles.acceptBtnTxt}>✅ Принять ({bet.amount} 🪙)</Text>
//                 </TouchableOpacity>
//               </>
//             )}

//             {/* Я создатель (pending) — отменить */}
//             {isPending && bet.isMine && (
//               <TouchableOpacity
//                 style={styles.cancelBtn}
//                 onPress={() => handleCancel(bet)}
//               >
//                 <Text style={styles.cancelBtnTxt}>🚫 Отменить</Text>
//               </TouchableOpacity>
//             )}

//             {/* Активна — завершить (любой из двух) */}
//             {isActive && bet.isMyBet && (
//               <TouchableOpacity
//                 style={styles.resolveBtn}
//                 onPress={() => { setResolveBet(bet); setResolveModal(true); }}
//               >
//                 <Ionicons name="checkmark-circle-outline" size={16} color={Colors.white} />
//                 <Text style={styles.resolveBtnTxt}>Завершить ставку</Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         )}
//       </View>
//     );
//   };

//   // Фильтры
//   const activeBets   = bets.filter((b) => ['pending', 'active'].includes(b.status));
//   const finishedBets = bets.filter((b) => ['won', 'lost', 'declined', 'cancelled'].includes(b.status));
//   const myPending    = bets.filter((b) => b.isTarget && b.status === 'pending');

//   // Оппоненты для ставки (все участники кроме меня)
//   const opponents = participants.filter((p) => p.userId !== user?.id);

//   return (
//     <SafeAreaView style={styles.container} edges={['top']}>
//       <Header title="💰 Ставки" showBack />

//       <ScrollView
//         contentContainerStyle={styles.content}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={isRefreshing}
//             onRefresh={() => { setIsRefreshing(true); fetchBets(); }}
//             tintColor={Colors.primary}
//           />
//         }
//       >
//         {/* Инфо-карточка */}
//         <View style={styles.infoCard}>
//           <Text style={styles.infoIcon}>🏆</Text>
//           <View style={styles.infoTexts}>
//             <Text style={styles.infoTitle} numberOfLines={1}>
//               {decodeURIComponent(challengeTitle || 'Челлендж')}
//             </Text>
//             <Text style={styles.infoSub}>
//               Ставки между участниками · Монеты блокируются
//             </Text>
//           </View>
//         </View>

//         {/* Уведомление о входящих ставках */}
//         {myPending.length > 0 && (
//           <View style={styles.incomingBanner}>
//             <Ionicons name="notifications" size={18} color={Colors.warning} />
//             <Text style={styles.incomingTxt}>
//               {myPending.length === 1
//                 ? 'Тебе предложили ставку — ответь!'
//                 : `${myPending.length} ставки ждут твоего ответа!`}
//             </Text>
//           </View>
//         )}

//         {/* Кнопка создать */}
//         {opponents.length > 0 && (
//           <TouchableOpacity
//             style={styles.createBtn}
//             onPress={() => setCreateModal(true)}
//           >
//             <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
//             <Text style={styles.createBtnTxt}>Предложить ставку</Text>
//           </TouchableOpacity>
//         )}

//         {/* Загрузка */}
//         {isLoading ? (
//           <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
//         ) : bets.length === 0 ? (
//           <View style={styles.empty}>
//             <Text style={styles.emptyIcon}>🎰</Text>
//             <Text style={styles.emptyTitle}>Ставок пока нет</Text>
//             <Text style={styles.emptyText}>
//               Предложи ставку участнику челленджа!
//             </Text>
//           </View>
//         ) : (
//           <>
//             {/* Активные ставки */}
//             {activeBets.length > 0 && (
//               <>
//                 <Text style={styles.sectionTitle}>🔥 Активные ({activeBets.length})</Text>
//                 {activeBets.map(renderBet)}
//               </>
//             )}

//             {/* Завершённые */}
//             {finishedBets.length > 0 && (
//               <>
//                 <Text style={styles.sectionTitle}>📋 История</Text>
//                 {finishedBets.map(renderBet)}
//               </>
//             )}
//           </>
//         )}
//       </ScrollView>

//       {/* ══ Модалка создания ставки ══════════════════════════════ */}
//       <Modal
//         visible={createModal}
//         transparent
//         animationType="slide"
//         onRequestClose={() => setCreateModal(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalSheet}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>💰 Новая ставка</Text>
//               <TouchableOpacity onPress={() => setCreateModal(false)}>
//                 <Ionicons name="close" size={22} color={Colors.textMuted} />
//               </TouchableOpacity>
//             </View>

//             <ScrollView showsVerticalScrollIndicator={false}>

//               {/* Выбор оппонента */}
//               <Text style={styles.fieldLabel}>Оппонент *</Text>
//               <ScrollView
//                 horizontal
//                 showsHorizontalScrollIndicator={false}
//                 style={styles.chipsScroll}
//               >
//                 {opponents.map((p) => (
//                   <TouchableOpacity
//                     key={p.userId}
//                     style={[styles.chip, selOpponent?.userId === p.userId && styles.chipActive]}
//                     onPress={() => { setSelOpponent(p); setSelTarget(null); }}
//                   >
//                     <Text style={[styles.chipTxt, selOpponent?.userId === p.userId && styles.chipTxtActive]}>
//                       {p.username}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//               </ScrollView>

//               {/* Прогноз кто победит */}
//               {selOpponent && (
//                 <>
//                   <Text style={styles.fieldLabel}>Кто победит по-твоему? *</Text>
//                   <View style={styles.targetRow}>
//                     <TouchableOpacity
//                       style={[styles.targetBtn, selTarget === 'me' && styles.targetBtnActive]}
//                       onPress={() => setSelTarget('me')}
//                     >
//                       <Text style={[styles.targetBtnTxt, selTarget === 'me' && styles.targetBtnTxtActive]}>
//                         👤 Я ({participants.find((p) => p.userId === user?.id)?.username})
//                       </Text>
//                     </TouchableOpacity>
//                     <TouchableOpacity
//                       style={[styles.targetBtn, selTarget === 'opponent' && styles.targetBtnActive]}
//                       onPress={() => setSelTarget('opponent')}
//                     >
//                       <Text style={[styles.targetBtnTxt, selTarget === 'opponent' && styles.targetBtnTxtActive]}>
//                         🎯 {selOpponent.username}
//                       </Text>
//                     </TouchableOpacity>
//                   </View>
//                 </>
//               )}

//               {/* Сумма */}
//               <Text style={styles.fieldLabel}>Сумма ставки 🪙 *</Text>
//               <TextInput
//                 style={styles.textInput}
//                 value={amount}
//                 onChangeText={setAmount}
//                 placeholder="Например: 50"
//                 placeholderTextColor={Colors.textMuted}
//                 keyboardType="numeric"
//                 maxLength={6}
//               />

//               {/* Пояснение банка */}
//               {amount && parseInt(amount) > 0 && (
//                 <View style={styles.bankInfo}>
//                   <Text style={styles.bankInfoTxt}>
//                     💰 Банк: {parseInt(amount) * 2} 🪙 (оппонент тоже ставит {amount} 🪙)
//                   </Text>
//                 </View>
//               )}

//               {/* Условие */}
//               <Text style={styles.fieldLabel}>Условие / описание *</Text>
//               <TextInput
//                 style={[styles.textInput, styles.textInputMulti]}
//                 value={description}
//                 onChangeText={setDescription}
//                 placeholder="Например: Ставлю на себя — наберу больше очков!"
//                 placeholderTextColor={Colors.textMuted}
//                 multiline
//                 numberOfLines={3}
//                 textAlignVertical="top"
//                 maxLength={300}
//               />

//               {/* Кнопка отправить */}
//               <TouchableOpacity
//                 style={[
//                   styles.sendBetBtn,
//                   (!selOpponent || !selTarget || !amount || !description.trim() || creating)
//                     && styles.sendBetBtnDisabled,
//                 ]}
//                 onPress={handleCreate}
//                 disabled={!selOpponent || !selTarget || !amount || !description.trim() || creating}
//               >
//                 {creating
//                   ? <ActivityIndicator size="small" color={Colors.white} />
//                   : <Text style={styles.sendBetBtnTxt}>
//                       Предложить ставку {amount ? `(${amount} 🪙)` : ''}
//                     </Text>
//                 }
//               </TouchableOpacity>
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* ══ Модалка завершения ставки ═══════════════════════════ */}
//       <Modal
//         visible={resolveModal}
//         transparent
//         animationType="fade"
//         onRequestClose={() => setResolveModal(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={[styles.modalSheet, styles.resolveSheet]}>
//             <Text style={styles.modalTitle}>🏆 Кто выиграл?</Text>
//             <Text style={styles.resolveSubtitle}>
//               Победитель получит {resolveBet ? resolveBet.amount * 2 : 0} 🪙
//             </Text>

//             {resolveBet && (
//               <View style={styles.resolveOptions}>
//                 <TouchableOpacity
//                   style={styles.resolveOption}
//                   onPress={() => handleResolve(resolveBet.fromUser!.id)}
//                   disabled={resolving}
//                 >
//                   <View style={[styles.resolveAvatar, { backgroundColor: Colors.primary }]}>
//                     <Text style={styles.resolveAvatarTxt}>
//                       {resolveBet.fromUser?.username.charAt(0).toUpperCase()}
//                     </Text>
//                   </View>
//                   <Text style={styles.resolveUserName}>{resolveBet.fromUser?.username}</Text>
//                   <Text style={styles.resolveUserRole}>создатель ставки</Text>
//                 </TouchableOpacity>

//                 <Text style={styles.resolveVs}>VS</Text>

//                 <TouchableOpacity
//                   style={styles.resolveOption}
//                   onPress={() => handleResolve(resolveBet.toUser!.id)}
//                   disabled={resolving}
//                 >
//                   <View style={[styles.resolveAvatar, { backgroundColor: Colors.secondary }]}>
//                     <Text style={styles.resolveAvatarTxt}>
//                       {resolveBet.toUser?.username.charAt(0).toUpperCase()}
//                     </Text>
//                   </View>
//                   <Text style={styles.resolveUserName}>{resolveBet.toUser?.username}</Text>
//                   <Text style={styles.resolveUserRole}>оппонент</Text>
//                 </TouchableOpacity>
//               </View>
//             )}

//             {resolving && <ActivityIndicator color={Colors.primary} style={{ marginTop: 12 }} />}

//             <TouchableOpacity
//               style={styles.resolveCancelBtn}
//               onPress={() => setResolveModal(false)}
//             >
//               <Text style={styles.resolveCancelTxt}>Отмена</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: Colors.background },
//   content:   { padding: 20, paddingBottom: 40 },

//   // Инфо
//   infoCard: {
//     flexDirection:  'row',
//     alignItems:     'center',
//     backgroundColor: Colors.surface,
//     borderRadius:   14,
//     padding:        14,
//     marginBottom:   16,
//     borderWidth:    1,
//     borderColor:    Colors.border,
//     gap:            12,
//   },
//   infoIcon:  { fontSize: 28 },
//   infoTexts: { flex: 1 },
//   infoTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
//   infoSub:   { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

//   // Баннер входящих
//   incomingBanner: {
//     flexDirection:   'row',
//     alignItems:      'center',
//     gap:             8,
//     backgroundColor: Colors.warning + '18',
//     borderRadius:    10,
//     padding:         12,
//     marginBottom:    14,
//     borderWidth:     1,
//     borderColor:     Colors.warning + '50',
//   },
//   incomingTxt: { fontSize: 13, color: Colors.warning, fontWeight: '600', flex: 1 },

//   // Кнопка создать
//   createBtn: {
//     flexDirection:   'row',
//     alignItems:      'center',
//     justifyContent:  'center',
//     gap:             8,
//     backgroundColor: Colors.primary,
//     borderRadius:    12,
//     paddingVertical: 14,
//     marginBottom:    20,
//   },
//   createBtnTxt: { color: Colors.white, fontWeight: '700', fontSize: 15 },

//   // Пустое состояние
//   empty:      { alignItems: 'center', paddingVertical: 48 },
//   emptyIcon:  { fontSize: 52, marginBottom: 12 },
//   emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
//   emptyText:  { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

//   sectionTitle: {
//     fontSize: 16, fontWeight: '700',
//     color: Colors.textPrimary, marginBottom: 10,
//   },

//   // Карточка ставки
//   betCard: {
//     backgroundColor: Colors.surface,
//     borderRadius:    16,
//     padding:         16,
//     marginBottom:    12,
//     borderWidth:     1,
//     borderColor:     Colors.border,
//     gap:             10,
//   },
//   betCardFinished: { opacity: 0.7 },

//   betHeader: {
//     flexDirection:  'row',
//     justifyContent: 'space-between',
//     alignItems:     'center',
//   },
//   statusBadge: {
//     flexDirection:   'row',
//     alignItems:      'center',
//     gap:             4,
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius:    20,
//     borderWidth:     1,
//   },
//   statusIcon:  { fontSize: 12 },
//   statusLabel: { fontSize: 12, fontWeight: '600' },
//   betBank:     { fontSize: 13, color: Colors.rikon, fontWeight: '700' },

//   // VS блок
//   betVs: {
//     flexDirection:  'row',
//     alignItems:     'center',
//     justifyContent: 'space-between',
//     gap:            8,
//   },
//   betUser: { flex: 1, alignItems: 'center', gap: 4 },
//   betAvatar: {
//     width: 44, height: 44, borderRadius: 22,
//     justifyContent: 'center', alignItems: 'center',
//   },
//   betAvatarTxt: { color: Colors.white, fontWeight: '700', fontSize: 18 },
//   betUsername:  { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
//   betRole:      { fontSize: 10, color: Colors.textMuted },

//   vsBox: { alignItems: 'center', gap: 2 },
//   vsTxt:       { fontSize: 16, fontWeight: '800', color: Colors.textMuted },
//   betAmountTxt: { fontSize: 13, fontWeight: '700', color: Colors.rikon },

//   // Прогноз
//   betPrediction: {
//     flexDirection: 'row', alignItems: 'center', gap: 6,
//     backgroundColor: Colors.rikon + '12',
//     borderRadius: 8, padding: 8,
//   },
//   betPredictionTxt:  { fontSize: 12, color: Colors.textSecondary },
//   betPredictionName: { color: Colors.rikon, fontWeight: '700' },

//   betDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, fontStyle: 'italic' },

//   // Победитель
//   winnerBadge: {
//     backgroundColor: Colors.rikon + '20',
//     borderRadius: 8, padding: 10,
//     alignItems: 'center',
//     borderWidth: 1, borderColor: Colors.rikon + '50',
//   },
//   winnerTxt: { color: Colors.rikon, fontWeight: '700', fontSize: 14 },

//   // Кнопки действий
//   betActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
//   rejectBtn: {
//     flex: 1, padding: 10, borderRadius: 10,
//     borderWidth: 1, borderColor: Colors.error,
//     alignItems: 'center',
//   },
//   rejectBtnTxt: { color: Colors.error, fontWeight: '600', fontSize: 13 },
//   acceptBtn: {
//     flex: 2, padding: 10, borderRadius: 10,
//     backgroundColor: Colors.accent, alignItems: 'center',
//   },
//   acceptBtnTxt: { color: Colors.white, fontWeight: '700', fontSize: 13 },
//   cancelBtn: {
//     flex: 1, padding: 10, borderRadius: 10,
//     borderWidth: 1, borderColor: Colors.textMuted, alignItems: 'center',
//   },
//   cancelBtnTxt: { color: Colors.textMuted, fontWeight: '600', fontSize: 13 },
//   resolveBtn: {
//     flex: 1, padding: 10, borderRadius: 10,
//     backgroundColor: Colors.primary,
//     flexDirection: 'row', alignItems: 'center',
//     justifyContent: 'center', gap: 6,
//   },
//   resolveBtnTxt: { color: Colors.white, fontWeight: '700', fontSize: 13 },

//   // Модалка
//   modalOverlay: {
//     flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
//     justifyContent: 'flex-end',
//   },
//   modalSheet: {
//     backgroundColor: Colors.surface,
//     borderTopLeftRadius: 24, borderTopRightRadius: 24,
//     padding: 24, paddingBottom: 40, maxHeight: '90%',
//   },
//   resolveSheet: { maxHeight: undefined, paddingBottom: 32 },
//   modalHeader: {
//     flexDirection: 'row', justifyContent: 'space-between',
//     alignItems: 'center', marginBottom: 20,
//   },
//   modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },

//   fieldLabel: {
//     fontSize: 13, color: Colors.textSecondary,
//     fontWeight: '500', marginBottom: 8,
//   },
//   chipsScroll: { marginBottom: 16 },
//   chip: {
//     paddingHorizontal: 14, paddingVertical: 8,
//     backgroundColor: Colors.card, borderRadius: 20,
//     borderWidth: 1, borderColor: Colors.border, marginRight: 8,
//   },
//   chipActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
//   chipTxt:       { fontSize: 13, color: Colors.textSecondary },
//   chipTxtActive: { color: Colors.white, fontWeight: '600' },

//   targetRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
//   targetBtn: {
//     flex: 1, padding: 12, borderRadius: 12,
//     backgroundColor: Colors.card,
//     borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
//   },
//   targetBtnActive:    { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
//   targetBtnTxt:       { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', textAlign: 'center' },
//   targetBtnTxtActive: { color: Colors.primary, fontWeight: '700' },

//   textInput: {
//     backgroundColor: Colors.card, borderRadius: 12,
//     borderWidth: 1, borderColor: Colors.border,
//     padding: 14, fontSize: 15, color: Colors.textPrimary, marginBottom: 16,
//   },
//   textInputMulti: { minHeight: 80, textAlignVertical: 'top' },

//   bankInfo: {
//     backgroundColor: Colors.rikon + '15',
//     borderRadius: 8, padding: 10, marginBottom: 16,
//     borderWidth: 1, borderColor: Colors.rikon + '40',
//   },
//   bankInfoTxt: { fontSize: 13, color: Colors.rikon, fontWeight: '600', textAlign: 'center' },

//   sendBetBtn: {
//     backgroundColor: Colors.primary, borderRadius: 12,
//     paddingVertical: 14, alignItems: 'center', marginTop: 4,
//   },
//   sendBetBtnDisabled: { opacity: 0.4 },
//   sendBetBtnTxt:      { color: Colors.white, fontWeight: '700', fontSize: 15 },

//   // Модалка завершения
//   resolveSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 20, textAlign: 'center' },
//   resolveOptions: {
//     flexDirection: 'row', alignItems: 'center',
//     justifyContent: 'space-around', marginBottom: 20,
//   },
//   resolveOption: { alignItems: 'center', gap: 8, flex: 1 },
//   resolveAvatar: {
//     width: 60, height: 60, borderRadius: 30,
//     justifyContent: 'center', alignItems: 'center',
//   },
//   resolveAvatarTxt: { color: Colors.white, fontWeight: '800', fontSize: 24 },
//   resolveUserName:  { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
//   resolveUserRole:  { fontSize: 11, color: Colors.textMuted },
//   resolveVs:        { fontSize: 20, fontWeight: '800', color: Colors.textMuted },
//   resolveCancelBtn: {
//     padding: 14, borderRadius: 12, borderWidth: 1,
//     borderColor: Colors.border, alignItems: 'center',
//   },
//   resolveCancelTxt: { color: Colors.textSecondary, fontWeight: '600' },
// });

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Modal, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { Header } from '@components/shared/Header';
import { betService, Bet, BetStatus } from '@services/betService';
import { useAuthStore } from '@store/authStore';
import { useUserStore } from '@store/userStore';
import { userService } from '@services/userService';

interface ChallengeParticipant {
  userId: number;
  username: string;
  score: number;
}

const STATUS_CONFIG: Record<BetStatus, { label: string; color: string; icon: string }> = {
  open:      { label: 'Открыта',   color: Colors.primary, icon: '🎯' },
  active:    { label: 'Активна',   color: Colors.accent,  icon: '🔥' },
  settled:   { label: 'Завершена', color: Colors.rikon,   icon: '🏆' },
  cancelled: { label: 'Отменена',  color: Colors.textMuted, icon: '🚫' },
};

export default function ChallengeBetsScreen() {
  const { challengeId, challengeTitle, participantsJson } = useLocalSearchParams<{
    challengeId: string;
    challengeTitle: string;
    participantsJson: string;
  }>();

  const { user } = useAuthStore();
  const { setProfile } = useUserStore();

  const participants: ChallengeParticipant[] = participantsJson
    ? JSON.parse(decodeURIComponent(participantsJson))
    : [];

  const [bets, setBets]           = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Форма создания
  const [createModal, setCreateModal] = useState(false);
  const [selTarget, setSelTarget]     = useState<ChallengeParticipant | null>(null);
  const [selAmount, setSelAmount]     = useState<number>(10);
  const [creating, setCreating]       = useState(false);

  const cId = Number(challengeId);

  const fetchBets = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await betService.getByChallengeId(cId);
      setBets(data);
    } catch (e: any) {
      if (!silent) Alert.alert('Ошибка', e.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [cId]);

  useEffect(() => { fetchBets(); }, [fetchBets]);

  const refreshProfile = async () => {
    try { const p = await userService.getProfile(); setProfile(p); } catch {}
  };

  // ── Создать ставку ──────────────────────────────────────────
  const handleCreate = async () => {
    if (!selTarget || selAmount < 1) return;
    try {
      setCreating(true);
      await betService.create({
        challengeId: cId,
        targetUserId: selTarget.userId,
        amount: selAmount,
      });
      setCreateModal(false);
      setSelTarget(null);
      setSelAmount(10);
      await fetchBets(true);
      await refreshProfile();
      Alert.alert('✅ Ставка создана!', `${selAmount} 🪙 заморожены. Другие участники могут принять ставку.`);
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setCreating(false);
    }
  };

  // ── Принять ставку ──────────────────────────────────────────
  const handleJoin = (bet: Bet) => {
    Alert.alert(
      '💰 Принять ставку?',
      `Ты ставишь ${bet.amount} 🪙 ПРОТИВ победы ${bet.targetUser?.username}.\nЕсли угадаешь — получишь свою долю пула!`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: `Принять (${bet.amount} 🪙)`,
          onPress: async () => {
            try {
              const result = await betService.join(bet.id);
              Alert.alert('🔥 Принято!', result.message);
              await fetchBets(true);
              await refreshProfile();
            } catch (e: any) {
              Alert.alert('Ошибка', e.message);
            }
          },
        },
      ]
    );
  };

  // ── Отменить ставку ─────────────────────────────────────────
  const handleCancel = (bet: Bet) => {
    Alert.alert('Отменить ставку?', `Монеты (${bet.amount} 🪙) вернутся тебе`, [
      { text: 'Нет', style: 'cancel' },
      {
        text: 'Отменить',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await betService.cancel(bet.id);
            Alert.alert('🚫 Отменено', result.message);
            await fetchBets(true);
            await refreshProfile();
          } catch (e: any) {
            Alert.alert('Ошибка', e.message);
          }
        },
      },
    ]);
  };

  // ── Рендер ставки ───────────────────────────────────────────
  const renderBet = (bet: Bet) => {
    const cfg = STATUS_CONFIG[bet.status];
    const isFinished = bet.status === 'settled' || bet.status === 'cancelled';
    const canJoin = bet.status === 'open' && !bet.isMyBet && !bet.hasJoined;

    return (
      <View key={bet.id} style={[styles.betCard, isFinished && styles.betCardFinished]}>

        {/* Статус + пул */}
        <View style={styles.betHeader}>
          <View style={[styles.statusBadge, { backgroundColor: cfg.color + '22', borderColor: cfg.color }]}>
            <Text style={styles.statusIcon}>{cfg.icon}</Text>
            <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <View style={styles.poolBadge}>
            <Text style={styles.poolLabel}>Банк:</Text>
            <Text style={styles.poolAmount}>{bet.totalPool} 🪙</Text>
          </View>
        </View>

        {/* Ставит на победу X */}
        <View style={styles.betBody}>
          <View style={styles.creatorRow}>
            <View style={styles.userChip}>
              <Text style={styles.userChipTxt}>
                {bet.creator?.username ?? '?'}
              </Text>
            </View>
            <Text style={styles.betsOnText}>ставит на победу</Text>
            <View style={[styles.userChip, styles.targetChip]}>
              <Text style={[styles.userChipTxt, styles.targetChipTxt]}>
                🏆 {bet.targetUser?.username ?? '?'}
              </Text>
            </View>
          </View>

          {/* Ставка создателя */}
          <Text style={styles.amountRow}>
            Ставка: <Text style={styles.amountNum}>{bet.amount} 🪙</Text>
            {bet.participantCount > 0 && (
              <Text style={styles.participantCount}>
                {' '}· {bet.participantCount} против
              </Text>
            )}
          </Text>

          {/* Победитель */}
          {bet.status === 'settled' && bet.winnerId && (
            <View style={styles.winnerBadge}>
              <Text style={styles.winnerTxt}>
                🏆 {bet.winnerId === bet.creator?.id
                  ? `${bet.creator?.username} угадал!`
                  : `Принявшие ставку выиграли!`}
              </Text>
            </View>
          )}
        </View>

        {/* Кнопки */}
        {!isFinished && (
          <View style={styles.betActions}>
            {/* Принять (другие участники) */}
            {canJoin && (
              <TouchableOpacity
                style={styles.joinBtn}
                onPress={() => handleJoin(bet)}
              >
                <Text style={styles.joinBtnTxt}>
                  ⚔️ Поставить против ({bet.amount} 🪙)
                </Text>
              </TouchableOpacity>
            )}

            {/* Отменить (создатель, только open) */}
            {bet.isMyBet && bet.status === 'open' && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleCancel(bet)}
              >
                <Text style={styles.cancelBtnTxt}>🚫 Отменить</Text>
              </TouchableOpacity>
            )}

            {/* Уже принял */}
            {bet.hasJoined && bet.status === 'active' && (
              <View style={styles.joinedBadge}>
                <Text style={styles.joinedBadgeTxt}>✅ Ты ставишь против</Text>
              </View>
            )}

            {/* Моя ставка активна */}
            {bet.isMyBet && bet.status === 'active' && (
              <View style={styles.myActiveBadge}>
                <Text style={styles.myActiveBadgeTxt}>
                  🔥 Ставка принята — ждём итогов
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const openBets   = bets.filter((b) => b.status === 'open');
  const activeBets = bets.filter((b) => b.status === 'active');
  const doneBets   = bets.filter((b) => b.status === 'settled' || b.status === 'cancelled');

  // Участники кроме себя (для выбора цели ставки)
  const otherParticipants = participants.filter((p) => p.userId !== user?.id);

  const AMOUNTS = [5, 10, 25, 50, 100];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="💰 Ставки" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => { setIsRefreshing(true); fetchBets(); }}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Инфо */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🎯</Text>
          <View style={styles.infoTexts}>
            <Text style={styles.infoTitle} numberOfLines={1}>
              {decodeURIComponent(challengeTitle || 'Челлендж')}
            </Text>
            <Text style={styles.infoSub}>
              Ставь на победителя · Победитель определяется автоматически
            </Text>
          </View>
        </View>

        {/* Кнопка создать */}
        {otherParticipants.length > 0 && (
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setCreateModal(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
            <Text style={styles.createBtnTxt}>Сделать ставку</Text>
          </TouchableOpacity>
        )}

        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : bets.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎰</Text>
            <Text style={styles.emptyTitle}>Ставок пока нет</Text>
            <Text style={styles.emptyText}>
              Поставь на того, кто по-твоему победит в этом челлендже!
            </Text>
          </View>
        ) : (
          <>
            {openBets.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>🎯 Открытые ({openBets.length})</Text>
                {openBets.map(renderBet)}
              </>
            )}
            {activeBets.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>🔥 Активные ({activeBets.length})</Text>
                {activeBets.map(renderBet)}
              </>
            )}
            {doneBets.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>📋 История</Text>
                {doneBets.map(renderBet)}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* ══ Модалка создания ══ */}
      <Modal
        visible={createModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎯 Сделать ставку</Text>
              <TouchableOpacity onPress={() => setCreateModal(false)}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Кто по-твоему победит в этом челлендже?
            </Text>

            {/* Выбор победителя */}
            <Text style={styles.fieldLabel}>Выбери победителя *</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.targetList}>
              {otherParticipants.map((p) => (
                <TouchableOpacity
                  key={p.userId}
                  style={[
                    styles.targetRow,
                    selTarget?.userId === p.userId && styles.targetRowActive,
                  ]}
                  onPress={() => setSelTarget(p)}
                >
                  <View style={[
                    styles.targetAvatar,
                    selTarget?.userId === p.userId && styles.targetAvatarActive,
                  ]}>
                    <Text style={styles.targetAvatarTxt}>
                      {p.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.targetInfo}>
                    <Text style={styles.targetName}>{p.username}</Text>
                    <Text style={styles.targetScore}>⭐ {p.score} очков</Text>
                  </View>
                  {selTarget?.userId === p.userId && (
                    <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Выбор суммы */}
            <Text style={styles.fieldLabel}>Сумма ставки *</Text>
            <View style={styles.amountsRow}>
              {AMOUNTS.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.amountChip, selAmount === a && styles.amountChipActive]}
                  onPress={() => setSelAmount(a)}
                >
                  <Text style={[styles.amountChipTxt, selAmount === a && styles.amountChipTxtActive]}>
                    {a} 🪙
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selTarget && (
              <View style={styles.previewBox}>
                <Text style={styles.previewTxt}>
                  Ставишь <Text style={styles.previewBold}>{selAmount} 🪙</Text> на победу{' '}
                  <Text style={styles.previewBold}>{selTarget.username}</Text>.
                  Если он победит — выиграешь пул монет!
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!selTarget || creating) && styles.submitBtnDisabled,
              ]}
              onPress={handleCreate}
              disabled={!selTarget || creating}
            >
              {creating
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Text style={styles.submitBtnTxt}>
                    Поставить {selAmount} 🪙
                  </Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { padding: 20, paddingBottom: 40 },

  infoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  infoIcon:  { fontSize: 28 },
  infoTexts: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  infoSub:   { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, marginBottom: 20,
  },
  createBtnTxt: { color: Colors.white, fontWeight: '700', fontSize: 15 },

  empty:      { alignItems: 'center', paddingVertical: 48 },
  emptyIcon:  { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptyText:  { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

  sectionTitle: {
    fontSize: 16, fontWeight: '700',
    color: Colors.textPrimary, marginBottom: 10,
  },

  // Карточка ставки
  betCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, gap: 10,
  },
  betCardFinished: { opacity: 0.7 },

  betHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  statusIcon:  { fontSize: 12 },
  statusLabel: { fontSize: 12, fontWeight: '600' },

  poolBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  poolLabel:  { fontSize: 12, color: Colors.textMuted },
  poolAmount: { fontSize: 14, fontWeight: '700', color: Colors.rikon },

  betBody:     { gap: 6 },
  creatorRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  userChip: {
    backgroundColor: Colors.card, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  userChipTxt:    { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  targetChip:     { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  targetChipTxt:  { color: Colors.primary },
  betsOnText:     { fontSize: 13, color: Colors.textSecondary },

  amountRow: { fontSize: 13, color: Colors.textSecondary },
  amountNum: { color: Colors.rikon, fontWeight: '700' },
  participantCount: { color: Colors.accent },

  winnerBadge: {
    backgroundColor: Colors.rikon + '20', borderRadius: 8, padding: 8,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.rikon + '50',
  },
  winnerTxt: { color: Colors.rikon, fontWeight: '700', fontSize: 13 },

  betActions: { gap: 8 },
  joinBtn: {
    backgroundColor: Colors.accent, borderRadius: 10,
    paddingVertical: 11, alignItems: 'center',
  },
  joinBtnTxt: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  cancelBtn: {
    borderRadius: 10, paddingVertical: 11, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.textMuted,
  },
  cancelBtnTxt: { color: Colors.textMuted, fontWeight: '600', fontSize: 13 },
  joinedBadge: {
    backgroundColor: Colors.accent + '20', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.accent + '50',
  },
  joinedBadgeTxt: { color: Colors.accent, fontWeight: '600', fontSize: 13 },
  myActiveBadge: {
    backgroundColor: Colors.primary + '15', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  myActiveBadgeTxt: { color: Colors.primary, fontWeight: '600', fontSize: 13 },

  // Модалка
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  modalTitle:    { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  modalSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20 },

  fieldLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', marginBottom: 8 },

  targetList: { maxHeight: 220, marginBottom: 16 },
  targetRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 12, gap: 12,
    backgroundColor: Colors.card, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  targetRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  targetAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  targetAvatarActive: { backgroundColor: Colors.primary },
  targetAvatarTxt:    { color: Colors.white, fontWeight: '700', fontSize: 16 },
  targetInfo:         { flex: 1 },
  targetName:         { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  targetScore:        { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  amountsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  amountChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: Colors.card, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  amountChipActive:    { backgroundColor: Colors.rikon + '20', borderColor: Colors.rikon },
  amountChipTxt:       { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  amountChipTxtActive: { color: Colors.rikon, fontWeight: '700' },

  previewBox: {
    backgroundColor: Colors.primary + '15', borderRadius: 10,
    padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.primary + '30',
  },
  previewTxt:  { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  previewBold: { color: Colors.primary, fontWeight: '700' },

  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnTxt:      { color: Colors.white, fontWeight: '700', fontSize: 15 },
});