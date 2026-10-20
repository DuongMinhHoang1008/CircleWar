import { Assets, Rectangle, Texture } from "pixi.js";
import spec from "./combat-fx.json";

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
