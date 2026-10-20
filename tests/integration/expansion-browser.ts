import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync } from "node:fs";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
      viewport: { width: 1512, height: 1100 },
    }),
    errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173/");
  await page.locator("canvas").waitFor();
  assert.equal(await page.locator(".roster-card").count(), 20);
  const art = await page.request.get(
    "http://127.0.0.1:5173/weapons/weapon-atlas-v2.png",
  );
  assert.equal(art.status(), 200);
  assert.ok((await art.body()).length > 10000);
  assert.ok((await page.locator(".weapon-art").count()) >= 20);
  for (const [slot, name] of [
    [1, "Hoàng Tử Ngậm Hoa"],
    [2, "Mâm Quả Chủ Tịch"],
    [3, "Sói Suy Tư"],
  ] as const) {
    await page
      .getByRole("button", { name: `Chọn slot ${slot}`, exact: true })
      .click();
    await page.locator(".roster-card").filter({ hasText: name }).click();
    await page
      .getByRole("button", { name: "Chọn vào slot đang xem", exact: true })
      .click();
  }
  assert.equal(await page.locator('[data-active-group="G07"]').count(), 1);
  assert.equal(await page.locator('[data-active-bond="P13"]').count(), 1);
  assert.ok(
    (await page.locator(".team-choices").innerText()).includes(
      "Tiểu vương quốc 36",
    ),
  );
  await page.locator(".team-slot").first().locator(".slot-profile").click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  assert.ok((await dialog.innerText()).includes("Vườn Hồng Không Drama"));
  assert.ok((await dialog.innerText()).includes("Tiểu vương quốc 36"));
  assert.equal(await dialog.locator(".weapon-art").count(), 2);
  mkdirSync("reports", { recursive: true });
  await page.screenshot({ path: "reports/rose-character-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "reports/rose-character-mobile.png" });
  assert.equal(
    await dialog.evaluate((e) => e.scrollWidth <= e.clientWidth),
    true,
  );
  await page.keyboard.press("Escape");
  await page
    .locator(".roster-card")
    .filter({ hasText: "Courage Nhút Nhát" })
    .click();
  assert.ok((await dialog.innerText()).includes("Courage"));
  assert.ok((await dialog.innerText()).includes("Găng Chân Run Rẩy"));
  assert.ok(
    (await dialog.innerText()).includes(
      "Hạt nhân bắt buộc: Hộp Quà Nghiêm Túc",
    ),
  );
  assert.ok(
    (await dialog.innerText()).includes("Hạt nhân bắt buộc: Sếp Chốt Đơn"),
  );
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1512, height: 1100 });
  assert.equal(await page.locator('[data-active-group="G11"]').count(), 0);
  for (const [slot, name] of [
    [1, "Hộp Quà Nghiêm Túc"],
    [2, "Sếp Chốt Đơn"],
  ] as const) {
    await page
      .getByRole("button", { name: `Chọn slot ${slot}`, exact: true })
      .click();
    await page.locator(".roster-card").filter({ hasText: name }).click();
    await page
      .getByRole("button", { name: "Chọn vào slot đang xem", exact: true })
      .click();
  }
  for (const [group, anchor] of [
    ["G11", "Hộp Quà Nghiêm Túc"],
    ["G12", "Sếp Chốt Đơn"],
  ]) {
    const info = page.locator(`[data-active-group="${group}"]`);
    assert.ok(
      (await info.innerText()).includes(`Hạt nhân bắt buộc: ${anchor}`),
    );
  }
  const selectCharacter = async (slot: number, name: string) => {
    await page
      .getByRole("button", { name: `Chọn slot ${slot}`, exact: true })
      .click();
    await page.locator(".roster-card").filter({ hasText: name }).click();
    await page
      .getByRole("button", { name: "Chọn vào slot đang xem", exact: true })
      .click();
  };
  assert.ok(
    (await page.locator('[data-active-group="G11"]').innerText()).includes(
      "Đang có: Ghép đôi",
    ),
  );
  await selectCharacter(2, "Họa Sĩ Chạy Deadline");
  assert.ok(
    (await page.locator('[data-active-group="G11"]').innerText()).includes(
      "Đang có: Full Combo",
    ),
  );
  await selectCharacter(2, "Hổ Hướng Nội");
  assert.ok(
    (await page.locator('[data-active-group="G11"]').innerText()).includes(
      "Đang có: Ghép đôi",
    ),
  );
  await selectCharacter(1, "Sếp Chốt Đơn");
  await selectCharacter(2, "Anh Tím Mọng");
  await selectCharacter(3, "Hiệp Sĩ Gâu Gâu");
  assert.equal(await page.locator('[data-active-group="G12"]').count(), 0);
  assert.ok(
    (await page.locator('[data-active-group="G13"]').innerText()).includes(
      "Hạt nhân: ít nhất một Anh Tím Mọng hoặc Hiệp Sĩ Gâu Gâu",
    ),
  );
  await page.locator(".team-slot").nth(1).locator(".slot-profile").click();
  assert.ok((await dialog.innerText()).includes("Tôi Có Ý Này!"));
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await dialog.evaluate((e) => e.scrollWidth <= e.clientWidth),
    true,
  );
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1512, height: 1100 });
  await selectCharacter(1, "Hổ Hướng Nội");
  await selectCharacter(2, "Cô Nàng Khui Tết");
  assert.equal(await page.locator('[data-active-group="G01"]').count(), 1);
  assert.equal(await page.locator('[data-active-group="G02"]').count(), 1);
  assert.equal(await page.locator(".team-choices select").count(), 0);
  await page.locator(".team-choices").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "reports/stacked-synergies-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.screenshot({ path: "reports/stacked-synergies-mobile.png" });
  await page.setViewportSize({ width: 1512, height: 1100 });
  await page.locator("canvas").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "reports/weapon-arena-desktop.png" });
  assert.deepEqual(errors, []);
  writeFileSync(
    "reports/expansion-browser.json",
    JSON.stringify(
      {
        characters: 20,
        weapons: 20,
        automaticStacking: true,
        rosePopup: true,
        courageDescription: true,
        anchoredGroups: true,
        fullComboComposition: true,
        bossExclusions: true,
        ideaGroup: true,
        mobileOverflow: false,
        pageErrors: errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: new rose character, Courage, generated weapon atlas, automatic synergy stacking and responsive full popup.",
  );
} finally {
  await browser.close();
}
