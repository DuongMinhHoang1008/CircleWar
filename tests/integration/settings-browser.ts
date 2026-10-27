import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
import {
  createBattle,
  rosterConfig,
  stepBattle,
  captureReplayFrame,
  ENGINE_VERSION,
  applyStatus,
} from "../../packages/battle-engine/src/index";
import { characterDamage } from "../../packages/battle-engine/src/character-combat";
import {
  ANALYTICS_KEY,
  createBattleRecorder,
} from "../../apps/web/src/battleAnalytics";

const config = rosterConfig(2);
config.teams[0].loadouts[0].characterId = "char_05";
config.teams[1].loadouts[0].characterId = "char_14";
const state = createBattle(config, 47);
for (const fighter of state.fighters) {
  fighter.hp = fighter.baseStats.hp = fighter.stats.hp = 5000;
  fighter.energy = 100;
}
applyStatus(state, state.fighters[0], state.fighters[1], "burn", 20, 450);
applyStatus(state, state.fighters[0], state.fighters[1], "poison", 10, 450);
applyStatus(state, state.fighters[1], state.fighters[1], "blessing", 10, 450);
const frames = [captureReplayFrame(state)];
while (state.tick < 450 && !state.finished) {
  stepBattle(state);
  if (state.tick % 30 === 0) {
    const fighter = state.fighters[1],
      amount = 3;
    const temporary = state.tick % 60 === 0;
    fighter.shield += amount;
    fighter.shields.push({
      amount,
      source: fighter.id,
      until: state.tick + (temporary ? 900000 : 60),
    });
    state.events.push({
      tick: state.tick,
      type: "shield",
      source: fighter.id,
      target: fighter.id,
      amount,
      shieldKind: temporary ? "temporaryHp" : "shield",
    });
  }
  if (state.tick % 10 === 0)
    characterDamage(
      state,
      state.fighters[0],
      state.fighters[1],
      50,
      false,
      0,
      false,
      true,
    );
  frames.push(captureReplayFrame(state));
}
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
  });
  const urls: string[] = [],
    errors: string[] = [];
  page.on("request", (request) => urls.push(request.url()));
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript({
    content: "window.__name = function(fn) { return fn; };",
  });
  await page.goto("http://127.0.0.1:5173/");
  async function openSettings() {
    for (let i = 0; i < 4; i++) {
      const close = page.getByRole("button", {
        name: "Đóng thông báo",
        exact: true,
      });
      if (await close.isVisible()) await close.click();
      else break;
    }
    await page.getByRole("button", { name: "Mở menu điều hướng" }).click();
    await page
      .locator(".drawer-nav")
      .getByRole("button", { name: "Cài đặt", exact: true })
      .click();
  }
  await page.locator(".gift-modal").waitFor();
  await openSettings();
  const effects = page.getByRole("switch", {
    name: "Hiện hiệu ứng",
    exact: true,
  });
  const numbers = page.getByRole("switch", {
    name: "Hiện sát thương",
    exact: true,
  });
  const reduced = page.getByRole("switch", {
    name: "Giảm hiệu ứng",
    exact: true,
  });
  const sound = page.getByRole("switch", { name: "Âm thanh", exact: true });
  assert.ok(await effects.isChecked());
  assert.equal(await numbers.isChecked(), false);
  assert.ok(
    await page
      .getByRole("switch", { name: "Hiện hồi phục và khiên", exact: true })
      .isChecked(),
  );
  await effects.uncheck();
  assert.ok(await reduced.isDisabled());
  await numbers.uncheck();
  await sound.check();
  await page
    .getByRole("button", { name: "Âm thanh: Bật", exact: true })
    .waitFor();
  await page.reload();
  await openSettings();
  assert.equal(await effects.isChecked(), false);
  assert.equal(await numbers.isChecked(), false);
  assert.equal(await sound.isChecked(), true);
  await effects.check();
  await numbers.check();
  await sound.uncheck();
  mkdirSync("test-results", { recursive: true });
  await page.screenshot({
    path: "test-results/settings-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: "test-results/settings-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 1000 });
  const deps = Object.fromEntries(
    ["react.js", "react-dom_client.js", "pixi__js.js"].map((name) => [
      name,
      urls.find((url) => url.includes(`/${name}?`))!,
    ]),
  );
  await page.evaluate(
    async ({ config, frames, version, deps }) => {
      const arenaPath = "/src/rendering/Arena.tsx";
      const [{ default: React }, { default: ReactDOM }, pixi, { Arena }] =
        await Promise.all([
          import(deps["react.js"]),
          import(deps["react-dom_client.js"]),
          import(deps["pixi__js.js"]),
          import(arenaPath),
        ]);
      const target = window as any;
      target.arenaInitializations = 0;
      const init = pixi.Application.prototype.init;
      pixi.Application.prototype.init = async function (
        this: any,
        options: unknown,
      ) {
        await init.call(this, options);
        target.displayTestApp = this;
        target.arenaInitializations++;
      };
      document.body.innerHTML =
        '<div id="display-test" style="max-width:900px;margin:20px auto"></div>';
      const root = ReactDOM.createRoot(document.getElementById("display-test"));
      const replay = {
        format: 1,
        version,
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
      target.setDisplay = (
        showEffects: boolean,
        showDamage: boolean,
        showRecovery = false,
      ) =>
        root.render(
          React.createElement(Arena, {
            config,
            seed: 47,
            replay,
            loadReplayChunk: async () => frames,
            muted: true,
            low: false,
            showEffects,
            showDamage,
            showRecovery,
            onError: (error: string) => {
              throw Error(error);
            },
          }),
        );
      target.readDisplay = () => {
        const layers = target.displayTestApp?.stage.children || [];
        const damage =
          layers
            .find((l: any) => l.label === "damage")
            ?.children.filter((n: any) => n.visible && n.alpha > 0.05)
            .map((n: any) => ({
              text: n.text,
              color: n.style.fill,
              x: n.x,
              y: n.y,
            })) || [];
        const combat = layers.find((l: any) => l.label === "combat");
        return {
          damage,
          trailsVisible: combat?.children.find(
            (n: any) => n.label === "weapon-trails",
          )?.visible,
          physicalNodes:
            combat?.children.filter((n: any) => n.visible).length || 0,
          bodiesVisible: layers.find((l: any) => l.label === "bodies")?.visible,
          initializations: target.arenaInitializations,
        };
      };
      target.setDisplay(true, true);
    },
    { config, frames, version: ENGINE_VERSION, deps },
  );
  await page.waitForFunction(
    () => (window as any).readDisplay().damage.length > 0,
  );
  const shown = await page.evaluate(() => (window as any).readDisplay());
  assert.ok(shown.damage.every((n: { text: string }) => /−\d+$/.test(n.text)));
  assert.ok(shown.damage.length <= 64);
  await page.waitForFunction(() => {
    const numbers = (window as any).readDisplay().damage;
    return (
      numbers.some(
        (n: any) => n.text.startsWith("Burn ") && n.color === 0xffa04d,
      ) &&
      numbers.some(
        (n: any) => n.text.startsWith("Poison ") && n.color === 0x89ed83,
      )
    );
  });
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll(".fighter-damage")).some((node) =>
      /ST gây: [1-9]/.test(node.textContent || ""),
    ),
  );
  await page.screenshot({
    path: "test-results/damage-numbers.png",
    fullPage: true,
  });
  await page.evaluate(() => (window as any).setDisplay(false, true));
  await page.waitForFunction(
    () =>
      (window as any).readDisplay().trailsVisible === false &&
      (window as any).readDisplay().damage.length > 0,
  );
  const clean = await page.evaluate(() => (window as any).readDisplay());
  assert.ok(clean.bodiesVisible && clean.physicalNodes > 0);
  await page.evaluate(() => (window as any).setDisplay(false, false));
  await page.waitForFunction(
    () => (window as any).readDisplay().damage.length === 0,
  );
  assert.ok(
    (await page.locator(".fighter-damage").allTextContents()).some((text) =>
      /ST gây: [1-9]/.test(text),
    ),
  );
  await page.evaluate(() => (window as any).setDisplay(false, false, true));
  await page.waitForFunction(() => {
    const numbers = (window as any).readDisplay().damage;
    return (
      numbers.some((n: any) => /^HP \+\d+$/.test(n.text)) &&
      numbers.some((n: any) => /^(Khiên|Máu ảo) \+\d+$/.test(n.text))
    );
  });
  assert.ok(
    (await page.evaluate(() => (window as any).readDisplay().damage)).every(
      (n: { text: string }) => !n.text.includes("−"),
    ),
  );
  await page.screenshot({
    path: "test-results/recovery-numbers.png",
    fullPage: true,
  });
  await page.waitForFunction(() => (window as any).readDisplay().damage.some((n: any) => /^Máu ảo \+\d+$/.test(n.text) && n.color === 0xc1a0ff));
  await page.screenshot({ path: "test-results/temporary-hp-numbers.png", fullPage: true });
  await page.evaluate(() => (window as any).setDisplay(true, true));
  await page.waitForFunction(
    () =>
      (window as any).readDisplay().damage.length > 0 &&
      (window as any).readDisplay().trailsVisible === true,
  );
  assert.equal(
    await page.evaluate(() => (window as any).readDisplay().initializations),
    1,
    "Changing display preferences restarted the battle",
  );
  const record = {
    ...createBattleRecorder().finish(state, config, config.teams[0].id),
    id: "display-stats-test",
    mode: "simulation",
    savedAt: Date.now(),
  };
  await page.evaluate(
    ({ key, record }) => localStorage.setItem(key, JSON.stringify([record])),
    { key: ANALYTICS_KEY, record },
  );
  await page.goto("http://127.0.0.1:5173/");
  await page.getByRole("button", { name: "Mở menu điều hướng" }).click();
  await page
    .locator(".drawer-nav")
    .getByRole("button", { name: "Phân tích số liệu", exact: true })
    .click();
  await page
    .getByRole("columnheader", { name: "ST gây ra", exact: true })
    .waitFor();
  await page
    .getByRole("columnheader", { name: "ST nhận vào", exact: true })
    .waitFor();
  await page
    .getByRole("cell", {
      name: record.units[0].combat!.damage.toLocaleString("vi-VN"),
      exact: true,
    })
    .first()
    .waitFor();
  await page.locator(".analytics-history > details > summary").click();
  await page
    .getByText(
      `ST gây: ${record.units[0].combat!.damage.toLocaleString("vi-VN")} · ST nhận: ${record.units[0].combat!.taken.toLocaleString("vi-VN")}`,
      { exact: true },
    )
    .waitFor();
  await page.screenshot({
    path: "test-results/damage-analytics.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: settings persistence, shared sound toggle, mobile layout, animated damage, independent effects/damage switches and no battle restart.",
  );
} finally {
  await browser.close();
}
