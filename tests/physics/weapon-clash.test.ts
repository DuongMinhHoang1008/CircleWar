import { describe, expect, it } from "vitest";
import { createBattle } from "../../packages/battle-engine/src/index";
import {
  isClashProtected,
  resolveWeaponClashes,
  reverseWeaponSpin,
  rotateWeaponAngle,
} from "../../packages/battle-engine/src/weapon-clash";
import { characterDamage } from "../../packages/battle-engine/src/character-combat";
import { character, type CharacterId } from "../../packages/shared/src/catalog";
import type { Loadout } from "../../packages/shared/src/balance";

describe("weapon clashes", () => {
  it("reverses spin permanently and blocks damage only on the clash tick", () => {
    const loadout = (id: string): Loadout => ({
        characterId: id as CharacterId,
        classId: character(id)!.base as Loadout["classId"],
        level: 0,
        weaponRank: 1,
        equipment: [],
      }),
      state = createBattle(
        {
          width: 120000,
          height: 72000,
          shrinkSeconds: 60,
          teams: [
            { id: "a", loadouts: [loadout("char_01")] },
            { id: "b", loadouts: [loadout("char_12")] },
          ],
        },
        21,
      ),
      [a, b] = state.fighters,
      hp = [a.hp, b.hp],
      facing = [a.facing, b.facing];

    Object.assign(a, { x: 60000, y: 36000, angle: 0 });
    Object.assign(b, { x: 67000, y: 36000, angle: 16 });
    resolveWeaponClashes(state);
    resolveWeaponClashes(state);

    expect(state.events.filter((event) => event.type === "clash")).toHaveLength(
      1,
    );
    expect(a.angle).toBe(16);
    expect(b.angle).toBe(0);
    expect([a.facing, b.facing]).toEqual(facing.map((direction) => -direction));
    expect([a.memory.spinDirection, b.memory.spinDirection]).toEqual([-1, -1]);
    expect([a.hp, b.hp]).toEqual(hp);

    const postClashAngles = [a.angle, b.angle];
    rotateWeaponAngle(a);
    rotateWeaponAngle(b);
    expect(a.angle).toBe((postClashAngles[0] - a.stats.rotation + 32) % 32);
    expect(b.angle).toBe((postClashAngles[1] - b.stats.rotation + 32) % 32);
    expect(isClashProtected(a, state.tick)).toBe(true);
    expect(isClashProtected(b, state.tick)).toBe(true);
    expect(characterDamage(state, a, b, 100)).toBe(0);
    expect(characterDamage(state, b, a, 100)).toBe(0);
    expect([a.hp, b.hp]).toEqual(hp);

    state.tick++;
    expect(isClashProtected(a, state.tick)).toBe(false);
    const reversedAngle = a.angle;
    rotateWeaponAngle(a);
    expect(a.angle).toBe((reversedAngle - a.stats.rotation + 32) % 32);
    expect(characterDamage(state, a, b, 100)).toBeGreaterThan(0);

    reverseWeaponSpin(a, state.tick);
    const hitReversedAngle = a.angle;
    rotateWeaponAngle(a);
    expect(a.angle).toBe((hitReversedAngle + a.stats.rotation) % 32);
  });
});
