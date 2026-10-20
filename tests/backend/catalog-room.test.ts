import { it, expect } from "vitest";
import {
  newRoom,
  applyAction,
  lock,
  settle,
} from "../../packages/shared/src/room";
import {
  actionSchema,
  envelopeSchema,
} from "../../packages/shared/src/protocol";
import { CATALOG_ITEMS } from "../../packages/shared/src/catalog";
function room() {
  let s = newRoom("ABCDEFGH", 8, 0);
  s = applyAction(s, "a", { type: "JOIN", name: "A" }, 1);
  s = applyAction(s, "b", { type: "JOIN", name: "B" }, 2);
  return s;
}
it("keeps one starter, rejects multi-unit lobby picks and invalid bonds", () => {
  let s = room();
  s = applyAction(
    s,
    "a",
    {
      type: "SELECT_CHARACTERS",
      characters: ["char_01"],
    },
    3,
  );
  expect(() =>
    applyAction(s, "b", { type: "TEAM_CHOICE", bond: "T01" }, 5),
  ).toThrow();
  expect(() =>
    applyAction(s, "a", { type: "TEAM_CHOICE", representatives: [0, 0] }, 5),
  ).toThrow();
  expect(
    actionSchema.safeParse({
      type: "SELECT_CHARACTERS",
      characters: ["char_99"],
    }).success,
  ).toBe(false);
  expect(
    envelopeSchema.safeParse({
      protocol: 1,
      round: 0,
      requestId: crypto.randomUUID(),
      action: { type: "READY", ready: true },
    }).success,
  ).toBe(false);
  expect(() =>
    applyAction(
      s,
      "a",
      {
        type: "SELECT_CHARACTERS",
        characters: ["char_01", "char_01", "char_01"],
      },
      6,
    ),
  ).toThrow("Đội hình tối đa 3 nhân vật khác nhau");
  expect(s.players[0].loadouts).toHaveLength(1);
  expect(s.players[0].unitLimit).toBe(3);
});
it("enforces weapon upgrade levels, inventory limits, unique accessories and transaction locks", () => {
  let s = room();
  s.phase = "PREPARATION";
  s.round = 1;
  s.deadline = 10000;
  s.players[0].gold = 100;
  expect(() =>
    applyAction(s, "a", { type: "WEAPON_UPGRADE", target: 0 }, 3),
  ).toThrow();
  s.players[0].loadouts[0].level = 3;
  s = applyAction(s, "a", { type: "WEAPON_UPGRADE", target: 0 }, 4);
  expect(s.players[0].gold).toBe(92);
  expect(s.players[0].loadouts[0].weaponRank).toBe(2);
  expect(() =>
    applyAction(s, "a", { type: "WEAPON_UPGRADE", target: 0 }, 5),
  ).toThrow();
  s.players[0].loadouts[0].level = 6;
  s = applyAction(s, "a", { type: "WEAPON_UPGRADE", target: 0 }, 6);
  expect(s.players[0].gold).toBe(80);
  s.players[0].inventory = ["item_02", "item_02"];
  s = applyAction(s, "a", { type: "EQUIP", target: 0, inventory: 0 }, 7);
  const before = JSON.stringify(s);
  expect(() =>
    applyAction(s, "a", { type: "EQUIP", target: 0, inventory: 0 }, 8),
  ).toThrow();
  expect(JSON.stringify(s)).toBe(before);
  s = applyAction(s, "a", { type: "UNEQUIP", target: 0, equipment: 0 }, 9);
  expect(s.players[0].inventory).toHaveLength(2);
  s = applyAction(s, "a", { type: "READY", ready: true }, 10);
  expect(() =>
    applyAction(s, "a", { type: "EQUIP", target: 0, inventory: 0 }, 11),
  ).toThrow();
});
it("locks character, item and selected bond into the simulation snapshot", () => {
  let s = room();
  s = applyAction(
    s,
    "a",
    {
      type: "SELECT_CHARACTERS",
      characters: ["char_01"],
    },
    3,
  );
  s.players[0].loadouts[0].equipment = ["item_02", "item_03"];
  lock(s, 5);
  expect(s.simulation?.fighters[0].equipment).toEqual(["item_02", "item_03"]);
  s.players[0].loadouts[0].equipment = [];
  expect(s.simulation?.fighters[0].equipment).toHaveLength(2);
  expect(CATALOG_ITEMS.filter((i) => i.slot === "accessory")).toHaveLength(25);
});
