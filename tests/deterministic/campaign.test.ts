import { describe, expect, it } from "vitest";
import { CAMPAIGN_TEAMS, campaignEncounter, campaignPackReward, campaignBossPackReward, campaignStats } from "../../packages/shared/src/campaign";
import { computeStats, type Loadout } from "../../packages/shared/src/balance";
import { createBattle, debugConfig, stepBattle, calculateStateHash } from "../../packages/battle-engine/src/index";

describe("campaign encounters", () => {
  it("varies adjacent stage lineups while retries remain deterministic", () => {
    let previous: string[] = [];
    const seen = new Set<string>();
    for (let stage = 1; stage <= 35; stage++) {
      if (stage % 5 === 0) continue;
      const encounter = campaignEncounter(stage, 3);
      const ids = encounter.loadouts.map(l => l.characterId!);
      expect(ids.join(","), `stage ${stage}`).not.toBe(previous.join(","));
      expect(new Set(ids).size).toBe(3);
      expect(encounter).toEqual(campaignEncounter(stage, 3));
      ids.forEach(id => seen.add(id));
      previous = ids;
    }
    expect(seen.size).toBeGreaterThanOrEqual(20);
  });
  it("uses exactly the displayed card level and gear stats at every normal stage, even after the cap", () => {
    for (const stage of [...Array.from({ length: 120 }, (_, i) => i + 1), 999, 10001]) {
      if (stage % 5 === 0) continue;
      const encounter = campaignEncounter(stage, 3);
      for (const loadout of encounter.loadouts) {
        expect(campaignStats(loadout, stage, 3)).toEqual(computeStats(loadout));
        expect(loadout.level).toBeLessThanOrEqual(10);
        expect(loadout.equipment.length).toBeLessThanOrEqual(1);
      }
      expect(encounter.strategy.length).toBeGreaterThan(10);
    }
  });
  it("creates one enlarged commander and two escorts with ordinary card stats", () => {
    for (const squadSize of [1, 2, 3]) {
      const boss = campaignEncounter(5, squadSize);
      expect(boss.loadouts).toHaveLength(3);
      const config = debugConfig(2);
      const hero: Loadout = { characterId: "char_01", classId: "guardian", level: 1, equipment: [] };
      config.teams = [{ id: "player", loadouts: Array.from({ length: squadSize }, () => hero) }, { id: "enemy", loadouts: boss.loadouts }];
      config.campaign = { stage: 5, enemyTeamId: "enemy" };
      const state = createBattle(config, 19);
      const enemy = state.fighters.find(f => f.team === "enemy")!;
      expect(enemy.boss).toBe(true);
      expect(enemy.radius).toBe(2800);
      expect(enemy.stats.hp).toBeGreaterThan(computeStats(boss.loadouts[0]).hp);
      expect(enemy.stats.attack).toBeGreaterThan(computeStats(boss.loadouts[0]).attack);
      expect(enemy.stats.mass).toBeGreaterThan(computeStats(boss.loadouts[0]).mass);
      for (const escort of state.fighters.filter(f => f.team === "enemy" && f.slot > 0)) {
        expect(escort.boss).toBeUndefined();
        expect(escort.radius).toBe(1700);
        expect(escort.baseStats).toEqual(computeStats(boss.loadouts[escort.slot]));
      }
      const originalAttack = enemy.baseStats.attack;
      stepBattle(state);
      expect(enemy.baseStats.attack).toBe(originalAttack);
      expect(enemy.radius).toBe(2800);
      expect(state.fighters.filter(f => f.team === "player").every(f => !f.boss && f.radius === 1700)).toBe(true);
    }
  });
  it("has 729 unique linked combinations and prefers advanced synergies after stage 30", () => {
    expect(CAMPAIGN_TEAMS).toHaveLength(729);
    expect(new Set(CAMPAIGN_TEAMS.map(team => team.ids.join(","))).size).toBe(729);
    expect(CAMPAIGN_TEAMS.every(team => team.links > 0 && new Set(team.ids).size === 3)).toBe(true);
    for (let stage = 31; stage < 200; stage++) {
      const encounter = campaignEncounter(stage, 3);
      expect(encounter.links >= 2 || encounter.fullGroup).toBe(true);
    }
  });
  it("replays deterministically and leaves ordinary PvP stats unchanged", () => {
    const encounter = campaignEncounter(10, 1);
    const config = debugConfig(2);
    config.teams[1].loadouts = encounter.loadouts;
    const normal = createBattle(config, 27);
    expect(normal.fighters.every(f => !f.boss && f.radius === 1700)).toBe(true);
    config.campaign = { stage: 10, enemyTeamId: config.teams[1].id };
    const a = createBattle(config, 27), b = createBattle(config, 27);
    for (let tick = 0; tick < 300; tick++) { stepBattle(a); stepBattle(b); }
    expect(calculateStateHash(a)).toBe(calculateStateHash(b));
    expect(campaignPackReward(4)).toBe(5);
    expect(campaignPackReward(5)).toBe(15);
    expect(campaignBossPackReward(4)).toBe(0);
    expect(campaignBossPackReward(5)).toBe(1);
    expect(campaignBossPackReward(10)).toBe(3);
  });
});
