import { writeFileSync, mkdirSync } from "node:fs";
import { performance } from "node:perf_hooks";
import {
  calculateStateHash,
  createBattle,
  rosterConfig,
  ENGINE_VERSION,
  runBattle,
  serializeBattleState,
  stepBattle,
} from "../../packages/battle-engine/src/index";
import { pairs } from "../../packages/battle-engine/src/physics";
const rows = [];
runBattle({ ...rosterConfig(10), shrinkSeconds: 2 }, 1);
for (const count of [2, 10, 20, 40, 60]) {
  const config = rosterConfig(count),
    cpu = process.cpuUsage(),
    start = performance.now(),
    s = runBattle(config, 12345),
    wall = performance.now() - start,
    used = process.cpuUsage(cpu);
  const b = createBattle(config, 12345);
  let maxBatch = 0;
  while (!b.finished) {
    const t = performance.now();
    for (let i = 0; i < 120 && !b.finished; i++) stepBattle(b);
    maxBatch = Math.max(maxBatch, performance.now() - t);
  }
  const grid = pairs(createBattle(config, 12345).fighters).length;
  rows.push({
    fighters: count,
    ticks: s.tick,
    wallMs: +wall.toFixed(2),
    cpuMs: +((used.user + used.system) / 1000).toFixed(2),
    ticksPerSecond: Math.round((s.tick / wall) * 1000),
    maxBatchMs: +maxBatch.toFixed(2),
    heapMB: +(process.memoryUsage().heapUsed / 1048576).toFixed(2),
    snapshotBytes: Buffer.byteLength(serializeBattleState(s)),
    gridPairs: grid,
    naivePairs: (count * (count - 1)) / 2,
    hash: calculateStateHash(s),
  });
}
mkdirSync("reports", { recursive: true });
writeFileSync(
  "reports/benchmark.json",
  JSON.stringify(
    {
      runtime: process.version,
      engineVersion: ENGINE_VERSION,
      characterPool: 20,
      platform: process.platform,
      measuredAt: new Date().toISOString(),
      note: "Node process CPU and wall time; not Cloudflare production CPU. Heap is process total, not per battle.",
      rows,
    },
    null,
    2,
  ),
);
console.table(rows);
