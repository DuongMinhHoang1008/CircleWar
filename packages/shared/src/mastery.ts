import data from "./mastery-data.json";
import upgradeText from "./mastery-upgrade-text.json";
import type { Loadout } from "./balance";
import { MASTERY_PATHS } from "./mastery-paths";
import type { MasteryForm } from "./mastery-forms";
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
  form?: MasteryForm;
  modifiers?: {
    attackPercent?: number;
    hpPercent?: number;
    speedPercent?: number;
    cooldownPercent?: number;
    chargePercent?: number;
  };
}
export const MASTERIES: MasteryDefinition[] = [
  ...data,
  ...MASTERY_PATHS,
].map((m: MasteryDefinition) => ({...m, ...upgradeText[m.id as keyof typeof upgradeText],
  form: m.form && (m.form.kind === 'shot' || m.form.kind === 'melee') ? {...m.form,cooldown:100} : m.form}));
export interface MasterySelection {
  id: string;
  target?: string;
}
const masteryById = new Map(MASTERIES.map((m) => [m.id, m]));
export const masteryInfo = (id?: string) => id ? masteryById.get(id) : undefined;
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
