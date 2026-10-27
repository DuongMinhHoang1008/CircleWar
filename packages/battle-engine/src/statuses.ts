import { div } from "./math";
import { TICK_RATE, type BattleState, type Fighter } from "./types";
import { closingTempo } from "./pacing";

export type StatusKind =
  | "burn"
  | "poison"
  | "frozen"
  | "paralyzed"
  | "blessing"
  | "rage"
  | "introvert"
  | "diabetes"
  | "myopia"
  | "bleeding"
  | "stunned"
  | "pressure"
  | "radiation";
export interface CombatStatus {
  kind: StatusKind;
  /** HP/second for periodic effects; percentage for modifiers. */
  power: number;
  until: number;
  source: number;
  carry: number;
}
export const STATUS_RULES = {
  burn: { label: "Burn", power: 4, cap: 30, duration: 90 },
  poison: { label: "Poison", power: 2, cap: 15, duration: 120 },
  frozen: { label: "Frozen", power: 25, cap: 40, duration: 60 },
  paralyzed: { label: "Paralyzed", power: 25, cap: 40, duration: 60 },
  blessing: { label: "Blessing", power: 4, cap: 30, duration: 90 },
  rage: { label: "Rage", power: 20, cap: 50, duration: 90 },
  introvert: { label: "Hướng Nội", power: 25, cap: 25, duration: 60 },
  diabetes: { label: "Tiểu Đường", power: 35, cap: 35, duration: 90 },
  myopia: { label: "Cận Thị", power: 30, cap: 35, duration: 90 },
  bleeding: { label: "Bleeding", power: 4, cap: 20, duration: 90 },
  stunned: { label: "Choáng", power: 1, cap: 1, duration: 15 },
  pressure: { label: "Áp lực", power: 20, cap: 25, duration: 90 },
  radiation: { label: "Phóng xạ", power: 1, cap: 3, duration: 90 },
} as const;
export const MAX_POISON_STACKS = 5;

export function statusPower(f: Fighter, kind: StatusKind, tick: number) {
  let power = 0;
  for (const effect of f.statuses) {
    if (effect.kind !== kind || effect.until <= tick) continue;
    power =
      kind === "poison" ? power + effect.power : Math.max(power, effect.power);
  }
  return power;
}
export function clearStatus(f: Fighter, kind: StatusKind) {
  let write = 0;
  for (const effect of f.statuses)
    if (effect.kind !== kind) f.statuses[write++] = effect;
  f.statuses.length = write;
  if (kind === "frozen") {
    f.slowUntil = 0;
    f.memory.slowPower = 0;
  }
  if (kind === "burn") f.burnUntil = 0;
}

/** Strongest wins; poison alone has five independently expiring stacks. */
export function applyStatus(
  s: BattleState,
  source: Fighter,
  target: Fighter,
  kind: StatusKind,
  power: number = STATUS_RULES[kind].power,
  duration: number = STATUS_RULES[kind].duration,
  allowFriendlyDebuff = false,
) {
  if (
    target.hp <= 0 ||
    !Number.isFinite(power) ||
    !Number.isFinite(duration) ||
    power <= 0 ||
    duration <= 0
  )
    return false;
  if (
    kind === "introvert" &&
    (source !== target || target.characterId !== "char_01")
  )
    return false;
  const beneficial =
    kind === "blessing" || kind === "rage" || kind === "introvert";
  if (
    beneficial
      ? source.team !== target.team
      : source.team === target.team && !allowFriendlyDebuff
  )
    return false;
  if (kind === "stunned" && (target.memory.stunImmuneUntil || 0) > s.tick)
    return false;
  if (kind === "frozen" && (target.memory.immuneSlow || 0) > s.tick)
    return false;
  power = Math.max(1, Math.min(STATUS_RULES[kind].cap, Math.trunc(power)));
  const until =
    s.tick +
    Math.max(1, Math.min(kind === "stunned" ? 18 : 300, Math.trunc(duration)));
  if (kind === "stunned") target.memory.stunImmuneUntil = s.tick + 60;
  let existing: CombatStatus | undefined,
    count = 0;
  for (const effect of target.statuses) {
    if (effect.kind !== kind || effect.until <= s.tick) continue;
    count++;
    if (!existing || effect.until < existing.until) existing = effect;
  }
  if (existing && (kind !== "poison" || count >= MAX_POISON_STACKS)) {
    if (kind !== "radiation" && power < existing.power) return false;
    existing.power =
      kind === "radiation" ? Math.min(3, existing.power + power) : power;
    existing.until = Math.max(existing.until, until);
    existing.source = source.id;
  } else
    target.statuses.push({ kind, power, until, source: source.id, carry: 0 });
  if (kind === "burn") {
    target.burnUntil = until;
    target.burnSource = source.id;
  }
  if (kind === "frozen") target.slowUntil = Math.max(target.slowUntil, until);
  if (!existing)
    s.events.push({
      tick: s.tick,
      type: `status:${kind}`,
      source: source.id,
      target: target.id,
      amount: power,
    });
  return true;
}

export const attackRate = (f: Fighter, tick: number) =>
  100 - statusPower(f, "paralyzed", tick);
export const attackCooldown = (f: Fighter, tick: number) =>
  Math.max(8, Math.ceil((f.stats.cooldown * 100) / attackRate(f, tick)));
export const statusDamage = (f: Fighter, tick: number, raw: number) =>
  div(
    raw *
      (100 + statusPower(f, "rage", tick)) *
      (100 - statusPower(f, "pressure", tick)),
    10000,
  );

export function healingRate(f: Fighter, tick: number, shrinkSeconds?: number) {
  let radiation = statusPower(f, "radiation", tick);
  for (const buff of f.buffs)
    if (buff.kind === "radiation" && buff.until > tick) radiation += buff.value;
  const rate = Math.max(
    35,
    100 - Math.min(3, radiation) * 8 - statusPower(f, "diabetes", tick),
  );
  return shrinkSeconds === undefined ? rate : div(rate * closingTempo(tick, shrinkSeconds).recovery, 100);
}

/** Runs before movement/attacks. Fixed-point carries avoid fractional HP and frame allocations. */
export function tickStatuses(s: BattleState) {
  for (const target of s.fighters) {
    if (target.hp <= 0) continue;
    let write = 0;
    for (const effect of target.statuses) {
      if (effect.until < s.tick) continue;
      target.statuses[write++] = effect;
      if (
        effect.kind !== "burn" &&
        effect.kind !== "poison" &&
        effect.kind !== "blessing" &&
        effect.kind !== "introvert" &&
        effect.kind !== "bleeding" &&
        effect.kind !== "radiation"
      )
        continue;
      if (effect.kind === "bleeding" && !(target.memory.distanceMoved > 0))
        continue;
      // Bound periodic effects by maximum HP so a small kit cannot erase tanks.
      const percent =
        effect.kind === "poison" ? 1 : effect.kind === "burn" ? 3 : 2;
      let rate = 100;
      if (effect.kind === "blessing" || effect.kind === "introvert")
        rate = healingRate(target, s.tick, s.config.shrinkSeconds);
      const power =
        effect.kind === "introvert"
          ? Math.max(1, div(target.baseStats.hp, 100))
          : effect.kind === "radiation"
            ? effect.power * 2
            : effect.power;
      effect.carry +=
        Math.min(power, Math.max(1, div(target.baseStats.hp * percent, 100))) *
        rate;
      const amount = div(effect.carry, TICK_RATE * 100);
      effect.carry %= TICK_RATE * 100;
      if (!amount || target.hp <= 0) continue;
      if (effect.kind === "blessing" || effect.kind === "introvert") {
        const healing = Math.min(target.stats.hp - target.hp, amount);
        target.hp += healing;
        if (healing)
          s.events.push({
            tick: s.tick,
            type: "heal",
            source: effect.source,
            target: target.id,
            amount: healing,
          });
      } else {
        const damage = Math.min(target.hp, amount),
          source = s.fighters[effect.source];
        target.hp -= damage;
        target.taken += damage;
        if (source && source.team !== target.team) source.dealt += damage;
        s.events.push({
          tick: s.tick,
          type: "hit",
          source: effect.source,
          target: target.id,
          amount: damage,
        });
        if (!target.hp) {
          target.deadAt = s.tick;
          if (source && source.team !== target.team) source.kills++;
          s.events.push({
            tick: s.tick,
            type: "kill",
            source: effect.source,
            target: target.id,
            amount: damage,
          });
        }
      }
    }
    target.statuses.length = write;
    const rate = attackRate(target, s.tick),
      previous = target.memory.statusAttackRate || 100;
    if (rate !== previous) {
      if (target.nextAttack > s.tick)
        target.nextAttack =
          s.tick + Math.ceil(((target.nextAttack - s.tick) * previous) / rate);
      for (const key in target.cooldowns)
        if (!key.startsWith("clash:") && target.cooldowns[key] > s.tick)
          target.cooldowns[key] =
            s.tick +
            Math.ceil(((target.cooldowns[key] - s.tick) * previous) / rate);
      target.memory.statusAttackRate = rate;
    }
  }
}
