import { it, expect, vi } from "vitest";
import { freshBattleSeed } from "../../apps/web/src/battleSeed";

it("gives each new attempt a nonzero seed even on collisions and uint32 wraparound", () => {
  const values = [17, 17, 0, 0xffff_ffff, 0xffff_ffff];
  vi.stubGlobal("crypto", {
    getRandomValues(array: Uint32Array) {
      array[0] = values.shift()!;
      return array;
    },
  });
  try {
    expect(Array.from({ length: 5 }, () => freshBattleSeed())).toEqual([
      17, 18, 19, 0xffff_ffff, 1,
    ]);
  } finally {
    vi.unstubAllGlobals();
  }
});
