import { it, expect } from "vitest";
import { character, type CharacterId } from "../../packages/shared/src/catalog";
import type { ClassId } from "../../packages/shared/src/balance";
import {
  createBattle,
  stepBattle,
  calculateStateHash,
  serializeBattleState,
  restoreBattleState,
} from "../../packages/battle-engine/src/index";
import {
  beforeCharacterTick,
  characterCombat,
} from "../../packages/battle-engine/src/character-combat";

function team(ids: string[]) {
  const load = (id: string) => ({
    characterId: id as CharacterId,
    classId: character(id)!.base as ClassId,
    level: 0,
    equipment: [],
  });
  const s = createBattle(
    {
      width: 120000,
      height: 72000,
      shrinkSeconds: 60,
      teams: [
        { id: "a", loadouts: ids.map(load) },
        { id: "b", loadouts: [load("char_09")] },
      ],
    },
    54,
  );
  s.fighters.forEach((f, i) => {
    f.x = f.team === "a" ? 50000 + i * 1000 : 55000;
    f.y = 36000;
    f.skillReady = 99999;
  });
  return s;
}
it("automatically combines RiseOn Couple and 2k4 without a selected group", () => {
  const s = team(["char_01", "char_19"]);
  s.tick = 1;
  beforeCharacterTick(s);
  s.fighters[0].energy = 100;
  characterCombat(s);
  expect(s.fighters[0].stats.speed).toBe(
    Math.floor((s.fighters[0].baseStats.speed * 104) / 100),
  );
  expect(
    s.events.some(
      (e) =>
        e.type === "shield" && e.target === s.fighters[1].id && e.amount === 10,
    ),
  ).toBe(true);
  expect(s.groups["a:G02"].uses).toBe(1);
  expect(s.config.teams[0].choice).toBeUndefined();
});
it("adds multiple passive group and race speed bonuses, removing only lost synergies", () => {
  const s = team(["char_04", "char_06", "char_17"]),
    f = s.fighters[2];
  s.tick = 1;
  beforeCharacterTick(s);
  // 2k4 (4) + Tít và Mít (6) + Người Phố Hội (6).
  expect(f.stats.speed).toBe(Math.floor((f.baseStats.speed * 116) / 100));
  s.fighters[1].hp = 0;
  s.tick = 2;
  beforeCharacterTick(s);
  expect(f.stats.speed).toBe(Math.floor((f.baseStats.speed * 108) / 100));
});
it("keeps simultaneous attack buffs from separate groups and independent cooldowns", () => {
  const s = team(["char_05", "char_03", "char_18"]),
    f = s.fighters[2];
  s.tick = 1;
  beforeCharacterTick(s);
  s.fighters[0].energy = 100;
  s.fighters[1].energy = 100;
  characterCombat(s);
  expect(s.groups["a:G08"].uses).toBe(1);
  expect(s.groups["a:G13"].uses).toBe(1);
  expect(
    f.buffs
      .filter((b) => b.kind === "attack")
      .map((b) => b.value)
      .sort((a, b) => a - b),
  ).toEqual([8, 12]);
  s.tick = 2;
  beforeCharacterTick(s);
  expect(f.stats.attack).toBe(Math.floor((f.baseStats.attack * 120) / 100));
  // One group's cooldown cannot block the other on the next available window.
  s.tick = 400;
  s.groups["a:G08"].ready = 500;
  beforeCharacterTick(s);
  s.fighters[0].energy = 100;
  s.fighters[1].energy = 100;
  characterCombat(s);
  expect(s.groups["a:G13"].uses).toBe(2);
  expect(s.groups["a:G08"].uses).toBe(1);
});
it("activates a pair and its trio together with separate counters and additive shields", () => {
  const s = team(["char_01", "char_08", "char_15"]);
  s.tick = 1;
  beforeCharacterTick(s);
  s.fighters[0].energy = 100;
  s.fighters[2].energy = 100;
  characterCombat(s);
  expect(s.events.some((e) => e.type === "bond:P01")).toBe(true);
  expect(s.events.some((e) => e.type === "bond:T01")).toBe(true);
  expect(s.bonds["a:P01"].uses).toBe(1);
  expect(s.bonds["a:T01"].uses).toBe(1);
  expect(s.fighters[1].shield).toBe(
    33 + Math.floor((s.fighters[1].baseStats.hp * 12) / 100),
  );
  expect(s.events.filter((e) => e.type.startsWith("resonance:")).length).toBe(
    1,
  );
  const restored = restoreBattleState(serializeBattleState(s));
  for (let i = 0; i < 10; i++) {
    stepBattle(s);
    stepBattle(restored);
  }
  expect(calculateStateHash(restored)).toBe(calculateStateHash(s));
  const fresh = team(["char_01", "char_08", "char_15"]);
  expect(fresh.bonds).toEqual({});
  expect(fresh.groups).toEqual({});
});
