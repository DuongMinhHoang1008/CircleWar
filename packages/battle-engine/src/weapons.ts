import type { BattleState, Fighter } from "./types";
import { characterKit } from "../../shared/src/character-kits";
import { DIRECTIONS, div, UNIT } from "./math";
import { capsuleHit } from "./physics";
import {
  combatTargets,
  targetTeam,
  isConstruct,
  type CombatTarget,
} from "./constructs";

export const isRanged = (f: Fighter) => {
  const kit = characterKit(f.characterId, f.equipment);
  if (kit) return kit.ranged;
  const style = f.classId;
  return style === "ranger" || style === "frost";
};

// Rendering, clashes and damage must agree on the same physical weapon.
export function weaponCount(f: Fighter) {
  if (f.characterId === "char_15" || f.characterId === "char_33") return 2;
  return f.characterId
    ? 1
    : f.classId === "assassin" || f.classId === "berserker"
      ? 2
      : 1;
}

export function weaponReach(s: BattleState, f: Fighter, weapon = 0) {
  if (f.characterId === "char_15" && weapon === 1) return f.radius + 2600;
  return (
    f.stats.reach +
    (!f.characterId && f.superUntil > s.tick && f.classId === "swordsman"
      ? 1800
      : 0)
  );
}

export const RANGED_ATTACK_RANGE = 240;

/** Test every discrete heading swept this tick; shots keep that weapon heading. */
export function alignedRangedTarget(
  s: BattleState,
  f: Fighter,
  range = RANGED_ATTACK_RANGE,
  allowAllies = false,
) {
  const steps = f.memory.spinSteps || 0,
    direction = f.memory.spinDirection || 1;
  const previous = f.memory.previousAngle ?? f.angle;
  for (let step = steps ? 1 : 0; step <= steps; step++) {
    const angle = (previous + step * direction + 64) % 32;
    const d = DIRECTIONS[angle];
    let target: CombatTarget | undefined,
      closest = Infinity;
    for (const other of combatTargets(s)) {
      if (
        other.hp <= 0 ||
        other === f ||
        (targetTeam(s, other) === f.team &&
          (!allowAllies || isConstruct(other)))
      )
        continue;
      const dx = other.x - f.x,
        dy = other.y - f.y,
        distance = dx * dx + dy * dy;
      if (
        distance > (range * 100) ** 2 ||
        dx * d[0] + dy * d[1] <= 0 ||
        distance >= closest
      )
        continue;
      if (
        capsuleHit(
          f.x,
          f.y,
          f.x + div(d[0] * range * 100, UNIT),
          f.y + div(d[1] * range * 100, UNIT),
          other.x,
          other.y,
          other.radius + 450,
        )
      ) {
        target = other;
        closest = distance;
      }
    }
    if (target) {
      f.memory.shotAngle = angle;
      return target;
    }
  }
  return undefined;
}
