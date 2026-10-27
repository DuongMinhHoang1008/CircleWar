import { spawn } from "node:child_process";
import { writeRosterReport } from "./roster-report";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  ROSTER,
  CATALOG_ITEMS,
  character,
  type CharacterId,
} from "../../packages/shared/src/catalog";
import { CHARACTER_BALANCE } from "../../packages/shared/src/combat-balance";
import {
  DEFAULT_ARENA_SIZE,
  DEFAULT_SHRINK_SECONDS,
} from "../../packages/shared/src/arena";
import {
  createBattle,
  stepBattle,
  combatMetrics,
  emptyCombatMetrics,
  ENGINE_VERSION,
  type Fighter,
} from "../../packages/battle-engine/src/index";
import type { Loadout } from "../../packages/shared/src/balance";

const phases = [
  { id: "solo-1-bare", mode: "solo", level: 1, gear: false },
  { id: "solo-1-affinity", mode: "solo", level: 1, gear: true },
  { id: "solo-10-bare", mode: "solo", level: 10, gear: false },
  { id: "solo-10-affinity", mode: "solo", level: 10, gear: true },
  { id: "team-1-affinity", mode: "team", level: 1, gear: true },
  { id: "team-10-affinity", mode: "team", level: 10, gear: true },
  { id: "ffa-10-affinity", mode: "ffa", level: 10, gear: true },
] as const;
type Phase = (typeof phases)[number];
const phaseId = process.argv[process.argv.indexOf("--phase") + 1];
const seedOffset = Number(process.env.ROSTER_AUDIT_SEED_OFFSET || 0);
const variant = process.env.ROSTER_AUDIT_VARIANT || "";
if (variant && !/^[a-z-]+$/.test(variant)) throw Error("Invalid audit variant");
mkdirSync("test-results", { recursive: true });
const loadout = (id: string, phase: Phase): Loadout => {
  const item = CATALOG_ITEMS.find((item) => item.affinity === id)!.id;
  return {
    characterId: id as CharacterId,
    classId: character(id)!.base as Loadout["classId"],
    level: phase.level,
    equipment: phase.gear ? [item] : [],
    equipmentLevels: phase.gear ? { [item]: phase.level } : {},
  };
};
const zero = (id: string) => ({
  id,
  name: character(id)!.name,
  role: CHARACTER_BALANCE[id as CharacterId].role,
  matches: 0,
  games: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  survived: 0,
  stalled: 0,
  ticks: 0,
  aliveTicks: 0,
  damage: 0,
  taken: 0,
  support: emptyCombatMetrics(),
});
type Row = ReturnType<typeof zero>;
function add(
  row: Row,
  fighter: Fighter,
  ticks: number,
  winner: string | undefined,
  finished: boolean,
) {
  row.matches++;
  if (!finished) {
    row.stalled++;
    return;
  }
  row.games++;
  row.wins += Number(winner === fighter.team);
  row.losses += Number(winner !== undefined && winner !== fighter.team);
  row.draws += Number(winner === undefined);
  row.survived += Number(fighter.hp > 0);
  row.ticks += ticks;
  row.aliveTicks += fighter.deadAt < 0 ? ticks : fighter.deadAt;
  row.damage += fighter.dealt;
  row.taken += fighter.taken;
  const metrics = combatMetrics(fighter);
  for (const key of Object.keys(metrics) as (keyof typeof metrics)[]) {
    if (typeof metrics[key] === "number")
      (row.support[key] as number) += metrics[key] as number;
    else {
      const into = row.support[key] as Record<string, number>,
        from = metrics[key] as Record<string, number>;
      for (const [kind, amount] of Object.entries(from))
        into[kind] = (into[kind] || 0) + amount;
    }
  }
}
function summarize(row: Row) {
  const n = Math.max(1, row.games),
    rate = row.wins / n;
  const z = 1.96,
    den = 1 + (z * z) / n;
  const mid = (rate + (z * z) / (2 * n)) / den,
    half =
      (z * Math.sqrt((rate * (1 - rate)) / n + (z * z) / (4 * n * n))) / den;
  const round = (value: number) => +value.toFixed(2);
  return {
    ...row,
    winRate: round(100 * rate),
    lossRate: round((100 * row.losses) / n),
    drawRate: round((100 * row.draws) / n),
    survivalRate: round((100 * row.survived) / n),
    winInterval95: [
      round(100 * Math.max(0, mid - half)),
      round(100 * Math.min(1, mid + half)),
    ],
    averageDamage: round(row.damage / n),
    averageTaken: round(row.taken / n),
    dps: round((row.damage * 30) / Math.max(1, row.ticks)),
    averageAliveSeconds: round(row.aliveTicks / n / 30),
    averageSeconds: round(row.ticks / n / 30),
    allyHealing: round(row.support.allyHealing / n),
    selfHealing: round((row.support.healing - row.support.allyHealing) / n),
    allyShielding: round(row.support.allyShielding / n),
    allyShieldAbsorbed: round(row.support.allyShieldAbsorbed / n),
    controlSeconds: round(row.support.controlTicks / n / 30),
    allyBuffSeconds: round(row.support.allyBuffTicks / n / 30),
    buffs: round(row.support.buffsApplied / n),
    debuffs: round(row.support.debuffsApplied / n),
    friendlyDamage: round(row.support.friendlyDamage / n),
  };
}
if (process.argv.includes("--phase")) {
  const phase = phases.find((p) => p.id === phaseId);
  if (!phase) throw Error(`Unknown phase ${phaseId}`);
  const rows = new Map(ROSTER.map((c) => [c.id as string, zero(c.id)]));
  const pairs = new Map<
    string,
    {
      a: string;
      b: string;
      aWins: number;
      bWins: number;
      draws: number;
      games: number;
    }
  >();
  const stalled: unknown[] = [];
  let battles = 0;
  function match(
    teams: { id: string; loadouts: Loadout[] }[],
    seed: number,
    pair?: [string, string],
  ) {
    const s = createBattle(
      {
        width: DEFAULT_ARENA_SIZE,
        height: DEFAULT_ARENA_SIZE,
        shrinkSeconds: DEFAULT_SHRINK_SECONDS,
        teams,
      },
      seed + seedOffset,
    );
    while (!s.finished && s.tick < 5400) stepBattle(s);
    const alive = [
      ...new Set(s.fighters.filter((f) => f.hp > 0).map((f) => f.team)),
    ];
    const winner = s.finished && alive.length === 1 ? alive[0] : undefined;
    for (const f of s.fighters)
      if (phase!.mode !== "team" || f.slot === 0)
        add(rows.get(f.characterId!)!, f, s.tick, winner, s.finished);
    if (!s.finished)
      stalled.push({ seed: seed + seedOffset, teams, tick: s.tick });
    if (pair && s.finished) {
      const [a, b] = [...pair].sort(),
        key = `${a}:${b}`;
      const entry = pairs.get(key) || {
        a,
        b,
        aWins: 0,
        bWins: 0,
        draws: 0,
        games: 0,
      };
      entry.games++;
      if (!winner) entry.draws++;
      else {
        const winningCard = teams.find((t) => t.id === winner)!.loadouts[0]
          .characterId;
        if (winningCard === a) entry.aWins++;
        else entry.bWins++;
      }
      pairs.set(key, entry);
    }
    battles++;
    if (battles % 264 === 0)
      console.log(
        `${phase!.id}: ${battles} battles; stalled ${stalled.length}`,
      );
  }
  if (phase.mode === "solo") {
    for (let a = 0; a < ROSTER.length; a++)
      for (let b = a + 1; b < ROSTER.length; b++)
        for (const seed of [73, 211])
          for (const mirrored of [false, true]) {
            const left = ROSTER[mirrored ? b : a].id,
              right = ROSTER[mirrored ? a : b].id;
            match(
              [
                { id: "a", loadouts: [loadout(left, phase)] },
                { id: "b", loadouts: [loadout(right, phase)] },
              ],
              seed,
              [left, right],
            );
          }
  } else if (phase.mode === "team") {
    const contexts = [
      ["char_15", "char_12"],
      ["char_05", "char_16"],
      ["char_11", "char_22"],
    ];
    for (let context = 0; context < contexts.length; context++)
      for (let a = 0; a < ROSTER.length; a++)
        for (const offset of [1, 4, 8, 12]) {
          const left = ROSTER[a].id,
            right = ROSTER[(a + offset * 5) % ROSTER.length].id;
          const allies = [
            ...contexts[context],
            "char_04",
            "char_19",
            "char_21",
            "char_24",
            "char_33",
          ]
            .filter(
              (id, index, list) =>
                id !== left && id !== right && list.indexOf(id) === index,
            )
            .slice(0, 2);
          for (const mirrored of [false, true])
            match(
              [
                {
                  id: "a",
                  loadouts: [
                    loadout(mirrored ? right : left, phase),
                    ...allies.map((id) => loadout(id, phase)),
                  ],
                },
                {
                  id: "b",
                  loadouts: [
                    loadout(mirrored ? left : right, phase),
                    ...allies.map((id) => loadout(id, phase)),
                  ],
                },
              ],
              997 + offset * 19 + context * 131,
            );
        }
  } else {
    let layoutSeed = 42471;
    const next = () =>
      (layoutSeed = (Math.imul(layoutSeed, 1664525) + 1013904223) >>> 0);
    for (let layout = 0; layout < 12; layout++) {
      const roster = ROSTER.map((c) => c.id);
      for (let i = roster.length - 1; i > 0; i--) {
        const j = next() % (i + 1);
        [roster[i], roster[j]] = [roster[j], roster[i]];
      }
      for (let start = 0; start < roster.length; start++) {
        const ids = Array.from(
          { length: 6 },
          (_, i) => roster[(start + i) % roster.length],
        );
        for (let rotation = 0; rotation < 6; rotation++)
          match(
            ids.map((_, i) => ({
              id: `team-${i}`,
              loadouts: [loadout(ids[(i + rotation) % ids.length], phase)],
            })),
            1597 + layout * 7919 + start * 17,
          );
      }
    }
  }

  const result = {
    ...phase,
    seedOffset,
    battles,
    stalled,
    characters: [...rows.values()].map(summarize),
    pairs: [...pairs.values()],
  };
  writeFileSync(
    `test-results/roster-${phase.id}${variant ? `-${variant}` : ""}.json`,
    JSON.stringify(result),
  );
  console.log(
    `${phase.id}: DONE ${battles} battles, ${stalled.length} stalled`,
  );
} else {
  const queue = [...phases];
  async function runner() {
    while (queue.length) {
      const phase = queue.shift()!;
      await new Promise<void>((resolve, reject) => {
        const child = spawn(
          process.execPath,
          [
            "node_modules/tsx/dist/cli.mjs",
            "tests/performance/roster-audit.ts",
            "--phase",
            phase.id,
          ],
          { stdio: "inherit", windowsHide: true },
        );
        child.on("error", reject);
        child.on("exit", (code) =>
          code === 0 ? resolve() : reject(Error(`${phase.id} failed: ${code}`)),
        );
      });
    }
  }
  if (!process.argv.includes("--aggregate-only")) {
    await Promise.all([runner(), runner()]);
    await Promise.all(
      ["solo-10-affinity", "team-10-affinity"].map(
        (id) =>
          new Promise<void>((resolve, reject) => {
            const child = spawn(
              process.execPath,
              [
                "node_modules/tsx/dist/cli.mjs",
                "tests/performance/roster-audit.ts",
                "--phase",
                id,
              ],
              {
                stdio: "inherit",
                windowsHide: true,
                env: {
                  ...process.env,
                  ROSTER_AUDIT_SEED_OFFSET: "7919",
                  ROSTER_AUDIT_VARIANT: "holdout",
                },
              },
            );
            child.on("error", reject);
            child.on("exit", (code) =>
              code === 0
                ? resolve()
                : reject(Error(`${id} holdout failed: ${code}`)),
            );
          }),
      ),
    );
  }
  const results = phases.map((phase) =>
    JSON.parse(readFileSync(`test-results/roster-${phase.id}.json`, "utf8")),
  );
  const report = {
    engine: ENGINE_VERSION,
    measuredAt: new Date().toISOString(),
    arena: { size: DEFAULT_ARENA_SIZE, shrinkSeconds: DEFAULT_SHRINK_SECONDS },
    conditions:
      "Offline deterministic sample: all 33 cards, Lv1/Lv10 bare and affinity solo round robin, seeds 73/211 mirrored by actual team ids; matched 3v3 teammates across frontline/ranged/sustain contexts with mirrored sides; six-player FFA with rotated spawn ids. Team rows measure only the focal slot. 180s timeout; unfinished games never get a fabricated winner. Survival means HP > 0 at the end, including units on losing teams. Support separates allies from self; buff/control seconds are unique source-target ticks, not sum of overlapping statuses. Wilson intervals describe this sample and do not remove systematic matchup/seed bias.",
    battles: results.reduce((n, phase) => n + phase.battles, 0),
    stalled: results.reduce((n, phase) => n + phase.stalled.length, 0),
    phases: results,
  };
  mkdirSync("reports", { recursive: true });
  writeFileSync(
    "reports/roster-balance-v31.json",
    JSON.stringify(report, null, 2),
  );
  const summary = {
    ...report,
    phases: results.map(({ pairs, stalled, ...phase }) => ({
      ...phase,
      stalled: stalled.length,
    })),
  };
  writeFileSync("apps/web/public/balance-audit.json", JSON.stringify(summary));
  const columns = [
    "phase",
    "id",
    "name",
    "role",
    "games",
    "winRate",
    "lossRate",
    "drawRate",
    "survivalRate",
    "averageDamage",
    "averageTaken",
    "dps",
    "allyHealing",
    "selfHealing",
    "allyShielding",
    "allyShieldAbsorbed",
    "controlSeconds",
    "allyBuffSeconds",
    "buffs",
    "debuffs",
    "friendlyDamage",
    "stalled",
  ];
  const csv = [
    columns,
    ...results.flatMap((phase) =>
      phase.characters.map((row: Record<string, unknown>) =>
        columns.map((key) => (key === "phase" ? phase.id : row[key])),
      ),
    ),
  ]
    .map((row) =>
      row
        .map((value: unknown) => JSON.stringify(String(value ?? "")))
        .join(","),
    )
    .join("\n");
  writeFileSync("reports/roster-balance-v31.csv", "\ufeff" + csv);
  const final = writeRosterReport(report);
  console.log(
    JSON.stringify({
      battles: final.battles,
      stalled: final.stalled,
      phases: results.map((p) => ({
        id: p.id,
        top: [...p.characters]
          .sort((a, b) => b.winRate - a.winRate)
          .slice(0, 4)
          .map((r) => ({ id: r.id, winRate: r.winRate })),
      })),
    }),
  );
}
