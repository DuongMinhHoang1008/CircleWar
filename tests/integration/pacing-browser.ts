import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { debugConfig, runBattle } from "../../packages/battle-engine/src/index";
import { character } from "../../packages/shared/src/catalog";
import type { ClassId } from "../../packages/shared/src/balance";

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1512, height: 1100 },
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install();
  await page.goto("http://127.0.0.1:5173/");
  await page.locator("canvas").waitFor();
  await page.getByLabel("Số nhân vật", { exact: true }).fill("2");
  // Match the actual offline preset: the chosen Tiger against the roster's Wolf.
  const config = debugConfig(2);
  config.teams.forEach((team, i) => {
    const c = character(i === 0 ? "char_01" : "char_08")!;
    team.loadouts = [
      {
        characterId: i === 0 ? "char_01" : "char_08",
        classId: c.base as ClassId,
        level: 0,
        weaponRank: i === 0 ? 1 : undefined,
        equipment: [],
      },
    ];
  });
  let seed = 1;
  while (seed < 100 && runBattle(config, seed).tick < 1950) seed++;
  assert.ok(seed < 100, "Need a late-round visual sample");
  await page.getByLabel("Battle seed").fill(String(seed));
  await page.clock.runFor(1000);
  await page.clock.fastForward(61000);
  await page.clock.runFor(600);
  await page
    .getByText("Nhịp +72% ATK / +30% tốc độ", { exact: false })
    .waitFor();
  assert.match(await page.locator(".arena-top").innerText(), /6[12]\.\d+s/);
  mkdirSync("reports", { recursive: true });
  await page.screenshot({
    path: "reports/pacing-square-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "reports/pacing-square-mobile.png",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  // A new seed creates a new round with baseline stats and a zero tempo HUD.
  await page
    .getByRole("button", { name: "Bắt đầu trận mới", exact: false })
    .click();
  await page.clock.runFor(500);
  await page.getByText("Nhịp +0% ATK / +0% tốc độ", { exact: false }).waitFor();
  assert.deepEqual(errors, []);
  writeFileSync(
    "reports/pacing-browser.json",
    JSON.stringify(
      {
        engineVersion: "chaos-integer-v5",
        lateRoundHud: true,
        mobileOverflow: false,
        newRoundResetsTempo: true,
        pageErrors: errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: late-round pacing HUD, square-wall screenshots, mobile layout and new-round reset.",
  );
} finally {
  await browser.close();
}
