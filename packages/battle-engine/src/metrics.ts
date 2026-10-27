import type { BattleState, CombatMetrics, DamageType, Fighter } from "./types";

export const emptyCombatMetrics = (): CombatMetrics => ({
  healing: 0,
  allyHealing: 0,
  shielding: 0,
  allyShielding: 0,
  shieldAbsorbed: 0,
  allyShieldAbsorbed: 0,
  buffsApplied: 0,
  debuffsApplied: 0,
  selfEffects: 0,
  controlTicks: 0,
  allyBuffTicks: 0,
  friendlyDamage: 0,
  effects: {},
  effectTicks: {},
  damageByType: {},
});
export const combatMetrics = (fighter: Fighter) =>
  (fighter.metrics ??= emptyCombatMetrics());
export function recordHealing(
  source: Fighter | undefined,
  target: Fighter,
  amount: number,
) {
  if (!source || amount <= 0) return;
  const metrics = combatMetrics(source);
  metrics.healing += amount;
  if (source !== target && source.team === target.team)
    metrics.allyHealing += amount;
}
export function recordShielding(
  source: Fighter,
  target: Fighter,
  amount: number,
) {
  if (amount <= 0) return;
  const metrics = combatMetrics(source);
  metrics.shielding += amount;
  if (source !== target && source.team === target.team)
    metrics.allyShielding += amount;
}
export function recordAbsorption(
  source: Fighter | undefined,
  target: Fighter,
  amount: number,
) {
  if (!source || amount <= 0) return;
  const metrics = combatMetrics(source);
  metrics.shieldAbsorbed += amount;
  if (source !== target && source.team === target.team)
    metrics.allyShieldAbsorbed += amount;
}
export function recordDamage(
  source: Fighter | undefined,
  target: Fighter,
  amount: number,
  type: DamageType = "direct",
) {
  if (!source || amount <= 0) return;
  const metrics = combatMetrics(source);
  if (source.team === target.team) metrics.friendlyDamage += amount;
  else metrics.damageByType[type] = (metrics.damageByType[type] || 0) + amount;
}
export function recordEffect(
  source: Fighter | undefined,
  target: Fighter,
  kind: string,
  beneficial: boolean,
) {
  if (!source) return;
  const metrics = combatMetrics(source);
  metrics.effects[kind] = (metrics.effects[kind] || 0) + 1;
  if (source === target) metrics.selfEffects++;
  else if (source.team === target.team && beneficial) metrics.buffsApplied++;
  else if (source.team !== target.team && !beneficial) metrics.debuffsApplied++;
}

// Per-tick deduplication is transient; cumulative counters are persisted on fighters.
const tickCache = new WeakMap<
  BattleState,
  { tick: number; seen: Set<string> }
>();
export function recordEffectTick(
  s: BattleState,
  source: Fighter | undefined,
  target: Fighter,
  kind: string,
  category?: "buff" | "control",
) {
  if (!source || target.hp <= 0) return;
  let cache = tickCache.get(s);
  if (!cache || cache.tick !== s.tick)
    tickCache.set(s, (cache = { tick: s.tick, seen: new Set() }));
  const pair = `${source.id}:${target.id}`;
  const key = `${pair}:${kind}`;
  const metrics = combatMetrics(source);
  if (!cache.seen.has(key)) {
    cache.seen.add(key);
    metrics.effectTicks[kind] = (metrics.effectTicks[kind] || 0) + 1;
  }
  if (
    source !== target &&
    category === "buff" &&
    source.team === target.team &&
    !cache.seen.has(`buff:${pair}`)
  ) {
    cache.seen.add(`buff:${pair}`);
    metrics.allyBuffTicks++;
  }
  if (
    category === "control" &&
    source.team !== target.team &&
    !cache.seen.has(`cc:${pair}`)
  ) {
    cache.seen.add(`cc:${pair}`);
    metrics.controlTicks++;
  }
}
export function buffOwner(s: BattleState, source: number) {
  if (source >= 0) return s.fighters[source];
  for (const base of [8100, 8200]) {
    const id = -base - source;
    if (id >= 0 && id < s.fighters.length) return s.fighters[id];
  }
  return undefined;
}
export function recordActiveEffects(s: BattleState) {
  for (const target of s.fighters) {
    if (target.hp <= 0) continue;
    for (const status of target.statuses) {
      if (status.until <= s.tick) continue;
      const beneficial = ["blessing", "rage", "introvert"].includes(
        status.kind,
      );
      const control = ["frozen", "paralyzed", "stunned"].includes(status.kind);
      recordEffectTick(
        s,
        s.fighters[status.source],
        target,
        status.kind,
        beneficial ? "buff" : control ? "control" : undefined,
      );
    }
    for (const buff of target.buffs) {
      if (buff.until <= s.tick || buff.value <= 0) continue;
      recordEffectTick(
        s,
        buffOwner(s, buff.source),
        target,
        `buff:${buff.kind}`,
        "buff",
      );
    }
  }
}
