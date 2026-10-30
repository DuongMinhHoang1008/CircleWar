import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  ROSTER,
  CATALOG_ITEMS,
  character,
} from "../../packages/shared/src/catalog";
import { experienceOf } from "../../packages/shared/src/experience";
import { CURRENT_RELEASE_VERSION } from "../../apps/web/src/PatchNotes";
import { STATUS_RULES } from "../../packages/battle-engine/src/statuses";
import { REFERENCE_ENTRIES } from "../../apps/web/src/catalogReferenceData";

const dir = process.env.TEST_REPORT_DIR || "reports/catalog-reference";
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors: string[] = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.on("pageerror", (error) => errors.push(error.message));
  const profile = {
    cards: ROSTER.map((c) => ({ characterId: c.id, level: 10, xp: 0 })),
    itemCards: [],
    team: ["char_02"],
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
    experience: experienceOf({}),
  };
  await page.route("**/api/profiles/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ profile }),
    }),
  );
  await page.addInitScript((profile) => {
    localStorage.setItem(
      "circlewar-player-profile-v1",
      JSON.stringify(profile),
    );
    localStorage.setItem(
      "circlewar-update-reward-version-v1",
      profile.updateRewardVersion,
    );
  }, profile);
  await page.goto(process.env.TEST_WEB || "http://127.0.0.1:5173/");
  await page
    .getByRole("button", { name: "Mở menu điều hướng", exact: true })
    .click();
  await page
    .locator(".drawer-nav")
    .getByRole("button", { name: "Catalog", exact: true })
    .click();
  const catalog = page.getByRole("dialog", {
    name: "Cẩm nang đấu trường",
    exact: true,
  });
  await catalog.waitFor();
  const tab = (name: string) =>
    catalog
      .getByRole("group", { name: "Mục cẩm nang" })
      .getByRole("button", { name: new RegExp(`^${name} `) });
  const search = catalog.getByRole("textbox", { name: "Tìm trong cẩm nang" });
  const filter = catalog.getByRole("combobox", { name: "Lọc cẩm nang" });
  const cards = catalog.locator(".catalog-reference-card");
  assert.equal(await catalog.locator(".roster-card").count(), ROSTER.length);
  await tab("Vật phẩm").click();
  assert.equal(
    await catalog.locator(".item-card").count(),
    CATALOG_ITEMS.length,
  );
  await tab("Trạng thái").click();
  assert.equal(await cards.count(), Object.keys(STATUS_RULES).length);
  for (const rule of Object.values(STATUS_RULES))
    await cards
      .getByRole("heading", { name: rule.label, exact: true })
      .waitFor();
  await filter.selectOption("Khống chế");
  assert.equal(await cards.count(), 3);
  await filter.selectOption("Tất cả");
  await search.fill("ran giap");
  assert.equal(await cards.count(), 1);
  assert.match(await cards.innerText(), /15 điểm phần trăm giáp/);
  await search.fill("thieu dot");
  assert.equal(await cards.count(), 1);
  assert.match(await cards.innerText(), /Burn/);
  await search.fill("phong xa");
  const radiation = cards.filter({
    has: page.getByRole("heading", { name: "Phóng xạ", exact: true }),
  });
  assert.equal(await radiation.count(), 1);
  await radiation.locator("summary").click();
  await radiation
    .getByRole("button", { name: character("char_31")!.name, exact: true })
    .click();
  await page.locator(".info-dialog[open]").waitFor();
  await page.keyboard.press("Escape");
  assert.ok(await catalog.isVisible());
  await search.fill("khong tim thay noi dung nay");
  assert.equal(await cards.count(), 0);
  assert.match(
    await catalog.locator(".catalog-empty").innerText(),
    /Chưa có mục phù hợp/,
  );
  await tab("Cơ chế combat").click();
  assert.equal(await search.inputValue(), "");
  assert.equal(await cards.count(), REFERENCE_ENTRIES.mechanics.length);
  await search.fill("hồi dư");
  assert.ok((await cards.count()) > 0);
  await tab("Bí kỹ").click();
  assert.equal(await cards.count(), 99);
  await filter.selectOption(character("char_02")!.name);
  assert.equal(await cards.count(), 3);
  assert.match(await cards.first().innerText(), /Đánh đổi/);
  await tab("Liên kết").click();
  assert.equal(await cards.count(), REFERENCE_ENTRIES.synergies.length);
  await filter.selectOption("Hội");
  assert.ok((await cards.count()) > 0);
  await tab("Trạng thái").click();
  await page.screenshot({ path: `${dir}/desktop.png`, fullPage: false });
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await search.fill("Hộ thể");
    assert.equal(await cards.first().getByRole("heading").innerText(), "Hộ thể");
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `page overflow at ${width}`,
    );
    assert.ok(
      await catalog.evaluate((el) => el.scrollWidth <= el.clientWidth),
      `catalog overflow at ${width}`,
    );
    await page.screenshot({
      path: `${dir}/mobile-${width}.png`,
      fullPage: true,
    });
    await tab("Bí kỹ").click();
    await filter.selectOption(character("char_02")!.name);
    assert.ok(
      await catalog.evaluate((el) => el.scrollWidth <= el.clientWidth),
      `mastery overflow at ${width}`,
    );
    await tab("Trạng thái").click();
  }
  assert.deepEqual(errors, []);
  writeFileSync(
    `${dir}/browser.json`,
    JSON.stringify(
      {
        statuses: Object.keys(STATUS_RULES).length,
        mechanics: REFERENCE_ENTRIES.mechanics.length,
        masteries: 99,
        synergies: REFERENCE_ENTRIES.synergies.length,
        widths: [1440, 360, 390],
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: all six catalog sections, complete statuses, defaults/caps, accent-insensitive search, filters, linked character details, empty state and desktop/mobile layout",
  );
} finally {
  await browser.close();
}
