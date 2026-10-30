import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROSTER } from "../../packages/shared/src/catalog";
import { masteriesFor } from "../../packages/shared/src/mastery";
import { experienceOf } from "../../packages/shared/src/experience";
import { CURRENT_RELEASE_VERSION } from "../../apps/web/src/PatchNotes";

const dir = process.env.TEST_REPORT_DIR || "reports/mastery-vfx";
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors: string[] = [],
  assets = new Set<string>(),
  failed: string[] = [],
  checked: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", (r) => {
  if (r.url().includes("/effects/mastery/")) {
    if (r.ok()) assets.add(r.url().split("/").pop()!);
    else failed.push(r.url());
  }
});
try {
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
  await catalog
    .getByRole("group", { name: "Mục cẩm nang" })
    .getByRole("button", { name: /^Bí kỹ / })
    .click();
  const query = catalog.getByRole("textbox", { name: "Tìm trong cẩm nang" });
  for (const c of ROSTER) {
    const skills = masteriesFor(c.id);
    await query.fill(skills[0].name);
    await catalog
      .locator(".catalog-reference-card")
      .filter({
        has: page.getByRole("heading", { name: skills[0].name, exact: true }),
      })
      .getByRole("button", { name: "Xem cách đánh ↗", exact: true })
      .click();
    const preview = page.locator(".mastery-preview[open]");
    for (const skill of skills) {
      await preview
        .getByRole("group", { name: "So sánh nhánh Bí kỹ" })
        .getByRole("button", { name: skill.name, exact: true })
        .click();
      await preview.locator("canvas").waitFor();
      await page.waitForFunction(
        () =>
          Number(
            document
              .querySelector(".mastery-preview .arena-top span:last-child")
              ?.textContent?.match(/([\d.]+)s/)?.[1] || 0,
          ) > 0.2,
      );
      assert.equal(await preview.getByRole("alert").count(), 0, skill.id);
      checked.push(skill.id);
      if (
        [
          "tigerBurst",
          "char_03:pressure",
          "char_05:resolve",
          "giftShield",
          "roseWall",
          "auraEcho",
          "char_29:tempo",
          "char_31:tempo",
          "char_33:resolve",
        ].includes(skill.id)
      ) {
        await preview
          .getByRole("button", { name: "Tạm dừng", exact: true })
          .click();
        await preview.screenshot({
          path: `${dir}/${skill.id.replace(":", "-")}-desktop.png`,
        });
      }
    }
    await page.keyboard.press("Escape");
  }
  assert.equal(checked.length, 99);
  // The same real preview is usable on narrow screens with all new assets active.
  await query.fill("Trận Địa Pháo");
  await catalog
    .getByRole("button", { name: "Xem cách đánh ↗", exact: true })
    .click();
  const preview = page.locator(".mastery-preview[open]");
  await preview.locator("canvas").waitFor();
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(await preview.evaluate((el) => el.scrollWidth <= el.clientWidth));
    await page.screenshot({ path: `${dir}/radiation-mobile-${width}.png` });
  }
  await page.keyboard.press("Escape");
  const saved = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("circlewar-profile-journal-v1") || "{}")
        .profile ||
      JSON.parse(localStorage.getItem("circlewar-player-profile-v1")!),
  );
  assert.deepEqual(saved.experience.mastery, { char_03: 2 });
  await page.setViewportSize({ width: 1440, height: 1000 });
  if (process.env.TEST_SKIP_GPU === "1") {
    assert.deepEqual(errors, []);
    assert.deepEqual(failed, []);
    assert.equal(assets.size, 4);
    writeFileSync(
      `${dir}/browser.json`,
      JSON.stringify(
        {
          web: process.env.TEST_WEB,
          characters: 33,
          masteries: 99,
          checked,
          assets: [...assets],
          widths: [1440, 360, 390],
          noProgressAwarded: true,
          errors,
          failed,
        },
        null,
        2,
      ),
    );
    console.log(
      "PASS: all 33 characters / 99 masteries render on the deployment, all four VFX atlases load, desktop/mobile and unchanged progress; no browser errors.",
    );
  } else {
    // Exercise Pixi's real GPU atlas frames and the render layer at the engine limits.
    const render = await page.evaluate(
      async (enginePath) => {
        const pixiUrl = performance
          .getEntriesByType("resource")
          .find((e) => e.name.includes("/pixi__js.js?"))?.name;
        if (!pixiUrl) throw new Error("Pixi application module was not loaded");
        const paths = [
          "/src/rendering/mastery-vfx.ts",
          "/src/rendering/mastery-vfx-themes.ts",
          pixiUrl,
          enginePath,
        ];
        const [vfx, themes, pixi, engine] = await Promise.all(
          paths.map((p) => import(/* @vite-ignore */ p)),
        );
        const definitions = themes.MASTERY_VFX_DEFINITIONS;
        const atlas = await vfx.loadMasteryVfx(
          definitions.map((d: any) => d.id),
        );
        const app = new pixi.Application();
        await app.init({
          width: 1440,
          height: 1672,
          background: "#080c13",
          antialias: true,
          autoStart: false,
          preference: "webgl",
        });
        const host = document.createElement("div");
        host.id = "vfx-test-gallery";
        host.style.cssText =
          "position:fixed;inset:0;z-index:99999;background:#080c13;overflow:auto";
        host.append(app.canvas);
        document.querySelector("body")!.appendChild(host);
        const animated: any[] = [];
        definitions.forEach((d: any, i: number) => {
          const x = (i % 9) * 160,
            y = Math.floor(i / 9) * 152;
          const bg = new pixi.Graphics()
            .roundRect(x + 3, y + 3, 154, 146, 10)
            .fill(0x151923);
          app.stage.addChild(bg);
          const s = new pixi.Sprite(atlas.casts.get(d.id)[2]);
          s.anchor.set(0.5);
          s.position.set(x + 67, y + 53);
          s.width = s.height = 103;
          app.stage.addChild(s);
          animated.push(s);
          const body = new pixi.Sprite(atlas.projectiles.get(d.id));
          body.anchor.set(0.5);
          body.position.set(x + 124, y + 78);
          body.width = body.height = 42;
          app.stage.addChild(body);
          const label = new pixi.Text({
            text: `${d.characterId} · ${d.name}`,
            style: {
              fontFamily: "Arial",
              fontSize: 10,
              fill: d.theme.light,
              wordWrap: true,
              wordWrapWidth: 145,
              align: "center",
            },
          });
          label.anchor.set(0.5, 0);
          label.position.set(x + 80, y + 113);
          app.stage.addChild(label);
        });
        app.render();
        (window as any).__vfxGallery = { app, animated, atlas, definitions };
        const stressApp = new pixi.Application();
        await stressApp.init({
          width: 900,
          height: 700,
          background: "#151314",
          autoStart: false,
        });
        const ground = new pixi.Container(),
          combat = new pixi.Container();
        stressApp.stage.addChild(ground, combat);
        const layer = new vfx.MasteryVfxLayer(ground, combat, atlas);
        const state = engine.createBattle(engine.rosterConfig(60), 29);
        state.fighters.forEach((f: any, i: number) => {
          const d = definitions[i];
          f.masteryId = d.id;
          f.characterId = d.characterId;
        });
        state.projectiles = Array.from({ length: 240 }, (_, i) => ({
          id: i,
          owner: i % 60,
          x: 1000 + i * 200,
          y: 20000 + i * 70,
          vx: 600,
          vy: 100,
          mastery: { style: i % 3 === 0 ? "mine" : "orbit" },
        }));
        state.constructs = Array.from({ length: 64 }, (_, i) => ({
          id: i,
          owner: i % 60,
          x: 5000 + i * 600,
          y: 45000,
          radius: 900,
          hp: 100,
          variant: i % 2 ? "medic" : "hunter",
        }));
        const hash = engine.calculateStateHash(state),
          before = JSON.stringify(state);
        layer.draw(state, 0, 0.009, 0.009, true, false);
        stressApp.render();
        const normalCount = layer.activeCount;
        if (
          engine.calculateStateHash(state) !== hash ||
          JSON.stringify(state) !== before
        )
          throw new Error("VFX mutated combat state");
        layer.draw(state, 0, 0.009, 0.009, true, true);
        stressApp.render();
        const lowCount = layer.activeCount;
        layer.draw(state, 0, 0.009, 0.009, false, false);
        stressApp.render();
        const off =
          layer.activeCount === 0 &&
          layer.sprites.every((s: any) => !s.visible) &&
          !layer.trails.visible;
        state.tick = 30;
        layer.draw(state, 30, 0.009, 0.009, true, false);
        state.tick = 0;
        layer.draw(state, 0, 0.009, 0.009, true, false);
        const rewind = layer.activeCount > 0;
        // Exclude initial GPU compilation/upload from steady render sampling.
        const start = performance.now();
        for (let i = 1; i <= 90; i++) {
          state.tick = i;
          layer.draw(state, i, 0.009, 0.009, true, false);
          stressApp.render();
        }
        const meanMs = (performance.now() - start) / 90;
        stressApp.destroy(true);
        return {
          casts: atlas.casts.size,
          projectiles: atlas.projectiles.size,
          normalCount,
          lowCount,
          off,
          rewind,
          immutable: true,
          meanMs,
        };
      },
      "/@fs/" +
        resolve("packages/battle-engine/src/index.ts").replaceAll("\\", "/"),
    );
    assert.equal(render.casts, 99);
    assert.equal(render.projectiles, 99);
    assert.ok(render.normalCount <= 40);
    assert.ok(render.lowCount <= 12);
    assert.ok(render.off);
    assert.ok(render.rewind);
    const extractGallery = async () =>
      page.evaluate(async () => {
        const { app } = (window as any).__vfxGallery;
        return app.renderer.extract.base64({
          target: app.stage,
          clearColor: "#080c13",
        });
      });
    writeFileSync(
      `${dir}/gpu-gallery.png`,
      Buffer.from((await extractGallery()).split(",")[1], "base64"),
    );
    await page.evaluate(() => {
      const { app, animated, atlas, definitions } = (window as any)
        .__vfxGallery;
      animated.forEach(
        (s: any, i: number) =>
          (s.texture = atlas.casts.get(definitions[i].id)[5]),
      );
      app.render();
    });
    writeFileSync(
      `${dir}/gpu-gallery-frame-5.png`,
      Buffer.from((await extractGallery()).split(",")[1], "base64"),
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(failed, []);
    assert.equal(assets.size, 4);
    writeFileSync(
      `${dir}/browser.json`,
      JSON.stringify(
        {
          checked,
          characters: 33,
          masteries: 99,
          assets: [...assets],
          render,
          widths: [1440, 360, 390],
          errors,
          failed,
        },
        null,
        2,
      ),
    );
    console.log(
      JSON.stringify({
        pass: true,
        characters: 33,
        masteries: 99,
        assets: [...assets],
        render,
      }),
    );
  }
} catch (e) {
  await page.screenshot({ path: `${dir}/failure.png` });
  console.error({ errors, failed });
  throw e;
} finally {
  await browser.close();
}
