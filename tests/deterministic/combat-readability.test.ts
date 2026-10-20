import { describe, expect, it } from "vitest";
import {
  character,
  ROSTER,
  type CharacterId,
} from "../../packages/shared/src/catalog";
import type { ClassId } from "../../packages/shared/src/balance";
import { CHARACTER_BALANCE } from "../../packages/shared/src/combat-balance";
import {
  captureReplayFrame,
  createBattle,
  restoreBattleState,
  serializeBattleState,
  type BattleState,
} from "../../packages/battle-engine/src/index";
import { characterCombat } from "../../packages/battle-engine/src/character-combat";

function duel(id: CharacterId, distance = 20000) {
  const load = (characterId: CharacterId) => ({
    characterId,
    classId: character(characterId)!.base as ClassId,
    level: 0,
    equipment: [],
  });
  const s = createBattle(
    {
      width: 120000,
      height: 72000,
      shrinkSeconds: 60,
      teams: [
        { id: "a", loadouts: [load(id)] },
        { id: "b", loadouts: [load("char_01")] },
      ],
    },
    24,
  );
  Object.assign(s.fighters[0], {
    x: 40000,
    y: 36000,
    vx: 0,
    vy: 0,
    nextAttack: 99999,
  });
  Object.assign(s.fighters[1], {
    x: 40000 + distance,
    y: 36000,
    vx: 0,
    vy: 0,
    skillReady: 99999,
    nextAttack: 99999,
  });
  return s;
}

function tick(s: BattleState, count = 1) {
  for (let i = 0; i < count; i++) {
    s.tick++;
    characterCombat(s);
  }
}

describe("readable combat", () => {
  it("cannot damage distant enemies or spend a melee Super outside physical reach", () => {
    for (const c of ROSTER.filter(
      (c) =>
        c.base !== "ranger" &&
        c.base !== "frost" &&
        CHARACTER_BALANCE[c.id].role !== "support",
    )) {
      const s = duel(c.id as CharacterId),
        [f, enemy] = s.fighters;
      f.energy = 100;
      f.skillReady = 0;
      const hp = enemy.hp;
      tick(s);
      expect(enemy.hp, c.id).toBe(hp);
      expect(f.energy, c.id).toBe(100);
      expect(f.skillReady, c.id).toBe(0);
      expect(s.projectiles).toHaveLength(0);
    }
  });

  it.each(["skill", "super", "normal"] as const)(
    "ranged %s waits for a projectile to hit",
    (kind) => {
      const s = duel("char_05"),
        [f, enemy] = s.fighters;
      const hp = enemy.hp;
      if (kind === "skill") f.skillReady = 0;
      if (kind === "super") f.energy = 100;
      if (kind === "normal") f.nextAttack = 0;
      tick(s);
      expect(enemy.hp).toBe(hp);
      expect(s.projectiles).toHaveLength(1);
      expect(s.projectiles[0].normal).toBe(kind === "normal");
      expect(s.projectiles[0].kind).toBe(kind === "normal" ? undefined : kind);
      tick(s, 30);
      expect(enemy.hp).toBeLessThan(hp);
    },
  );

  it("lets a moving target dodge and expires missed projectiles", () => {
    const s = duel("char_03"),
      [f, enemy] = s.fighters;
    f.skillReady = 0;
    const hp = enemy.hp;
    tick(s);
    enemy.y += 12000;
    tick(s, 40);
    expect(enemy.hp).toBe(hp);
    expect(s.projectiles).toHaveLength(0);
  });

  it("hits the first enemy along the path instead of damaging the selected target remotely", () => {
    const s = duel("char_05"),
      [f, enemy] = s.fighters;
    f.energy = 100;
    tick(s);
    const blocker = structuredClone(enemy);
    Object.assign(blocker, { id: 2, x: 50000 });
    s.fighters.push(blocker);
    const hp = enemy.hp;
    tick(s, 15);
    expect(blocker.hp).toBeLessThan(hp);
    expect(enemy.hp).toBe(hp);
    expect(s.projectiles).toHaveLength(0);
  });

  it("keeps projectile identity, facing and ability VFX through replay and checkpoints", () => {
    const s = duel("char_05");
    s.fighters[0].energy = 100;
    tick(s);
    const restored = restoreBattleState(serializeBattleState(s));
    const p = s.projectiles[0];
    expect(captureReplayFrame(restored).projectiles[0]).toEqual([
      p.id,
      p.owner,
      p.x,
      p.y,
      p.vx,
      p.vy,
      false,
      "super",
    ]);
    tick(s, 30);
    tick(restored, 30);
    expect(serializeBattleState(restored)).toBe(serializeBattleState(s));
  });

  it("does not consume energy or cooldown when the projectile pool is full", () => {
    const s = duel("char_05"),
      f = s.fighters[0];
    f.energy = 100;
    f.skillReady = 0;
    s.projectiles = Array.from({ length: 240 }, (_, id) => ({
      id,
      owner: 0,
      x: 20000,
      y: 10000,
      vx: 700,
      vy: 0,
      life: 20,
      pierce: 0,
      hit: [],
    }));
    tick(s);
    expect(f.energy).toBe(100);
    expect(f.supers).toBe(0);
    expect(f.skillReady).toBe(0);
  });
});
