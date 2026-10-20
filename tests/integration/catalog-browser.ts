import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
      viewport: { width: 1512, height: 1100 },
    }),
    errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173/");
  await page.locator("canvas").waitFor();
  await page.getByRole("button", { name: /Cẩm nang/ }).click();
  assert.equal(await page.locator(".roster-card").count(), 20);
  for (let i = 0; i < 20; i++) {
    await page.locator(".roster-card").nth(i).click();
    const dialog = page.locator(".info-dialog");
    await dialog.waitFor();
    assert.ok((await dialog.innerText()).includes("Nội tại"));
    assert.ok((await dialog.innerText()).includes("Tự động"));
    assert.ok((await dialog.innerText()).includes("Món hợp cạ"));
    assert.ok((await dialog.innerText()).includes("Liên kết đôi / bộ ba"));
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
  }
  await page.getByRole("button", { name: "Đóng cẩm nang" }).click();
  // Exercise actual team and affinity selection through popup actions.
  for (const [slot, name] of [
    [1, "Hổ Hướng Nội"],
    [2, "Sói Suy Tư"],
    [3, "Hiệp Sĩ Gâu Gâu"],
  ] as const) {
    await page
      .getByRole("button", { name: `Chọn slot ${slot}`, exact: true })
      .click();
    await page.getByRole("button", { name: /Cẩm nang/ }).click();
    await page.locator(".roster-card").filter({ hasText: name }).click();
    await page
      .getByRole("button", { name: "Chọn vào slot đang xem", exact: true })
      .click();
  }
  assert.equal(await page.locator('[data-active-trait="Thú Nhân"]').count(), 1);
  assert.equal(await page.locator('[data-active-bond="T01"]').count(), 1);
  assert.equal(await page.locator('[data-active-bond="P01"]').count(), 1);
  await page.getByRole("button", { name: "Chọn slot 1", exact: true }).click();
  await page.getByRole("button", { name: /Cẩm nang/ }).click();
  await page.getByRole("button", { name: "Vật phẩm", exact: true }).click();
  assert.equal(await page.locator(".item-card").count(), 20);
  for (let i = 0; i < 20; i++) {
    await page.locator(".item-card").nth(i).click();
    const dialog = page.locator(".info-dialog");
    await dialog.waitFor();
    assert.ok((await dialog.innerText()).includes("Đúng người, thêm hiệu ứng"));
    assert.ok((await dialog.innerText()).includes("Trang bị & cộng dồn"));
    await page.keyboard.press("Escape");
  }
  await page.locator(".item-card").filter({ hasText: "RTX 5090" }).click();
  assert.ok(
    (await page.locator(".info-dialog").innerText()).includes(
      "Đang chọn đúng nhân vật hợp cạ",
    ),
  );
  await page
    .getByRole("button", {
      name: "Trang bị thử cho slot đang chọn",
      exact: true,
    })
    .click();
  assert.ok(
    (await page.locator(".team-slot").first().innerText()).includes("RTX 5090"),
  );
  await page.getByRole("button", { name: "Đóng cẩm nang" }).click();
  await page.locator(".team-slot").first().locator(".slot-profile").click();
  mkdirSync("reports", { recursive: true });
  await page.screenshot({
    path: "reports/character-popup-desktop.png",
    fullPage: false,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "reports/character-popup-mobile.png",
    fullPage: false,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  assert.ok(
    await page
      .locator(".info-dialog")
      .evaluate((e) => e.scrollWidth <= e.clientWidth),
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /Cẩm nang/ }).click();
  assert.ok(
    await page
      .locator(".catalog-library")
      .evaluate((e) => e.scrollWidth <= e.clientWidth),
  );
  await page.getByRole("button", { name: "Vật phẩm", exact: true }).click();
  await page
    .locator(".item-card")
    .filter({ hasText: "Robot AI Claude" })
    .click();
  await page.screenshot({
    path: "reports/item-popup-mobile.png",
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Đóng cẩm nang" }).click();
  // Inspect the actual running fighter, including current HP and equipped items.
  await page.locator(".fighter-token").first().click();
  assert.ok(
    (await page.locator(".info-dialog").innerText()).includes("Trong trận:"),
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Mô phỏng", exact: true }).click();
  await page.getByLabel("Số đội mô phỏng").selectOption("3");
  await page.getByLabel("Nhân vật mỗi đội mô phỏng").selectOption("2");
  await page.getByLabel("Đội 1 nhân vật 1").selectOption("char_20");
  await page.getByLabel("Đội 2 nhân vật 1").selectOption("char_12");
  assert.ok(
    (await page.locator(".team-slot").first().innerText()).includes(
      "Hoàng Tử Ngậm Hoa",
    ),
  );
  await page.getByRole("button", { name: "Chạy mô phỏng ↗" }).click();
  await page.waitForFunction(
    () => document.querySelectorAll(".fighter-token").length === 6,
    undefined,
    { timeout: 10000 },
  );
  assert.deepEqual(errors, []);
  writeFileSync(
    "reports/catalog-browser.json",
    JSON.stringify(
      {
        characters: 20,
        items: 20,
        keyboardEscape: true,
        teamSelection: true,
        trioSelection: true,
        affinityEquip: true,
        liveInspect: true,
        simulationSetup: true,
        mobileOverflow: false,
        pageErrors: errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: character/item popups, affinity equipment, mobile layout, and custom 3-team simulation.",
  );
} finally {
  await browser.close();
}
