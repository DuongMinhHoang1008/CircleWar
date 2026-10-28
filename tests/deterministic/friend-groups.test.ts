import { it, expect } from "vitest";
import {
  character,
  FRIEND_GROUPS,
  availableGroups,
  groupTier,
  validChoice,
  type CharacterId,
} from "../../packages/shared/src/catalog";
import {
  createBattle,
  calculateStateHash,
  restoreBattleState,
  serializeBattleState,
} from "../../packages/battle-engine/src/index";
import {
  beforeCharacterTick,
  characterCombat,
  characterContacts,
  characterDamage,
} from "../../packages/battle-engine/src/character-combat";
import type { Loadout } from "../../packages/shared/src/balance";
import weaponAtlas from "../../apps/web/src/rendering/weapon-atlas.json";
it("has twenty complete, isolated weapon frames within the generated atlas", () => {
  expect(weaponAtlas.frames).toHaveLength(20);
  for (const [i, [x, y, w, h]] of weaponAtlas.frames.entries()) {
    expect(x).toBeGreaterThanOrEqual(0);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(w).toBeGreaterThan(0);
    expect(h).toBeGreaterThan(0);
    expect(x + w).toBeLessThanOrEqual(weaponAtlas.width);
    expect(y + h).toBeLessThanOrEqual(weaponAtlas.height);
    for (const [j, [a, b, c, d]] of weaponAtlas.frames.entries())
      if (i !== j)
        expect(x + w <= a || a + c <= x || y + h <= b || b + d <= y).toBe(true);
  }
});
function team(group: string, ids: string[]) {
  const s = createBattle(
    {
      width: 120000,
      height: 72000,
      shrinkSeconds: 60,
      teams: [
        {
          id: "a",
          loadouts: ids.map((id) => ({
            characterId: id as CharacterId,
            classId: character(id)!.base as Loadout["classId"],
            level: 0,
            equipment: [],
          })),
          choice: { group },
        },
        {
          id: "b",
          loadouts: [
            {
              characterId: "char_01",
              classId: "guardian",
              level: 0,
              equipment: [],
            },
          ],
        },
      ],
    },
    54,
  );
  s.fighters.forEach((f, i) => {
    f.x = f.team === "a" ? 50000 + i * 1000 : 55000;
    f.y = 36000;
  });
  return s;
}
it("preserves the expanded groups, exclusions and required anchors", () => {
  expect(FRIEND_GROUPS.map((g) => g.name)).toEqual([
    "Mấy đứa 2k4",
    "The RiseOn Couple",
    "Hoàng tử 34",
    "The ABI",
    "Tít và Mít",
    "Người miền núi chất",
    "Tiểu vương quốc 36",
    "Imposter",
    "Ạt tít",
    "Cốt đơ",
    "Full Combo",
    "Tất cả quỳ xuống",
    "Anh có ý tưởng",
    "Tái Chế Thành Huyền Thoại",
    "Nhịp Phonk Lõi Đỏ",
    "Giang Hồ Có Bữa Nóng",
    "Bếp Trưởng Và Nồi Lẩu",
  ]);
  expect(FRIEND_GROUPS.map((g) => g.members.length)).toEqual([
    12, 3, 2, 3, 4, 5, 3, 4, 2, 28, 32, 31, 33, 3, 3, 3, 3,
  ]);
  expect(FRIEND_GROUPS[6].members).not.toContain("char_20");
  expect(FRIEND_GROUPS[6].members).not.toContain("char_04");
  expect(FRIEND_GROUPS[7].members).toEqual([
    "char_05",
    "char_07",
    "char_10",
    "char_18",
  ]);
  expect(FRIEND_GROUPS[8].members).toEqual(["char_16", "char_19"]);
  for (const id of ["char_09", "char_14", "char_16", "char_19"])
    expect(FRIEND_GROUPS[9].members).not.toContain(id);
  expect(character("char_07")?.name).toBe("Courage Nhút Nhát");
  for (const [group, anchor] of [["G11", "char_14"]]) {
    expect(
      validChoice([{ characterId: "char_01" }, { characterId: "char_02" }], {
        group,
      }),
    ).toBe(false);
    expect(
      validChoice([{ characterId: anchor }, { characterId: anchor }], {
        group,
      }),
    ).toBe(false);
    expect(
      validChoice([{ characterId: anchor }, { characterId: "char_01" }], {
        group,
      }),
    ).toBe(true);
  }
  expect(
    validChoice([{ characterId: "char_09" }, { characterId: "char_22" }], {
      group: "G12",
    }),
  ).toBe(true);
  expect(
    validChoice([{ characterId: "char_09" }, { characterId: "char_01" }], {
      group: "G12",
    }),
  ).toBe(true);
  for (const id of ["char_21", "char_23", "char_24", "char_25"])
    expect(FRIEND_GROUPS.find((g) => g.id === "G12")?.members).toContain(id);
  expect(character("char_07")?.look).toContain("Courage");
  expect(character("char_07")?.race).toBe("Thú Nhân");
  expect(character("char_07")?.weapon).toContain("né");
  expect(
    availableGroups([{ characterId: "char_01" }, { characterId: "char_01" }]),
  ).toEqual([]);
  expect(
    validChoice([{ characterId: "char_01" }, { characterId: "char_02" }], {
      group: "G07",
    }),
  ).toBe(false);
});
it("2k4 counts distinct alive members, grants only two clock pulses and drops from 3 to 2", () => {
  const s = team("G01", ["char_01", "char_05", "char_12"]);
  s.tick = 300;
  beforeCharacterTick(s);
  s.fighters.at(-1)!.x = 115000;
  characterCombat(s);
  // 2k4 (+4) and Cốt đơ (+5) pulse independently at the same tick.
  expect(s.fighters.slice(0, 3).map((f) => f.energy)).toEqual([9, 9, 9]);
  expect(s.groups["a:G01"].uses).toBe(1);
  expect(s.fighters[0].stats.speed).toBe(
    Math.floor((s.fighters[0].baseStats.speed * 106) / 100),
  );
  s.tick = 600;
  beforeCharacterTick(s);
  s.fighters.at(-1)!.x = 115000;
  characterCombat(s);
  expect(s.groups["a:G01"].uses).toBe(2);
  s.fighters[2].hp = 0;
  s.tick = 601;
  beforeCharacterTick(s);
  expect(s.fighters[0].stats.speed).toBe(
    Math.floor((s.fighters[0].baseStats.speed * 104) / 100),
  );
  s.tick = 900;
  beforeCharacterTick(s);
  characterCombat(s);
  expect(s.groups["a:G01"].uses).toBe(2);
});
it("RiseOn shields only the partner and obeys shared cooldown and source death across the whole arena", () => {
  const s = team("G02", ["char_01", "char_19"]),
    f = s.fighters[0],
    partner = s.fighters[1];
  s.tick = 1;
  beforeCharacterTick(s);
  f.energy = 100;
  characterCombat(s);
  expect(
    s.events.some(
      (e) => e.type === "shield" && e.target === partner.id && e.amount === 10,
    ),
  ).toBe(true);
  expect(s.groups["a:G02"].uses).toBe(1);
  s.tick = 2;
  beforeCharacterTick(s);
  f.energy = 100;
  characterCombat(s);
  expect(s.groups["a:G02"].uses).toBe(1);
  s.tick = 250;
  partner.x = 1000;
  beforeCharacterTick(s);
  f.energy = 100;
  characterCombat(s);
  expect(s.groups["a:G02"].uses).toBe(2);
  partner.x = 51000;
  partner.hp = 0;
  s.tick = 500;
  beforeCharacterTick(s);
  f.energy = 100;
  characterCombat(s);
  expect(s.groups["a:G02"].uses).toBe(2);
});
it("Hoàng tử 34 activates its link from a Super and grants both shields", () => {
  const s = team("G03", ["char_02", "char_10"]),
    [f, partner, enemy] = s.fighters;
  s.tick = 1;
  beforeCharacterTick(s);
  f.energy = 100;
  characterCombat(s);
  expect(s.groups["a:G03"].uses).toBe(1);
  expect(
    s.events
      .filter(
        (e) => e.type === "shield" && [f.id, partner.id].includes(e.target),
      )
      .map((e) => e.amount),
  ).toEqual([8, 8]);
});
it("ABI gets 2/3 armor tiers and a single shield pulse at 20 seconds", () => {
  const s = team("G04", ["char_03", "char_10", "char_15"]);
  s.tick = 1;
  beforeCharacterTick(s);
  expect(s.fighters[0].stats.defense).toBe(s.fighters[0].baseStats.defense + 2);
  s.tick = 600;
  beforeCharacterTick(s);
  expect(s.fighters[0].shield).toBe(10);
  expect(s.groups["a:G04"].uses).toBe(1);
  s.fighters[2].hp = 0;
  s.tick = 601;
  beforeCharacterTick(s);
  expect(s.fighters[0].stats.defense).toBe(s.fighters[0].baseStats.defense + 1);
});
it("Tít và Mít recharges teammates and miền núi applies Super strength plus one shield grant", () => {
  const s = team("G05", ["char_04", "char_06", "char_17"]);
  s.tick = 1;
  beforeCharacterTick(s);
  s.fighters[0].energy = 100;
  characterCombat(s);
  expect(s.fighters[1].energy).toBe(38);
  expect(s.fighters[2].energy).toBe(38);
  expect(s.groups["a:G05"].uses).toBe(1);
  expect(s.events.filter((e) => e.type.startsWith("resonance:")).length).toBe(
    1,
  );
  const m = team("G06", ["char_06", "char_07", "char_09"]);
  m.tick = 1;
  beforeCharacterTick(m);
  expect(m.fighters[0].stats.superPower).toBe(115);
  m.fighters[0].energy = 100;
  characterCombat(m);
  expect(m.groups["a:G06"].uses).toBe(1);
  expect(m.events.some((e) => e.type === "group:G06")).toBe(true);
});
it("new Super groups apply their own effects and shared cooldown", () => {
  for (const [group, ids] of [
    ["G08", ["char_05", "char_07", "char_10"]],
    ["G09", ["char_16", "char_19"]],
    ["G11", ["char_14", "char_16", "char_01"]],
    ["G12", ["char_09", "char_22", "char_01"]],
  ] as const) {
    const s = team(group, [...ids]);
    if (group === "G12") s.fighters.at(-1)!.x = 75000;
    s.tick = 1;
    beforeCharacterTick(s);
    s.fighters[0].energy = 100;
    characterCombat(s);
    expect(s.groups[`a:${group}`].uses).toBe(1);
    const partner = s.fighters[1];
    if (group === "G08" || group === "G12") {
      expect(
        partner.buffs.some((b) => b.kind === "attack" && b.value === 12),
      ).toBe(true);
      if (group === "G12")
        expect(
          partner.buffs.some((b) => b.kind === "haste" && b.value === 115),
        ).toBe(true);
    } else {
      expect(
        s.events.some(
          (e) =>
            e.type === "shield" &&
            e.target === partner.id &&
            e.amount === (group === "G09" ? 16 : 24),
        ),
      ).toBe(true);
      expect(partner.energy).toBeGreaterThanOrEqual(group === "G09" ? 4 : 6);
    }
    s.tick = 2;
    beforeCharacterTick(s);
    s.fighters[0].energy = 100;
    characterCombat(s);
    expect(s.groups[`a:${group}`].uses).toBe(1);
    const restored = restoreBattleState(serializeBattleState(s));
    expect(calculateStateHash(restored)).toBe(calculateStateHash(s));
  }
});
it("anchors must cast themselves and remain alive, with arena-wide cooperation", () => {
  for (const [group, anchor] of [
    ["G11", "char_14"],
    ["G12", "char_09"],
  ]) {
    const ids =
      group === "G12"
        ? [anchor, "char_04", "char_01"]
        : [anchor, "char_01", "char_02"];
    const s = team(group, ids);
    if (group === "G12") s.fighters.at(-1)!.x = 75000;
    s.tick = 1;
    beforeCharacterTick(s);
    s.fighters[1].energy = 100;
    characterCombat(s);
    expect(s.groups[`a:${group}`]).toBeUndefined();
    s.tick = 2;
    s.fighters[2].x = 1000;
    beforeCharacterTick(s);
    s.fighters[0].energy = 100;
    characterCombat(s);
    expect(s.groups[`a:${group}`].uses).toBe(1);
    s.fighters[0].hp = 0;
    s.fighters[2].x = 52000;
    s.tick = 600;
    beforeCharacterTick(s);
    s.fighters[1].energy = 100;
    characterCombat(s);
    expect(s.groups[`a:${group}`].uses).toBe(1);
  }
});
it("kneel activates from either living anchor and shares its cooldown between both", () => {
  for (const anchor of ["char_09", "char_22"]) {
    expect(
      validChoice([{ characterId: anchor }, { characterId: "char_04" }], {
        group: "G12",
      }),
    ).toBe(true);
    const s = team("G12", [anchor, "char_04"]);
    s.tick = 1;
    beforeCharacterTick(s);
    s.fighters[0].energy = 100;
    characterCombat(s);
    expect(s.groups["a:G12"].uses).toBe(1);
    expect(
      s.fighters[1].buffs.some((b) => b.kind === "attack" && b.value === 8),
    ).toBe(true);
    expect(s.fighters[0].buffs.some((b) => b.source === -1012)).toBe(false);
    s.fighters[0].hp = 0;
    s.tick = 400;
    beforeCharacterTick(s);
    s.fighters[1].energy = 100;
    characterCombat(s);
    expect(s.groups["a:G12"].uses).toBe(1);
  }
  const s = team("G12", ["char_09", "char_22", "char_04"]);
  s.tick = 1;
  beforeCharacterTick(s);
  s.fighters[0].energy = 100;
  characterCombat(s);
  s.tick = 2;
  beforeCharacterTick(s);
  s.fighters[1].energy = 100;
  characterCombat(s);
  expect(s.groups["a:G12"].uses).toBe(1);
});
it("Full Combo requires one living member of each branch, with separate pair effects", () => {
  const group = FRIEND_GROUPS.find((g) => g.id === "G11")!;
  expect(groupTier(group, ["char_14", "char_16", "char_01"])).toBe(3);
  for (const ids of [
    ["char_14", "char_16", "char_19"],
    ["char_14", "char_01", "char_02"],
  ])
    expect(groupTier(group, ids)).toBe(2);
  expect(groupTier(group, ["char_14", "char_09"])).toBe(0);
  expect(groupTier(group, ["char_16", "char_01"])).toBe(0);
  for (const partner of ["char_16", "char_01"]) {
    const s = team("G11", ["char_14", partner]);
    s.tick = 1;
    beforeCharacterTick(s);
    s.fighters[0].energy = 100;
    characterCombat(s);
    const f = s.fighters[1];
    expect(
      s.events.some(
        (e) =>
          e.type === "shield" &&
          e.target === f.id &&
          e.amount === (partner === "char_16" ? 18 : 0),
      ),
    ).toBe(partner === "char_16");
    expect(f.energy).toBeGreaterThanOrEqual(partner === "char_16" ? 0 : 6);
    expect(
      f.buffs.some(
        (b) => b.kind === (partner === "char_16" ? "speed" : "haste"),
      ),
    ).toBe(true);
    expect(s.events.find((e) => e.type === "group:G11")?.amount).toBe(2);
  }
  const s = team("G11", ["char_14", "char_16", "char_01"]);
  s.tick = 1;
  beforeCharacterTick(s);
  s.fighters[0].energy = 100;
  characterCombat(s);
  expect(s.events.find((e) => e.type === "group:G11")?.amount).toBe(3);
  s.fighters[1].hp = 0;
  s.tick = 400;
  beforeCharacterTick(s);
  s.fighters[0].energy = 100;
  characterCombat(s);
  expect(s.events.filter((e) => e.type === "group:G11").at(-1)?.amount).toBe(2);
  expect(
    s.fighters[2].buffs.some(
      (b) => b.kind === "haste" && b.value === 110 && b.until === 490,
    ),
  ).toBe(true);
});
it("idea initiators require a distinct ally and can support any eligible teammate", () => {
  const boss = FRIEND_GROUPS.find((g) => g.id === "G13")!;
  for (const anchor of ["char_03", "char_15"]) {
    expect(boss.requiredAny).toContain(anchor);
    expect(
      validChoice([{ characterId: "char_09" }, { characterId: anchor }], {
        group: "G12",
      }),
    ).toBe(false);
    expect(
      validChoice([{ characterId: anchor }, { characterId: anchor }], {
        group: "G13",
      }),
    ).toBe(false);
    const s = team("G13", [anchor, "char_04"]);
    s.tick = 1;
    beforeCharacterTick(s);
    s.fighters[0].energy = 100;
    characterCombat(s);
    expect(s.groups["a:G13"].uses).toBe(1);
    expect(s.fighters[1].energy).toBeGreaterThanOrEqual(4);
    expect(
      s.fighters[1].buffs.some((b) => b.kind === "attack" && b.value === 8),
    ).toBe(true);
  }
  expect(
    validChoice([{ characterId: "char_01" }, { characterId: "char_02" }], {
      group: "G13",
    }),
  ).toBe(false);
  const s = team("G13", ["char_03", "char_15", "char_04"]);
  s.tick = 1;
  beforeCharacterTick(s);
  s.fighters[0].energy = 100;
  s.fighters[1].energy = 100;
  characterCombat(s);
  expect(s.groups["a:G13"].uses).toBe(1);
  expect(s.fighters[2].energy).toBe(6);
  expect(
    s.fighters[2].buffs.some((b) => b.kind === "attack" && b.value === 12),
  ).toBe(true);
  s.fighters[0].hp = 0;
  s.fighters[1].hp = 0;
  s.tick = 400;
  beforeCharacterTick(s);
  s.fighters[2].energy = 100;
  characterCombat(s);
  expect(s.groups["a:G13"].uses).toBe(1);
});
it("Cốt đơ emits only two pulses and downgrades after losing a member", () => {
  const s = team("G10", ["char_01", "char_02", "char_05"]);
  s.tick = 300;
  beforeCharacterTick(s);
  s.fighters.at(-1)!.x = 115000;
  characterCombat(s);
  expect(s.fighters.slice(0, 3).map((f) => f.energy)).toEqual([5, 5, 5]);
  s.fighters[2].hp = 0;
  s.tick = 600;
  beforeCharacterTick(s);
  s.fighters.at(-1)!.x = 115000;
  characterCombat(s);
  expect(s.fighters.slice(0, 2).map((f) => f.energy)).toEqual([8, 8]);
  s.tick = 900;
  beforeCharacterTick(s);
  characterCombat(s);
  expect(s.groups["a:G10"].uses).toBe(2);
});
it("36 heals only living members, cannot revive, and keeps its counters across checkpoints", () => {
  const s = team("G07", ["char_11", "char_13", "char_08"]);
  s.tick = 1;
  beforeCharacterTick(s);
  const [rose, leg, wolf, enemy] = s.fighters;
  rose.hp = 80;
  leg.hp -= 20;
  wolf.hp -= 20;
  characterDamage(s, enemy, rose, 5);
  // Give the trigger a shield so this fixture isolates the group's healing.
  rose.shields.push({ amount: 20, until: 100, source: rose.id });
  rose.shield += 20;
  expect(rose.hp).toBe(88);
  expect(leg.hp).toBe(leg.stats.hp - 12);
  expect(s.groups["a:G07"].uses).toBe(1);
  expect(rose.stats.crit).toBe(rose.baseStats.crit + 5);
  const restored = restoreBattleState(serializeBattleState(s));
  expect(calculateStateHash(restored)).toBe(calculateStateHash(s));
  expect(restored.groups["a:G07"].uses).toBe(1);
  rose.hp = 1;
  s.tick = 500;
  beforeCharacterTick(s);
  characterDamage(s, enemy, rose, 300);
  expect(rose.hp).toBe(0);
  expect(s.groups["a:G07"].uses).toBe(1);
});
