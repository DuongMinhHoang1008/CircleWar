import type {
  BattleConfig,
  BattleState,
  Fighter,
  ReplayFrame,
  CombatMetrics,
} from "../../../packages/battle-engine/src/types";
import { emptyCombatMetrics } from "../../../packages/battle-engine/src/metrics";

export const ANALYTICS_KEY = "circlewar-battle-analytics-v1";
export const ANALYTICS_LIMIT = 200;
export type BattleMode = "campaign" | "simulation" | "multiplayer";
export interface BattleUnit {
  masteryId?: string;
  masteryTarget?: string;
  id: number;
  team: string;
  teamName: string;
  characterId: string;
  level: number;
  equipment: string[];
  equipmentLevels: Record<string, number>;
  combat?: { damage: number; taken: number };
  support?: CombatMetrics;
  survived?: boolean;
  hp?: number;
  maxHp?: number;
  aliveTicks?: number;
}
export interface BattleSummary {
  config?: BattleConfig;
  version: string;
  seed?: number;
  ticks: number;
  winner: string;
  stage?: number;
  units: BattleUnit[];
  kills: { tick: number; source: number; target: number }[];
  tactics: { bonds: number; groups: number };
}
export interface BattleRecord extends BattleSummary {
  id: string;
  mode: BattleMode;
  savedAt: number;
}
type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;

/** Collect once per simulation tick / replay frame, outside React state updates. */
export function createBattleRecorder() {
  const seen = new Set<string>(),
    kills: BattleSummary["kills"] = [];
  const tactics = { bonds: 0, groups: 0 };
  const damageSnapshots = new Map<
    number,
    { tick: number; damage: number; taken: number }
  >();
  const supportSnapshots = new Map<
    number,
    { tick: number; metrics: CombatMetrics }
  >();
  return {
    observe(
      events: BattleState["events"],
      fighters: Pick<Fighter, "id" | "team">[],
      team?: string,
      afterTick = -1,
    ) {
      for (const event of events) {
        if (event.tick <= afterTick) continue;
        const kill = event.type === "kill",
          bond = event.type.startsWith("bond:"),
          group = event.type.startsWith("group:");
        if (!kill && !bond && !group) continue;
        if (
          !kill &&
          team &&
          fighters.find((f) => f.id === event.source)?.team !== team
        )
          continue;
        const key = `${event.tick}:${event.type}:${event.source}:${event.target}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (kill)
          kills.push({
            tick: event.tick,
            source: event.source,
            target: event.target,
          });
        else if (bond) tactics.bonds++;
        else tactics.groups++;
      }
    },
    replay(
      frames: ReplayFrame[],
      fighters: Pick<Fighter, "id" | "team">[],
      team?: string,
    ) {
      for (const frame of frames) {
        this.observe(frame.events, fighters, team);
        frame.damageStats?.forEach(([damage, taken], index) => {
          const id = fighters[index]?.id;
          if (
            id !== undefined &&
            frame.tick >= (damageSnapshots.get(id)?.tick ?? -1)
          )
            damageSnapshots.set(id, { tick: frame.tick, damage, taken });
        });
        frame.supportStats?.forEach((metrics, index) => {
          const id = fighters[index]?.id;
          if (
            id !== undefined &&
            frame.tick >= (supportSnapshots.get(id)?.tick ?? -1)
          )
            supportSnapshots.set(id, {
              tick: frame.tick,
              metrics: structuredClone(metrics),
            });
        });
      }
    },
    finish(
      state: BattleState,
      config: BattleConfig,
      winner: string,
      hideSeed = false,
    ): BattleSummary {
      return {
        config: hideSeed ? undefined : structuredClone(config),
        version: state.version,
        seed: hideSeed ? undefined : state.seed,
        ticks: state.tick,
        winner,
        stage: config.campaign?.stage,
        units: state.fighters.map((f) => ({
          id: f.id,
          team: f.team,
          teamName: config.teams.find((t) => t.id === f.team)?.name || f.team,
          characterId: f.characterId || f.classId,
          level: f.level,
          equipment: [...f.equipment],
          equipmentLevels: { ...f.equipmentLevels },
          masteryId:f.masteryId, masteryTarget:f.masteryTarget,
          survived: f.hp > 0,
          hp: f.hp,
          maxHp: f.stats.hp,
          aliveTicks: f.deadAt < 0 ? state.tick : f.deadAt,
          support: hideSeed
            ? supportSnapshots.get(f.id)?.metrics
            : f.metrics
              ? structuredClone(f.metrics)
              : undefined,
          combat: hideSeed
            ? damageSnapshots.has(f.id)
              ? {
                  damage: damageSnapshots.get(f.id)!.damage,
                  taken: damageSnapshots.get(f.id)!.taken,
                }
              : undefined
            : { damage: f.dealt, taken: f.taken },
        })),
        kills: [...kills].sort(
          (a, b) =>
            a.tick - b.tick || a.source - b.source || a.target - b.target,
        ),
        tactics: { ...tactics },
      };
    },
  };
}

function validRecord(value: unknown): value is BattleRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as BattleRecord;
  return (
    typeof record.id === "string" &&
    ["campaign", "simulation", "multiplayer"].includes(record.mode) &&
    Number.isFinite(record.savedAt) &&
    Number.isInteger(record.ticks) &&
    record.ticks >= 0 &&
    typeof record.version === "string" &&
    typeof record.winner === "string" &&
    Array.isArray(record.units) &&
    record.units.length <= 60 &&
    record.units.every(
      (unit) =>
        unit &&
        Number.isInteger(unit.id) &&
        typeof unit.characterId === "string" &&
        typeof unit.team === "string" &&
        (unit.survived === undefined || typeof unit.survived === "boolean") &&
        (unit.aliveTicks === undefined ||
          (Number.isSafeInteger(unit.aliveTicks) &&
            unit.aliveTicks >= 0 &&
            unit.aliveTicks <= record.ticks)) &&
        (unit.support === undefined || validSupport(unit.support)) &&
        (unit.combat === undefined ||
          (!!unit.combat &&
            Number.isSafeInteger(unit.combat.damage) &&
            unit.combat.damage >= 0 &&
            Number.isSafeInteger(unit.combat.taken) &&
            unit.combat.taken >= 0)) &&
        Number.isInteger(unit.level) &&
        Array.isArray(unit.equipment) &&
        unit.equipment.every((id) => typeof id === "string"),
    ) &&
    Array.isArray(record.kills) &&
    record.kills.every(
      (kill) =>
        kill &&
        Number.isInteger(kill.tick) &&
        Number.isInteger(kill.source) &&
        Number.isInteger(kill.target),
    )
  );
}
export function readBattleRecords(storage: Storage): BattleRecord[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(ANALYTICS_KEY) || "[]");
    return Array.isArray(value)
      ? value.filter(validRecord).slice(0, ANALYTICS_LIMIT)
      : [];
  } catch {
    return [];
  }
}
function validSupport(value: CombatMetrics) {
  if (!value || typeof value !== "object") return false;
  return Object.entries(emptyCombatMetrics()).every(([key, initial]) => {
    const item = value[key as keyof CombatMetrics];
    return typeof initial === "number"
      ? Number.isSafeInteger(item) && (item as number) >= 0
      : !!item &&
          typeof item === "object" &&
          !Array.isArray(item) &&
          Object.keys(item).length <= 100 &&
          Object.values(item).every(
            (amount) => Number.isSafeInteger(amount) && amount >= 0,
          );
  });
}
export function saveBattleRecord(storage: Storage, record: BattleRecord) {
  const previous = readBattleRecords(storage);
  if (previous.some((item) => item.id === record.id)) return previous;
  const records = [record, ...previous].slice(0, ANALYTICS_LIMIT);
  storage.setItem(ANALYTICS_KEY, JSON.stringify(records));
  return records;
}
export function characterMetrics(records: BattleRecord[]) {
  const rows = new Map<
    string,
    {
      id: string;
      games: number;
      wins: number;
      kills: number;
      deaths: number;
      damage: number;
      taken: number;
      damageGames: number;
      survivors: number;
      survivalGames: number;
      support: CombatMetrics;
      supportGames: number;
    }
  >();
  for (const record of records)
    for (const unit of record.units) {
      const row = rows.get(unit.characterId) || {
        id: unit.characterId,
        games: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        damage: 0,
        taken: 0,
        damageGames: 0,
        survivors: 0,
        survivalGames: 0,
        support: emptyCombatMetrics(),
        supportGames: 0,
      };
      row.games++;
      if (unit.survived !== undefined) {
        row.survivalGames++;
        row.survivors += Number(unit.survived);
      }
      if (unit.support) {
        row.supportGames++;
        for (const key of Object.keys(
          unit.support,
        ) as (keyof CombatMetrics)[]) {
          const amount = unit.support[key];
          if (typeof amount === "number")
            (row.support[key] as number) += amount;
          else {
            const into = row.support[key] as Record<string, number>;
            for (const [kind, count] of Object.entries(amount))
              into[kind] = (into[kind] || 0) + count;
          }
        }
      }
      if (unit.combat) {
        row.damage += unit.combat.damage;
        row.taken += unit.combat.taken;
        row.damageGames++;
      }
      if (unit.team === record.winner) row.wins++;
      for (const kill of record.kills) {
        if (
          kill.source === unit.id &&
          record.units.some(
            (target) => target.id === kill.target && target.team !== unit.team,
          )
        )
          row.kills++;
        if (kill.target === unit.id) row.deaths++;
      }
      rows.set(unit.characterId, row);
    }
  return [...rows.values()].sort(
    (a, b) =>
      b.wins / b.games - a.wins / a.games ||
      b.games - a.games ||
      a.id.localeCompare(b.id),
  );
}
export function matchupMetrics(records: BattleRecord[]) {
  const rows = new Map<
    string,
    { source: string; target: string; kills: number }
  >();
  for (const record of records)
    for (const kill of record.kills) {
      const source = record.units.find((unit) => unit.id === kill.source),
        target = record.units.find((unit) => unit.id === kill.target);
      if (!source || !target || source.team === target.team) continue;
      const key = `${source.characterId}:${target.characterId}`;
      const row = rows.get(key) || {
        source: source.characterId,
        target: target.characterId,
        kills: 0,
      };
      row.kills++;
      rows.set(key, row);
    }
  return [...rows.values()].sort((a, b) => b.kills - a.kills);
}
