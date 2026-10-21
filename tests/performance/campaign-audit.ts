import { writeFileSync } from "node:fs";
import { campaignEncounter } from "../../packages/shared/src/campaign";
import { character, type CharacterId } from "../../packages/shared/src/catalog";
import type { Loadout } from "../../packages/shared/src/balance";
import { calculateBattleResult, createBattle, debugConfig, stepBattle } from "../../packages/battle-engine/src/index";

const rows = [];
for (const size of [1, 3]) for (const stage of [1, 4, 5, 6, 9, 10, 11, 14, 15, 16]) {
  const heroes = (size === 1 ? ["char_04"] : ["char_01", "char_02", "char_04"]).map(id => ({ characterId: id as CharacterId, classId: character(id)!.base, level: 3, equipment: [] }) as Loadout);
  const encounter = campaignEncounter(stage, size);
  let wins = 0, maxTicks = 0;
  for (let seed = 1; seed <= 12; seed++) {
    const config = debugConfig(2);
    config.teams = [{ id: "player", loadouts: heroes }, { id: "enemy", loadouts: encounter.loadouts }];
    config.campaign = { stage, enemyTeamId: "enemy" };
    const state = createBattle(config, seed * 7919);
    while (!state.finished && state.tick < 18000) stepBattle(state);
    if (!state.finished) throw Error(`Campaign ${stage} did not finish`);
    maxTicks = Math.max(maxTicks, state.tick);
    if (calculateBattleResult(state)[0].id === "player") wins++;
  }
  rows.push({ size, stage, boss: encounter.boss, playerLevel: 3, wins, matches: 12, maxTicks });
}
writeFileSync("reports/campaign-audit.json", JSON.stringify(rows, null, 2) + "\n");
console.table(rows);
