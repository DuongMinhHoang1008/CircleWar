export type PackKind = "normal" | "boss";
export const PACK_ODDS = {
  normal: { T1: 84, T2: 14, T3: 1.7, T4: 0.3 },
  boss: { T1: 66, T2: 14, T3: 17, T4: 3 },
} as const;

/** Pity belongs to normal packs only; boss draws never advance/reset it. */
export function packTier(kind: PackKind, roll: number, sinceRare = 0) {
  if (kind === "normal" && sinceRare >= 19)
    return roll < 85 ? "T2" : roll < 98 ? "T3" : "T4";
  const odds = PACK_ODDS[kind];
  return roll < odds.T1
    ? "T1"
    : roll < odds.T1 + odds.T2
      ? "T2"
      : roll < 100 - odds.T4
        ? "T3"
        : "T4";
}

/** Exhausted rarity pools fall upward first; max-level cards never consume a pack. */
export function packPool<T extends { tier: string }>(
  available: T[],
  tier: string,
  guaranteedHigh = false,
) {
  const rank = (t: string) =>
    t === "RAC" ? 1 : Number(t.replace("T", "")) || 1;
  if (!available.length) return [];
  const ranks = available.map((c) => rank(c.tier));
  const requested = rank(tier);
  const picked = guaranteedHigh
    ? Math.max(...ranks)
    : ranks.includes(requested)
      ? requested
      : Math.min(...ranks.filter((r) => r > requested), Infinity);
  const actual = Number.isFinite(picked) ? picked : Math.max(...ranks);
  return available.filter((c) => rank(c.tier) === actual);
}
