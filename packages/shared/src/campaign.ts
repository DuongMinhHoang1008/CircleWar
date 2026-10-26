import { computeStats, type Loadout, type Stats } from "./balance";
import { BONDS, FRIEND_GROUPS, ROSTER, CATALOG_ITEMS, character, groupTier, type CharacterId } from "./catalog";

export const isCampaignBoss = (stage: number) => stage % 5 === 0;
export const isHardCampaignBoss = (stage: number) => stage % 10 === 0;
export const campaignPackReward = (stage: number) => isCampaignBoss(stage) ? 15 : 5;
export const campaignBossPackReward = (stage: number) => !isCampaignBoss(stage) ? 0 : isHardCampaignBoss(stage) ? 3 : 1;

interface CampaignTeam { name: string; ids: CharacterId[]; links: number; fullGroup: boolean }
function createCampaignTeams(): CampaignTeam[] {
  const linked: CampaignTeam[] = [];
  for (let a = 0; a < ROSTER.length; a++) for (let b = a + 1; b < ROSTER.length; b++) for (let c = b + 1; c < ROSTER.length; c++) {
    const ids = [ROSTER[a].id, ROSTER[b].id, ROSTER[c].id] as CharacterId[];
    const bonds = BONDS.filter(bond => bond.members.every(id => ids.includes(id as CharacterId)));
    const groups = FRIEND_GROUPS.filter(group => groupTier(group, ids) > 0);
    if (!bonds.length && !groups.length) continue;
    linked.push({ ids, name: bonds[0]?.name || groups[0].name, links: bonds.length + groups.length, fullGroup: groups.some(group => groupTier(group, ids) === 3) });
  }
  // Build once, then sample evenly to represent all parts of the roster.
  return Array.from({ length: Math.min(729, linked.length) }, (_, i) => linked[Math.floor(i * linked.length / Math.min(729, linked.length))]);
}
export const CAMPAIGN_TEAMS = createCampaignTeams();
const ADVANCED_TEAMS = CAMPAIGN_TEAMS.filter(team => team.links >= 2 || team.fullGroup);

export function campaignEncounter(stage: number, squadSize: number) {
  stage = Math.max(1, Math.trunc(stage));
  const boss = isCampaignBoss(stage);
  const count = boss ? 3 : Math.max(1, Math.min(3, squadSize));
  const normalIndex = stage - 1 - Math.floor((stage - 1) / 5);
  const pool = stage >= 31 && ADVANCED_TEAMS.length ? ADVANCED_TEAMS : CAMPAIGN_TEAMS;
  const strategy = pool[(normalIndex * 137 + Math.floor((stage - 1) / 5) * 17) % pool.length];
  const loadouts: Loadout[] = Array.from({ length: count }, (_, slot) => {
    // Curated compositions repeat deterministically when a stage is retried.
    const id = strategy.ids[slot];
    const baseLevel = Math.min(10, 1 + Math.floor((stage - 1) / 6));
    const level = boss ? slot === 0 ? Math.min(10, baseLevel + 1) : Math.max(1, baseLevel - 1) : baseLevel;
    const gear = stage >= 6 ? (stage + slot) % 3 === 0 ? CATALOG_ITEMS[(stage * 17 + slot * 7) % CATALOG_ITEMS.length].id : CATALOG_ITEMS.find(it => it.affinity === id)?.id : undefined;
    const equipment = gear ? [gear] : [];
    return { characterId: id, classId: character(id)!.base as Loadout["classId"], level, weaponRank: 1, equipment, equipmentLevels: gear ? { [gear]: level } : {} };
  });
  return { stage, boss, hardBoss: isHardCampaignBoss(stage), loadouts, reward: campaignPackReward(stage), bossPacks: campaignBossPackReward(stage), strategy: boss ? "Một chỉ huy cường hóa cùng hai quân hỗ trợ." : `Đội hình phối hợp: ${strategy.name}.`, links: strategy.links, fullGroup: strategy.fullGroup };
}

// Diagnostic only. Normal encounters never use this value to change stats.
export function campaignThreat(stats: Stats) {
  return Math.sqrt((stats.hp / (1 - stats.defense / 100)) * stats.attack * 24 / stats.cooldown);
}
export function campaignStats(loadout: Loadout, stage: number, squadSize: number, slot = 0): Stats {
  const stats = computeStats(loadout);
  if (isCampaignBoss(stage) && slot === 0) {
    const allies = Math.max(1, Math.min(3, squadSize));
    // Escorts already provide bodies; do not multiply commander HP by squad size.
    stats.hp = Math.round(stats.hp * (1.12 + (allies - 1) * 0.05));
    stats.attack = Math.round(stats.attack * 1.08);
    if (isHardCampaignBoss(stage)) {
      stats.hp = Math.round(stats.hp * 1.12);
      stats.attack = Math.round(stats.attack * 1.06);
    }
    stats.defense = Math.min(24, stats.defense + 2);
    stats.mass = Math.round(stats.mass * 1.5);
    stats.speed = Math.round(stats.speed * 0.94);
    stats.reach = Math.round(stats.reach * 1.1);
  }
  return stats;
}
