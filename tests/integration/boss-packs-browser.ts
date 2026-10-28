import { chromium } from "playwright";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { ROSTER, CATALOG_ITEMS } from "../../packages/shared/src/catalog";
import { dailyQuestDay } from "../../packages/shared/src/progression";
import { CURRENT_RELEASE_VERSION } from "../../apps/web/src/PatchNotes";

const api = "http://127.0.0.1:8787",
  web = "http://127.0.0.1:5173";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1512, height: 1100 },
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const id = randomUUID(),
    token = randomUUID() + randomUUID();
  const profile = {
    cards: ROSTER.map((c) => ({ characterId: c.id, level: 1, xp: 0 })),
    itemCards: CATALOG_ITEMS.map((it) => ({ itemId: it.id, level: 1, xp: 0 })),
    team: ["char_31", "char_32", "char_33"],
    equipment: {
      char_31: ["item_31"],
      char_32: ["item_32"],
      char_33: ["item_33"],
    },
    packs: 12,
    bossPacks: 4,
    lastPackAt: Date.now(),
    packsSinceRare: 8,
    packsSinceHighRarity: 12,
    missions: { draw: 0, win: 0, campaign: 0 },
    claimedMissions: [],
    missionDay: dailyQuestDay(),
    campaignStage: 4,
    processedMatches: [],
    updateRewardVersion: CURRENT_RELEASE_VERSION,
  };
  const headers = { Origin: web, Authorization: `Bearer ${token}` };
  const init = await page.request.post(`${api}/api/profiles/${id}`, {
    headers,
    data: { type: "INIT", profile },
  });
  assert.equal(init.status(), 200);
  assert.equal((await init.json()).profile.bossPacks, 4);
  await page.addInitScript(
    ({ id, token, profile, version }) => {
      if (!localStorage.getItem("circlewar-profile-id-v1")) {
        localStorage.setItem("circlewar-profile-id-v1", id);
        localStorage.setItem("circlewar-profile-token-v1", token);
        localStorage.setItem(
          "circlewar-player-profile-v1",
          JSON.stringify(profile),
        );
        localStorage.setItem("circlewar-update-reward-version-v1", version);
        localStorage.setItem("chaos-api", "http://127.0.0.1:8787");
      }
    },
    { id, token, profile, version: CURRENT_RELEASE_VERSION },
  );
  await page.goto(web);
  await page
    .getByRole("button", { name: "Mở Boss x3", exact: true })
    .waitFor({ state: "visible" });
  await page.waitForFunction(
    () =>
      !(document.querySelector(".boss-pack-hero button") as HTMLButtonElement)
        ?.disabled,
  );
  assert.equal(await page.locator(".pack-rates").count(), 2);
  assert.equal(await page.locator(".pack-rates").first().isVisible(), false);
  for (const summary of await page.locator(".pack-rules > summary").all())
    await summary.click();
  const rates = await page.locator(".pack-rates").allInnerTexts();
  assert.match(rates[0], /84%[\s\S]*14%[\s\S]*1,7%[\s\S]*0,3%/);
  assert.match(rates[1], /66%[\s\S]*14%[\s\S]*17%[\s\S]*3%/);
  assert.equal(
    await page
      .locator(".boss-pack-art")
      .evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0),
    true,
  );
  mkdirSync("reports", { recursive: true });
  await page
    .locator(".boss-pack-hero")
    .screenshot({ path: "reports/boss-pack-desktop.png" });
  await page.getByRole("button", { name: "Mở Boss x3", exact: true }).click();
  await page.locator(".pack-reveal-overlay").waitFor();
  await page.reload(); // Reward and debit must survive interruption before reveal.
  await page.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("circlewar-player-profile-v1") || "{}")
        .bossPacks === 1,
  );
  let saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("circlewar-player-profile-v1")!),
  );
  assert.equal(saved.packs, 12);
  assert.equal(saved.bossPacks, 1);
  assert.equal(saved.packsSinceRare, 8);
  assert.equal(saved.packsSinceHighRarity, 12);
  assert.equal(saved.missions.draw, 3);
  assert.equal(saved.lastPull.packKind, "boss");
  await page
    .getByRole("button", { name: /Xem kết quả lần mở gần nhất/ })
    .click();
  assert.ok((await page.locator(".reveal-batch-card").count()) > 0);
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  const navigate = async (name: string) => {
    await page
      .getByRole("button", { name: "Mở menu điều hướng", exact: true })
      .click();
    await page
      .locator(".drawer-nav button")
      .filter({ has: page.getByText(name, { exact: true }) })
      .click();
  };
  await navigate("Kho đồ");
  for (const id of ["char_31", "char_32", "char_33"])
    assert.ok(
      (await page
        .locator(
          `img[src$="avatars/${id}${id === "char_31" ? "-v2" : ""}.png"]`,
        )
        .count()) > 0,
    );
  for (const c of ROSTER) {
    await page
      .locator(".inventory-card-grid")
      .getByRole("button", { name: `Cấu hình ${c.name}`, exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    for (const detail of await dialog.locator(".config-kit > summary").all())
      await detail.click();
    const text = await dialog.innerText();
    assert.ok(text.includes(c.passive[0]), c.id);
    assert.ok(text.includes(c.passive[1]), c.id);
    assert.ok(text.includes(c.roleClass), c.id);
    await page.keyboard.press("Escape");
  }
  await page.getByRole("tab", { name: /Vật phẩm/ }).click();
  await page
    .locator(".inventory-card-grid")
    .getByRole("button", { name: "Trang bị Dép Tổ Ong", exact: true })
    .click();
  await page.getByRole("dialog").waitFor();
  assert.match(await page.getByRole("dialog").innerText(), /Tăng tốc độ và máu/);
  await page.keyboard.press("Escape");
  await navigate("Đi ải");
  assert.match(await page.locator(".mode-hero h1").innerText(), /BOSS/);
  await page.getByRole("button", { name: /^Bắt đầu ải 5/ }).click();
  await page.locator("canvas").waitFor();
  await page.waitForFunction(() => {
    const text =
      document.querySelector(".arena-top > span:last-child")?.textContent || "";
    return (
      parseInt(text) > 0 && Number(text.match(/·\s*([\d.]+)s/)?.[1]) >= 0.5
    );
  });
  await page
    .locator(".arena-shell")
    .screenshot({ path: "reports/new-card-arena-desktop.png" });
  await navigate("Mở bài");
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator(".boss-pack-hero")
    .screenshot({ path: "reports/boss-pack-mobile.png" });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  saved = (
    await (
      await page.request.get(`${api}/api/profiles/${id}`, { headers })
    ).json()
  ).profile;
  assert.equal(saved.bossPacks, 1);
  assert.equal(saved.cards.length, 33);
  assert.equal(saved.itemCards.length, 33);
  assert.deepEqual(errors, []);
  writeFileSync(
    "reports/boss-packs-browser.json",
    JSON.stringify(
      {
        rates,
        persistedBossPacks: saved.bossPacks,
        cards: saved.cards.length,
        items: saved.itemCards.length,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "Boss packs: desktop/mobile rates, debit + reward recovery, cloud profile, new art and campaign rendering passed.",
  );
} finally {
  await browser.close();
}
