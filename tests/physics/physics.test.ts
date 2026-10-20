import { expect, it } from "vitest";
import {
  createBattle,
  debugConfig,
  isqrt,
  safeBounds,
  stepBattle,
} from "../../packages/battle-engine/src/index";
import {
  capsuleHit,
  collide,
  constrain,
  pairs,
} from "../../packages/battle-engine/src/physics";
const fighters = () => createBattle(debugConfig(3), 1).fighters;
it("shrinking walls contain the full circle and reflect each edge without damage", () => {
  for (const [x, y, vx, vy, expectedVx, expectedVy] of [
    [0, 36000, -400, 0, 1, 0],
    [120000, 36000, 400, 0, -1, 0],
    [60000, 0, 0, -400, 0, 1],
    [60000, 72000, 0, 400, 0, -1],
    [0, 0, -300, -300, 1, 1],
  ]) {
    const [f] = fighters(),
      hp = f.hp;
    Object.assign(f, { x, y, vx, vy });
    constrain(f, 120000, 72000, 10000);
    expect(f.x).toBeGreaterThanOrEqual(10000 + f.radius);
    expect(f.x).toBeLessThanOrEqual(110000 - f.radius);
    expect(f.y).toBeGreaterThanOrEqual(10000 + f.radius);
    expect(f.y).toBeLessThanOrEqual(62000 - f.radius);
    expect(Math.sign(f.vx)).toBe(expectedVx);
    expect(Math.sign(f.vy)).toBe(expectedVy);
    expect(f.hp).toBe(hp);
  }
});
it("a shrinking-wall tick causes no HP loss and blocks projectiles", () => {
  const s = createBattle(debugConfig(2), 8);
  s.tick = 1199; // Old storm damage used to trigger on tick 1200.
  const [a, b] = s.fighters;
  Object.assign(a, { x: 1000, y: 36000, vx: -400, vy: 0 });
  Object.assign(b, { x: 100000, y: 36000, vx: 400, vy: 0 });
  const hp = s.fighters.map((f) => f.hp);
  s.projectiles.push({
    id: 777,
    owner: 0,
    x: 11000,
    y: 20000,
    vx: -1700,
    vy: 0,
    life: 30,
    pierce: 0,
    hit: [],
  });
  stepBattle(s);
  expect(s.fighters.map((f) => f.hp)).toEqual(hp);
  expect(s.fighters.map((f) => f.taken)).toEqual([0, 0]);
  expect(a.x).toBe(safeBounds(s).left + a.radius);
  expect(a.vx).toBeGreaterThan(0);
  expect(s.projectiles.some((p) => p.id === 777)).toBe(false);
});
it("all surviving fighters stay within the moving walls in a 60-fighter battle", () => {
  const s = createBattle(debugConfig(60), 19);
  while (!s.finished) {
    stepBattle(s);
    const bounds = safeBounds(s);
    for (const f of s.fighters)
      if (f.hp > 0) {
        expect(f.x).toBeGreaterThanOrEqual(bounds.left + f.radius);
        expect(f.x).toBeLessThanOrEqual(bounds.right - f.radius);
        expect(f.y).toBeGreaterThanOrEqual(bounds.top + f.radius);
        expect(f.y).toBeLessThanOrEqual(bounds.bottom - f.radius);
      }
  }
});
it("reflects walls, fixes corners and caps extreme velocity", () => {
  const [a] = fighters();
  a.x = -100;
  a.y = 999999;
  a.vx = -10000000;
  a.vy = 10000000;
  constrain(a, 120000, 72000);
  expect(a.x).toBe(a.radius);
  expect(a.y).toBe(72000 - a.radius);
  expect(a.vx).toBeGreaterThanOrEqual(0);
  expect(a.vy).toBeLessThanOrEqual(0);
  expect(isqrt(a.vx ** 2 + a.vy ** 2)).toBeLessThanOrEqual(a.stats.speed);
});
it("exchanges equal-mass velocities", () => {
  const [a, b] = fighters();
  a.x = 30000;
  a.y = b.y = 30000;
  b.x = 33000;
  a.vx = 400;
  b.vx = -400;
  a.vy = b.vy = 0;
  a.stats.mass = b.stats.mass = 100;
  a.stats.bounce = b.stats.bounce = 100;
  collide(a, b);
  expect(a.vx).toBe(-400);
  expect(b.vx).toBe(400);
  expect(b.x - a.x).toBeGreaterThanOrEqual(a.radius + b.radius);
});
it("heavy bodies receive smaller impulse", () => {
  const [a, b] = fighters();
  a.x = 30000;
  a.y = b.y = 30000;
  b.x = 33000;
  a.vx = 400;
  b.vx = -400;
  a.vy = b.vy = 0;
  a.stats.mass = 100;
  b.stats.mass = 300;
  collide(a, b);
  expect(Math.abs(a.vx - 400)).toBeGreaterThan(Math.abs(b.vx + 400));
});
it("handles coincident centers and three diagonal bodies", () => {
  const fs = fighters();
  for (const f of fs) {
    f.x = 30000;
    f.y = 30000;
    f.vx = 100;
    f.vy = -100;
  }
  for (let i = 0; i < 10; i++)
    for (const [a, b] of pairs(fs)) collide(fs[a], fs[b]);
  for (const f of fs)
    expect([f.x, f.y, f.vx, f.vy].every(Number.isSafeInteger)).toBe(true);
  expect(fs[0].x !== fs[1].x || fs[0].y !== fs[1].y).toBe(true);
});
it("requires segment contact rather than center range", () => {
  expect(capsuleHit(0, 0, 5000, 0, 4500, 200, 500)).toBe(true);
  expect(capsuleHit(0, 0, 5000, 0, -3000, 0, 500)).toBe(false);
  expect(capsuleHit(0, 0, 5000, 0, 2000, 2000, 500)).toBe(false);
});
it("integer square root is exact within engine bounds", () => {
  for (const n of [0, 1, 2, 4, 99, 100, 9999999999, 50000000000]) {
    const x = isqrt(n);
    expect(x * x).toBeLessThanOrEqual(n);
    expect((x + 1) ** 2).toBeGreaterThan(n);
  }
});
