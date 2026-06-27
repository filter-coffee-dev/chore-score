interface TauntSet {
  youAheadBig: string[];
  youAheadSmall: string[];
  partnerAheadBig: string[];
  partnerAheadSmall: string[];
  tied: string[];
}

const TAUNTS: TauntSet = {
  youAheadBig: [
    "You're winning so hard it's almost sad. Almost. 🏆",
    "At this rate your partner might as well be furniture. 🛋️",
    "Champion. Absolute champion. Where's the trophy? Oh right, it's the clean house.",
    "Your partner is being carried harder than the laundry. 💪",
    "A legend. An icon. A person who does chores. 🌟",
  ],
  youAheadSmall: [
    "Leading by a little. Don't get cocky — the dishes are watching. 👀",
    "Barely ahead. Stay vigilant. Laziness is contagious.",
    "You're winning. For now. 😏",
    "Small lead. Big responsibility. Medium motivation. 🤷",
  ],
  partnerAheadBig: [
    "Your partner is carrying this household on their back. Comfy back there? 🛋️",
    "You haven't touched a mop in days. Your partner has opinions about this.",
    "Impressive dedication to doing absolutely nothing. Truly elite laziness. 🏆",
    "The gap is getting embarrassing. Like, really embarrassing. 😬",
    "Your partner called. They want their fairness back.",
  ],
  partnerAheadSmall: [
    "Slightly behind. The laundry is right there. Just saying. 👀",
    "You're losing by a little. A little is still losing. ⚠️",
    "Close race! Your partner is pulling ahead. Time to vacuum something. Anything.",
    "Just a few points back. The dishes won't do themselves. Unfortunately. 🍽️",
  ],
  tied: [
    "Neck and neck! This is the riveting content we came for. 🍿",
    "You're both equally chaotic. Beautiful.",
    "A perfect tie. Both of you are mediocre. In a loving way.",
    "The chore battle rages on. Nobody wins. Everyone cleans. 🧹",
    "Perfectly balanced, as all chores should be. ⚖️",
  ],
};

export function pickTaunt(myScore: number, partnerScore: number): string {
  const diff = myScore - partnerScore;
  let pool: string[];

  if (diff === 0) {
    pool = TAUNTS.tied;
  } else if (diff > 30) {
    pool = TAUNTS.youAheadBig;
  } else if (diff > 0) {
    pool = TAUNTS.youAheadSmall;
  } else if (diff < -30) {
    pool = TAUNTS.partnerAheadBig;
  } else {
    pool = TAUNTS.partnerAheadSmall;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}
