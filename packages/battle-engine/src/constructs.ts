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
import { masteryShield } from "./mastery";

export type CombatTarget = Fighter | Construct;
export const CONSTRUCT_BALANCE = {
  minion: {
    speed: 480,
    mass: 85,
    bounce: 110,
    hpPercent: 15,
    damagePercent: 35,
    minHp: 42,
  },
  giant: {
    speed: 360,
    mass: 200,
    bounce: 105,
    hpPercent: 70,
    damagePercent: 90,
    minHp: 35,
  },
  turret: {
    speed: 0,
    mass: 250,
    bounce: 100,
    hpPercent: 40,
    damagePercent: 50,
    minHp: 20,
  },
} as const;
export const isConstruct = (target: CombatTarget): target is Construct =>
  "owner" in target;
export const targetTeam = (s: BattleState, target: CombatTarget) =>
  isConstruct(target) ? s.fighters[target.owner]?.team : target.team;
export function constructMotion(c: Construct) {
  const base=CONSTRUCT_BALANCE[c.kind];
  return {...base, speed:c.variant==="ram"?650:c.variant==="drone"?360:c.variant==="medic"?420:c.variant==="bulwark"?340:base.speed, mass:c.variant==="bulwark"?230:base.mass};
}
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
    }
    let destination: {x:number;y:number}|undefined;
    const allies=s.fighters.filter(f=>f.hp>0&&f.team===owner.team&&f!==owner)
      .sort((a,b)=>a.hp*b.stats.hp-b.hp*a.stats.hp||a.id-b.id);
    if(c.variant==="medic") destination=allies.find(f=>f.hp<f.stats.hp)||(!c.upgrade?nearestOpponent(s,c,owner.team,100000):owner.hp>0?owner:allies[0]);
    else if(c.variant==="drone") destination=owner.hp>0?owner:allies[0];
    else if(c.variant==="bodyguard") destination=s.fighters.find(f=>f.id===c.anchor&&f.hp>0)||(owner.hp>0?owner:allies[0]);
    else if(c.variant==="hunter") destination=nearestOpponent(s,c,owner.team,100000);
    else if(c.variant==="bulwark") {
      const enemy=nearestOpponent(s,owner,owner.team,100000);
      if(enemy) { const [dx,dy]=normalize(enemy.x-owner.x,enemy.y-owner.y);destination={x:owner.x+div(dx*4500,UNIT),y:owner.y+div(dy*4500,UNIT)}; }
    }
    if(destination) {
      const [dx,dy]=normalize(destination.x-c.x,destination.y-c.y);
      const distance=(destination.x-c.x)**2+(destination.y-c.y)**2;
      const stop=c.variant==="drone"?6500:c.variant==="bodyguard"?3000:1500;
      const speed=distance<stop*stop?0:constructMotion(c).speed;
      c.vx=div(dx*speed,UNIT);c.vy=div(dy*speed,UNIT);
    } else if(c.variant==="medic") c.vx=c.vy=0;
    else if (!c.vx && !c.vy) {
      // A deterministic launch also restores old checkpoints with stationary summons.
      const d = DIRECTIONS[(c.id * 7 + c.owner * 3) % 32];
      const speed = constructMotion(c).speed;
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
          ...constructMotion(c),
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
  if (damage <= 0) return 0;
  const dealt = Math.min(target.hp, Math.max(1, damage));
  target.hp -= dealt;
  const owner = s.fighters[target.owner];
  if (
    dealt > 0 &&
    !target.hp &&
    target.kind === "minion" &&
    owner?.hp > 0 &&
    owner.masteryId === "giftShield" && target.variant === "medic" &&
    source.team !== owner.team &&
    (owner.memory.masteryGiftShield || 0) <= s.tick
  ) {
    const ally = s.fighters
      .filter(
        (f) =>
          f !== owner &&
          f.hp > 0 &&
          f.team === owner.team &&
          (f.x - target.x) ** 2 + (f.y - target.y) ** 2 <= 12000 ** 2,
      )
      .sort(
        (a, b) =>
          (a.x - target.x) ** 2 +
            (a.y - target.y) ** 2 -
            ((b.x - target.x) ** 2 + (b.y - target.y) ** 2) || a.id - b.id,
      )[0];
    if (ally) {
      masteryShield(s, owner, ally, Math.min(60,div(owner.baseStats.hp * 3, 100)), 90);
      owner.memory.masteryGiftShield = s.tick + 240;
    }
  }
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
