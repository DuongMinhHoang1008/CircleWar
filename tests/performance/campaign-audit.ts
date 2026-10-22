import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import {
  CAMPAIGN_TEAMS,
  campaignEncounter,
  campaignStats,
} from "../../packages/shared/src/campaign";
import {
  ROSTER,
  CATALOG_ITEMS,
  character,
  type CharacterId,
} from "../../packages/shared/src/catalog";
import { computeStats, type Loadout } from "../../packages/shared/src/balance";
import {
  calculateBattleResult,
  createBattle,
  stepBattle,
} from "../../packages/battle-engine/src/index";
import {
  DEFAULT_ARENA_SIZE,
  DEFAULT_SHRINK_SECONDS,
} from "../../packages/shared/src/arena";

const stages: number[] = [],
  seen = new Set<string>();
for (let stage = 1; stage < 160; stage++) {
  if (stage % 5 === 0) continue;
  const e = campaignEncounter(stage, 3),
    key = `${stage >= 61 ? "cap" : "early"}:${e.strategy}`;
  if (!seen.has(key)) {
    seen.add(key);
    stages.push(stage);
  }
}
stages.push(999, 10001);
const rows = [];
let battles = 0;
for (const size of [1, 3])
  for (const stage of stages) {
    const enemy = campaignEncounter(stage, size);
    for (const l of enemy.loadouts)
      assert.deepEqual(campaignStats(l, stage, size), computeStats(l));
    const counters = [];
    const candidates: {
      name: string;
      ids: CharacterId[];
      utility?: boolean;
    }[] =
      size === 1
        ? ROSTER.map((c) => ({ name: c.name, ids: [c.id as CharacterId] }))
        : [...CAMPAIGN_TEAMS];
    if (size === 3)
      for (let i = 0; i < 64; i++) {
        const indices = [
          ...new Set([(i * 7) % 33, (i * 11 + 7) % 33, (i * 13 + 17) % 33]),
        ];
        for (let n = 0; indices.length < 3; n++)
          if (!indices.includes(n)) indices.push(n);
        candidates.push({
          name: `Counter mix ${i + 1}`,
          ids: indices.map((n) => ROSTER[n].id as CharacterId),
          utility: i >= 33,
        });
      }
    for (const [candidateIndex, strategy] of candidates.entries()) {
      if (
        size === 3 &&
        candidateIndex >= CAMPAIGN_TEAMS.length &&
        counters.length
      )
        break;
      const team = strategy.ids.slice(0, size).map((id, slot) => {
        const item = strategy.utility
          ? ["item_15", "item_17", "item_23"][slot]
          : CATALOG_ITEMS.find((it) => it.affinity === id)!.id;
        return {
          characterId: id as CharacterId,
          classId: character(id)!.base,
          level: enemy.loadouts[0].level,
          equipment: stage >= 6 ? [item] : [],
          equipmentLevels: { [item]: enemy.loadouts[0].level },
        } as Loadout;
      });
      let wins = 0;
      for (const reversed of [false, true])
        for (const seed of [73, 211]) {
          // Spawns are canonicalized by team id, so swapping array order alone
          // does not exchange sides. Keep the player's loadout and swap ids.
          const player = { id: reversed ? "b" : "a", loadouts: team },
            rival = { id: reversed ? "a" : "b", loadouts: enemy.loadouts };
          const s = createBattle(
            {
              width: DEFAULT_ARENA_SIZE,
              height: DEFAULT_ARENA_SIZE,
              shrinkSeconds: DEFAULT_SHRINK_SECONDS,
              teams: reversed ? [rival, player] : [player, rival],
              campaign: { stage, enemyTeamId: rival.id },
            },
            seed,
          );
          while (!s.finished && s.tick < 18000) stepBattle(s);
          assert.ok(s.finished, `Stage ${stage} stalled`);
          battles++;
          wins += Number(calculateBattleResult(s)[0].id === player.id);
        }
      if (wins >= 3)
        counters.push({
          name: strategy.name,
          ids: strategy.ids.slice(0, size),
          equipment: team.map((l) => l.equipment),
          wins,
          matches: 4,
        });
    }
    rows.push({
      stage,
      size,
      strategy: enemy.strategy,
      level: enemy.loadouts[0].level,
      counters,
    });
  }
writeFileSync(
  "reports/campaign-audit.json",
  JSON.stringify(
    {
      conditions:
        "Equal displayed levels and one affinity item per unit from stage 6; two seeds, mirrored spawn sides; all 33 solo cards and all 12 team strategies early and capped plus stages 999 and 10001; if necessary, up to 64 deterministic counter mixes using affinity or anti-control/tank gear. Counter means at least 3/4 wins in this offline sample.",
      battles,
      rows,
    },
    null,
    2,
  ) + "\n",
);
console.table(
  rows.map(({ stage, size, strategy, level, counters }) => ({
    stage,
    size,
    strategy,
    level,
    counters: counters.length,
  })),
);
assert.ok(
  rows.every((row) => row.counters.length > 0),
  "Each sampled normal stage must have a winning counter at the same displayed level",
);
console.log({ battles, counterableStages: rows.length });
