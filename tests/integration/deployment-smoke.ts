import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { CURRENT_RELEASE_VERSION } from "../../apps/web/src/PatchNotes";

const web = process.env.TEST_WEB;
const api = process.env.TEST_API;
assert.ok(
  web && api,
  "Set TEST_WEB and TEST_API to the deployment being verified",
);
const origin = new URL(web).origin;
const health = await fetch(`${api}/health`);
assert.equal(health.status, 200);
assert.equal(((await health.json()) as { ok: boolean }).ok, true);
const preflight = await fetch(`${api}/api/profiles/${crypto.randomUUID()}`, {
  method: "OPTIONS",
  headers: { Origin: origin, "Access-Control-Request-Method": "POST" },
});
assert.equal(preflight.status, 204);
assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), origin);

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
try {
  const errors: string[] = [];
  const kitAssets = new Set<string>();
  page.on("response", (response) => {
    const match = response.url().match(/\/art-v26\/(weapons|objects|constructs|vfx)\.webp$/);
    if (match && response.status() === 200) kitAssets.add(match[1]);
  });
  page.on("pageerror", (error) => {
    errors.push(error.message);
    console.error(error.stack);
  });
  async function navigate(name: string) {
    for (let n = 0; n < 3; n++) {
      const close = page.getByRole("button", {
        name: "Đóng thông báo",
        exact: true,
      });
      if (await close.isVisible()) await close.click();
      else break;
    }
    await page
      .getByRole("button", { name: "Mở menu điều hướng", exact: true })
      .click();
    await page
      .locator(".drawer-nav")
      .getByRole("button", { name, exact: true })
      .click();
  }
  let socketReceived = false;
  page.on("websocket", (socket) =>
    socket.on("framereceived", () => {
      socketReceived = true;
    }),
  );
  const profileResponse = page.waitForResponse(
    (response) =>
      response.url().startsWith(`${api}/api/profiles/`) &&
      response.request().method() === "POST",
  );
  await page.goto(web);
  assert.equal((await profileResponse).status(), 200);
  await page.locator(".gift-modal").waitFor();
  for (const size of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(size);
    const popup = await page.locator(".gift-modal").boundingBox();
    assert.ok(
      popup &&
        Math.abs(popup.x + popup.width / 2 - size.width / 2) < 1.5 &&
        Math.abs(popup.y + popup.height / 2 - size.height / 2) < 1.5,
      "Production popup center",
    );
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  const manifest = await page.request.get(
    web.replace(/\/$/, "") + "/release.json",
  );
  assert.equal((await manifest.json()).version, CURRENT_RELEASE_VERSION);
  for (const id of [31, 32, 33]) {
    const asset: import("playwright").APIResponse = await page.request.get(
      web.replace(/\/$/, "") + "/weapons/char_" + id + ".svg",
    );
    assert.equal(asset.status(), 200);
    assert.match(await asset.text(), /rotate\(-90 128 128\)/);
  }
  await navigate("Trao đổi bài");
  await page.getByText("Hồ sơ đã kết nối", { exact: true }).waitFor();
  await page.reload();
  await navigate("Trao đổi bài");
  await page.getByText("Hồ sơ đã kết nối", { exact: true }).waitFor();
  await navigate("Mô phỏng");
  assert.equal(
    await page.getByLabel("Thời gian thu đấu trường mô phỏng").inputValue(),
    "20",
  );
  await page
    .getByRole("button", { name: "Chạy mô phỏng ↗", exact: true })
    .click();
  await page.locator("canvas").waitFor();
  await page.waitForFunction(
    () => document.querySelectorAll(".fighter-token").length > 0,
  );
  const size = await page.locator("canvas").boundingBox();
  assert.ok(size && Math.abs(size.width - size.height) < 1);
  assert.equal(await page.locator(".team-color-key").count(), 4);
  const atlas = await page.request.get(
    `${web.replace(/\/$/, "")}/effects/combat-fx.svg`,
  );
  assert.equal(atlas.status(), 200);
  assert.equal(((await atlas.text()).match(/<svg x=/g) || []).length, 64);
  await page.waitForFunction(() => performance.getEntriesByType("resource")
    .filter((entry) => /\/art-v26\/(weapons|objects|constructs|vfx)\.webp$/.test(entry.name)).length === 4);
  assert.equal(kitAssets.size, 4, "Arena must load all generated v26 atlases");
  mkdirSync("reports", { recursive: true });
  await page.screenshot({ path: "reports/deployment-v26.png", fullPage: true });
  await navigate("Multiplayer");
  assert.equal(await page.getByLabel("Backend URL").inputValue(), api);
  await page.getByLabel("Tên của bạn").fill("Deployment smoke v26");
  const roomResponse = page.waitForResponse(
    (response) =>
      response.url() === `${api}/api/rooms` &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Tạo phòng", exact: true }).click();
  const room = await roomResponse;
  assert.equal(room.status(), 200);
  const created = await room.json();
  assert.equal(created.state.settings.shrinkSeconds, 20);
  await page.getByText(/Đã kết nối ·/).waitFor();
  assert.ok(socketReceived, "Production room WebSocket must receive state");
  assert.deepEqual(errors, []);
  writeFileSync(
    "reports/production-browser-v26.json",
    JSON.stringify(
      {
        version: CURRENT_RELEASE_VERSION,
        time: new Date().toISOString(),
        web,
        api,
        centeredPopup: true,
        verticalWeapons: true,
        profileRestored: true,
        websocket: socketReceived,
        generatedAtlases: [...kitAssets].sort(),
        errors,
      },
      null,
      2,
    ),
  );
  const leave = await fetch(`${api}/api/rooms/${created.code}/action`, {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      Authorization: `Bearer ${created.token}`,
    },
    body: JSON.stringify({
      protocol: 4,
      round: created.state.round,
      requestId: crypto.randomUUID(),
      action: { type: "LEAVE" },
    }),
  });
  assert.equal(leave.status, 200);
  console.log(
    "PASS: production API/CORS, persisted profile, room/WebSocket, 20s shrink, square arena, team colors and generated v26 atlases; no browser errors.",
  );
} catch (error) {
  mkdirSync("reports", { recursive: true });
  await page.screenshot({
    path: "reports/deployment-failure.png",
    fullPage: true,
  });
  console.error((await page.locator("body").innerText()).slice(0, 4500));
  throw error;
} finally {
  await browser.close();
}
