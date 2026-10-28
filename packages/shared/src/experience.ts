import { character, CATALOG_ITEMS, type CharacterId } from "./catalog";
import type { Loadout } from "./balance";
import { validRun, type RoguelikeRun, type RunEnd } from "./roguelike";
import {
  validDailyProgress,
  type DailyChallengeProgress,
} from "./daily-challenges";
import {
  validMasterySelections,
  validateMasteryTeam,
  masteryUnlocked,
  masteryInfo,
  type MasterySelection,
} from "./mastery";

export interface CollectionProfile {
  cards: { characterId: CharacterId; level: number; xp: number }[];
  itemCards: { itemId: string; level: number; xp: number }[];
  team: CharacterId[];
  equipment: Record<string, string[]>;
  experience?: Experience;
}
export interface TeamPreset {
  masteries?: Record<string, MasterySelection>;
  id: string;
  name: string;
  team: CharacterId[];
  equipment: Record<string, string[]>;
}
export interface Expedition {
  masteries?: Record<string, MasterySelection>;
  id: string;
  seed: number;
  round: number;
  lives: number;
  wins: number;
  team: CharacterId[];
  equipment: Record<string, string[]>;
  route: "safe" | "hard";
  drafted: string[];
  results: boolean[];
  hardWins?: number;
}
export interface Experience {
  dailyChallenge?: DailyChallengeProgress;
  roguelike?: RoguelikeRun;
  lastRun?: RunEnd;
  roguelikeDay?: string;
  roguelikeBest?: number;
  masteryNotices?: string[];
  masteries?: Record<string, MasterySelection>;
  presets: TeamPreset[];
  locked: string[];
  medals: Record<string, number>;
  mastery: Record<string, number>;
  tutorial: number[];
  titles: string[];
  activeTitle: string;
  expedition?: Expedition;
  expeditionDay?: string;
  expeditionBest?: number;
  expeditionHardBest?: number;
}
export function experienceOf(profile: { experience?: Experience }): Experience {
  return {
    presets: [],
    locked: [],
    medals: {},
    mastery: {},
    tutorial: [],
    titles: [],
    activeTitle: "",
    ...profile.experience,
  };
}
export function presetMissing(profile: CollectionProfile, preset: TeamPreset) {
  return [
    ...preset.team
      .filter((id) => !profile.cards.some((c) => c.characterId === id))
      .map((id) => character(id)?.name || id),
    ...Object.values(preset.equipment)
      .flat()
      .filter((id) => !profile.itemCards.some((c) => c.itemId === id))
      .map((id) => CATALOG_ITEMS.find((c) => c.id === id)?.name || id),
  ];
}
export function applyPreset<T extends CollectionProfile>(
  profile: T,
  preset: TeamPreset,
): T {
  const missing = presetMissing(profile, preset);
  if (missing.length)
    throw Error(
      `Preset thiếu: ${missing.join(", ")}. Chọn thẻ thay thế trong Kho đồ rồi lưu lại.`,
    );
  if (
    preset.team.length < 1 ||
    preset.team.length > 3 ||
    new Set(preset.team).size !== preset.team.length
  )
    throw Error("Đội hình cần 1–3 nhân vật khác nhau.");
  const assigned = new Set<string>(),
    equipment: Record<string, string[]> = {};
  for (const id of preset.team) {
    const items = preset.equipment[id] || [];
    if (items.length > 1 || items.some((item) => assigned.has(item)))
      throw Error("Mỗi vật phẩm chỉ thuộc một nhân vật.");
    if (items.length) {
      equipment[id] = [...items];
      assigned.add(items[0]);
    }
  }
  const exp = experienceOf(profile),
    masteries = preset.masteries || exp.masteries || {};
  for (const id of preset.team)
    if (masteries[id] && !masteryUnlocked(profile, id, masteries[id].id))
      throw Error("Bí kỹ trong đội lưu chưa được mở khóa.");
  const next = {
    ...profile,
    team: [...preset.team],
    equipment,
    experience: { ...exp, masteries },
  };
  validateMasteryTeam(profileLoadouts(next));
  return next;
}
export function profileLoadouts(profile: CollectionProfile): Loadout[] {
  return profile.team.map((id) => ({
    masteryId: profile.experience?.masteries?.[id]?.id,
    masteryTarget: profile.experience?.masteries?.[id]?.target,
    characterId: id,
    classId: character(id)!.base as Loadout["classId"],
    level: profile.cards.find((c) => c.characterId === id)?.level || 1,
    weaponRank: 1,
    equipment: [...(profile.equipment[id] || [])],
    equipmentLevels: Object.fromEntries(
      (profile.equipment[id] || []).map((item) => [
        item,
        profile.itemCards.find((c) => c.itemId === item)?.level || 1,
      ]),
    ),
  }));
}
export function toggleLock<T extends CollectionProfile>(
  profile: T,
  key: string,
): T {
  const experience = experienceOf(profile);
  return {
    ...profile,
    experience: {
      ...experience,
      locked: experience.locked.includes(key)
        ? experience.locked.filter((k) => k !== key)
        : [...experience.locked, key],
    },
  };
}
export function validExperience(raw: unknown): raw is Experience {
  if (!raw || typeof raw !== "object") return false;
  const value = raw as Experience;
  const stringList = (v: unknown, max: number) =>
    Array.isArray(v) &&
    v.length <= max &&
    v.every((x) => typeof x === "string" && x.length <= 100);
  const counters = (v: unknown) =>
    !!v &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    Object.keys(v).length <= 600 &&
    Object.entries(v).every(
      ([k, n]) =>
        k.length <= 100 && Number.isSafeInteger(n) && n >= 0 && n <= 1_000_000,
    );
  return (
    (value.dailyChallenge === undefined ||
      validDailyProgress(value.dailyChallenge)) &&
    (value.roguelike === undefined || validRun(value.roguelike)) &&
    (value.roguelikeDay === undefined ||
      /^\d{4}-\d{2}-\d{2}$/.test(value.roguelikeDay)) &&
    (value.roguelikeBest === undefined ||
      (Number.isInteger(value.roguelikeBest) &&
        value.roguelikeBest >= 0 &&
        value.roguelikeBest <= 12)) &&
    (value.lastRun === undefined ||
      (!!value.lastRun &&
        typeof value.lastRun.id === "string" &&
        value.lastRun.id.length <= 100 &&
        Number.isInteger(value.lastRun.floor) &&
        value.lastRun.floor >= 0 &&
        value.lastRun.floor <= 12 &&
        Number.isInteger(value.lastRun.wins) &&
        value.lastRun.wins >= 0 &&
        value.lastRun.wins <= 12 &&
        typeof value.lastRun.won === "boolean" &&
        ["clear", "defeat", "abandon"].includes(value.lastRun.reason))) &&
    (value.masteryNotices === undefined ||
      (stringList(value.masteryNotices, 99) &&
        value.masteryNotices.every((id) => !!masteryInfo(id)))) &&
    (value.masteries === undefined ||
      validMasterySelections(value.masteries)) &&
    Array.isArray(value.presets) &&
    value.presets.length <= 5 &&
    new Set(value.presets.map((p) => p?.id)).size === value.presets.length &&
    value.presets.every(
      (p) =>
        p &&
        typeof p.id === "string" &&
        p.id.length > 0 &&
        p.id.length <= 100 &&
        typeof p.name === "string" &&
        p.name.length <= 40 &&
        Array.isArray(p.team) &&
        p.team.length >= 1 &&
        p.team.length <= 3 &&
        p.team.every((id) => !!character(id)) &&
        new Set(p.team).size === p.team.length &&
        (p.masteries === undefined || validMasterySelections(p.masteries)) &&
        !!p.equipment &&
        Object.entries(p.equipment).length <= 3 &&
        Object.entries(p.equipment).every(
          ([id, items]) =>
            p.team.includes(id as CharacterId) &&
            Array.isArray(items) &&
            items.length <= 1 &&
            items.every((item) => CATALOG_ITEMS.some((c) => c.id === item)),
        ),
    ) &&
    stringList(value.locked, 66) &&
    counters(value.medals) &&
    counters(value.mastery) &&
    Array.isArray(value.tutorial) &&
    value.tutorial.length <= 3 &&
    value.tutorial.every((n) => [0, 1, 2].includes(n)) &&
    stringList(value.titles, 100) &&
    typeof value.activeTitle === "string" &&
    (value.expeditionDay === undefined ||
      /^\d{4}-\d{2}-\d{2}$/.test(value.expeditionDay)) &&
    [value.expeditionBest, value.expeditionHardBest].every(
      (v) => v === undefined || (Number.isInteger(v) && v >= 0 && v <= 6),
    ) &&
    value.activeTitle.length <= 100 &&
    (value.expedition === undefined ||
      (!!value.expedition &&
        typeof value.expedition === "object" &&
        validExpedition(value.expedition)))
  );
}
function validExpedition(v: Expedition) {
  return (
    (v.masteries === undefined || validMasterySelections(v.masteries)) &&
    typeof v.id === "string" &&
    v.id.length <= 100 &&
    Number.isInteger(v.seed) &&
    Number.isInteger(v.round) &&
    v.round >= 0 &&
    v.round <= 6 &&
    Number.isInteger(v.lives) &&
    v.lives >= 0 &&
    v.lives <= 3 &&
    Number.isInteger(v.wins) &&
    v.wins >= 0 &&
    v.wins <= 6 &&
    (v.hardWins === undefined ||
      (Number.isInteger(v.hardWins) &&
        v.hardWins >= 0 &&
        v.hardWins <= v.wins)) &&
    ["safe", "hard"].includes(v.route) &&
    Array.isArray(v.team) &&
    v.team.length <= 3 &&
    new Set(v.team).size === v.team.length &&
    v.team.every((id) => !!character(id)) &&
    Array.isArray(v.drafted) &&
    v.drafted.length <= 6 &&
    v.drafted.every(
      (id) => !!character(id) || CATALOG_ITEMS.some((c) => c.id === id),
    ) &&
    Array.isArray(v.results) &&
    v.results.length <= 6 &&
    v.results.every((n) => typeof n === "boolean") &&
    v.results.length === v.round &&
    v.results.filter(Boolean).length === v.wins &&
    3 - v.results.filter((n) => !n).length === v.lives &&
    v.drafted.length >= v.round &&
    v.drafted.length <= v.round + 1 &&
    !!v.equipment &&
    new Set(Object.values(v.equipment).flat()).size ===
      Object.values(v.equipment).flat().length &&
    Object.entries(v.equipment).every(
      ([id, items]) =>
        v.team.includes(id as CharacterId) &&
        Array.isArray(items) &&
        items.length <= 1 &&
        items.every((item) => CATALOG_ITEMS.some((c) => c.id === item)),
    )
  );
}
