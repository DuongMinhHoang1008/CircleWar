import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import {
  CONTRACTS,
  legalLoanTeam,
  weeklyEnemies,
  adventureConfig,
  stableSeed,
} from "../../packages/shared/src/adventure";
import {
  createBattle,
  stepBattle,
} from "../../packages/battle-engine/src/index";
const week = "2026-10-26",
  report = [];
let battles = 0,
  unfinished = 0;
for (let mask = 0; mask < 8; mask++) {
  const contracts = CONTRACTS.filter((_, n) => mask & (1 << n)).map(
    (c) => c.id,
  );
  const results = [];
  for (let candidate = 0; candidate < 12; candidate++) {
    const team = legalLoanTeam(
      weeklyEnemies(`${week}:candidate:${candidate}`, candidate % 3, contracts),
      contracts,
    );
    let wins = 0;
    for (let enemy = 0; enemy < 3; enemy++)
      for (let sample = 0; sample < 2; sample++) {
        const state = createBattle(
          adventureConfig(
            team,
            weeklyEnemies(week, enemy, contracts),
            contracts,
          ),
          stableSeed(`${week}:audit:${enemy}:${sample}`),
        );
        while (!state.finished && state.tick < 5400) stepBattle(state);
        battles++;
        unfinished += Number(!state.finished);
        wins += Number(
          state.finished &&
            state.fighters.some((f) => f.team === "team-player" && f.hp > 0) &&
            !state.fighters.some((f) => f.team === "team-rival" && f.hp > 0),
        );
      }
    results.push({ team: team.map((u) => u.characterId).join("+"), wins });
  }
  const winningTeams = new Set(
    results.filter((r) => r.wins > 0).map((r) => r.team),
  ).size;
  assert.ok(
    winningTeams >= 2,
    `Contract ${contracts.join("+")} lacks multiple feasible teams`,
  );
  report.push({ contracts, winningTeams, candidates: results });
}
writeFileSync(
  "reports/adventure-audit.json",
  JSON.stringify(
    {
      week,
      battles,
      unfinished,
      report,
      limitation:
        "Offline sample of 12 candidate teams and two seeds per opponent; not a universal balance or production CPU guarantee.",
    },
    null,
    2,
  ),
);
console.log(
  "Adventure audit:",
  battles,
  "battles;",
  unfinished,
  "unfinished; all 8 contract combinations have multiple feasible teams",
);
