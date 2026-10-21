import { computeStats, type Loadout, type Stats } from "./balance";
import { ROSTER, character, type CharacterId } from "./catalog";

const ENEMIES = ROSTER.filter(c => c.tier !== "RAC").map(c => c.id as CharacterId);
const BOSSES: CharacterId[] = ["char_03", "char_08", "char_18", "char_27", "char_23", "char_06", "char_15", "char_22", "char_26", "char_25"];
export const isCampaignBoss = (stage: number) => stage % 5 === 0;
export const campaignPackReward = (stage: number) => isCampaignBoss(stage) ? 15 : 5;

export function campaignEncounter(stage: number, squadSize: number) {
  const chapter = Math.floor((stage - 1) / 5);
  const boss = isCampaignBoss(stage);
  const count = boss ? 1 : Math.max(1, Math.min(3, squadSize));
  const loadouts: Loadout[] = Array.from({ length: count }, (_, slot) => {
    // Different stage/slot strides cover the roster without repeating any
    // member of an adjacent normal encounter. Retrying a stage stays stable.
    const id = boss ? BOSSES[chapter % BOSSES.length] : ENEMIES[((stage - 1) * 7 + slot * 5) % ENEMIES.length];
    return { characterId: id, classId: character(id)!.base as Loadout["classId"], level: Math.min(10, 1 + Math.floor((stage - 1) / 6) + (boss ? 1 : 0)), weaponRank: 1, equipment: [] };
  });
  return { stage, boss, loadouts, reward: campaignPackReward(stage) };
}

// Effective HP times sustained attack gives a smooth stage budget despite rarity
// and level milestones. Role-specific HP/attack proportions remain intact.
export function campaignThreat(stats: Stats) {
  return Math.sqrt((stats.hp / (1 - stats.defense / 100)) * stats.attack * 24 / stats.cooldown);
}
export function campaignStats(loadout: Loadout, stage: number, squadSize: number): Stats {
  const stats = computeStats(loadout);
  const target = 64 * Math.min(2.55, 0.9 + (stage - 1) * 0.025);
  const scale = target / campaignThreat(stats);
  stats.hp = Math.max(1, Math.round(stats.hp * scale));
  stats.attack = Math.max(1, Math.round(stats.attack * scale));
  if (isCampaignBoss(stage)) {
    const allies = Math.max(1, Math.min(3, squadSize));
    // One boss replaces the whole enemy squad. HP carries the extra bodies;
    // attack rises modestly so individual hits remain survivable.
    stats.hp = Math.round(stats.hp * allies * (allies === 1 ? 1.2 : 1.12 + (allies - 1) * 0.035));
    stats.attack = Math.round(stats.attack * (1.15 + (allies - 1) * 0.17));
    stats.defense = Math.min(24, stats.defense + 2);
    stats.mass = Math.round(stats.mass * 1.85);
    stats.speed = Math.round(stats.speed * 0.94);
    stats.reach = Math.round(stats.reach * 1.1);
  }
  return stats;
}
