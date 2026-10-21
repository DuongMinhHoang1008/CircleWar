import { Assets, Rectangle, Texture } from "pixi.js";
import spec from "./combat-fx.json";
import characterSpec from "./character-fx.json";

export type CharacterAnimationKind = "skill" | "super" | "projectile";
export type CharacterFxFrames = Record<string, Partial<Record<CharacterAnimationKind, Texture[]>>>;
let characterCache: Promise<CharacterFxFrames> | undefined;
export const characterFxColor = (id?: string) => parseInt(((characterSpec.palettes as Record<string, string>)[id || ""] || "#b8ecff").slice(1), 16);

export function loadCharacterFx(): Promise<CharacterFxFrames> {
  return characterCache ??= Assets.load<Texture>(`${import.meta.env.BASE_URL}effects/character-fx.svg`).then(atlas => {
    const result: CharacterFxFrames = {};
    for (const [key, row] of Object.entries(characterSpec.rows)) {
      const [id, kind] = key.split(":") as [string, CharacterAnimationKind];
      (result[id] ??= {})[kind] = Array.from({ length: characterSpec.frames }, (_, frame) => new Texture({
        source: atlas.source,
        frame: new Rectangle(frame * characterSpec.size, row * characterSpec.size, characterSpec.size, characterSpec.size),
      }));
    }
    return result;
  }).catch(error => { characterCache = undefined; throw error; });
}

export type CombatFxKind = keyof typeof spec.rows;
export type CombatFxFrames = Record<CombatFxKind, Texture[]>;
export const isCombatFx = (kind: string): kind is CombatFxKind =>
  kind in spec.rows;

let cached: Promise<CombatFxFrames> | undefined;
export function loadCombatFx(): Promise<CombatFxFrames> {
  return (cached ??= createFrames().catch((error) => {
    cached = undefined;
    throw error;
  }));
}

async function createFrames(): Promise<CombatFxFrames> {
  const atlas = await Assets.load<Texture>(
    `${import.meta.env.BASE_URL}effects/combat-fx.svg`,
  );
  const result = {} as CombatFxFrames;
  for (const kind of Object.keys(spec.rows) as CombatFxKind[]) {
    result[kind] = Array.from(
      { length: spec.frames },
      (_, frame) =>
        new Texture({
          source: atlas.source,
          frame: new Rectangle(
            frame * spec.size,
            spec.rows[kind] * spec.size,
            spec.size,
            spec.size,
          ),
        }),
    );
  }
  return result;
}
