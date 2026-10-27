import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  CAMPAIGN_TACTICS,
  campaignEncounter,
  campaignStats,
} from "../../packages/shared/src/campaign";
import { CAMPAIGN_FORMATIONS } from "../../packages/shared/src/campaign-tactics";
import { CATALOG_ITEMS, character } from "../../packages/shared/src/catalog";
import { computeStats, type Loadout } from "../../packages/shared/src/balance";
import {
  DEFAULT_ARENA_SIZE,
  DEFAULT_SHRINK_SECONDS,
} from "../../packages/shared/src/arena";
import {
  calculateBattleResult,
  createBattle,
  stepBattle,
} from "../../packages/battle-engine/src/index";

// Offline sample, not a population win-rate estimate. Same levels and legal gear;
// swap actual team ids to exchange spawn sides rather than merely array order.
const seeds = [73, 211, 983, 1597];
const samples = seeds.length * 2;
const builds = CAMPAIGN_TACTICS.map((tactic, i) => ({
  name: tactic.id,
  loadouts: CAMPAIGN_FORMATIONS[i * 2].map((id) => {
    const gear = CATALOG_ITEMS.find((item) => item.affinity === id)!.id;
    return {
      characterId: id,
      classId: character(id)!.base,
      level: 10,
      equipment: [gear],
      equipmentLevels: { [gear]: 10 },
    } as Loadout;
  }),
}));
const stages = CAMPAIGN_TACTICS.map((tactic) => {
  for (let stage = 101; stage <= 120; stage++) {
    const e = campaignEncounter(stage, 3);
    if (!e.boss && e.archetype === tactic.id) return stage;
  }
  throw new Error(`Missing ${tactic.id}`);
});
let battles = 0;
const matrix = stages.map((stage) => {
  const encounter = campaignEncounter(stage, 3);
  encounter.loadouts.forEach((l) =>
    assert.deepEqual(campaignStats(l, stage, 3), computeStats(l)),
  );
  const outcomes = builds.map((build) => {
    let wins = 0,
      ticks = 0;
    for (const mirrored of [false, true])
      for (const seed of seeds) {
        const playerId = mirrored ? "b" : "a",
          enemyId = mirrored ? "a" : "b";
        const state = createBattle(
          {
            width: DEFAULT_ARENA_SIZE,
            height: DEFAULT_ARENA_SIZE,
            shrinkSeconds: DEFAULT_SHRINK_SECONDS,
            teams: [
              { id: playerId, loadouts: build.loadouts },
              { id: enemyId, loadouts: encounter.loadouts },
            ],
            campaign: { stage, enemyTeamId: enemyId },
          },
          seed,
        );
        while (!state.finished && state.tick < 1800) stepBattle(state);
        assert.ok(state.finished, `Stage ${stage} stalled`);
        wins += Number(calculateBattleResult(state)[0].id === playerId);
        ticks += state.tick;
        battles++;
      }
    return {
      build: build.name,
      wins,
      samples,
      averageSeconds: +(ticks / samples / 30).toFixed(2),
    };
  });
  const result = {
    stage,
    archetype: encounter.archetype,
    enemy: encounter.loadouts,
    outcomes,
  };
  console.log(
    JSON.stringify({
      stage,
      archetype: encounter.archetype,
      wins: outcomes.map((o) => `${o.build}:${o.wins}/${samples}`),
    }),
  );
  return result;
});
const progression = [
  [1, 20],
  [21, 40],
  [41, 60],
  [61, 100],
  [101, 180],
].map(([from, to]) => {
  const encounters = Array.from({ length: to - from + 1 }, (_, i) =>
    campaignEncounter(from + i, 3),
  ).filter((e) => !e.boss);
  return {
    from,
    to,
    averageCoherence: +(
      encounters.reduce((sum, e) => sum + e.coherence, 0) / encounters.length
    ).toFixed(2),
    averageLevel: +(
      encounters.reduce((sum, e) => sum + e.loadouts[0].level, 0) /
      encounters.length
    ).toFixed(2),
    uniqueLineups: new Set(
      encounters.map((e) =>
        e.loadouts
          .map((l) => l.characterId)
          .sort()
          .join(","),
      ),
    ).size,
    rosterCoverage: new Set(
      encounters.flatMap((e) => e.loadouts.map((l) => l.characterId)),
    ).size,
  };
});
mkdirSync("test-results", { recursive: true });
writeFileSync(
  "test-results/campaign-tactics.json",
  JSON.stringify(
    { seeds, mirroredSides: true, battles, matrix, progression },
    null,
    2,
  ) + "\n",
);
assert.ok(
  matrix.every(
    (row) => Math.max(...row.outcomes.map((o) => o.wins)) >= samples / 2,
  ),
  "Each sampled encounter must have a viable equal-level counter",
);
assert.ok(
  matrix.every(
    (row) =>
      Math.max(...row.outcomes.map((o) => o.wins)) -
        Math.min(...row.outcomes.map((o) => o.wins)) >=
      2,
  ),
  "Build choice must affect sampled matchups",
);
assert.ok(
  builds.every((build) =>
    matrix.some(
      (row) => row.outcomes.find((o) => o.build === build.name)!.wins < samples,
    ),
  ),
  "No tested build should sweep every encounter on both sides",
);
console.log(JSON.stringify({ battles, progression }));
