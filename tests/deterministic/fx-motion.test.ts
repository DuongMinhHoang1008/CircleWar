import { describe, expect, it } from "vitest";
import {
  effectFrame,
  effectMotion,
  effectStyle,
  interpolateAngle,
  createWeaponHeading,
  updateWeaponHeading,
} from "../../apps/web/src/rendering/fx-motion";

describe("combat effect presentation", () => {
  it("enters and leaves without a pop, including after the final battle tick", () => {
    for (const kind of [
      "impactBurst",
      "characterSuper",
      "healBurst",
      "shatter",
      "characterSkill",
    ]) {
      expect(effectMotion(kind, 0).alpha).toBe(0);
      expect(effectMotion(kind, 0.12).alpha).toBeGreaterThan(0.4);
      expect(effectMotion(kind, 1).alpha).toBe(0);
      expect(effectMotion(kind, 2).alpha).toBe(0);
      expect(effectMotion(kind, 0.99).alpha).toBeLessThan(0.01);
    }
    expect(effectStyle("impactBurst").life).toBeLessThan(
      effectStyle("characterSuper").life,
    );
  });

  it("crossfades across atlas frame boundaries without restarting", () => {
    const sample = effectFrame(0.3, 6);
    expect(sample).toEqual({ frame: 1, next: 2, mix: 0.5 });
    expect(effectFrame(0.4 - 0.00001, 6).mix).toBeCloseTo(1);
    expect(effectFrame(0.4 + 0.00001, 6).mix).toBeCloseTo(0);
    expect(effectFrame(1, 6)).toEqual({ frame: 5, next: 5, mix: 0 });
    expect(effectFrame(0.5, 1)).toEqual({ frame: 0, next: 0, mix: 0 });
  });

  it("moves on fractional ticks and settles as the effect dissipates", () => {
    const a = effectMotion("healBurst", 0.3),
      b = effectMotion("healBurst", 0.31);
    expect(b.rise).toBeGreaterThan(a.rise);
    expect(b.rise - a.rise).toBeLessThan(1);
    const firstGrowth =
      effectMotion("characterSuper", 0.2).scale -
      effectMotion("characterSuper", 0.1).scale;
    const lastGrowth =
      effectMotion("characterSuper", 0.9).scale -
      effectMotion("characterSuper", 0.8).scale;
    expect(lastGrowth).toBeLessThan(firstGrowth / 5);
  });

  it("interpolates weapon heading through zero using the shortest turn", () => {
    expect(interpolateAngle(31, 1, 0.5)).toBe(32);
    expect(interpolateAngle(1, 31, 0.5)).toBe(0);
    expect(interpolateAngle(5, 7, 0.25)).toBe(5.5);
  });

  it("reverses the trail immediately at the contact angle without an easing phase", () => {
    const heading = createWeaponHeading(0);
    updateWeaponHeading(heading, 2, 1);
    expect(heading.velocity).toBe(2);
    updateWeaponHeading(heading, 2, 0, true);
    expect(heading.angle).toBe(2);
    expect(heading.velocity).toBe(-2);
    updateWeaponHeading(heading, 1.5, 0.25);
    expect(heading.angle).toBe(1.5);
    expect(heading.velocity).toBe(-2);
    updateWeaponHeading(heading, 1.5, 0, true);
    expect(heading.velocity).toBe(2);
    updateWeaponHeading(heading, 2, 0.25);
    expect(heading.angle).toBe(2);
  });

  it("tracks the exact angle across frame rates, wraparound and tab suspension", () => {
    for (const delta of [0.25, 0.5, 1, 10]) {
      const heading = createWeaponHeading(31);
      updateWeaponHeading(heading, 1, delta);
      expect(heading.angle).toBe(33);
      updateWeaponHeading(heading, 0.5, delta, true);
      expect(heading.angle).toBe(32.5);
      updateWeaponHeading(heading, 31, delta);
      expect(heading.angle).toBe(31);
    }
  });
});
