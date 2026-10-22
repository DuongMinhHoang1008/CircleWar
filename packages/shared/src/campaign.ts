import { computeStats, type Loadout, type Stats } from "./balance";
import { CATALOG_ITEMS, character, type CharacterId } from "./catalog";

const BOSSES: CharacterId[] = ["char_03", "char_08", "char_18", "char_27", "char_23", "char_06", "char_15", "char_22", "char_26", "char_25"];
export const isCampaignBoss = (stage: number) => stage % 5 === 0;
export const isHardCampaignBoss = (stage: number) => stage % 10 === 0;
export const campaignPackReward = (stage: number) => isCampaignBoss(stage) ? 15 : 5;
export const campaignBossPackReward = (stage: number) => !isCampaignBoss(stage) ? 0 : isHardCampaignBoss(stage) ? 3 : 1;

// Each team has a plan and an explicit counter. Beyond the level/item cap,
// encounters rotate strategies; no hidden normal-stage power budget grows.
export const CAMPAIGN_TEAMS: { name: string; ids: CharacterId[]; counter: string }[] = [
  { name: "Ôm và húc", ids: ["char_02", "char_10", "char_04"], counter: "Dùng khống chế và đánh xa để cản áp sát." },
  { name: "Vitamin băng giá", ids: ["char_03", "char_13", "char_07"], counter: "Mang Rau má để giải chậm; áp sát nguồn hồi phục." },
  { name: "Phá tuyến giao hàng", ids: ["char_17", "char_06", "char_21"], counter: "Hộ vệ và phản đòn cản sát thủ; tách đội hình khỏi nguồn khiên." },
  { name: "Soi và sửa", ids: ["char_05", "char_16", "char_09"], counter: "Ép góc xạ thủ, chặn đạn và dùng đội hình bền." },
  { name: "Cổ vũ có tổ chức", ids: ["char_01", "char_11", "char_19"], counter: "Tập trung sát thương để vượt lượng hồi phục; đợi khiên hết." },
  { name: "Nồi lẩu phản công", ids: ["char_18", "char_08", "char_15"], counter: "Cấu rỉa từ xa, giữ khoảng cách và né nhịp Super." },
  { name: "Vườn hồng phú quý", ids: ["char_20", "char_24", "char_25"], counter: "Khống chế hỗ trợ, chặn đạn và áp sát xạ thủ." },
  { name: "Aura chốt đơn", ids: ["char_22", "char_23", "char_14"], counter: "Tách hạt nhân Aura khỏi đồng đội trước nhịp Super." },
  { name: "Nhịp phonk lõi đỏ", ids: ["char_26", "char_27", "char_12"], counter: "Dùng hộ vệ chặn nhịp dồn sát thương và khống chế sát thủ." },
  { name: "Tái chế thức tỉnh", ids: ["char_28", "char_29", "char_30"], counter: "Ép Wacom, chặn đạn và né nhịp Super của đội biến hình." },
  { name: "Đại ca giữ phố", ids: ["char_31", "char_32", "char_10"], counter: "Chặn đạn Đại Ca; đánh xa để tránh gậy và phản công." },
  { name: "Bếp trưởng tiếp sức", ids: ["char_33", "char_06", "char_24"], counter: "Dồn sát thương vào hỗ trợ, đừng để trận thành cuộc đua hồi máu." },
];

export function campaignEncounter(stage: number, squadSize: number) {
  const chapter = Math.floor((stage - 1) / 5);
  const boss = isCampaignBoss(stage);
  const count = boss ? 1 : Math.max(1, Math.min(3, squadSize));
  const normalIndex = stage - 1 - Math.floor((stage - 1) / 5);
  const strategy = CAMPAIGN_TEAMS[normalIndex % CAMPAIGN_TEAMS.length];
  const loadouts: Loadout[] = Array.from({ length: count }, (_, slot) => {
    // Curated compositions repeat deterministically when a stage is retried.
    const id = boss ? BOSSES[chapter % BOSSES.length] : strategy.ids[slot];
    const level = Math.min(10, 1 + Math.floor((stage - 1) / 6) + (boss ? 1 : 0));
    const gear = stage >= 6 ? CATALOG_ITEMS.find(it => it.affinity === id)?.id : undefined;
    const equipment = gear ? [gear] : [];
    return { characterId: id, classId: character(id)!.base as Loadout["classId"], level, weaponRank: 1, equipment, equipmentLevels: gear ? { [gear]: level } : {} };
  });
  return { stage, boss, hardBoss: isHardCampaignBoss(stage), loadouts, reward: campaignPackReward(stage), bossPacks: campaignBossPackReward(stage), strategy: boss ? "Boss" : strategy.name, counter: boss ? "Boss có chỉ số cường hóa; chuẩn bị đội hình và trang bị phù hợp." : strategy.counter };
}

// Diagnostic only. Normal encounters never use this value to change stats.
export function campaignThreat(stats: Stats) {
  return Math.sqrt((stats.hp / (1 - stats.defense / 100)) * stats.attack * 24 / stats.cooldown);
}
export function campaignStats(loadout: Loadout, stage: number, squadSize: number): Stats {
  const stats = computeStats(loadout);
  if (isCampaignBoss(stage)) {
    const allies = Math.max(1, Math.min(3, squadSize));
    // One boss replaces the whole enemy squad. HP carries the extra bodies;
    // attack rises modestly so individual hits remain survivable.
    stats.hp = Math.round(stats.hp * allies * (allies === 1 ? 1.2 : 1.12 + (allies - 1) * 0.035));
    stats.attack = Math.round(stats.attack * (1.15 + (allies - 1) * 0.17));
    if (isHardCampaignBoss(stage)) {
      stats.hp = Math.round(stats.hp * 1.15);
      stats.attack = Math.round(stats.attack * 1.08);
    }
    stats.defense = Math.min(24, stats.defense + 2);
    stats.mass = Math.round(stats.mass * 1.85);
    stats.speed = Math.round(stats.speed * 0.94);
    stats.reach = Math.round(stats.reach * 1.1);
  }
  return stats;
}
