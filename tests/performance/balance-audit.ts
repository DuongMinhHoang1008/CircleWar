import { writeFileSync } from "node:fs";
import {
  ROSTER,
  CATALOG_ITEMS,
  type CharacterId,
} from "../../packages/shared/src/catalog";
import { cardEvolution } from "../../packages/shared/src/progression";
import {
  computeStats,
  type ClassId,
  type Loadout,
} from "../../packages/shared/src/balance";
import { CHARACTER_BALANCE } from "../../packages/shared/src/combat-balance";
import {
  createBattle,
  stepBattle,
  calculateBattleResult,
} from "../../packages/battle-engine/src/index";

const load = (id: string, item?: string): Loadout => ({
  characterId: id as CharacterId,
  classId: ROSTER.find((c) => c.id === id)!.base as ClassId,
  level: 10,
  equipment: item ? [item] : [],
  equipmentLevels: item ? { [item]: 10 } : {},
});
let battles = 0,
  stalled = 0;
function match(left: Loadout[], right: Loadout[], seed: number) {
  const state = createBattle(
    {
      width: 120000,
      height: 72000,
      shrinkSeconds: 10,
      teams: [
        { id: "a", loadouts: left },
        { id: "b", loadouts: right },
      ],
    },
    seed,
  );
  while (!state.finished && state.tick < 6000) stepBattle(state);
  battles++;
  if (!state.finished) stalled++;
  return calculateBattleResult(state)[0].id === "a";
}

const rows = ROSTER.map((c) => ({
  id: c.id,
  name: c.name,
  role: CHARACTER_BALANCE[c.id].role,
  duelWins: 0,
  duels: 0,
  teamWins: 0,
  teams: 0,
}));
for (let a = 0; a < rows.length; a++)
  for (let b = a + 1; b < rows.length; b++) {
    for (const seed of [73, 211]) {
      for (const reversed of [false, true]) {
        const left = reversed ? b : a,
          right = reversed ? a : b;
        const win = match([load(rows[left].id)], [load(rows[right].id)], seed);
        rows[left].duelWins += Number(win);
        rows[right].duelWins += Number(!win);
        rows[a].duels++;
        rows[b].duels++;
      }
    }
  }
for (let a = 0; a < rows.length; a++)
  for (let offset = 1; offset <= 8; offset++) {
    const b = (a + offset * 3) % rows.length;
    if (a === b) continue;
    // Same two teammates isolate the tested slot while preserving real synergy interactions.
    const allies = ["char_02", "char_05"].filter(
      (id) => id !== rows[a].id && id !== rows[b].id,
    );
    while (allies.length < 2) allies.push("char_15");
    for (const reversed of [false, true]) {
      const left = reversed ? b : a,
        right = reversed ? a : b;
      const win = match(
        [load(rows[left].id), ...allies.map((id) => load(id))],
        [load(rows[right].id), ...allies.map((id) => load(id))],
        997 + offset * 19,
      );
      rows[left].teamWins += Number(win);
      rows[right].teamWins += Number(!win);
      rows[a].teams++;
      rows[b].teams++;
    }
  }
const items = (process.argv.includes("--roster-only") ? [] : CATALOG_ITEMS).map(
  (it) => {
    let wins = 0,
      count = 0;
    for (const id of [
      "char_01",
      "char_05",
      "char_12",
      "char_13",
      "char_16",
      "char_17",
    ])
      for (const seed of [73, 211, 461, 997]) {
        wins += Number(match([load(id, it.id)], [load(id)], seed));
        count++;
        wins += Number(!match([load(id)], [load(id, it.id)], seed));
        count++;
      }
    return {
      id: it.id,
      name: it.name,
      wins,
      count,
      winRate: Math.round((wins / count) * 100),
    };
  },
);
const rarityParity = [2, 3, 4, 5].map((tier) => ({
  tier,
  characters: ROSTER.flatMap((c) => {
    const level = Array.from({ length: 10 }, (_, i) => i + 1).find(
      (l) => cardEvolution(c.tier, l).tierIndex === tier,
    );
    return level
      ? [{ id: c.id, level, stats: computeStats({ ...load(c.id), level }) }]
      : [];
  }),
}));
const report = {
  battles,
  stalled,
  conditions:
    "GOD, no equipment in roster tests; GOD item on mirror GOD units; fixed seeds; 10s wall timer. Team tests include all eligible synergies. Offline sample, not a live-player win-rate claim.",
  characters: rows.map((r) => ({
    ...r,
    duelRate: Math.round((r.duelWins / r.duels) * 100),
    teamRate: Math.round((r.teamWins / r.teams) * 100),
  })),
  items,
  rarityParity,
};
writeFileSync("reports/balance-audit.json", JSON.stringify(report, null, 2));
console.table(
  report.characters.map(({ id, role, duelRate, teamRate }) => ({
    id,
    role,
    duelRate,
    teamRate,
  })),
);
console.table(items.map(({ id, winRate }) => ({ id, winRate })));
console.log({ battles, stalled });
