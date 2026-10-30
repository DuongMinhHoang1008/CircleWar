import { describe, it, expect } from "vitest";
import {
  challengeDay,
  challengeEnds,
  dailyPool,
  legalDailyTeam,
  defaultDailyTeam,
  validDailyProgress,
  savedDailyTeam,
  saveDailyTeam,
} from "../../packages/shared/src/daily-challenges";
import {
  ROSTER,
  BONDS,
  FRIEND_GROUPS,
  type CharacterId,
} from "../../packages/shared/src/catalog";
import {
  MASTERY,
  adventureConfig,
  loanUnit,
} from "../../packages/shared/src/adventure";
import { computeStats } from "../../packages/shared/src/balance";
import { masteriesFor, MASTERIES } from "../../packages/shared/src/mastery";
import {
  createRun,
  starterChoices,
  enterNode,
  beginRunBattle,
  settleRunBattle,
  runBattleConfig,
  runBattleSeed,
  takeLoot,
  lootChoices,
  leaveNode,
  buyItem,
  buyRunRest,
  nodeStock,
  recruit,
  dismiss,
  upgradeRun,
  restRun,
  equipRunItem,
  resolveEvent,
  validRun,
  type RoguelikeRun,
} from "../../packages/shared/src/roguelike";
import {
  experienceOf,
  validExperience,
} from "../../packages/shared/src/experience";
import {
  applyModeReward,
  claimLocalModeReward,
  dailyWins,
  rewardReceipt,
  settleRogueRewards,
  type RewardProfile,
} from "../../packages/shared/src/mode-rewards";
import {
  awardPacksToMailbox,
  claimMail,
  validMailbox,
} from "../../packages/shared/src/mailbox";
import { advanceMastery } from "../../apps/web/src/adventureProgress";
import {
  createBattle,
  stepBattle,
  serializeBattleState,
  restoreBattleState,
  calculateStateHash,
  applyStatus,
  statusPower,
} from "../../packages/battle-engine/src/index";
import {
  signatureResonance,
  characterCombat,
} from "../../packages/battle-engine/src/character-combat";
import { synergyKind } from "../../packages/shared/src/synergy";
import type { BattleSummary } from "../../apps/web/src/battleAnalytics";

const now = Date.parse("2026-10-28T06:00:00Z");
function fresh(seed = 52) {
  return createRun("run", seed, starterChoices(seed)[0]);
}
function victory(run: RoguelikeRun) {
  return settleRunBattle(
    beginRunBattle(run),
    true,
    run.team.map((id) => ({ characterId: id, hp: 45, maxHp: 100 })),
  ).run!;
}
function firstWin() {
  return takeLoot(victory(enterNode(fresh(), "1:0")), undefined);
}
describe("daily challenges", () => {
  it("shares the full build across opponents and migrates the last selected legacy team", () => {
    const day = challengeDay(now),
      original = defaultDailyTeam(day),
      changed = [...original].reverse();
    changed[0] = {
      ...changed[0],
      equipment: ["item_01"],
      equipmentLevels: { item_01: 10 },
    };
    const legacy = { day, selected: 1, teams: { "0": original, "1": changed } };
    expect(savedDailyTeam(legacy, day)).toEqual(legalDailyTeam(changed, day));
    const shared = saveDailyTeam(savedDailyTeam(legacy, day), 2, day);
    expect(validDailyProgress(shared)).toBe(true);
    for (const selected of [0, 1, 2]) {
      expect(shared.teams[String(selected)]).toEqual(
        legalDailyTeam(changed, day),
      );
      expect(savedDailyTeam({ ...shared, selected }, day)).toEqual(
        shared.teams["0"],
      );
    }
    expect(savedDailyTeam(shared, "2026-10-29")).toEqual(
      defaultDailyTeam("2026-10-29"),
    );
  });
  it("rotates at midnight Vietnam and keeps a deterministic, restricted nine-character pool", () => {
    const before = Date.parse("2026-10-28T16:59:59Z"),
      after = before + 1000;
    expect(challengeDay(before)).toBe("2026-10-28");
    expect(challengeDay(after)).toBe("2026-10-29");
    expect(challengeEnds(before)).toBe(after);
    const pool = dailyPool(challengeDay(before));
    expect(pool).toHaveLength(9);
    expect(new Set(pool).size).toBe(9);
    expect(dailyPool(challengeDay(before))).toEqual(pool);
    expect(dailyPool(challengeDay(after))).not.toEqual(pool);
    const outsider = ROSTER.find((c) => !pool.includes(c.id as CharacterId))!;
    expect(() =>
      legalDailyTeam(
        [loanUnit(outsider.id as CharacterId)],
        challengeDay(before),
      ),
    ).toThrow("pool");
    expect(
      validDailyProgress({
        day: challengeDay(before),
        selected: 1,
        teams: { "1": defaultDailyTeam(challengeDay(before)) },
      }),
    ).toBe(true);
    expect(
      validDailyProgress({
        day: challengeDay(before),
        selected: 1,
        teams: { "1": [loanUnit(outsider.id as CharacterId)] },
      }),
    ).toBe(false);
  });
  it("separates daily wins and receipts and routes overflow to a claimable inbox letter exactly once", () => {
    const profile: RewardProfile = {
      cards: [{ characterId: "char_01" as const, level: 1, xp: 0 }],
      itemCards: [],
      team: ["char_01" as const],
      equipment: {},
      packs: 148,
      bossPacks: 0,
      lastPackAt: now,
      experience: {
        ...experienceOf({}),
        medals: { [`daily:${challengeDay(now)}:0`]: 1 },
      },
    };
    expect(dailyWins(profile, challengeDay(now))).toBe(1);
    expect(dailyWins(profile, challengeDay(now + 86400000))).toBe(0);
    const next = claimLocalModeReward(profile, "daily-1", now);
    expect(next.packs).toBe(150);
    expect(next.mailbox?.[0].packs).toBe(3);
    expect(next.rewardReserve).toBe(0);
    expect(validMailbox(next.mailbox)).toBe(true);
    expect(claimLocalModeReward(next, "daily-1", now)).toBe(next);
    expect(rewardReceipt("daily-1", now)).not.toBe(
      rewardReceipt("daily-1", now + 86400000),
    );
    const claimed = claimMail(
      { ...next, packs: 149 },
      next.mailbox![0].id,
      now,
    );
    expect(claimed.mailbox![0].claimedPacks).toBe(1);
    expect(
      claimed.packs +
        claimed.mailbox![0].packs -
        claimed.mailbox![0].claimedPacks!,
    ).toBe(152);
    const fullInbox = {
      ...profile,
      mailbox: Array.from({ length: 200 }, (_, n) => ({
        id: `mail-${n}`,
        packs: 1,
        title: "Quà",
        message: "Quà",
        createdAt: now,
      })),
    };
    const overflow = awardPacksToMailbox(fullInbox, 5, "full", now);
    expect(overflow.rewardReserve).toBe(3);
    expect(overflow.mailbox).toHaveLength(200);
  });
});
describe("roguelike state and economy", () => {
  it("charges for one bounded shop heal and rejects repeated or out-of-room purchases", () => {
    const shop = enterNode(firstWin(), "2:0"),
      id = shop.team[0],
      healed = buyRunRest(shop);
    expect(healed.gold).toBe(shop.gold - 25);
    expect(healed.health[id]).toBe(80);
    expect(() => buyRunRest(healed)).toThrow("một lượt");
    expect(() => buyRunRest({ ...shop, gold: 24 })).toThrow("vàng");
    expect(() => buyRunRest(enterNode(fresh(), "1:0"))).toThrow();
    expect(validRun(healed)).toBe(true);
  });
  it("starts with a one-on-one room, never a hidden campaign boss or a geared late-game enemy", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const config = runBattleConfig(enterNode(fresh(seed), "1:0"));
      expect(config.teams[1].loadouts).toHaveLength(1);
      expect(config.teams[1].loadouts[0].equipment).toEqual([]);
      expect(config.teams[1].loadouts[0].level).toBeLessThanOrEqual(2);
    }
  });
  it("locks a resumable deterministic battle, carries HP and destroys all active run state after one loss", () => {
    const node = enterNode(fresh(), "1:0"),
      active = beginRunBattle(node);
    expect(validRun(active)).toBe(true);
    expect(runBattleSeed(active)).toBe(
      runBattleSeed(JSON.parse(JSON.stringify(active))),
    );
    expect(runBattleSeed(beginRunBattle(enterNode(fresh(53), "1:0")))).not.toBe(
      runBattleSeed(active),
    );
    expect(runBattleConfig(active)).toEqual(
      runBattleConfig(JSON.parse(JSON.stringify(active))),
    );
    const won = settleRunBattle(active, true, [
      { characterId: active.team[0], hp: 23, maxHp: 100 },
    ]).run!;
    expect(won.gold).toBe(135);
    expect(won.health[won.team[0]]).toBe(23);
    expect(won.floor).toBe(1);
    expect(validRun(won)).toBe(true);
    expect(() => beginRunBattle(active)).toThrow();
    expect(() => leaveNode(active)).toThrow();
    expect(() => equipRunItem(active, active.team[0], "")).toThrow();
    const dead = settleRunBattle(active, false, []);
    expect(dead.run).toBeUndefined();
    expect(dead.end?.reason).toBe("defeat");
    const wounded = createBattle(
      adventureConfig(
        [{ ...loanUnit("char_01"), startingHpPercent: 23 }],
        [loanUnit("char_08")],
      ),
      1,
    );
    expect(wounded.fighters[0].hp).toBe(
      Math.max(1, Math.round(wounded.fighters[0].stats.hp * 0.23)),
    );
  });
  it("checks stock, gold, team capacity and upgrades; keeps dismissed equipment in the bag", () => {
    let r = enterNode(firstWin(), "2:0");
    const item = nodeStock(r).items[0];
    r = buyItem(r, item);
    expect(() => buyItem(r, item)).toThrow("đã mua");
    expect(() => buyItem({ ...r, gold: 0 }, nodeStock(r).items[1])).toThrow(
      "vàng",
    );
    r = recruit(r, nodeStock(r).recruits[0]);
    expect(r.team).toHaveLength(2);
    expect(() => recruit(r, nodeStock(r).recruits[0])).toThrow();
    r = equipRunItem(r, r.team[1], item);
    const removed = r.team[1];
    r = dismiss(r, removed);
    expect(r.bag).toContain(item);
    expect(r.equipment[removed]).toBeUndefined();
    expect(r.masteries[removed]).toBeUndefined();
    expect(() => dismiss(r, r.team[0])).toThrow("ít nhất");
    const upgraded = upgradeRun({ ...r, gold: 40 }, r.team[0]);
    expect(upgraded.gold).toBe(0);
    expect(upgraded.levels[r.team[0]]).toBe(r.levels[r.team[0]] + 1);
    expect(validExperience({ ...experienceOf({}), roguelike: upgraded })).toBe(
      true,
    );
  });
  it("allows only one camp action and one event resolution, with full path validation", () => {
    let r = firstWin();
    r = leaveNode(enterNode(r, "2:1"));
    r = resolveEvent(enterNode(r, "3:1"), "heal");
    r = takeLoot(victory(enterNode(r, "4:0")));
    const camp = enterNode(r, "5:0"),
      healed = restRun(camp);
    expect(healed.floor).toBe(5);
    expect(healed.health[healed.team[0]]).toBe(80);
    expect(() => restRun(healed)).toThrow();
    expect(validRun(healed)).toBe(true);
    expect(validRun({ ...healed, path: [] })).toBe(false);
    expect(validRun({ ...healed, gold: -1 })).toBe(false);
    expect(validRun({ ...healed, health: { [healed.team[0]]: 0 } })).toBe(
      false,
    );
  });
  it("can complete every floor with valid checkpoints and pays only at recorded milestones", () => {
    let r = fresh();
    const battleSeeds = new Set<number>();
    while (r.floor < 12) {
      const floor = r.floor + 1,
        id = [3, 9, 11].includes(floor) ? `${floor}:1` : `${floor}:0`;
      r = enterNode(r, id);
      const kind = r.node?.split(":")[0];
      if ([1, 4, 6, 8, 10, 12].includes(floor)) {
        const active = beginRunBattle(r),
          result = settleRunBattle(
            active,
            true,
            r.team.map((characterId) => ({ characterId, hp: 90, maxHp: 100 })),
          );
        expect(battleSeeds.has(runBattleSeed(active))).toBe(false);
        battleSeeds.add(runBattleSeed(active));
        if (floor === 12) {
          expect(result.end?.won).toBe(true);
          expect(result.run).toBeUndefined();
          break;
        }
        r = takeLoot(result.run!, lootChoices(result.run!)[0]);
      } else if ([2, 7, 11].includes(floor)) r = leaveNode(r);
      else if ([3, 9].includes(floor)) r = resolveEvent(r, "heal");
      else r = restRun(r);
      expect(validRun(r), `floor ${floor} ${kind}`).toBe(true);
    }
  });
});
describe("revised roguelike rewards", () => {
  const completed = (): RewardProfile => ({
    cards: [{ characterId: "char_01", level: 1, xp: 0 }],
    itemCards: [],
    team: ["char_01"],
    equipment: {},
    packs: 150,
    lastPackAt: now,
    bossPacks: 0,
    experience: {
      ...experienceOf({}),
      roguelikeDay: challengeDay(now),
      roguelikeBest: 12,
    },
  });
  it("credits 150 normal packs, 15 Boss packs and one chosen epic chest without losing overflow or repeating claims", () => {
    const next = settleRogueRewards(completed(), now);
    expect(next.mailbox?.reduce((n, m) => n + m.packs, 0)).toBe(150);
    expect(next.bossPacks).toBe(15);
    expect(next.choiceChests).toBe(1);
    expect(settleRogueRewards(next, now)).toBe(next);
    expect(validMailbox(next.mailbox)).toBe(true);
    expect(settleRogueRewards(next, now + 86400000)).toBe(next);
  });
  it("tops up the difference for already-paid old milestones instead of paying either schedule twice", () => {
    const old = {
      ...completed(),
      bossPacks: 4,
      mailbox: [
        {
          id: "old-rewards",
          title: "Thưởng",
          message: "Thưởng",
          packs: 45,
          createdAt: now,
        },
      ],
      rewardReceipts: [4, 8, 12].map((n) =>
        rewardReceipt(`roguelike-${n}`, now),
      ),
    };
    const next = settleRogueRewards(old, now);
    expect(next.mailbox.reduce((n, m) => n + m.packs, 0)).toBe(150);
    expect(next.bossPacks).toBe(15);
    expect(next.choiceChests).toBe(1);
    expect(settleRogueRewards(next, now)).toBe(next);
  });
});
describe("all-character journeys", () => {
  it("defines three usable skills for all 33 characters and applies their tradeoffs", () => {
    expect(MASTERY).toHaveLength(ROSTER.length);
    expect(MASTERIES).toHaveLength(99);
    for (const c of ROSTER)
      expect(masteriesFor(c.id).map((m) => m.goal)).toEqual([3, 8, 15]);
    const unit = loanUnit("char_02"),
      base = computeStats(unit),
      power = computeStats({ ...unit, masteryId: "char_02:pressure" });
    expect(power.attack).toBe(base.attack);
    expect(power.hp).toBe(base.hp);
    expect(computeStats({ ...unit, masteryId: "char_03:pressure" })).toEqual(
      base,
    );
  });
  it("persists a single unlock notification at a threshold and ignores enemy characters", () => {
    const summary = {
      winner: "team-player",
      units: [
        { characterId: "char_02", team: "team-player" },
        { characterId: "char_03", team: "team-rival" },
      ],
      tactics: { bonds: 0, groups: 0 },
    } as BattleSummary;
    const exp = { ...experienceOf({}), mastery: { char_02: 2, char_03: 2 } },
      next = advanceMastery(exp, summary);
    expect(next.mastery.char_02).toBe(3);
    expect(next.mastery.char_03).toBe(2);
    expect(next.masteryNotices).toEqual(["char_02:pressure"]);
    expect(advanceMastery(next, summary).masteryNotices).toEqual(
      next.masteryNotices,
    );
    expect(validExperience(next)).toBe(true);
  });
});
describe("synergy signatures", () => {
  for (const id of ["P01", "P05", "P02", "P15"])
    it(`${id} grants ${synergyKind(id)} with shared cooldown and no dead-member activation`, () => {
      const bond = BONDS.find((b) => b.id === id)!,
        state = createBattle(
          adventureConfig(
            bond.members.map((c) => loanUnit(c as CharacterId)),
            [loanUnit("char_07")],
          ),
          42,
        ),
        [source, ally] = state.fighters;
      source.x = 100;
      source.y = 100;
      ally.x = 70000;
      ally.y = 70000;
      applyStatus(state, state.fighters[2], ally, "frozen", 25, 100);
      applyStatus(state, state.fighters[2], ally, "paralyzed", 25, 100);
      signatureResonance(state, source, [source, ally], id, false);
      if (id === "P01") {
        expect(ally.shield).toBeGreaterThan(0);
        expect(statusPower(ally, "frozen", 0)).toBe(0);
        expect(statusPower(ally, "paralyzed", 0)).toBe(0);
      }
      if (id === "P05")
        expect(
          ally.buffs.some((b) => b.kind === "bonus" && b.source === -4000),
        ).toBe(true);
      if (id === "P15") expect(ally.memory.gain).toBe(20);
      if (id === "P02")
        expect(statusPower(state.fighters[2], "stunned", 0)).toBe(1);
      signatureResonance(state, ally, [source, ally], id, false);
      expect(
        state.events.filter((e) => e.type.startsWith("resonance:")).length,
      ).toBe(1);
      state.tick = 240;
      ally.hp = 0;
      signatureResonance(state, source, [source, ally], id, false);
      expect(
        state.events.filter((e) => e.type.startsWith("resonance:")).length,
      ).toBe(1);
    });
  it("triggers from an actual far-apart linked Super and preserves deterministic checkpoints", () => {
    const state = createBattle(
      adventureConfig(
        [loanUnit("char_01"), loanUnit("char_08")],
        [loanUnit("char_07")],
      ),
      50,
    );
    state.fighters[0].energy = 100;
    state.fighters[0].x = 1000;
    state.fighters[1].x = 70000;
    characterCombat(state);
    expect(state.events.some((e) => e.type === "resonance:P01")).toBe(true);
    const clone = restoreBattleState(serializeBattleState(state));
    for (let i = 0; i < 400; i++) {
      stepBattle(state);
      stepBattle(clone);
    }
    expect(calculateStateHash(state)).toBe(calculateStateHash(clone));
  });
});
