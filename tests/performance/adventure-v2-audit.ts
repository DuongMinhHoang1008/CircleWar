import { writeFileSync } from "node:fs";
import {
  ROSTER,
  CATALOG_ITEMS,
  type CharacterId,
} from "../../packages/shared/src/catalog";
import {
  createBattle,
  stepBattle,
} from "../../packages/battle-engine/src/index";
import { computeStats, type Loadout } from "../../packages/shared/src/balance";
import { adventureConfig, loanUnit } from "../../packages/shared/src/adventure";
import {
  createRun,
  starterChoices,
  enterNode,
  currentNode,
  runMap,
  beginRunBattle,
  runBattleConfig,
  runBattleSeed,
  settleRunBattle,
  takeLoot,
  lootChoices,
  nodeStock,
  buyItem,
  buyRunRest,
  recruit,
  dismiss,
  equipRunItem,
  upgradeRun,
  restRun,
  resolveEvent,
  leaveNode,
  type RoguelikeRun,
} from "../../packages/shared/src/roguelike";

function simulate(
  config: Parameters<typeof createBattle>[0],
  seed: number,
  disable = false,
) {
  const s = createBattle(config, seed);
  if (disable) s.bonds["team-player:resonance"] = { uses: 4, ready: 999999 };
  for (let n = 0; n < 5400 && !s.finished; n++) stepBattle(s);
  const won =
    s.finished &&
    s.fighters.some((f) => f.team === "team-player" && f.hp > 0) &&
    !s.fighters.some((f) => f.team === "team-rival" && f.hp > 0);
  return { s, won };
}
function score(unit: Loadout) {
  const s = computeStats(unit);
  return s.hp + s.attack * 12 + s.defense * 4;
}
const runs: {
  seed: number;
  floors: number;
  won: boolean;
  battles: number;
  final?: unknown;
}[] = [];
for (let seed = 1; seed <= 12; seed++) {
  const start = starterChoices(seed)
    .slice()
    .sort((a, b) => score(loanUnit(b, "", 3)) - score(loanUnit(a, "", 3)))[0];
  let run: RoguelikeRun | undefined = createRun(`audit-${seed}`, seed, start);
  while (run) {
    if (run.phase === "reward") {
      run = takeLoot(run, lootChoices(run)[0]);
      continue;
    }
    const nodes = runMap(run.seed)[run.floor],
      node =
        nodes.find((n) => n.kind === "shop") ||
        nodes.find(
          (n) =>
            n.kind === "recruit" && run!.team.length < 3 && run!.gold >= 60,
        ) ||
        nodes.find((n) => n.kind === "camp") ||
        nodes.find((n) => n.kind === "event") ||
        nodes[0];
    run = enterNode(run, node.id);
    if (["battle", "elite", "boss"].includes(node.kind)) {
      run = beginRunBattle(run);
      const { s, won } = simulate(runBattleConfig(run), runBattleSeed(run));
      const result = settleRunBattle(
        run,
        won,
        s.fighters
          .filter((f) => f.team === "team-player")
          .map((f) => ({
            characterId: f.characterId!,
            hp: f.hp,
            maxHp: f.stats.hp,
          })),
      );
      if (result.end) {
        runs.push({
          seed,
          floors: result.end.floor,
          won: result.end.won,
          battles: result.end.wins,
          final: s.fighters.map((f) => ({
            id: f.characterId,
            team: f.team,
            hp: f.hp,
            max: f.stats.hp,
            level: f.level,
            gear: f.equipment,
            damage: f.dealt,
            tick: s.tick,
          })),
        });
        break;
      }
      run = result.run;
      continue;
    }
    if (["shop", "recruit"].includes(node.kind)) {
      if (
        node.kind === "shop" &&
        run.gold >= 25 &&
        run.team.some((id) => run!.health[id] < 75)
      )
        run = buyRunRest(run);
      if (run.gold >= 60 && run.team.length < 3)
        run = recruit(
          run,
          nodeStock(run)
            .recruits.slice()
            .sort(
              (a, b) =>
                score(loanUnit(b, "", 3 + Math.floor(run!.floor / 2))) -
                score(loanUnit(a, "", 3 + Math.floor(run!.floor / 2))),
            )[0],
        );
      if (node.kind === "shop") {
        for (const id of nodeStock(run).items) {
          const price =
            35 + (CATALOG_ITEMS.find((i) => i.id === id)?.rarity || 0) * 10;
          if (run.gold >= price) run = buyItem(run, id);
        }
        while (run.gold >= 40 && run.team.some((id) => run!.levels[id] < 10)) {
          const id: CharacterId = run.team
            .filter((id) => run!.levels[id] < 10)
            .sort((a, b) => run!.levels[a] - run!.levels[b])[0];
          run = upgradeRun(run, id);
        }
      }
      run = leaveNode(run);
    } else if (node.kind === "camp")
      run = run.team.some((id) => run!.health[id] < 70)
        ? restRun(run)
        : upgradeRun(
            run,
            run.team.slice().sort((a, b) => run!.levels[a] - run!.levels[b])[0],
          );
    else run = resolveEvent(run, "heal");
    for (const id of run.team) {
      const available = [
        "",
        ...run.bag.filter(
          (item) =>
            !run!.team.some(
              (other) => other !== id && run!.equipment[other]?.includes(item),
            ),
        ),
      ];
      const best = available.sort(
        (a, b) =>
          score({
            ...loanUnit(id, b, run!.levels[id]),
            equipmentLevels: run!.itemLevels,
          }) -
          score({
            ...loanUnit(id, a, run!.levels[id]),
            equipmentLevels: run!.itemLevels,
          }),
      )[0];
      run = equipRunItem(run, id, best);
    }
  }
}
const samples = [
  ["char_01", "char_08", "char_15"],
  ["char_05", "char_16", "char_09"],
  ["char_02", "char_07", "char_04"],
  ["char_22", "char_24", "char_13"],
] as CharacterId[][];
const synergies = samples.map((ids) => {
  const pairs = Array.from({ length: 6 }, (_, i) => {
    const cfg = adventureConfig(
      ids.map((id) => loanUnit(id)),
      ["char_14", "char_18", "char_21"].map((id) =>
        loanUnit(id as CharacterId),
      ),
    );
    const enabled = simulate(cfg, i + 1),
      disabled = simulate(cfg, i + 1, true);
    return {
      enabledWin: enabled.won,
      disabledWin: disabled.won,
      activations: enabled.s.events.filter(
        (e) =>
          e.type.startsWith("resonance:") &&
          enabled.s.fighters[e.source].team === "team-player",
      ).length,
    };
  });
  return {
    team: ids,
    enabledWins: pairs.filter((p) => p.enabledWin).length,
    disabledWins: pairs.filter((p) => p.disabledWin).length,
    activations: pairs.reduce((n, p) => n + p.activations, 0),
    seeds: pairs.length,
  };
});
const report = {
  runs,
  meanFloor: runs.reduce((n, r) => n + r.floors, 0) / runs.length,
  clears: runs.filter((r) => r.won).length,
  synergies,
};
writeFileSync(
  "reports/adventure-v2-audit.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report));
