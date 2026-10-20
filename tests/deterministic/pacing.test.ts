import { expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../../packages/shared/src/protocol";
import {
  applyRoundTempo,
  calculateStateHash,
  createBattle,
  debugConfig,
  restoreBattleState,
  roundTempo,
  safeBounds,
  serializeBattleState,
  stepBattle,
} from "../../packages/battle-engine/src/index";

it("starts new arenas square and shrinks from 10 to 20 seconds by default", () => {
  const config = debugConfig(2);
  expect(config.width).toBe(72000);
  expect(config.height).toBe(config.width);
  expect(config.shrinkSeconds).toBe(DEFAULT_SETTINGS.shrinkSeconds);
  const s = createBattle(config, 73);
  s.tick = 300;
  expect(safeBounds(s).left).toBe(0);
  s.tick = 301;
  expect(safeBounds(s).left).toBeGreaterThan(0);
  s.tick = 600;
  const final = safeBounds(s);
  expect(final.right - final.left).toBe(28800);
  expect(final.bottom - final.top).toBe(28800);
  s.tick = 1200;
  expect(safeBounds(s)).toEqual(final);
});

it("grows combat stats from loadout baselines, accelerates bodies and resets next round", () => {
  const config = debugConfig(2);
  config.teams[0].loadouts[0].equipment = ["boots", "blade", "clock"];
  config.teams[0].loadouts[0].level = 3;
  const original = structuredClone(config);
  const s = createBattle(config, 99),
    f = s.fighters[0];
  const base = { ...f.stats };
  f.hp -= 30;
  f.vx = base.speed;
  f.vy = 0;
  f.cooldowns["0:1"] = 320;
  s.tick = 299;
  applyRoundTempo(s);
  expect(f.stats).toEqual(base);
  s.tick = 300;
  applyRoundTempo(s);
  expect(f.stats.attack).toBe(Math.floor(base.attack * 1.12));
  expect(f.stats.speed).toBe(Math.floor((base.speed * 105) / 100));
  expect(f.vx).toBe(f.stats.speed);
  expect(f.stats.cooldown).toBe(
    Math.max(8, Math.floor((base.cooldown * 100) / 108)),
  );
  expect(f.cooldowns["0:1"]).toBeLessThan(320);
  expect(f.stats.charge).toBe(Math.floor((base.charge * 105) / 100));
  expect(f.stats.superPower).toBe(Math.floor((base.superPower * 110) / 100));
  expect(f.hp).toBe(base.hp - 30);
  expect(f.stats.hp).toBe(base.hp);
  expect(f.stats.defense).toBe(base.defense);
  s.tick = 600;
  applyRoundTempo(s);
  expect(f.stats.attack).toBe(Math.floor((base.attack * 124) / 100));
  expect(f.baseStats).toEqual(base);
  expect(createBattle(config, 99).fighters[0].stats).toEqual(base);
  expect(config).toEqual(original);
});

it("caps late-round growth and preserves integer safety", () => {
  const s = createBattle(debugConfig(2), 1);
  s.tick = 300000;
  applyRoundTempo(s);
  expect(roundTempo(s.tick)).toEqual(roundTempo(6000));
  for (const f of s.fighters) {
    expect(f.stats.speed).toBeLessThanOrEqual(900);
    expect(f.stats.attack).toBeLessThanOrEqual(300);
    expect(f.stats.cooldown).toBeGreaterThanOrEqual(8);
    expect(Object.values(f.stats).every(Number.isSafeInteger)).toBe(true);
  }
});

it("restores across a tempo boundary without compounding stats or changing hashes", () => {
  const a = createBattle(debugConfig(2), 23);
  a.tick = 299;
  const b = restoreBattleState(serializeBattleState(a));
  for (let i = 0; i < 4; i++) {
    stepBattle(a);
    stepBattle(b);
  }
  expect(calculateStateHash(a)).toBe(calculateStateHash(b));
  const resumed = restoreBattleState(serializeBattleState(b));
  for (let i = 0; i < 310 && !a.finished; i++) {
    stepBattle(a);
    stepBattle(resumed);
  }
  expect(calculateStateHash(a)).toBe(calculateStateHash(resumed));
  expect(() =>
    restoreBattleState(JSON.stringify({ ...a, version: "chaos-integer-v3" })),
  ).toThrow();
});

it("trims to a centered square then keeps shrinking as a square for wide, tall and square arenas", () => {
  for (const [width, height] of [
    [120000, 72000],
    [60000, 100000],
    [60000, 60000],
  ]) {
    for (const shrinkSeconds of [1, 10, 59, 60]) {
      const s = createBattle(
        { ...debugConfig(2), width, height, shrinkSeconds },
        1,
      );
      const end = shrinkSeconds * 30,
        start = Math.min(900, Math.floor(end / 2));
      const squareAt = start + Math.floor((end - start) / 3);
      let previous = { left: 0, right: width, top: 0, bottom: height };
      for (let tick = 0; tick <= end + 30; tick++) {
        s.tick = tick;
        const b = safeBounds(s);
        expect(b.left + b.right).toBe(width);
        expect(b.top + b.bottom).toBe(height);
        expect(b.left).toBeGreaterThanOrEqual(previous.left);
        expect(b.top).toBeGreaterThanOrEqual(previous.top);
        if (tick <= start)
          expect(b).toEqual({ left: 0, right: width, top: 0, bottom: height });
        if (tick >= squareAt) expect(b.right - b.left).toBe(b.bottom - b.top);
        if (tick >= end)
          expect(b.right - b.left).toBe(Math.min(width, height) * 0.4);
        previous = b;
      }
    }
  }
});
