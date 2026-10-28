import { ROSTER, type CharacterId } from "./catalog";
import {
  legalLoanTeam,
  loanUnit,
  stableSeed,
  weeklyEnemies,
} from "./adventure";
import type { Loadout } from "./balance";

/** The daily adventure resets at midnight in Vietnam, independent of browser locale. */
export function challengeDay(now = Date.now()) {
  return new Date(now + 7 * 3_600_000).toISOString().slice(0, 10);
}
export function challengeEnds(now = Date.now()) {
  return Date.parse(`${challengeDay(now)}T00:00:00+07:00`) + 86_400_000;
}
export function dailyPool(day = challengeDay()): CharacterId[] {
  const sorted = ROSTER.slice().sort(
    (a, b) =>
      stableSeed(`${day}:${a.id}`) - stableSeed(`${day}:${b.id}`) ||
      a.id.localeCompare(b.id),
  );
  // Include several roles in every rotation; all cards are loaned at Lv.10.
  const selected = new Set<CharacterId>();
  for (const role of new Set(ROSTER.map((c) => c.roleClass))) {
    const c = sorted.find((c) => c.roleClass === role);
    if (c && selected.size < 9) selected.add(c.id as CharacterId);
  }
  for (const c of sorted) {
    if (selected.size === 9) break;
    selected.add(c.id as CharacterId);
  }
  return [...selected];
}
export function legalDailyTeam(raw: unknown, day = challengeDay()): Loadout[] {
  const team = legalLoanTeam(raw),
    pool = dailyPool(day);
  if (team.some((u) => !pool.includes(u.characterId!)))
    throw Error("Chỉ được chọn nhân vật trong pool hôm nay.");
  return team;
}
export const dailyEnemies = (day: string, index: number) =>
  weeklyEnemies(`daily:${day}`, index);
export const defaultDailyTeam = (day = challengeDay()) =>
  dailyPool(day)
    .slice(0, 3)
    .map((id) => loanUnit(id));
export interface DailyChallengeProgress {
  day: string;
  selected: number;
  teams: Record<string, Loadout[]>;
}
export function validDailyProgress(v: DailyChallengeProgress) {
  if (
    !v ||
    !/^\d{4}-\d{2}-\d{2}$/.test(v.day) ||
    !Number.isInteger(v.selected) ||
    v.selected < 0 ||
    v.selected > 2 ||
    !v.teams ||
    typeof v.teams !== "object" ||
    Array.isArray(v.teams) ||
    Object.keys(v.teams).length > 3
  )
    return false;
  try {
    return Object.entries(v.teams).every(
      ([id, units]) =>
        ["0", "1", "2"].includes(id) &&
        JSON.stringify(legalDailyTeam(units, v.day)) === JSON.stringify(units),
    );
  } catch {
    return false;
  }
}
