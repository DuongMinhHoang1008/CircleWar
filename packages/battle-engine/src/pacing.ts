import { div, normalize, UNIT } from "./math";
import { TICK_RATE, type BattleState, type Fighter } from "./types";

/** A shared closing phase for every kit, tied to the configured wall schedule. */
export function closingTempo(tick: number, shrinkSeconds: number) {
  const end = shrinkSeconds * TICK_RATE;
  const start = Math.min(900, div(end, 2));
  const shrinking = Math.max(0, div(tick - start, TICK_RATE));
  const overtime = Math.max(0, div(tick - end, TICK_RATE));
  return {
    active: tick > start,
    damage: 100 + Math.min(300, (shrinking + overtime) * 8),
    speed: 100 + Math.min(60, (shrinking + overtime) * 2),
    haste: 100 + Math.min(150, (shrinking + overtime) * 4),
    spin: 100 + Math.min(150, (shrinking + overtime) * 4),
    charge: 100 + Math.min(100, (shrinking + overtime) * 3),
    recovery: Math.max(0, 100 - overtime * 10),
  };
}

/** Apply once after a kit derives its stats, never to its saved baseline. */
export function applyClosingTempo(s: BattleState, f: Fighter) {
  const tempo = closingTempo(s.tick, s.config.shrinkSeconds);
  f.stats.speed = Math.min(900, div(f.stats.speed * tempo.speed, 100));
  f.stats.cooldown = Math.max(8, div(f.stats.cooldown * 100, tempo.haste));
  f.stats.charge = Math.min(400, div(f.stats.charge * tempo.charge, 100));
  f.memory.spinRate = Math.min(
    400,
    div((f.memory.spinRate || 100) * tempo.spin, 100),
  );
}

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

/** A tiny angle change breaks parallel billiard lanes, without chasing or HP loss. */
export function stirStalledCombat(s: BattleState) {
  if (s.tick <= s.config.shrinkSeconds * TICK_RATE || s.tick % 90 !== 0 || s.tick - (s.lastDamageTick || 0) < 450) return;
  for (const fighter of s.fighters) {
    if (fighter.hp <= 0 || fighter.stats.speed <= 0) continue;
    const minimum = Math.max(1, div(fighter.stats.speed, 8));
    let { vx, vy } = fighter;
    if (Math.abs(vx) < minimum) vx = (fighter.x < s.config.width / 2 ? 1 : -1) * minimum;
    if (Math.abs(vy) < minimum) vy = (fighter.y < s.config.height / 2 ? 1 : -1) * minimum;
    if (vx === fighter.vx && vy === fighter.vy) continue;
    const [dx, dy] = normalize(vx, vy);
    fighter.vx = div(dx * fighter.stats.speed, UNIT);
    fighter.vy = div(dy * fighter.stats.speed, UNIT);
  }
}

export function applyRoundTempo(s: BattleState) {
  if (s.tick % TICK_RATE !== 0) return;
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
    applyClosingTempo(s, f);
    // Raising the speed cap alone would not accelerate an already moving body.
    f.vx = div(f.vx * f.stats.speed, previousSpeed);
    f.vy = div(f.vy * f.stats.speed, previousSpeed);
    // Shorten pending melee cooldowns as well as future attacks.
    if (f.nextAttack > s.tick)
      f.nextAttack =
        s.tick +
        Math.max(
          1,
          div((f.nextAttack - s.tick) * f.stats.cooldown, previousCooldown),
        );
    for (const key of Object.keys(f.cooldowns)) {
      const remaining = f.cooldowns[key] - s.tick;
      if (remaining > 0)
        f.cooldowns[key] =
          s.tick +
          Math.max(1, div(remaining * f.stats.cooldown, previousCooldown));
    }
  }
}
