import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { ROSTER } from "../../packages/shared/src/catalog";
import { experienceOf } from "../../packages/shared/src/experience";
import { CURRENT_RELEASE_VERSION } from "../../apps/web/src/PatchNotes";

const dir = process.env.TEST_REPORT_DIR || "reports/mastery-redesign";
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors: string[] = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/profiles/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ profile: profile }),
    }),
  );
  const profile = {
    cards: ROSTER.map((c) => ({ characterId: c.id, level: 10, xp: 0 })),
    itemCards: [],
    team: ["char_02", "char_06", "char_15"],
    equipment: {},
    packs: 150,
    bossPacks: 0,
    lastPackAt: Date.now(),
    missions: { draw: 0, win: 0, campaign: 0 },
    claimedMissions: [],
    missionDay: "2026-10-29",
    campaignStage: 4,
    processedMatches: [],
    packsSinceRare: 0,
    packsSinceHighRarity: 0,
    bossPacksSinceHighRarity: 0,
    mailbox: [],
    updateRewardVersion: CURRENT_RELEASE_VERSION,
    experience: {
      ...experienceOf({}),
      mastery: { char_02: 4, char_06: 15, char_15: 8 },
      masteries: { char_02: { id: "char_02:pressure" } },
    },
  };
  await page.addInitScript(
    ({ profile, release }) => {
      localStorage.setItem(
        "circlewar-player-profile-v1",
        JSON.stringify(profile),
      );
      localStorage.setItem("circlewar-update-reward-version-v1", release);
    },
    { profile, release: CURRENT_RELEASE_VERSION },
  );
  await page.goto(process.env.TEST_WEB || "http://127.0.0.1:5173/");
  await page
    .getByRole("button", { name: "Mở menu điều hướng", exact: true })
    .click();
  await page
    .locator(".drawer-nav")
    .getByRole("button", { name: "Hành trình nhân vật", exact: true })
    .click();
  await page.locator(".mastery-journey-card").first().waitFor();
  assert.equal(await page.locator(".mastery-journey-card").count(), 33);
  assert.equal(await page.locator(".mastery-unlock-detail").count(), 99);
  const search = page.getByRole("textbox", {
    name: "Tìm nhân vật trong hành trình",
  });
  const filter = page.getByRole("combobox", { name: "Lọc hành trình" });
  await search.fill("Vòng Ôm Xoắn");
  assert.equal(await page.locator(".mastery-journey-card").count(), 1);
  assert.match(
    await page.locator(".mastery-current-objective").innerText(),
    /Tiểu Đường/,
  );
  assert.match(await page.locator(".is-equipped").innerText(), /Đang lắp/);
  await page.locator(".mastery-unlock-detail summary").first().click();
  assert.match(
    await page.locator(".mastery-unlock-detail").first().innerText(),
    /vòng quét/,
  );
  await search.fill("Đổi đường đạn");
  assert.ok(await page.locator(".mastery-journey-card").count() > 0);
  await search.fill("");
  await filter.selectOption("learning");
  assert.equal(await page.locator(".mastery-journey-card").count(), 2);
  await filter.selectOption("completed");
  assert.equal(await page.locator(".mastery-journey-card").count(), 1);
  await filter.selectOption("all");
  await page.screenshot({
    path: `${dir}/journey-desktop.png`,
    fullPage: false,
  });
  await search.fill("không có nhân vật này");
  assert.match(
    await page.getByRole("status").last().innerText(),
    /Chưa có nhân vật/,
  );
  await search.fill("Bé Ôm Bão");
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page
      .locator(".mastery-journey-card")
      .first()
      .scrollIntoViewIfNeeded();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `overflow at ${width}`,
    );
    await page.screenshot({
      path: `${dir}/journey-mobile-${width}.png`,
      fullPage: true,
    });
  }
  assert.deepEqual(errors, []);
  writeFileSync(
    `${dir}/browser.json`,
    JSON.stringify(
      { cards: 33, branches: 99, widths: [1440, 360, 390], errors },
      null,
      2,
    ),
  );
  console.log(
    "PASS: 33 journeys / 99 branches, name and role search, stage objective, equipped state, progress filters, empty state, desktop/mobile without overflow",
  );
} finally {
  await browser.close();
}
