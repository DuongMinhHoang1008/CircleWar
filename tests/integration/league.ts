import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
const api = process.env.TEST_API || "http://127.0.0.1:8787";
const id = crypto.randomUUID(),
  token = crypto.randomUUID() + crypto.randomUUID();
async function request(path: string, body?: unknown, expected = 200) {
  const response = await fetch(`${api}/api/profiles/${id}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await response.json()) as any;
  assert.equal(response.status, expected, JSON.stringify(data));
  return data;
}
await request("", { type: "INIT" });
assert.equal((await fetch(`${api}/api/profiles/${id}/league`)).status, 401);
const team = ["char_01", "char_14", "char_33"].map((characterId) => ({
  characterId,
  equipment: [],
  level: 999,
  stats: { hp: 999999 },
}));
await request(
  "/league",
  {
    type: "START",
    team: [{ characterId: "char_01" }, { characterId: "char_01" }],
  },
  400,
);
let state = await request("/league", {
  type: "START",
  team,
  contracts: [],
  name: "League smoke",
});
const attempt = state.current.id;
await request(
  "/league",
  { type: "CLAIM_REWARD", rewardId: "official-9", wins: 9 },
  400,
);
assert.equal(state.current.team[0].level, 10);
assert.equal(state.attempts, 1);
assert.equal(state.current.seeds, undefined);
assert.equal(state.current.state, undefined);
await request("/league", { type: "START", team }, 400);
await request("/league", { type: "STEP", id: "forged-attempt" }, 400);
for (let i = 0; i < 450 && !state.current.finished; i++) {
  state = await request("/league", { type: "STEP", id: attempt });
  if (i === 3) {
    const resumed = await request("/league");
    assert.equal(resumed.current.id, attempt);
    assert.equal(resumed.attempts, 1);
  }
}
assert.equal(state.current.finished, true);
assert.equal(state.current.done, 9);
assert.equal(
  state.leaderboard.find((r: any) => r.name === "League smoke").wins,
  state.current.wins,
);
const repeated = await request("/league", { type: "STEP", id: attempt });
assert.equal(repeated.current.wins, state.current.wins);
assert.equal(repeated.attempts, 1);
const beforeReward = (await request("")).profile;
await request("/league", { type: "CLAIM_REWARD", rewardId: "official-3" });
const rewarded = (await request("")).profile;
assert.equal(rewarded.bossPacks, beforeReward.bossPacks + 2);
await request("/league", { type: "CLAIM_REWARD", rewardId: "official-3" });
assert.equal((await request("")).profile.bossPacks, rewarded.bossPacks);
await request("", { type: "SAVE", profile: beforeReward });
assert.equal(
  (await request("")).profile.bossPacks,
  rewarded.bossPacks,
  "stale SAVE must retain server-confirmed reward",
);
// Client profile writes cannot alter the independently persisted score or attempts.
const profile = (await request("")).profile;
await request("", {
  type: "SAVE",
  profile: {
    ...profile,
    league: { attempts: 0, wins: 9 },
    experience: undefined,
  },
});
assert.equal((await request("/league")).attempts, 1);
for (let number = 2; number <= 3; number++) {
  let next = await request("/league", {
    type: "START",
    team,
    contracts: [],
    name: "League smoke",
  });
  assert.equal(next.attempts, number);
  for (let i = 0; i < 450 && !next.current.finished; i++)
    next = await request("/league", { type: "STEP", id: next.current.id });
  assert.equal(next.current.finished, true);
  assert.equal(
    next.current.wins,
    state.current.wins,
    "same normalized team and evaluation seeds must yield the same score",
  );
}
await request("/league", { type: "START", team, contracts: [] }, 400);
await request("/league?week=2099-01-05", undefined, 400);
assert.equal((await request("/league?week=2026-10-19")).closed, true);
writeFileSync(
  "reports/league-integration.json",
  JSON.stringify(
    {
      ok: true,
      finished: state.current.done,
      wins: state.current.wins,
      checks: [
        "authentication",
        "loan normalization",
        "duplicate rejection",
        "hidden seeds",
        "resume",
        "server results",
        "idempotent finish",
        "independent progress",
        "server reward eligibility",
        "idempotent reward claim",
        "stale SAVE reward protection",
        "three-attempt cap",
        "repeatable scores",
        "closed-week access",
      ],
    },
    null,
    2,
  ),
);
console.log("League integration passed", state.current.wins, "/9");
