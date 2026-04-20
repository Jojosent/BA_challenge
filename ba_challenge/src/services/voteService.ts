import api from './api';

export const voteService = {

    getMyReceivedVotes: async () => {
        const response = await api.get('/votes/my-received');
        return response.data as {
            submissionId: number;
            mediaUrl: string;
            mediaType: string;
            task: { id: number; title: string; day: number };
            avgScore: number;
            votes: {
                id: number;
                score: number;
                isAnonymous: boolean;
                voter: { id: number | null; username: string; avatarUrl?: string };
            }[];
        }[];
    },

vote: async (
  submissionId: number,
  score: number,
  isAnonymous: boolean = false,
  comment: string = ''           // ✅ добавили
): Promise<{ message: string; newScore: number; voteCount: number }> => {
  const response = await api.post('/votes', {
    submissionId,
    score,
    isAnonymous,
    comment: comment.trim() || null,   // ✅
  });
  return response.data;
},

getVotesBySubmission: async (submissionId: number) => {
  const response = await api.get(`/votes/submission/${submissionId}`);
  return response.data as {
    votes:      any[];
    myVote:     number | null;
    myComment:  string | null;   // ✅ добавили
    totalVotes: number;
    avgScore:   number;
  };
},

    getScoreboard: async (challengeId: number) => {
        const response = await api.get(
            `/votes/challenge/${challengeId}/scoreboard`
        );
        return response.data;
    },

    getGlobalRanking: async () => {
        const response = await api.get('/votes/global');
        return response.data;
    },

// ===========================================================================

updateVote: async (
  voteId: number,
  score: number,
  comment: string,
  isAnonymous: boolean
): Promise<{ message: string; newScore: number }> => {
  const response = await api.patch(`/votes/${voteId}`, {
    score,
    comment: comment.trim() || null,
    isAnonymous,
  });
  return response.data;
},

deleteVote: async (
  voteId: number
): Promise<{ message: string; newScore: number }> => {
  const response = await api.delete(`/votes/${voteId}`);
  return response.data;
},

};