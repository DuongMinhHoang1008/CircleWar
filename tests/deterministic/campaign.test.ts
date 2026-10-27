import { describe, expect, it } from "vitest";
import { CAMPAIGN_TEAMS, CAMPAIGN_TACTICS, campaignEncounter, campaignPackReward, campaignBossPackReward, campaignStats } from "../../packages/shared/src/campaign";
import { BONDS, FRIEND_GROUPS, CATALOG_ITEMS, groupTier, type CharacterId } from "../../packages/shared/src/catalog";
import { CAMPAIGN_FORMATIONS } from "../../packages/shared/src/campaign-tactics";
import { computeStats, type Loadout } from "../../packages/shared/src/balance";
import { createBattle, debugConfig, stepBattle, calculateStateHash } from "../../packages/battle-engine/src/index";

describe("campaign encounters", () => {
  it("rotates eight distinct playstyles while preserving their core in smaller squads", () => {
    for (const size of [1, 2, 3]) {
      const styles = new Set<string>();
      const roster = new Set<string>();
      let previous = "";
      for (let stage = 1; stage <= 180; stage++) {
        const encounter = campaignEncounter(stage, size);
        expect(encounter.loadouts).toHaveLength(encounter.boss ? 3 : size);
        const tactic = CAMPAIGN_TACTICS.find(t => t.id === encounter.archetype)!;
        const ids = encounter.loadouts.map(l => l.characterId!);
        expect((tactic.core as readonly string[]).includes(ids[0])).toBe(true);
        if (!encounter.boss) {
          expect(ids[0]).not.toBe(previous);
          previous = ids[0];
          styles.add(encounter.archetype);
          ids.forEach(id => roster.add(id));
        }
      }
      expect(styles.size).toBe(8);
      if (size === 3) expect(roster.size).toBe(33);
    }
  });
  it("introduces equipment gradually, with legal unique items and capped levels", () => {
    for (let stage = 1; stage <= 240; stage++) for (const size of [1, 2, 3]) {
      const encounter = campaignEncounter(stage, size);
      const equipment = encounter.loadouts.flatMap(l => l.equipment);
      const slots = stage < 6 ? 0 : stage < 11 ? 1 : stage < 21 ? 2 : 3;
      expect(equipment).toHaveLength(Math.min(encounter.loadouts.length, slots));
      expect(new Set(equipment).size).toBe(equipment.length);
      for (const loadout of encounter.loadouts) for (const item of loadout.equipment) {
        expect(CATALOG_ITEMS.some(i => i.id === item)).toBe(true);
        expect(loadout.equipmentLevels![item]).toBeGreaterThanOrEqual(1);
        expect(loadout.equipmentLevels![item]).toBeLessThanOrEqual(10);
        if (stage >= 21 && ["char_28", "char_29", "char_30"].includes(loadout.characterId!)) {
          expect(CATALOG_ITEMS.find(i => i.id === item)!.affinity).toBe(loadout.characterId);
        }
      }
    }
  });
  it("increases composition quality after card levels cap and reports only active links", () => {
    const average = (from: number, to: number) => {
      const encounters = Array.from({ length: to - from + 1 }, (_, i) => campaignEncounter(from + i, 3)).filter(e => !e.boss);
      return encounters.reduce((total, e) => total + e.coherence, 0) / encounters.length;
    };
    expect(average(101, 180)).toBeGreaterThan(average(61, 100));
    expect(average(61, 100)).toBeGreaterThan(average(1, 40));
    for (const size of [1, 2, 3]) for (let stage = 1; stage <= 100; stage++) {
      const e = campaignEncounter(stage, size);
      const ids = e.loadouts.map(l => l.characterId as CharacterId);
      const bonds = BONDS.filter(b => b.members.every(id => ids.includes(id as CharacterId)));
      const groups = FRIEND_GROUPS.filter(g => groupTier(g, ids) > 0);
      expect(e.links).toBe(bonds.length + groups.length);
      expect(e.fullGroup).toBe(groups.some(g => groupTier(g, ids) === 3));
    }
  });
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
    for (const ids of CAMPAIGN_FORMATIONS) expect(CAMPAIGN_TEAMS.some(team => ids.every(id => team.ids.includes(id)))).toBe(true);
    for (const bond of BONDS.filter(b => b.members.length === 3)) expect(CAMPAIGN_TEAMS.some(team => bond.members.every(id => team.ids.includes(id as CharacterId)))).toBe(true);
    for (let stage = 31; stage < 200; stage++) {
      const encounter = campaignEncounter(stage, 3);
      expect(encounter.links >= 2 || encounter.fullGroup).toBe(true);
      const tactic = CAMPAIGN_TACTICS.find(t => t.id === encounter.archetype)!;
      const members = [...tactic.core, ...tactic.partners] as readonly string[];
      expect(encounter.loadouts.filter(l => members.includes(l.characterId!)).length).toBeGreaterThanOrEqual(stage >= 61 ? 3 : 2);
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
