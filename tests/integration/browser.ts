import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  createBattle,
  debugConfig,
  rosterConfig,
  runBattle,
  calculateStateHash,
} from "../../packages/battle-engine/src/index";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1512, height: 1100 },
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173/");
  await page.locator("canvas").waitFor();
  await page.getByRole("button", { name: "Bắt đầu trận mới" }).click();
  await page.locator("canvas").waitFor();
  mkdirSync("reports", { recursive: true });
  await page.screenshot({ path: "reports/desktop.png", fullPage: true });
  const samples = Array.from({ length: 100 }, (_, i) => {
    const config = (i % 2 === 0 ? rosterConfig : debugConfig)(i % 5 === 0 ? 60 : 2 + (i % 19));
    config.shrinkSeconds = 10;
    return {
      config,
      seed: i + 1,
      expected: calculateStateHash(runBattle(config, i + 1)),
    };
  });
  const hashes = await page.evaluate(
    async ({ samples, path }) => {
      const engine = await import(/* @vite-ignore */ path);
      return samples.map((s) =>
        engine.calculateStateHash(engine.runBattle(s.config, s.seed)),
      ) as string[];
    },
    {
      samples,
      path:
        "/@fs/" +
        process.cwd().replaceAll("\\", "/") +
        "/packages/battle-engine/src/index.ts",
    },
  );
  samples.forEach((s, i) =>
    assert.equal(hashes[i], s.expected, "Chromium/Node seed " + s.seed),
  );
  await page.getByRole("button", { name: "Multiplayer", exact: true }).click();
  await page.getByRole("button", { name: "Tạo phòng", exact: true }).click();
  await page.getByRole("button", { name: "Copy mã" }).waitFor();
  await page.getByText("Đã kết nối", { exact: false }).waitFor();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("chaos-session")!),
  );
  await page.reload();
  await page.getByRole("button", { name: "Copy mã" }).waitFor();
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("chaos-session")!).code,
    ),
    saved.code,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "reports/mobile.png", fullPage: true });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    "Mobile overflow",
  );
  await page.setViewportSize({ width: 1512, height: 1100 });
  const origin = "http://127.0.0.1:5173",
    api = "http://127.0.0.1:8787",
    join = await fetch(`${api}/api/rooms/${saved.code}/join`, {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Replay Guest" }),
    });
  const joined = await join.json();
  assert.equal(join.status, 200, JSON.stringify(joined));
  const guest = joined as { token: string; id: string };
  async function sendAction(
    identity: { token: string; id: string },
    round: number,
    action: unknown,
  ) {
    const response = await fetch(`${api}/api/rooms/${saved.code}/action`, {
      method: "POST",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        Authorization: `Bearer ${identity.token}`,
      },
      body: JSON.stringify({
        protocol: 4,
        round,
        requestId: crypto.randomUUID(),
        action,
      }),
    });
    const result = await response.json();
    assert.equal(response.status, 200, JSON.stringify(result));
    return result as { state: { round: number } };
  }
  const initialStateResponse = await fetch(`${api}/api/rooms/${saved.code}`, {
    headers: { Origin: origin, Authorization: `Bearer ${saved.token}` },
  });
  const initialRoom = (await initialStateResponse.json()) as {
    state: { settings: Record<string, unknown> };
  };
  await sendAction(saved, 0, {
    type: "SET_CONFIG",
    settings: {
      ...initialRoom.state.settings,
      shrinkSeconds: 10,
      preparationSeconds: 10,
    },
  });
  await sendAction(saved, 0, { type: "READY", ready: true });
  await sendAction(guest, 0, { type: "READY", ready: true });
  await sendAction(saved, 0, { type: "START" });
  await page.locator(".shop").waitFor({ timeout: 10000 });
  assert.equal(await page.locator(".shop-offer").count(), 5);
  await sendAction(saved, 1, { type: "READY", ready: true });
  await sendAction(guest, 1, { type: "READY", ready: true });
  const matchStart = Date.now();
  let replayReady = false;
  while (Date.now() - matchStart < 30000) {
    const stateResponse = await fetch(`${api}/api/rooms/${saved.code}`, {
      headers: { Origin: origin, Authorization: `Bearer ${saved.token}` },
    });
    const state = (await stateResponse.json()) as {
      state: { phase: string; replay?: { chunks?: unknown[] } | null };
    };
    if (state.state.replay?.chunks?.length) {
      replayReady = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.equal(replayReady, true, "Worker did not produce recorded replay");
  await page.getByText("REPLAY CHÍNH THỨC", { exact: true }).waitFor({ timeout: 15000 });
  await page.waitForFunction(
    () => /tick ([1-9]\d*)/.test(document.querySelector(".arena-bottom")?.textContent || ""),
    { timeout: 15000 },
  );
  const nextPreparationDeadline = Date.now() + 60000;
  let nextPreparation: { phase: string; round: number; players: { id: string; shop: unknown[] }[] } | undefined;
  while (Date.now() < nextPreparationDeadline) {
    const response = await fetch(`${api}/api/rooms/${saved.code}`, {
      headers: { Origin: origin, Authorization: `Bearer ${saved.token}` },
    });
    const current = (await response.json()) as {
      state: { phase: string; round: number; players: { id: string; shop: unknown[] }[] };
    };
    if (current.state.phase === "PREPARATION" && current.state.round === 2) {
      nextPreparation = current.state;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(nextPreparation, "Server did not open the next shop phase");
  assert.equal(nextPreparation.players.find((player) => player.id === saved.id)?.shop.length, 5);
  await page.locator(".shop").waitFor({ timeout: 10000 });
  assert.equal(await page.locator(".shop-offer").count(), 5);
  assert.equal(await page.locator(".error").count(), 0, "Unexpected replay error");
  assert.deepEqual(errors, []);
  writeFileSync(
    "reports/browser.json",
    JSON.stringify(
      {
        runtime: await browser.version(),
        seeds: 100,
        crossRuntimeParity: true,
        uiChecks: [
          "Pixi WebGL canvas",
          "restart offline battle",
          "create multiplayer room",
          "session restore after reload",
          "initial and next-round shop phases",
          "390px responsive layout",
          "recorded multiplayer replay playback",
        ],
        pageErrors: errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: Chromium/Node parity for 100 seeds; desktop/mobile UI and session restore.",
  );
} finally {
  await browser.close();
}
