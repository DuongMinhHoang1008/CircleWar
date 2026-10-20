import { describe, expect, it } from "vitest";
import {
  calculateBattleResult,
  calculateStateHash,
  createBattle,
  debugConfig,
  restoreBattleState,
  runBattle,
  serializeBattleState,
  stepBattle,
  safeBounds,
} from "../../packages/battle-engine/src/index";
describe("integer battle engine", () => {
  it("keeps fighting beyond the wall timer and stops only after a team is eliminated", () => {
    // Preserve this explicit legacy rectangle fixture independently of new defaults.
    const s = createBattle(
      { ...debugConfig(2), width: 120000, height: 72000, shrinkSeconds: 60 },
      91,
    );
    const [a, b] = s.fighters;
    Object.assign(a, { x: 40000, y: 36000, vx: 0, vy: 400 });
    Object.assign(b, { x: 80000, y: 36000, vx: 0, vy: -400 });
    s.tick = 1799;
    stepBattle(s);
    expect(s.finished).toBe(false);
    const finalBounds = safeBounds(s);
    expect(finalBounds).toEqual({
      left: 45600,
      right: 74400,
      top: 21600,
      bottom: 50400,
    });
    for (const tick of [1801, 3600, 100000]) {
      s.tick = tick;
      expect(safeBounds(s)).toEqual(finalBounds);
      stepBattle(s);
      expect(s.finished).toBe(false);
    }
    b.hp = 0;
    stepBattle(s);
    expect(s.finished).toBe(true);
    expect(calculateBattleResult(s)[0].id).toBe(a.team);
  });
  it("repeats results and serialized checkpoints for 100 seeds, including 60 fighters", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const config = debugConfig(seed % 5 === 0 ? 60 : 2 + (seed % 19));
      config.shrinkSeconds = 10;
      const a = runBattle(config, seed),
        b = createBattle(config, seed);
      while (!b.finished) stepBattle(b);
      expect(calculateStateHash(a), `seed ${seed}`).toBe(calculateStateHash(b));
      expect(calculateBattleResult(a)).toEqual(calculateBattleResult(b));
      expect(
        a.fighters.every((f) =>
          [f.x, f.y, f.vx, f.vy, f.hp].every(Number.isSafeInteger),
        ),
      ).toBe(true);
    }
  });
  it("restores arbitrary batches without changing final hash", () => {
    const c = debugConfig(60),
      a = runBattle(c, 712);
    let b = createBattle(c, 712);
    while (!b.finished) {
      for (let i = 0; i < 37 && !b.finished; i++) stepBattle(b);
      b = restoreBattleState(serializeBattleState(b));
    }
    expect(calculateStateHash(a)).toBe(calculateStateHash(b));
  });
  it("all six classes fight and activate supers", () => {
    const s = runBattle(debugConfig(60), 43);
    for (const c of [
      "swordsman",
      "guardian",
      "assassin",
      "frost",
      "ranger",
      "berserker",
    ]) {
      const fs = s.fighters.filter((f) => f.classId === c);
      expect(fs.reduce((n, f) => n + f.dealt, 0)).toBeGreaterThan(0);
      expect(fs.reduce((n, f) => n + f.supers, 0)).toBeGreaterThan(0);
    }
  });
  it("supports every offline count", () => {
    for (let n = 2; n <= 60; n++) {
      const s = createBattle(debugConfig(n), 1);
      expect(s.fighters).toHaveLength(n);
      for (const f of s.fighters)
        for (const other of s.fighters)
          if (f.id !== other.id)
            expect(
              (f.x - other.x) ** 2 + (f.y - other.y) ** 2,
            ).toBeGreaterThanOrEqual((f.radius + other.radius) ** 2);
    }
  });
});
