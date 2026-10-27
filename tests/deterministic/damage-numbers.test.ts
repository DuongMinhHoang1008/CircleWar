import { describe, expect, it } from "vitest";
import {
  createBattle,
  debugConfig,
  type Construct,
  type BattleState,
} from "../../packages/battle-engine/src/index";
import {
  collectDamageNumbers,
  collectConstructDamageNumbers,
  damageNumberMotion,
  DAMAGE_NUMBER_LIFE,
  DAMAGE_PALETTE,
  collectSupportNumbers,
} from "../../apps/web/src/rendering/damage-numbers";

const fighters = createBattle(debugConfig(2), 7).fighters;
const hit = (
  tick: number,
  amount: number,
  type = "hit",
  target = 1,
): BattleState["events"][number] => ({ tick, amount, type, target, source: 0 });
describe("floating damage", () => {
  it("shows actual healing, temporary shields and long-lived virtual HP as separate gains", () => {
    const events: BattleState["events"] = [
      hit(6, 5, "heal"),
      hit(7, 3, "heal"),
      hit(7, 10, "shield"),
      { ...hit(7, 4, "shield"), shieldKind: "temporaryHp" },
      hit(7, 0, "heal"),
      hit(7, 25),
    ];
    expect(
      collectSupportNumbers(events, fighters, 5, 7).map((n) => [
        n.type,
        n.amount,
      ]),
    ).toEqual([
      ["heal", 8],
      ["shield", 10],
      ["temporaryHp", 4],
    ]);
    expect(
      collectDamageNumbers(events, fighters, 5, 7).map((n) => n.amount),
    ).toEqual([25]);
  });
  it("keeps different damage sources separate and uses a distinct palette", () => {
    const events: BattleState["events"] = [
      hit(6, 12),
      { ...hit(6, 3), damageType: "burn" },
      { ...hit(7, 4), damageType: "burn" },
      { ...hit(7, 2), damageType: "poison" },
    ];
    const numbers = collectDamageNumbers(events, fighters, 5, 7);
    expect(numbers.map((n) => [n.type, n.amount])).toEqual([
      ["direct", 12],
      ["burn", 7],
      ["poison", 2],
    ]);
    expect(
      new Set(Object.values(DAMAGE_PALETTE).map((p) => p.color)).size,
    ).toBe(5);
  });
  it("groups rapid HP loss per target and excludes shields, kills and construct ids", () => {
    const result = collectDamageNumbers(
      [
        hit(6, 12),
        hit(7, 18),
        hit(7, 30, "kill"),
        hit(7, 0),
        hit(7, 999, "kit:construct-hit"),
        hit(7, 5, "heal"),
        hit(7, 4, "hit", 0),
        hit(9, 3),
      ],
      fighters,
      5,
      9,
    );
    expect(result.map((p) => p.amount)).toEqual([30, 4, 3]);
    expect(result[0].x).toBe(fighters[1].x);
    expect(collectDamageNumbers([hit(6, 12)], fighters, 6, 8)).toEqual([]);
  });
  it("ignores old, future and invalid-target events", () => {
    expect(
      collectDamageNumbers(
        [hit(1, 4), hit(101, 5), hit(99, 5, "hit", 999)],
        fighters,
        0,
        100,
      ),
    ).toEqual([]);
  });
  it("uses construct HP deltas, including lethal hits, and excludes expiry", () => {
    const body: Construct = {
      id: 999,
      kind: "turret",
      owner: 1,
      x: 100,
      y: 200,
      vx: 0,
      vy: 0,
      radius: 1100,
      hp: 70,
      maxHp: 100,
      damage: 5,
      until: 100,
      nextAttack: 100,
    };
    const previous = new Map([[999, body]]);
    const events = [hit(7, 999, "kit:construct-hit")];
    expect(
      collectConstructDamageNumbers(
        events,
        [{ ...body, hp: 45 }],
        previous,
        6,
        7,
      )[0].amount,
    ).toBe(25);
    expect(
      collectConstructDamageNumbers(events, [], previous, 6, 7)[0].amount,
    ).toBe(70);
    expect(
      collectConstructDamageNumbers(
        events,
        [],
        new Map([[999, { ...body, until: 7 }]]),
        6,
        7,
      ),
    ).toEqual([]);
  });
  it("pops, drifts up and fades out after the final simulation tick", () => {
    const first = damageNumberMotion(0, -1),
      later = damageNumberMotion(12, -1);
    expect(first.scale).toBeGreaterThan(later.scale);
    expect(later.rise).toBeGreaterThan(first.rise);
    expect(later.x).toBeLessThan(first.x);
    expect(damageNumberMotion(-1, 0).alpha).toBe(0);
    expect(damageNumberMotion(DAMAGE_NUMBER_LIFE, 0).alpha).toBe(0);
  });
});
