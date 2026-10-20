import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { ROSTER, CATALOG_ITEMS } from "../../packages/shared/src/catalog";
import { dailyQuestDay } from "../../packages/shared/src/progression";

const api = "http://127.0.0.1:8787";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1512, height: 1100 },
  });
  const id = randomUUID(),
    token = randomUUID() + randomUUID();
  const profile = {
    cards: ROSTER.map((c) => ({ characterId: c.id, level: 10, xp: 0 })),
    itemCards: CATALOG_ITEMS.map((it) => ({ itemId: it.id, level: 7, xp: 0 })),
    team: ["char_01", "char_12", "char_13"],
    equipment: {},
    packs: 99,
    lastPackAt: Date.now() - 180000,
    missions: { draw: 0, win: 0, campaign: 0 },
    claimedMissions: [],
    missionDay: dailyQuestDay(),
    campaignStage: 0,
    processedMatches: [],
  };
  const headers = {
    Origin: "http://127.0.0.1:5173",
    Authorization: `Bearer ${token}`,
  };
  const init = await page.request.post(`${api}/api/profiles/${id}`, {
    headers,
    data: { type: "INIT", profile },
  });
  assert.equal(init.status(), 200);
  const initialized = (await init.json()).profile;
  assert.equal(initialized.packs, 100, "Recharge stops at 100");
  const invalid = await page.request.post(`${api}/api/profiles/${id}`, {
    headers,
    data: { type: "SAVE", profile: { ...initialized, packs: 101 } },
  });
  assert.equal(
    invalid.status(),
    400,
    "Server rejects overflow without changing stored packs",
  );
  await page.addInitScript(
    ({ id, token, profile }) => {
      localStorage.setItem("circlewar-profile-id-v1", id);
      localStorage.setItem("circlewar-profile-token-v1", token);
      localStorage.setItem(
        "circlewar-player-profile-v1",
        JSON.stringify(profile),
      );
      localStorage.setItem("chaos-name", "Người thử cân bằng");
      localStorage.setItem("chaos-api", "http://127.0.0.1:8787");
    },
    { id, token, profile: initialized },
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173/");
  await page.waitForFunction(() =>
    document
      .querySelector(".pack-queue-card")
      ?.textContent?.includes("100 / 100"),
  );
  await page.getByRole("button", { name: "Kho đồ", exact: true }).click();
  await page
    .locator(".inventory-card")
    .filter({ hasText: "Bánh khảo" })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  assert.match(await dialog.innerText(), /Lv\.7/);
  assert.match(await dialog.innerText(), /Lv\.8/);
  assert.match(await dialog.innerText(), /SỬ THI/);
  assert.match(await dialog.innerText(), /Nhận 41 khiên/);
  mkdirSync("reports", { recursive: true });
  await dialog.screenshot({ path: "reports/item-upgrade-balance.png" });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Mô phỏng", exact: true }).click();
  assert.equal(
    await page.getByLabel("Thời gian thu đấu trường mô phỏng").inputValue(),
    "20",
  );
  await page
    .getByRole("button", { name: "Chạy mô phỏng ↗", exact: true })
    .click();
  await page.locator("canvas").waitFor();
  const canvasSize = await page.locator("canvas").boundingBox();
  assert.ok(canvasSize && Math.abs(canvasSize.width - canvasSize.height) < 1);
  assert.equal(await page.locator(".team-color-key").count(), 4);
  assert.match(
    await page.locator(".team-color-legend").innerText(),
    /Người thử cân bằng/,
  );
  assert.match(await page.locator(".team-color-legend").innerText(), /Đỏ/);
  await page
    .locator(".arena-shell")
    .screenshot({ path: "reports/team-colors-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator(".team-color-legend")
    .screenshot({ path: "reports/team-colors-mobile.png" });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: pack recharge/overflow, current and next item levels, evolved rarity, named team colors, desktop/mobile.",
  );
} finally {
  await browser.close();
}
