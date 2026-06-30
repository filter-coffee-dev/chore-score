export type Frequency = 'daily' | 'weekly' | 'monthly' | 'on_demand';

export interface User {
  userId: string;
  householdId?: string;
  name: string;
  email: string;
  deviceToken?: string;
  createdAt: string;
}

export interface Household {
  householdId: string;
  inviteCode: string;
  member1Id: string;
  member2Id?: string;
  member1Name: string;
  member2Name?: string;
  createdAt: string;
}

export interface Chore {
  householdId: string;
  choreId: string;
  name: string;
  emoji: string;
  weight: number;
  frequency: Frequency;
  createdAt: string;
  createdBy: string;
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

export interface ChoreWithStatus extends Chore {
  completedThisPeriod: boolean;
  completedBy?: string;
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

// HTTP response helpers
export const ok = (body: unknown) => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const created = (body: unknown) => ({
  statusCode: 201,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const badRequest = (message: string) => ({
  statusCode: 400,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ error: message }),
});

export const notFound = (message: string) => ({
  statusCode: 404,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ error: message }),
});

export const forbidden = (message: string) => ({
  statusCode: 403,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ error: message }),
});

export const serverError = (message: string) => ({
  statusCode: 500,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ error: message }),
});
