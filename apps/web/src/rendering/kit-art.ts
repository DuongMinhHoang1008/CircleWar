import { Assets, Rectangle, Texture } from "pixi.js";
import manifest from "./kit-art.json";
import type { CombatFxFrames } from "./combat-fx";

export const WEAPON_KEYS = [
  ...Array.from(
    { length: 33 },
    (_, i) => `char_${String(i + 1).padStart(2, "0")}`,
  ),
  "fu_di",
  "wacom",
  "skyrocket",
];
const OBJECT_KEYS = [
  "fruit",
  "basket",
  "bullet",
  "ribbon",
  "deadline",
  "buffFruit",
  "ink",
  "envelope",
  "rose",
  "air",
  "randomInk",
  "wacom",
  "balloon",
  "rocket",
  "slipper",
  "chicken",
  "shield",
  "shrapnel",
  "roseField",
  "fruitField",
];
const CONSTRUCT_KEYS = [
  "turret",
  "minion",
  "giant",
  "flag",
  "rose",
  "paint",
  "vortex",
  "soup",
];
export type FxFamily =
  "explosion" | "wind" | "slash" | "aura" | "frost" | "ink";
const FX_FAMILIES: FxFamily[] = [
  "explosion",
  "wind",
  "slash",
  "aura",
  "frost",
  "ink",
];

export interface KitArt {
  weapons: Record<string, Texture>;
  objects: Record<string, Texture>;
  constructs: Record<string, Texture>;
  fx: Record<FxFamily, Texture[]>;
  combat: CombatFxFrames;
}
let cached: Promise<KitArt> | undefined;

/** Shared atlas sources and frame textures live across battles; render loops only reuse them. */
export function loadKitArt(): Promise<KitArt> {
  return (cached ??= createKitArt().catch((error) => {
    cached = undefined;
    throw error;
  }));
}
async function createKitArt(): Promise<KitArt> {
  const sheets = await Promise.all(
    [manifest.weapons, manifest.objects, manifest.constructs, manifest.vfx].map(
      async (spec) => {
        const atlas = await Assets.load<Texture>(
          `${import.meta.env.BASE_URL}${spec.file}`,
        );
        return spec.frames.map(
          ([x, y, w, h]) =>
            new Texture({
              source: atlas.source,
              frame: new Rectangle(x, y, w, h),
            }),
        );
      },
    ),
  );
  const index = (keys: string[], frames: Texture[]) =>
    Object.fromEntries(keys.map((key, i) => [key, frames[i]]));
  const fx = Object.fromEntries(
    FX_FAMILIES.map((key, row) => [key, sheets[3].slice(row * 6, row * 6 + 6)]),
  ) as Record<FxFamily, Texture[]>;
  return {
    weapons: index(WEAPON_KEYS, sheets[0]),
    objects: index(OBJECT_KEYS, sheets[1]),
    constructs: index(CONSTRUCT_KEYS, sheets[2]),
    fx,
    combat: {
      impactBurst: fx.slash,
      superBurst: fx.explosion,
      burnLoop: fx.explosion,
      slowLoop: fx.frost,
      passiveBurst: fx.aura,
      healBurst: fx.aura,
      shieldBurst: fx.aura,
      projectile: [sheets[1][2]],
    },
  };
}
export function characterFxFamily(id?: string): FxFamily {
  if (id === "char_31" || id === "char_18" || id === "char_27")
    return "explosion";
  if (id === "char_04" || id === "char_21" || id === "char_26") return "wind";
  if (
    id === "char_05" ||
    id === "char_07" ||
    id === "char_16" ||
    id === "char_32"
  )
    return "frost";
  if (
    id === "char_03" ||
    id === "char_06" ||
    id === "char_19" ||
    id === "char_24" ||
    id === "char_29" ||
    id === "char_30"
  )
    return "ink";
  if (
    id === "char_09" ||
    id === "char_11" ||
    id === "char_13" ||
    id === "char_14" ||
    id === "char_20" ||
    id === "char_22" ||
    id === "char_25"
  )
    return "aura";
  return "slash";
}
