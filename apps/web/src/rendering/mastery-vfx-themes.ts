import {
  MASTERIES,
  type MasteryDefinition,
} from "../../../../packages/shared/src/mastery";
import type { CharacterId } from "../../../../packages/shared/src/catalog";
import { masteryUpgrade } from "../../../../packages/shared/src/mastery-upgrades";

export interface MasteryVfxTheme {
  color: string;
  light: string;
  accent: string;
  motif: string;
  /** Original vector emblem in a 40x40 local space, centred on zero. */
  glyph: string;
}
const theme = (
  color: string,
  accent: string,
  motif: string,
  glyph: string,
): MasteryVfxTheme => ({ color, light: "#fff5d8", accent, motif, glyph });
export const MASTERY_VFX_THEMES: Record<CharacterId, MasteryVfxTheme> = {
  char_01: theme(
    "#ff9b43",
    "#ffe78e",
    "claws",
    '<path d="M-15 13Q-10-11-2-16L-7 14M-2 17Q2-9 10-15L7 16M10 15Q15-3 20-7L17 13"/>',
  ),
  char_02: theme(
    "#ff8dc6",
    "#b7f4ff",
    "hearts",
    '<path d="M0 17C-29-1-13-24 0-8C13-24 29-1 0 17Z"/><path d="M-18 8Q0-3 18 8"/>',
  ),
  char_03: theme(
    "#be82ff",
    "#a6f68d",
    "grapes",
    '<g><circle cx="-7" cy="-5" r="7"/><circle cx="7" cy="-5" r="7"/><circle cy="7" r="8"/></g><path d="M1-12Q7-26 17-17Q12-10 1-12Z"/>',
  ),
  char_04: theme(
    "#68e9f3",
    "#cfffb1",
    "feathers",
    '<path d="M-20 8Q1-22 20-9Q4-12-4 4Q7-4 20 3Q5 19-18 12M-16 17L15-13"/>',
  ),
  char_05: theme(
    "#6cdeff",
    "#ff87db",
    "optic",
    '<circle r="13"/><path d="M-20 0H20M0-20V20M-10-10L-17-17M10 10L19 19"/><circle r="4"/>',
  ),
  char_06: theme(
    "#ff8ecb",
    "#83f5e7",
    "prism",
    '<path d="M0-20L19 13H-19ZM0-20L-6 13M0-20L7 13M-16 4H16"/><path d="M-19 15H19"/>',
  ),
  char_07: theme(
    "#f9a0cb",
    "#bbb9ff",
    "sonar",
    '<path d="M-6-11Q-16 0-6 11M-13-18Q-29 0-13 18M6-11Q16 0 6 11M13-18Q29 0 13 18"/><ellipse rx="4" ry="9"/>',
  ),
  char_08: theme(
    "#b49dff",
    "#ff789c",
    "moon",
    '<path d="M10-19C-17-27-29 9-6 19C3 23 14 18 19 8C-2 17-13-8 10-19Z"/><path d="M-8 9L-4 17L0 8M3 6L8 14L10 3"/>',
  ),
  char_09: theme(
    "#ffc36c",
    "#ff7772",
    "deadline",
    '<path d="M-15-19H10L17-12V19H-15ZM9-19V-10H17M-9-4H9M-9 3H4M-8 12L-3 16L9 6"/>',
  ),
  char_10: theme(
    "#f5c45e",
    "#a1edba",
    "tread",
    '<circle r="17"/><circle r="9"/><path d="M-5-16L2-10M9-13L10-5M16-3L10 3M12 11L4 10M-3 16L-7 10M-15 7L-10 0M-13-10L-5-8"/>',
  ),
  char_11: theme(
    "#ffe17c",
    "#ff837b",
    "pennant",
    '<path d="M-10 20V-19H17L8-9L17 1H-10M-18 20H2"/><path d="M-4-11H7"/>',
  ),
  char_12: theme(
    "#d7e7ff",
    "#829dff",
    "katana",
    '<path d="M-16 17L9-16L19-20L17-10L-10 20M-12 7L0 17M-15 17L-20 23"/><path d="M-9 11L15-15"/>',
  ),
  char_13: theme(
    "#ff93ac",
    "#a8f79e",
    "citrus",
    '<circle r="17"/><path d="M0-17V17M-15-8L15 8M-15 8L15-8"/><circle r="4"/><path d="M0-18Q9-29 18-20Q10-14 0-18Z"/>',
  ),
  char_14: theme(
    "#ffd777",
    "#ff83a0",
    "gift",
    '<path d="M-17-7H17V17H-17ZM-20-13H20V-6H-20M0-13V17M0-13C-23-14-15-29-7-22L0-13C23-14 15-29 7-22Z"/>',
  ),
  char_15: theme(
    "#89d9ff",
    "#ffe49c",
    "shield",
    '<path d="M0-20L17-13V0Q16 14 0 23Q-16 14-17 0V-13ZM0-11L4-1L13 0L6 6L8 15L0 10L-8 15L-6 6L-13 0L-4-1Z"/>',
  ),
  char_16: theme(
    "#f38ee8",
    "#7deeff",
    "paint",
    '<path d="M-17 15L7-9L14-3L-10 20ZM7-9L14-21L22-13L14-3"/><path d="M-15 0Q-25-12-14-17Q-1-9-7 0ZM8 15Q12 6 17 12Q20 20 8 15Z"/>',
  ),
  char_17: theme(
    "#87eddf",
    "#ffe37e",
    "parcel",
    '<path d="M-12-11L3-19L18-11V8L3 17L-12 8ZM-12-11L3-2L18-11M3-2V17M-22-3H-16M-24 4H-17M-21 11H-15"/>',
  ),
  char_18: theme(
    "#ff9b58",
    "#fff09f",
    "steam",
    '<path d="M-20 0H20Q17 19 0 19Q-17 19-20 0ZM-14-4Q-20-11-12-18M0-5Q-7-14 1-23M13-5Q8-12 15-18M-22 2H22"/>',
  ),
  char_19: theme(
    "#ff7b83",
    "#ffe593",
    "envelope",
    '<path d="M-17-15H17V20H-17ZM-17-15L0-2L17-15M-17 20L-5 4M17 20L5 4"/><circle cy="6" r="6"/>',
  ),
  char_20: theme(
    "#ff8bb9",
    "#a1e6a6",
    "rose",
    '<path d="M0-17C-16-24-21-6-8 1C-24 12-6 25 2 12C14 26 26 7 13-1C28-12 10-25 0-17ZM0-9C-13-10-9 8 2 7C16 7 11-11 0-9Z"/><path d="M-1 13L-4 24L9 19"/>',
  ),
  char_21: theme(
    "#9af4fc",
    "#a9baff",
    "pressure",
    '<path d="M-22-12Q-2-29 13-12M-24 1Q0-19 22 1M-20 14Q0-3 18 14M-11 20H11"/><path d="M12-17L22-14L17-6"/>',
  ),
  char_22: theme(
    "#c8a5ff",
    "#9afff3",
    "aura",
    '<path d="M0-23L20 0L0 23L-20 0ZM0-23V23M-20 0H20M-9-12L9 12M9-12L-9 12"/>',
  ),
  char_23: theme(
    "#ffdb7f",
    "#f4f4ff",
    "crown",
    '<path d="M-20-9L-12 13H12L20-9L7-1L0-20L-7-1ZM-12 18H12"/><path d="M-4 10L4 10"/>',
  ),
  char_24: theme(
    "#efdc9c",
    "#b6b3eb",
    "calligraphy",
    '<path d="M-18-12Q-7-21 9-14M-16-1Q0-9 18-2M-11 12Q0 2 15 13M1-21Q-6 0-3 22M-14 19Q8 12 19 18"/>',
  ),
  char_25: theme(
    "#ffdc73",
    "#97f6c2",
    "coin",
    '<circle r="19"/><circle r="13"/><path d="M-5-7H5V7H-5ZM-19 19L-7 12L5 17L21 6M14 5L21 6L19 13"/>',
  ),
  char_26: theme(
    "#6df2e8",
    "#c4a1ff",
    "equalizer",
    '<path d="M-19 9V-5M-11 16V-15M-3 9V-21M5 20V-13M13 11V-4M21 6V-17"/><path d="M-18 22Q2 13 22 21"/>',
  ),
  char_27: theme(
    "#ff8651",
    "#ffe37b",
    "flame",
    '<path d="M0-25C9-9 25-3 14 16C2 32-22 16-16 1C-7 12-4-7 0-25ZM0-1C-12 15 5 25 10 12C4 15 6 5 0-1Z"/>',
  ),
  char_28: theme(
    "#ff8883",
    "#ffd680",
    "scrap",
    '<path d="M-9-21L3-18L6-10L18-7L22 7L12 10L9 22L-5 19L-9 10L-20 7L-22-6L-11-9ZM-5-6H7V6H-5Z"/><path d="M-15-17L-9-9M11 10L18 17"/>',
  ),
  char_29: theme(
    "#6fefff",
    "#ff8ade",
    "pixel",
    '<path d="M-18-18H-6V-6H-18ZM5-13H19V1H5ZM-8 7H7V22H-8ZM-21 2H-14V9H-21ZM14 12H22V20H14Z"/><path d="M-5-1L5 7"/>',
  ),
  char_30: theme(
    "#fff084",
    "#ff9bdf",
    "balloon",
    '<path d="M0 8C-23-4-17-25 0-20C17-25 23-4 0 8ZM-4 12H4L0 7ZM0 13Q-11 19 1 24"/><path d="M-21-9L-27-14M19 4L25 8"/>',
  ),
  char_31: theme(
    "#d8f881",
    "#ff9c78",
    "radiation",
    '<circle r="4"/><path d="M-5-7L-12-19A22 22 0 0 1 12-19L5-7ZM8 0L22-1A22 22 0 0 1 11 19L4 8ZM-8 0L-22-1A22 22 0 0 0-11 19L-4 8Z"/>',
  ),
  char_32: theme(
    "#b1f39b",
    "#ffe9a1",
    "honeycomb",
    '<path d="M-12 16Q-22-3-7-17Q7-29 17-10Q22 5 5 21ZM-9-6L-3-10L3-6V1L-3 5L-9 1ZM4 4L10 0L16 4V11L10 15L4 11Z"/>',
  ),
  char_33: theme(
    "#ffd182",
    "#ffa37e",
    "drumstick",
    '<path d="M-8 4C-24-12-8-27 5-16C22-19 27-1 9 9L1 11ZM-8 4L-19 15Q-28 9-28 18Q-28 27-19 23Q-13 30-9 22L1 11"/><path d="M-6-12L0-7M4-9L10-4"/>',
  ),
};
const legacyPatterns: Record<string, string> = {
  tigerBurst: "charge",
  tigerCalm: "cleanse",
  tigerGuard: "guard",
  flagShield: "fortify",
  flagParalyze: "sonar",
  flagFocus: "focus",
  fruitOverflow: "bloom",
  fruitCleanse: "cleanse",
  fruitSupply: "harvest",
  giftTank: "bulwark",
  giftShield: "medic",
  giftEscort: "guard",
  roseFollow: "tether",
  roseWall: "vine",
  roseLink: "constellation",
  auraEcho: "echo",
  auraAnchor: "anchor",
  auraEnergy: "surge",
};
export function masteryVfxPattern(skill: MasteryDefinition) {
  const upgrade=masteryUpgrade(skill.id);
  if(upgrade)return upgrade.pattern;
  return skill.form
    ? skill.form.kind === "super" && skill.form.variant
      ? skill.form.variant
      : skill.form.pattern
    : legacyPatterns[skill.id];
}
export const MASTERY_VFX_DEFINITIONS = MASTERIES.map((skill) => ({
  id: skill.id,
  characterId: skill.characterId as CharacterId,
  name: skill.name,
  branch: [3, 8, 15].indexOf(skill.goal),
  pattern: masteryVfxPattern(skill),
  theme: MASTERY_VFX_THEMES[skill.characterId as CharacterId],
}));
const definitionsById = new Map(MASTERY_VFX_DEFINITIONS.map((d) => [d.id, d]));
export const masteryVfxDefinition = (id?: string) =>
  id ? definitionsById.get(id) : undefined;
