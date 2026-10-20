import assert from "node:assert/strict";
import { writeFileSync, mkdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import {
  hash,
} from "../../packages/battle-engine/src/index";
import type { ReplayFrame } from "../../packages/battle-engine/src/types";
import type { RoomState, ReplayInfo } from "../../packages/shared/src/room";
import type { Action } from "../../packages/shared/src/protocol";
import { CATALOG_ITEMS } from "../../packages/shared/src/catalog";
const api = process.env.TEST_API || "http://127.0.0.1:8787",
  origin = "http://127.0.0.1:5173";
interface Result {
  token: string;
  id: string;
  code: string;
  state: RoomState;
  serverTime: number;
  ticket: string;
  replay: ReplayInfo;
  chunk: { index: number; count: number; hash: string; data: string };
  error?: string;
}
async function request(
  path: string,
  body?: unknown,
  token?: string,
  expected = 200,
): Promise<Result> {
  const r = await fetch(api + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await r.json()) as Result;
  assert.equal(r.status, expected, JSON.stringify(data));
  return data;
}
const created = await request("/api/rooms", { name: "Host" }),
  base = "/api/rooms/" + created.code;
const players = [created];
for (let i = 1; i < 20; i++)
  players.push(await request(base + "/join", { name: "Player " + i }));
const events: string[] = [];
const { ticket } = await request(base + "/ticket", {}, created.token);
const ws = new WebSocket(
  api.replace("http", "ws") + base + "/ws?ticket=" + ticket,
);
await new Promise<void>((resolve, reject) => {
  ws.onopen = () => resolve();
  ws.onerror = () => reject(Error("WS failed"));
});
ws.onmessage = (e) => events.push(String(e.data));
let reqNo = 0;
let currentRound = 0;
async function action(
  p: Result,
  a: Action,
  requestId = crypto.randomUUID(),
  expected = 200,
) {
  reqNo++;
  const result = await request(
    base + "/action",
    { protocol: 4, round: currentRound, requestId, action: a },
    p.token,
    expected,
  );
  if (result.state) currentRound = result.state.round;
  return result;
}
await request(base, undefined, "invalid-token", 401);
await action(
  players[1],
  { type: "SET_CONFIG", settings: created.state.settings },
  crypto.randomUUID(),
  400,
);
const settings = {
  ...created.state.settings,
  shrinkSeconds: 10,
  preparationSeconds: 10,
};
await action(created, { type: "SET_CONFIG", settings });
for (const p of players) await action(p, { type: "READY", ready: true });
await action(created, { type: "START" });
const state = (await request(base, undefined, created.token)).state;
const first = state.players.find((p) => p.id === created.id)!;
const available = first.shop.findIndex(
  (id) =>
    !!id && CATALOG_ITEMS.some((i) => i.id === id && i.price <= first.gold),
);
if (available >= 0) {
  const uuid = crypto.randomUUID();
  const responses = await Promise.all([
    action(created, { type: "BUY", offer: available }, uuid),
    action(created, { type: "BUY", offer: available }, uuid),
  ]);
  assert.equal(
    responses[0].state.players.find((p) => p.id === created.id)!.gold,
    responses[1].state.players.find((p) => p.id === created.id)!.gold,
  );
}
const spectator = await request(base + "/join", {
  name: "Spectator",
  spectator: true,
});
await action(
  spectator,
  { type: "READY", ready: true },
  crypto.randomUUID(),
  400,
);
for (const p of players) await action(p, { type: "READY", ready: true });
const start = Date.now();
let r: Result;
do {
  await new Promise((resolve) => setTimeout(resolve, 300));
  r = await request(base, undefined, players[19].token);
} while (!r.state.replay && Date.now() - start < 45000);
assert.ok(r.state.replay, "Server did not produce replay");
const replay = (await request(base + "/replay", undefined, players[19].token))
  .replay;
if (replay.format !== 1) throw Error("Expected recorded replay format 1");
assert.equal("seed" in replay, false);
assert.equal("result" in replay, false);
assert.equal("final" in replay, false);
const recorded: ReplayFrame[] = [];
for (const descriptor of replay.chunks) {
  const { chunk } = await request(
    base + `/replay/chunk?index=${descriptor.index}&game=${replay.game}&round=${replay.round}`,
    undefined,
    players[19].token,
  );
  const frames = JSON.parse(
    gunzipSync(Buffer.from(chunk.data, "base64")).toString("utf8"),
  ) as ReplayFrame[];
  assert.equal(frames.length, descriptor.count);
  assert.equal(hash(frames), descriptor.hash);
  recorded.push(...frames);
}
assert.equal(recorded[0]?.tick, 0);
assert.equal(recorded.at(-1)?.tick, replay.totalTicks);
assert.equal(
  recorded[0].fighters.length,
  replay.config.teams.reduce((n, t) => n + t.loadouts.length, 0),
);
// Reconnect with a new one-time ticket, after the original socket is closed.
ws.close();
const t2 = await request(base + "/ticket", {}, created.token);
const ws2 = new WebSocket(
  api.replace("http", "ws") + base + "/ws?ticket=" + t2.ticket,
);
await new Promise<void>((resolve, reject) => {
  ws2.onopen = () => resolve();
  ws2.onerror = () => reject(Error("Reconnect failed"));
});
ws2.close();
assert.ok(events.length > 0);
mkdirSync("reports", { recursive: true });
writeFileSync(
  "reports/integration.json",
  JSON.stringify(
    {
      code: created.code,
      players: 20,
      actions: reqNo,
      websocketEvents: events.length,
      replayFrames: recorded.length,
      checks: [
        "room creation",
        "20 joins",
        "authentication rejection",
        "host authorization",
        "atomic duplicate purchase",
        "spectator restrictions",
        "server simulation",
        "recorded replay chunks and checksums",
        "WebSocket reconnect",
      ],
      replayChunks: replay.chunks.length,
      replayCompressedBytes: replay.chunks.reduce((n, c) => n + c.bytes, 0),
      replayStoredBase64Bytes: replay.chunks.reduce(
        (n, c) => n + Math.ceil((c.bytes * 4) / 3),
        0,
      ),
      ticks: replay.totalTicks,
    },
    null,
    2,
  ),
);
console.log(
  "PASS: 20-player Worker integration, recorded replay, WebSocket reconnect. Chunks:",
  replay.chunks.length,
);
