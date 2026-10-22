import type { BattleState, Fighter } from "./types";
import { LEGENDARY_IDENTITIES } from "../../shared/src/character-abilities";

export const isRanged = (f: Fighter) => {
  const style = LEGENDARY_IDENTITIES[f.characterId || ""]?.base || f.classId;
  return style === "ranger" || style === "frost";
};

// Rendering, clashes and damage must agree on the same physical weapon.
export function weaponCount(f: Fighter) {
  return f.characterId
    ? 1
    : f.classId === "assassin" || f.classId === "berserker"
      ? 2
      : 1;
}

export function weaponReach(s: BattleState, f: Fighter) {
  return (
    f.stats.reach +
    (!f.characterId && f.superUntil > s.tick && f.classId === "swordsman"
      ? 1800
      : 0)
  );
}

export const RANGED_ATTACK_RANGE = 240;
export const RANGED_SKILL_RANGE = 260;
export const RANGED_SUPER_RANGE = 300;
