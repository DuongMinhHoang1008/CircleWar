import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

// Recorded fixtures keep positions fixed while exercising real VFX playback.
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => {
    errors.push(e.message);
    console.error(e.message);
  });
  const enginePath = `${process.cwd().replaceAll("\\", "/")}/packages/battle-engine/src/index.ts`;
  await page.route("**/combat-preview", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html><body><div id="root"></div>
    <script type="module">
      import React from '/node_modules/.vite/deps/react.js';
      import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
      import RefreshRuntime from '/@react-refresh';
      import { rosterConfig, createBattle, captureReplayFrame, ENGINE_VERSION } from '/@fs/${enginePath}';
      import '/src/styles.css';
      import '/src/catalog.css';
      RefreshRuntime.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const { Arena } = await import('/src/rendering/Arena.tsx');
      const config = rosterConfig(25);
      const state = createBattle(config, 24);
      state.fighters.forEach((f, i) => {
        f.x = 7000 + (i % 5) * 14000;
        f.y = 7000 + Math.floor(i / 5) * 14000;
        f.angle = 0;
      });
      state.projectiles = [undefined, 'skill', 'super'].map((kind, i) => ({
        id: i, owner: 4, x: 18000 + i * 15000, y: 14000,
        vx: 900, vy: 0, life: 20, pierce: 0, hit: [], normal: !kind, kind,
      }));
      state.fighters[6].buffs = [{kind: 'burnDot', value: 2, until: 900, source: 0}];
      state.fighters[7].slowUntil = 900;
      state.fighters[8].buffs = [{kind: 'electric', value: 25, until: 900, source: 8}];
      state.fighters[10].shield = 35;
      const frames = [];
      for (let tick = 0; tick <= 600; tick += 3) {
        state.tick = tick;
        if (tick % 24 === 0) {
          state.events = [
            {type: 'shield', source: 0, target: 0},
            {type: 'super', source: 4, target: 4},
            {type: 'passive:char_07', source: 6, target: 6},
            {type: 'heal', source: 10, target: 10},
            {type: 'hit', source: 11, target: 12},
            {type: 'skill:16', source: 15, target: 15},
            {type: 'clash', source: 17, target: 18},
          ].map(e => ({...e, tick, amount: 12}));
        }
        frames.push(captureReplayFrame(state));
      }
      const replay = {
        format: 1, version: ENGINE_VERSION, game: 1, round: 1, config,
        configHash: '', finalHash: '', totalTicks: 600, start: Date.now(),
        chunks: [{index: 0, fromTick: 0, toTick: 600, count: frames.length, hash: '', bytes: 0}],
      };
      ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Arena, {
        config, seed: 24, replay, loadReplayChunk: async () => frames,
        muted: true, low: false, label: 'COMBAT VISUAL CHECK · #01–25',
        onError: message => { throw Error(message); },
      }));
    </script></body></html>`,
    }),
  );
  await page.goto("http://127.0.0.1:5173/combat-preview");
  await page.waitForFunction(
    () => document.querySelectorAll(".fighter-token").length === 25,
  );
  await page.locator("canvas").waitFor();
  const canvas = await page.locator("canvas").boundingBox();
  assert.ok(canvas && Math.abs(canvas.width - canvas.height) < 1);
  const atlas = await page.request.get(
    "http://127.0.0.1:5173/effects/combat-fx.svg",
  );
  assert.equal(atlas.status(), 200);
  assert.equal(((await atlas.text()).match(/<svg x=/g) || []).length, 64);
  await page.waitForFunction(() => {
    const tick = Number(
      document
        .querySelector(".arena-bottom")
        ?.textContent?.match(/tick (\d+)/)?.[1] || 0,
    );
    return tick > 24 && tick % 24 >= 6 && tick % 24 <= 16;
  });
  mkdirSync("reports", { recursive: true });
  await page
    .locator(".canvas-mount")
    .screenshot({ path: "reports/combat-fx-square-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator(".canvas-mount")
    .screenshot({ path: "reports/combat-fx-square-mobile.png" });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: square arena, 64-frame atlas, animated hits/Super/passives/healing/shields/statuses/projectiles; no browser errors.",
  );
} finally {
  await browser.close();
}
