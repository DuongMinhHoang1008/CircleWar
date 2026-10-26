import { expect, it } from "vitest";
import {
  applyAction,
  advance,
  lock,
  newRoom,
  prepare,
  settle,
  viewRoom,
  type RoomState,
} from "../../packages/shared/src/room";
import { DEFAULT_SETTINGS } from "../../packages/shared/src/protocol";
import { calculateRoundRewards } from "../../packages/shared/src/balance";
import { captureReplayFrame } from "../../packages/battle-engine/src/index";
function lobby(count = 2) {
  let s = newRoom("ABCDEFGH", 3, 0);
  for (let i = 0; i < count; i++)
    s = applyAction(s, "p" + i, { type: "JOIN", name: "P" + i }, i);
  return s;
}
function ready(s: RoomState) {
  for (const p of s.players)
    s = applyAction(s, p.id, { type: "READY", ready: true }, 100);
  return applyAction(s, s.host, { type: "START" }, 100);
}
it("migrates an existing lobby timer into a wall schedule", () => {
  let s = lobby();
  const legacy = s.settings as unknown as Record<string, unknown>;
  delete legacy.shrinkSeconds;
  legacy.battleSeconds = 20;
  expect(viewRoom(s, s.host).settings.shrinkSeconds).toBe(20);
  s = ready(s);
  expect(s.settings.shrinkSeconds).toBe(20);
  expect(s.settings).not.toHaveProperty("battleSeconds");
  lock(s, 101);
  expect(s.simulation?.config.shrinkSeconds).toBe(20);
});
it("keeps long simulations running with bounded checksums until a real winner", () => {
  let s = ready(lobby());
  lock(s, 101);
  const b = s.simulation!;
  b.tick = 120 * 257 - 1;
  Object.assign(b.fighters[0], { x: 40000, y: 36000, vx: 0, vy: 400 });
  Object.assign(b.fighters[1], { x: 80000, y: 36000, vx: 0, vy: -400 });
  for (const f of b.fighters) f.hp = 10000;
  s.checksums = Array.from({ length: 256 }, (_, i) => ({
    tick: (i + 1) * 120,
    hash: "previous",
  }));
  s = advance(s, s.deadline, 1);
  expect(s.phase).toBe("SIMULATING");
  expect(s.replay).toBeNull();
  expect(s.checksums).toHaveLength(256);
  expect(s.checksums.at(-1)?.tick).toBe(120 * 257);
});
it("cancels an incompatible persisted round without changing collections or rewards", () => {
  const original = ready(lobby());
  original.simulation!.version = "chaos-integer-v24";
  const players = structuredClone(original.players);
  const cancelled = advance(original, original.deadline);
  expect(cancelled.phase).toBe("FINISHED");
  expect(cancelled.simulation).toBeNull();
  expect(cancelled.replay).toBeNull();
  expect(cancelled.results).toEqual([]);
  expect(cancelled.replayFrames).toEqual([]);
  expect(cancelled.deadline).toBe(0);
  expect(cancelled.players).toEqual(players.map((p) => ({ ...p, ready: false })));
  expect(original.simulation?.version).toBe("chaos-integer-v24");
  settle(cancelled, original.deadline + 1);
  expect(cancelled.players).toEqual(players.map((p) => ({ ...p, ready: false })));
  const rematch = applyAction(cancelled, cancelled.host, { type: "REMATCH" }, 200);
  const restarted = ready(rematch);
  expect(restarted.phase).toBe("SIMULATING");
  expect(restarted.simulation?.version).not.toBe("chaos-integer-v24");
});
it("anchors replay playback to the first chunk after the worker drains frames", () => {
  let s = ready(lobby());
  lock(s, 101);
  const simulation = s.simulation!;
  simulation.tick = 90;
  simulation.finished = true;
  s.replayChunks = [
    { index: 0, fromTick: 0, toTick: 87, count: 30, hash: "first", bytes: 1 },
  ];
  s.replayFrames = [captureReplayFrame(simulation)];
  s = advance(s, 102);
  expect(s.replay?.start).toBe(1602);
});
it("enforces one starter per player, host authority and lobby settings lock", () => {
  let s = lobby();
  expect(() =>
    applyAction(
      s,
      "p1",
      { type: "SET_CONFIG", settings: DEFAULT_SETTINGS },
      10,
    ),
  ).toThrow();
  s = applyAction(s, "p0", { type: "SELECT", classes: ["guardian"] }, 10);
  expect(s.players[0].loadouts).toHaveLength(1);
  expect(s.players[0].unitLimit).toBe(1);
  s = applyAction(
    s,
    "p0",
    { type: "SET_CONFIG", settings: { ...DEFAULT_SETTINGS, teamSize: 1 } },
    10,
  );
  expect(s.players.every((p) => p.loadouts.length === 1)).toBe(true);
  s = ready(s);
  expect(() =>
    applyAction(
      s,
      "p0",
      { type: "SET_CONFIG", settings: DEFAULT_SETTINGS },
      110,
    ),
  ).toThrow();
});
it("20-player capacity and deterministic host migration", () => {
  let s = lobby(20);
  expect(() =>
    applyAction(s, "p20", { type: "JOIN", name: "extra" }, 100),
  ).toThrow();
  s = applyAction(s, "p0", { type: "LEAVE" }, 101);
  expect(s.host).toBe("p1");
});
it("buy/equip is atomic on failure and cannot double-spend", () => {
  let s = lobby();
  s.phase = "PREPARATION";
  s.round = 1;
  s.deadline = 1000;
  s.players.forEach((p) => (p.ready = false));
  s.players[0].shop = ["blade", null, null, null];
  s.players[0].gold = 5;
  s = applyAction(s, "p0", { type: "BUY", offer: 0 }, 101);
  expect(s.players[0].gold).toBe(0);
  expect(() => applyAction(s, "p0", { type: "BUY", offer: 0 }, 102)).toThrow();
  const before = JSON.stringify(s);
  expect(() =>
    applyAction(s, "p0", { type: "EQUIP", inventory: 0, target: 9 }, 103),
  ).toThrow();
  expect(JSON.stringify(s)).toBe(before);
  s = applyAction(s, "p0", { type: "EQUIP", inventory: 0, target: 0 }, 104);
  expect(s.players[0].loadouts[0].equipment).toContain("blade");
});
it("locks purchases on ready and deadline", () => {
  let s = lobby();
  s.phase = "PREPARATION";
  s.round = 1;
  s.deadline = 1000;
  s.players.forEach((p) => (p.ready = false));
  s = applyAction(s, "p0", { type: "READY", ready: true }, 101);
  expect(() => applyAction(s, "p0", { type: "REROLL" }, 102)).toThrow();
  expect(() =>
    applyAction(s, "p1", { type: "REROLL" }, s.deadline + 1),
  ).toThrow();
});
it("checkpoint restart and alarm retry settle once", () => {
  let s = ready(lobby());
  lock(s, 101);
  while (s.phase === "SIMULATING") {
    s = advance(JSON.parse(JSON.stringify(s)), s.deadline);
  }
  expect(s.replay?.result.length).toBe(2);
  s = advance(s, s.deadline);
  const gold = s.players.map((p) => p.gold);
  settle(s, 999999);
  expect(s.players.map((p) => p.gold)).toEqual(gold);
  expect(s.round).toBe(2);
});
it("comeback offers and one-time defense relief", () => {
  let s = lobby();
  s.players[0].hp = 14;
  s.round = 1;
  prepare(s, 100);
  expect(s.players[0].rewards).toHaveLength(4);
  expect(s.players[0].freeRerolls).toBe(1);
  s = applyAction(s, "p0", { type: "RELIEF", target: 0 }, 101);
  expect(s.players[0].reliefUsed).toBe(true);
  expect(() =>
    applyAction(s, "p0", { type: "RELIEF", target: 1 }, 102),
  ).toThrow();
});
it("two-player loser loses HP and tournament finishes", () => {
  expect(calculateRoundRewards(1, 2).hpLost).toBe(0);
  expect(calculateRoundRewards(2, 2).hpLost).toBe(10);
  let s = ready(lobby());
  s.players.forEach((p) => (p.hp = 1));
  lock(s, 101);
  while (s.phase === "SIMULATING") s = advance(s, s.deadline);
  s = advance(s, s.deadline);
  expect(s.phase).toBe("FINISHED");
  expect(s.champion).toBeTruthy();
});
it("finishes safely when an opponent leaves during preparation", () => {
  let s = ready(lobby());
  s = applyAction(s, "p1", { type: "LEAVE" }, 101);
  lock(s, 102);
  expect(s.phase).toBe("FINISHED");
  expect(s.champion).toBe("p0");
});
