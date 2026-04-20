import { User } from "./user";

export type ChallengeStatus = 'active' | 'pending' | 'completed' | 'cancelled';
export type VisibilityLevel = 'secret' | 'protected' | 'public';

export interface Challenge {
  familyOwnerId: any;
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  creatorId: number;
  creator?: {           // ✅ добавили
    id: number;
    username: string;
  };
  status: ChallengeStatus;
  visibility: VisibilityLevel;
  betAmount: number;
  participants: Participant[];
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

// export interface Task {
//     isAiGenerated: import("react").JSX.Element;
//     id: number;
//     challengeId: number;
//     title: string;
//     description: string;
//     day: number;
//     isCompleted?: boolean;
//     deadline: string;
// }

export interface Task {
  id: number;
  challengeId: number;
  title: string;
  description: string;
  day: number;
  deadline: string;
  isAiGenerated: boolean;   // ✅ true = AI, false = человек
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