import { describe, expect, it } from "vitest";
import {
  applyModeReward,
  claimLocalModeReward,
  epicChoices,
  openChoiceChest,
  practiceWins,
  rewardReceipt,
  type RewardProfile,
} from "../../packages/shared/src/mode-rewards";
import { experienceOf } from "../../packages/shared/src/experience";
import { weekId } from "../../packages/shared/src/adventure";
import { dailyQuestDay } from "../../packages/shared/src/progression";
import { ROSTER, CATALOG_ITEMS } from "../../packages/shared/src/catalog";
const now = Date.parse("2026-10-27T12:00:00Z");
const base = (): RewardProfile => ({
  cards: [{ characterId: "char_01", level: 1, xp: 0 }],
  itemCards: [],
  team: ["char_01"],
  equipment: {},
  packs: 150,
  lastPackAt: now,
  bossPacks: 0,
  experience: {
    ...experienceOf({}),
    medals: {
      [`weekly:${weekId(now)}:open:0`]: 1,
      [`weekly:${weekId(now)}:rare:0`]: 1,
    },
  },
});
describe("mode rewards", () => {
  it("counts distinct opponents and shares receipts across contracts", () => {
    const p = base();
    expect(practiceWins(p, now)).toBe(1);
    const next = claimLocalModeReward(p, "practice-1", now);
    expect(next.packs).toBe(150);
    expect(next.mailbox?.[0].packs).toBe(10);
    expect(next.rewardReserve).toBe(0);
    expect(next.bossPacks).toBe(1);
    expect(claimLocalModeReward(next, "practice-1", now)).toBe(next);
    expect(() => claimLocalModeReward(next, "practice-2", now)).toThrow(
      "Chưa đạt",
    );
  });
  it("locks official payouts behind the server", () =>
    expect(() => claimLocalModeReward(base(), "official-9", now)).toThrow(
      "máy chủ",
    ));
  it("requires the best score of one run and rolls daily rewards without losing first-clear receipts", () => {
    let p = base();
    p.experience = {
      ...experienceOf(p),
      expeditionDay: dailyQuestDay(now),
      expeditionBest: 4,
      medals: { "expedition:perfect": 1 },
    };
    p = claimLocalModeReward(p, "expedition-4", now);
    expect(p.bossPacks).toBe(1);
    expect(p.mailbox?.[0].packs).toBe(15);
    expect(p.rewardReserve).toBe(0);
    expect(() => claimLocalModeReward(p, "expedition-6", now)).toThrow();
    const first = claimLocalModeReward(p, "expedition-perfect", now);
    expect(first.choiceChests).toBe(1);
    expect(first.bossPacks).toBe(4);
    expect(
      claimLocalModeReward(first, "expedition-perfect", now + 86400000),
    ).toBe(first);
    expect(() =>
      claimLocalModeReward(first, "expedition-4", now + 86400000),
    ).toThrow();
  });
  it("does not multiply rewards after retry or reload", () => {
    const p = applyModeReward(
      base(),
      { packs: 50, bossPacks: 5, choiceChests: 1 },
      rewardReceipt("official-9", now),
      now,
    );
    const loaded = JSON.parse(JSON.stringify(p)) as RewardProfile;
    expect(
      applyModeReward(
        loaded,
        { packs: 50, bossPacks: 5, choiceChests: 1 },
        rewardReceipt("official-9", now),
        now,
      ),
    ).toBe(loaded);
  });
  it("grants exactly the chosen eligible epic card and debits one chest", () => {
    const p = { ...base(), choiceChests: 1 },
      choice = epicChoices(p).find((c) => c.kind === "character")!;
    const next = openChoiceChest(p, `character:${choice.id}`);
    expect(next.choiceChests).toBe(0);
    expect(next.cards.find((c) => c.characterId === choice.id)).toEqual({
      characterId: choice.id,
      level: 1,
      xp: 0,
    });
    expect(() => openChoiceChest(next, `character:${choice.id}`)).toThrow(
      "chưa có",
    );
    expect(() => openChoiceChest(p, "character:char_01")).toThrow("Sử thi");
  });
  it("turns an exhausted epic pool into five Boss packs", () => {
    const p: RewardProfile = {
      ...base(),
      choiceChests: 1,
      cards: ROSTER.map((c) => ({
        characterId: c.id as RewardProfile["team"][number],
        level: 10,
        xp: 0,
      })),
      itemCards: CATALOG_ITEMS.map((c) => ({ itemId: c.id, level: 10, xp: 0 })),
    };
    expect(epicChoices(p)).toEqual([]);
    const next = openChoiceChest(p, "boss-packs");
    expect(next.bossPacks).toBe(5);
    expect(next.choiceChests).toBe(0);
  });
});
