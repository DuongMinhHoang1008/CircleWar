import { computeStats, type Loadout, type Stats } from "./balance";
import { BONDS, FRIEND_GROUPS, ROSTER, character, groupTier, type CharacterId } from "./catalog";
import { CAMPAIGN_TACTICS, CAMPAIGN_FORMATIONS, campaignCoherence, campaignGear, orderCampaignTeam } from "./campaign-tactics";
export { CAMPAIGN_TACTICS } from "./campaign-tactics";

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
  // Keep the authored triples and complete kit formations, then sample the rest
  // evenly so late roster entries retain their share of the 729 combinations.
  const mandatory = linked.filter(team => CAMPAIGN_FORMATIONS.some(ids => ids.every(id => team.ids.includes(id))) || BONDS.some(bond => bond.members.length === 3 && bond.members.every(id => team.ids.includes(id as CharacterId))));
  const remaining = linked.filter(team => !mandatory.includes(team));
  const count = Math.min(729 - mandatory.length, remaining.length);
  return [...mandatory, ...Array.from({ length: count }, (_, i) => remaining[Math.floor(i * remaining.length / count)])];
}
export const CAMPAIGN_TEAMS = createCampaignTeams();
const TACTICAL_POOLS = CAMPAIGN_TACTICS.map(tactic => {
  const basic = CAMPAIGN_TEAMS.map(team => ({ team, score: campaignCoherence(team.ids, tactic) }))
    .filter(entry => Number.isFinite(entry.score))
    .sort((a, b) => a.score - b.score || a.team.ids.join(",").localeCompare(b.team.ids.join(",")))
    .map(entry => entry.team);
  const members = (team: CampaignTeam) => team.ids.filter(id => [...tactic.core, ...tactic.partners].some(member => member === id)).length;
  const advanced = basic.filter(team => (team.links >= 2 || team.fullGroup) && members(team) >= 2);
  return { basic, advanced, veteran: advanced.filter(team => members(team) === 3) };
});

export function campaignEncounter(stage: number, squadSize: number) {
  stage = Math.max(1, Math.trunc(stage));
  const boss = isCampaignBoss(stage);
  const count = boss ? 3 : Math.max(1, Math.min(3, squadSize));
  const normalIndex = stage - 1 - Math.floor((stage - 1) / 5);
  const tacticIndex = boss ? (Math.floor(stage / 5) * 3 + 1) % CAMPAIGN_TACTICS.length : normalIndex % CAMPAIGN_TACTICS.length;
  const tactic = CAMPAIGN_TACTICS[tacticIndex];
  const pools = TACTICAL_POOLS[tacticIndex];
  const pool = stage >= 61 ? pools.veteran : stage >= 31 ? pools.advanced : pools.basic;
  // Progress from loose examples to the most coordinated portion of each
  // style. At the level cap, raise composition quality instead of inventing stats.
  const mastery = Math.min(1, (stage - 1) / 100);
  const from = Math.floor((pool.length - 1) * mastery * 0.65);
  const to = Math.max(from + 1, Math.ceil(pool.length * (0.6 + mastery * 0.4)));
  const variation = (Math.imul(stage, 1103515245) + tacticIndex * 12345) >>> 0;
  const strategy = pool[from + variation % (to - from)];
  const ids = orderCampaignTeam(strategy.ids, tactic, count, variation);
  const gearSlots = stage < 6 ? 0 : stage < 11 ? 1 : stage < 21 ? 2 : 3;
  const usedGear = new Set<string>();
  const loadouts: Loadout[] = Array.from({ length: count }, (_, slot) => {
    // Curated compositions repeat deterministically when a stage is retried.
    const id = ids[slot];
    const baseLevel = Math.min(10, 1 + Math.floor((stage - 1) / 6));
    const level = boss ? slot === 0 ? Math.min(10, baseLevel + 1) : Math.max(1, baseLevel - 1) : baseLevel;
    const gear = slot < gearSlots ? campaignGear(id, tactic, stage, variation + slot, usedGear) : undefined;
    const equipment = gear ? [gear] : [];
    const itemLevel = stage < 31 ? Math.max(1, level - 1) : level;
    return { characterId: id, classId: character(id)!.base as Loadout["classId"], level, weaponRank: 1, equipment, equipmentLevels: gear ? { [gear]: itemLevel } : {} };
  });
  const bonds = BONDS.filter(bond => bond.members.every(id => ids.includes(id as CharacterId)));
  const groups = FRIEND_GROUPS.filter(group => groupTier(group, ids) > 0);
  const name = bonds[0]?.name || groups[0]?.name || character(ids[0])!.name;
  return { stage, boss, hardBoss: isHardCampaignBoss(stage), loadouts, reward: campaignPackReward(stage), bossPacks: campaignBossPackReward(stage), strategy: boss ? "Một chỉ huy cường hóa cùng hai quân hỗ trợ." : `Đội hình phối hợp: ${name}.`, links: bonds.length + groups.length, fullGroup: groups.some(group => groupTier(group, ids) === 3), archetype: tactic.id, coherence: campaignCoherence(ids, tactic) };
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
