import assert from "node:assert/strict";
import { CURRENT_RELEASE_VERSION } from "../../apps/web/src/PatchNotes";
import { mkdirSync, writeFileSync } from "node:fs";

const api = process.env.TEST_API;
const web = process.env.TEST_WEB;
assert.ok(api && web, "Set TEST_API and TEST_WEB");
const profileId = crypto.randomUUID();
const token = crypto.randomUUID() + crypto.randomUUID();
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Origin: new URL(web).origin,
};
async function request(type: string, profile: unknown) {
  const response = await fetch(`${api}/api/profiles/${profileId}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ type, profile }),
  });
  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("Access-Control-Allow-Origin"),
    headers.Origin,
  );
  return ((await response.json()) as { profile: Record<string, unknown> })
    .profile;
}
const before = {
  cards: [{ characterId: "char_01", level: 1, xp: 0 }],
  itemCards: [],
  team: ["char_01"],
  equipment: {},
  packs: 100,
  lastPackAt: Date.now(),
  missions: { draw: 0, win: 0, campaign: 0 },
  claimedMissions: [],
  campaignStage: 0,
  processedMatches: [],
  packsSinceRare: 0,
  packsSinceHighRarity: 99,
};
assert.equal((await fetch(`${api}/health`)).status, 200);
await request("INIT", before);
const after = {
  ...before,
  cards: [...before.cards, { characterId: "char_26", level: 4, xp: 82 }],
  itemCards: [{ itemId: "item_28", level: 3, xp: 92 }],
  packs: 0,
  missions: { ...before.missions, draw: 100 },
  packsSinceHighRarity: 0,
};
for (let repeat = 0; repeat < 2; repeat++) {
  const result = await request("SAVE", after);
  assert.equal(result.packs, 0);
  assert.deepEqual(result.cards, after.cards);
  assert.deepEqual(result.itemCards, after.itemCards);
}
const restored = await request("INIT", before);
assert.equal(restored.packs, 0);
assert.deepEqual(restored.cards, after.cards);
assert.deepEqual(restored.missions, after.missions);
const release = await fetch(`${web}/release.json`, { cache: "no-store" });
assert.equal(release.status, 200);
assert.equal(
  ((await release.json()) as { version: string }).version,
  CURRENT_RELEASE_VERSION,
);
const atlas = await fetch(`${web}/effects/character-fx.svg`);
assert.equal(atlas.status, 200);
assert.equal(((await atlas.text()).match(/<svg x=/g) || []).length, 256);
const result = {
  time: new Date().toISOString(),
  web,
  api,
  status: "PASS",
  checks: [
    "health",
    "profile CORS",
    "100-pack result SAVE",
    "idempotent retry",
    "stale INIT preserves rewards",
    "release manifest",
    "256 character VFX frames",
  ],
};
mkdirSync("reports", { recursive: true });
writeFileSync(
  "reports/deployment-2026-10-21.json",
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));
