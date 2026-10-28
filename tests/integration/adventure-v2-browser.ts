import assert from "node:assert/strict";
import { chromium, type Page } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import {
  ROSTER,
  CATALOG_ITEMS,
  type CharacterId,
} from "../../packages/shared/src/catalog";
import {
  defaultDailyTeam,
  dailyPool,
  dailyEnemies,
  challengeDay,
} from "../../packages/shared/src/daily-challenges";
import {
  adventureConfig,
  loanUnit,
  stableSeed,
} from "../../packages/shared/src/adventure";
import {
  createBattle,
  stepBattle,
} from "../../packages/battle-engine/src/index";
import { experienceOf } from "../../packages/shared/src/experience";
import {
  createRun,
  starterChoices,
  enterNode,
  beginRunBattle,
  settleRunBattle,
  takeLoot,
  runMap,
  type RoguelikeRun,
} from "../../packages/shared/src/roguelike";
import { CURRENT_RELEASE_VERSION } from "../../apps/web/src/PatchNotes";

const web = process.env.TEST_WEB || "http://127.0.0.1:5173/",
  errors: string[] = [],
  day = challengeDay();
const reportDir = process.env.TEST_REPORT_DIR || "reports";
mkdirSync(reportDir, { recursive: true });
function winningTeam() {
  const pool = dailyPool(day);
  for (let a = 0; a < pool.length - 2; a++)
    for (let b = a + 1; b < pool.length - 1; b++)
      for (let c = b + 1; c < pool.length; c++) {
        const team = [pool[a], pool[b], pool[c]].map((id) =>
          loanUnit(id, CATALOG_ITEMS.find((i) => i.affinity === id)?.id),
        );
        const state = createBattle(
          adventureConfig(team, dailyEnemies(day, 0)),
          stableSeed(`daily:${day}:0`),
        );
        for (let i = 0; i < 5400 && !state.finished; i++) stepBattle(state);
        if (
          state.finished &&
          state.fighters.some((f) => f.team === "team-player" && f.hp > 0) &&
          !state.fighters.some((f) => f.team === "team-rival" && f.hp > 0)
        )
          return team;
      }
  throw Error(
    "Daily pool has no tested winning combination; review difficulty.",
  );
}
const team = winningTeam();
const base = () => ({
  cards: ROSTER.map((c) => ({ characterId: c.id, level: 10, xp: 0 })),
  itemCards: CATALOG_ITEMS.map((i) => ({ itemId: i.id, level: 10, xp: 0 })),
  team: ["char_01", "char_08", "char_15"],
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
  mailbox: [],
  updateRewardVersion: CURRENT_RELEASE_VERSION,
  experience: {
    ...experienceOf({}),
    mastery: Object.fromEntries(ROSTER.map((c) => [c.id, 2])),
    dailyChallenge: { day, selected: 0, teams: { "0": team } },
  },
});
const browser = await chromium.launch({ channel: "chrome", headless: true });
async function makePage(profile: ReturnType<typeof base> | object) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(
    ({ profile, release }) => {
      if (localStorage.getItem("adventure-v2-ready")) return;
      localStorage.setItem("adventure-v2-ready", "1");
      localStorage.setItem(
        "circlewar-player-profile-v1",
        JSON.stringify(profile),
      );
      localStorage.setItem("circlewar-update-reward-version-v1", release);
    },
    { profile, release: CURRENT_RELEASE_VERSION },
  );
  await page.goto(web);
  await page
    .getByRole("navigation", { name: "Điều hướng chính" })
    .getByRole("button", { name: "Kho đồ", exact: true })
    .click();
  await page
    .locator('.inventory-card-grid article[draggable="true"]')
    .first()
    .waitFor();
  return page;
}
async function nav(page: Page, label: string) {
  await page
    .getByRole("button", { name: "Mở menu điều hướng", exact: true })
    .click();
  await page
    .locator(".drawer-nav")
    .getByRole("button", { name: label, exact: true })
    .click();
}
const saved = (page: Page) =>
  page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("circlewar-profile-journal-v1") || "{}")
        .profile ||
      JSON.parse(localStorage.getItem("circlewar-player-profile-v1")!),
  );
try {
  const page = await makePage(base());
  await nav(page, "Thử thách ngày");
  await page
    .getByRole("heading", { name: "9 nhân vật. Ba thử thách." })
    .waitFor();
  assert.equal(await page.getByRole("tab", { name: /xếp hạng/ }).count(), 0);
  assert.equal(await page.locator(".loan-team").isVisible(), false);
  await page.getByText(/Chọn đội trong pool hôm nay/).click();
  assert.equal(
    await page
      .getByRole("combobox", { name: "Quân cho mượn 1", exact: true })
      .locator("option")
      .count(),
    9,
  );
  const before = await saved(page);
  await page.getByRole("tab", { name: /Thử thách 2/ }).click();
  await page
    .getByRole("combobox", { name: "Đồ cho mượn 1", exact: true })
    .selectOption("item_01");
  const second = (await saved(page)).experience.dailyChallenge.teams["1"];
  assert.deepEqual(second[0].equipment, ["item_01"]);
  await page.getByRole("tab", { name: /Thử thách 1/ }).click();
  assert.deepEqual(
    (await saved(page)).experience.dailyChallenge.teams["0"],
    team,
  );
  await page.getByRole("tab", { name: /Thử thách 2/ }).click();
  assert.equal(
    await page
      .getByRole("combobox", { name: "Đồ cho mượn 1", exact: true })
      .inputValue(),
    "item_01",
  );
  await page.reload();
  await nav(page, "Thử thách ngày");
  assert.deepEqual(
    (await saved(page)).experience.dailyChallenge.teams["1"],
    second,
  );
  await page.getByRole("tab", { name: /Thử thách 1/ }).click();
  await page.screenshot({
    path: `${reportDir}/daily-challenge-desktop.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Bắt đầu thử thách 1 →", exact: true })
    .click();
  await page.getByRole("button", { name: "2×", exact: true }).click();
  await page.locator(".battle-debrief").waitFor({ timeout: 90000 });
  const won = await saved(page);
  assert.equal(won.experience.medals[`daily:${day}:0`], 1);
  assert.deepEqual(won.experience.dailyChallenge.teams["0"], team);
  assert.equal(
    won.mailbox
      .filter((m: any) => m.id.startsWith("reward:"))
      .reduce((n: number, m: any) => n + m.packs, 0),
    5,
  );
  assert.equal(won.rewardReserve, 0);
  await page
    .getByRole("status", { name: "Mở khóa hành trình nhân vật" })
    .waitFor();
  assert.ok(won.experience.masteryNotices.length > 0);
  const firstNotice = won.experience.masteryNotices[0];
  await page
    .getByRole("button", { name: "Đóng thông báo Bí kỹ", exact: true })
    .click();
  assert.ok(
    !(await saved(page)).experience.masteryNotices.includes(firstNotice),
  );
  while (
    await page
      .getByRole("button", { name: "Đóng thông báo Bí kỹ", exact: true })
      .count()
  )
    await page
      .getByRole("button", { name: "Đóng thông báo Bí kỹ", exact: true })
      .click();
  await page
    .getByText("Xem lại & thử nghiệm đội hình", { exact: true })
    .click();
  await page.getByRole("button", { name: "Xem lại trận", exact: true }).click();
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  assert.deepEqual((await saved(page)).rewardReceipts, won.rewardReceipts);
  assert.deepEqual(
    (await saved(page)).experience.mastery,
    won.experience.mastery,
  );
  // Dismiss the remaining persistent notifications before inspecting other screens.
  while (
    await page
      .getByRole("button", { name: "Đóng thông báo Bí kỹ", exact: true })
      .count()
  )
    await page
      .getByRole("button", { name: "Đóng thông báo Bí kỹ", exact: true })
      .click();
  await nav(page, "Hòm thư");
  await page
    .getByRole("heading", { name: "Thưởng chinh phục", exact: true })
    .waitFor();
  await nav(page, "Hành trình nhân vật");
  assert.equal(await page.locator(".mastery-journey-card").count(), 33);
  await page.screenshot({
    path: `${reportDir}/mastery-all-characters-desktop.png`,
    fullPage: true,
  });
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await nav(page, "Thử thách ngày");
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `daily overflow ${width}`,
    );
    await page.screenshot({
      path: `${reportDir}/daily-challenge-mobile-${width}.png`,
      fullPage: true,
    });
  }
  await page.close();

  // A persisted shop is a separate fixture; none of the player's collection is consumed.
  let run = createRun("shop-test", 52, starterChoices(52)[0]);
  run = takeLoot(
    settleRunBattle(beginRunBattle(enterNode(run, "1:0")), true, [
      { characterId: run.team[0], hp: 60, maxHp: 100 },
    ]).run!,
  );
  const shop = await makePage({
    ...base(),
    experience: { ...experienceOf({}), roguelike: run },
  });
  await nav(shop, "Viễn chinh");
  await shop.getByRole("button", { name: /Cửa hàng.*Mua đồ/ }).click();
  const runBefore = (await saved(shop)).experience.roguelike;
  await shop
    .locator(".run-node-panel .run-offer")
    .filter({ has: shop.locator(".item-sprite") })
    .first()
    .click();
  let bought = (await saved(shop)).experience.roguelike;
  assert.ok(bought.bag.length >= runBefore.bag.length);
  assert.equal(bought.purchased.length, 1);
  assert.ok(bought.gold < runBefore.gold);
  await shop
    .locator(".run-node-panel .run-offer")
    .filter({ has: shop.locator(".portrait") })
    .first()
    .click();
  assert.equal((await saved(shop)).experience.roguelike.team.length, 2);
  await shop.reload();
  await nav(shop, "Viễn chinh");
  assert.equal((await saved(shop)).experience.roguelike.team.length, 2);
  assert.equal(
    (await saved(shop)).experience.roguelike.bag.length,
    bought.bag.length,
  );
  await shop.getByText(/Trang bị & quản lý đội/).click();
  await shop
    .locator(".run-team-row select")
    .first()
    .selectOption(bought.bag[0]);
  await shop.locator(".run-team-row button").last().click();
  assert.equal((await saved(shop)).experience.roguelike.team.length, 1);
  await shop.screenshot({
    path: `${reportDir}/roguelike-shop-desktop.png`,
    fullPage: true,
  });
  for (const width of [360, 390]) {
    await shop.setViewportSize({ width, height: 844 });
    assert.ok(
      await shop.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `shop overflow ${width}`,
    );
    await shop.screenshot({
      path: `${reportDir}/roguelike-shop-mobile-${width}.png`,
      fullPage: true,
    });
  }
  await shop.close();

  const wounded: RoguelikeRun = {
    ...run,
    id: "death-test",
    floor: 9,
    phase: "node",
    node: "10:1",
    levels: { [run.team[0]]: 1 },
    health: { [run.team[0]]: 1 },
    path: runMap(run.seed)
      .slice(0, 9)
      .map((row) => row[0]),
    wins: 5,
  };
  const death = await makePage({
    ...base(),
    experience: { ...experienceOf({}), roguelike: wounded },
  });
  await nav(death, "Viễn chinh");
  await death
    .getByRole("button", { name: "Vào trận tầng 10 →", exact: true })
    .click();
  // Reload while a battle is unresolved: the same floor, team and HP must resume.
  await death.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  const pending = (await saved(death)).experience.roguelike;
  assert.equal(pending.phase, "battle");
  await death.reload();
  await nav(death, "Viễn chinh");
  assert.deepEqual((await saved(death)).experience.roguelike, pending);
  await death
    .getByRole("button", { name: "Tiếp tục trận tầng 10 →", exact: true })
    .click();
  await death.getByRole("button", { name: "2×", exact: true }).click();
  await death.locator(".battle-debrief").waitFor({ timeout: 90000 });
  assert.equal((await saved(death)).experience.roguelike, undefined);
  assert.equal((await saved(death)).experience.lastRun.reason, "defeat");
  assert.equal(
    await death
      .getByRole("button", { name: "Thử lại cùng điều kiện", exact: true })
      .count(),
    0,
  );
  await death.reload();
  await nav(death, "Viễn chinh");
  await death
    .getByRole("heading", { name: "Chọn nhân vật khởi đầu", exact: true })
    .waitFor();
  assert.equal((await saved(death)).cards.length, 33);
  assert.equal((await saved(death)).itemCards.length, 33);
  await death.setViewportSize({ width: 390, height: 844 });
  await death.screenshot({
    path: `${reportDir}/roguelike-defeat-mobile.png`,
    fullPage: true,
  });
  const payout = await makePage({
    ...base(),
    experience: { ...experienceOf({}), roguelikeDay: day, roguelikeBest: 12 },
  });
  await nav(payout, "Viễn chinh");
  await payout.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("circlewar-profile-journal-v1")!).profile
        .choiceChests === 1,
  );
  const fullReward = await saved(payout);
  assert.equal(fullReward.bossPacks, 15);
  assert.equal(
    fullReward.mailbox.reduce((n: number, m: any) => n + m.packs, 0),
    150,
  );
  await payout.getByText(/Thưởng vượt tầng hôm nay · tốt nhất/).click();
  await payout.screenshot({
    path: `${reportDir}/roguelike-revised-rewards.png`,
    fullPage: true,
  });
  await payout.reload();
  await nav(payout, "Viễn chinh");
  assert.equal((await saved(payout)).choiceChests, 1);
  assert.equal((await saved(payout)).bossPacks, 15);
  assert.equal(
    (await saved(payout)).mailbox.reduce((n: number, m: any) => n + m.packs, 0),
    150,
  );
  await payout.close();
  assert.deepEqual(errors, []);
  writeFileSync(
    `${reportDir}/adventure-v2-browser.json`,
    JSON.stringify(
      {
        ok: true,
        web,
        version: CURRENT_RELEASE_VERSION,
        time: new Date().toISOString(),
        dailyPool: 9,
        savedTeamsPerOpponent: true,
        dailyWinAutoMail: true,
        unlockNotification: true,
        replayNoDuplicate: true,
        fullJourneys: 33,
        shopPersisted: true,
        recruitmentAndDismissal: true,
        battleResume: true,
        singleLossDestroysRun: true,
        completeRunReward: {
          packs: 150,
          bossPacks: 15,
          choiceChests: 1,
          overflowMailed: true,
          reloadIdempotent: true,
        },
        mobileWidths: [360, 390],
        errors,
      },
      null,
      2,
    ),
  );
  console.log("Daily, roguelike, mastery and inbox browser checks passed");
} finally {
  await browser.close();
}
