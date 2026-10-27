import assert from "node:assert/strict";
import { readFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import {
  createBattle,
  stepBattle,
  captureReplayFrame,
  type BattleConfig,
} from "../../packages/battle-engine/src/index";
import { character } from "../../packages/shared/src/catalog";
import {
  ANALYTICS_KEY,
  createBattleRecorder,
} from "../../apps/web/src/battleAnalytics";
import type { Loadout } from "../../packages/shared/src/balance";

const unit = (id: string): Loadout => ({
  characterId: id as Loadout["characterId"],
  classId: character(id)!.base as Loadout["classId"],
  level: 7,
  equipment: [],
});
const config: BattleConfig = {
  width: 72000,
  height: 72000,
  shrinkSeconds: 20,
  teams: [
    { id: "a", loadouts: [unit("char_11"), unit("char_22")] },
    { id: "b", loadouts: [unit("char_14"), unit("char_27")] },
  ],
};
const state = createBattle(config, 91);
state.fighters.forEach((f, i) => {
  f.x = 30000 + i * 1800;
  f.y = 30000;
  f.energy = i === 0 ? 100 : 0;
  f.hp = Math.max(1, f.hp - 60);
});
const frames = [captureReplayFrame(state)];
for (let i = 0; i < 180 && !state.finished; i++) {
  stepBattle(state);
  frames.push(captureReplayFrame(state));
}
const recorder = createBattleRecorder();
recorder.replay(frames, state.fighters);
const summary = recorder.finish(state, config, "a", true);
assert.ok(summary.units[0].support!.allyHealing > 0);
assert.ok(summary.units[0].support!.allyShielding > 0);
assert.ok(summary.units[0].support!.controlTicks > 0);
const record = {
  ...summary,
  id: "support-browser",
  mode: "simulation",
  savedAt: Date.now(),
};
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(
    ({ key, record }) => localStorage.setItem(key, JSON.stringify([record])),
    { key: ANALYTICS_KEY, record },
  );
  await page.goto("http://127.0.0.1:5173/");
  await page.locator(".gift-modal").waitFor();
  for (let i = 0; i < 4; i++) {
    const close = page.getByRole("button", {
      name: "Đóng thông báo",
      exact: true,
    });
    if (await close.isVisible()) await close.click();
    else break;
  }
  async function navigate(name: string) {
    await page.getByRole("button", { name: "Mở menu điều hướng" }).click();
    await page
      .locator(".drawer-nav")
      .getByRole("button", { name, exact: true })
      .click();
  }
  await navigate("Phân tích số liệu");
  await page
    .getByRole("columnheader", { name: "Sống tới cuối", exact: true })
    .waitFor();
  await page
    .getByRole("columnheader", { name: "Hồi ĐĐ", exact: true })
    .waitFor();
  await page.locator(".analytics-history > details > summary").click();
  await page
    .getByText(
      `Hồi đồng đội: ${summary.units[0].support!.allyHealing.toLocaleString("vi-VN")} · Tự hồi: ${(summary.units[0].support!.healing - summary.units[0].support!.allyHealing).toLocaleString("vi-VN")}`,
      { exact: true },
    )
    .waitFor();
  await page.getByText("Hiệu ứng đã gây", { exact: true }).first().click();
  await page.locator(".analytics-effects ul").first().waitFor();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất JSON", exact: true }).click();
  const file = await download;
  const exported = JSON.parse(readFileSync((await file.path())!, "utf8"));
  assert.deepEqual(
    exported.records[0].units[0].support,
    summary.units[0].support,
  );
  mkdirSync("test-results", { recursive: true });
  await page.screenshot({
    path: "test-results/support-analytics-desktop.png",
    fullPage: true,
  });
  await navigate("Cân bằng nhân vật");
  await page
    .getByRole("columnheader", { name: "Thắng / Thua", exact: true })
    .waitFor();
  assert.equal(await page.locator("tbody tr").count(), 33);
  await page
    .getByRole("heading", { name: "Đã cân bằng", exact: true })
    .waitFor();
  assert.equal(await page.locator(".audit-comparisons article").count(), 5);
  assert.equal(
    await page.getByLabel("Mẫu kiểm tra cân bằng").inputValue(),
    "team-10-affinity",
  );
  await page.getByLabel("Sắp xếp cân bằng").selectOption("allyHealing");
  await page.getByLabel("Mẫu kiểm tra cân bằng").selectOption("solo-1-bare");
  assert.equal(await page.locator("tbody tr").count(), 33);
  await page.screenshot({
    path: "test-results/balance-audit-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: "test-results/balance-audit-mobile.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: authoritative support history, effect counts, survival, JSON export, 33-card balance report and mobile layout.",
  );
} finally {
  await browser.close();
}
