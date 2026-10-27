import { describe, expect, it } from "vitest";
import {
  createBattle,
  debugConfig,
  stepBattle,
  closingTempo,
  applyArenaPressure,
  calculateStateHash,
  serializeBattleState,
  restoreBattleState,
  applyStatus,
  tickStatuses,
} from "../../packages/battle-engine/src/index";
import {
  beforeCharacterTick,
  characterDamage,
} from "../../packages/battle-engine/src/character-combat";
import {
  character,
  ROSTER,
  type CharacterId,
} from "../../packages/shared/src/catalog";
import type { Loadout } from "../../packages/shared/src/balance";

function guardianDuel(
  id: CharacterId = "char_01",
  level = 7,
  equipment: string[] = [],
  shrinkSeconds = 20,
  seed = 1,
) {
  const unit: Loadout = {
    characterId: id,
    classId: character(id)!.base as Loadout["classId"],
    level,
    equipment,
    equipmentLevels: Object.fromEntries(equipment.map((id) => [id, level])),
  };
  return createBattle(
    {
      width: 72000,
      height: 72000,
      shrinkSeconds,
      teams: [
        { id: "a", loadouts: [unit] },
        { id: "b", loadouts: [unit] },
      ],
    },
    seed,
  );
}

describe("closing combat phase", () => {
  it("follows the wall schedule, ramps safely, and leaves opening combat alone", () => {
    for (const seconds of [1, 20, 60]) {
      const end = seconds * 30,
        start = Math.min(900, end / 2);
      expect(closingTempo(start, seconds)).toMatchObject({
        active: false,
        damage: 100,
        recovery: 100,
        pressure: 0,
      });
      expect(closingTempo(end + 89, seconds).pressure).toBe(0);
      expect(closingTempo(end + 90, seconds).pressure).toBe(3);
      expect(closingTempo(end + 300, seconds).recovery).toBe(0);
      expect(closingTempo(end + 100000, seconds)).toMatchObject({
        damage: 400,
        haste: 200,
        speed: 135,
        spin: 200,
        recovery: 0,
        pressure: 15,
      });
    }
  });

  it("accelerates real character kits without compounding or changing baselines", () => {
    const s = guardianDuel(),
      f = s.fighters[0],
      base = structuredClone(f.baseStats);
    s.tick = 900;
    beforeCharacterTick(s);
    const stats = structuredClone(f.stats),
      spin = f.memory.spinRate;
    beforeCharacterTick(s);
    expect(f.stats).toEqual(stats);
    expect(f.baseStats).toEqual(base);
    expect(f.stats.speed).toBeGreaterThan(base.speed);
    expect(f.stats.cooldown).toBeLessThan(base.cooldown);
    expect(spin).toBeGreaterThan(100);
  });

  it("reduces triggered shields and periodic Hướng Nội healing together", () => {
    const shieldAt = (tick: number) => {
      const s = guardianDuel("char_01", 1, ["item_02"]),
        [source, target] = s.fighters;
      s.tick = tick;
      target.hp = Math.trunc(target.stats.hp * 0.3);
      target.shield = 0;
      target.shields = [];
      characterDamage(s, source, target, 1, false, 0);
      return target.shield;
    };
    expect(shieldAt(750)).toBeLessThan(shieldAt(1));
    expect(shieldAt(900)).toBe(0);
    const s = guardianDuel(),
      f = s.fighters[0];
    f.hp -= 100;
    s.tick = 900;
    applyStatus(s, f, f, "introvert", undefined, 60);
    const hp = f.hp;
    for (let i = 0; i < 30; i++) {
      s.tick++;
      tickStatuses(s);
    }
    expect(f.hp).toBe(hp);
  });

  it("applies pressure once per second through shields without farming damage, kills or energy", () => {
    const s = guardianDuel(),
      f = s.fighters[0];
    f.shield = 100;
    f.shields = [{ amount: 100, until: 9999, source: f.id }];
    const hp = f.hp,
      energy = f.energy;
    s.tick = 689;
    applyArenaPressure(s);
    expect(f.hp).toBe(hp);
    s.tick = 690;
    applyArenaPressure(s);
    expect(f.hp).toBe(hp - Math.max(1, Math.trunc(f.stats.hp * 0.03)));
    expect(f.shield).toBe(100);
    expect(f.energy).toBe(energy);
    expect(
      s.fighters.every((unit) => unit.dealt === 0 && unit.kills === 0),
    ).toBe(true);
    expect(
      s.events.some(
        (event) => event.type === "arena:pressure" && event.source === -1,
      ),
    ).toBe(true);
    const after = f.hp;
    s.tick++;
    applyArenaPressure(s);
    expect(f.hp).toBe(after);
    f.hp = 1;
    s.tick = 720;
    applyArenaPressure(s);
    expect(f.hp).toBe(0);
    expect(f.deadAt).toBe(720);
    expect(
      s.events.some(
        (event) =>
          event.type === "kill" && event.source === -1 && event.target === f.id,
      ),
    ).toBe(true);
  });

  it("does not damage the winning team after the last opponent falls", () => {
    const s = guardianDuel();
    s.tick = 900;
    s.fighters[1].hp = 0;
    const hp = s.fighters[0].hp;
    applyArenaPressure(s);
    expect(s.fighters[0].hp).toBe(hp);
  });

  it("ends nonattacking stalemates through actual HP loss instead of a time-based winner", () => {
    const s = createBattle(debugConfig(2), 9);
    for (const f of s.fighters) {
      f.stats.attack = f.baseStats.attack = 0;
      f.stats.rotation = f.baseStats.rotation = 0;
      f.nextAttack = 999999;
      f.shield = 10000;
    }
    while (!s.finished && s.tick <= 1500) stepBattle(s);
    expect(s.finished).toBe(true);
    expect(s.fighters.some((f) => f.hp === 0)).toBe(true);
  });

  it("finishes guardian mirrors with tank items and preserves a checkpoint across pressure activation", () => {
    for (const id of ROSTER.filter((c) => c.base === "guardian").map(
      (c) => c.id,
    )) {
      for (const level of [1, 7, 10]) {
        for (const item of [undefined, "item_02", "item_17"]) {
          const s = guardianDuel(
            id as CharacterId,
            level,
            item ? [item] : [],
            20,
            level + id.length,
          );
          while (!s.finished && s.tick < 1500) stepBattle(s);
          expect(s.finished, `${id} Lv.${level} ${item || "no item"}`).toBe(
            true,
          );
        }
      }
    }
    const a = guardianDuel("char_11"),
      b = restoreBattleState(serializeBattleState(a));
    a.tick = b.tick = 688;
    for (let i = 0; i < 150 && !a.finished; i++) {
      stepBattle(a);
      stepBattle(b);
    }
    expect(calculateStateHash(a)).toBe(calculateStateHash(b));
  });
});
