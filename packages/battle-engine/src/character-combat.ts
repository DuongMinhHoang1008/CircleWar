import {
  character,
  BONDS,
  FRIEND_GROUPS,
  groupEligible,
  groupTier,
  representatives,
  availableTraits,
  TRAITS,
  validChoice,
  CATALOG_ITEMS,
} from "../../shared/src/catalog";
import type { BattleState, Fighter } from "./types";
import { div, normalize, UNIT, DIRECTIONS, random } from "./math";
import { capsuleHit } from "./physics";
import { safeBounds } from "./bounds";
import { roundTempo } from "./pacing";
import { itemMultiplier } from "../../shared/src/balance";
import { CHARACTER_BALANCE } from "../../shared/src/combat-balance";
import { ITEM_AFFINITY, type AffinityTrigger } from "../../shared/src/affinity";
import { CHARACTER_PASSIVES, LEGENDARY_KITS, type PassiveTrigger } from "../../shared/src/character-abilities";
import {
  isRanged,
  weaponCount,
  weaponReach,
  RANGED_ATTACK_RANGE,
  RANGED_SKILL_RANGE,
  RANGED_SUPER_RANGE,
} from "./weapons";
import {
  isClashProtected,
  reverseWeaponSpin,
  rotateWeaponAngle,
} from "./weapon-clash";

const no = (f: Fighter) => Number(f.characterId?.slice(-2) || 0);
const superValue = (f: Fighter, value: number) =>
  div(value * f.stats.superPower, 100);
// Late-round damage ramps must outpace recovery so defensive mirrors can finish.
const recoveryValue = (f: Fighter, value: number) =>
  div(value * Math.min(150, f.stats.superPower), 100);
const has = (f: Fighter, n: number) => f.equipment.includes(CATALOG_ITEMS[n - 1].id);
const affinity = (f: Fighter, n: number) => CATALOG_ITEMS[n - 1].affinity === f.characterId;
const itemValue = (f: Fighter, n: number, value: number) => {
  const id = CATALOG_ITEMS[n - 1].id;
  return Math.max(
    1,
    Math.round(
      value * itemMultiplier(id, f.equipmentLevels?.[id] || 1, affinity(f, n)),
    ),
  );
};
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const within = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  r: number,
) => distance(a, b) <= (r * 100) ** 2;
function nearest(
  s: BattleState,
  f: Fighter,
  r: number,
  ally = false,
  weak = false,
) {
  let target: Fighter | undefined;
  let closest = Infinity;
  const rangeSquared = (r * 100) ** 2;
  for (const t of s.fighters) {
    if (t.hp <= 0 || (ally ? t.team !== f.team : t.team === f.team)) continue;
    const d = distance(f, t);
    if (d > rangeSquared) continue;
    const healthOrder = weak && target ? t.hp * target.stats.hp - target.hp * t.stats.hp : 0;
    if (!target || healthOrder < 0 || (healthOrder === 0 && (d < closest || (d === closest && t.id < target.id)))) {
      target = t;
      closest = d;
    }
  }
  return target;
}
function event(s: BattleState, type: string, f: Fighter, t = f, amount = 0) {
  s.events.push({ tick: s.tick, type, source: f.id, target: t.id, amount });
}
function buff(
  s: BattleState,
  f: Fighter,
  kind: string,
  value: number,
  ticks: number,
  source = f.id,
) {
  const existing = f.buffs.find((b) => b.kind === kind && b.source === source);
  if (existing) {
    existing.value = value;
    existing.until = s.tick + ticks;
  } else f.buffs.push({ kind, value, until: s.tick + ticks, source });
}
function energy(s: BattleState, f: Fighter, n: number) {
  f.memory.gain = Math.min(100, (f.memory.gain || 0) + n);
}
function shield(
  s: BattleState,
  source: Fighter,
  f: Fighter,
  n: number,
  ticks: number,
) {
  if (f.hp <= 0) return;
  const amount = Math.max(0, Math.min(n, 100 - f.shield));
  if (!amount) return;
  f.shields.push({ amount, until: s.tick + ticks, source: source.id });
  f.shield += amount;
  event(s, "shield", source, f, amount);
}
function heal(s: BattleState, source: Fighter, f: Fighter, n: number) {
  if (f.hp <= 0) return 0;
  const radiation = Math.min(3, f.buffs.filter(b => b.kind === "radiation" && b.until > s.tick && s.fighters[b.source]?.hp > 0).reduce((sum, b) => sum + b.value, 0));
  const amount = Math.max(0, Math.min(div(n * (100 - radiation * LEGENDARY_KITS.char_31.radiationWound), 100), f.stats.hp - f.hp));
  f.hp += amount;
  if (amount) event(s, "heal", source, f, amount);
  return amount;
}
function slow(
  s: BattleState,
  source: Fighter,
  f: Fighter,
  power: number,
  ticks: number,
) {
  if ((f.memory.immuneSlow || 0) > s.tick) return;
  if (has(f, 15) && !f.memory.herb) {
    f.memory.herb = 1;
    f.slowUntil = 0;
    f.memory.immuneSlow = s.tick + itemValue(f, 15, 30);
    event(s, "item:15", f);
    return;
  }
  buff(s, f, "slow", Math.min(35, power), ticks, source.id);
  f.slowUntil = Math.max(f.slowUntil, s.tick + ticks);
  f.memory.slowPower = Math.max(
    ...f.buffs
      .filter((b) => b.kind === "slow" && b.until > s.tick)
      .map((b) => b.value),
    0,
  );
}
function push(source: Fighter, f: Fighter, strength: number) {
  const [x, y] = normalize(f.x - source.x, f.y - source.y);
  const resist = 100;
  f.vx += div(x * strength * resist, UNIT * f.stats.stability);
  f.vy += div(y * strength * resist, UNIT * f.stats.stability);
}
function aim(f: Fighter, t: { x: number; y: number }) {
  const [x, y] = normalize(t.x - f.x, t.y - f.y);
  let best = 0,
    dot = -Infinity;
  DIRECTIONS.forEach((d, i) => {
    const v = x * d[0] + y * d[1];
    if (v > dot) {
      best = i;
      dot = v;
    }
  });
  return best;
}
function launch(
  s: BattleState,
  f: Fighter,
  t: Fighter,
  power: number,
  options: {
    normal?: boolean;
    push?: number;
    range?: number;
    kind?: "skill" | "super";
    slow?: number;
    radiation?: number;
    splash?: number;
    splashPower?: number;
  } = {},
) {
  if (s.projectiles.length >= 240) return false;
  const { normal = false, push = 0, range = 300, kind } = options;
  const d = DIRECTIONS[aim(f, t)];
  const projectileSpeed = normal ? 900 : 1100;
  s.projectiles.push({
    id: s.nextProjectile++,
    owner: f.id,
    x: f.x,
    y: f.y,
    vx: div(d[0] * projectileSpeed, UNIT),
    vy: div(d[1] * projectileSpeed, UNIT),
    life: Math.max(1, div(range * 100, projectileSpeed)),
    pierce: 0,
    hit: [],
    power,
    normal,
    push,
    kind,
    slow: options.slow,
    radiation: options.radiation,
    splash: options.splash,
    splashPower: options.splashPower,
  });
  return true;
}
function threshold(s: BattleState, f: Fighter) {
  if (f.hp <= 0) return;
  const low40 = f.hp * 100 <= f.stats.hp * 40,
    low30 = f.hp * 100 <= f.stats.hp * 30,
    low25 = f.hp * 100 <= f.stats.hp * 25;
  if (low40 && has(f, 2) && !f.memory.bedding) {
    f.memory.bedding = 1;
    shield(s, f, f, itemValue(f, 2, 28), 90);
  }
  if (low25 && has(f, 18) && !f.memory.briefs) {
    f.memory.briefs = 1;
    shield(s, f, f, itemValue(f, 18, 28), 60);
    buff(s, f, "speed", itemValue(f, 18, 8), 60, -18);
    event(s, "item:18", f);
  }
  if (low30 && has(f, 17) && !f.memory.pork) {
    f.memory.pork = 1;
    heal(s, f, f, itemValue(f, 17, 16));
  }
  if (low40) {
    passiveEvent(s, f, "low");
    affinityEvent(s, f, "low");
    friendEvent(s, f, "low");
  }
}
export function characterDamage(
  s: BattleState,
  f: Fighter,
  t: Fighter,
  raw: number,
  normal = false,
  knock = 150,
) {
  if (
    f.hp <= 0 ||
    t.hp <= 0 ||
    f.team === t.team ||
    isClashProtected(t, s.tick)
  )
    return 0;
  // Armor is percentage damage reduction; shields absorb the remainder before HP.
  let amount = Math.max(
    1,
    Math.min(300, div(raw * (100 - Math.min(60, t.stats.defense)), 100)),
  );
  const absorbed = Math.min(t.shield, amount);
  amount -= absorbed;
  t.shield -= absorbed;
  let remain = absorbed;
  t.shields.sort((a, b) => a.until - b.until || a.source - b.source);
  for (const layer of t.shields) {
    const used = Math.min(layer.amount, remain);
    layer.amount -= used;
    remain -= used;
  }
  t.shields = t.shields.filter((l) => l.amount > 0);
  amount = Math.min(t.hp, amount);
  t.hp -= amount;
  t.taken += amount;
  f.dealt += amount;
  if (amount || absorbed) {
    energy(s, f, div((amount + absorbed + 3) * f.stats.charge, 160));
    energy(s, t, div((amount + absorbed + 4) * t.stats.charge, 240));
  }
  event(s, "hit", f, t, amount);
  if (knock) push(f, t, knock);
  if (!t.hp) {
    t.deadAt = s.tick;
    f.kills++;
    event(s, "kill", f, t);
    if (has(f, 13)) heal(s, f, f, itemValue(f, 13, 12));
    passiveEvent(s, f, "kill", t);
  } else {
    threshold(s, t);
    if (normal && t.hp > 0) passiveEvent(s, t, "taken", f, amount);
    if (t.hp > 0 && t.hp * 100 <= t.stats.hp * 40) {
      for (const ally of s.fighters) if (ally.characterId === "char_15" && ally.team === t.team && ally !== t && ally.hp > 0) passiveEvent(s, ally, "allyLow", t);
    }
  }
  if (normal && f.hp > 0) normalEffects(s, f, t, amount);
  return amount;
}
function nextBonus(s: BattleState, f: Fighter, value: number, source = -1) {
  buff(s, f, "bonus", value, 90, source);
}
function clearSlow(f: Fighter) {
  f.buffs = f.buffs.filter(b => b.kind !== "slow");
  f.slowUntil = 0;
  f.memory.slowPower = 0;
}
function addRadiation(s: BattleState, source: Fighter, target: Fighter, stacks: number) {
  if (target.hp <= 0 || source.hp <= 0 || isClashProtected(target, s.tick)) return;
  const kit = LEGENDARY_KITS.char_31;
  const other = target.buffs.filter(b => b.kind === "radiation" && b.source !== source.id && b.until > s.tick && s.fighters[b.source]?.hp > 0).reduce((sum, b) => sum + b.value, 0);
  const old = target.buffs.find(b => b.kind === "radiation" && b.source === source.id && b.until > s.tick)?.value || 0;
  const value = Math.min(kit.radiationMax - other, old + stacks);
  if (value <= 0) return;
  buff(s, target, "radiation", value, kit.radiationDuration, source.id);
  event(s, "radiation", source, target, value);
}
function refreshReach(s: BattleState, f: Fighter) {
  f.stats.reach = Math.min(9000, f.baseStats.reach + f.buffs.filter(b => b.kind === "reach" && b.until > s.tick).reduce((sum, b) => sum + b.value, 0));
}
function passiveEvent(s: BattleState, f: Fighter, trigger: PassiveTrigger, target?: Fighter, damage = 0) {
  const p = CHARACTER_PASSIVES[f.characterId || ""];
  if (!p || f.hp <= 0 || p.trigger !== trigger) return;
  if (p.condition === "slowed" && (!target || target.slowUntil <= s.tick)) return;
  if (p.condition === "debuffed" && !target?.buffs.some(b => ["slow", "burnDot", "soupDot", "radiation"].includes(b.kind) && b.until > s.tick)) return;
  if (p.condition === "targetLow" && (!target || target.hp <= 0 || target.hp * 100 > target.stats.hp * 40)) return;
  if (p.condition === "rangedSource" && (!target || !isRanged(target))) return;
  if (p.effect === "energy" && (!target || distance(f, target) < (p.range * 100) ** 2)) return;
  if (p.condition === "ownZone" && !s.zones.some(z => z.owner === f.id && !z.trap && z.until > s.tick && (z.start || 0) <= s.tick && within(z, f, z.radius || 0))) return;
  if (p.condition === "consecutive" && target) {
    if (f.memory.passiveTarget !== target.id) f.memory.passiveCount = 0;
    f.memory.passiveTarget = target.id;
  }
  const others = s.fighters.filter(t => t !== f && t.team === f.team && t.hp > 0 && within(f, t, p.range));
  others.sort((a, b) => a.hp * b.stats.hp - b.hp * a.stats.hp || a.id - b.id);
  const ally = p.condition === "otherAlly" ? others[0] : nearest(s, f, p.range, true, true);
  if (p.condition === "otherAlly" && (!ally || trigger === "allyLow" && (!target || !within(f, target, p.range)))) return;
  if (p.effect === "aura" && !others.length) return;
  if ((f.memory.passiveReady || 0) > s.tick || p.maxUses && (f.memory.passiveUses || 0) >= p.maxUses) return;
  f.memory.passiveCount = (f.memory.passiveCount || 0) + 1;
  if (f.memory.passiveCount < p.every) return;
  if (["mark", "radiation", "trap"].includes(p.effect) && (!target || target.hp <= 0)) return;
  f.memory.passiveCount = 0;
  f.memory.passiveUses = (f.memory.passiveUses || 0) + 1;
  f.memory.passiveReady = s.tick + p.cooldown;
  const flat = Math.max(1, Math.round(p.value * f.baseStats.hp / (CHARACTER_BALANCE[f.characterId!].stats.hp || 240)));
  const hpValue = Math.max(1, div(f.stats.hp * p.value, 100));
  const source = -6000 - f.id;
  if (p.effect === "shield") shield(s, f, f, hpValue, p.duration);
  if (p.effect === "allyShield" && ally) shield(s, f, ally, hpValue, p.duration);
  if (p.effect === "skillRefund") f.skillReady = Math.max(s.tick + 1, f.skillReady - p.value);
  if (p.effect === "speed") buff(s, f, "speed", p.value, p.duration, source);
  if (p.effect === "mark") buff(s, target!, "exposed", p.value, p.duration, f.id);
  if (p.effect === "allyHaste" && ally) buff(s, ally, "haste", 100 + p.value, p.duration, source);
  if (p.effect === "escape") { clearSlow(f); f.memory.immuneSlow = s.tick + 30; buff(s, f, "speed", p.value, p.duration, source); }
  if (p.effect === "lifesteal") heal(s, f, f, div(damage * p.value, 100));
  if (p.effect === "allyEnergy") others.slice(0, 2).forEach(t => energy(s, t, p.value));
  if (p.effect === "ram") { shield(s, f, f, hpValue, p.duration); if (target?.hp) push(f, target, 180); }
  if (p.effect === "allyCleanse" && ally) { clearSlow(ally); shield(s, f, ally, flat, p.duration); }
  if (["bonus", "combo"].includes(p.effect)) buff(s, f, "bonus", p.value, p.duration, source);
  if (p.effect === "allyHeal" && ally) heal(s, f, ally, flat);
  if (p.effect === "trap" && s.zones.length < 120) s.zones.push({ owner: f.id, x: target!.x, y: target!.y, radius: p.range, until: s.tick + p.duration, trap: true, power: p.value, slow: 12 });
  if (p.effect === "guard" && target?.hp) shield(s, f, target, flat, p.duration);
  if (p.effect === "mealBurn") { if (target?.hp) buff(s, target, "soupDot", p.value, p.duration, f.id); if (ally) heal(s, f, ally, 4); }
  if (p.effect === "gift" && ally) { shield(s, f, ally, flat, p.duration); energy(s, ally, 4); }
  if (p.effect === "allyBonus" && ally) buff(s, ally, "bonus", p.value, p.duration, source);
  if (p.effect === "battery") { energy(s, f, p.value); buff(s, f, "bonus", 10, 90, source); }
  if (p.effect === "reach") { buff(s, f, "reach", p.value, p.duration, source); refreshReach(s, f); }
  if (p.effect === "energy") energy(s, f, p.value);
  if (p.effect === "shareShield") shield(s, f, others[0] || f, others.length ? flat : div(flat, 2), p.duration);
  if (p.effect === "cleanseSpeed") { clearSlow(f); buff(s, f, "speed", p.value, p.duration, source); }
  if (p.effect === "heatZone" && s.zones.length < 120) s.zones.push({ owner: f.id, x: f.x, y: f.y, radius: p.range, until: s.tick + p.duration, start: s.tick, every: 30, power: p.value });
  if (p.effect === "openingShield") shield(s, f, f, has(f, 28) ? div(flat * 150, 100) : flat, p.duration);
  if (p.effect === "reload") { f.nextAttack = Math.max(s.tick + 1, f.nextAttack - p.value); energy(s, f, 3); }
  if (p.effect === "balloon") { shield(s, f, f, 4, p.duration); buff(s, f, "bonus", p.value, p.duration, source); }
  if (p.effect === "radiation") addRadiation(s, f, target!, 1);
  if (p.effect === "zoneGuard") shield(s, f, f, flat, p.duration);
  if (p.effect === "meal") { heal(s, f, f, hpValue); if (others[0]) heal(s, f, others[0], hpValue); }
  event(s, "passive:" + f.characterId, f, target || ally || f, p.value);
}
function affinityEvent(s: BattleState, f: Fighter, trigger: AffinityTrigger, target?: Fighter) {
  if (f.hp <= 0) return;
  for (const id of f.equipment) {
    const it = CATALOG_ITEMS.find(it => it.id === id);
    const fx = ITEM_AFFINITY[id];
    if (!it || it.affinity !== f.characterId || !fx || fx.trigger !== trigger) continue;
    const key = "affinity:" + id;
    if ((f.memory[key + ":uses"] || 0) >= fx.maxUses || (f.memory[key + ":ready"] || 0) > s.tick) continue;
    const value = Math.max(1, Math.round(fx.value * itemMultiplier(id, f.equipmentLevels?.[id] || 1, true)));
    const ally = fx.kind.startsWith("ally") ? nearest(s, f, 180, true, true) : undefined;
    const enemy = ["slow", "burn"].includes(fx.kind) ? target?.hp && target.team !== f.team && within(f, target, 180) ? target : nearest(s, f, 180) : undefined;
    if (fx.kind.startsWith("ally") && !ally || ["slow", "burn"].includes(fx.kind) && !enemy) continue;
    f.memory[key + ":uses"] = (f.memory[key + ":uses"] || 0) + 1;
    f.memory[key + ":ready"] = s.tick + fx.cooldown;
    const source = -4000 - Number(id.slice(-2));
    if (fx.kind === "shield") shield(s, f, f, value, fx.ticks);
    if (fx.kind === "heal") heal(s, f, f, value);
    if (fx.kind === "allyShield") shield(s, f, ally!, value, fx.ticks);
    if (fx.kind === "allyHeal") heal(s, f, ally!, value);
    if (fx.kind === "energy") energy(s, f, value);
    if (fx.kind === "bonus") buff(s, f, "bonus", value, fx.ticks, source);
    if (fx.kind === "speed") buff(s, f, "speed", value, fx.ticks, source);
    if (fx.kind === "cleanse") {
      f.buffs = f.buffs.filter(b => b.kind !== "slow");
      f.slowUntil = 0;
      f.memory.slowPower = 0;
      f.memory.immuneSlow = s.tick + value;
    }
    if (fx.kind === "slow") slow(s, f, enemy!, value, fx.ticks);
    if (fx.kind === "burn") buff(s, enemy!, "burnDot", value, fx.ticks, f.id);
    event(s, key, f, ally || enemy || f, value);
  }
}
function normalEffects(s: BattleState, f: Fighter, t: Fighter, amount: number) {
  f.hits++;
  if (f.hits % 4 === 0) affinityEvent(s, f, "hit4", t);
  passiveEvent(s, f, "hit", t, amount);
  if (t.hp > 0 && f.stats.burn > 0)
    buff(s, t, "burnDot", f.stats.burn, 60, f.id);
  if (t.stats.thorns > 0 && t.hp > 0)
    characterDamage(s, t, f, t.stats.thorns, false, 0);
  if (has(f, 16) && f.hits % 4 === 0)
    nextBonus(s, f, itemValue(f, 16, 18), -16);
  if (has(f, 7)) {
    f.memory.iceHits = Math.min(4, (f.memory.iceHits || 0) + 1);
    if (f.memory.iceHits >= 4 && s.tick >= (f.memory.iceReady || 0)) {
      f.memory.iceHits = 0;
      f.memory.iceReady = s.tick + 90;
      if (t.hp > 0) slow(s, f, t, itemValue(f, 7, 15), 30);
    }
  }
  if (has(f, 14)) {
    f.memory.sourHits = Math.min(3, (f.memory.sourHits || 0) + 1);
    if (f.memory.sourHits >= 3 && s.tick >= (f.memory.sourReady || 0)) {
      f.memory.sourHits = 0;
      f.memory.sourReady = s.tick + 150;
      if (t.hp > 0) buff(s, t, "dot", itemValue(f, 14, 2), 90, f.id);
    }
  }
}
function normalHit(s: BattleState, f: Fighter, t: Fighter, scale = 100) {
  let hit = f.stats.attack;
  let auxiliary = 0;
  for (const kind of ["bonus", "envelope", "electric"]) {
    const bonuses = f.buffs.filter((b) => b.kind === kind && b.until > s.tick);
    for (const b of bonuses) {
      auxiliary += b.value;
      b.until = s.tick;
    }
  }
  // Independent bonds/items contribute additively; the final damage cap remains.
  const marks = t.buffs.filter(b => b.kind === "exposed" && b.until > s.tick && s.fighters[b.source]?.hp > 0 && s.fighters[b.source]?.team === f.team);
  if (marks.length) { auxiliary += Math.max(...marks.map(b => b.value)); marks.forEach(b => b.until = s.tick); }
  hit = div(hit * (100 + auxiliary) * scale, 10000);
  if (random(s) % 100 < f.stats.crit) hit = div(hit * f.stats.critPower, 100);
  if (f.memory.armorIgnore) {
    hit += div(t.stats.defense * f.memory.armorIgnore, 100);
    f.memory.armorIgnore = 0;
  }
  characterDamage(s, f, t, hit, true);
}

// Team composition and representative slots are immutable for the life of a battle.
// Cache references only; HP, positions and buffs are always read from live fighters.
const representativeCache = new WeakMap<BattleState, Map<string, Fighter[]>>();
function chosen(s: BattleState, team: string) {
  let cache = representativeCache.get(s);
  if (!cache) representativeCache.set(s, (cache = new Map()));
  const cached = cache.get(team);
  if (cached) return cached;
  const cfg = s.config.teams.find((t) => t.id === team)!;
  const result = representatives(cfg.loadouts, cfg.choice)
    .map((slot) => s.fighters.find((f) => f.team === team && f.slot === slot)!)
    .filter(Boolean);
  cache.set(team, result);
  return result;
}
function traitMembers(s: BattleState, f: Fighter, trait: string) {
  return {
    trait,
    members: chosen(s, f.team).filter(
      (t) =>
        t.hp > 0 &&
        (character(t.characterId)?.roleClass === trait ||
          character(t.characterId)?.race === trait),
    ),
  };
}
function friendMembers(s: BattleState, f: Fighter, groupId: string) {
  const group = FRIEND_GROUPS.find((g) => g.id === groupId);
  const living = chosen(s, f.team).filter((t) => t.hp > 0);
  return {
    group,
    members:
      group &&
      groupEligible(
        group,
        living.map((t) => t.characterId),
      )
        ? living.filter(
            (t) => t.hp > 0 && group.members.includes(t.characterId || ""),
          )
        : [],
  };
}
function friendEvent(s: BattleState, source: Fighter, kind: string) {
  for (const group of FRIEND_GROUPS)
    friendGroupEvent(s, source, kind, group.id);
}
function friendGroupEvent(
  s: BattleState,
  source: Fighter,
  kind: string,
  groupId: string,
) {
  const { group, members } = friendMembers(s, source, groupId),
    count = members.length;
  if (!group || count < 2 || !members.includes(source) || source.hp <= 0)
    return;
  const id = group.id,
    three =
      groupTier(
        group,
        members.map((t) => t.characterId),
      ) === 3;
  const trigger =
    (id === "G01" &&
      three &&
      kind === "pulse" &&
      [300, 600].includes(s.tick)) ||
    (id === "G02" &&
      ((no(source) === 1 && kind === "gale") ||
        (no(source) === 19 && kind === "gift") ||
        kind === "skill" ||
        kind === "super")) ||
    (id === "G03" &&
      ((no(source) === 2 && kind === "hug") ||
        (no(source) === 10 && kind === "ram") ||
        kind === "skill" ||
        kind === "super")) ||
    (id === "G04" && three && kind === "pulse" && s.tick === 600) ||
    (id === "G05" && kind === "super") ||
    (id === "G06" && kind === "super") ||
    (id === "G07" && kind === "low") ||
    (["G08", "G09"].includes(id) && kind === "super") ||
    (id === "G10" && kind === "pulse" && [300, 600].includes(s.tick)) ||
    (id === "G11" && no(source) === 14 && kind === "super") ||
    (id === "G12" && [9, 22].includes(no(source)) && kind === "super") ||
    (id === "G13" && [3, 15].includes(no(source)) && kind === "super") ||
    (["G14", "G15", "G16", "G17"].includes(id) && kind === "super");
  if (!trigger) return;
  if (
    ["G02", "G03", "G05", "G06", "G08", "G09", "G11", "G12", "G13", "G14", "G15", "G16", "G17"].includes(
      id,
    ) &&
    members.some((f) =>
      members.some(
        (t) => !within(f, t, ["G02", "G03"].includes(id) ? 240 : 280),
      ),
    )
  )
    return;
  const state =
      s.groups[`${source.team}:${id}`] ||
      (s.groups[`${source.team}:${id}`] = { uses: 0, ready: 0 }),
    max = ["G02", "G03"].includes(id) ? 3 : ["G04", "G06"].includes(id) ? 1 : 2;
  if (state.uses >= max || state.ready > s.tick) return;
  state.uses++;
  state.ready =
    s.tick +
    (["G01", "G04", "G10"].includes(id)
      ? 1
      : ["G02", "G03"].includes(id)
        ? 240
        : 360);
  event(s, "group:" + id, source, source, three ? 3 : 2);
  if (id === "G01") members.forEach((t) => energy(s, t, 4));
  if (id === "G02") {
    const partner = members.find((t) => t.id !== source.id)!;
    shield(s, source, partner, 10, 60);
  }
  if (id === "G03")
    members.forEach((t) => {
      shield(s, source, t, 8, 60);
      buff(s, t, "speed", 8, 60, -1000 - Number(id.slice(1)));
    });
  if (id === "G04") members.forEach((t) => shield(s, source, t, 10, 150));
  if (id === "G05")
    members
      .filter((t) => t.id !== source.id)
      .forEach((t) => energy(s, t, three ? 8 : 4));
  if (id === "G06")
    members.forEach((t) => shield(s, source, t, three ? 12 : 8, 90));
  if (id === "G07")
    members
      .filter((t) => within(source, t, 280))
      .forEach((t) => heal(s, source, t, three ? 8 : 6));
  if (id === "G08")
    members.forEach((t) =>
      buff(s, t, "attack", three ? 12 : 8, 90, -1000 - Number(id.slice(1))),
    );
  if (id === "G10") members.forEach((t) => energy(s, t, three ? 5 : 3));
  if (id === "G09")
    members
      .filter((t) => t.id !== source.id)
      .forEach((t) => {
        shield(s, source, t, 16, 90);
        energy(s, t, 4);
      });
  if (id === "G11")
    members
      .filter((t) => t.id !== source.id)
      .forEach((t) => {
        const artist = FRIEND_GROUPS.find(
          (g) => g.id === "G09",
        )!.members.includes(t.characterId!);
        if (three || artist) shield(s, source, t, three ? 24 : 18, 90);
        if (three || !artist) {
          energy(s, t, 6);
          buff(
            s,
            t,
            "haste",
            three ? 115 : 110,
            90,
            -1000 - Number(id.slice(1)),
          );
        } else buff(s, t, "speed", 8, 90, -1000 - Number(id.slice(1)));
      });
  if (id === "G13")
    members
      .filter((t) => t.id !== source.id)
      .forEach((t) => {
        energy(s, t, three ? 6 : 4);
        buff(s, t, "attack", three ? 12 : 8, 90, -1000 - Number(id.slice(1)));
      });
  if (id === "G14") members.forEach((t) => shield(s, source, t, three ? 12 : 8, 90));
  if (id === "G15") members.filter(t => t !== source).forEach(t => energy(s, t, three ? 6 : 4));
  if (id === "G16") members.filter(t => t !== source).forEach(t => shield(s, source, t, three ? 14 : 10, 90));
  if (id === "G17") members.filter(t => t !== source).forEach(t => heal(s, source, t, three ? 8 : 6));
  if (id === "G12")
    members
      .filter((t) => t.id !== source.id)
      .forEach((t) => {
        buff(s, t, "attack", three ? 12 : 8, 90, -1000 - Number(id.slice(1)));
        buff(s, t, "haste", three ? 115 : 110, 90, -1000 - Number(id.slice(1)));
      });
}
export function initializeCharacters(s: BattleState) {
  for (const cfg of s.config.teams) {
    if (cfg.choice && !validChoice(cfg.loadouts, cfg.choice))
      throw Error("Invalid team synergy");
  }
  for (const f of s.fighters) {
    if (!f.characterId) continue;
    if (f.stats.shield > 0) {
      f.shields.push({
        amount: f.stats.shield,
        until: Number.MAX_SAFE_INTEGER,
        source: f.id,
      });
    }
    const n = no(f);
    f.skillReady = 7 * 30;
    f.memory.passiveReady = CHARACTER_PASSIVES[f.characterId]?.trigger === "pulse" && CHARACTER_PASSIVES[f.characterId].condition !== "ownZone" ? CHARACTER_PASSIVES[f.characterId].cooldown : 0;
    const traits = TRAITS.map((trait) => traitMembers(s, f, trait)).filter(
      (t) => t.members.length >= 2 && t.members.includes(f),
    );
    if (traits.some((t) => t.trait === "Thực Linh")) {
      f.baseStats.hp = Math.min(1600, f.baseStats.hp + 20);
      f.stats.hp = f.baseStats.hp;
      f.hp = f.stats.hp;
    }
    if (has(f, 12)) shield(s, f, f, itemValue(f, 12, 30), 300);
    const support = traits.find((t) => t.trait === "Hỗ trợ");
    if (support) shield(s, f, f, support.members.length >= 3 ? 16 : 10, 150);
    passiveEvent(s, f, "start");
  }
}
export function beforeCharacterTick(s: BattleState) {
  const tempo = roundTempo(s.tick);
  const contexts = new Map(
    s.config.teams.map((cfg) => {
      const living = chosen(s, cfg.id).filter((f) => f.hp > 0);
      const ids = living.map((f) => f.characterId);
      return [
        cfg.id,
        {
          traits: TRAITS.map((trait) => ({
            trait,
            members: living.filter((f) => {
              const profile = character(f.characterId);
              return profile?.roleClass === trait || profile?.race === trait;
            }),
          })).filter((t) => t.members.length >= 2),
          groups: FRIEND_GROUPS.filter((group) =>
            groupEligible(group, ids),
          ).map((group) => ({
            group,
            members: living.filter((f) =>
              group.members.includes(f.characterId || ""),
            ),
          })),
        },
      ] as const;
    }),
  );
  for (const f of s.fighters) {
    if (!f.characterId) continue;
    f.memory.gain = 0;
    f.buffs = f.buffs.filter(
      (b) =>
        b.until >= s.tick && (!["dot", "radiation", "exposed"].includes(b.kind) || s.fighters[b.source]?.hp > 0),
    );
    f.shields = f.shields.filter((l) => l.until > s.tick && l.amount > 0);
    f.shield = f.shields.reduce((sum, l) => sum + l.amount, 0);
    if (f.hp <= 0) continue;
    const oldSpeed = f.stats.speed,
      oldCooldown = f.stats.cooldown;
    f.stats = { ...f.baseStats };
    let attack = 0,
      speed = 0;
    let synergyAttack = 0,
      synergySpeed = 0,
      synergyHaste = 0;
    let auraAttack = 0;
    // Passive auras and active fields use the strongest matching aura, never
    // multiply with duplicate emitters. Range/death changes take effect next tick.
    if (s.fighters.some(a => a !== f && a.team === f.team && a.hp > 0 && a.characterId === "char_22" && within(a, f, CHARACTER_PASSIVES.char_22.range))) {
      auraAttack = CHARACTER_PASSIVES.char_22.value;
      synergySpeed += CHARACTER_PASSIVES.char_22.value;
    }
    const fields = s.zones.filter(z => s.fighters[z.owner]?.team === f.team && s.fighters[z.owner]?.hp > 0 && z.until > s.tick && (z.start || 0) <= s.tick && within(z.follow ? s.fighters[z.owner] : z, f, z.radius || 0));
    synergyAttack += Math.max(0, ...fields.map(z => z.auraAttack || 0));
    synergyHaste += Math.max(0, ...fields.map(z => z.auraHaste || 0));
    for (const { trait, members } of contexts.get(f.team)!.traits) {
      const count = members.length;
      if (count >= 2 && members.includes(f)) {
        if (trait === "Hộ vệ") f.stats.defense += count >= 3 ? 2 : 1;
        if (trait === "Đấu sĩ") synergyAttack += count >= 3 ? 6 : 4;
        if (trait === "Kiểm soát") f.stats.superPower += count >= 3 ? 8 : 5;
        if (trait === "Người Phố Hội") synergySpeed += count >= 3 ? 6 : 4;
        if (trait === "Thú Nhân") f.stats.crit += count >= 3 ? 5 : 3;
        if (trait === "Linh Vật") synergySpeed += 5;
        if (trait === "Vật Linh") f.stats.mass += 20;
      }
    }
    for (const friends of contexts.get(f.team)!.groups) {
      const group = friends.group,
        friendCount = friends.members.length;
      if (friendCount >= 2 && friends.members.includes(f)) {
        const three =
            groupTier(
              group,
              friends.members.map((t) => t.characterId),
            ) === 3,
          id = friends.group!.id;
        if (["G01", "G05", "G14"].includes(id)) synergySpeed += three ? 6 : 4;
        if (id === "G04") f.stats.defense += three ? 2 : 1;
        if (id === "G06") f.stats.superPower += three ? 15 : 10;
        if (id === "G07") f.stats.crit += three ? 5 : 3;
      }
    }
    let haste = 100;
    for (const b of f.buffs)
      if (b.until > s.tick) {
        if (b.kind === "reach") f.stats.reach += b.value;
        if (b.source <= -1000) {
          if (b.kind === "attack") synergyAttack += b.value;
          if (b.kind === "speed") synergySpeed += b.value;
          if (b.kind === "haste") synergyHaste += b.value - 100;
          if (b.kind === "armor") f.stats.defense += b.value;
          continue;
        }
        if (b.kind === "attack") attack += b.value;
        if (b.kind === "speed" || b.kind === "deliverySpeed") speed += b.value;
        if (b.kind === "armor") f.stats.defense += b.value;
        if (b.kind === "haste") haste += b.value - 100;
      }
    attack += synergyAttack;
    speed += synergySpeed;
    haste += synergyHaste;
    f.stats.attack = Math.min(
      300,
      div(div(f.baseStats.attack * tempo.attack, 100) * (100 + attack), 100) + (auraAttack ? Math.max(1, Math.round(div(f.baseStats.attack * tempo.attack, 100) * auraAttack / 100)) : 0),
    );
    f.stats.speed = Math.min(
      900,
      div(div(f.baseStats.speed * tempo.speed, 100) * (100 + speed), 100),
    );
    f.stats.cooldown = Math.max(
      8,
      div(div(f.baseStats.cooldown * 100, tempo.haste) * 100, haste),
    );
    f.stats.charge = Math.min(300, div(f.baseStats.charge * tempo.charge, 100));
    f.stats.superPower = Math.min(
      300,
      div(f.stats.superPower * tempo.superPower, 100),
    );
    f.stats.defense = Math.min(60, f.stats.defense);
    f.stats.mass = Math.min(500, f.stats.mass);
    f.stats.crit = Math.min(65, f.stats.crit);
    f.stats.reach = Math.min(9000, f.stats.reach);
    f.vx = div(f.vx * f.stats.speed, oldSpeed);
    f.vy = div(f.vy * f.stats.speed, oldSpeed);
    if (f.stats.cooldown !== oldCooldown) {
      if (f.nextAttack > s.tick)
        f.nextAttack =
          s.tick +
          Math.max(
            1,
            div((f.nextAttack - s.tick) * f.stats.cooldown, oldCooldown),
          );
      for (const key of Object.keys(f.cooldowns))
        if (f.cooldowns[key] > s.tick)
          f.cooldowns[key] =
            s.tick +
            Math.max(
              1,
              div((f.cooldowns[key] - s.tick) * f.stats.cooldown, oldCooldown),
            );
    }
    const slows = f.buffs.filter((b) => b.kind === "slow" && b.until > s.tick);
    f.slowUntil = Math.max(0, ...slows.map((b) => b.until));
    f.memory.slowPower = Math.max(0, ...slows.map((b) => b.value));
    if (has(f, 1) && s.tick % 300 === 0 && s.tick <= 1800) {
      energy(s, f, itemValue(f, 1, 5));
      event(s, "item:01", f);
    }
    if (has(f, 19) && s.tick % 150 === 0 && s.tick <= 600)
      heal(s, f, f, itemValue(f, 19, 4));
  }
  for (const cfg of s.config.teams) {
    for (const group of FRIEND_GROUPS) {
      const source = chosen(s, cfg.id).find(
        (f) => f.hp > 0 && group.members.includes(f.characterId || ""),
      );
      if (source) friendGroupEvent(s, source, "pulse", group.id);
    }
  }
  if (s.tick > 0 && s.tick % 30 === 0) for (const f of s.fighters) passiveEvent(s, f, "pulse");
}
export function characterWall(s: BattleState, f: Fighter) {
  passiveEvent(s, f, "wall");
}
export function characterContacts(s: BattleState, a: Fighter, b: Fighter) {
  if (
    (!a.characterId && !b.characterId) ||
    a.team === b.team ||
    a.hp <= 0 ||
    b.hp <= 0 ||
    distance(a, b) > (a.radius + b.radius + 2) ** 2
  )
    return;
  for (const [f, t] of [
    [a, b],
    [b, a],
  ]) {
    if (!f.characterId || t.hp <= 0) continue;
    const key = "contact:" + t.id;
    if ((f.memory[key] || 0) > s.tick) continue;
    f.memory[key] = s.tick + 24;
    passiveEvent(s, f, "contact", t);
    if (has(f, 11) && s.tick >= (f.memory.fridgeReady || 0)) {
      f.memory.fridgeReady = s.tick + 120;
      slow(s, f, t, itemValue(f, 11, 12), 30);
      event(s, "item:11", f, t);
    }
    if ((f.memory.dash || 0) > s.tick) {
      f.memory.dash = 0;
      characterDamage(s, f, t, div(f.stats.attack * f.memory.dashPower, 100));
    }
  }
}

function bondEvent(
  s: BattleState,
  source: Fighter,
  kind: string,
  target?: Fighter,
) {
  friendEvent(s, source, kind);
  for (const b of BONDS) resolveBondEvent(s, source, kind, b, target);
}
function resolveBondEvent(
  s: BattleState,
  source: Fighter,
  kind: string,
  b: (typeof BONDS)[number],
  target?: Fighter,
) {
  const buffSource = -2000 - BONDS.indexOf(b);
  const bondBuff = (
    state: BattleState,
    f: Fighter,
    kind: string,
    value: number,
    ticks: number,
  ) => buff(state, f, kind, value, ticks, buffSource);
  const fs = chosen(s, source.team).filter((f) =>
    b.members.includes(f.characterId || ""),
  );
  if (
    fs.length !== b.size ||
    !fs.includes(source) ||
    fs.some((f) => f.hp <= 0) ||
    fs.some((f) => fs.some((t) => !within(f, t, b.size === 2 ? 240 : 280)))
  )
    return;
  const state =
    s.bonds[`${source.team}:${b.id}`] ||
    (s.bonds[`${source.team}:${b.id}`] = { uses: 0, ready: 0 });
  if (state.uses >= (b.size === 2 ? 3 : 2) || state.ready > s.tick) return;
  const get = (n: number) => fs.find((f) => no(f) === n)!;
  let ok = false;
  if (b.size === 3) {
    const triggers = [15, 7, 18, 9, 6, 19, 10, 12, 20, 21, 26];
    ok = kind === "super" && no(source) === triggers[Number(b.id.slice(1)) - 1];
  } else {
    const newBonds: Record<string, number[]> = {
      P14: [21, 23],
      P15: [22, 24],
      P16: [24, 25],
      P17: [21, 25],
      P18: [22, 23],
      P19: [26, 27],
      P20: [28, 29],
      P21: [29, 30],
      P22: [31, 9],
      P23: [32, 12],
      P24: [33, 18],
    };
    ok = newBonds[b.id]
      ? newBonds[b.id].includes(no(source)) &&
        (kind === "super" || (b.id === "P16" && kind === "skill"))
      : fs.includes(source) && (kind === "skill" || kind === "super");
  }
  if (!ok) return;
  state.uses++;
  state.ready = s.tick + (b.size === 2 ? 240 : 360);
  event(s, "bond:" + b.id, source);
  switch (b.id) {
    case "P22":
      fs.filter(f => f !== source).forEach(f => shield(s, source, f, 10, 90));
      break;
    case "P23":
      fs.filter(f => f !== source).forEach(f => nextBonus(s, f, 16, buffSource));
      break;
    case "P24":
      fs.filter(f => f !== source).forEach(f => heal(s, source, f, 8));
      break;
    case "P01":
      shield(s, source, get(8), 15, 60);
      bondBuff(s, get(8), "speed", 8, 60);
      break;
    case "P02":
      energy(s, get(7), 10);
      break;
    case "P03":
      fs.forEach((f) => shield(s, source, f, 10, 60));
      break;
    case "P04":
      bondBuff(s, get(4), "speed", 10, 60);
      break;
    case "P05":
      nextBonus(s, get(16), 30, buffSource);
      break;
    case "P06":
      shield(s, source, get(11), 10, 60);
      break;
    case "P07":
      energy(s, get(16), 8);
      break;
    case "P08":
      nextBonus(s, get(12), 30, buffSource);
      break;
    case "P09":
      energy(s, get(14), 8);
      break;
    case "P10":
      nextBonus(s, get(17), 25, buffSource);
      break;
    case "P11":
      energy(s, get(13), 8);
      break;
    case "P12":
      shield(s, source, get(11), 12, 60);
      break;
    case "P13":
      nextBonus(s, get(13), 25, buffSource);
      break;
    case "P14":
      shield(s, source, get(no(source) === 21 ? 23 : 21), 15, 90);
      break;
    case "P15":
      energy(s, get(no(source) === 22 ? 24 : 22), 8);
      break;
    case "P16":
      bondBuff(s, get(no(source) === 24 ? 25 : 24), "attack", 8, 90);
      break;
    case "P17":
      heal(s, source, get(no(source) === 21 ? 25 : 21), 12);
      break;
    case "P18":
      fs.forEach((f) => shield(s, source, f, 8, 90));
      break;
    case "P19":
      energy(s, get(no(source) === 26 ? 27 : 26), 8);
      break;
    case "P20":
      shield(s, source, get(no(source) === 28 ? 29 : 28), 8, 90);
      break;
    case "P21":
      energy(s, get(no(source) === 29 ? 30 : 29), 8);
      break;
    case "T10":
      fs.forEach((f) => shield(s, source, f, 12, 90));
      break;
    case "T11":
      fs.forEach((f) => shield(s, source, f, 8, 90));
      break;
    case "T09":
      fs.forEach((f) => shield(s, source, f, 15, 90));
      break;
    case "T01":
      fs.forEach((f) => shield(s, source, f, 18, 90));
      break;
    case "T02":
      fs.forEach((f) => bondBuff(s, f, "speed", 10, 90));
      break;
    case "T03":
      fs.forEach((f) => heal(s, source, f, 10));
      break;
    case "T04":
      fs.forEach((f) => bondBuff(s, f, "attack", 8, 90));
      break;
    case "T05":
      fs.forEach((f) => {
        shield(s, source, f, 15, 90);
        f.buffs = f.buffs.filter((b) => b.kind !== "slow");
        f.slowUntil = 0;
      });
      break;
    case "T06":
      fs.forEach((f) => nextBonus(s, f, 25, buffSource));
      break;
    case "T07":
      fs.forEach((f) => {
        shield(s, source, f, 12, 90);
        bondBuff(s, f, "speed", 8, 90);
      });
      break;
    case "T08":
      fs.forEach((f) => nextBonus(s, f, 30, buffSource));
      break;
  }
}

function abilityTarget(s: BattleState, f: Fighter, rangedRange: number, extraReach = 0) {
  if (isRanged(f)) return nearest(s, f, rangedRange);
  let target: Fighter | undefined;
  let closest = Infinity;
  for (const t of s.fighters) {
    if (t.hp <= 0 || t.team === f.team || isClashProtected(t, s.tick)) continue;
    const d = distance(f, t);
    if (d <= (Math.min(9000, weaponReach(s, f) + extraReach) + t.radius) ** 2 && d < closest) {
      target = t;
      closest = d;
    }
  }
  return target;
}

/** Undefined delegates to the class kit; null preserves cooldown/energy on failure. */
function legendaryAbility(s: BattleState, f: Fighter, ultimate: boolean): Fighter | null | undefined {
  const n = no(f);
  if (n === 22) {
    const k = LEGENDARY_KITS.char_22, ally = nearest(s, f, 180, true, true);
    if (!ally || s.zones.length >= 120) return null;
    s.zones = s.zones.filter(z => !(z.owner === f.id && z.super === ultimate && z.auraAttack));
    s.zones.push({ owner: f.id, x: f.x, y: f.y, follow: true, start: s.tick, until: s.tick + (ultimate ? k.superDuration : k.skillDuration), radius: ultimate ? k.superRadius : k.skillRadius, auraAttack: ultimate ? k.superAttack : k.skillAttack, auraHaste: ultimate ? k.superHaste : 0, super: ultimate });
    shield(s, f, ally, ultimate ? recoveryValue(f, div(f.stats.attack * 60, 100)) : div(f.stats.attack * 80, 100), 90);
    const enemy = abilityTarget(s, f, 0);
    if (enemy) characterDamage(s, f, enemy, div(f.stats.attack * (ultimate ? superValue(f, k.superPower) : k.skillPower), 100));
    return ally;
  }
  if (n === 23) {
    const k = LEGENDARY_KITS.char_23;
    const reach = ultimate ? k.superReach : k.skillReach;
    const enemy = abilityTarget(s, f, 0, reach);
    if (!enemy) return null;
    buff(s, f, "reach", reach, ultimate ? k.superDuration : k.skillDuration, -7000 - f.id);
    refreshReach(s, f);
    characterDamage(s, f, enemy, div(f.stats.attack * (ultimate ? superValue(f, k.superPower) : k.skillPower), 100));
    return enemy;
  }
  if (n === 31) {
    const k = LEGENDARY_KITS.char_31;
    const enemy = nearest(s, f, ultimate ? RANGED_SUPER_RANGE : RANGED_SKILL_RANGE);
    if (!enemy || !launch(s, f, enemy, ultimate ? superValue(f, k.superPower) : k.skillPower, { kind: ultimate ? "super" : "skill", range: ultimate ? RANGED_SUPER_RANGE : RANGED_SKILL_RANGE, radiation: ultimate ? 2 : 1, splash: ultimate ? k.splashRadius : 0, splashPower: ultimate ? superValue(f, k.splashPower) : 0 })) return null;
    return enemy;
  }
  if (n === 32) {
    const k = LEGENDARY_KITS.char_32, enemy = nearest(s, f, ultimate ? RANGED_SUPER_RANGE : RANGED_SKILL_RANGE);
    if (!enemy || s.zones.length >= 120) return null;
    // A caster can hold one territory: recasting replaces it, rather than stacking
    // several permanent damage/slow fields on a trapped enemy.
    s.zones = s.zones.filter(z => z.owner !== f.id || !z.territory);
    const start = s.tick + k.windup;
    s.zones.push({ owner: f.id, x: enemy.x, y: enemy.y, start, until: start + (ultimate ? k.superDuration : k.skillDuration), radius: ultimate ? k.superRadius : k.skillRadius, power: ultimate ? k.superPower : k.skillPower, slow: ultimate ? k.superSlow : k.skillSlow, every: 30, super: ultimate, territory: true });
    if (ultimate) f.skillReady = Math.max(f.skillReady, start + k.superDuration);
    return enemy;
  }
  if (n === 33) {
    const k = LEGENDARY_KITS.char_33, enemy = nearest(s, f, k.range), ally = nearest(s, f, k.range, true, true);
    if (!ally || !enemy && ally.hp >= ally.stats.hp) return null;
    if (enemy && !launch(s, f, enemy, ultimate ? superValue(f, k.superPower) : k.skillPower, { kind: ultimate ? "super" : "skill", range: k.range })) return null;
    heal(s, f, ally, recoveryValue(f, div(f.stats.hp * (ultimate ? k.superHeal : k.skillHeal), 100)));
    if (ultimate) shield(s, f, f, recoveryValue(f, div(f.stats.hp * k.superShield, 100)), 90);
    return enemy || ally;
  }
  return undefined;
}

// Melee abilities require physical reach. Ranged damage resolves on collision.
function skill(s: BattleState, f: Fighter) {
  const n = no(f);
  const custom = legendaryAbility(s, f, false);
  if (custom !== undefined) {
    if (!custom) return false;
    event(s, "skill:" + String(n).padStart(2, "0"), f, custom);
    bondEvent(s, f, "skill");
    affinityEvent(s, f, "skill", custom);
    passiveEvent(s, f, "skill", custom);
    return true;
  }
  const role = CHARACTER_BALANCE[f.characterId!].role;
  if (role === "support") {
    const ally = nearest(s, f, 180, true, true);
    if (!ally) return false;
    shield(s, f, ally, f.stats.attack, 90);
    const enemy = abilityTarget(s, f, RANGED_SKILL_RANGE);
    if (enemy) {
      if (isRanged(f))
        launch(s, f, enemy, 80, { kind: "skill", range: RANGED_SKILL_RANGE });
      else characterDamage(s, f, enemy, div(f.stats.attack * 80, 100));
    }
    event(s, "skill:" + String(n).padStart(2, "0"), f, ally);
    bondEvent(s, f, "skill");
    affinityEvent(s, f, "skill");
    passiveEvent(s, f, "skill", enemy);
    return true;
  }
  const enemy = abilityTarget(s, f, RANGED_SKILL_RANGE);
  if (!enemy) return false;
  let power =
    role === "tank"
      ? 110
      : role === "assassin"
        ? 150
        : role === "ranger"
          ? 140
          : role === "fighter"
            ? 130
            : 120;
  if ([28, 29, 30].includes(n) && has(f, n)) power += 12;
  if (isRanged(f)) {
    if (
      !launch(s, f, enemy, power, {
        range: RANGED_SKILL_RANGE,
        kind: "skill",
        slow: role === "controller" ? 15 : 0,
      })
    )
      return false;
  } else characterDamage(s, f, enemy, div(f.stats.attack * power, 100));
  if (n === 27 && has(f, 27) && enemy.hp > 0)
    buff(s, enemy, "burnDot", Math.max(1, f.stats.burn), 60, f.id);
  if (role === "tank") shield(s, f, f, div(f.stats.hp * 3, 100), 60);
  event(s, "skill:" + String(n).padStart(2, "0"), f, enemy);
  bondEvent(s, f, "skill");
  affinityEvent(s, f, "skill", enemy);
  passiveEvent(s, f, "skill", enemy);
  return true;
}

function superCast(s: BattleState, f: Fighter) {
  const n = no(f);
  const custom = legendaryAbility(s, f, true);
  if (custom !== undefined) {
    if (!custom) return false;
    finishSuper(s, f, custom);
    return true;
  }
  const role = CHARACTER_BALANCE[f.characterId!].role;
  const target =
    role === "support"
      ? nearest(s, f, 180, true, true)
      : abilityTarget(s, f, RANGED_SUPER_RANGE);
  if (!target) return false;
  let power =
    role === "tank"
      ? 150
      : role === "assassin"
        ? 320
        : role === "ranger"
          ? 300
          : role === "fighter"
            ? 280
            : 240;
  if ([28, 29, 30].includes(n) && has(f, n)) power += 15;
  if (role === "support") {
    heal(s, f, target, recoveryValue(f, div(target.stats.hp * 10, 100)));
    shield(s, f, target, recoveryValue(f, div(f.stats.attack, 2)), 90);
    const enemy = abilityTarget(s, f, RANGED_SUPER_RANGE);
    if (enemy) {
      if (isRanged(f))
        launch(s, f, enemy, superValue(f, 160), {
          kind: "super",
          range: RANGED_SUPER_RANGE,
        });
      else
        characterDamage(
          s,
          f,
          enemy,
          superValue(f, div(f.stats.attack * 160, 100)),
        );
    }
  } else if (isRanged(f)) {
    if (
      !launch(s, f, target, superValue(f, power), {
        range: RANGED_SUPER_RANGE,
        kind: "super",
        slow: role === "controller" ? 20 : 0,
      })
    )
      return false;
  } else
    characterDamage(
      s,
      f,
      target,
      superValue(f, div(f.stats.attack * power, 100)),
    );
  if (role === "tank")
    shield(s, f, f, recoveryValue(f, div(f.stats.hp * 12, 100)), 90);
  if (n === 27 && has(f, 27) && target.hp > 0)
    buff(s, target, "burnDot", Math.max(1, f.stats.burn), 90, f.id);
  finishSuper(s, f, target);
  return true;
}
function finishSuper(s: BattleState, f: Fighter, target: Fighter) {
  f.energy = 0;
  f.superUntil = s.tick + 120;
  f.supers++;
  if (has(f, 8)) buff(s, f, "electric", itemValue(f, 8, 25), 120, -8);
  if (has(f, 9)) buff(s, f, "attack", itemValue(f, 9, 8), 90, -9);
  if (has(f, 20)) {
    const ally = nearest(s, f, 180, true, true);
    if (ally) shield(s, f, ally, itemValue(f, 20, 8), 90);
  }
  if (has(f, 21)) energy(s, f, itemValue(f, 21, 6));
  if (has(f, 23)) shield(s, f, f, itemValue(f, 23, 8), 90);
  event(s, "super", f, target);
  bondEvent(s, f, "super");
  affinityEvent(s, f, "super", target);
  passiveEvent(s, f, "super", target);
}

export function characterCombat(s: BattleState) {
  // Supers spend only energy present at the beginning of this tick.
  for (const f of s.fighters) {
    if (f.hp <= 0 || !f.characterId) continue;
    let cast = false;
    if (
      f.energy >= 100 &&
      f.superUntil <= s.tick &&
      (f.memory.interrupt || 0) <= s.tick
    )
      cast = superCast(s, f);
    if (
      !cast &&
      f.skillReady <= s.tick &&
      (f.memory.interrupt || 0) <= s.tick &&
      skill(s, f)
    ) {
      f.skillReady = s.tick + 7 * 30;
    }
  }

  for (const f of s.fighters) {
    if (f.hp <= 0) continue;
    if (s.tick % 30 === 0) for (const b of f.buffs) {
      if (b.kind !== "radiation" || b.until <= s.tick) continue;
      const source = s.fighters[b.source];
      if (source?.hp > 0) characterDamage(s, source, f, Math.max(1, div(source.stats.attack * LEGENDARY_KITS.char_31.radiationPower * b.value, 100)), false, 0);
    }
    for (const b of f.buffs)
      if (
        (b.kind === "dot" || b.kind === "soupDot" || b.kind === "burnDot") &&
        b.until >= s.tick &&
        (b.until - s.tick) % 30 === 0 &&
        s.tick > b.until - (b.kind === "dot" ? 90 : 60)
      ) {
        const src = s.fighters[b.source];
        if (src?.hp > 0)
          characterDamage(
            s,
            src,
            f,
            b.kind === "soupDot"
              ? div(src.stats.attack * b.value, 100)
              : b.value,
            false,
            0,
          );
      }
    if (f.hp <= 0 || (f.memory.interrupt || 0) > s.tick) continue;
    rotateWeaponAngle(f);
    if (f.characterId && isRanged(f)) {
      if (f.nextAttack <= s.tick) {
        const t = nearest(s, f, RANGED_ATTACK_RANGE);
        if (
          t &&
          launch(s, f, t, 100, { normal: true, range: RANGED_ATTACK_RANGE })
        )
          f.nextAttack = s.tick + f.stats.cooldown;
      }
      continue;
    }
    {
      const reach = weaponReach(s, f);
      const count = weaponCount(f);
      for (let w = 0; w < count; w++) {
        const d = DIRECTIONS[(f.angle + w * 16) % 32],
          ax = f.x + div(d[0] * f.radius, UNIT),
          ay = f.y + div(d[1] * f.radius, UNIT),
          x = f.x + div(d[0] * reach, UNIT),
          y = f.y + div(d[1] * reach, UNIT);
        for (const t of s.fighters) {
          const key = w + ":" + t.id;
          if (
            t.hp <= 0 ||
            t.team === f.team ||
            (f.cooldowns[key] || 0) > s.tick
          )
            continue;
          if (capsuleHit(ax, ay, x, y, t.x, t.y, t.radius + 500)) {
            if (isClashProtected(t, s.tick)) continue;
            f.cooldowns[key] = s.tick + f.stats.cooldown;
            reverseWeaponSpin(f, s.tick);
            normalHit(s, f, t);
          }
        }
      }
    }
  }
  const bounds = safeBounds(s);
  for (const p of s.projectiles) {
    const f = s.fighters[p.owner],
      ox = p.x,
      oy = p.y;
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (
      f.hp <= 0 ||
      p.x < bounds.left + 450 ||
      p.x > bounds.right - 450 ||
      p.y < bounds.top + 450 ||
      p.y > bounds.bottom - 450
    )
      p.life = 0;
    for (const t of s.fighters) {
      if (p.life <= 0 || t.hp <= 0 || t.team === f.team || p.hit.includes(t.id))
        continue;
      if (capsuleHit(ox, oy, p.x, p.y, t.x, t.y, t.radius + 450)) {
        if (p.normal && !isClashProtected(t, s.tick)) {
          reverseWeaponSpin(f, s.tick);
          normalHit(
            s,
            f,
            t,
            p.hit.length ? Math.min(100, superValue(f, 60)) : 100,
          );
        } else if (!p.normal)
          characterDamage(
            s,
            f,
            t,
            div(f.stats.attack * (p.power || 100), 100),
            false,
            p.push || 150,
          );
        if (p.slow && t.hp > 0 && !isClashProtected(t, s.tick))
          slow(s, f, t, p.slow, p.kind === "super" ? 45 : 30);
        if (!isClashProtected(t, s.tick)) {
          if (p.radiation) addRadiation(s, f, t, p.radiation);
          if (p.splash) {
            for (const other of s.fighters) if (other !== t && other.hp > 0 && other.team !== f.team && within(t, other, p.splash) && !isClashProtected(other, s.tick)) {
              characterDamage(s, f, other, div(f.stats.attack * (p.splashPower || 0), 100), false, 0);
              if (p.radiation) addRadiation(s, f, other, p.radiation);
            }
            event(s, "impact:radiation", f, t, p.splash);
          }
        }
        p.hit.push(t.id);
        if (p.pierce-- <= 0) p.life = 0;
      }
    }
  }
  s.projectiles = s.projectiles.filter((p) => p.life > 0);
  for (const z of s.zones) {
    const f = s.fighters[z.owner];
    if (f.hp <= 0 || z.until < s.tick || s.tick < (z.start || 0)) continue;
    if (z.territory && s.tick >= z.until) continue;
    if (z.follow) {
      z.x = f.x;
      z.y = f.y;
    }
    if (z.trap) {
      const t = s.fighters.find(
        (t) => t.hp > 0 && t.team !== f.team && within(z, t, z.radius || 65),
      );
      if (t) {
        for (const a of s.fighters)
          if (a.hp > 0 && a.team !== f.team && within(z, a, z.radius || 100)) {
            characterDamage(s, f, a, div(f.stats.attack * (z.power || 125), 100));
            slow(s, f, a, z.slow || 25, 30);
          }
        z.until = s.tick;
        event(s, "impact:trap", f);
      }
      continue;
    }
    for (const t of s.fighters) {
      if (t.hp <= 0) continue;
      const inside = z.line
        ? capsuleHit(
            z.x,
            z.y,
            z.x + div(z.line.dx * z.line.length * 100, UNIT),
            z.y + div(z.line.dy * z.line.length * 100, UNIT),
            t.x,
            t.y,
            div(z.line.width * 100, 2),
          )
        : within(z, t, z.radius || 140);
      if (!inside) continue;
      if (t.team === f.team) {
        if (z.attack) buff(s, t, "attack", z.attack, 2, f.id);
        if (
          z.heal &&
          (s.tick - (z.start || 0)) % (z.every || 30) === 0 &&
          s.tick > (z.start || 0)
        )
          heal(s, f, t, z.super ? superValue(f, z.heal) : z.heal);
      } else {
        if (z.slow) slow(s, f, t, z.slow, 2);
        if (
          z.power &&
          (s.tick - (z.start || 0)) % (z.every || 30) === 0 &&
          (s.tick > (z.start || 0) || z.territory)
        )
          characterDamage(
            s,
            f,
            t,
            div(
              f.stats.attack * z.power * (z.super ? f.stats.superPower : 100),
              10000,
            ),
            false,
            z.push || 0,
          );
      }
    }
  }
  s.zones = s.zones.filter(
    (z) => z.until > s.tick && s.fighters[z.owner].hp > 0,
  );
  for (const f of s.fighters)
    f.energy = Math.min(100, f.energy + (f.memory.gain || 0));
  s.events = s.events.slice(-120);
}
