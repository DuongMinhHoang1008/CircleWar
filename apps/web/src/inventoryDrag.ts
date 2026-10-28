import type { CollectionProfile } from "../../../packages/shared/src/experience";
import { profileLoadouts } from "../../../packages/shared/src/experience";
import {
  character,
  type CharacterId,
} from "../../../packages/shared/src/catalog";
import type { Loadout } from "../../../packages/shared/src/balance";
import { applyOwnedConfig } from "./LoadoutConfig";
export interface InventoryDrag {
  kind: "character" | "item";
  id: string;
}
export const INVENTORY_DRAG_TYPE = "application/x-riseon-card";
export function parseInventoryDrag(raw: string): InventoryDrag {
  const value = JSON.parse(raw) as InventoryDrag;
  if (
    !value ||
    !["character", "item"].includes(value.kind) ||
    typeof value.id !== "string"
  )
    throw Error("Thẻ kéo không hợp lệ.");
  return { kind: value.kind, id: value.id };
}
export function dropInventoryCard<T extends CollectionProfile>(
  profile: T,
  payload: InventoryDrag,
  slot: number,
): T {
  if (
    !Number.isInteger(slot) ||
    slot < 0 ||
    slot > 2 ||
    slot > profile.team.length
  )
    throw Error("Chọn ô đội kế tiếp hoặc một nhân vật đang ra sân.");
  if (payload.kind === "item") {
    if (!profile.itemCards.some((c) => c.itemId === payload.id))
      throw Error("Bạn chưa sở hữu vật phẩm này.");
    const target = profileLoadouts(profile)[slot];
    if (!target) throw Error("Thả vật phẩm lên một nhân vật.");
    return applyOwnedConfig(profile, {
      ...target,
      equipment: [payload.id],
      equipmentLevels: {
        [payload.id]: profile.itemCards.find((c) => c.itemId === payload.id)!
          .level,
      },
    });
  }
  const id = payload.id as CharacterId;
  if (!profile.cards.some((c) => c.characterId === id) || !character(id))
    throw Error("Bạn chưa sở hữu nhân vật này.");
  const source = profile.team.indexOf(id);
  if (source >= 0) {
    if (source === slot) return profile;
    const team = [...profile.team];
    if (slot === team.length) {
      team.splice(source, 1);
      team.push(id);
    } else [team[source], team[slot]] = [team[slot], team[source]];
    return { ...profile, team };
  }
  const selection = profile.experience?.masteries?.[id];
  const unit: Loadout = {
    characterId: id,
    classId: character(id)!.base as Loadout["classId"],
    level: profile.cards.find((c) => c.characterId === id)!.level,
    equipment: [],
    masteryId: selection?.id,
    masteryTarget: selection?.target,
  };
  return applyOwnedConfig(profile, unit, profile.team[slot]);
}
