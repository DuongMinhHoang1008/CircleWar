import data from "./mastery-data.json";
import type { Loadout } from "./balance";
import { ROSTER } from "./catalog";
export interface MasteryDefinition {
  id: string;
  characterId: string;
  name: string;
  role: string;
  description: string;
  tradeoff: string;
  summary: string;
  goal: number;
  legacy: boolean;
  targeted: boolean;
  modifiers?: {
    attackPercent?: number;
    hpPercent?: number;
    speedPercent?: number;
    cooldownPercent?: number;
    chargePercent?: number;
  };
}
const existingCharacters = new Set(data.map((m) => m.characterId));
export const MASTERIES: MasteryDefinition[] = [
  ...data,
  ...ROSTER.filter((c) => !existingCharacters.has(c.id)).flatMap((c) => [
    {
      id: `${c.id}:pressure`,
      characterId: c.id,
      name: "Đòn quyết định",
      role: "Chủ lực",
      description: "Tăng 10% sát thương đòn đánh nền trước trận.",
      tradeoff: "Giảm 8% HP tối đa.",
      summary: "Đổi sức bền lấy sát thương",
      goal: 3,
      legacy: false,
      targeted: false,
      modifiers: { attackPercent: 10, hpPercent: -8 },
    },
    {
      id: `${c.id}:resolve`,
      characterId: c.id,
      name: "Thế đứng vững",
      role: "Bền bỉ",
      description: "Tăng 16% HP tối đa trước trận.",
      tradeoff: "Giảm 8% tốc độ di chuyển.",
      summary: "Sống lâu hơn để duy trì vai trò",
      goal: 8,
      legacy: false,
      targeted: false,
      modifiers: { hpPercent: 16, speedPercent: -8 },
    },
    {
      id: `${c.id}:tempo`,
      characterId: c.id,
      name: "Nhịp chiến đấu",
      role: "Nhịp đánh & Super",
      description:
        "Giảm 12% thời gian giữa các đòn thường và tăng 12% chỉ số nạp Super.",
      tradeoff: "Giảm 8% sát thương mỗi đòn.",
      summary: "Đánh đều hơn, nạp Super nhanh hơn",
      goal: 15,
      legacy: false,
      targeted: false,
      modifiers: { cooldownPercent: -12, chargePercent: 12, attackPercent: -8 },
    },
  ]),
];
export interface MasterySelection {
  id: string;
  target?: string;
}
export const masteryInfo = (id?: string) => MASTERIES.find((m) => m.id === id);
export const masteriesFor = (id?: string) =>
  MASTERIES.filter((m) => m.characterId === id);
export const hasMastery = (unit: { masteryId?: string }, id: string) =>
  unit.masteryId === id;
export function masteryUnlocked(
  profile: { experience?: { mastery?: Record<string, number> } },
  characterId: string,
  id: string,
) {
  const entry = masteryInfo(id);
  return (
    !!entry &&
    entry.characterId === characterId &&
    (profile.experience?.mastery?.[characterId] || 0) >= entry.goal
  );
}
export function validateMasteryTeam(
  units: Pick<Loadout, "characterId" | "masteryId" | "masteryTarget">[],
) {
  let legacy = 0;
  for (const unit of units) {
    if (!unit.masteryId) continue;
    const info = masteryInfo(unit.masteryId);
    if (!info || info.characterId !== unit.characterId)
      throw Error("Bí kỹ không thuộc nhân vật này.");
    if (info.legacy && ++legacy > 1)
      throw Error(
        "Mỗi đội chỉ được lắp một Truyền thừa. Tháo Truyền thừa đang dùng trước.",
      );
    if (
      unit.masteryTarget &&
      (!info.targeted ||
        unit.masteryTarget === unit.characterId ||
        !units.some((u) => u.characterId === unit.masteryTarget))
    )
      throw Error("Chọn một đồng đội còn trong đội làm mục tiêu Bí kỹ.");
  }
}
export function validMasterySelections(
  raw: unknown,
): raw is Record<string, MasterySelection> {
  return (
    !!raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    Object.keys(raw).length <= 33 &&
    Object.entries(raw).every(
      ([id, selection]) =>
        selection &&
        typeof selection.id === "string" &&
        masteryInfo(selection.id)?.characterId === id &&
        (selection.target === undefined ||
          (typeof selection.target === "string" &&
            /^char_\d{2}$/.test(selection.target))),
    )
  );
}
