import type { BattleState, Fighter } from "./types";
import { DIRECTIONS, div, UNIT } from "./math";
import { capsuleHit } from "./physics";

const CLASH_COOLDOWN = 12;
const CLASH_RADIUS = 650;

export function isClashProtected(f: Fighter, tick: number) {
  return f.memory.clashTick === tick;
}

export function reverseWeaponSpin(f: Fighter, tick: number) {
  if (f.memory.spinFlipTick === tick) return;
  f.memory.spinFlipTick = tick;
  f.memory.spinDirection = -(f.memory.spinDirection || 1);
}

export function rotateWeaponAngle(f: Fighter, multiplier = 1) {
  const direction = f.memory.spinDirection || 1;
  f.angle = (f.angle + f.stats.rotation * multiplier * direction + 32) % 32;
}

function weaponCount(f: Fighter) {
  const number = Number(f.characterId?.slice(-2) || 0);
  return f.characterId
    ? [2, 7, 8].includes(number)
      ? 2
      : 1
    : f.classId === "assassin" || f.classId === "berserker"
      ? 2
      : 1;
}

function weaponReach(s: BattleState, f: Fighter) {
  const number = Number(f.characterId?.slice(-2) || 0);
  if (f.characterId)
    return div(
      f.stats.reach *
        (f.superUntil > s.tick &&
        (number === 2 || (number === 12 && (f.memory.swordHits || 0) < 3))
          ? 125
          : 100),
      100,
    );
  return (
    f.stats.reach +
    (f.superUntil > s.tick && f.classId === "swordsman" ? 1800 : 0)
  );
}

function segment(f: Fighter, weapon: number, reach: number) {
  const [dx, dy] = DIRECTIONS[(f.angle + weapon * 16) % 32];
  return {
    ax: f.x + div(dx * f.radius, UNIT),
    ay: f.y + div(dy * f.radius, UNIT),
    bx: f.x + div(dx * reach, UNIT),
    by: f.y + div(dy * reach, UNIT),
  };
}

function orientation(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
) {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

function onSegment(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  px: number,
  py: number,
) {
  return (
    px >= Math.min(ax, bx) &&
    px <= Math.max(ax, bx) &&
    py >= Math.min(ay, by) &&
    py <= Math.max(ay, by)
  );
}

function segmentsTouch(
  a: ReturnType<typeof segment>,
  b: ReturnType<typeof segment>,
) {
  const o1 = orientation(a.ax, a.ay, a.bx, a.by, b.ax, b.ay),
    o2 = orientation(a.ax, a.ay, a.bx, a.by, b.bx, b.by),
    o3 = orientation(b.ax, b.ay, b.bx, b.by, a.ax, a.ay),
    o4 = orientation(b.ax, b.ay, b.bx, b.by, a.bx, a.by);
  if (
    ((o1 < 0 && o2 > 0) || (o1 > 0 && o2 < 0)) &&
    ((o3 < 0 && o4 > 0) || (o3 > 0 && o4 < 0))
  )
    return true;
  if (o1 === 0 && onSegment(a.ax, a.ay, a.bx, a.by, b.ax, b.ay)) return true;
  if (o2 === 0 && onSegment(a.ax, a.ay, a.bx, a.by, b.bx, b.by)) return true;
  if (o3 === 0 && onSegment(b.ax, b.ay, b.bx, b.by, a.ax, a.ay)) return true;
  if (o4 === 0 && onSegment(b.ax, b.ay, b.bx, b.by, a.bx, a.by)) return true;
  return (
    capsuleHit(a.ax, a.ay, a.bx, a.by, b.ax, b.ay, CLASH_RADIUS) ||
    capsuleHit(a.ax, a.ay, a.bx, a.by, b.bx, b.by, CLASH_RADIUS) ||
    capsuleHit(b.ax, b.ay, b.bx, b.by, a.ax, a.ay, CLASH_RADIUS) ||
    capsuleHit(b.ax, b.ay, b.bx, b.by, a.bx, a.by, CLASH_RADIUS)
  );
}

export function resolveWeaponClashes(s: BattleState) {
  for (let i = 0; i < s.fighters.length; i++) {
    const a = s.fighters[i];
    if (a.hp <= 0) continue;
    for (let j = i + 1; j < s.fighters.length; j++) {
      const b = s.fighters[j];
      if (b.hp <= 0 || a.team === b.team) continue;
      const key = `clash:${b.id}`;
      if ((a.cooldowns[key] || 0) > s.tick) continue;
      let touched = false;
      for (let aw = 0; aw < weaponCount(a) && !touched; aw++) {
        const as = segment(a, aw, weaponReach(s, a));
        for (let bw = 0; bw < weaponCount(b); bw++) {
          if (segmentsTouch(as, segment(b, bw, weaponReach(s, b)))) {
            touched = true;
            break;
          }
        }
      }
      if (!touched) continue;
      a.cooldowns[key] = s.tick + CLASH_COOLDOWN;
      b.cooldowns[`clash:${a.id}`] = s.tick + CLASH_COOLDOWN;
      const firstClashA = !isClashProtected(a, s.tick),
        firstClashB = !isClashProtected(b, s.tick);
      a.memory.clashTick = s.tick;
      b.memory.clashTick = s.tick;
      if (firstClashA) {
        reverseWeaponSpin(a, s.tick);
        a.angle = (a.angle + 16) % 32;
        a.facing *= -1;
      }
      if (firstClashB) {
        reverseWeaponSpin(b, s.tick);
        b.angle = (b.angle + 16) % 32;
        b.facing *= -1;
      }
      s.events.push({
        tick: s.tick,
        type: "clash",
        source: a.id,
        target: b.id,
        amount: 0,
        x: div(a.x + b.x, 2),
        y: div(a.y + b.y, 2),
      });
    }
  }
  s.events = s.events.slice(-120);
}
