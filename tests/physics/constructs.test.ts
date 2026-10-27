import { describe, expect, it } from "vitest";
import {
  createBattle,
  captureReplayFrame,
  serializeBattleState,
  restoreBattleState,
  stepBattle,
} from "../../packages/battle-engine/src/index";
import { alignedRangedTarget } from "../../packages/battle-engine/src/weapons";
import {
  moveConstructs,
  resolveConstructCollisions,
} from "../../packages/battle-engine/src/constructs";
import {
  kitShoot,
  kitMeleeConstructs,
} from "../../packages/battle-engine/src/kit-combat";
import { characterCombat } from "../../packages/battle-engine/src/character-combat";
import type { Construct } from "../../packages/battle-engine/src/types";

function fixture() {
  const s = createBattle(
    {
      width: 120000,
      height: 72000,
      shrinkSeconds: 60,
      teams: [
        {
          id: "a",
          loadouts: [
            {
              characterId: "char_05",
              classId: "ranger",
              level: 1,
              equipment: [],
            },
          ],
        },
        {
          id: "b",
          loadouts: [
            {
              characterId: "char_14",
              classId: "guardian",
              level: 1,
              equipment: [],
            },
          ],
        },
      ],
    },
    12,
  );
  s.tick = 1;
  for (const f of s.fighters) {
    Object.assign(f, {
      x: 30000,
      y: f.id ? 60000 : 30000,
      vx: 0,
      vy: 0,
      angle: 0,
      nextAttack: 999999,
      skillReady: 999999,
    });
    f.stats.rotation = 0;
    f.baseStats.rotation = 0;
  }
  return s;
}
function summon(s: ReturnType<typeof fixture>, extra: Partial<Construct> = {}) {
  const c: Construct = {
    id: s.nextConstruct++,
    owner: 1,
    kind: "turret",
    x: 35000,
    y: 30000,
    vx: 0,
    vy: 0,
    radius: 1100,
    hp: 100,
    maxHp: 100,
    damage: 5,
    until: 999,
    nextAttack: 999,
    ...extra,
  };
  s.constructs.push(c);
  return c;
}

describe("physical summons and turrets", () => {
  it.each(["minion", "giant"] as const)(
    "moves a %s by billiard momentum regardless of the enemy position",
    (kind) => {
      const s = fixture(),
        c = summon(s, { kind, vx: 260, vy: -120 });
      const before = { ...c };
      moveConstructs(s);
      s.fighters[0].x = 90000;
      s.fighters[0].y = 10000;
      moveConstructs(s);
      expect([c.x, c.y]).toEqual([before.x + 520, before.y - 240]);
      expect([c.vx, c.vy]).toEqual([260, -120]);
    },
  );

  it("separates an overlapping fighter and turret and exchanges momentum", () => {
    const s = fixture(),
      f = s.fighters[0],
      c = summon(s, { x: f.x + 2400 });
    f.vx = 400;
    resolveConstructCollisions(s);
    expect(Math.hypot(c.x - f.x, c.y - f.y)).toBeGreaterThanOrEqual(
      c.radius + f.radius,
    );
    expect(f.vx).toBeLessThan(0);
    expect([c.x, c.y, c.vx, c.vy]).toEqual([32400, 30000, 0, 0]);
    expect([f.x, f.y, c.x, c.y, c.vx, c.vy].every(Number.isInteger)).toBe(true);
  });

  it("collides friendly summons too and ignores dead or expired bodies", () => {
    const s = fixture(),
      a = summon(s, { owner: 0, kind: "minion", x: 70000, vx: 200 }),
      b = summon(s, { owner: 0, kind: "minion", x: 71900, vx: -200 });
    const dead = summon(s, { x: 30000, hp: 0 }),
      expired = summon(s, { x: 30000, until: s.tick });
    resolveConstructCollisions(s);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(
      a.radius + b.radius,
    );
    expect(a.vx).toBeLessThan(0);
    expect(b.vx).toBeGreaterThan(0);
    expect([dead.x, expired.x, s.fighters[0].x]).toEqual([30000, 30000, 30000]);
  });

  it("reflects summons off walls and keeps turrets anchored even after an impulse", () => {
    const s = fixture(),
      c = summon(s, { kind: "minion", x: 500, y: 71500, vx: -300, vy: 200 }),
      turret = summon(s, { x: 80000 });
    resolveConstructCollisions(s);
    expect(c.x).toBe(c.radius);
    expect(c.y).toBe(s.config.height - c.radius);
    expect(c.vx).toBeGreaterThan(0);
    expect(c.vy).toBeLessThan(0);
    moveConstructs(s);
    expect([turret.x, turret.y, turret.vx, turret.vy]).toEqual([
      80000, 30000, 0, 0,
    ]);
    turret.vx = 200;
    moveConstructs(s);
    expect([turret.x, turret.vx, turret.vy]).toEqual([80000, 0, 0]);
  });

  it("anchors the turret when a summon hits it from either collider ordering", () => {
    for (const turretFirst of [true, false]) {
      const s = fixture();
      const turret = turretFirst ? summon(s, { x: 70000 }) : undefined;
      const minion = summon(s, { kind: "minion", x: 68000, vx: 350 });
      const fixed = turret || summon(s, { x: 70000 });
      resolveConstructCollisions(s);
      expect([fixed.x, fixed.y, fixed.vx, fixed.vy]).toEqual([
        70000, 30000, 0, 0,
      ]);
      expect(minion.vx).toBeLessThan(0);
    }
  });

  it("gives billiard summons their stronger HP, damage and launch speed", () => {
    const s = fixture(),
      owner = s.fighters[1];
    s.tick = 120;
    owner.energy = 100;
    characterCombat(s);
    const minion = s.constructs.find((c) => c.kind === "minion")!;
    const giant = s.constructs.find((c) => c.kind === "giant")!;
    expect(minion.hp).toBeGreaterThanOrEqual(
      Math.max(35, Math.trunc(owner.baseStats.hp * 0.12)),
    );
    expect(minion.damage).toBeGreaterThanOrEqual(
      Math.trunc(owner.baseStats.attack * 0.25),
    );
    expect(Math.hypot(minion.vx, minion.vy)).toBeGreaterThan(438);
    expect(giant.hp).toBeGreaterThanOrEqual(
      Math.trunc(owner.baseStats.hp * 0.6),
    );
    expect(giant.damage).toBeGreaterThanOrEqual(
      Math.trunc(owner.baseStats.attack * 0.7),
    );
    expect(Math.hypot(giant.vx, giant.vy)).toBeGreaterThan(358);
  });

  it("keeps summons physical after owner death without prolonging a finished round", () => {
    const s = fixture(),
      c = summon(s, { owner: 0, kind: "minion", vx: 260 });
    s.fighters[0].hp = 0;
    stepBattle(s);
    expect(c.hp).toBeGreaterThan(0);
    expect(c.x).not.toBe(35000);
    expect(s.finished).toBe(true);
  });

  it("lets ranged characters acquire and destroy an aligned construct", () => {
    const s = fixture(),
      f = s.fighters[0],
      c = summon(s, { hp: 1 });
    expect(alignedRangedTarget(s, f)).toBe(c);
    expect(kitShoot(s, f)).toBe(true);
    for (let i = 0; i < 8; i++) {
      s.tick++;
      characterCombat(s);
    }
    expect(c.hp).toBe(0);
    expect(s.fighters[1].hp).toBe(s.fighters[1].stats.hp);
  });

  it("excludes allied, expired and dead constructs from ranged acquisition", () => {
    const s = fixture(),
      f = s.fighters[0];
    summon(s, { owner: 0 });
    summon(s, { hp: 0 });
    summon(s, { until: s.tick });
    expect(alignedRangedTarget(s, f)).toBeUndefined();
    expect(kitShoot(s, f)).toBe(false);
  });

  it("hits the nearer fighter before a construct behind it", () => {
    const s = fixture(),
      f = s.fighters[0],
      enemy = s.fighters[1];
    enemy.x = 34500;
    enemy.y = 30000;
    const c = summon(s, { x: 40000 });
    expect(kitShoot(s, f)).toBe(true);
    s.projectiles[0].vx = 12000;
    const hp = enemy.hp;
    s.tick++;
    characterCombat(s);
    expect(enemy.hp).toBeLessThan(hp);
    expect(c.hp).toBe(100);
  });

  it("lets a summon shield its owner from a shot", () => {
    const s = fixture(),
      f = s.fighters[0],
      enemy = s.fighters[1];
    enemy.x = 44000;
    enemy.y = 30000;
    const c = summon(s, { x: 35000 });
    expect(kitShoot(s, f)).toBe(true);
    s.projectiles[0].vx = 14000;
    s.tick++;
    characterCombat(s);
    expect(c.hp).toBeLessThan(100);
    expect(enemy.hp).toBe(enemy.stats.hp);
  });

  it("takes melee damage and knockback on cooldown, reversing the attacker's weapon", () => {
    const s = fixture(),
      f = s.fighters[0],
      c = summon(s, { kind: "minion", x: 34000 });
    kitMeleeConstructs(s, f, 31000, 30000, 35000, 30000, 20);
    const hp = c.hp;
    expect(hp).toBeLessThan(100);
    expect(c.vx).toBeGreaterThan(0);
    expect(f.memory.spinDirection).toBe(-1);
    kitMeleeConstructs(s, f, 31000, 30000, 35000, 30000, 20);
    expect(c.hp).toBe(hp);
  });

  it("persists billiard momentum and collision results through checkpoint restore", () => {
    const s = fixture();
    summon(s, { kind: "minion", x: 90000, vx: -260, vy: 170 });
    const restored = restoreBattleState(serializeBattleState(s));
    for (let i = 0; i < 10; i++) {
      stepBattle(s);
      stepBattle(restored);
    }
    expect(serializeBattleState(restored)).toBe(serializeBattleState(s));
    expect(captureReplayFrame(restored).constructs).toEqual(s.constructs);
  });
});
