import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { ROSTER, CATALOG_ITEMS } from "../../packages/shared/src/catalog";
import { CURRENT_RELEASE_VERSION } from "../../apps/web/src/PatchNotes";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors: string[] = [];
const web = process.env.TEST_WEB || "http://127.0.0.1:5173";
mkdirSync("reports", { recursive: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(
    ({ roster, items, release }) => {
      if (localStorage.getItem("experience-browser-initialized")) return;
      localStorage.setItem("experience-browser-initialized", "1");
      localStorage.setItem(
        "circlewar-player-profile-v1",
        JSON.stringify({
          cards: roster.map((id) => ({ characterId: id, level: 10, xp: 0 })),
          itemCards: items.map((id) => ({ itemId: id, level: 10, xp: 0 })),
          team: ["char_01", "char_14", "char_33"],
          equipment: {},
          packs: 150,
          bossPacks: 0,
          lastPackAt: Date.now(),
          missions: { draw: 0, win: 0, campaign: 0 },
          claimedMissions: [],
          missionDay: new Date().toISOString().slice(0, 10),
          campaignStage: 4,
          processedMatches: [],
          packsSinceRare: 0,
          packsSinceHighRarity: 0,
          bossPacksSinceHighRarity: 0,
          updateRewardVersion: release,
          mailbox: [],
        }),
      );
      localStorage.setItem("circlewar-update-reward-version-v1", release);
    },
    {
      roster: ROSTER.map((c) => c.id),
      items: CATALOG_ITEMS.map((i) => i.id),
      release: CURRENT_RELEASE_VERSION,
    },
  );
  await page.goto(web);
  await page
    .getByRole("navigation", { name: "Điều hướng chính" })
    .getByRole("button", { name: "Hành trình", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Hôm nay, chinh phục gì?" })
    .waitFor()
    .catch(() => page.locator(".journey-hero").waitFor());
  async function navigate(label: string) {
    await page
      .getByRole("button", { name: "Mở menu điều hướng", exact: true })
      .click();
    await page
      .locator(".drawer-nav")
      .getByRole("button", { name: label, exact: true })
      .click();
  }
  await navigate("Kho đồ");
  await page.locator(".inventory-presets > summary").click();
  await page
    .getByRole("button", { name: "Lưu đội mới", exact: true })
    .waitFor();
  await page.getByLabel("Tên preset", { exact: true }).fill("Bộ ba thử nghiệm");
  await page.getByRole("button", { name: "Lưu đội mới", exact: true }).click();
  await page
    .getByRole("button", { name: "Bộ ba thử nghiệm", exact: true })
    .click();
  await page
    .getByRole("button", { name: /^Khóa / })
    .first()
    .click();
  assert.equal(
    await page.getByRole("button", { name: /^Mở khóa / }).count(),
    1,
  );
  await page
    .getByLabel("Tìm thẻ trong kho", { exact: true })
    .fill("Hổ Hướng Nội");
  assert.equal(
    await page.locator(".inventory-card-grid .inventory-card-shell").count(),
    1,
  );
  await page.getByLabel("Tìm thẻ trong kho", { exact: true }).clear();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: "reports/experience-desktop.png" });
  await navigate("Đi ải");
  await page.getByRole("button", { name: /^Bắt đầu ải 5/ }).click();
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).waitFor();
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  await page.waitForTimeout(500);
  const paused = await page.locator(".arena-top").textContent();
  await page.waitForTimeout(650);
  assert.equal(await page.locator(".arena-top").textContent(), paused);
  await page.getByRole("button", { name: "2×", exact: true }).click();
  await page.getByRole("button", { name: "Tiếp tục xem", exact: true }).click();
  await page.locator(".battle-debrief").waitFor({ timeout: 90000 });
  const readProfile = () =>
    page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("circlewar-profile-journal-v1")!)
          .profile,
    );
  const after = await readProfile();
  assert.equal(after.campaignStage, 5);
  assert.equal(after.rewardReserve, 15);
  await page
    .getByText("Xem lại & thử nghiệm đội hình", { exact: true })
    .click();
  await page.getByRole("button", { name: "Xem lại trận", exact: true }).click();
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).waitFor();
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  assert.equal((await readProfile()).rewardReserve, 15);
  await navigate("Hòm thư");
  assert.ok(
    (await page.locator(".mailbox-page").textContent())?.includes(
      "15 pack đã kiếm được",
    ),
  );
  await navigate("Thử thách ngày");
  await page
    .getByRole("heading", { name: "9 nhân vật. Ba thử thách." })
    .waitFor();
  await navigate("Viễn chinh");
  await page.locator(".run-offer").first().click();
  assert.equal((await readProfile()).experience.roguelike.floor, 0);
  await page.reload();
  await navigate("Viễn chinh");
  await page
    .getByRole("heading", { name: "Chọn đường lên tầng 1", exact: true })
    .waitFor();
  await navigate("Hành trình nhân vật");
  assert.equal(await page.locator(".mastery-journey-card").count(), 33);
  await page.setViewportSize({ width: 390, height: 844 });
  await navigate("Kho đồ");
  await page.locator(".inventory-presets > summary").click();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "mobile horizontal overflow",
  );
  await page.screenshot({ path: "reports/experience-mobile.png" });
  assert.deepEqual(errors, []);
  writeFileSync(
    "reports/experience-browser.json",
    JSON.stringify(
      {
        ok: true,
        assertions: [
          "presets",
          "locks",
          "inventory search",
          "playback pause/speed",
          "boss reward overflow",
          "replay no duplicate reward",
          "mail reserve",
          "daily screen",
          "expedition resume",
          "six mastery tracks",
          "mobile overflow",
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log("Experience browser checks passed");
} finally {
  await browser.close();
}
