import { div } from "./math";
import type { BattleState } from "./types";

export function roundTempo(tick: number) {
  const stacks = Math.min(20, div(tick, 300));
  return {
    stacks,
    attack: 100 + stacks * 12,
    speed: 100 + stacks * 5,
    haste: 100 + stacks * 8,
    charge: 100 + stacks * 5,
    superPower: 100 + stacks * 10,
    spin: 100 + stacks * 4,
  };
}

export function applyRoundTempo(s: BattleState) {
  if (s.tick % 300 !== 0) return;
  const tempo = roundTempo(s.tick);
  for (const f of s.fighters) {
    if (f.hp <= 0 || f.characterId) continue;
    const base = f.baseStats,
      previousSpeed = f.stats.speed,
      previousCooldown = f.stats.cooldown;
    f.stats.attack = Math.min(300, div(base.attack * tempo.attack, 100));
    f.stats.speed = Math.min(900, div(base.speed * tempo.speed, 100));
    f.stats.cooldown = Math.max(8, div(base.cooldown * 100, tempo.haste));
    f.stats.charge = Math.min(300, div(base.charge * tempo.charge, 100));
    f.memory.spinRate = tempo.spin;
    f.stats.superPower = Math.min(
      300,
      div(base.superPower * tempo.superPower, 100),
    );
    // Raising the speed cap alone would not accelerate an already moving body.
    f.vx = div(f.vx * f.stats.speed, previousSpeed);
    f.vy = div(f.vy * f.stats.speed, previousSpeed);
    // Shorten pending melee cooldowns as well as future attacks.
    if (f.nextAttack > s.tick) f.nextAttack = s.tick + Math.max(1, div((f.nextAttack - s.tick) * f.stats.cooldown, previousCooldown));
    for (const key of Object.keys(f.cooldowns)) {
      const remaining = f.cooldowns[key] - s.tick;
      if (remaining > 0)
        f.cooldowns[key] =
          s.tick +
          Math.max(1, div(remaining * f.stats.cooldown, previousCooldown));
    }
  }
}
