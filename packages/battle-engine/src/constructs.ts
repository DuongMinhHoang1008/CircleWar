import type { BattleState, Construct, Fighter, Projectile } from "./types";
import {
  collide,
  constrain,
  pairs,
  capsuleHit,
  type CollisionBody,
} from "./physics";
import { safeBounds } from "./bounds";
import { div, normalize, UNIT, DIRECTIONS } from "./math";

export type CombatTarget = Fighter | Construct;
export const CONSTRUCT_BALANCE = {
  minion: {
    speed: 440,
    mass: 85,
    bounce: 110,
    hpPercent: 12,
    damagePercent: 25,
    minHp: 35,
  },
  giant: {
    speed: 360,
    mass: 200,
    bounce: 105,
    hpPercent: 60,
    damagePercent: 70,
    minHp: 35,
  },
  turret: {
    speed: 0,
    mass: 250,
    bounce: 100,
    hpPercent: 35,
    damagePercent: 45,
    minHp: 20,
  },
} as const;
export const isConstruct = (target: CombatTarget): target is Construct =>
  "owner" in target;
export const targetTeam = (s: BattleState, target: CombatTarget) =>
  isConstruct(target) ? s.fighters[target.owner]?.team : target.team;
export const combatTargets = (s: BattleState): CombatTarget[] => [
  ...s.fighters.filter((f) => f.hp > 0),
  ...s.constructs.filter(
    (c) => c.hp > 0 && c.until > s.tick && s.fighters[c.owner],
  ),
];

export function nearestOpponent(
  s: BattleState,
  source: { x: number; y: number },
  team: string,
  range: number,
) {
  let target: CombatTarget | undefined,
    best = range * range;
  for (const other of combatTargets(s)) {
    if (other === source || targetTeam(s, other) === team) continue;
    const distance = (other.x - source.x) ** 2 + (other.y - source.y) ** 2;
    if (distance < best) {
      best = distance;
      target = other;
    }
  }
  return target;
}

export function moveConstructs(s: BattleState) {
  for (const c of s.constructs) {
    const owner = s.fighters[c.owner];
    if (!owner || c.until <= s.tick) {
      c.hp = 0;
      continue;
    }
    if (c.hp <= 0) continue;
    if (c.kind === "turret") {
      c.vx = c.vy = 0;
      continue;
    } else if (!c.vx && !c.vy) {
      // A deterministic launch also restores old checkpoints with stationary summons.
      const d = DIRECTIONS[(c.id * 7 + c.owner * 3) % 32];
      const speed = CONSTRUCT_BALANCE[c.kind].speed;
      c.vx = div(d[0] * speed, UNIT);
      c.vy = div(d[1] * speed, UNIT);
    }
    c.x += c.vx;
    c.y += c.vy;
  }
}

export function resolveConstructCollisions(s: BattleState) {
  const constructs = s.constructs.filter(
    (c) => c.hp > 0 && c.until > s.tick && s.fighters[c.owner],
  );
  if (!constructs.length) return;
  const bodies = constructs.map(
    (c) =>
      ({
        ...c,
        fixed: c.kind === "turret",
        vx: c.kind === "turret" ? 0 : c.vx,
        vy: c.kind === "turret" ? 0 : c.vy,
        id: s.fighters.length + c.id,
        stats: {
          ...CONSTRUCT_BALANCE[c.kind],
        },
      }) satisfies CollisionBody,
  );
  const all: CollisionBody[] = [...s.fighters, ...bodies];
  const bounds = safeBounds(s);
  for (let pass = 0; pass < 3; pass++) {
    for (const [a, b] of pairs(all)) collide(all[a], all[b]);
    for (let i = 0; i < all.length; i++)
      if (all[i].hp > 0 && !all[i].fixed)
        constrain(
          all[i],
          s.config.width,
          s.config.height,
          bounds.left,
          bounds.top,
          i < s.fighters.length ||
            constructs[i - s.fighters.length].kind !== "turret",
        );
  }
  bodies.forEach((body, i) =>
    Object.assign(constructs[i], {
      x: body.x,
      y: body.y,
      vx: body.vx,
      vy: body.vy,
    }),
  );
}

/** Stable spatial ordering lets a nearer character block a shot aimed at a summon. */
export function projectileTargets(
  s: BattleState,
  p: Projectile,
  ox: number,
  oy: number,
) {
  return combatTargets(s).sort(
    (a, b) =>
      (a.x - ox) * p.vx +
      (a.y - oy) * p.vy -
      ((b.x - ox) * p.vx + (b.y - oy) * p.vy),
  );
}

export function hitConstruct(
  s: BattleState,
  source: Fighter,
  target: Construct,
  damage: number,
  push = 180,
) {
  const dealt = Math.min(target.hp, Math.max(1, damage));
  target.hp -= dealt;
  const [dx, dy] = normalize(target.x - source.x, target.y - source.y);
  if (target.kind !== "turret") {
    target.vx += div(dx * push, UNIT);
    target.vy += div(dy * push, UNIT);
  }
  s.events.push({
    tick: s.tick,
    type: "kit:construct-hit",
    source: source.id,
    target: target.owner,
    amount: target.id,
    x: target.x,
    y: target.y,
  });
  return dealt;
}

export function projectileHitsConstruct(
  s: BattleState,
  f: Fighter,
  c: Construct,
  p: Projectile,
  ox: number,
  oy: number,
) {
  return (
    c.hp > 0 &&
    targetTeam(s, c) !== f.team &&
    capsuleHit(ox, oy, p.x, p.y, c.x, c.y, c.radius + (p.radius || 450))
  );
}
