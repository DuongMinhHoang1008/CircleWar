import type { BattleState, Fighter } from "./types";
import { DIRECTIONS, div, normalize, random, UNIT } from "./math";
import { capsuleHit } from "./physics";
import { safeBounds, type ArenaBounds } from "./bounds";
import {
  isClashProtected,
  reverseWeaponSpin,
  rotateWeaponAngle,
} from "./weapon-clash";
export function damage(
  s: BattleState,
  source: Fighter,
  target: Fighter,
  raw: number,
  charge: number[],
  effects = true,
): boolean {
  if (
    target.hp <= 0 ||
    target.team === source.team ||
    source.hp <= 0 ||
    isClashProtected(target, s.tick)
  )
    return false;
  let amount = Math.max(1, Math.min(300, div(raw * (100 - Math.min(60, target.stats.defense)), 100)));
  const absorbed = Math.min(target.shield, amount);
  target.shield -= absorbed;
  amount -= absorbed;
  amount = Math.min(target.hp, amount);
  target.hp -= amount;
  target.taken += amount;
  source.dealt += amount;
  s.events.push({ tick: s.tick, type: "hit", source: source.id, target: target.id, amount });
  charge[source.id] = Math.min(
    12,
    charge[source.id] + div((amount + 3) * source.stats.charge, 100),
  );
  charge[target.id] = Math.min(
    12,
    charge[target.id] + div((amount + 4) * target.stats.charge, 180),
  );
  if (!target.hp) {
    target.deadAt = s.tick;
    source.kills++;
    s.events.push({
      tick: s.tick,
      type: "kill",
      source: source.id,
      target: target.id,
      amount,
    });
  }
  if (effects) {
    if (source.classId === "frost") target.slowUntil = s.tick + 30;
    if (source.stats.burn) {
      target.burnUntil = s.tick + 60;
      target.burnSource = source.id;
    }
    if (source.classId === "berserker" && source.superUntil > s.tick)
      source.hp = Math.min(
        source.stats.hp,
        source.hp + Math.min(8, div(amount, 4)),
      );
    if (target.stats.thorns && target.hp > 0) {
      const reflected = Math.min(6, target.stats.thorns, source.hp);
      if (!isClashProtected(source, s.tick)) {
        source.hp -= reflected;
        source.taken += reflected;
        if (!source.hp) source.deadAt = s.tick;
      }
    }
    const [nx, ny] = normalize(target.x - source.x, target.y - source.y);
    target.vx += div(nx * 150 * 100, UNIT * target.stats.stability);
    target.vy += div(ny * 150 * 100, UNIT * target.stats.stability);
  }
  return true;
}
function shoot(s: BattleState, f: Fighter, angle: number) {
  if (s.projectiles.length >= 240) return;
  const d = DIRECTIONS[angle % 32];
  s.projectiles.push({
    id: s.nextProjectile++,
    owner: f.id,
    x: f.x,
    y: f.y,
    vx: div(d[0] * 1700, UNIT),
    vy: div(d[1] * 1700, UNIT),
    life: 90,
    pierce: random(s) % 4 === 0 ? 1 : 0,
    hit: [],
  });
}
export function combat(s: BattleState, bounds: ArenaBounds = safeBounds(s)) {
  const charge = s.fighters.map(() => 0);
  for (const f of s.fighters) {
    if (f.hp <= 0) continue;
    if (f.burnUntil > s.tick && s.tick % 15 === 0) {
      const src = s.fighters[f.burnSource];
      if (src)
        damage(s, src, f, src.stats.burn + f.stats.defense, charge, false);
    }
    if (f.hp <= 0) continue;
    if (f.energy >= 100 && f.superUntil <= s.tick) {
      f.energy = 0;
      f.superUntil = s.tick + 120;
      f.supers++;
      s.events.push({
        tick: s.tick,
        type: "super",
        source: f.id,
        target: f.id,
        amount: 0,
      });
      if (f.classId === "guardian")
        for (const t of s.fighters)
          if ((t.x - f.x) ** 2 + (t.y - f.y) ** 2 < 15000 ** 2)
            damage(s, f, t, div(50 * f.stats.superPower, 100), charge);
      if (f.classId === "frost")
        s.zones.push({ owner: f.id, x: f.x, y: f.y, until: s.tick + 120 });
      if (f.classId === "ranger")
        for (let a = 0; a < 32; a += 4) shoot(s, f, a);
    }
    const active = f.superUntil > s.tick;
    rotateWeaponAngle(f, active ? 2 : 1);
    if (f.classId === "ranger") {
      if (
        s.tick %
          (active
            ? Math.max(4, div(f.stats.cooldown, 2))
            : f.stats.cooldown) ===
        0
      ) {
        const targets = s.fighters
          .filter((t) => t.hp > 0 && t.team !== f.team)
          .sort(
            (a, b) =>
              (a.x - f.x) ** 2 +
                (a.y - f.y) ** 2 -
                ((b.x - f.x) ** 2 + (b.y - f.y) ** 2) || a.id - b.id,
          );
        if (targets[0]) {
          const [nx, ny] = normalize(targets[0].x - f.x, targets[0].y - f.y);
          let best = 0,
            dot = -Infinity;
          DIRECTIONS.forEach((d, i) => {
            const v = nx * d[0] + ny * d[1];
            if (v > dot) {
              best = i;
              dot = v;
            }
          });
          shoot(s, f, best);
        }
      }
    } else {
      const count =
          f.classId === "assassin" || f.classId === "berserker" ? 2 : 1,
        reach =
          f.stats.reach + (active && f.classId === "swordsman" ? 1800 : 0);
      for (let w = 0; w < count; w++) {
        const d = DIRECTIONS[(f.angle + w * 16) % 32],
          ax = f.x + div(d[0] * f.radius, UNIT),
          ay = f.y + div(d[1] * f.radius, UNIT),
          bx = f.x + div(d[0] * reach, UNIT),
          by = f.y + div(d[1] * reach, UNIT);
        for (const t of s.fighters) {
          if (
            t.hp <= 0 ||
            t.team === f.team ||
            (f.cooldowns[w + ":" + t.id] || 0) > s.tick
          )
            continue;
          if (capsuleHit(ax, ay, bx, by, t.x, t.y, t.radius + 500)) {
            if (isClashProtected(t, s.tick)) continue;
            f.cooldowns[w + ":" + t.id] =
              s.tick + Math.max(8, f.stats.cooldown);
            f.hits++;
            let hit = f.stats.attack;
            if (f.classId === "swordsman" && f.hits % 4 === 0)
              hit = div(hit * 150, 100);
            if (f.classId === "berserker")
              hit += div(hit * (f.stats.hp - f.hp), f.stats.hp);
            if (active)
              hit = div(hit * (125 + div(f.stats.superPower, 4)), 100);
            if (
              random(s) % 100 <
              f.stats.crit + (active && f.classId === "assassin" ? 20 : 0)
            )
              hit = div(hit * f.stats.critPower, 100);
            if (damage(s, f, t, hit, charge)) reverseWeaponSpin(f, s.tick);
          }
        }
      }
    }
  }
  for (const p of s.projectiles) {
    const ox = p.x,
      oy = p.y;
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (
      p.x < bounds.left + 450 ||
      p.y < bounds.top + 450 ||
      p.x > bounds.right - 450 ||
      p.y > bounds.bottom - 450
    )
      p.life = 0;
    const f = s.fighters[p.owner];
    if (f.hp <= 0) {
      p.life = 0;
      continue;
    }
    for (const t of s.fighters) {
      if (p.life <= 0 || t.hp <= 0 || t.team === f.team || p.hit.includes(t.id))
        continue;
      if (capsuleHit(ox, oy, p.x, p.y, t.x, t.y, t.radius + 450)) {
        if (damage(s, f, t, f.stats.attack, charge))
          reverseWeaponSpin(f, s.tick);
        p.hit.push(t.id);
        if (p.pierce-- <= 0) p.life = 0;
      }
    }
  }
  s.projectiles = s.projectiles.filter((p) => p.life > 0);
  for (const z of s.zones)
    if (s.tick % 15 === 0) {
      const f = s.fighters[z.owner];
      for (const t of s.fighters)
        if ((t.x - z.x) ** 2 + (t.y - z.y) ** 2 < 12000 ** 2)
          damage(s, f, t, div(18 * f.stats.superPower, 100), charge);
    }
  s.zones = s.zones.filter((z) => z.until > s.tick);
  for (const f of s.fighters) f.energy = Math.min(100, f.energy + charge[f.id]);
  // Only a bounded recent visual feed is persisted; combat totals live on fighters.
  s.events = s.events.slice(-80);
}
