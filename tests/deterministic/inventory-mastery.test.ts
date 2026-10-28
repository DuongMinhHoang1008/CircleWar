import { describe, it, expect } from "vitest";
import { dropInventoryCard } from "../../apps/web/src/inventoryDrag";
import {
  applyOwnedConfig,
  statsBreakdown,
} from "../../apps/web/src/LoadoutConfig";
import {
  experienceOf,
  profileLoadouts,
  type CollectionProfile,
} from "../../packages/shared/src/experience";
import {
  MASTERIES,
  validateMasteryTeam,
} from "../../packages/shared/src/mastery";
import {
  loanUnit,
  legalLoanTeam,
  adventureConfig,
} from "../../packages/shared/src/adventure";
import {
  createBattle,
  stepBattle,
  serializeBattleState,
  restoreBattleState,
  calculateStateHash,
  applyStatus,
  statusPower,
} from "../../packages/battle-engine/src/index";
const base: CollectionProfile = {
  cards: ["char_01", "char_11", "char_14"].map((characterId) => ({
    characterId: characterId as any,
    level: 10,
    xp: 0,
  })),
  itemCards: [{ itemId: "item_01", level: 10, xp: 0 }],
  team: ["char_01", "char_11"],
  equipment: { char_01: ["item_01"] },
};
describe("inventory builds and drag", () => {
  it("swaps, replaces and appends without losing cards", () => {
    expect(
      dropInventoryCard(base, { kind: "character", id: "char_01" }, 1).team,
    ).toEqual(["char_11", "char_01"]);
    const next = dropInventoryCard(
      base,
      { kind: "character", id: "char_14" },
      0,
    );
    expect(next.team).toEqual(["char_14", "char_11"]);
    expect(next.cards).toBe(base.cards);
    expect(next.equipment).toEqual({});
    expect(
      dropInventoryCard(base, { kind: "character", id: "char_14" }, 2).team,
    ).toHaveLength(3);
    expect(base.team).toEqual(["char_01", "char_11"]);
  });
  it("transfers a single item atomically and rejects empty/invalid targets", () => {
    const next = dropInventoryCard(base, { kind: "item", id: "item_01" }, 1);
    expect(next.equipment).toEqual({ char_11: ["item_01"] });
    expect(next.itemCards).toBe(base.itemCards);
    expect(() =>
      dropInventoryCard(base, { kind: "item", id: "item_01" }, 2),
    ).toThrow();
    expect(() =>
      dropInventoryCard(base, { kind: "character", id: "char_33" }, 0),
    ).toThrow();
  });
  it("requires unlocked skills and retains them when transferring gear", () => {
    expect(() =>
      applyOwnedConfig(base, {
        ...loanUnit("char_01"),
        masteryId: "tigerBurst",
      }),
    ).toThrow();
    const p = {
      ...base,
      experience: {
        ...experienceOf(base),
        mastery: { char_01: 3 },
        masteries: { char_01: { id: "tigerBurst" } },
      },
    };
    const next = dropInventoryCard(p, { kind: "item", id: "item_01" }, 0);
    expect(profileLoadouts(next)[0].masteryId).toBe("tigerBurst");
  });
  it("reports actual equipped versus unequipped level stats", () => {
    const u = loanUnit("char_01", "item_01");
    const stats = statsBreakdown(u);
    expect(stats.total.attack).toBe(stats.base.attack + stats.attackFromItems);
    expect(stats.total.hp).toBe(stats.base.hp + stats.hpFromItems);
  });
});
describe("exclusive mastery runtime", () => {
  it("rejects wrong owner, duplicate legacy and invalid ally", () => {
    expect(() =>
      validateMasteryTeam([
        { characterId: "char_11", masteryId: "tigerBurst" },
      ]),
    ).toThrow();
    expect(() =>
      validateMasteryTeam([
        { characterId: "char_01", masteryId: "tigerGuard" },
        { characterId: "char_11", masteryId: "flagFocus" },
      ]),
    ).toThrow();
    expect(() =>
      legalLoanTeam([
        {
          ...loanUnit("char_22"),
          masteryId: "auraAnchor",
          masteryTarget: "char_14",
        },
      ]),
    ).toThrow();
  });
  it("preserves normalized loaned skills without trusting supplied levels", () => {
    const team = legalLoanTeam([
      { ...loanUnit("char_01"), level: 999, masteryId: "tigerBurst" },
    ]);
    expect(team[0].level).toBe(10);
    expect(team[0].masteryId).toBe("tigerBurst");
  });
  it("Bình Tâm shortens introversion and cleanses only one condition", () => {
    const s = createBattle(
        adventureConfig(
          [{ ...loanUnit("char_01"), masteryId: "tigerCalm" }],
          [loanUnit("char_11")],
        ),
        9,
      ),
      f = s.fighters[0],
      enemy = s.fighters[1];
    applyStatus(s, enemy, f, "frozen", 1, 90);
    applyStatus(s, enemy, f, "paralyzed", 1, 90);
    applyStatus(s, f, f, "introvert", 1, 90);
    expect(statusPower(f, "frozen", 0)).toBe(0);
    expect(statusPower(f, "paralyzed", 0)).toBeGreaterThan(0);
    expect(f.statuses.find((v) => v.kind === "introvert")!.until).toBe(42);
  });
  for (const skill of MASTERIES)
    it(skill.name + " executes deterministically across checkpoint", () => {
      const units = [
        { ...loanUnit(skill.characterId as any), masteryId: skill.id },
        loanUnit(skill.characterId === "char_11" ? "char_14" : "char_11"),
      ];
      const config = adventureConfig(units, [
        loanUnit("char_01"),
        loanUnit("char_20"),
        loanUnit("char_14"),
      ]);
      const state = createBattle(config, 42);
      for (let i = 0; i < 450 && !state.finished; i++) stepBattle(state);
      const clone = restoreBattleState(serializeBattleState(state));
      for (let i = 0; i < 300 && !state.finished; i++) {
        stepBattle(state);
        stepBattle(clone);
      }
      expect(calculateStateHash(state)).toBe(calculateStateHash(clone));
      expect(
        state.fighters.every((f) => Number.isInteger(f.hp) && f.hp >= 0),
      ).toBe(true);
    });
});
import {
  kitSuper,
  kitAura,
  type KitCombatServices,
} from "../../packages/battle-engine/src/kit-combat";
import { characterCombat } from "../../packages/battle-engine/src/character-combat";
import { hitConstruct } from "../../packages/battle-engine/src/constructs";
function skillFixture(id: string, masteryId?: string) {
  const s = createBattle(
    adventureConfig(
      [
        { ...loanUnit(id as any), masteryId },
        loanUnit("char_04"),
        loanUnit("char_15"),
      ],
      [loanUnit("char_05")],
    ),
    90,
  );
  s.tick = 1;
  for (const f of s.fighters) {
    f.x = 30000 + f.id * 2000;
    f.y = 30000;
    f.hp = f.stats.hp = f.baseStats.hp = 1000;
  }
  return s;
}
function services() {
  const shields: { target: number; amount: number }[] = [];
  const ctx: KitCombatServices = {
    damage: () => 0,
    normal: () => true,
    heal: () => 0,
    shield: (_s, _f, t, amount) => {
      shields.push({ target: t.id, amount });
    },
    buff: () => {},
  };
  return { ctx, shields };
}
describe("mastery gameplay effects", () => {
  it("Gói Gia Cố replaces two small summons with one stronger body", () => {
    const normal = skillFixture("char_14"),
      tank = skillFixture("char_14", "giftTank");
    for (const s of [normal, tank])
      for (const tick of [90, 210]) {
        s.tick = tick;
        characterCombat(s);
      }
    expect(
      normal.constructs.filter((c) => c.hp > 0 && c.kind === "minion"),
    ).toHaveLength(2);
    const minions = tank.constructs.filter(
      (c) => c.hp > 0 && c.kind === "minion",
    );
    expect(minions).toHaveLength(1);
    expect(minions[0].maxHp).toBe(Math.trunc(normal.constructs[0].maxHp * 2.2));
    expect(minions[0].damage).toBe(
      Math.trunc(normal.constructs[0].damage * 1.5),
    );
  });
  it("Quà Tiếp Tế shields the nearest living ally only when an enemy destroys a minion", () => {
    const s = skillFixture("char_14", "giftShield");
    s.tick = 90;
    characterCombat(s);
    const c = s.constructs[0],
      ally = s.fighters[1];
    ally.x = c.x;
    ally.y = c.y;
    const before = ally.shield;
    hitConstruct(s, s.fighters[3], c, c.hp);
    expect(ally.shield - before).toBe(40);
    hitConstruct(s, s.fighters[3], c, 999);
    expect(ally.shield - before).toBe(40);
  });
  it("Hộ Tống summons beside the selected ally with shorter life and lower damage", () => {
    const normal = skillFixture("char_14"),
      escort = skillFixture("char_14", "giftEscort"),
      { ctx } = services();
    escort.fighters[0].masteryTarget = "char_15";
    escort.fighters[2].x = 60000;
    kitSuper(normal, normal.fighters[0], ctx);
    kitSuper(escort, escort.fighters[0], ctx);
    const c = escort.constructs[0];
    expect(c.until - escort.tick).toBe(240);
    expect(c.damage).toBe(Math.trunc(normal.constructs[0].damage * 0.7));
    expect(Math.abs(c.x - escort.fighters[2].x)).toBeLessThanOrEqual(5000);
  });
  it("Hậu Cần creates four fruits instead of eight", () => {
    const normal = skillFixture("char_13"),
      supply = skillFixture("char_13", "fruitSupply"),
      { ctx } = services();
    kitSuper(normal, normal.fighters[0], ctx);
    kitSuper(supply, supply.fighters[0], ctx);
    expect(normal.zones.filter((z) => z.kit === "fruit")).toHaveLength(8);
    expect(supply.zones.filter((z) => z.kit === "fruit")).toHaveLength(4);
  });
  it("Dồn Sức selects the weakest ally and Chỗ Dựa excludes the caster", () => {
    for (const [id, skill, percent] of [
      ["char_11", "flagFocus", 10],
      ["char_01", "tigerGuard", 6],
    ] as const) {
      const s = skillFixture(id, skill),
        { ctx, shields } = services();
      s.fighters[2].hp = 100;
      kitSuper(s, s.fighters[0], ctx);
      expect(shields).toEqual([
        { target: s.fighters[2].id, amount: percent * 10 },
      ]);
    }
  });
  it("Dẫn Nhịp gives actual Super energy while removing the standard rage and blessing", () => {
    const s = skillFixture("char_22", "auraEnergy"),
      { ctx } = services();
    kitSuper(s, s.fighters[0], ctx);
    for (const ally of s.fighters.slice(1, 3)) {
      expect(ally.memory.gain).toBe(12);
      expect(statusPower(ally, "rage", s.tick)).toBe(0);
      expect(statusPower(ally, "blessing", s.tick)).toBe(0);
    }
  });
  it("Tâm Hào Quang uses the selected ally's location and Dư Âm expires after leaving", () => {
    const anchor = skillFixture("char_22", "auraAnchor");
    anchor.fighters[0].masteryTarget = "char_04";
    anchor.fighters[1].x = anchor.fighters[2].x = 80000;
    expect(kitAura(anchor, anchor.fighters[2])).toBeGreaterThan(0);
    const echo = skillFixture("char_22", "auraEcho"),
      ally = echo.fighters[1];
    expect(kitAura(echo, ally)).toBeGreaterThan(0);
    ally.x = 100000;
    echo.tick = 2;
    expect(kitAura(echo, ally)).toBeGreaterThan(0);
    echo.tick = 48;
    expect(kitAura(echo, ally)).toBe(0);
  });
});

import { newRoom, applyAction } from "../../packages/shared/src/room";
import { actionSchema } from "../../packages/shared/src/protocol";
it("validates equipped mastery unlocks and preserves them through room sync", () => {
  const room = applyAction(
    newRoom("ABCDEFGH", 8, 0),
    "a",
    { type: "JOIN", name: "A" },
    1,
  );
  const sync = actionSchema.parse({
    type: "SYNC_PROFILE",
    cards: base.cards,
    itemCards: base.itemCards,
    team: base.team,
    equipment: [],
    campaignStage: 0,
    masteries: { char_01: { id: "tigerBurst" } },
    masteryProgress: { char_01: 3 },
  });
  const next = applyAction(room, "a", sync, 2);
  expect(next.players[0].loadouts[0].masteryId).toBe("tigerBurst");
  expect(() =>
    applyAction(
      room,
      "a",
      { ...sync, masteryProgress: { char_01: 2 } } as any,
      2,
    ),
  ).toThrow();
  expect(() =>
    applyAction(
      room,
      "a",
      { ...sync, masteries: { char_01: { id: "giftTank" } } } as any,
      2,
    ),
  ).toThrow();
});
