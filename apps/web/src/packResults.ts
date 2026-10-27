import { character, itemInfo } from "../../../packages/shared/src/catalog";
import { cardEvolution } from "../../../packages/shared/src/progression";

interface Pull {
  id: string;
  kind: string;
  tier: string;
  rarity: string;
  level?: number;
  batchCount?: number;
  baseTier?: string;
  evolvedTier?: string;
}

const labels: Record<string, string> = {
  RAC: "Rác",
  T1: "Thường",
  T2: "Hiếm",
  T3: "Sử thi",
  T4: "Huyền thoại",
  GOD: "GOD",
};
const ranks: Record<string, number> = {
  RAC: 0,
  T1: 1,
  T2: 2,
  T3: 3,
  T4: 4,
  GOD: 5,
};

export function packBaseTier(
  pull: Pick<Pull, "kind" | "id" | "tier" | "baseTier">,
) {
  const base =
    pull.kind === "character"
      ? character(pull.id)?.tier
      : itemInfo(pull.id)?.rarity;
  return typeof base === "number"
    ? `T${Math.min(4, base + 1)}`
    : base || pull.baseTier || pull.tier;
}

/** Also repairs saved reveals whose tier used to contain the inventory evolution. */
export function normalizePackResult<T extends Pull>(
  pull: T,
): T & Pick<Pull, "baseTier" | "evolvedTier"> {
  // The training evolution celebration is a separate flow from opening a pack.
  if (pull.batchCount === 0) return pull;
  const tier = packBaseTier(pull);
  return {
    ...pull,
    tier,
    baseTier: tier,
    rarity: labels[tier] || pull.rarity,
    evolvedTier:
      pull.evolvedTier ||
      (pull.level ? cardEvolution(tier, pull.level).tier : pull.tier),
  };
}

export function comparePackResults(a: Pull, b: Pull) {
  return (
    (ranks[packBaseTier(b)] || 0) - (ranks[packBaseTier(a)] || 0) ||
    a.id.localeCompare(b.id)
  );
}
