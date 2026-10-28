import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { CURRENT_RELEASE_VERSION } from "../../apps/web/src/PatchNotes";
import { weekId } from "../../packages/shared/src/adventure";
import { ROSTER, CATALOG_ITEMS } from "../../packages/shared/src/catalog";
const browser = await chromium.launch({ channel: "chrome", headless: true });
mkdirSync("reports", { recursive: true });
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1080 },
    }),
    errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(
    ({ release, week }) => {
      if (localStorage.getItem("ux-test-ready")) return;
      localStorage.setItem("ux-test-ready", "1");
      localStorage.setItem("circlewar-update-reward-version-v1", release);
      localStorage.setItem(
        "circlewar-player-profile-v1",
        JSON.stringify({
          cards: ["char_01", "char_14", "char_33", "char_11"].map(
            (characterId) => ({
              characterId,
              level: 10,
              xp: 0,
            }),
          ),
          itemCards: [{ itemId: "item_01", level: 10, xp: 0 }],
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
          experience: {
            presets: [],
            locked: [],
            medals: {
              [`weekly:${week}:open:0`]: 1,
              [`weekly:${week}:open:1`]: 1,
              "expedition:perfect": 1,
            },
            mastery: { char_01: 15, char_14: 15 },
            tutorial: [],
            titles: [],
            activeTitle: "",
            expeditionDay: new Date().toISOString().slice(0, 10),
            expeditionBest: 4,
          },
        }),
      );
    },
    { release: CURRENT_RELEASE_VERSION, week: weekId() },
  );
  await page.goto("http://127.0.0.1:5173/");
  await page.getByRole("heading", { name: "Mở bài.", exact: true }).waitFor();
  await page
    .getByRole("navigation", { name: "Điều hướng chính" })
    .getByRole("button", { name: "Kho đồ", exact: true })
    .click();
  await page.locator(".inventory-board").waitFor();
  const slots = page.locator(".inventory-team-list [data-team-slot]");
  const boxes = await slots.evaluateAll((nodes) =>
    nodes.map((n) => {
      const r = n.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width };
    }),
  );
  assert.equal(boxes.length, 3);
  assert.equal(boxes[0].x, boxes[2].x);
  assert.ok(boxes[0].y < boxes[1].y && boxes[1].y < boxes[2].y);
  const collection = page.locator(".inventory-card-grid");
  const collectionBox = await collection.boundingBox();
  assert.ok(
    collectionBox!.x > boxes[0].x + boxes[0].w,
    "collection sits beside the squad on desktop",
  );
  assert.ok(
    collectionBox!.y < 500,
    "owned cards are available without scrolling on desktop",
  );
  await page.screenshot({
    path: "reports/inventory-refined-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("textbox", { name: "Tìm thẻ trong kho" })
    .fill("không-có-thẻ-này");
  await page.getByRole("heading", { name: "Không tìm thấy thẻ" }).waitFor();
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  assert.equal(await collection.locator("article").count(), 4);
  // Use the owned character by its stable card payload rather than localized hero names.
  const extra = collection
    .locator("article")
    .filter({ has: page.locator('button[aria-label^="Cấu hình"]') })
    .last();
  await extra.dragTo(slots.nth(0));
  const saved = () =>
    page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("circlewar-profile-journal-v1")!)
          .profile,
    );
  assert.equal((await saved()).team[0], "char_11");
  await slots.nth(0).locator(".inventory-card-shell").dragTo(slots.nth(2));
  assert.deepEqual((await saved()).team, ["char_33", "char_14", "char_11"]);
  await page.getByRole("tab", { name: /Vật phẩm/ }).click();
  await collection.locator("article").first().dragTo(slots.nth(1));
  assert.deepEqual((await saved()).equipment, { char_14: ["item_01"] });
  await slots
    .nth(1)
    .getByRole("button", { name: /Cấu hình/ })
    .click();
  await page.getByRole("dialog").waitFor();
  assert.ok(
    await page
      .getByRole("dialog")
      .getByText(/Sát thương \/ đòn · Lv/)
      .isVisible(),
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Gói Gia Cố/ })
    .click();
  await page.getByRole("dialog").getByRole("button", { name: /Lưu/ }).click();
  assert.equal((await saved()).experience.masteries.char_14.id, "giftTank");
  await page.screenshot({
    path: "reports/inventory-horizontal-desktop.png",
    fullPage: true,
  });
  await page.reload();
  await page
    .getByRole("navigation", { name: "Điều hướng chính" })
    .getByRole("button", { name: "Kho đồ", exact: true })
    .click();
  assert.ok(
    await page
      .locator(".inventory-team-list")
      .getByText("Gói Gia Cố", { exact: true })
      .isVisible(),
  );
  await page
    .getByRole("navigation", { name: "Điều hướng chính" })
    .getByRole("button", { name: "Đi ải", exact: true })
    .click();
  await page
    .locator(".team-summary:not(.enemy)")
    .first()
    .getByRole("button", { name: /Cấu hình/ })
    .first()
    .click();
  await page.getByRole("dialog").waitFor();
  await page
    .getByRole("button", { name: "Đóng cấu hình", exact: true })
    .click();
  await page
    .locator(".team-summary.enemy")
    .getByRole("button", { name: /Cấu hình/ })
    .first()
    .click();
  assert.equal(
    await page.getByRole("dialog").getByRole("button", { name: /Lưu/ }).count(),
    0,
  );
  await page
    .getByRole("button", { name: "Đóng cấu hình", exact: true })
    .click();
  for (const width of [390, 360]) {
    await page.setViewportSize({ width, height: 844 });
    await page
      .getByRole("navigation", { name: "Điều hướng chính" })
      .getByRole("button", { name: "Kho đồ", exact: true })
      .click();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
    const row = await slots.evaluateAll((nodes) =>
      nodes.map((n) => n.getBoundingClientRect().top),
    );
    assert.equal(row[0], row[2]);
    const collectionTop = await page
      .locator(".inventory-collection-column")
      .evaluate((el) => el.getBoundingClientRect().top);
    assert.ok(collectionTop < 640, "mobile collection follows a compact squad");
    await page.getByRole("tab", { name: /Vật phẩm/ }).click();
    const handle = collection.locator(".inventory-drag-handle").first();
    await handle.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true });
    const hb = await handle.boundingBox();
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: hb!.x + hb!.width / 2, y: hb!.y + hb!.height / 2 }],
    });

    await page.locator(".touch-team-rail").waitFor({ timeout: 3000 });
    const box = await page
      .locator('.touch-team-rail [data-team-slot="0"]')
      .boundingBox();
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 },
      ],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await cdp.detach();
    assert.deepEqual((await saved()).equipment, { char_33: ["item_01"] });
    await page.screenshot({
      path: `reports/inventory-refined-mobile-${width}.png`,
      fullPage: true,
    });
  }
  await page
    .locator(".inventory-team-list")
    .getByRole("button", { name: /Cấu hình/ })
    .nth(1)
    .click();
  await page.screenshot({ path: "reports/config-mobile-360.png" });
  const beforeCancel = await saved();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Quà Tiếp Tế/ })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Hủy", exact: true })
    .click();
  assert.deepEqual(await saved(), beforeCancel);
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  // A full collection must stay usable with long names, every rarity and an incomplete squad.
  const fullProfile = {
    ...(await saved()),
    cards: ROSTER.map((c, index) => ({
      characterId: c.id,
      level: (index % 10) + 1,
      xp: 0,
    })),
    itemCards: CATALOG_ITEMS.map((c) => ({ itemId: c.id, level: 1, xp: 0 })),
    team: ["char_01"],
    equipment: {},
  };
  const full = await browser.newPage({
    viewport: { width: 1440, height: 1080 },
  });
  full.on("pageerror", (e) => errors.push(e.message));
  await full.addInitScript(
    ({ profile, release }) => {
      if (localStorage.getItem("full-inventory-test")) return;
      localStorage.setItem("full-inventory-test", "1");
      localStorage.setItem(
        "circlewar-player-profile-v1",
        JSON.stringify(profile),
      );
      localStorage.setItem("circlewar-update-reward-version-v1", release);
    },
    { profile: fullProfile, release: CURRENT_RELEASE_VERSION },
  );
  await full.goto("http://127.0.0.1:5173/");
  await full
    .getByRole("navigation", { name: "Điều hướng chính" })
    .getByRole("button", { name: "Kho đồ", exact: true })
    .click();
  await full
    .locator('.inventory-card-grid article[draggable="true"]')
    .first()
    .waitFor();
  assert.equal(
    await full.locator(".inventory-card-grid article").count(),
    ROSTER.length,
  );
  assert.equal(
    await full.locator(".inventory-team-list [data-team-slot]").count(),
    3,
  );
  // Both empty slots accept a drop, including the last visual slot.
  await full
    .locator(".inventory-card-grid article")
    .filter({ has: full.locator('button[aria-label="Cấu hình Cờ Con Cổ Vũ"]') })
    .dragTo(full.locator('.inventory-team-list [data-team-slot="2"]'), {
      steps: 12,
    });
  await full.waitForFunction(
    () =>
      document.querySelectorAll(".inventory-team-list .compact-card").length ===
      2,
  );
  await full.evaluate(() => window.scrollTo(0, 0));
  await full.screenshot({
    path: "reports/inventory-full-desktop.png",
    fullPage: true,
  });
  for (const width of [320, 360, 390, 768, 1024, 1440]) {
    await full.setViewportSize({ width, height: 900 });
    for (const label of [/Nhân vật/, /Vật phẩm/]) {
      await full.getByRole("tab", { name: label }).click();
      assert.equal(
        await full.locator(".inventory-card-grid article").count(),
        33,
      );
      assert.ok(
        await full.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `full inventory overflow at ${width}`,
      );
    }
    if (width === 360)
      await full.screenshot({
        path: "reports/inventory-full-mobile-360.png",
        fullPage: true,
      });
  }
  await full.close();
  assert.deepEqual(errors, []);
  writeFileSync(
    "reports/inventory-browser.json",
    JSON.stringify(
      {
        desktopTwoColumns: true,
        mobileHorizontalTeam: true,
        searchEmptyState: true,
        fullCollection: {
          characters: ROSTER.length,
          items: CATALOG_ITEMS.length,
          widths: [320, 360, 390, 768, 1024, 1440],
        },
        lastEmptySlotDrop: true,
        desktopDrag: true,
        touchDrag: true,
        configPersisted: true,
        mobileWidths: [390, 360],
        errors,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
