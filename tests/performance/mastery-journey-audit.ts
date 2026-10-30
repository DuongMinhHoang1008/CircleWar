import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { CHARACTER_JOURNEYS } from "../../packages/shared/src/mastery-journey";
import { adventureConfig, loanUnit } from "../../packages/shared/src/adventure";
import { experienceOf } from "../../packages/shared/src/experience";
import {
  createBattle,
  stepBattle,
} from "../../packages/battle-engine/src/index";
import { createBattleRecorder } from "../../apps/web/src/battleAnalytics";
import { advanceMastery } from "../../apps/web/src/adventureProgress";
import type { CharacterId } from "../../packages/shared/src/catalog";

const rows = [];
for (const journey of CHARACTER_JOURNEYS) {
  const counts = [0, 0, 0];
  const ids = [
    journey.id,
    ...["char_06", "char_15", "char_11"]
      .filter((id) => id !== journey.id)
      .slice(0, 2),
  ] as CharacterId[];
  for (let seed = 0; seed < 8; seed++)
    for (const side of [0, 1]) {
      const team = ids.map((id) => loanUnit(id));
      const config = adventureConfig(team, team),
        s = createBattle(config, 593 + seed * 7907),
        recorder = createBattleRecorder();
      const sourceTeam = side ? "team-rival" : "team-player";
      while (!s.finished && s.tick < 5400) {
        stepBattle(s);
        recorder.observe(s.events, s.fighters, sourceTeam, s.tick - 1);
      }
      assert.ok(s.finished);
      const winner = s.fighters.find((f) => f.hp > 0)?.team || "draw";
      const summary = recorder.finish(s, config, winner);
      summary.winner = winner === sourceTeam ? "team-player" : "team-rival";
      summary.units = summary.units.map((u) => ({
        ...u,
        team: u.team === sourceTeam ? "team-player" : "team-rival",
      }));
      for (const [i, progress] of [0, 3, 8].entries()) {
        const exp = {
          ...experienceOf({}),
          mastery: { [journey.id]: progress },
        };
        if (advanceMastery(exp, summary).mastery[journey.id] > progress)
          counts[i]++;
      }
    }
  rows.push({
    id: journey.id,
    title: journey.title,
    matches: 16,
    qualifyingBattles: counts,
    objectives: journey.objectives.map((o) => o.text),
  });
}
const report = {
  battles: 528,
  method:
    "Lv10, no equipment or mastery, mirrored three-character teams over eight seeds. Each character is evaluated from either side; goal counts include losses. Limited regression sample.",
  neverQualified: rows.filter((r) => r.qualifyingBattles.some((n) => !n)),
  rows,
};
mkdirSync("reports/mastery-redesign", { recursive: true });
writeFileSync(
  "reports/mastery-redesign/journey-goals.json",
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify({
    battles: report.battles,
    neverQualified: report.neverQualified,
  }),
);
