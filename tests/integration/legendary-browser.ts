import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1080 },
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const enginePath = `${process.cwd().replaceAll("\\", "/")}/packages/battle-engine/src/index.ts`;
  const catalogPath = `${process.cwd().replaceAll("\\", "/")}/packages/shared/src/catalog.ts`;
  await page.route("**/legendary-preview*", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root"></div><script type="module">
    import React from '/node_modules/.vite/deps/react.js';
    import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
    import RefreshRuntime from '/@react-refresh';
    import { createBattle, stepBattle, captureReplayFrame, ENGINE_VERSION } from '/@fs/${enginePath}';
    import { character } from '/@fs/${catalogPath}';
    import '/src/styles.css'; import '/src/catalog.css';
    RefreshRuntime.injectIntoGlobalHook(window);
    window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;
    const { Arena }=await import('/src/rendering/Arena.tsx');
    const load=id=>({characterId:id,classId:character(id).base,level:10,equipment:[],weaponRank:1});
    const config={width:72000,height:72000,shrinkSeconds:20,teams:[{id:'a',name:'Aura · King · Phóng xạ',loadouts:['char_22','char_23','char_31'].map(load)},{id:'b',name:'Cái Bang · Jake · Wacom',loadouts:['char_32','char_33','char_29'].map(load)}]};
    const state=createBattle(config,73);
    const points=[[22000,30000],[28000,28000],[24000,38000],[42000,30000],[44000,38000],[42000,21000]];
    state.fighters.forEach((f,i)=>{f.x=points[i][0];f.y=points[i][1];f.energy=100;f.skillReady=0;});
    const weaponPreview=location.search.includes("weapons");
    if(weaponPreview){const positions=[[22000,52000],[50000,52000],[18000,27000],[36000,27000],[54000,27000],[36000,52000]];state.fighters.forEach((f,i)=>{f.x=positions[i][0];f.y=positions[i][1];f.angle=24;f.energy=0;f.skillReady=999999;});}
    const frames=[captureReplayFrame(state)];
    for(let tick=1;tick<=300;tick++){if(weaponPreview)state.tick=tick;else stepBattle(state);if(tick%3===0)frames.push(captureReplayFrame(state));if(state.finished)break;}
    window.legendaryFixture={zones:frames.flatMap(f=>f.zones),events:frames.flatMap(f=>f.events),version:ENGINE_VERSION};
    const replay={format:1,version:ENGINE_VERSION,game:1,round:1,config,configHash:'',finalHash:'',totalTicks:frames.at(-1).tick,start:Date.now(),chunks:[{index:0,fromTick:0,toTick:frames.at(-1).tick,count:frames.length,hash:'',bytes:0}]};
    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Arena,{config,seed:73,replay,loadReplayChunk:async()=>frames,muted:true,low:false,label:'V24 · AURA / TẦM ĐÁNH / PHÓNG XẠ / ĐẠI TRẬN / ĐỒ ĂN',onError:message=>{throw Error(message)}}));
    </script></body></html>`,
    }),
  );
  await page.goto("http://127.0.0.1:5173/legendary-preview");
  await page.waitForFunction(
    () => document.querySelectorAll(".fighter-token").length === 6,
  );
  const fixture = await page.evaluate(() => (window as any).legendaryFixture);
  assert.ok(fixture.zones.some((z: any) => z.auraAttack));
  assert.ok(fixture.zones.some((z: any) => z.territory));
  assert.ok(fixture.events.some((e: any) => e.type === "radiation"));
  assert.ok(
    fixture.events.some((e: any) => e.type === "heal" && e.source === 4),
  );
  await page
    .locator(".arena-shell")
    .screenshot({ path: "reports/legendary-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator(".arena-shell")
    .screenshot({ path: "reports/legendary-mobile.png" });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  const image = await page.request.get(
    "http://127.0.0.1:5173/avatars/char_31-v2.png",
  );
  const hash = (bytes: Buffer) =>
    createHash("sha256").update(bytes).digest("hex");
  assert.equal(
    hash(await image.body()),
    hash(
      readFileSync(
        "C:/Users/STMTLS/AppData/Local/Temp/codex-clipboard-278cd415-d961-437e-a0be-278a53178309.png",
      ),
    ),
  );
  await page.setViewportSize({ width: 1280, height: 1080 });
  await page.goto("http://127.0.0.1:5173/legendary-preview?weapons");
  await page.waitForFunction(
    () => document.querySelectorAll(".fighter-token").length === 6,
  );
  await page
    .locator(".arena-shell")
    .screenshot({ path: "reports/vertical-weapons-desktop.png" });
  assert.deepEqual(errors, []);
  writeFileSync(
    "reports/legendary-browser.json",
    JSON.stringify(
      {
        engine: fixture.version,
        aura: true,
        territory: true,
        radiation: true,
        foodHealing: true,
        portraitMatchesAttachment: true,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "Legendary skills, VFX, new portrait and mobile/desktop replay passed.",
  );
} finally {
  await browser.close();
}
