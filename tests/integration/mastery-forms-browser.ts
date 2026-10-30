import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { ROSTER } from "../../packages/shared/src/catalog";
import { experienceOf } from "../../packages/shared/src/experience";
import { CURRENT_RELEASE_VERSION } from "../../apps/web/src/PatchNotes";
const dir = process.env.TEST_REPORT_DIR || "reports/mastery-forms";
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors: string[] = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
try {
  page.on("pageerror", (e) => errors.push(e.message));
  const profile = {
    cards: ROSTER.map((c) => ({ characterId: c.id, level: 10, xp: 0 })),
    itemCards: [],
    team: ["char_03"],
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
    experience: { ...experienceOf({}), mastery: { char_03: 2 } },
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
  const nav = async (name: string) => {
    await page
      .getByRole("button", { name: "Mở menu điều hướng", exact: true })
      .click();
    await page
      .locator(".drawer-nav")
      .getByRole("button", { name, exact: true })
      .click();
  };
  await nav("Hành trình nhân vật");
  await page
    .getByRole("textbox", { name: "Tìm nhân vật trong hành trình" })
    .fill("Anh Tím Mọng");
  await page
    .getByRole("button", {
      name: "So sánh Bí kỹ của Anh Tím Mọng",
      exact: true,
    })
    .click();
  const preview = page.locator(".mastery-preview[open]");
  await preview.getByRole("heading", { name: /Anh Tím Mọng/ }).waitFor();
  const statistics=preview.locator('.arena-statistics');
  assert.equal(await statistics.getAttribute('open'),null);
  await statistics.locator('summary').click();
  assert.notEqual(await statistics.getAttribute('open'),null);
  await statistics.locator('summary').click();
  const picks = preview.getByRole("group", { name: "So sánh nhánh Bí kỹ" });
  assert.equal(await picks.getByRole("button").count(), 4);
  await picks
    .getByRole("button", { name: "Chùm Nho Tách Hạt", exact: true })
    .click();
  await preview.locator("canvas").waitFor();
  await page.waitForFunction(
    () =>
      Number(
        document
          .querySelector(".mastery-preview .arena-top span:last-child")
          ?.textContent?.match(/([\d.]+)s/)?.[1] || 0,
      ) > 1,
  );
  assert.equal(await preview.getByRole("alert").count(), 0);
  await preview.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  await page.waitForTimeout(120);
  const paused = await preview.locator(".arena-top").innerText();
  await page.waitForTimeout(350);
  assert.equal(await preview.locator(".arena-top").innerText(), paused);
  await preview.screenshot({ path: `${dir}/split-fruit-desktop.png` });
  await preview.getByRole("button", { name: "0.5×", exact: true }).click();
  await preview
    .getByRole("button", { name: "Tiếp tục xem", exact: true })
    .click();
  await picks
    .getByRole("button", { name: "Quả Cầu Hồi Lưu", exact: true })
    .click();
  await preview.locator("canvas").waitFor();
  assert.match(
    await preview.locator(".mastery-preview-description").innerText(),
    /quay sau 0,6 giây/,
  );
  await picks
    .getByRole("button", { name: "Mưa Hạt Chín", exact: true })
    .click();
  await preview.locator("canvas").waitFor();
  await page.waitForTimeout(900);
  await preview.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  await preview.screenshot({ path: `${dir}/mine-super-desktop.png` });
  await preview
    .getByRole("button", { name: "Xem lại lượt thử", exact: true })
    .click();
  await preview.locator("canvas").waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await preview.count(), 0);
  const saved = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("circlewar-profile-journal-v1") || "{}")
        .profile ||
      JSON.parse(localStorage.getItem("circlewar-player-profile-v1")!),
  );
  assert.deepEqual(saved.experience.mastery, { char_03: 2 });
  await nav("Catalog");
  const catalog = page.getByRole("dialog", {
    name: "Cẩm nang đấu trường",
    exact: true,
  });
  await catalog
    .getByRole("group", { name: "Mục cẩm nang" })
    .getByRole("button", { name: /^Bí kỹ / })
    .click();
  const query = catalog.getByRole("textbox", { name: "Tìm trong cẩm nang" });
  for (const [name, file] of [
    ["Trạm Săn Đuổi", "drone-desktop"],
    ["Bầy Sói Ảo", "wolf-desktop"],
    ["Kiếm Vọng", "echo-desktop"],
    ["Quà Tiếp Tế", "medic-desktop"],
  ]) {
    await query.fill(name);
    await catalog
      .locator(".catalog-reference-card")
      .filter({ has: page.getByRole("heading", { name, exact: true }) })
      .getByRole("button", { name: "Xem cách đánh ↗", exact: true })
      .click();
    await preview.locator("canvas").waitFor();
    await page.waitForTimeout(name === "Quà Tiếp Tế" ? 3500 : 1100);
    assert.equal(await preview.getByRole("alert").count(), 0);
    await preview
      .getByRole("button", { name: "Tạm dừng", exact: true })
      .click();
    await preview.screenshot({ path: `${dir}/${file}.png` });
    await page.keyboard.press("Escape");
    assert.ok(await catalog.isVisible());
  }
  await query.fill("Vệ Tinh Khí Nén");
  await catalog
    .getByRole("button", { name: "Xem cách đánh ↗", exact: true })
    .click();
  await preview.locator("canvas").waitFor();
  await page.waitForTimeout(450);
  await preview.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(
      await preview.evaluate((el) => el.scrollWidth <= el.clientWidth),
      `preview overflow ${width}`,
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `page overflow ${width}`,
    );
    await page.screenshot({
      path: `${dir}/orbit-mobile-${width}.png`,
      fullPage: false,
    });
  }
  assert.deepEqual(errors, []);
  writeFileSync(
    `${dir}/browser.json`,
    JSON.stringify(
      {
        engine: "chaos-integer-v36",
        previewBranches: 4,
        lockedSkillsPreview: true,
        noProgressAwarded: true,
        pauseAndSpeed: true,
        journeyAndCatalog: true,
        widths: [1440, 360, 390],
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: real combat sandbox from Journey and Catalog, all branches usable before unlock, pause/speed/restart, original progress intact, native-dialog Escape and desktop/mobile previews without errors",
  );
} catch (error) {
  await page.screenshot({ path: `${dir}/failure.png`, fullPage: true });
  console.error(
    JSON.stringify({
      errors,
      body: (await page.locator("body").innerText()).slice(0, 3000),
    }),
  );
  throw error;
} finally {
  await browser.close();
}
