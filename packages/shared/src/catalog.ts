import data from "./catalog-data.json";
import { synergySignature, SYNERGY_RULE, canResonate } from "./synergy";
import { cardRarityMultiplier } from "./progression";
import { affinityDescription } from "./affinity";
import { LEGENDARY_IDENTITIES } from "./character-abilities";
import { CHARACTER_KITS, kitGrowthDescription } from "./character-kits";
import {
  CHARACTER_BALANCE,
  ITEM_BALANCE,
  ITEM_EFFECT_TEXT,
} from "./combat-balance";
export const CHARACTER_IDS = [
  "char_01",
  "char_02",
  "char_03",
  "char_04",
  "char_05",
  "char_06",
  "char_07",
  "char_08",
  "char_09",
  "char_10",
  "char_11",
  "char_12",
  "char_13",
  "char_14",
  "char_15",
  "char_16",
  "char_17",
  "char_18",
  "char_19",
  "char_20",
  "char_21",
  "char_22",
  "char_23",
  "char_24",
  "char_25",
  "char_26",
  "char_27",
  "char_28",
  "char_29",
  "char_30",
  "char_31",
  "char_32",
  "char_33",
] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];
export const ROSTER = data.characters.map((c) => {
  const profile = CHARACTER_BALANCE[c.id];
  const kit = CHARACTER_KITS[c.id];
  const { hp, attack, defense, speed } = profile.stats;
  return {
    ...c,
    ...LEGENDARY_IDENTITIES[c.id],
    role: kit.ranged ? "Kit riêng / tầm xa theo hướng xoay" : "Kit riêng / cận chiến bi-a",
    weapon: kit.normal,
    weakness: c.id === "char_23" ? "Bỏ qua va chạm không bỏ qua giáp/khiên; vẫn bị bắn hoặc đánh vào thân." : c.id === "char_31" || c.id === "char_30" || c.id === "char_29" ? "Có rủi ro gây sát thương chủ/đồng đội; cần giữ vị trí và dùng dạng tiến hóa để giảm rủi ro nếu có." : kit.ranged ? "Giữ khoảng cách, ép góc hoặc chặn đường đạn; Cận Thị làm giảm tầm bắn." : "Thả diều, khống chế và chọn thời điểm Super; khiên/đệ có thể bị phá.",
    stats: [hp!, attack!, defense!, speed!],
    passive: [
      kit.name,
      kit.normal,
    ],
    skill: ["Tăng trưởng combat", kitGrowthDescription(kit)],
    super: [c.super[0], kit.super],
    upgrade: "Tiến hóa ở cấp 3, 7 và 10, tối đa GOD. HP/ATK nền giữ thêm ngân sách theo rarity gốc; level giữa các mốc tăng nhẹ trong cùng bậc.",
  };
});
export const BONDS = data.bonds.map(b => ({ ...b, description: `${b.description} Cộng hưởng ${synergySignature(b.id).name}: ${synergySignature(b.id).text}` }));
export interface FriendGroup {
  id: string;
  name: string;
  members: string[];
  required?: string[];
  requiredAny?: string[];
  threeRequiresGroups?: string[];
  two: string;
  three: string;
  limit: string;
}
export const FRIEND_GROUPS: FriendGroup[] = data.groups.map(g => canResonate(g.id) ? ({ ...g, two: `${g.two} Cộng hưởng ${synergySignature(g.id).name}: ${synergySignature(g.id).text}`, three: `${g.three} Cộng hưởng mốc 3: ${synergySignature(g.id).text}`, limit: SYNERGY_RULE }) : g);
export function groupEligible(group: FriendGroup, ids: (string | undefined)[]) {
  const unique = new Set(ids);
  return (
    group.members.filter((id) => unique.has(id)).length >= 2 &&
    (group.required || []).every((id) => unique.has(id)) &&
    (!group.requiredAny || group.requiredAny.some((id) => unique.has(id)))
  );
}
export function groupTier(
  group: FriendGroup,
  ids: (string | undefined)[],
): 0 | 2 | 3 {
  if (!groupEligible(group, ids)) return 0;
  const unique = new Set(ids);
  const three =
    group.members.filter((id) => unique.has(id)).length >= 3 &&
    (group.threeRequiresGroups || []).every((groupId) =>
      FRIEND_GROUPS.find((g) => g.id === groupId)?.members.some((id) =>
        unique.has(id),
      ),
    );
  return three ? 3 : 2;
}
export const CATALOG_ITEMS = data.items.map((it) => ({
  ...it,
  modifiers: ITEM_BALANCE[it.id],
  description: ITEM_EFFECT_TEXT[it.id].replace(/\{(\d+)\}/g,
    (_, value: string) => String(Math.round(Number(value) * cardRarityMultiplier(it.rarity, 1)))),
  affinityDescription: affinityDescription(it.id, cardRarityMultiplier(it.rarity, 1) * 1.12),
}));
export const TRANSFORMED_FORMS: Record<string, { itemId: string; name: string }> = {
  char_28: { itemId: "item_28", name: "Người Máy Đỉnh Cao Fu Di" },
  char_29: { itemId: "item_29", name: "Siêu Chiến Binh Wacom" },
  char_30: { itemId: "item_30", name: "Skyrocket Dog" },
};
export function isTransformedCharacter(id?: string, equipment: string[] = []) {
  const form = id ? TRANSFORMED_FORMS[id] : undefined;
  return !!form && equipment.includes(form.itemId);
}
export const character = (id?: string) => ROSTER.find((c) => c.id === id);
export const itemInfo = (id: string) => CATALOG_ITEMS.find((i) => i.id === id);
export interface TeamChoice {
  trait?: string;
  bond?: string;
  group?: string;
  representatives?: number[];
}
export const TRAITS = [
  "Hộ vệ",
  "Đấu sĩ",
  "Kiểm soát",
  "Hỗ trợ",
  "Người Phố Hội",
  "Thú Nhân",
  "Linh Vật",
  "Thực Linh",
  "Vật Linh",
];
export const TRAIT_TEXT: Record<string, string> = {
  "Hộ vệ": "2/3 Hộ vệ: +1%/+2% giảm sát thương cho các Hộ vệ.",
  "Đấu sĩ": "2/3 Đấu sĩ: +4%/+6% ATK.",
  "Kiểm soát": "2/3 Kiểm soát: +5/+8 sức mạnh Super.",
  "Hỗ trợ": "2/3 Hỗ trợ: 10/16 khiên đầu round trong 5 giây.",
  "Người Phố Hội": "2/3 Người Phố Hội: +4%/+6% tốc độ.",
  "Thú Nhân": "2/3 Thú Nhân: +3/+5 điểm chí mạng.",
  "Linh Vật": "Hiện có một Linh Vật, chưa mở mốc 2 nhân vật khác nhau.",
  "Thực Linh": "2 Thực Linh: +20 HP đầu round.",
  "Vật Linh": "2 Vật Linh: +20 khối lượng.",
};
export function representatives(
  loadouts: { characterId?: string }[],
  choice?: TeamChoice,
) {
  const seen = new Set<string>();
  const order = [
    ...(choice?.representatives || []),
    ...loadouts.map((_, i) => i),
  ];
  return order.filter((i, pos) => {
    const id = loadouts[i]?.characterId;
    if (!id || seen.has(id) || order.indexOf(i) !== pos) return false;
    seen.add(id);
    return true;
  });
}
export function availableTraits(
  loadouts: { characterId?: string }[],
  choice?: TeamChoice,
) {
  const chars = representatives(loadouts, choice).map((i) =>
    character(loadouts[i].characterId)!,
  );
  return TRAITS.filter(
    (t) => chars.filter((c) => c.roleClass === t || c.race === t).length >= 2,
  );
}
export function availableBonds(loadouts: { characterId?: string }[]) {
  const ids = new Set(loadouts.map((l) => l.characterId));
  return BONDS.filter((b) => b.members.every((id) => ids.has(id)));
}
export function availableGroups(loadouts: { characterId?: string }[]) {
  return FRIEND_GROUPS.filter((g) =>
    groupEligible(
      g,
      loadouts.map((l) => l.characterId),
    ),
  );
}
export function validChoice(
  loadouts: { characterId?: string }[],
  choice: TeamChoice,
) {
  return (
    (!choice.trait ||
      availableTraits(loadouts, choice).includes(choice.trait)) &&
    (!choice.bond ||
      availableBonds(loadouts).some((b) => b.id === choice.bond)) &&
    (!choice.group ||
      availableGroups(loadouts).some((g) => g.id === choice.group)) &&
    (!choice.representatives ||
      choice.representatives.every(
        (i, n, a) =>
          Number.isInteger(i) &&
          i >= 0 &&
          i < loadouts.length &&
          a.indexOf(i) === n,
      ))
  );
}
