import { computeStats } from "../../shared/src/balance";
import { validateMasteryTeam } from "../../shared/src/mastery";
import { campaignStats, isCampaignBoss } from "../../shared/src/campaign";
import { DEFAULT_ARENA_SIZE, DEFAULT_SHRINK_SECONDS } from "../../shared/src/arena";
import { combat } from "./combat";
import { DIRECTIONS, div, hash, random, UNIT, normalize } from "./math";
import { collide, constrain, pairs } from "./physics";
import { safeBounds } from "./bounds";
import { applyRoundTempo, stirStalledCombat } from "./pacing";
import { emptyCombatMetrics, combatMetrics, recordActiveEffects } from "./metrics";
import { statusPower, tickStatuses } from "./statuses";
import { resolveWeaponClashes } from "./weapon-clash";
import { moveConstructs, resolveConstructCollisions } from "./constructs";
import { ROSTER, type CharacterId } from "../../shared/src/catalog";
import {
  initializeCharacters,
  beforeCharacterTick,
  characterContacts,
  characterCombat,
} from "./character-combat";
import {
  ENGINE_VERSION,
  type BattleConfig,
  type BattleState,
  type TeamResult,
  type ReplayFrame,
} from "./types";
export * from "./types";
export * from "./math";
export * from "./bounds";
export * from "./pacing";
export * from "./metrics";
export * from "./weapons";
export * from "./statuses";
export function createBattle(config: BattleConfig, seed: number): BattleState {
  for (const team of config.teams) validateMasteryTeam(team.loadouts);
  if (config.recoveryPercent !== undefined && (!Number.isInteger(config.recoveryPercent) || config.recoveryPercent < 0 || config.recoveryPercent > 100)) throw Error("Invalid recovery modifier");
  if (
    config.teams.length < 2 ||
    config.teams.length > 20 ||
    config.shrinkSeconds < 1 ||
    config.shrinkSeconds > 60 ||
    !Number.isInteger(config.shrinkSeconds) ||
    config.width < 60000 ||
    config.width > 160000 ||
    config.height < 40000 ||
    config.height > 100000
  )
    throw Error("Invalid battle config");
  const ids = new Set(config.teams.map((t) => t.id));
  if (
    ids.size !== config.teams.length ||
    config.teams.some((t) => t.loadouts.length < 1 || t.loadouts.length > 3)
  )
    throw Error("Invalid teams");
  const s: BattleState = {
    version: ENGINE_VERSION,
    config: structuredClone(config),
    seed,
    rng: (seed ^ 0x9e3779b9) >>> 0 || 1,
    tick: 0,
    fighters: [],
    projectiles: [],
    zones: [],
    nextProjectile: 0,
    constructs: [],
    nextConstruct: 0,
    finished: false,
    eliminated: {},
    events: [],
    pending: [],
    bonds: {},
    groups: {},
  };
  const spawn = { rng: (seed ^ 0x85ebca6b) >>> 0 || 1 };
  if (config.campaign && (!Number.isInteger(config.campaign.stage) || config.campaign.stage < 1 || !config.teams.some(t => t.id === config.campaign!.enemyTeamId)))
    throw Error("Invalid campaign config");
  const campaignSquadSize = Math.max(1, ...config.teams.filter(t => t.id !== config.campaign?.enemyTeamId).map(t => t.loadouts.length));
  const loadouts = config.teams
    .flatMap((t) => t.loadouts.map((l, slot) => ({ team: t.id, l, slot })))
    .sort((a, b) => (a.team < b.team ? -1 : a.team > b.team ? 1 : 0));
  const cells = Array.from({ length: 60 }, (_, i) => i);
  for (let i = 59; i > 0; i--) {
    const j = random(spawn) % (i + 1);
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  for (let id = 0; id < loadouts.length; id++) {
    const { team, l, slot } = loadouts[id],
      campaignEnemy = !!config.campaign && team === config.campaign.enemyTeamId,
      boss = campaignEnemy && slot === 0 && isCampaignBoss(config.campaign!.stage),
      stats = campaignEnemy ? campaignStats(l, config.campaign!.stage, campaignSquadSize, slot) : computeStats(l),
      cell = cells[id],
      d = DIRECTIONS[random(spawn) % 32];
    s.fighters.push({
      id,
      masteryId: l.masteryId,
      masteryTarget: l.masteryTarget,
      boss: boss || undefined,
      team,
      classId: l.classId,
      characterId: l.characterId,
      slot,
      equipment: [...l.equipment],
      equipmentLevels: { ...l.equipmentLevels },
      level: l.level,
      skillReady: 0,
      nextAttack: stats.cooldown,
      memory: {},
      buffs: [],
      statuses: [],
      shields: [],
      stats,
      baseStats: { ...stats },
      x: div(config.width * (2 * (cell % 10) + 1), 20),
      y: div(config.height * (2 * div(cell, 10) + 1), 12),
      vx: div(d[0] * stats.speed, UNIT),
      vy: div(d[1] * stats.speed, UNIT),
      radius: boss ? 2800 : 1700,
      hp: l.startingHpPercent === undefined ? stats.hp : Math.max(1, Math.round(stats.hp * Math.max(1, Math.min(100, Number.isFinite(l.startingHpPercent) ? l.startingHpPercent : 100)) / 100)),
      shield: stats.shield,
      energy: 0,
      angle: random(spawn) % 32,
      facing: d[0] < 0 ? -1 : 1,
      superUntil: 0,
      slowUntil: 0,
      burnUntil: 0,
      burnSource: 0,
      hits: 0,
      dealt: 0,
      metrics: emptyCombatMetrics(),
      taken: 0,
      kills: 0,
      supers: 0,
      deadAt: -1,
      cooldowns: {},
    });
  }
  initializeCharacters(s);
  return s;
}
export function stepBattle(s: BattleState): BattleState {
  if (s.version !== ENGINE_VERSION) throw Error("Unsupported engine version");
  if (s.finished) return s;
  s.tick++;
  applyRoundTempo(s);
  beforeCharacterTick(s);
  tickStatuses(s);
  recordActiveEffects(s);
  stirStalledCombat(s);
  const bounds = safeBounds(s);
  for (const f of s.fighters) {
    if (f.hp <= 0) continue;
    let speed =
      f.slowUntil > s.tick
        ? f.characterId
          ? 100 - (f.memory.slowPower || 20)
          : 100 - (statusPower(f, "frozen", s.tick) || 45)
        : 100;
    speed = Math.min(speed, 100 - statusPower(f, "frozen", s.tick));
    if (statusPower(f, "introvert", s.tick)) speed = Math.min(speed, 85);
    const previousX = f.x, previousY = f.y;
    if (!f.characterId && f.superUntil > s.tick && f.classId === "assassin")
      speed += 40;
    if (f.characterId && (f.memory.dash || 0) > s.tick) {
      const [dx, dy] = normalize(f.vx, f.vy);
      f.x += div(dx * f.memory.dashSteps * speed, UNIT * 100);
      f.y += div(dy * f.memory.dashSteps * speed, UNIT * 100);
    } else {
      f.x += div(f.vx * speed, 100);
      f.y += div(f.vy * speed, 100);
    }
    f.x += f.memory.impulseX || 0; f.y += f.memory.impulseY || 0;
    f.memory.impulseX = div((f.memory.impulseX || 0) * 70, 100);
    f.memory.impulseY = div((f.memory.impulseY || 0) * 70, 100);
    constrain(f, s.config.width, s.config.height, bounds.left, bounds.top);
    f.memory.distanceMoved = Math.abs(f.x - previousX) + Math.abs(f.y - previousY);
  }
  moveConstructs(s);
  // Three deterministic solver passes address multi-body overlaps.
  resolveWeaponClashes(s);
  for (let pass = 0; pass < 3; pass++) {
    for (const [a, b] of pairs(s.fighters)) {
      if (pass === 0) characterContacts(s, s.fighters[a], s.fighters[b]);
      collide(s.fighters[a], s.fighters[b]);
    }
    for (const f of s.fighters)
      if (f.hp > 0)
        constrain(f, s.config.width, s.config.height, bounds.left, bounds.top);
  }
  resolveConstructCollisions(s);
  if (s.fighters.some((f) => f.characterId)) characterCombat(s);
  else combat(s, bounds);
  resolveConstructCollisions(s);
  // Knockback can change velocity, but cannot leave a body beyond the moving wall.
  for (const f of s.fighters)
    if (f.hp > 0)
      constrain(f, s.config.width, s.config.height, bounds.left, bounds.top);
  let alive = 0;
  for (const t of s.config.teams) {
    if (s.fighters.some((f) => f.team === t.id && f.hp > 0)) alive++;
    else if (s.eliminated[t.id] === undefined) s.eliminated[t.id] = s.tick;
  }
  s.finished = alive <= 1;
  return s;
}
export function calculateBattleResult(s: BattleState): TeamResult[] {
  const rows = s.config.teams.map((t) => {
    const fs = s.fighters.filter((f) => f.team === t.id);
    return {
      id: t.id,
      rank: 0,
      survivors: fs.filter((f) => f.hp > 0).length,
      hp: fs.reduce((n, f) => n + div(f.hp * 10000, f.stats.hp), 0),
      damage: fs.reduce((n, f) => n + f.dealt, 0),
      taken: fs.reduce((n, f) => n + f.taken, 0),
      kills: fs.reduce((n, f) => n + f.kills, 0),
      supers: fs.reduce((n, f) => n + f.supers, 0),
      eliminatedAt: s.eliminated[t.id] ?? s.tick + 1,
    };
  });
  rows.sort(
    (a, b) =>
      b.eliminatedAt - a.eliminatedAt ||
      b.hp - a.hp ||
      b.damage - a.damage ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}
export function serializeBattleState(s: BattleState) {
  return JSON.stringify(s);
}
export function restoreBattleState(snapshot: string): BattleState {
  const s = JSON.parse(snapshot) as BattleState;
  if (s.version !== ENGINE_VERSION) throw Error("Engine version mismatch");
  return s;
}
export const calculateStateHash = (s: BattleState) => hash(s);
export function captureReplayFrame(s: BattleState): ReplayFrame {
  return {
    tick: s.tick,
    fighters: s.fighters.map((f) => [
      f.x,
      f.y,
      f.hp,
      f.shield,
      f.energy,
      f.angle,
      f.skillReady,
      f.superUntil,
      f.slowUntil,
      f.burnUntil,
      f.deadAt,
      f.stats.reach,
      f.stats.hp,
      f.memory.swordHits || 0,
      f.supers,
      f.facing,
    ]),
    buffs: s.fighters.map((f) => structuredClone(f.buffs)),
    statuses: s.fighters.map((f) => structuredClone(f.statuses)),
    constructs: structuredClone(s.constructs),
    kitProjectiles: s.projectiles.filter(p => p.kit).map(p => ({ id: p.id, kit: p.kit, radius: p.radius || 450, returning: p.returning })),
    combatStats: s.fighters.map((f) => [f.stats.attack, f.stats.speed, f.stats.rotation, f.stats.charge, f.stats.cooldown, f.memory.spinRate || 100]),
    damageStats: s.fighters.map((f) => [f.dealt, f.taken]),
    supportStats: s.fighters.map((f) => structuredClone(combatMetrics(f))),
    projectiles: s.projectiles.map((p) => [
      p.id, p.owner, p.x, p.y, p.vx, p.vy, p.normal ?? false, p.kind,
    ]),
    zones: structuredClone(s.zones),
    pending: structuredClone(s.pending),
    events: s.events
      .filter((e) => e.type === "kill" || s.tick - e.tick < 35)
      .map((e) => ({ ...e })),
  };
}
export function runBattle(config: BattleConfig, seed: number) {
  const s = createBattle(config, seed);
  while (!s.finished) stepBattle(s);
  return s;
}
export function debugConfig(count: number): BattleConfig {
  if (!Number.isInteger(count) || count < 2 || count > 60)
    throw Error("Expected 2–60 fighters");
  const classes = [
    "swordsman",
    "guardian",
    "assassin",
    "frost",
    "ranger",
    "berserker",
  ] as const;
  const teams = Math.max(2, Math.ceil(count / 3));
  let index = 0;
  return {
    teams: Array.from({ length: teams }, (_, i) => ({
      id: "team-" + String(i).padStart(2, "0"),
      loadouts: Array.from(
        { length: Math.floor(count / teams) + (i < count % teams ? 1 : 0) },
        () => ({ classId: classes[index++ % 6], level: 0, equipment: [] }),
      ),
    })),
    shrinkSeconds: DEFAULT_SHRINK_SECONDS,
    width: DEFAULT_ARENA_SIZE,
    height: DEFAULT_ARENA_SIZE,
  };
}
export function rosterConfig(count: number): BattleConfig {
  const config = debugConfig(count);
  let cursor = 0;
  config.teams = config.teams.map((t) => ({
    ...t,
    loadouts: t.loadouts.map(() => {
      const c = ROSTER[cursor++ % ROSTER.length];
      return {
        classId: c.base as import("../../shared/src/balance").ClassId,
        characterId: c.id as CharacterId,
        level: 0,
        weaponRank: 1,
        equipment: [],
      };
    }),
  }));
  return config;
}
