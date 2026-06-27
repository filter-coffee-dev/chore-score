import { create } from 'zustand';
import { ChoreWithStatus, Score, Completion, MemberBadges, BadgeDef } from '../services/api';

interface Household {
  householdId: string;
  inviteCode: string;
  member1Id: string;
  member1Name: string;
  member2Id?: string;
  member2Name?: string;
}

interface AppState {
  // Auth
  userId: string | null;
  userName: string | null;
  setUser: (id: string | null, name: string | null) => void;

  // Household
  household: Household | null;
  setHousehold: (h: Household | null) => void;

  // Chores
  chores: ChoreWithStatus[];
  setChores: (chores: ChoreWithStatus[]) => void;

  // Scores
  scores: Score[];
  streak: number;
  taunt: string;
  setScores: (scores: Score[], streak: number, taunt: string) => void;

  // History
  completions: Completion[];
  setCompletions: (c: Completion[]) => void;

  // Badges
  memberBadges: MemberBadges[];
  allBadges: BadgeDef[];
  setBadges: (members: MemberBadges[], all: BadgeDef[]) => void;

  // Reset
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  userId: null,
  userName: null,
  setUser: (userId, userName) => set({ userId, userName }),

  household: null,
  setHousehold: (household) => set({ household }),

  chores: [],
  setChores: (chores) => set({ chores }),

  scores: [],
  streak: 0,
  taunt: '',
  setScores: (scores, streak, taunt) => set({ scores, streak, taunt }),

  completions: [],
  setCompletions: (completions) => set({ completions }),

  memberBadges: [],
  allBadges: [],
  setBadges: (memberBadges, allBadges) => set({ memberBadges, allBadges }),

  reset: () => set({
    userId: null, userName: null, household: null, chores: [],
    scores: [], streak: 0, taunt: '', completions: [], memberBadges: [], allBadges: [],
  }),
}));
