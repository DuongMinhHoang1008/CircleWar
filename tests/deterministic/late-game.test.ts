import { describe, expect, it } from "vitest";
import {
  createBattle,
  debugConfig,
  stepBattle,
  closingTempo,
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
  it("breaks flat parallel movement without applying environmental damage", () => {
    const config = debugConfig(2);
    config.teams = ["char_17", "char_12", "char_05", "char_08", "char_07", "char_32"].map((id, index) => ({ id: `team-${index}`, loadouts: [{ characterId: id as CharacterId, classId: character(id)!.base as Loadout["classId"], level: 10, equipment: [`item_${["04", "03", "19", "14", "17", "32"][index]}`], equipmentLevels: { [`item_${["04", "03", "19", "14", "17", "32"][index]}`]: 10 } }] }));
    config.width = config.height = 72000; config.shrinkSeconds = 20;
    const state = createBattle(config, 65374);
    while (!state.finished && state.tick < 1800) stepBattle(state);
    expect(state.finished).toBe(true);
    expect(state.events.some(e => e.type === "arena:pressure")).toBe(false);
  });
  it("follows the wall schedule, ramps safely, and leaves opening combat alone", () => {
    for (const seconds of [1, 20, 60]) {
      const end = seconds * 30,
        start = Math.min(900, end / 2);
      expect(closingTempo(start, seconds)).toMatchObject({
        active: false,
        damage: 100,
        recovery: 100,
      });
      expect(closingTempo(end + 300, seconds).recovery).toBe(0);
      expect(closingTempo(end + 100000, seconds)).toMatchObject({
        damage: 400,
        haste: 250,
        speed: 160,
        spin: 250,
        charge: 200,
        recovery: 0,
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

  it("never subtracts HP or declares a winner from the wall alone", () => {
    const s = createBattle(debugConfig(2), 9);
    const hp = s.fighters.map((f) => f.hp);
    for (const f of s.fighters) {
      f.stats.attack = f.baseStats.attack = 0;
      f.stats.rotation = f.baseStats.rotation = 0;
      f.nextAttack = 999999;
      f.shield = 10000;
    }
    while (!s.finished && s.tick <= 1500) stepBattle(s);
    expect(s.finished).toBe(false);
    expect(s.fighters.map((f) => f.hp)).toEqual(hp);
    expect(s.events.some((e) => e.type === "arena:pressure")).toBe(false);
  });

  it("finishes guardian mirrors with tank items and preserves a checkpoint through closing tempo", () => {
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
          while (!s.finished && s.tick < 1800) stepBattle(s);
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
