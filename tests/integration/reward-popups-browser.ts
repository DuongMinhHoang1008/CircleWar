import { chromium, type Page } from "playwright";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { ROSTER, CATALOG_ITEMS } from "../../packages/shared/src/catalog";
import { dailyQuestDay } from "../../packages/shared/src/progression";
import { CURRENT_RELEASE_VERSION } from "../../apps/web/src/PatchNotes";

const web = process.env.TEST_WEB || "http://127.0.0.1:5173";
const api = process.env.TEST_API || "http://127.0.0.1:8787";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors: string[] = [];
const checks: object[] = [];
async function setup(stage = 0, packs = 20, update = false) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  const id = randomUUID(),
    token = randomUUID() + randomUUID();
  const profile = {
    cards: ROSTER.map((c) => ({ characterId: c.id, level: 1, xp: 0 })),
    itemCards: CATALOG_ITEMS.map((it) => ({ itemId: it.id, level: 1, xp: 0 })),
    team: ["char_31", "char_32", "char_33"],
    equipment: {},
    packs,
    bossPacks: 0,
    lastPackAt: Date.now(),
    packsSinceRare: 0,
    packsSinceHighRarity: 0,
    missions: { draw: 0, win: 0, campaign: 0 },
    claimedMissions: [],
    missionDay: dailyQuestDay(),
    campaignStage: stage,
    processedMatches: [],
    updateRewardVersion: update ? "" : CURRENT_RELEASE_VERSION,
  };
  const init = await page.request.post(`${api}/api/profiles/${id}`, {
    headers: { Origin: new URL(web).origin, Authorization: `Bearer ${token}` },
    data: { type: "INIT", profile },
  });
  assert.equal(init.status(), 200);
  await page.addInitScript(
    ({ id, token, profile, api, update, version }) => {
      if (localStorage.getItem("circlewar-profile-id-v1")) return;
      localStorage.setItem("circlewar-profile-id-v1", id);
      localStorage.setItem("circlewar-profile-token-v1", token);
      localStorage.setItem(
        "circlewar-player-profile-v1",
        JSON.stringify(profile),
      );
      localStorage.setItem("chaos-api", api);
      if (!update)
        localStorage.setItem("circlewar-update-reward-version-v1", version);
    },
    { id, token, profile, api, update, version: CURRENT_RELEASE_VERSION },
  );
  return { page, id, token };
}
async function navigate(page: Page, name: string) {
  await page
    .getByRole("button", { name: "Mở menu điều hướng", exact: true })
    .click();
  await page
    .locator(".drawer-nav")
    .getByRole("button", { name, exact: true })
    .click();
}
async function centered(page: Page, name: string) {
  const dialog = page.locator(".gift-modal");
  await dialog.waitFor();
  for (const size of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    const box = await dialog.boundingBox();
    assert.ok(box);
    assert.ok(
      Math.abs(box.x + box.width / 2 - size.width / 2) < 1.5,
      `${name}: horizontal center`,
    );
    assert.ok(
      Math.abs(box.y + box.height / 2 - size.height / 2) < 1.5,
      `${name}: vertical center`,
    );
    assert.ok(
      box.x >= 0 &&
        box.y >= 0 &&
        box.x + box.width <= size.width + 1 &&
        box.y + box.height <= size.height + 1,
      `${name}: viewport bounds`,
    );
    assert.equal(
      await page.evaluate(() =>
        document
          .querySelector('[role="dialog"]')!
          .contains(document.activeElement),
      ),
      true,
    );
    await page.screenshot({ path: `reports/${name}-${size.width}.png` });
  }
  checks.push({ name, centeredAt: ["desktop", "mobile", "landscape"] });
}
async function saved(page: Page) {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("circlewar-player-profile-v1")!),
  );
}
try {
  const update = await setup(0, 20, true);
  await update.page.goto(web);
  await update.page
    .getByRole("heading", {
      name: `Cập nhật v${CURRENT_RELEASE_VERSION}`,
      exact: true,
    })
    .waitFor();
  await update.page.evaluate(() => window.scrollTo(0, 800));
  await centered(update.page, "update-popup");
  await update.page.keyboard.press("Shift+Tab");
  assert.equal(
    await update.page
      .getByRole("button", { name: "Đóng thông báo" })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await update.page.keyboard.press("Escape");
  await update.page.locator(".gift-modal").waitFor({ state: "detached" });
  assert.equal((await saved(update.page)).packs, 70);
  await update.page.reload();
  await update.page
    .getByRole("button", { name: "Mở menu điều hướng" })
    .waitFor();
  assert.equal(await update.page.locator(".gift-modal").count(), 0);
  assert.equal((await saved(update.page)).packs, 70);
  await update.page.close();

  // The Arena fixture delivers a repeated completion callback. Real combat is
  // covered separately; this verifies the App's actual grant/save/modal path.
  for (const [stage, packs, expected, boss] of [
    [0, 20, 5, 0],
    [4, 20, 15, 1],
    [9, 20, 15, 3],
    [9, 148, 2, 3],
  ]) {
    const test = await setup(stage, packs);
    await test.page.route("**/src/rendering/Arena.tsx*", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: `import React from '/node_modules/.vite/deps/react.js'; export function Arena(p){return React.createElement('button',{onClick:()=>{p.onFinished('team-player');p.onFinished('team-player');}},'Hoàn tất trận thử');}`,
      }),
    );
    await test.page.goto(web);
    await navigate(test.page, "Đi ải");
    await test.page
      .getByRole("button", { name: `Bắt đầu ải ${stage + 1}`, exact: true })
      .click();
    await test.page.getByRole("button", { name: "Hoàn tất trận thử" }).click();
    const dialog = test.page.getByRole("dialog");
    await dialog.waitFor();
    assert.match(
      await dialog.innerText(),
      new RegExp(`\\+${expected}\\s+Pack thường`),
    );
    if (boss) {
      assert.match(
        await dialog.innerText(),
        new RegExp(`\\+${boss}\\s+Pack Boss`),
      );
      assert.equal(
        await dialog
          .locator("img")
          .evaluate(
            (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
          ),
        true,
      );
    }
    if (packs === 148)
      assert.match(await dialog.innerText(), /13 pack vượt giới hạn/);
    const before = await saved(test.page);
    assert.equal(before.packs, packs + expected);
    assert.equal(before.bossPacks, boss);
    assert.equal(before.campaignStage, stage + 1);
    assert.equal(before.missions.campaign, 1);
    if (stage === 9 && packs === 20)
      await centered(test.page, "boss-reward-popup");
    await dialog.getByRole("button", { name: "Tiếp tục", exact: true }).click();
    await test.page.locator(".gift-modal").waitFor({ state: "detached" });
    assert.deepEqual(await saved(test.page), before);
    await test.page.close();
    checks.push({
      mode: "campaign",
      stage: stage + 1,
      packs: expected,
      bossPacks: boss,
      duplicateCompletionIgnored: true,
    });
  }

  const pvp = await setup();
  await pvp.page.goto(web);
  await navigate(pvp.page, "Multiplayer");
  const response = pvp.page.waitForResponse(
    (r) => r.url() === `${api}/api/rooms` && r.request().method() === "POST",
  );
  await pvp.page
    .getByRole("button", { name: "Tạo phòng", exact: true })
    .click();
  const room = await (await response).json();
  await pvp.page
    .getByText(/Đã kết nối/)
    .first()
    .waitFor();
  // A finished-state network fixture exercises the real Connection and reward effect.
  await pvp.page.route(`**/api/rooms/${room.code}`, async (route) => {
    const response = await route.fetch();
    const result = await response.json();
    Object.assign(result.state, {
      phase: "FINISHED",
      game: 1,
      round: 1,
      champion: room.id,
      mode: "pvp",
      replay: null,
      results: [],
    });
    await route.fulfill({ response, json: result });
  });
  await pvp.page.reload();
  await pvp.page
    .getByRole("heading", { name: "Chiến thắng multiplayer!", exact: true })
    .waitFor();
  assert.match(
    await pvp.page.getByRole("dialog").innerText(),
    /\+10\s+Pack thường/,
  );
  assert.equal((await saved(pvp.page)).packs, 30);
  assert.equal((await saved(pvp.page)).missions.win, 1);
  await centered(pvp.page, "multiplayer-reward-popup");
  await pvp.page.keyboard.press("Escape");
  await pvp.page.reload();
  await navigate(pvp.page, "Multiplayer");
  await pvp.page
    .getByText(/Đã kết nối/)
    .first()
    .waitFor();
  assert.equal(await pvp.page.locator(".gift-modal").count(), 0);
  assert.equal((await saved(pvp.page)).packs, 30);
  assert.equal((await saved(pvp.page)).missions.win, 1);
  checks.push({
    mode: "pvp",
    packs: 10,
    duplicateFinishedStateIgnoredAfterReload: true,
  });
  assert.deepEqual(errors, []);
  writeFileSync(
    "reports/reward-popups-browser.json",
    JSON.stringify(
      { version: CURRENT_RELEASE_VERSION, checks, errors },
      null,
      2,
    ),
  );
  console.log(
    "Centered update/campaign/boss/multiplayer popups, focus, real profile saves, overflow and duplicate guards passed.",
  );
} finally {
  await browser.close();
}

