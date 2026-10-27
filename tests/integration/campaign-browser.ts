import assert from "node:assert/strict";
import { chromium } from "playwright";
import { campaignEncounter } from "../../packages/shared/src/campaign";
import {
  createBattle,
  stepBattle,
  calculateStateHash,
  type BattleConfig,
} from "../../packages/battle-engine/src/index";
import {
  DEFAULT_ARENA_SIZE,
  DEFAULT_SHRINK_SECONDS,
} from "../../packages/shared/src/arena";

const cases = [1, 6, 11, 21, 31, 61, 101, 109, 110, 999].flatMap((stage) =>
  [1, 2, 3].map((size) => ({ stage, size })),
);
const expected = cases.map(({ stage, size }) => campaignEncounter(stage, size));
const battles = [1, 31, 61, 109, 110, 999].map((stage) => {
  const loadouts = campaignEncounter(stage, 3).loadouts;
  const config: BattleConfig = {
    width: DEFAULT_ARENA_SIZE,
    height: DEFAULT_ARENA_SIZE,
    shrinkSeconds: DEFAULT_SHRINK_SECONDS,
    teams: [
      { id: "a", loadouts },
      { id: "b", loadouts },
    ],
    campaign: { stage, enemyTeamId: "b" },
  };
  const state = createBattle(config, stage + 37);
  while (!state.finished && state.tick < 1800) stepBattle(state);
  assert.ok(state.finished);
  return { config, seed: stage + 37, hash: calculateStateHash(state) };
});
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript({
    content: "window.__name = function(fn) { return fn; };",
  });
  await page.goto("http://127.0.0.1:5173/");
  const root = `/@fs/${process.cwd().replaceAll("\\", "/")}/packages`;
  const result = await page.evaluate(
    async ({ root, cases, battles }) => {
      const campaignPath = `${root}/shared/src/campaign.ts`;
      const enginePath = `${root}/battle-engine/src/index.ts`;
      const [campaign, engine] = await Promise.all([
        import(campaignPath),
        import(enginePath),
      ]);
      return {
        encounters: cases.map(({ stage, size }) =>
          campaign.campaignEncounter(stage, size),
        ),
        hashes: battles.map(({ config, seed }) => {
          const state = engine.createBattle(config, seed);
          while (!state.finished && state.tick < 1800) engine.stepBattle(state);
          return engine.calculateStateHash(state);
        }),
      };
    },
    { root, cases, battles },
  );
  assert.deepEqual(
    result.encounters,
    expected,
    "Campaign generation differs between Node and Chromium",
  );
  assert.deepEqual(
    result.hashes,
    battles.map((b) => b.hash),
    "Campaign battle parity failed",
  );
  assert.deepEqual(errors, [], "Browser errors");
  console.log(
    JSON.stringify({
      encounters: cases.length,
      completedBattleHashes: battles.length,
      browserErrors: errors.length,
    }),
  );
} finally {
  await browser.close();
}
