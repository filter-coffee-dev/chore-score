import { getIdToken } from './auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getIdToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
  return data as T;
}

const get = <T>(path: string) => request<T>('GET', path);
const post = <T>(path: string, body: unknown) => request<T>('POST', path, body);
const put = <T>(path: string, body: unknown) => request<T>('PUT', path, body);
const del = <T>(path: string) => request<T>('DELETE', path);

// ── Household ──────────────────────────────────────────────────────────────

export const api = {
  household: {
    create: () => post<{ householdId: string; inviteCode: string; member1Name: string }>('/household', {}),
    join: (inviteCode: string) => post<{ householdId: string; member1Name: string; member2Name: string }>('/household/join', { inviteCode }),
    get: () => get<{
      householdId: string; inviteCode: string;
      member1Id: string; member1Name: string;
      member2Id?: string; member2Name?: string;
    }>('/household'),
  },

  chores: {
    list: () => get<{ chores: ChoreWithStatus[] }>('/chores'),
    create: (data: { name: string; emoji: string; weight: number; frequency: string }) =>
      post<{ chore: Chore }>('/chores', data),
    update: (choreId: string, data: Partial<{ name: string; emoji: string; weight: number; frequency: string }>) =>
      put<{ updated: boolean }>(`/chores/${choreId}`, data),
    delete: (choreId: string) => del<{ deleted: boolean }>(`/chores/${choreId}`),
    complete: (choreId: string) =>
      post<{ completion: Completion; pointsEarned: number }>(`/chores/${choreId}/complete`, {}),
  },

  scores: {
    get: () => get<{ scores: Score[]; streak: number; taunt: string }>('/scores'),
  },

  history: {
    get: (limit = 50) => get<{ completions: Completion[]; count: number }>(`/history?limit=${limit}`),
  },

  badges: {
    get: () => get<{ members: MemberBadges[]; allBadges: BadgeDef[] }>('/badges'),
  },

  users: {
    updateMe: (data: { name?: string; deviceToken?: string }) => put<{ updated: boolean }>('/users/me', data),
  },
};

// ── Types (mirrored from backend) ─────────────────────────────────────────

export interface Chore {
  householdId: string;
  choreId: string;
  name: string;
  emoji: string;
  weight: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'on_demand';
  createdAt: string;
  createdBy: string;
}

export interface ChoreWithStatus extends Chore {
  completedThisPeriod: boolean;
  completedBy?: string;
}

export interface Completion {
  householdId: string;
  completionId: string;
  choreId: string;
  choreName: string;
  choreEmoji: string;
  userId: string;
  userName: string;
  pointsEarned: number;
  completedAt: string;
}

export interface Score {
  userId: string;
  userName: string;
  totalPoints: number;
  totalCompletions: number;
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  earnedAt?: string;
}

export interface BadgeDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export interface MemberBadges {
  userId: string;
  userName: string;
  badges: Badge[];
}
