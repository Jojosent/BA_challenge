import { User } from "./user";

export type ChallengeStatus = 'active' | 'pending' | 'completed' | 'cancelled';
export type VisibilityLevel = 'secret' | 'protected' | 'public';

// ✅ Описание одного призового места
export interface PrizeTier {
  place:   number;   // 1, 2, 3
  percent: number;   // 50, 30, 20
  amount:  number;   // реальная сумма монет
  label:   string;   // '🥇 1 место'
  user?:   { id: number; username: string } | null;  // кто занял (если завершён)
}

// ✅ Полная информация о призовом пуле
export interface PrizeInfo {
  totalPool: number;
  prizes:    PrizeTier[];
}

export interface Challenge {
  familyOwnerId: any;
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  creatorId: number;
  creator?: {
    id: number;
    username: string;
  };
  status: ChallengeStatus;
  visibility: VisibilityLevel;
  betAmount: number;
  participants: Participant[];

  // ✅ Призовой пул — приходит с бэкенда
  prizePool?: number;
  prizeInfo?: PrizeInfo;
}

export interface Vote {
  id: number;
  submissionId: number;
  score: number;
  isAnonymous: boolean;
  myVote: boolean;
  voter: {
    id: number | null;
    username: string;
    avatarUrl?: string;
  };
}

export interface Participant {
  id: number;
  challengeId: number;
  userId: number;
  score: number;
  user?: User;
}

export interface Task {
  id: number;
  challengeId: number;
  title: string;
  description: string;
  day: number;
  deadline: string;
  isAiGenerated: boolean;
  isCompleted?: boolean;
}

export interface Submission {
  id: number;
  taskId: number;
  userId: number;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  score: number;
  aiScore?: number;
  aiComment?: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    avatarUrl?: string;
  };
  task?: {
    id: number;
    title: string;
    day: number;
  };
}