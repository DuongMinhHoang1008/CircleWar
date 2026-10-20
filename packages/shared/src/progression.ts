export const CARD_MAX_LEVEL = 10;
export const DUPLICATE_CARD_XP = 150;
export const PACK_CAPACITY = 100;

/** Daily quests roll over at 00:00 UTC so clients and the room server agree. */
export function dailyQuestDay(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10);
}

/** EXP needed to move from the supplied level to the next one. */
export function xpForNextLevel(level: number) {
  if (level >= CARD_MAX_LEVEL) return 0;
  const current = Math.max(1, level);
  return Math.round(150 * current ** 1.5);
}

export function addCardXp(card: { level: number; xp: number }, gained: number) {
  let level = card.level;
  let xp = card.xp + gained;
  while (level < CARD_MAX_LEVEL && xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level++;
  }
  return { level, xp: level >= CARD_MAX_LEVEL ? 0 : xp };
}

/** A card carries its earned EXP when used as training material. */
export function cardTotalXp(card: { level: number; xp: number }) {
  let total = card.xp + xpForNextLevel(card.level);
  for (let level = 1; level < card.level; level++)
    total += xpForNextLevel(level);
  return total;
}

export function cardEvolution(baseTier: string | number, level: number) {
  const base =
    typeof baseTier === "number"
      ? Math.max(1, Math.min(4, baseTier + 1))
      : Math.max(1, Math.min(4, Number(baseTier.replace(/^T/, "")) || 1));
  if (level >= 10) return { tier: "GOD", tierIndex: 5, evolved: base < 5 };
  const steps = level >= 7 ? 2 : level >= 3 ? 1 : 0;
  const tierIndex = Math.min(5, base + steps);
  return {
    tier: tierIndex === 5 ? "GOD" : `T${tierIndex}`,
    tierIndex,
    evolved: tierIndex > base,
  };
}

/** Small rarity-based power steps; leveling and evolution use the same tier shown on the card. */
export function cardRarityMultiplier(baseTier: string | number, level: number) {
  // Progress within a rarity adds at most 6%; no extra lifetime-level budget.
  const current = Math.max(1, level);
  const tier = cardEvolution(baseTier, current).tierIndex;
  let first = current, last = current;
  for (let l = 1; l <= CARD_MAX_LEVEL; l++) {
    if (cardEvolution(baseTier, l).tierIndex !== tier) continue;
    first = Math.min(first, l);
    last = Math.max(last, l);
  }
  const progress =
    tier === 5
      ? (current - 3) / 7
      : last > first
        ? (current - first) / (last - first)
        : 0;
  return 1 + (tier - 1) * 0.18 + Math.max(0, Math.min(1, progress)) * 0.06;
}

/** Number of tier steps this card has gained over its printed tier. */
export function cardEvolutionSteps(baseTier: string | number, level: number) {
  // Progression power comes from level milestones, not the card's printed
  // rarity. Otherwise low-rarity cards gain more power at the same level.
  void baseTier;
  return level >= 10 ? 3 : level >= 7 ? 2 : level >= 3 ? 1 : 0;
}
