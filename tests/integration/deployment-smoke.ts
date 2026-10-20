import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const web = process.env.TEST_WEB;
const api = process.env.TEST_API;
assert.ok(web && api, "Set TEST_WEB and TEST_API to the deployment being verified");
const origin = new URL(web).origin;
const health = await fetch(`${api}/health`);
assert.equal(health.status, 200);
assert.equal((await health.json() as { ok: boolean }).ok, true);
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
  page.on("pageerror", error => { errors.push(error.message); console.error(error.stack); });
  let socketReceived = false;
  page.on("websocket", socket => socket.on("framereceived", () => { socketReceived = true; }));
  const profileResponse = page.waitForResponse(response =>
    response.url().startsWith(`${api}/api/profiles/`) && response.request().method() === "POST");
  await page.goto(web);
  assert.equal((await profileResponse).status(), 200);
  await page.getByRole("button", { name: "Trao đổi bài", exact: true }).click();
  await page.getByText("Hồ sơ đã kết nối", { exact: true }).waitFor();
  await page.reload();
  await page.getByRole("button", { name: "Trao đổi bài", exact: true }).click();
  await page.getByText("Hồ sơ đã kết nối", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Mô phỏng", exact: true }).click();
  assert.equal(await page.getByLabel("Thời gian thu đấu trường mô phỏng").inputValue(), "20");
  await page.getByRole("button", { name: "Chạy mô phỏng ↗", exact: true }).click();
  await page.locator("canvas").waitFor();
  await page.waitForFunction(() => document.querySelectorAll(".fighter-token").length > 0);
  const size = await page.locator("canvas").boundingBox();
  assert.ok(size && Math.abs(size.width - size.height) < 1);
  assert.equal(await page.locator(".team-color-key").count(), 4);
  const atlas = await page.request.get(`${web.replace(/\/$/, "")}/effects/combat-fx.svg`);
  assert.equal(atlas.status(), 200);
  assert.equal(((await atlas.text()).match(/<svg x=/g) || []).length, 64);
  mkdirSync("reports", { recursive: true });
  await page.screenshot({ path: "reports/deployment-v22.png", fullPage: true });
  await page.getByRole("button", { name: "Multiplayer", exact: true }).click();
  assert.equal(await page.getByLabel("Backend URL").inputValue(), api);
  await page.getByLabel("Tên của bạn").fill("Deployment smoke v22");
  const roomResponse = page.waitForResponse(response =>
    response.url() === `${api}/api/rooms` && response.request().method() === "POST");
  await page.getByRole("button", { name: "Tạo phòng", exact: true }).click();
  const room = await roomResponse;
  assert.equal(room.status(), 200);
  const created = await room.json();
  assert.equal(created.state.settings.shrinkSeconds, 20);
  await page.getByText(/Đã kết nối ·/).waitFor();
  assert.ok(socketReceived, "Production room WebSocket must receive state");
  assert.deepEqual(errors, []);
  const leave = await fetch(`${api}/api/rooms/${created.code}/action`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json", Authorization: `Bearer ${created.token}` },
    body: JSON.stringify({ protocol: 4, round: created.state.round, requestId: crypto.randomUUID(), action: { type: "LEAVE" } }),
  });
  assert.equal(leave.status, 200);
  console.log("PASS: production API/CORS, persisted profile, room/WebSocket, 20s shrink, square arena, team colors and 64-frame VFX; no browser errors.");
} catch (error) {
  mkdirSync("reports", { recursive: true });
  await page.screenshot({ path: "reports/deployment-failure.png", fullPage: true });
  console.error((await page.locator("body").innerText()).slice(0, 4500));
  throw error;
} finally {
  await browser.close();
}
