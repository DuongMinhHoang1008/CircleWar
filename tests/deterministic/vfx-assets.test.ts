import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ROSTER } from "../../packages/shared/src/catalog";
import spec from "../../apps/web/src/rendering/character-fx.json";

describe("character VFX atlas", () => {
  const rows = spec.rows as Record<string, number>;
  const atlas = readFileSync("apps/web/public/effects/character-fx.svg", "utf8");
  const cells = [...atlas.matchAll(/<svg x="(\d+)" y="(\d+)" width="128" height="128" viewBox="0 0 128 128">([\s\S]*?)<\/svg>/g)];
  it("covers every ranged character with a unique nonempty projectile silhouette", () => {
    const silhouettes = new Set<string>();
    for (const c of ROSTER.filter(c => c.base === "ranger" || c.base === "frost")) {
      expect(rows[`${c.id}:projectile`], c.id).toBeTypeOf("number");
      const cell = cells.find(cell => Number(cell[1]) === 0 && Number(cell[2]) === rows[`${c.id}:projectile`] * spec.size)!;
      expect(cell, c.id).toBeDefined();
      expect(cell[3]).toMatch(/path|circle|rect/);
      silhouettes.add(cell[3]);
    }
    expect(silhouettes.size).toBe(ROSTER.filter(c => c.base === "ranger" || c.base === "frost").length);
  });
  it("has complete animated skill and super rows for all five new characters", () => {
    for (const id of ["char_26", "char_27", "char_28", "char_29", "char_30"]) for (const kind of ["skill", "super"]) {
      const frames = cells.filter(cell => Number(cell[2]) === rows[`${id}:${kind}`] * spec.size);
      expect(frames, `${id}:${kind}`).toHaveLength(8);
      expect(new Set(frames.map(frame => frame[3])).size).toBeGreaterThan(1);
    }
    expect(spec.size * Object.keys(rows).length).toBeLessThanOrEqual(4096);
  });
});
