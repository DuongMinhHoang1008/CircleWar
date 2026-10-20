import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { build } from "esbuild";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";
import { character, type CharacterId } from "../../packages/shared/src/catalog";
import type { ClassId } from "../../packages/shared/src/balance";
import {
  calculateStateHash,
  debugConfig,
  hash,
  rosterConfig,
  runBattle,
} from "../../packages/battle-engine/src/index";
import type { ReplayFrame } from "../../packages/battle-engine/src/types";
import type { RoomState, ReplayInfo } from "../../packages/shared/src/room";
const engine = resolve("packages/battle-engine/src/index.ts").replaceAll(
  "\\",
  "/",
);
const bundled = await build({
  stdin: {
    contents: `import {runBattle,calculateStateHash} from ${JSON.stringify(engine)};export default {async fetch(req){const samples=await req.json();return Response.json(samples.map(s=>calculateStateHash(runBattle(s.config,s.seed))));}}`,
    resolveDir: process.cwd(),
    loader: "ts",
  },
  bundle: true,
  write: false,
  format: "esm",
  platform: "browser",
  target: "es2022",
});
const mf = new Miniflare(
  convertV4MiniflareOptions({
    modules: true,
    script: bundled.outputFiles[0].text,
    compatibilityDate: "2025-06-01",
  }),
);
try {
  const samples = Array.from({ length: 100 }, (_, i) => {
    const config = (i % 2 === 0 ? rosterConfig : debugConfig)(
      i % 5 === 0 ? 60 : 2 + (i % 19),
    );
    config.shrinkSeconds = 10;
    // Include every new group in Node/workerd parity, not just ungrouped rosters.
    if (i >= 94) {
      const ids = [
        ["char_05", "char_07", "char_10"],
        ["char_16", "char_19"],
        ["char_01", "char_02", "char_05"],
        ["char_14", "char_16", "char_01"],
        ["char_09", "char_01", "char_02"],
        ["char_03", "char_15", "char_04"],
      ][i - 94];
      config.teams[0].loadouts = ids.map((id) => ({
        characterId: id as CharacterId,
        classId: character(id)!.base as ClassId,
        level: 0,
        equipment: [],
      }));
      config.teams[0].choice = { group: `G${String(i - 86).padStart(2, "0")}` };
    }
    return { config, seed: i + 1 };
  });
  const response = await mf.dispatchFetch("http://local/parity", {
    method: "POST",
    body: JSON.stringify(samples),
  });
  const hashes = (await response.json()) as string[];
  samples.forEach((s, i) =>
    assert.equal(
      hashes[i],
      calculateStateHash(runBattle(s.config, s.seed)),
      "workerd seed " + s.seed,
    ),
  );
} finally {
  await mf.dispose();
}
const worker = await build({
  entryPoints: ["apps/worker/src/index.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "browser",
  target: "es2022",
  external: ["cloudflare:workers"],
});
const persist = resolve("reports/recovery-" + Date.now());
const options = convertV4MiniflareOptions({
  resourcePersistencePath: persist,
  name: "circle-chaos-recovery",
  modules: true,
  script: worker.outputFiles[0].text,
  compatibilityDate: "2025-06-01",
  durableObjects: { ROOMS: { className: "Room", useSQLite: true } },
  bindings: { ALLOWED_ORIGINS: "http://localhost:5173" },
});
let runtime = new Miniflare(options);
interface ResponseData {
  token: string;
  id: string;
  code: string;
  state: RoomState;
  replay: ReplayInfo;
  chunk: { index: number; count: number; hash: string; data: string };
}
async function request(path: string, body?: unknown, token?: string) {
  const r = await runtime.dispatchFetch("http://local" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await r.json()) as ResponseData;
  assert.equal(r.status, 200, JSON.stringify(data));
  return data;
}
try {
  const a = await request("/api/rooms", { name: "Restart Host" }),
    base = "/api/rooms/" + a.code,
    b = await request(base + "/join", { name: "Opponent" });
  const settings = { ...a.state.settings, shrinkSeconds: 10 };
  const action = (token: string, type: Record<string, unknown>, round = 0) =>
    request(
      base + "/action",
      { protocol: 4, round, requestId: crypto.randomUUID(), action: type },
      token,
    );
  await action(a.token, { type: "SET_CONFIG", settings });
  await action(a.token, {
    type: "SELECT_CHARACTERS",
    characters: ["char_14", "char_16", "char_20"],
  });
  await action(a.token, {
    type: "TEAM_CHOICE",
    group: "G11",
    trait: "Kiểm soát",
  });
  await action(a.token, { type: "READY", ready: true });
  await action(b.token, { type: "READY", ready: true });
  await action(a.token, { type: "START" });
  await action(a.token, { type: "READY", ready: true }, 1);
  await action(b.token, { type: "READY", ready: true }, 1);
  // Stop the workerd process with persisted authoritative state, then open a new instance.
  await runtime.dispose();
  runtime = new Miniflare(options);
  let current = await request(base, undefined, a.token);
  assert.equal(current.state.round, 1);
  assert.equal(current.state.players.length, 2);
  const start = Date.now();
  while (!current.state.replay && Date.now() - start < 30000) {
    await new Promise((r) => setTimeout(r, 200));
    current = await request(base, undefined, a.token);
  }
  const replay = (await request(base + "/replay", undefined, a.token)).replay;
  assert.ok(replay);
  if (replay.format !== 1) throw Error("Expected recorded replay format 1");
  assert.equal("seed" in replay, false);
  assert.equal("result" in replay, false);
  assert.equal("final" in replay, false);
  assert.ok(replay.chunks.length > 0);
  const frames: ReplayFrame[] = [];
  for (const descriptor of replay.chunks) {
    const { chunk } = await request(
      `${base}/replay/chunk?index=${descriptor.index}&game=${replay.game}&round=${replay.round}`,
      undefined,
      a.token,
    );
    const decoded = JSON.parse(
      gunzipSync(Buffer.from(chunk.data, "base64")).toString("utf8"),
    ) as ReplayFrame[];
    assert.equal(decoded.length, descriptor.count);
    assert.equal(hash(decoded), descriptor.hash);
    frames.push(...decoded);
  }
  assert.equal(frames[0].tick, 0);
  assert.equal(frames.at(-1)?.tick, replay.totalTicks);
  mkdirSync("reports", { recursive: true });
  writeFileSync(
    "reports/recovery.json",
    JSON.stringify(
      {
        workerdSeeds: 100,
        replayChunksValidated: replay.chunks.length,
        restartRestoresSession: true,
        restartContinuesSimulation: true,
        hash: replay.finalHash,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: 100 Node/workerd seeds and durable room/session/simulation restart recovery.",
  );
} finally {
  await runtime.dispose();
}
