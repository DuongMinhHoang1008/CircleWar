import {
  BONDS,
  FRIEND_GROUPS,
  CATALOG_ITEMS,
  groupTier,
  type CharacterId,
} from "./catalog";
import { CHARACTER_BALANCE } from "./combat-balance";

export const CAMPAIGN_TACTICS = [
  {
    id: "rush",
    core: [
      "char_04",
      "char_08",
      "char_12",
      "char_17",
      "char_23",
      "char_26",
      "char_27",
    ],
    partners: [
      "char_01",
      "char_10",
      "char_11",
      "char_15",
      "char_19",
      "char_22",
    ],
    gear: ["item_06", "item_16", "item_10", "item_04"],
  },
  {
    id: "bunkers",
    core: ["char_05", "char_14"],
    partners: [
      "char_06",
      "char_15",
      "char_16",
      "char_20",
      "char_21",
      "char_24",
      "char_29",
    ],
    gear: ["item_26", "item_21", "item_12", "item_22"],
  },
  {
    id: "control",
    core: ["char_07", "char_09", "char_16", "char_24", "char_26", "char_32"],
    partners: [
      "char_03",
      "char_05",
      "char_06",
      "char_14",
      "char_18",
      "char_21",
    ],
    gear: ["item_21", "item_09", "item_26", "item_15"],
  },
  {
    id: "damage-over-time",
    core: ["char_08", "char_18", "char_27", "char_31"],
    partners: [
      "char_02",
      "char_13",
      "char_16",
      "char_19",
      "char_32",
      "char_33",
    ],
    gear: ["item_25", "item_14", "item_27", "item_06"],
  },
  {
    id: "anti-heal",
    core: ["char_02", "char_13"],
    partners: [
      "char_03",
      "char_07",
      "char_08",
      "char_12",
      "char_15",
      "char_22",
      "char_25",
      "char_31",
    ],
    gear: ["item_16", "item_10", "item_06", "item_31"],
  },
  {
    id: "support-carry",
    core: ["char_06", "char_11", "char_19", "char_20", "char_22"],
    partners: [
      "char_02",
      "char_04",
      "char_08",
      "char_12",
      "char_13",
      "char_17",
      "char_23",
      "char_26",
      "char_27",
    ],
    gear: ["item_21", "item_20", "item_12", "item_16"],
  },
  {
    id: "displacement",
    core: ["char_04", "char_10", "char_21", "char_26"],
    partners: [
      "char_05",
      "char_07",
      "char_12",
      "char_15",
      "char_16",
      "char_23",
      "char_28",
      "char_32",
    ],
    gear: ["item_22", "item_11", "item_06", "item_21"],
  },
  {
    id: "machines",
    core: ["char_28", "char_29", "char_30", "char_31"],
    partners: [
      "char_06",
      "char_11",
      "char_14",
      "char_15",
      "char_19",
      "char_22",
      "char_23",
      "char_25",
      "char_32",
      "char_33",
    ],
    gear: ["item_26", "item_31", "item_22", "item_12"],
  },
] as const;
export type CampaignTacticId = (typeof CAMPAIGN_TACTICS)[number]["id"];
type Tactic = (typeof CAMPAIGN_TACTICS)[number];
const includes = (list: readonly string[], id: string) => list.includes(id);

// Preserve complete kit combinations that even sampling of the large pool can miss.
export const CAMPAIGN_FORMATIONS: CharacterId[][] = [
  ["char_04", "char_12", "char_17"],
  ["char_08", "char_23", "char_22"],
  ["char_05", "char_14", "char_15"],
  ["char_05", "char_16", "char_21"],
  ["char_07", "char_16", "char_32"],
  ["char_09", "char_16", "char_05"],
  ["char_08", "char_18", "char_27"],
  ["char_27", "char_31", "char_16"],
  ["char_02", "char_13", "char_31"],
  ["char_02", "char_07", "char_15"],
  ["char_06", "char_11", "char_23"],
  ["char_22", "char_17", "char_23"],
  ["char_04", "char_21", "char_26"],
  ["char_21", "char_23", "char_15"],
  ["char_28", "char_29", "char_30"],
  ["char_29", "char_30", "char_22"],
];

/** Rank complementary kits and real links, not inflated stats or printed rarity. */
export function campaignCoherence(ids: readonly CharacterId[], tactic: Tactic) {
  const core = ids.filter((id) => includes(tactic.core, id)).length;
  if (!core) return -Infinity;
  const partners = ids.filter((id) => includes(tactic.partners, id)).length;
  const bonds = BONDS.filter((bond) =>
    bond.members.every((id) => ids.includes(id as CharacterId)),
  ).length;
  const specificGroups = FRIEND_GROUPS.filter(
    (group) =>
      !["G10", "G11", "G12", "G13"].includes(group.id) &&
      groupTier(group, [...ids]) > 0,
  ).length;
  const roles = ids.map((id) => CHARACTER_BALANCE[id].role);
  let score =
    core * 5 +
    partners * 3 +
    bonds * 4 +
    specificGroups * 3 +
    new Set(roles).size;
  if (
    roles.includes("tank") &&
    (roles.includes("ranger") || roles.includes("assassin"))
  )
    score += 3;
  if (
    tactic.id === "bunkers" &&
    ids.includes("char_05") &&
    ids.includes("char_14")
  )
    score += 6;
  if (tactic.id === "support-carry")
    score += roles.some(
      (role) => role === "fighter" || role === "assassin" || role === "ranger",
    )
      ? 5
      : -8;
  // Avoid stacking three bodies that all depend on late healing; the bo now punishes this.
  if (
    ids.filter((id) =>
      ["char_01", "char_11", "char_20", "char_25", "char_33"].includes(id),
    ).length === 3
  )
    score -= 8;
  return score;
}

/** Preserve the signature when an encounter is truncated to one or two slots. */
export function orderCampaignTeam(
  ids: CharacterId[],
  tactic: Tactic,
  count: number,
  variation: number,
) {
  const leads = ids.filter((id) => includes(tactic.core, id));
  const lead = leads[variation % leads.length];
  const rest = ids
    .filter((id) => id !== lead)
    .sort((a, b) => {
      const score = (id: CharacterId) => campaignCoherence([lead, id], tactic);
      return score(b) - score(a) || a.localeCompare(b);
    });
  return [lead, ...rest].slice(0, count);
}

const SPECIAL_GEAR: Partial<Record<CharacterId, readonly string[]>> = {
  char_05: ["item_26", "item_10", "item_19"],
  char_14: ["item_06", "item_21", "item_26"],
  char_15: ["item_18", "item_22", "item_26"],
  char_17: ["item_04", "item_06", "item_16"],
  char_21: ["item_21", "item_22", "item_11"],
  char_23: ["item_23", "item_16", "item_26"],
  char_28: ["item_28"],
  char_29: ["item_29"],
  char_30: ["item_30"],
  char_31: ["item_31", "item_26", "item_22"],
  char_32: ["item_32", "item_26", "item_21"],
};

export function campaignGear(
  id: CharacterId,
  tactic: Tactic,
  stage: number,
  variation: number,
  used: Set<string>,
) {
  const affinity = CATALOG_ITEMS.find((item) => item.affinity === id)!.id;
  const specialized = SPECIAL_GEAR[id];
  // Keep the three transformation builds intact once every slot has equipment.
  const form = ["char_28", "char_29", "char_30"].includes(id) && stage >= 21;
  const choices = form
    ? [affinity]
    : stage < 21
      ? [affinity, ...tactic.gear]
      : specialized
        ? [...specialized, affinity, ...tactic.gear]
        : [affinity, ...tactic.gear];
  const preferred =
    form || stage < 31 ? 0 : variation % Math.min(2, choices.length);
  const ordered = [...choices.slice(preferred), ...choices.slice(0, preferred)];
  const gear = ordered.find((item) => !used.has(item)) || affinity;
  used.add(gear);
  return gear;
}
