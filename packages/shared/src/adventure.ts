import { validateMasteryTeam } from "./mastery";
import { ROSTER, CATALOG_ITEMS, character, type CharacterId } from "./catalog";
import { campaignEncounter } from "./campaign";
import type { Loadout } from "./balance";
import type { BattleConfig } from "../../battle-engine/src/types";

export const ADVENTURE_VERSION = "adventure-v1";
export const CONTRACTS = [
  {
    id: "rare",
    name: "Bình dân chinh phục",
    description:
      "Cả hai đội chỉ dùng nhân vật và đồ có rarity gốc tối đa Hiếm.",
  },
  {
    id: "unbonded",
    name: "Tự lực",
    description: "Cả hai đội không dùng vật phẩm hợp cạ.",
  },
  {
    id: "recovery",
    name: "Hồi phục giới hạn",
    description: "Mọi lượng hồi HP của hai phía còn 70%; khiên giữ nguyên.",
  },
] as const;
export type Contract = (typeof CONTRACTS)[number]["id"];
export const CHAPTERS = [
  {
    name: "Khởi hành",
    description: "Làm quen đội hình, trang bị và liên kết.",
    from: 1,
    to: 10,
  },
  {
    name: "Đọc vị đối thủ",
    description: "Khống chế, sát thương theo thời gian và hỗ trợ.",
    from: 11,
    to: 20,
  },
  {
    name: "Phối hợp quyết định",
    description: "Kết hợp vai trò và vượt những trận boss khó.",
    from: 21,
    to: 30,
  },
];
export function weekId(now = Date.now()) {
  const day = new Date(now);
  day.setUTCHours(0, 0, 0, 0);
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}
export function weekEnds(now = Date.now()) {
  return Date.parse(weekId(now)) + 7 * 86400000;
}
export function stableSeed(text: string) {
  let value = 2166136261;
  for (const c of text) value = Math.imul(value ^ c.charCodeAt(0), 16777619);
  return value >>> 0 || 1;
}
export function normalizeContracts(raw: unknown): Contract[] {
  if (
    !Array.isArray(raw) ||
    raw.length > 3 ||
    raw.some((id) => !CONTRACTS.some((c) => c.id === id)) ||
    new Set(raw).size !== raw.length
  )
    throw Error("Hợp đồng không hợp lệ.");
  return (raw as Contract[]).slice().sort();
}
export function loanUnit(id: CharacterId, item = "", level = 10): Loadout {
  return {
    characterId: id,
    classId: character(id)!.base as Loadout["classId"],
    level,
    weaponRank: 1,
    equipment: item ? [item] : [],
    equipmentLevels: item ? { [item]: level } : {},
  };
}
export function legalLoanTeam(
  raw: unknown,
  contracts: Contract[] = [],
): Loadout[] {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 3)
    throw Error("Chọn 1–3 nhân vật.");
  const ids = new Set<string>(),
    items = new Set<string>();
  const result = raw.map(
    (v: {
      characterId?: string;
      equipment?: string[];
      masteryId?: string;
      masteryTarget?: string;
    }) => {
      const c = character(v?.characterId);
      if (!c || ids.has(c.id)) throw Error("Nhân vật không hợp lệ hoặc trùng.");
      const equipment = v.equipment ?? [];
      if (!Array.isArray(equipment) || equipment.length > 1)
        throw Error("Mỗi nhân vật dùng một vật phẩm.");
      const item = equipment[0],
        info = CATALOG_ITEMS.find((i) => i.id === item);
      if (item && (!info || items.has(item)))
        throw Error("Vật phẩm không hợp lệ hoặc trùng chủ.");
      if (
        contracts.includes("rare") &&
        (c.tier === "T3" || c.tier === "T4" || (info?.rarity ?? 0) > 1)
      )
        throw Error("Hợp đồng chỉ cho rarity gốc tối đa Hiếm.");
      if (contracts.includes("unbonded") && info?.affinity === c.id)
        throw Error("Hợp đồng không cho vật phẩm hợp cạ.");
      ids.add(c.id);
      if (item) items.add(item);
      return {
        ...loanUnit(c.id as CharacterId, item),
        masteryId: v.masteryId,
        masteryTarget: v.masteryTarget,
      };
    },
  );
  validateMasteryTeam(result);
  return result;
}
export function weeklyEnemies(
  week: string,
  index: number,
  contracts: Contract[] = [],
) {
  const encounter = campaignEncounter(
    61 + (stableSeed(week) % 40) + index * 7,
    3,
  );
  const used = new Set<string>();
  return encounter.loadouts.map((unit, slot) => {
    let id = unit.characterId!;
    if (
      contracts.includes("rare") &&
      ["T3", "T4"].includes(character(id)!.tier)
    ) {
      id = ROSTER.filter(
        (c) => !["T3", "T4"].includes(c.tier) && !used.has(c.id),
      )[
        (index * 3 + slot) %
          ROSTER.filter(
            (c) => !["T3", "T4"].includes(c.tier) && !used.has(c.id),
          ).length
      ].id as CharacterId;
    }
    if (used.has(id))
      id = ROSTER.find(
        (c) =>
          !used.has(c.id) &&
          (!contracts.includes("rare") || !["T3", "T4"].includes(c.tier)),
      )!.id as CharacterId;
    used.add(id);
    const item = unit.equipment[0],
      info = CATALOG_ITEMS.find((i) => i.id === item);
    return loanUnit(
      id,
      (contracts.includes("rare") && (info?.rarity ?? 0) > 1) ||
        (contracts.includes("unbonded") && info?.affinity === id)
        ? ""
        : item,
    );
  });
}
export function adventureConfig(
  team: Loadout[],
  enemy: Loadout[],
  contracts: Contract[] = [],
): BattleConfig {
  return {
    width: 72000,
    height: 72000,
    shrinkSeconds: 20,
    recoveryPercent: contracts.includes("recovery") ? 70 : 100,
    teams: [
      { id: "team-player", name: "Đội của bạn", loadouts: team },
      { id: "team-rival", name: "Đối thủ", loadouts: enemy },
    ],
  };
}
export const TUTORIALS = [
  {
    name: "Trang bị hợp cạ",
    text: "Gắn một vật phẩm có nhãn Hợp cạ, rồi thử đội trong trận. Đồ hợp cạ mở hiệu ứng riêng.",
    team: ["char_01", "char_11", "char_15"],
    target: "equip",
  },
  {
    name: "Sức mạnh liên kết",
    text: "Hổ và Sói mở Hội Ngồi Nghĩ Nhiều. Quan sát liên kết đang bật, rồi thử đổi một quân để so sánh.",
    team: ["char_01", "char_08", "char_11"],
    target: "bond",
  },
  {
    name: "Thử một cách khác",
    text: "Đổi ít nhất một quân hoặc vật phẩm so với đội mẫu, rồi đánh thử. Có thể xem chậm và thử lại miễn phí.",
    team: ["char_06", "char_11", "char_22"],
    target: "change",
  },
] as const;
const SPECIAL_MASTERY = [
  {
    id: "char_01",
    title: "Bình tĩnh giữa hỗn loạn",
    text: "Thắng 3 / 8 / 15 trận có Hổ trong đội.",
  },
  {
    id: "char_11",
    title: "Người truyền cảm hứng",
    text: "Tạo khiên cho đồng đội trong 3 / 8 / 15 trận.",
  },
  {
    id: "char_13",
    title: "Tiếp tế không ngừng",
    text: "Hồi HP thực cho đồng đội trong 3 / 8 / 15 trận.",
  },
  {
    id: "char_14",
    title: "Đạo quân quà tặng",
    text: "Thắng 3 / 8 / 15 trận có Hộp Quà trong đội.",
  },
  {
    id: "char_20",
    title: "Hoa nở trong giao tranh",
    text: "Kích hoạt liên kết trong 3 / 8 / 15 trận có Hoàng Tử.",
  },
  {
    id: "char_22",
    title: "Hào quang đồng đội",
    text: "Buff đồng đội trong 3 / 8 / 15 trận.",
  },
] as const;
export const MASTERY = ROSTER.map(c => SPECIAL_MASTERY.find(m => m.id === c.id) || { id: c.id, title: `Dấu ấn ${c.name}`, text: `Thắng 3 / 8 / 15 trận có ${c.name} trong đội.` });
export function draftChoices(seed: number, round: number) {
  const offset = stableSeed(`${seed}:${round}`);
  return [
    ROSTER[offset % ROSTER.length].id,
    ROSTER[(offset + 11) % ROSTER.length].id,
    CATALOG_ITEMS[(offset + 7) % CATALOG_ITEMS.length].id,
  ];
}
