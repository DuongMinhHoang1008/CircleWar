import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";
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
const pairResults: { a: string; b: string; aWins: number; matches: number }[] = [];
let battles = 0,
  stalled = 0;
const unresolved: { seed: number; left: Loadout[]; right: Loadout[]; tick: number }[] = [];
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
  while (!state.finished && state.tick < 18000) stepBattle(state);
  battles++;
  if (!state.finished) { stalled++; unresolved.push({ seed, left, right, tick: state.tick }); }
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
    const pair = { a: rows[a].id, b: rows[b].id, aWins: 0, matches: 0 };
    for (const seed of [73, 211]) {
      for (const reversed of [false, true]) {
        const left = reversed ? b : a,
          right = reversed ? a : b;
        const win = match([load(rows[left].id)], [load(rows[right].id)], seed);
        pair.aWins += Number(reversed ? !win : win);
        pair.matches++;
        rows[left].duelWins += Number(win);
        rows[right].duelWins += Number(!win);
        rows[a].duels++;
        rows[b].duels++;
      }
    }
    pairResults.push(pair);
  }
for (let a = 0; a < rows.length; a++)
  for (let offset = 1; offset <= 16; offset++) {
    const b = (a + offset * 5) % rows.length;
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
const equipped = process.argv.includes("--roster-only") ? [] : [1, 10].map(level => {
  const result = ROSTER.map(c => ({ id: c.id, wins: 0, matches: 0, counters: [] as string[] }));
  for (let a = 0; a < ROSTER.length; a++) for (let b = a + 1; b < ROSTER.length; b++) {
    let aWins = 0;
    const gear = (index: number) => { const id = ROSTER[index].id; const item = CATALOG_ITEMS.find(it => it.affinity === id)!.id; return { ...load(id, item), level, equipmentLevels: { [item]: level } }; };
    for (const reversed of [false, true]) {
      const win = match([gear(reversed ? b : a)], [gear(reversed ? a : b)], 461);
      aWins += Number(reversed ? !win : win);
    }
    result[a].wins += aWins; result[b].wins += 2 - aWins;
    result[a].matches += 2; result[b].matches += 2;
    if (aWins === 0) result[a].counters.push(ROSTER[b].id);
    if (aWins === 2) result[b].counters.push(ROSTER[a].id);
  }
  return { level, characters: result.map(r => ({ ...r, winRate: Math.round(r.wins / r.matches * 100) })) };
});
const report = {
  battles,
  stalled,
  unresolved,
  conditions:
    "Lv10 evolved cards, bare roster with 2 seeds and both spawn sides; 16 controlled team matchups per card on both sides; Lv10 items vs bare mirrors; own affinity equipment at Lv1 and Lv10 on both sides. Fixed seeds; 10s wall timer. All eligible synergies active. Offline sample, not a live-player win-rate claim.",
  characters: rows.map((r) => ({
    ...r,
    duelRate: Math.round((r.duelWins / r.duels) * 100),
    teamRate: Math.round((r.teamWins / r.teams) * 100),
    counters: pairResults.flatMap(pair => {
      const wins = pair.a === r.id ? pair.matches - pair.aWins : pair.b === r.id ? pair.aWins : -1;
      return wins >= pair.matches * .75 ? [{ id: pair.a === r.id ? pair.b : pair.a, wins, matches: pair.matches }] : [];
    }),
  })),
  items,
  rarityParity,
  equipped,
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
for (const phase of equipped) console.table(phase.characters.map(({ id, winRate, counters }) => ({ level: phase.level, id, winRate, counters: counters.length })));
console.log({ battles, stalled });
assert.equal(stalled, 0, "Audit battles must finish");
assert.ok(report.characters.every(c => c.counters.length > 0), "Every bare card needs a measured counter");
assert.ok(report.characters.every(c => c.duelRate <= 78 && c.teamRate <= 75), "Review overperforming roster cards");
assert.ok(equipped.every(phase => phase.characters.every(c => c.counters.length > 0 && c.winRate <= 78)), "Every affinity build needs a counter and a bounded observed win rate");
