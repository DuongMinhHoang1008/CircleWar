import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { MASTERY_PATHS } from "../../packages/shared/src/mastery-paths";
import { loanUnit, adventureConfig } from "../../packages/shared/src/adventure";
import {
  createBattle,
  stepBattle,
  ENGINE_VERSION,
} from "../../packages/battle-engine/src/index";
import type { CharacterId } from "../../packages/shared/src/catalog";

const samples = Number(process.env.MASTERY_SAMPLES || 8);
const rows = [];
let battles = 0;
for (const skill of MASTERY_PATHS.filter(
  (m) =>
    !process.env.MASTERY_FILTER || m.characterId === process.env.MASTERY_FILTER,
)) {
  const ids = [
    skill.characterId,
    ...["char_06", "char_15", "char_11"]
      .filter((id) => id !== skill.characterId)
      .slice(0, 2),
  ] as CharacterId[];
  let wins = 0,
    draws = 0,
    procTargets = 0,
    totalTicks = 0;
  for (let sample = 0; sample < samples; sample++)
    for (const side of [0, 1]) {
      const seed = 593 + sample * 7907;
      const teams = [
        ids.map((id) => loanUnit(id)),
        ids.map((id) => loanUnit(id)),
      ];
      teams[side][0].masteryId = skill.id;
      const s = createBattle(adventureConfig(teams[0], teams[1]), seed);
      const team = side === 0 ? "team-player" : "team-rival";
      while (!s.finished && s.tick < 5400) {
        stepBattle(s);
        procTargets += s.events.filter(
          (e) => e.tick === s.tick && e.type === `mastery:${skill.id}`,
        ).length;
      }
      assert.ok(s.finished, `${skill.id} stalled at seed ${seed}`);
      assert.ok(
        s.fighters.every(
          (f) =>
            Number.isInteger(f.hp) &&
            f.hp >= 0 &&
            Number.isFinite(f.x) &&
            Number.isFinite(f.y),
        ),
        `${skill.id} invalid state`,
      );
      const living = new Set(
        s.fighters.filter((f) => f.hp > 0).map((f) => f.team),
      );
      if (living.size === 0 || living.size > 1) draws++;
      else if (living.has(team)) wins++;
      totalTicks += s.tick;
      battles++;
    }
  rows.push({
    id: skill.id,
    name: skill.name,
    matches: samples * 2,
    wins,
    draws,
    winRate: wins / (samples * 2),
    procTargets,
    meanSeconds: Math.round(totalTicks / (samples * 2) / 3) / 10,
  });
}
const report = {
  engine: ENGINE_VERSION,
  battles,
  method:
    "Lv10, no equipment, same three characters on both teams; each seed tested with the mastery on each side. This is a limited regression sample, not a global win-rate estimate.",
  aggregateWinRate: rows.reduce((n, r) => n + r.wins, 0) / battles,
  noActivations: rows.filter((r) => !r.procTargets).map((r) => r.id),
  extremes: rows.filter((r) => r.winRate < 0.2 || r.winRate > 0.8),
  rows,
};
mkdirSync("reports/mastery-redesign", { recursive: true });
writeFileSync(
  process.env.MASTERY_AUDIT_FILE || "reports/mastery-redesign/balance.json",
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify({
    battles,
    aggregateWinRate: report.aggregateWinRate,
    noActivations: report.noActivations,
    extremes: report.extremes,
  }),
);
