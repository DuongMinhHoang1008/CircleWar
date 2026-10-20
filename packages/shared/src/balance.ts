import { CATALOG_ITEMS, character, ROSTER, type CharacterId } from "./catalog";
import { cardRarityMultiplier } from "./progression";
import { CHARACTER_BALANCE, ITEM_EFFECT_TEXT } from "./combat-balance";
export const BENCH_CAPACITY = 5;
export const ITEM_BAG_CAPACITY = 8;
export const SHOP_SIZE = 5;
export const MAX_FIELD_UNITS = 3;
export function capacityUpgradePrice(unitLimit: number) {
  return unitLimit === 1 ? 5 : unitLimit === 2 ? 10 : Infinity;
}
export function characterPrice(id: string) {
  const tier = Number(ROSTER.find((c) => c.id === id)?.tier.slice(1) || 1);
  return tier <= 1 ? 3 : tier === 2 ? 4 : tier === 3 ? 5 : 6;
}
export const CLASSES = [
  "swordsman",
  "guardian",
  "assassin",
  "frost",
  "ranger",
  "berserker",
] as const;
export type ClassId = (typeof CLASSES)[number];
export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  mass: number;
  rotation: number;
  reach: number;
  crit: number;
  critPower: number;
  charge: number;
  shield: number;
  thorns: number;
  burn: number;
  bounce: number;
  stability: number;
  superPower: number;
  cooldown: number;
}
const base: Stats = {
  hp: 220,
  attack: 18,
  defense: 4,
  speed: 460,
  mass: 100,
  rotation: 1,
  reach: 4300,
  crit: 8,
  critPower: 160,
  charge: 100,
  shield: 0,
  thorns: 0,
  burn: 0,
  bounce: 100,
  stability: 100,
  superPower: 100,
  cooldown: 24,
};
export const CHARACTERS: Record<
  ClassId,
  {
    name: string;
    short: string;
    color: number;
    description: string;
    super: string;
    stats: Stats;
  }
> = {
  swordsman: {
    name: "Kiếm Sĩ",
    short: "KS",
    color: 0x5de1ff,
    description: "Mỗi đòn thứ tư cường hóa. Kiếm cân bằng.",
    super: "Kiếm Phong Bạo · 4 giây",
    stats: { ...base },
  },
  guardian: {
    name: "Hộ Vệ",
    short: "HV",
    color: 0xf2c66d,
    description: "Máu, khối lượng và giáp cao.",
    super: "Địa Chấn · sát thương và đẩy lùi",
    stats: { ...base, hp: 340, defense: 12, speed: 330, mass: 190, attack: 16 },
  },
  assassin: {
    name: "Sát Thủ",
    short: "ST",
    color: 0xb99bff,
    description: "Hai dao, di chuyển nhanh, chí mạng mạnh.",
    super: "Ảnh Sát · tăng tốc và chí mạng",
    stats: {
      ...base,
      hp: 160,
      speed: 600,
      crit: 24,
      critPower: 220,
      attack: 14,
      reach: 3600,
    },
  },
  frost: {
    name: "Băng Pháp Sư",
    short: "BP",
    color: 0x7cf1d0,
    description: "Đánh trúng gây chậm trong 1 giây.",
    super: "Bão Tuyết · vùng băng 4 giây",
    stats: { ...base, hp: 190, attack: 15, reach: 5100 },
  },
  ranger: {
    name: "Xạ Thủ",
    short: "XT",
    color: 0xff9c75,
    description: "Đạn tầm xa, 25% xuyên mục tiêu.",
    super: "Mưa Đạn · tám hướng",
    stats: { ...base, hp: 170, attack: 13, cooldown: 20 },
  },
  berserker: {
    name: "Cuồng Chiến",
    short: "CC",
    color: 0xff668c,
    description: "Hai rìu, tăng sức mạnh khi mất máu.",
    super: "Cuồng Nộ · sát thương và hút máu",
    stats: { ...base, hp: 240, attack: 20, speed: 420, reach: 3900 },
  },
};
export type Slot = "weapon" | "accessory";
export interface Item {
  id: string;
  name: string;
  rarity: number;
  price: number;
  slot: Slot;
  modifiers: Partial<Stats>;
}
const item = (
  id: string,
  name: string,
  rarity: number,
  modifiers: Partial<Stats>,
  slot: Slot = "accessory",
): Item => ({
  id,
  name,
  rarity,
  price: [5, 10, 16, 24][rarity],
  slot,
  modifiers,
});
export const ITEMS: Item[] = [
  ...(CATALOG_ITEMS as Item[]),
  item("blade", "Kiếm sắc", 0, { attack: 6 }, "weapon"),
  item("gloves", "Găng tốc độ", 1, { rotation: 1 }),
  item("ring", "Nhẫn chí mạng", 1, { crit: 12 }),
  item("fire", "Đá lửa", 2, { burn: 2 }),
  item("longblade", "Lưỡi kiếm dài", 1, { reach: 1200 }, "weapon"),
  item("armor", "Giáp thép", 0, { defense: 6 }),
  item("shield", "Khiên năng lượng", 1, { shield: 65 }),
  item("heart", "Tim sinh lực", 0, { hp: 55 }),
  item("thorns", "Giáp gai", 2, { thorns: 3 }),
  item("boots", "Giày tốc độ", 0, { speed: 100 }),
  item("stone", "Hòn đá nặng", 0, { mass: 65 }),
  item("spring", "Lò xo", 1, { bounce: 15 }),
  item("stability", "Bùa ổn định", 1, { stability: 60 }),
  item("crystal", "Tinh thể Super", 1, { charge: 30 }),
  item("charm", "Bùa tăng cường", 2, { superPower: 35 }),
  item("clock", "Đồng hồ ma thuật", 2, { cooldown: -6 }),
  item("soul", "Linh hồn chiến đấu", 3, { charge: 65, hp: 40 }),
  item("potion", "Thuốc sinh lực", 0, { hp: 80 }),
];
ITEMS.find((i) => i.id === "potion")!.price = 4;
export interface Loadout {
  classId: ClassId;
  characterId?: CharacterId;
  weaponRank?: number;
  level: number;
  equipment: string[];
  equipmentLevels?: Record<string, number>;
}
export function itemMultiplier(id: string, level = 1, matched = false) {
  const it = CATALOG_ITEMS.find((it) => it.id === id);
  return (
    (it ? cardRarityMultiplier(it.rarity, level) : 1) * (matched ? 1.08 : 1)
  );
}
export function itemModifiers(
  id: string,
  level = 1,
  matched = false,
): Partial<Stats> {
  const it = ITEMS.find((it) => it.id === id);
  const result: Partial<Stats> = {};
  const multiplier = itemMultiplier(id, level, matched);
  for (const key of Object.keys(it?.modifiers || {}) as (keyof Stats)[]) {
    const value = it!.modifiers[key] || 0;
    // Small negative cooldown bonuses cannot silently round back to zero.
    result[key] =
      value < 0
        ? -Math.max(1, Math.round(-value * multiplier))
        : Math.round(value * multiplier);
  }
  return result;
}
export function itemEffectDescription(id: string, level = 1, matched = false) {
  return (ITEM_EFFECT_TEXT[id] || "Chỉ số cộng trực tiếp.").replace(
    /\{(\d+)\}/g,
    (_, value: string) =>
      String(
        Math.max(
          1,
          Math.round(Number(value) * itemMultiplier(id, level, matched)),
        ),
      ),
  );
}
export function computeStats(loadout: Loadout): Stats {
  const s = { ...CHARACTERS[loadout.classId].stats };
  const c = character(loadout.characterId);
  if (c) {
    Object.assign(s, CHARACTER_BALANCE[c.id].stats);
    const rarityMultiplier = cardRarityMultiplier(c.tier, loadout.level);
    for (const key of ["hp", "attack"] as const)
      s[key] = Math.round(s[key] * rarityMultiplier);
  }
  if ((loadout.weaponRank || 1) >= 2) s.attack += 2;
  if ((loadout.weaponRank || 1) >= 3) {
    s.attack += 2;
    s.superPower += 10;
  }
  for (const id of loadout.equipment) {
    const it = ITEMS.find((i) => i.id === id);
    if (it) {
      const modifiers = itemModifiers(
        id,
        loadout.equipmentLevels?.[id] || 1,
        !!c && CATALOG_ITEMS.find((it) => it.id === id)?.affinity === c.id,
      );
      for (const key of Object.keys(modifiers) as (keyof Stats)[])
        s[key] += modifiers[key] || 0;
    }
  }
  s.hp = Math.min(1600, s.hp);
  s.attack = Math.min(150, s.attack);
  s.defense = Math.min(60, s.defense);
  s.speed = Math.max(150, Math.min(900, s.speed));
  s.mass = Math.min(500, s.mass);
  s.crit = Math.min(65, s.crit);
  s.reach = Math.min(7000, s.reach);
  s.rotation = Math.min(4, s.rotation);
  s.cooldown = Math.max(8, s.cooldown);
  return s;
}
export function calculateRoundRewards(rank: number, count: number) {
  const relative = count <= 1 ? 0 : (rank - 1) / (count - 1);
  return relative <= 0.11
    ? { gold: 12, hpLost: 0 }
    : relative <= 0.27
      ? { gold: 10, hpLost: 2 }
      : relative <= 0.48
        ? { gold: 8, hpLost: 4 }
        : relative <= 0.74
          ? { gold: 7, hpLost: 7 }
          : { gold: 6, hpLost: 10 };
}
