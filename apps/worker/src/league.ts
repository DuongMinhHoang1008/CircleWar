import { DurableObject } from "cloudflare:workers";
import {
  ADVENTURE_VERSION,
  adventureConfig,
  legalLoanTeam,
  normalizeContracts,
  weeklyEnemies,
  weekId,
  type Contract,
} from "../../../packages/shared/src/adventure";
import {
  createBattle,
  stepBattle,
  ENGINE_VERSION,
  type BattleState,
} from "../../../packages/battle-engine/src/index";
import type { Loadout } from "../../../packages/shared/src/balance";
import {
  WEEKLY_OFFICIAL_REWARDS,
  rewardReceipt,
  type ModeReward,
} from "../../../packages/shared/src/mode-rewards";

const VERSION = `${ADVENTURE_VERSION}:${ENGINE_VERSION}`;
export interface LeagueEnv {
  LEAGUES: DurableObjectNamespace<League>;
}
export interface LeagueAttempt {
  id: string;
  team: Loadout[];
  contracts: Contract[];
  results: { won: boolean; ticks: number; unfinished?: boolean }[];
  state?: BattleState;
  seeds: number[];
  finished: boolean;
  published?: boolean;
  name: string;
  title: string;
}
export interface LeagueProgress {
  bestWins?: number;
  week: string;
  version: string;
  attempts: number;
  current?: LeagueAttempt;
}
export interface LeagueRow {
  profileId: string;
  name: string;
  title: string;
  wins: number;
  contracts: string;
}
export function advanceLeagueAttempt(
  attempt: LeagueAttempt,
  week: string,
  budget = 240,
) {
  if (attempt.finished) return;
  const index = attempt.results.length;
  attempt.state ||= createBattle(
    adventureConfig(
      attempt.team,
      weeklyEnemies(week, Math.floor(index / 3), attempt.contracts),
      attempt.contracts,
    ),
    attempt.seeds[index],
  );
  for (
    let n = 0;
    n < budget && !attempt.state.finished && attempt.state.tick < 5400;
    n++
  )
    stepBattle(attempt.state);
  if (!attempt.state.finished && attempt.state.tick < 5400) return;
  const won =
    attempt.state.finished &&
    attempt.state.fighters.some((f) => f.team === "team-player" && f.hp > 0) &&
    !attempt.state.fighters.some((f) => f.team !== "team-player" && f.hp > 0);
  attempt.results.push({
    won,
    ticks: attempt.state.tick,
    ...(!attempt.state.finished ? { unfinished: true } : {}),
  });
  delete attempt.state;
  attempt.finished = attempt.results.length === 9;
}
export function rankLeague(rows: LeagueRow[]) {
  const sorted = rows
    .slice()
    .sort(
      (a, b) =>
        a.contracts.localeCompare(b.contracts) ||
        b.wins - a.wins ||
        a.name.localeCompare(b.name),
    );
  return sorted.map((row, index) => {
    const group = sorted.filter((r) => r.contracts === row.contracts);
    const rank = 1 + group.filter((r) => r.wins > row.wins).length;
    return {
      name: row.name,
      title: row.title,
      wins: row.wins,
      contracts: row.contracts,
      rank,
    };
  });
}
/** Only the router exposes GET. Seed creation and publishing are internal DO calls. */
export class League extends DurableObject<LeagueEnv> {
  async fetch(req: Request) {
    return this.ctx.blockConcurrencyWhile(async () => {
      const url = new URL(req.url);
      if (url.pathname === "/seeds") {
        let seeds = await this.ctx.storage.get<number[]>("seeds");
        if (!seeds) {
          seeds = Array.from(
            crypto.getRandomValues(new Uint32Array(9)),
            (value) => value || 1,
          );
          await this.ctx.storage.put("seeds", seeds);
        }
        return Response.json({ seeds });
      }
      const rows = (await this.ctx.storage.get<LeagueRow[]>("rows")) || [];
      if (url.pathname === "/best")
        return Response.json({
          bestWins: Math.max(
            0,
            ...rows
              .filter((r) => r.profileId === url.searchParams.get("profile"))
              .map((r) => r.wins),
          ),
        });
      if (req.method === "POST" && url.pathname === "/publish") {
        const row = (await req.json()) as LeagueRow;
        const old = rows.find(
          (r) => r.profileId === row.profileId && r.contracts === row.contracts,
        );
        if (!old || row.wins > old.wins) {
          const next = rows.filter((r) => r !== old).concat(row);
          // Bound storage while keeping the best results in every contract group.
          const retained = Array.from(
            new Set(next.map((r) => r.contracts)),
          ).flatMap((group) =>
            next
              .filter((r) => r.contracts === group)
              .sort(
                (a, b) =>
                  b.wins - a.wins || a.profileId.localeCompare(b.profileId),
              )
              .slice(0, 100),
          );
          await this.ctx.storage.put("rows", retained);
        }
      }
      return Response.json({
        leaderboard: rankLeague(
          (await this.ctx.storage.get<LeagueRow[]>("rows")) || [],
        ),
      });
    });
  }
}
export async function leagueRequest(
  storage: DurableObjectStorage,
  env: LeagueEnv,
  req: Request,
  profileId: string,
  grantReward?: (reward: ModeReward, receipt: string) => Promise<void>,
) {
  const week = weekId(),
    league = env.LEAGUES.get(env.LEAGUES.idFromName(`${week}:${VERSION}`));
  let progress = await storage.get<LeagueProgress>("league-progress");
  if (progress && progress.week !== week)
    await storage.put(`league-archive:${progress.week}`, progress);
  const requestedWeek = new URL(req.url).searchParams.get("week");
  if (requestedWeek && requestedWeek !== week) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(requestedWeek) ||
      requestedWeek >= week ||
      weekId(Date.parse(requestedWeek)) !== requestedWeek ||
      req.method !== "GET"
    )
      throw Error("Chỉ xem lại các tuần đã kết thúc.");
    const archive =
      progress?.week === requestedWeek
        ? progress
        : await storage.get<LeagueProgress>(`league-archive:${requestedWeek}`);
    if (!archive)
      return Response.json({
        week: requestedWeek,
        attempts: 0,
        version: VERSION,
        leaderboard: [],
        closed: true,
      });
    const archivedLeague = env.LEAGUES.get(
      env.LEAGUES.idFromName(`${requestedWeek}:${archive.version}`),
    );
    const board = (await (
      await archivedLeague.fetch("https://league/board")
    ).json()) as { leaderboard: unknown[] };
    return Response.json({
      week: requestedWeek,
      version: archive.version,
      attempts: archive.attempts,
      leaderboard: board.leaderboard,
      closed: true,
      review: archive.current
        ? {
            team: archive.current.team,
            contracts: archive.current.contracts,
            seeds: archive.current.seeds,
            results: archive.current.results,
          }
        : undefined,
    });
  }
  if (!progress || progress.week !== week)
    progress = { week, version: VERSION, attempts: 0 };
  if (progress.version !== VERSION) {
    progress = {
      week,
      version: VERSION,
      attempts: 0,
    };
  }
  const body =
    req.method === "POST"
      ? ((await req.json()) as {
          type?: string;
          team?: unknown;
          contracts?: unknown;
          id?: string;
          name?: string;
          title?: string;
          rewardId?: string;
        })
      : {};
  if (req.method === "GET" || body.type === "CLAIM_REWARD") {
    const previous = (await (
      await league.fetch(
        `https://league/best?profile=${encodeURIComponent(profileId)}`,
      )
    ).json()) as { bestWins: number };
    progress.bestWins = Math.max(progress.bestWins || 0, previous.bestWins);
  }
  progress.bestWins = Math.max(
    progress.bestWins || 0,
    progress.current?.finished
      ? progress.current.results.filter((r) => r.won).length
      : 0,
  );
  let granted: { id: string; reward: ModeReward; receipt: string } | undefined;
  if (body.type === "CLAIM_REWARD") {
    const milestone = WEEKLY_OFFICIAL_REWARDS.find(
      (m) => m.id === body.rewardId,
    );
    if (!milestone || !grantReward || progress.bestWins < milestone.goal)
      throw Error("Chưa đủ số thắng để nhận mốc thưởng này.");
    granted = {
      id: milestone.id,
      reward: milestone.reward,
      receipt: rewardReceipt(milestone.id),
    };
    await grantReward(granted.reward, granted.receipt);
  } else if (body.type === "START") {
    if (progress.current && !progress.current.finished)
      throw Error("Lượt trước đang diễn ra. Tiếp tục lượt đó trước.");
    if (progress.attempts >= 3)
      throw Error("Bạn đã dùng ba lượt chính thức tuần này.");
    const contracts = normalizeContracts(body.contracts || []),
      team = legalLoanTeam(body.team, contracts);
    const { seeds } = (await (
      await league.fetch("https://league/seeds")
    ).json()) as { seeds: number[] };
    progress.current = {
      id: crypto.randomUUID(),
      team,
      contracts,
      results: [],
      seeds,
      finished: false,
      name:
        (body.name || "Challenger")
          .replace(/[\u0000-\u001f]/g, "")
          .trim()
          .slice(0, 32) || "Challenger",
      title: (body.title || "").slice(0, 100),
    };
    progress.attempts++;
  } else if (body.type === "STEP") {
    if (!progress.current || progress.current.id !== body.id)
      throw Error("Lượt đánh giá không còn hợp lệ. Tải lại trạng thái.");
    advanceLeagueAttempt(progress.current, week);
    if (progress.current.finished)
      progress.bestWins = Math.max(
        progress.bestWins,
        progress.current.results.filter((r) => r.won).length,
      );
  } else if (body.type) throw Error("Thao tác thử thách không hợp lệ.");
  // Checkpoint before publishing; a retry after either write uses the same result.
  await storage.put("league-progress", progress);
  if (progress.current?.finished && !progress.current.published) {
    const attempt = progress.current;
    const response = await league.fetch("https://league/publish", {
      method: "POST",
      body: JSON.stringify({
        profileId,
        name: attempt.name,
        title: attempt.title,
        wins: attempt.results.filter((r) => r.won).length,
        contracts: attempt.contracts.join("+"),
      } satisfies LeagueRow),
    });
    if (!response.ok) throw Error("Chưa công bố được kết quả; hãy tải lại.");
    attempt.published = true;
    await storage.put("league-progress", progress);
  }
  const { leaderboard } = (await (
    await league.fetch("https://league/board")
  ).json()) as { leaderboard: unknown[] };
  const current = progress.current;
  return Response.json({
    week,
    version: VERSION,
    attempts: progress.attempts,
    leaderboard,
    bestWins: progress.bestWins,
    granted,
    current: current
      ? {
          id: current.id,
          done: current.results.length,
          wins: current.results.filter((r) => r.won).length,
          finished: current.finished,
          team: current.team,
          contracts: current.contracts,
          results: current.results,
        }
      : undefined,
  });
}
