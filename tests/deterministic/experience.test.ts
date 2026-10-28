import { describe, expect, it } from "vitest";
import {
  applyPreset,
  experienceOf,
  presetMissing,
  toggleLock,
  validExperience,
  type CollectionProfile,
  type TeamPreset,
} from "../../packages/shared/src/experience";
import {
  awardPacks,
  claimReserve,
  claimMail,
  welcomeMail,
  mergeMailbox,
} from "../../packages/shared/src/mailbox";
import {
  adventureConfig,
  legalLoanTeam,
  loanUnit,
  normalizeContracts,
  weeklyEnemies,
  weekId,
  weekEnds,
  CONTRACTS,
} from "../../packages/shared/src/adventure";
import {
  createBattle,
  stepBattle,
  serializeBattleState,
  restoreBattleState,
  calculateStateHash,
  applyStatus,
  tickStatuses,
} from "../../packages/battle-engine/src/index";
const profile: CollectionProfile = {
  cards: [
    { characterId: "char_01", level: 3, xp: 0 },
    { characterId: "char_11", level: 2, xp: 0 },
  ],
  itemCards: [{ itemId: "item_01", level: 1, xp: 0 }],
  team: ["char_01"],
  equipment: {},
};
const preset: TeamPreset = {
  id: "a",
  name: "A",
  team: ["char_01", "char_11"],
  equipment: { char_11: ["item_01"] },
};
describe("build and progression invariants", () => {
  it("applies whole builds without changing cards and rejects missing or duplicated gear", () => {
    const result = applyPreset(profile, preset);
    expect(result.cards).toBe(profile.cards);
    expect(result.equipment).toEqual(preset.equipment);
    expect(profile.equipment).toEqual({});
    expect(() =>
      applyPreset(profile, {
        ...preset,
        equipment: { char_01: ["item_01"], char_11: ["item_01"] },
      }),
    ).toThrow("một nhân vật");
    expect(presetMissing({ ...profile, itemCards: [] }, preset)).toHaveLength(
      1,
    );
    expect(() => applyPreset({ ...profile, itemCards: [] }, preset)).toThrow(
      "thiếu",
    );
  });
  it("persists independent locks and validates an experience document", () => {
    const locked = toggleLock(profile, "character:char_11");
    expect(experienceOf(locked).locked).toContain("character:char_11");
    expect(
      experienceOf(toggleLock(locked, "character:char_11")).locked,
    ).toEqual([]);
    expect(validExperience(experienceOf(locked))).toBe(true);
    for (const malformed of [
      null,
      {},
      { ...experienceOf(profile), presets: [{ id: "x", name: "x" }] },
      { ...experienceOf(profile), expedition: null },
    ])
      expect(validExperience(malformed)).toBe(false);
    expect(
      validExperience({
        ...experienceOf(profile),
        presets: Array(6).fill(preset),
      }),
    ).toBe(false);
  });
  it("conserves all earned packs, including across reserve claims and duplicate settlement", () => {
    const before = { packs: 148, lastPackAt: 0, rewardReserve: 0 };
    const after = awardPacks(before, 15, "boss:5", 0);
    expect(after.packs).toBe(150);
    expect(after.rewardReserve).toBe(13);
    expect(awardPacks(after, 15, "boss:5", 0)).toBe(after);
    const claimed = claimReserve({ ...after, packs: 145 }, 0);
    expect(claimed.packs).toBe(150);
    expect(claimed.rewardReserve).toBe(8);
  });
  it("does not regress partial mail receipts on delayed synchronization", () => {
    const before = {
      packs: 140,
      lastPackAt: 1000,
      mailbox: [welcomeMail(1000)],
    };
    const after = claimMail(before, "welcome", 1000);
    expect(mergeMailbox(after.mailbox, before.mailbox)[0].claimedPacks).toBe(
      10,
    );
  });
});
describe("standardized content", () => {
  it("reduces actual periodic ally healing symmetrically with the recovery contract", () => {
    const base = adventureConfig(
      [loanUnit("char_11"), loanUnit("char_22")],
      [loanUnit("char_13"), loanUnit("char_15")],
    );
    const totals = [100, 70].map((recoveryPercent) => {
      const state = createBattle({ ...base, recoveryPercent }, 77);
      for (const [a, b] of [
        [0, 1],
        [2, 3],
      ]) {
        const source = state.fighters[a],
          target = state.fighters[b];
        target.hp -= 100;
        applyStatus(state, source, target, "blessing", 30, 120);
      }
      const hp = state.fighters.map((f) => f.hp);
      for (state.tick = 1; state.tick <= 90; state.tick++) tickStatuses(state);
      return [1, 3].map((id) => state.fighters[id].hp - hp[id]);
    });
    expect(totals[1][0]).toBeLessThan(totals[0][0]);
    expect(totals[1][1]).toBeLessThan(totals[0][1]);
  });
  it("resets weekly on UTC Monday, including year boundaries", () => {
    const now = Date.parse("2027-01-03T23:59:59Z");
    expect(weekId(now)).toBe("2026-12-28");
    expect(weekEnds(now)).toBe(Date.parse("2027-01-04T00:00:00Z"));
  });
  it("rebuilds loaned stats instead of trusting submitted levels or stats", () => {
    expect(
      legalLoanTeam([
        { ...loanUnit("char_01"), level: 999, stats: { hp: 9999999 } },
      ])[0].level,
    ).toBe(10);
    expect(() =>
      legalLoanTeam([loanUnit("char_01"), loanUnit("char_01")]),
    ).toThrow("trùng");
    expect(() => normalizeContracts(["recovery", "recovery"])).toThrow();
    expect(() => legalLoanTeam([loanUnit("char_31")], ["rare"])).toThrow(
      "Hiếm",
    );
  });
  it("keeps all opponents legal under all eight contract combinations", () => {
    for (let mask = 0; mask < 8; mask++) {
      const contracts = CONTRACTS.filter((_, index) => mask & (1 << index)).map(
        (c) => c.id,
      );
      for (let n = 0; n < 3; n++) {
        const enemies = weeklyEnemies("2026-10-26", n, contracts);
        expect(legalLoanTeam(enemies, contracts)).toEqual(enemies);
      }
    }
  });
  it("replays modifiers deterministically across checkpoints without changing ordinary combat", () => {
    const config = adventureConfig(
      [loanUnit("char_01"), loanUnit("char_11")],
      [loanUnit("char_14"), loanUnit("char_22")],
      ["recovery"],
    );
    const a = createBattle(config, 4321);
    for (let n = 0; n < 200; n++) stepBattle(a);
    const b = restoreBattleState(serializeBattleState(a));
    for (let n = 0; n < 300; n++) {
      stepBattle(a);
      stepBattle(b);
    }
    expect(calculateStateHash(a)).toBe(calculateStateHash(b));
    const normal = { ...config, recoveryPercent: undefined },
      explicit = { ...config, recoveryPercent: 100 };
    const c = createBattle(normal, 1),
      d = createBattle(explicit, 1);
    for (let n = 0; n < 300; n++) {
      stepBattle(c);
      stepBattle(d);
    }
    expect(c.fighters).toEqual(d.fighters);
  });
});
