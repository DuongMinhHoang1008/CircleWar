import { characterKit, kitGrowth } from "../../shared/src/character-kits";
import { DIRECTIONS, div, normalize, random, UNIT } from "./math";
import { safeBounds } from "./bounds";
import { capsuleHit } from "./physics";
import { applyStatus, statusPower, type StatusKind } from "./statuses";
import { alignedRangedTarget } from "./weapons";
import {
  CONSTRUCT_BALANCE,
  nearestOpponent,
  isConstruct,
  projectileTargets,
  projectileHitsConstruct,
  hitConstruct,
} from "./constructs";
import { reverseWeaponSpin } from "./weapon-clash";
import { recordEffectTick } from "./metrics";
import type {
  BattleState,
  Fighter,
  Projectile,
  Zone,
  Construct,
} from "./types";

/** The kit layer depends on combat operations, never on renderer or room code. */
export interface KitCombatServices {
  damage(
    s: BattleState,
    source: Fighter,
    target: Fighter,
    raw: number,
    friendly?: boolean,
  ): number;
  normal(
    s: BattleState,
    source: Fighter,
    target: Fighter,
    scale: number,
    knock?: number,
  ): boolean;
  heal(
    s: BattleState,
    source: Fighter,
    target: Fighter,
    amount: number,
  ): number;
  shield(
    s: BattleState,
    source: Fighter,
    target: Fighter,
    amount: number,
    duration: number,
  ): void;
  buff(
    s: BattleState,
    target: Fighter,
    kind: string,
    value: number,
    duration: number,
    source?: number,
  ): void;
}
const id = (f: Fighter) => characterKit(f.characterId, f.equipment)?.id;
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const within = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  radius: number,
) => distance(a, b) <= (radius * 100) ** 2;
const chance = (s: BattleState, percent: number) => random(s) % 100 < percent;
const growth = (s: BattleState, f: Fighter) =>
  kitGrowth(f, f.hp > 0 ? s.tick : Math.max(0, f.deadAt));
const active = (s: BattleState, f: Fighter) => f.superUntil > s.tick;
const event = (
  s: BattleState,
  f: Fighter,
  type: string,
  target = f,
  amount = 0,
) =>
  s.events.push({
    tick: s.tick,
    type,
    source: f.id,
    target: target.id,
    amount,
  });
const harmful: readonly StatusKind[] = [
  "burn",
  "poison",
  "frozen",
  "paralyzed",
  "diabetes",
  "myopia",
  "bleeding",
  "pressure",
];

export function kitTarget(
  s: BattleState,
  f: Fighter,
  range = 350,
  allies = false,
) {
  let best: Fighter | undefined,
    nearest = (range * 100) ** 2;
  for (const other of s.fighters) {
    if (
      other.hp <= 0 ||
      other === f ||
      (allies ? other.team !== f.team : other.team === f.team)
    )
      continue;
    const d = distance(f, other);
    if (d < nearest || (d === nearest && other.id < (best?.id ?? Infinity))) {
      best = other;
      nearest = d;
    }
  }
  return best;
}
export function kitAim(
  f: { x: number; y: number },
  target: { x: number; y: number },
) {
  const [x, y] = normalize(target.x - f.x, target.y - f.y);
  let angle = 0,
    best = -Infinity;
  for (let i = 0; i < 32; i++) {
    const d = DIRECTIONS[i],
      dot = x * d[0] + y * d[1];
    if (dot > best) {
      best = dot;
      angle = i;
    }
  }
  return angle;
}
export function kitRange(s: BattleState, f: Fighter) {
  return div(
    240 * growth(s, f).range * (100 - statusPower(f, "myopia", s.tick)),
    10000,
  );
}

function emit(
  s: BattleState,
  f: Fighter,
  angle: number,
  kind: NonNullable<Projectile["kit"]>,
  power = 100,
  options: Partial<Projectile> = {},
) {
  if (s.projectiles.length >= 240) return undefined;
  const ownLimit = kind === "balloon" ? 12 : kind === "chicken" ? 2 : 18;
  let count = 0;
  for (const p of s.projectiles)
    if (
      p.owner === f.id &&
      p.life > 0 &&
      ((kind !== "balloon" && kind !== "chicken") || p.kit === kind)
    )
      count++;
  if (count >= ownLimit) return undefined;
  const d = DIRECTIONS[(angle + 64) % 32],
    g = growth(s, f);
  const speed =
    kind === "balloon"
      ? options.homing
        ? 950
        : 320
      : id(f) === "wacom"
        ? 1500
        : div(1000 * g.projectileSpeed, 100);
  const p: Projectile = {
    id: s.nextProjectile++,
    owner: f.id,
    x: f.x + div(d[0] * (f.radius + 500), UNIT),
    y: f.y + div(d[1] * (f.radius + 500), UNIT),
    vx: div(d[0] * speed, UNIT),
    vy: div(d[1] * speed, UNIT),
    life: Math.max(12, div(kitRange(s, f) * 100, speed)),
    pierce: 0,
    hit: [],
    kit: kind,
    normal: false,
    power,
    age: 0,
    radius: 450,
    onHitReady: {},
    ...options,
  };
  s.projectiles.push(p);
  event(s, f, `kit:shot:${kind}`);
  return p;
}

function field(
  s: BattleState,
  f: Fighter,
  kind: NonNullable<Zone["kit"]>,
  x: number,
  y: number,
  radius: number,
  duration: number,
  power: number,
  options: Partial<Zone> = {},
) {
  const limit =
    kind === "rose"
      ? options.super
        ? 6
        : 4
      : kind === "fruit"
        ? options.super
          ? 8
          : 3
        : kind === "flag" || kind === "slipper"
          ? options.super
            ? 6
            : 3
          : kind === "deadline"
            ? 5
            : 1;
  let count = 0,
    oldest: Zone | undefined;
  for (const z of s.zones)
    if (
      z.owner === f.id &&
      z.kit === kind &&
      !!z.super === !!options.super &&
      z.until > s.tick
    ) {
      count++;
      if (!oldest || z.until < oldest.until) oldest = z;
    }
  if (count >= limit && oldest) oldest.until = s.tick;
  if (s.zones.length >= 120) {
    const expired = s.zones.findIndex((z) => z.until <= s.tick);
    if (expired < 0) return false;
    s.zones.splice(expired, 1);
  }
  const bounds = safeBounds(s),
    start = s.tick + (options.start ?? 0);
  s.zones.push({
    owner: f.id,
    kit: kind,
    x: Math.max(bounds.left + 1000, Math.min(bounds.right - 1000, x)),
    y: Math.max(bounds.top + 1000, Math.min(bounds.bottom - 1000, y)),
    radius,
    until: start + duration,
    every: 30,
    power,
    ...options,
    start,
  });
  event(s, f, `kit:field:${kind}`);
  return true;
}
function randomDebuff(
  s: BattleState,
  f: Fighter,
  target: Fighter,
  friendly = false,
) {
  const kind = harmful[random(s) % harmful.length];
  applyStatus(s, f, target, kind, undefined, 60, friendly);
}
function gift(
  s: BattleState,
  f: Fighter,
  target: Fighter,
  ctx: KitCombatServices,
  strong = false,
) {
  if (target.team === f.team) {
    applyStatus(s, f, target, "rage", strong ? 16 : 8, 60);
    applyStatus(s, f, target, "blessing", strong ? 5 : 3, 60);
  } else randomDebuff(s, f, target);
}

export function kitKnockback(s: BattleState, f: Fighter) {
  const name = id(f),
    g = growth(s, f);
  return name === "char_04"
    ? active(s, f)
      ? 900
      : div(300 * g.knockback, 100)
    : name === "char_21"
      ? div(320 * g.knockback, 100)
      : name === "char_26"
        ? 230
        : 150;
}
export function kitImpulse(source: Fighter, target: Fighter, force: number) {
  const [dx, dy] = normalize(target.x - source.x, target.y - source.y);
  target.memory.impulseX = Math.max(
    -1100,
    Math.min(1100, (target.memory.impulseX || 0) + div(dx * force, UNIT)),
  );
  target.memory.impulseY = Math.max(
    -1100,
    Math.min(1100, (target.memory.impulseY || 0) + div(dy * force, UNIT)),
  );
}
export function kitIncoming(
  s: BattleState,
  source: Fighter,
  target: Fighter,
  raw: number,
) {
  if ((target.memory.evadeUntil || 0) > s.tick) {
    event(s, target, "kit:dodge", source);
    return 0;
  }
  if (
    id(target) === "char_07" &&
    source !== target &&
    (target.memory.dodgeReady || 0) <= s.tick &&
    chance(s, growth(s, target).chance)
  ) {
    target.memory.dodgeReady = s.tick + 45;
    target.memory.fleeUntil = s.tick + 45;
    const [dx, dy] = normalize(target.x - source.x, target.y - source.y);
    target.vx = div(dx * target.stats.speed, UNIT);
    target.vy = div(dy * target.stats.speed, UNIT);
    event(s, target, "kit:dodge", source);
    return 0;
  }
  raw = div(raw * (100 - statusPower(target, "introvert", s.tick)), 100);
  if (id(target) === "char_08" && active(s, target)) raw = div(raw * 120, 100);
  return raw;
}

/** Mutates only this tick's derived stats; never the loadout baseline. */
export function applyKitStats(s: BattleState, f: Fighter) {
  const name = id(f),
    g = growth(s, f),
    live = active(s, f);
  let spin = g.spin;
  if (name === "char_12") spin = div(spin * (live ? 300 : 135), 100);
  if (name === "char_02" && live) spin *= 2;
  if (name === "char_04" && live) spin *= 3;
  if (name === "char_08" && live) spin = div(spin * 120, 100);
  if (name === "char_17" && live) spin = div(spin * 135, 100);
  f.memory.spinRate = Math.min(400, spin);
  if ((name === "char_08" && live) || (name === "char_27" && live)) {
    f.stats.attack = Math.min(
      300,
      div(f.stats.attack * (name === "char_08" ? 130 : 145), 100),
    );
    f.stats.speed = Math.min(900, div(f.stats.speed * 120, 100));
  }
  if ((f.memory.fleeUntil || 0) > s.tick)
    f.stats.speed = Math.min(900, div(f.stats.speed * 125, 100));
  if (name === "char_17" && live)
    f.stats.speed = Math.min(900, div(f.stats.speed * 145, 100));
  if (name === "char_10" && live)
    f.stats.speed = Math.min(900, div(f.stats.speed * 170, 100));
  if (name === "wacom")
    f.stats.cooldown = Math.ceil((f.stats.cooldown * 130) / 100);
  if (name === "char_27" && live)
    f.stats.cooldown = Math.max(8, div(f.stats.cooldown * 100, 140));
  if (name === "char_23")
    f.stats.reach = Math.min(
      11000,
      div(f.baseStats.reach * g.reach, 100) + (live ? 2600 : 0),
    );
  if (name === "char_18" && !f.boss) f.radius = 2150;
}
export function kitAura(s: BattleState, f: Fighter) {
  let strongest = 0;
  let giver: Fighter | undefined;
  for (const other of s.fighters)
    if (
      other !== f &&
      other.hp > 0 &&
      other.team === f.team &&
      other.characterId === "char_22"
    ) {
      const g = growth(s, other);
      if (within(other, f, div(160 * g.auraRange, 100)))
        if (div(12 * g.buffPower, 100) > strongest) {
          strongest = div(12 * g.buffPower, 100);
          giver = other;
        }
    }
  if (giver) recordEffectTick(s, giver, f, "aura:attack", "buff");
  return strongest;
}

function summon(s: BattleState, f: Fighter, kind: Construct["kind"]) {
  const limit = kind === "minion" ? 2 : 1;
  let count = 0,
    oldest: Construct | undefined;
  for (const c of s.constructs)
    if (c.owner === f.id && c.kind === kind && c.hp > 0 && c.until > s.tick) {
      count++;
      if (!oldest || c.until < oldest.until) oldest = c;
    }
  if (count >= limit && oldest) {
    oldest.hp = 0;
    oldest.until = s.tick;
  }
  if (s.constructs.filter((c) => c.hp > 0 && c.until > s.tick).length >= 64)
    return false;
  const g = growth(s, f),
    angle = (f.angle + 8 + count * 8) % 32,
    d = DIRECTIONS[angle];
  const summonStats = CONSTRUCT_BALANCE[kind];
  const hp = Math.max(
    summonStats.minHp,
    div(f.baseStats.hp * summonStats.hpPercent * g.summonHp, 10000),
  );
  const damage = Math.max(
    1,
    div(f.baseStats.attack * summonStats.damagePercent * g.summonDamage, 10000),
  );
  const bounds = safeBounds(s),
    radius = kind === "giant" ? 1900 : 1100;
  s.constructs.push({
    id: s.nextConstruct++,
    owner: f.id,
    kind,
    x: Math.max(
      bounds.left + radius,
      Math.min(bounds.right - radius, f.x + div(d[0] * 5000, UNIT)),
    ),
    y: Math.max(
      bounds.top + radius,
      Math.min(bounds.bottom - radius, f.y + div(d[1] * 5000, UNIT)),
    ),
    vx: div(d[0] * summonStats.speed, UNIT),
    vy: div(d[1] * summonStats.speed, UNIT),
    radius,
    hp,
    maxHp: hp,
    damage,
    until: s.tick + (kind === "turret" ? 240 : 300),
    nextAttack: s.tick + 20,
  });
  event(s, f, `kit:summon:${kind}`);
  return true;
}
export function kitNormalHit(
  s: BattleState,
  f: Fighter,
  target: Fighter,
  ctx: KitCombatServices,
) {
  const name = id(f),
    g = growth(s, f),
    proc = () => chance(s, g.chance);
  if (f.hp > 0 && name === "char_01" && proc())
    applyStatus(s, f, f, "introvert");
  if (name === "char_02" && (active(s, f) || proc()))
    applyStatus(s, f, target, "diabetes");
  if (name === "char_05" && proc()) applyStatus(s, f, target, "myopia");
  if (name === "char_06") applyStatus(s, f, target, "frozen", 15, 45);
  if (name === "char_08" && proc())
    applyStatus(s, f, target, "bleeding", 4, 90);
  if (name === "char_09" && proc())
    applyStatus(s, f, target, "paralyzed", 25, 60);
  if (
    f.hp > 0 &&
    name === "char_10" &&
    (f.memory.thinShieldReady || 0) <= s.tick &&
    proc()
  ) {
    f.memory.thinShieldReady = s.tick + 30;
    for (let layer = 0; layer < g.shieldCount; layer++)
      ctx.shield(s, f, f, Math.max(3, div(f.baseStats.hp * 4, 100)), 60);
  }
  if (name === "char_16" && proc()) applyStatus(s, f, target, "frozen", 20, 45);
  if (name === "char_18" && proc()) applyStatus(s, f, target, "burn", 5, 90);
  if (name === "char_24" && proc()) randomDebuff(s, f, target);
  if (name === "char_27") applyStatus(s, f, target, "burn", proc() ? 6 : 3, 90);
  if (name === "char_31" && proc())
    applyStatus(s, f, target, "radiation", 1, 90);
  if (f.hp <= 0) return;
  if (
    name === "char_28" &&
    chance(s, Math.max(3, div(15 * g.riskReduction, 100)))
  )
    directLoss(s, f, Math.max(1, div(f.stats.attack, 5)));
  if (name === "fu_di" && (f.memory.laserReady || 0) <= s.tick && proc()) {
    f.memory.laserReady = s.tick + 42;
    beam(s, f, target, 45, 12, 260, ctx);
  }

  if (name === "char_33" && (f.memory.chickenReady || 0) <= s.tick && proc()) {
    if (
      emit(s, f, kitAim(f, target), "chicken", 55, {
        life: 110,
        returnAfter: 20,
        heal: div(f.baseStats.hp * 2 * g.heal, 10000),
        pierce: 3,
      })
    )
      f.memory.chickenReady = s.tick + 75;
  }
}
function directLoss(s: BattleState, f: Fighter, amount: number) {
  if (f.hp <= 0) return;
  amount = Math.min(f.hp, amount);
  f.hp -= amount;
  f.taken += amount;
  event(s, f, "hit", f, amount);
  if (!f.hp) {
    f.deadAt = s.tick;
    event(s, f, "kill");
  }
}
function trade(
  s: BattleState,
  f: Fighter,
  ctx: KitCombatServices,
  profit: boolean,
) {
  const g = growth(s, f),
    swing = div((8 + (random(s) % 16)) * g.volatility, 100);
  const gain = profit || chance(s, 53) ? swing : -swing;
  const before = f.memory.assets ?? 100,
    assets = Math.max(0, Math.min(300, before + gain)),
    delta = assets - before;
  f.memory.assets = assets;
  if (delta >= 0)
    ctx.shield(s, f, f, Math.max(1, div(delta * f.baseStats.hp, 1000)), 900000);
  else directLoss(s, f, Math.max(1, div(-delta * f.baseStats.hp, 1000)));
  event(s, f, gain >= 0 ? "kit:profit" : "kit:loss", f, Math.abs(delta));
}
function beam(
  s: BattleState,
  f: Fighter,
  target: Fighter,
  power: number,
  width: number,
  range: number,
  ctx: KitCombatServices,
  rainbow = false,
) {
  const d = DIRECTIONS[kitAim(f, target)],
    ex = f.x + div(d[0] * range * 100, UNIT),
    ey = f.y + div(d[1] * range * 100, UNIT);
  for (const t of s.fighters) {
    if (
      t.hp <= 0 ||
      t === f ||
      !capsuleHit(f.x, f.y, ex, ey, t.x, t.y, t.radius + width * 50)
    )
      continue;
    if (t.team !== f.team)
      ctx.damage(
        s,
        f,
        t,
        div(f.stats.attack * power * f.stats.superPower, 10000),
      );
    else if (rainbow) gift(s, f, t, ctx, true);
  }
  for (const c of s.constructs)
    if (
      s.fighters[c.owner]?.team !== f.team &&
      c.hp > 0 &&
      capsuleHit(f.x, f.y, ex, ey, c.x, c.y, c.radius + width * 50)
    )
      c.hp = Math.max(0, c.hp - div(f.stats.attack * power, 100));
  s.events.push({
    tick: s.tick,
    type: "kit:beam",
    source: f.id,
    target: target.id,
    amount: width,
    x: ex,
    y: ey,
  });
}
function dash(
  s: BattleState,
  f: Fighter,
  target: Fighter,
  duration: number,
  speed: number,
) {
  const d = DIRECTIONS[kitAim(f, target)];
  f.vx = div(d[0] * f.stats.speed, UNIT);
  f.vy = div(d[1] * f.stats.speed, UNIT);
  f.memory.dash = s.tick + duration;
  f.memory.dashSteps = speed;
}

export function kitSuper(s: BattleState, f: Fighter, ctx: KitCombatServices) {
  const target = kitTarget(s, f, 10000),
    name = id(f),
    g = growth(s, f);
  if (!target || !name) return undefined;
  let duration = 90,
    success = true;
  const power = (value: number) => div(value * f.stats.superPower, 100);
  const shot = (
    kind: NonNullable<Projectile["kit"]>,
    value: number,
    options: Partial<Projectile> = {},
  ) =>
    !!emit(s, f, kitAim(f, target), kind, power(value), {
      kind: "super",
      superShot: true,
      life: 90,
      ...options,
    });
  const radial = (
    kind: NonNullable<Projectile["kit"]>,
    count: number,
    value: number,
    options: Partial<Projectile> = {},
  ) => {
    let fired = 0;
    for (let i = 0; i < count; i++)
      if (
        emit(s, f, div(i * 32, count), kind, power(value), {
          kind: "super",
          superShot: true,
          life: 70,
          ...options,
        })
      )
        fired++;
    return fired > 0;
  };
  switch (name) {
    case "char_01":
      dash(s, f, target, 36, 1300);
      f.memory.pounceUntil = s.tick + 36;
      f.memory.pounceSpent = 0;
      applyStatus(s, f, f, "introvert");
      duration = 60;
      break;
    case "char_02":
      break;
    case "char_03":
      success = shot("basket", 160, { bounces: g.bounces, radius: 1100 });
      break;
    case "char_04":
      break;
    case "char_05":
      success = summon(s, f, "turret");
      break;
    case "char_06":
      beam(s, f, target, 180, 45, 320, ctx, true);
      break;
    case "char_07":
      for (const t of s.fighters)
        if (t.hp > 0 && t.team !== f.team && within(f, t, 150)) {
          applyStatus(s, f, t, "stunned", 1, 15);
          applyStatus(s, f, t, "paralyzed", 25, 60);
        }
      break;
    case "char_08":
      duration = 120;
      break;
    case "char_09":
      for (let i = 0; i < 5; i++) {
        const d = DIRECTIONS[(f.angle + i * 6) % 32];
        field(
          s,
          f,
          "deadline",
          f.x + div(d[0] * 8000, UNIT),
          f.y + div(d[1] * 8000, UNIT),
          65,
          120,
          25,
          { allOthers: true, super: true },
        );
      }
      break;
    case "char_10":
      dash(s, f, target, 75, 1500);
      duration = 75;
      break;
    case "char_11":
      for (const t of s.fighters)
        if (t.hp > 0) {
          if (t.team === f.team) {
            applyStatus(s, f, t, "rage", 10, 90);
            applyStatus(s, f, t, "blessing", 3, 90);
            ctx.shield(s, f, t, Math.max(6, div(f.baseStats.hp * 5, 100)), 90);
            ctx.buff(s, t, "haste", 110, 90, -8100 - f.id);
          } else if (within(f, t, 180)) {
            applyStatus(s, f, t, "pressure", 20, 90);
            applyStatus(s, f, t, "paralyzed", 20, 60);
          }
        }
      break;
    case "char_12":
      dash(s, f, target, 75, 1200);
      duration = 75;
      break;
    case "char_13":
      for (let i = 0; i < 8; i++) {
        const d = DIRECTIONS[i * 4];
        field(
          s,
          f,
          "fruit",
          f.x + div(d[0] * 9000, UNIT),
          f.y + div(d[1] * 9000, UNIT),
          48,
          100,
          12,
          { super: true },
        );
      }
      break;
    case "char_14":
      success = summon(s, f, "giant");
      break;
    case "char_15":
      success = radial("shrapnel", 8, 90, { push: 350 });
      break;
    case "char_16":
      success = field(s, f, "paint", target.x, target.y, 150, 120, 35, {
        start: 15,
        super: true,
      });
      break;
    case "char_17":
      dash(s, f, target, 42, 1400);
      f.memory.evadeUntil = s.tick + 42;
      duration = 42;
      break;
    case "char_18":
      success = field(s, f, "soup", f.x, f.y, 125, 120, 30, {
        follow: true,
        super: true,
      });
      duration = 120;
      break;
    case "char_19":
      success = radial("envelope", 8, 65);
      break;
    case "char_20":
      for (let i = 0; i < 6; i++) {
        const d = DIRECTIONS[div(i * 32, 6)];
        field(
          s,
          f,
          "rose",
          target.x + div(d[0] * 6500, UNIT),
          target.y + div(d[1] * 6500, UNIT),
          60,
          div(120 * g.duration, 100),
          20,
          { super: true },
        );
      }
      break;
    case "char_21":
      success = radial("air", 8, 95, { push: 700 });
      if (success) ctx.shield(s, f, f, div(f.baseStats.hp * 10, 100), 90);
      break;
    case "char_22":
      for (const t of s.fighters)
        if (t.hp > 0 && t.team === f.team) {
          applyStatus(
            s,
            f,
            t,
            "rage",
            Math.min(40, div(20 * g.buffPower, 100)),
            90,
          );
          applyStatus(s, f, t, "blessing", 3, 90);
          ctx.buff(s, t, "haste", 110, 90, -8200 - f.id);
        }
      break;
    case "char_23":
      duration = 120;
      break;
    case "char_24":
      success = radial("randomInk", 12, 60);
      break;
    case "char_25":
      f.memory.nextStock = s.tick + 1;
      f.memory.stockWins = 4;
      applyStatus(s, f, f, "rage", 20, 120);
      duration = 120;
      break;
    case "char_26":
      success = field(s, f, "vortex", target.x, target.y, 160, 120, 30, {
        super: true,
      });
      break;
    case "char_27":
      applyStatus(s, f, f, "burn", 3, 120, true);
      duration = 120;
      break;
    case "char_28":
      beam(s, f, target, 200, 22, 300, ctx);
      applyStatus(s, f, f, "burn", 3, 90, true);
      break;
    case "fu_di":
      beam(s, f, target, 180, 45, 300, ctx);
      break;
    case "char_29":
      f.memory.burstLeft = 8;
      f.memory.burstReady = s.tick;
      break;
    case "wacom":
      f.memory.burstLeft = 8;
      f.memory.burstReady = s.tick;
      break;
    case "char_30":
      success = radial("balloon", 8, 90, {
        life: 90,
        radius: 1000,
        armedAfter: 15,
        friendlyScale: div(50 * g.selfRisk, 100),
        selfScale: div(50 * g.selfRisk, 100),
      });
      break;
    case "skyrocket":
      success = radial("balloon", 3, 60, {
        life: 120,
        radius: 1100,
        armedAfter: 8,
        homing: true,
        target: target.id,
      });
      break;
    case "char_31":
      success = shot("rocket", 190, {
        radius: 1400,
        friendlyScale: 50,
        selfScale: 50,
      });
      break;
    case "char_32":
      success = field(
        s,
        f,
        "slipper",
        target.x,
        target.y,
        div(175 * g.blastRadius, 100),
        120,
        div(30 * g.dot, 100),
        { start: 15, super: true },
      );
      break;
    case "char_33":
      success = shot("chicken", 125, {
        life: 130,
        returnAfter: 28,
        radius: 1500,
        pierce: 5,
        heal: div(f.baseStats.hp * 4 * g.heal, 10000),
      });
      break;
  }
  if (!success) return undefined;
  f.superUntil = s.tick + duration;
  event(s, f, `kit:super:${name}`, target);
  return target;
}

/** Returns false only when no eligible heading/slot exists; caller preserves cooldown. */
export function kitShoot(s: BattleState, f: Fighter) {
  const name = id(f),
    g = growth(s, f);
  if (
    name === "wacom" &&
    ((f.memory.burstLeft || 0) > 0 || (f.memory.burstReady || 0) > s.tick)
  )
    return false;
  const assist = name === "char_06" || name === "char_13";
  const target = alignedRangedTarget(s, f, kitRange(s, f), assist);
  if (!target) return false;
  const angle = f.memory.shotAngle;
  const options: Partial<Projectile> = { normal: true };
  let kind: NonNullable<Projectile["kit"]> = "bullet",
    power = 100;
  switch (name) {
    case "char_03":
      kind = "fruit";
      power = 90;
      options.bounces = g.bounces;
      options.life = 85;
      break;
    case "char_06":
      kind = "ribbon";
      options.pierce = 2;
      options.life = div(kitRange(s, f) * 100, 1000);
      options.radius = 700;
      break;
    case "char_09":
      kind = "deadline";
      break;
    case "char_13":
      kind = "buffFruit";
      options.pierce = 2;
      break;
    case "char_16":
      kind = "ink";
      break;
    case "char_20":
      kind = "rose";
      power = 60;
      break;
    case "char_21":
      kind = "air";
      options.push = kitKnockback(s, f);
      break;
    case "char_24":
      kind = "randomInk";
      break;
    case "char_29":
      kind = "wacom";
      power = 55;
      options.friendlyScale = div(35 * g.friendlySafety, 100);
      break;
    case "wacom":
      kind = "wacom";
      power = 60;
      options.pierce = 1;
      options.bounces = g.bounces;
      options.life = 70;
      break;
    case "char_30":
      kind = "balloon";
      options.life = 90;
      options.radius = 700;
      options.armedAfter = 12;
      options.friendlyScale = options.selfScale = div(40 * g.selfRisk, 100);
      break;
    case "skyrocket":
      power = 60;
      kind = "balloon";
      options.life = 90;
      options.radius = 700;
      options.armedAfter = 12;
      break;
    case "char_31":
      kind = "rocket";
      break;
    case "char_32":
      kind = "slipper";
      break;
  }
  return !!emit(s, f, angle, kind, power, options);
}

export function kitContact(
  s: BattleState,
  f: Fighter,
  other: Fighter,
  ctx: KitCombatServices,
) {
  if (f.hp <= 0 || other.hp <= 0 || statusPower(f, "stunned", s.tick)) return;
  const name = id(f),
    key = `kitContact:${other.id}`;
  if ((f.cooldowns[key] || 0) > s.tick) return;
  if (name === "char_19") {
    f.cooldowns[key] = s.tick + 30;
    gift(s, f, other, ctx);
    event(s, f, "kit:envelope", other);
  }
  if (other.team === f.team) return;
  if (
    name === "char_01" &&
    (f.memory.pounceUntil || 0) > s.tick &&
    !f.memory.pounceSpent
  ) {
    f.memory.pounceSpent = 1;
    ctx.damage(
      s,
      f,
      other,
      div(f.stats.attack * 180 * f.stats.superPower, 10000),
    );
    kitImpulse(f, other, 450);
  }
  if (name === "char_10" && active(s, f)) {
    f.cooldowns[key] = s.tick + 15;
    ctx.damage(s, f, other, div(f.stats.attack * 50, 100));
    kitImpulse(f, other, 550);
  }
}

export function kitTick(s: BattleState, f: Fighter, ctx: KitCombatServices) {
  if (!f.characterId || f.hp <= 0) return;
  const name = id(f),
    g = growth(s, f);
  if (name === "char_14" && (f.memory.nextSummon ?? 120) <= s.tick) {
    if (summon(s, f, "minion")) f.memory.nextSummon = s.tick + 120;
  }
  if (name === "char_11" && (f.memory.nextFlag || 0) <= s.tick) {
    if (field(s, f, "flag", f.x, f.y, 100, div(120 * g.duration, 100), 0))
      f.memory.nextFlag = s.tick + Math.max(60, div(12000, g.haste));
  }
  if (name === "char_25" && (f.memory.nextStock || 0) <= s.tick) {
    const win = (f.memory.stockWins || 0) > 0;
    trade(s, f, ctx, win);
    if (win) f.memory.stockWins--;
    f.memory.nextStock =
      s.tick + (win ? 30 : Math.max(30, div(9000, g.tradeHaste)));
  }
  if (
    name === "char_26" &&
    s.tick % 6 === 0 &&
    (f.memory.dash || 0) <= s.tick
  ) {
    const t = kitTarget(s, f, 250);
    if (t) {
      const [dx, dy] = normalize(t.x - f.x, t.y - f.y);
      const [nx, ny] = normalize(
        f.vx * 31 + div(dx * f.stats.speed, UNIT),
        f.vy * 31 + div(dy * f.stats.speed, UNIT),
      );
      f.vx = div(nx * f.stats.speed, UNIT);
      f.vy = div(ny * f.stats.speed, UNIT);
    }
  }
  if (
    (name === "char_29" || name === "wacom") &&
    f.memory.burstLeft > 0 &&
    (f.memory.burstReady || 0) <= s.tick &&
    !statusPower(f, "stunned", s.tick)
  ) {
    const t = kitTarget(s, f, kitRange(s, f));
    if (!t) return;
    const reflected = name === "char_29" && chance(s, 12);
    const p = emit(
      s,
      f,
      kitAim(f, t),
      "wacom",
      div((name === "char_29" ? 40 : 28) * f.stats.superPower, 100),
      {
        kind: "super",
        superShot: true,
        life: 70,
        bounces: name === "wacom" ? g.bounces : 0,
        pierce: name === "wacom" ? 1 : 0,
        friendlyScale: name === "char_29" ? div(35 * g.friendlySafety, 100) : 0,
        selfScale: reflected ? 35 : 0,
        target: reflected ? f.id : undefined,
        homing: reflected,
        armedAfter: reflected ? 12 : 0,
      },
    );
    if (p) {
      f.memory.burstLeft--;
      f.memory.burstReady =
        s.tick +
        Math.ceil(
          ((name === "wacom" ? 9 : 6) * 100) /
            (100 - statusPower(f, "paralyzed", s.tick)),
        );
    }
  }
}

function plantImpact(s: BattleState, f: Fighter, p: Projectile) {
  const g = growth(s, f);
  if (p.kit === "rose")
    field(s, f, "rose", p.x, p.y, 45, div(90 * g.duration, 100), 20);
  if (p.kit === "slipper")
    field(
      s,
      f,
      "slipper",
      p.x,
      p.y,
      div(55 * g.blastRadius, 100),
      75,
      div(18 * g.dot, 100),
    );
}
function explode(
  s: BattleState,
  f: Fighter,
  p: Projectile,
  ctx: KitCombatServices,
  main = -1,
) {
  if (p.detonated) return;
  p.detonated = true;
  p.life = 0;
  const g = growth(s, f),
    radius =
      p.kit === "basket"
        ? 90
        : p.kit === "rocket" && p.superShot
          ? Math.ceil(
              Math.sqrt(s.config.width ** 2 + s.config.height ** 2) / 100,
            )
          : p.kit === "rocket"
            ? 130
            : div(
                (id(f) === "skyrocket"
                  ? p.superShot
                    ? 75
                    : 45
                  : p.superShot
                    ? 90
                    : 55) * g.blastRadius,
                100,
              );
  // Resolve the owner's blast hit last: self-elimination must not cancel the
  // rest of this already-detonated explosion or its status applications.
  for (let index = 0; index <= s.fighters.length; index++) {
    const t = index === s.fighters.length ? f : s.fighters[index];
    if (index < s.fighters.length && t === f) continue;
    if (t.hp <= 0 || !within(p, t, radius)) continue;
    const allied = t.team === f.team,
      scale = t === f ? p.selfScale || 0 : allied ? p.friendlyScale || 0 : 100;
    if (!scale) continue;
    const power =
      p.kit === "rocket" && p.superShot && !within(p, t, 130)
        ? div((p.power || 190) * 50, 190)
        : p.kit === "basket" && t.id !== main
          ? 60
          : p.power || 100;
    const dealt =
      p.normal && !allied
        ? Number(ctx.normal(s, f, t, power))
        : ctx.damage(
            s,
            f,
            t,
            div(f.stats.attack * power * scale, 10000),
            allied,
          );
    if (dealt > 0 && p.kit === "rocket" && p.superShot) {
      applyStatus(s, f, t, "radiation", 2, 90, allied);
      applyStatus(s, f, t, "burn", 5, 90, allied);
    }
  }
  for (const c of s.constructs)
    if (
      c.hp > 0 &&
      s.fighters[c.owner]?.team !== f.team &&
      within(p, c, radius)
    )
      c.hp = Math.max(
        0,
        c.hp -
          div(
            f.stats.attack *
              (p.kit === "rocket" && p.superShot && !within(p, c, 130)
                ? div((p.power || 190) * 50, 190)
                : p.power || 100),
            100,
          ),
      );
  s.events.push({
    tick: s.tick,
    type: `kit:explosion:${p.kit}`,
    source: f.id,
    target: main >= 0 ? main : f.id,
    amount: radius,
    x: p.x,
    y: p.y,
  });
}
export function kitShieldBlocks(
  s: BattleState,
  target: Fighter,
  ox: number,
  oy: number,
  p: Projectile,
) {
  if (
    target.characterId !== "char_15" ||
    p.kit === "balloon" ||
    p.kit === "chicken"
  )
    return false;
  const d = DIRECTIONS[(target.angle + 16) % 32],
    x = target.x + div(d[0] * (target.radius + 1600), UNIT),
    y = target.y + div(d[1] * (target.radius + 1600), UNIT);
  const radius = div(1400 * growth(s, target).shieldSize, 100);
  if (!capsuleHit(ox, oy, p.x, p.y, x, y, radius + (p.radius || 450)))
    return false;
  p.life = 0;
  event(s, target, "kit:block");
  return true;
}

export function tickKitProjectiles(s: BattleState, ctx: KitCombatServices) {
  const bounds = safeBounds(s);
  // Projectiles appended by on-hit hooks start moving next tick, never recurse in this pass.
  const count = s.projectiles.length;
  for (let index = 0; index < count; index++) {
    const p = s.projectiles[index];
    if (!p.kit || p.life <= 0) continue;
    const f = s.fighters[p.owner];
    if (!f) {
      p.life = 0;
      continue;
    }
    const ox = p.x,
      oy = p.y;
    p.age = (p.age || 0) + 1;
    if (p.returnAfter && p.age >= p.returnAfter && !p.returning) {
      p.returning = true;
      p.homing = true;
      p.target = f.id;
      p.hit.length = 0;
    }
    if (p.homing) {
      let target = p.target !== undefined ? s.fighters[p.target] : undefined;
      if (!target || target.hp <= 0) {
        target = kitTarget(s, f, 10000);
        p.target = target?.id;
      }
      if (target) {
        const [nx, ny] = normalize(target.x - p.x, target.y - p.y);
        const speed =
          p.kit === "chicken" ? 1200 : p.kit === "balloon" ? 950 : 1000;
        const [dx, dy] =
          p.returning || p.target === f.id || p.vx * nx + p.vy * ny < 0
            ? [nx, ny]
            : normalize(
                p.vx * 3 + div(nx * speed, UNIT),
                p.vy * 3 + div(ny * speed, UNIT),
              );
        p.vx = div(dx * speed, UNIT);
        p.vy = div(dy * speed, UNIT);
      }
    }
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (
      p.returning &&
      within(p, f, (f.radius + (p.radius || 450) + 900) / 100)
    ) {
      ctx.heal(s, f, f, p.heal || 1);
      p.life = 0;
      event(s, f, "kit:boomerang-return");
      continue;
    }
    const wallX = p.x < bounds.left + 450 || p.x > bounds.right - 450,
      wallY = p.y < bounds.top + 450 || p.y > bounds.bottom - 450;
    if (wallX || wallY) {
      p.x = Math.max(bounds.left + 450, Math.min(bounds.right - 450, p.x));
      p.y = Math.max(bounds.top + 450, Math.min(bounds.bottom - 450, p.y));
      if ((p.bounces || 0) > 0) {
        if (wallX) p.vx = -p.vx;
        if (wallY) p.vy = -p.vy;
        p.bounces!--;
        p.hit.length = 0;
        event(s, f, "kit:bounce");
      } else if (p.kit === "balloon") {
        if (wallX) p.vx = -p.vx;
        if (wallY) p.vy = -p.vy;
      } else if (p.kit === "chicken") {
        p.returning = true;
        p.homing = true;
        p.target = f.id;
      } else {
        plantImpact(s, f, p);
        if (p.kit === "basket" || (p.kit === "rocket" && p.superShot))
          explode(s, f, p, ctx);
        p.life = 0;
      }
    }
    if (p.life <= 0) {
      if (
        p.kit === "balloon" ||
        p.kit === "basket" ||
        (p.kit === "rocket" && p.superShot)
      )
        explode(s, f, p, ctx);
      continue;
    }
    if ((p.armedAfter || 0) > p.age) continue;
    for (const t of projectileTargets(s, p, ox, oy)) {
      if (isConstruct(t)) {
        const hitId = -t.id - 1;
        if (
          p.life <= 0 ||
          p.hit.includes(hitId) ||
          (p.onHitReady?.[hitId] || 0) > s.tick ||
          !projectileHitsConstruct(s, f, t, p, ox, oy)
        )
          continue;
        const explosive =
          p.kit === "basket" ||
          p.kit === "balloon" ||
          (p.kit === "rocket" && p.superShot);
        if (explosive) {
          explode(s, f, p, ctx);
          p.life = 0;
        } else {
          hitConstruct(
            s,
            f,
            t,
            div(f.stats.attack * (p.power || 100), 100),
            p.push || 180,
          );
          if (p.normal) reverseWeaponSpin(f, s.tick);
          plantImpact(s, f, p);
          if (p.kit === "rose" || p.kit === "slipper") p.life = 0;
          else if (p.kit === "fruit" && (p.bounces || 0) > 0) {
            p.bounces!--;
            p.vx = -p.vx;
            p.vy = -p.vy;
            p.onHitReady ||= {};
            p.onHitReady[hitId] = s.tick + 12;
            event(s, f, "kit:bounce");
            break;
          } else {
            p.hit.push(hitId);
            if (p.pierce-- <= 0) p.life = 0;
          }
        }
        continue;
      }
      if (
        t.hp <= 0 ||
        p.life <= 0 ||
        p.hit.includes(t.id) ||
        (p.onHitReady?.[t.id] || 0) > s.tick
      )
        continue;
      const ally = t.team === f.team,
        self = t === f;
      // Blast self-damage does not make the muzzle collide with its owner.
      if (
        self &&
        p.kit !== "balloon" &&
        !(p.homing && p.target === f.id && !p.returning)
      )
        continue;
      const assists =
        ["ribbon", "buffFruit", "envelope", "rose"].includes(p.kit) ||
        (p.kit === "chicken" && p.superShot);
      if (
        self
          ? !(p.selfScale && !p.returning)
          : ally && !assists && !p.friendlyScale
      )
        continue;
      if (!capsuleHit(ox, oy, p.x, p.y, t.x, t.y, t.radius + (p.radius || 450)))
        continue;
      if (!ally && kitShieldBlocks(s, t, ox, oy, p)) break;
      if (
        p.kit === "balloon" ||
        p.kit === "basket" ||
        (p.kit === "rocket" && p.superShot)
      ) {
        explode(s, f, p, ctx, t.id);
        break;
      }
      if (ally && assists) {
        if (p.kit === "chicken")
          ctx.heal(
            s,
            f,
            t,
            Math.max(1, div(t.baseStats.hp * 2 * growth(s, f).heal, 10000)),
          );
        else if (p.kit !== "rose") {
          gift(s, f, t, ctx, !!p.superShot);
          if (p.kit === "buffFruit")
            ctx.heal(s, f, t, Math.max(1, div(f.stats.attack * 65, 100)));
        }
      } else {
        const scale = self
          ? p.selfScale || 0
          : ally
            ? p.friendlyScale || 0
            : 100;
        let landed = true;
        if (p.normal && !ally)
          landed = ctx.normal(
            s,
            f,
            t,
            p.power || 100,
            p.push || kitKnockback(s, f),
          );
        else
          landed =
            ctx.damage(
              s,
              f,
              t,
              div(f.stats.attack * (p.power || 100) * scale, 10000),
              ally,
            ) > 0;
        if (landed && !ally) {
          if (p.kit === "envelope") randomDebuff(s, f, t);
          if (p.kit === "buffFruit") applyStatus(s, f, t, "diabetes", 25, 60);
          if (
            p.kit === "randomInk" &&
            p.superShot &&
            chance(s, growth(s, f).chance)
          )
            randomDebuff(s, f, t);
          if (
            p.kit === "bullet" &&
            !p.normal &&
            f.characterId === "char_05" &&
            chance(s, growth(s, f).chance)
          )
            applyStatus(s, f, t, "myopia");
          if (p.push && !p.normal) kitImpulse(f, t, p.push);
        }
      }
      if (p.kit === "rose" || p.kit === "slipper") {
        plantImpact(s, f, p);
        p.life = 0;
      } else if (p.kit === "fruit" && (p.bounces || 0) > 0) {
        p.bounces!--;
        p.vx = -p.vx;
        p.vy = -p.vy;
        p.onHitReady![t.id] = s.tick + 12;
        event(s, f, "kit:bounce");
        break;
      } else {
        p.hit.push(t.id);
        if (p.kit === "wacom" && id(f) === "wacom") p.bounces = 0;
        if (p.pierce-- <= 0) p.life = 0;
      }
    }
  }
}

export function tickKitFields(s: BattleState, ctx: KitCombatServices) {
  for (const z of s.zones) {
    if (!z.kit || z.until <= s.tick || (z.start || 0) > s.tick) continue;
    const f = s.fighters[z.owner];
    if (!f) continue;
    if (z.follow) {
      z.x = f.x;
      z.y = f.y;
    }
    const pulse = (s.tick - (z.start || 0)) % (z.every || 30) === 0;
    for (const t of s.fighters) {
      if (t.hp <= 0 || !within(z, t, z.radius || 50)) continue;
      const same = t.team === f.team,
        harmful = !same || (!!z.allOthers && t !== f);
      if (z.kit === "vortex" && !same) {
        const [dx, dy] = normalize(z.x - t.x, z.y - t.y);
        t.memory.impulseX = Math.max(
          -650,
          Math.min(650, (t.memory.impulseX || 0) + div(dx * 70, UNIT)),
        );
        t.memory.impulseY = Math.max(
          -650,
          Math.min(650, (t.memory.impulseY || 0) + div(dy * 70, UNIT)),
        );
      }
      const key = `kitField:${z.owner}:${z.kit}`;
      const ready = (t.cooldowns[key] || 0) <= s.tick;
      if (harmful) {
        if (z.kit !== "vortex" && z.kit !== "soup")
          applyStatus(s, f, t, "frozen", z.kit === "paint" ? 25 : 15, 6, same);
        if (z.kit === "deadline") {
          applyStatus(s, f, t, "paralyzed", 25, 45, same);
          applyStatus(s, f, t, "pressure", 20, 45, same);
        }
        if (z.kit === "fruit") applyStatus(s, f, t, "diabetes", 25, 45);
        if (pulse && ready && z.power) {
          ctx.damage(
            s,
            f,
            t,
            Math.max(
              1,
              div(
                f.stats.attack * z.power * (z.super ? f.stats.superPower : 100),
                10000,
              ),
            ),
            same,
          );
          if (z.kit === "soup") applyStatus(s, f, t, "burn", 5, 60);
          t.cooldowns[key] = s.tick + 15;
        }
      } else if (
        same &&
        (z.kit !== "soup" || t === f) &&
        ["rose", "flag", "fruit", "soup"].includes(z.kit)
      ) {
        if (z.kit !== "soup")
          applyStatus(s, f, t, "rage", z.kit === "flag" ? 10 : 8, 6);
        if (pulse && ready) {
          ctx.heal(
            s,
            f,
            t,
            z.kit === "soup"
              ? Math.max(1, div(f.baseStats.hp, 100))
              : z.kit === "flag"
                ? 5
                : 3,
          );
          t.cooldowns[key] = s.tick + 15;
        }
      }
    }
    if (pulse && z.power)
      for (const c of s.constructs)
        if (
          c.hp > 0 &&
          s.fighters[c.owner]?.team !== f.team &&
          within(z, c, z.radius || 50)
        )
          c.hp = Math.max(0, c.hp - div(f.stats.attack * z.power, 100));
  }
}

export function tickConstructs(s: BattleState, ctx: KitCombatServices) {
  for (const c of s.constructs) {
    const f = s.fighters[c.owner];
    if (!f || c.until <= s.tick) {
      c.hp = 0;
      continue;
    }
    if (c.hp <= 0) continue;
    const target = nearestOpponent(
      s,
      c,
      f.team,
      c.kind === "turret" ? 22000 : 100000,
    );
    if (!target) continue;
    if (
      c.nextAttack > s.tick ||
      (c.kind !== "turret" &&
        distance(c, target) >
          (c.radius + target.radius + (c.kind === "giant" ? 2000 : 1600)) ** 2)
    )
      continue;
    if (c.kind === "turret") {
      const p = emit(
        s,
        f,
        kitAim(c, target),
        "bullet",
        Math.max(15, div(c.damage * 100, Math.max(1, f.stats.attack))),
        { life: 30 },
      );
      if (!p) continue;
      p.x = c.x;
      p.y = c.y;
    } else if (isConstruct(target)) {
      const dealt = Math.min(target.hp, c.damage);
      target.hp -= dealt;
      const [dx, dy] = normalize(target.x - c.x, target.y - c.y);
      if (target.kind !== "turret") {
        target.vx += div(dx * 120, UNIT);
        target.vy += div(dy * 120, UNIT);
      }
    } else ctx.damage(s, f, target, c.damage);
    c.nextAttack = s.tick + (c.kind === "turret" ? 30 : 24);
  }
  let write = 0;
  for (const c of s.constructs) {
    if (c.hp > 0 && c.until > s.tick) s.constructs[write++] = c;
    else {
      const key = `construct:${c.id}`;
      for (const f of s.fighters) delete f.cooldowns[key];
    }
  }
  s.constructs.length = write;
}

export function kitMeleeConstructs(
  s: BattleState,
  f: Fighter,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cooldown: number,
) {
  for (const c of s.constructs) {
    if (c.hp <= 0 || s.fighters[c.owner]?.team === f.team) continue;
    const key = `construct:${c.id}`;
    if (
      (f.cooldowns[key] || 0) > s.tick ||
      !capsuleHit(ax, ay, bx, by, c.x, c.y, c.radius + 500)
    )
      continue;
    hitConstruct(s, f, c, f.stats.attack);
    reverseWeaponSpin(f, s.tick);
    f.cooldowns[key] = s.tick + cooldown;
  }
}
