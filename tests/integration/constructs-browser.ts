import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import {
  createBattle,
  rosterConfig,
  stepBattle,
  calculateStateHash,
  captureReplayFrame,
  type Construct,
} from "../../packages/battle-engine/src/index";

const samples = [2, 10, 20, 40, 60].map((count, i) => {
  const config = rosterConfig(count);
  config.teams[0].loadouts[0] = {
    characterId: "char_14",
    classId: "guardian",
    level: 7,
    equipment: [],
  };
  const initial = createBattle(config, 31 + i);
  for (const fighter of initial.fighters) fighter.energy = 100;
  const final = structuredClone(initial);
  while (!final.finished && final.tick < 1500) stepBattle(final);
  return { initial, hash: calculateStateHash(final) };
});
const config = rosterConfig(2);
config.width = 96000;
config.height = 64000;
config.teams[0].loadouts[0] = {
  characterId: "char_14",
  classId: "guardian",
  level: 7,
  equipment: [],
};
const preview = createBattle(config, 91);
preview.fighters.forEach((f, i) => {
  f.x = 24000 + i * 48000;
  f.y = 20000;
  f.nextAttack = 9999;
  f.skillReady = 9999;
});
const kinds: Construct["kind"][] = ["minion", "giant", "turret"];
preview.constructs = kinds.map((kind, i) => ({
  id: i,
  owner: 0,
  kind,
  x: 30000 + i * 16000,
  y: 40000,
  vx: kind === "turret" ? 0 : 260,
  vy: kind === "turret" ? 0 : 100,
  radius: kind === "giant" ? 1900 : 1100,
  hp: 1000,
  maxHp: 1000,
  damage: 1,
  until: 900,
  nextAttack: 9999,
}));
preview.nextConstruct = 3;
const frames = [captureReplayFrame(preview)];
while (!preview.finished && preview.tick < 180) {
  stepBattle(preview);
  frames.push(captureReplayFrame(preview));
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
  });
  // tsx names functions in serialized Playwright callbacks using this helper.
  await page.addInitScript({
    content: "window.__name = function(fn) { return fn; };",
  });
  const urls: string[] = [],
    errors: string[] = [];
  page.on("request", (request) => urls.push(request.url()));
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:5173/");
  const deps = Object.fromEntries(
    ["react.js", "react-dom_client.js", "pixi__js.js"].map((name) => [
      name,
      urls.find((url) => url.includes(`/${name}?`))!,
    ]),
  );
  const enginePath = `/@fs/${process.cwd().replaceAll("\\", "/")}/packages/battle-engine/src/index.ts`;
  const hashes = await page.evaluate(
    async ({ deps, enginePath, samples, frames, config }) => {
      const arenaPath = "/src/rendering/Arena.tsx";
      const [
        { default: React },
        { default: ReactDOM },
        pixi,
        { Arena },
        engine,
      ] = await Promise.all([
        import(deps["react.js"]),
        import(deps["react-dom_client.js"]),
        import(deps["pixi__js.js"]),
        import(arenaPath),
        import(enginePath),
      ]);
      const hashes = samples.map(({ initial }) => {
        const state = structuredClone(initial);
        while (!state.finished && state.tick < 1500) engine.stepBattle(state);
        return engine.calculateStateHash(state) as string;
      });
      const target = window as typeof window & {
        constructApp?: InstanceType<typeof pixi.Application>;
      };
      const init = pixi.Application.prototype.init;
      pixi.Application.prototype.init = async function (
        this: any,
        options: unknown,
      ) {
        await init.call(this, options);
        target.constructApp = this;
      };
      document.body.innerHTML =
        '<div id="construct-test" style="max-width:1000px;margin:20px auto"></div>';
      const replay = {
        format: 1,
        version: engine.ENGINE_VERSION,
        config,
        configHash: "",
        game: 1,
        round: 1,
        start: Date.now(),
        totalTicks: frames.at(-1)!.tick,
        chunks: [
          {
            index: 0,
            fromTick: 0,
            toTick: frames.at(-1)!.tick,
            count: frames.length,
            hash: "",
            bytes: 0,
          },
        ],
        finalHash: "",
      };
      ReactDOM.createRoot(document.getElementById("construct-test")).render(
        React.createElement(Arena, {
          config,
          seed: 91,
          replay,
          muted: true,
          low: false,
          onError: (message: string) => {
            throw Error(message);
          },
          loadReplayChunk: async () => frames,
        }),
      );
      return hashes;
    },
    { deps, enginePath, samples, frames, config },
  );
  assert.deepEqual(
    hashes,
    samples.map((sample) => sample.hash),
    "Node/Chromium construct physics diverged",
  );
  await page.waitForFunction(() => {
    const app = (window as any).constructApp;
    return (
      app?.stage.children
        .find((layer: any) => layer.label === "bodies")
        ?.children.filter(
          (node: any) => node.visible && node.label?.endsWith("-portrait"),
        ).length === 3
    );
  });
  const readNodes = () =>
    page.evaluate(() => {
      const bodies = (window as any).constructApp.stage.children.find(
        (layer: any) => layer.label === "bodies",
      );
      return bodies.children
        .filter(
          (node: any) => node.visible && node.label?.endsWith("-portrait"),
        )
        .map((node: any) => ({
          label: node.label,
          masked: !!node.mask,
          x: node.x,
          y: node.y,
        }));
    });
  const before = await readNodes();
  await page.waitForTimeout(250);
  const after = await readNodes();
  assert.ok(
    after.every((node: { masked: boolean }) => node.masked),
    "All summons and turrets must use circular portrait masks",
  );
  assert.deepEqual(
    after.find((node: { label: string }) => node.label === "turret-portrait"),
    before.find((node: { label: string }) => node.label === "turret-portrait"),
    "Turret moved during replay",
  );
  mkdirSync("test-results", { recursive: true });
  await page
    .locator("canvas")
    .screenshot({ path: "test-results/constructs-round.png" });
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      paritySamples: hashes.length,
      nodes: after,
      pageErrors: errors,
    }),
  );
} finally {
  await browser.close();
}
