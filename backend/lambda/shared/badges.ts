import { Badge, Completion } from './types';

interface BadgeDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  check: (completions: number, streak: number, points: number) => boolean;
}

const BADGE_DEFS: BadgeDef[] = [
  {
    id: 'first_chore',
    name: 'Getting Started',
    emoji: '🌱',
    description: 'Completed your very first chore. A hero is born.',
    check: (c) => c >= 1,
  },
  {
    id: 'ten_chores',
    name: 'Getting Serious',
    emoji: '💪',
    description: '10 chores down. You can do this.',
    check: (c) => c >= 10,
  },
  {
    id: 'fifty_chores',
    name: 'Dish Destroyer',
    emoji: '💥',
    description: '50 chores obliterated. Respect.',
    check: (c) => c >= 50,
  },
  {
    id: 'hundred_chores',
    name: 'Century Club',
    emoji: '🏆',
    description: '100 chores. You are the chosen one.',
    check: (c) => c >= 100,
  },
  {
    id: 'five_hundred_chores',
    name: 'Floor Warrior',
    emoji: '⚔️',
    description: '500 chores. Seek help. Seek glory.',
    check: (c) => c >= 500,
  },
  {
    id: 'streak_3',
    name: 'Consistent-ish',
    emoji: '🔥',
    description: '3-day streak. Barely counts. We\'ll take it.',
    check: (_, s) => s >= 3,
  },
  {
    id: 'streak_7',
    name: 'Floor Whisperer',
    emoji: '✨',
    description: '7-day streak. The floors speak to you now.',
    check: (_, s) => s >= 7,
  },
  {
    id: 'streak_30',
    name: 'Couch Potato Slayer',
    emoji: '🥔💀',
    description: '30-day streak. You are a monster. In the best way.',
    check: (_, s) => s >= 30,
  },
  {
    id: 'points_100',
    name: 'Point Hoarder',
    emoji: '💰',
    description: '100 points earned. Flaunt it.',
    check: (_, __, p) => p >= 100,
  },
  {
    id: 'points_500',
    name: 'Legend of the Mop',
    emoji: '🧹👑',
    description: '500 points. An absolute unit.',
    check: (_, __, p) => p >= 500,
  },
];

export function calculateBadges(
  completions: Completion[],
  streak: number,
  totalPoints: number
): Badge[] {
  const count = completions.length;
  const earned: Badge[] = [];

  // Sort completions by date to find when each badge was earned
  const sorted = [...completions].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  for (const def of BADGE_DEFS) {
    // Find the completion that pushed over the threshold
    let earnedAt: string | undefined;

    if (def.check(count, streak, totalPoints)) {
      // Approximate earned date: find the Nth completion where threshold was crossed
      if (def.id.startsWith('streak_')) {
        earnedAt = sorted[sorted.length - 1]?.completedAt;
      } else if (def.id.startsWith('points_')) {
        let running = 0;
        for (const c of sorted) {
          running += c.pointsEarned;
          if (running >= totalPoints && def.check(0, 0, running)) {
            earnedAt = c.completedAt;
            break;
          }
        }
        earnedAt = earnedAt ?? sorted[sorted.length - 1]?.completedAt;
      } else {
        const thresholds: Record<string, number> = {
          first_chore: 1, ten_chores: 10, fifty_chores: 50,
          hundred_chores: 100, five_hundred_chores: 500,
        };
        const threshold = thresholds[def.id] ?? 1;
        earnedAt = sorted[threshold - 1]?.completedAt;
      }

      earned.push({ id: def.id, name: def.name, emoji: def.emoji, description: def.description, earnedAt });
    }
  }

  return earned;
}

export function getAllBadgeDefs(): Omit<BadgeDef, 'check'>[] {
  return BADGE_DEFS.map(({ id, name, emoji, description }) => ({ id, name, emoji, description }));
}
