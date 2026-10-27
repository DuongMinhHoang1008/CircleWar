import { describe, expect, it } from "vitest";
import {
  createBattle,
  debugConfig,
  captureReplayFrame,
  applyStatus,
  tickStatuses,
} from "../../packages/battle-engine/src/index";
import {
  ANALYTICS_KEY,
  createBattleRecorder,
  saveBattleRecord,
  readBattleRecords,
  characterMetrics,
  matchupMetrics,
  type BattleRecord,
} from "../../apps/web/src/battleAnalytics";
import { retainCombatEvents } from "../../packages/battle-engine/src/events";

const memory = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) || null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
};
function record(): BattleRecord {
  const state = createBattle(debugConfig(2), 1),
    recorder = createBattleRecorder();
  state.tick = 30;
  state.events.push(
    { tick: 28, type: "kill", source: 0, target: 1, amount: 1 },
    { tick: 29, type: "bond:01", source: 0, target: 1, amount: 0 },
  );
  recorder.observe(state.events, state.fighters);
  recorder.replay([captureReplayFrame(state)], state.fighters);
  return {
    ...recorder.finish(state, state.config, state.fighters[0].team),
    id: "one",
    mode: "simulation",
    savedAt: 1,
  };
}
describe("battle analytics", () => {
  it("saves authoritative HP damage and keeps old records outside damage averages", () => {
    const state = createBattle(debugConfig(2), 1),
      recorder = createBattleRecorder();
    state.fighters[0].dealt = 120;
    state.fighters[1].taken = 120;
    const summary = recorder.finish(state, state.config, "a");
    expect(summary.units[0].combat).toEqual({ damage: 120, taken: 0 });
    const entry: BattleRecord = {
      ...summary,
      id: "damage",
      mode: "simulation",
      savedAt: 2,
    };
    const old: BattleRecord = {
      ...entry,
      id: "old",
      units: entry.units.map(({ combat, ...unit }) => unit),
    };
    const row = characterMetrics([entry, old]).find(
      (r) => r.id === summary.units[0].characterId,
    )!;
    expect(row).toMatchObject({ damage: 120, damageGames: 1 });
    const storage = memory();
    saveBattleRecord(storage, entry);
    expect(readBattleRecords(storage)[0].units[0].combat?.damage).toBe(120);
    storage.setItem(
      ANALYTICS_KEY,
      JSON.stringify([
        {
          ...entry,
          units: [{ ...entry.units[0], combat: { damage: -1, taken: 0 } }],
        },
      ]),
    );
    expect(readBattleRecords(storage)).toEqual([]);
  });
  it("uses cumulative replay snapshots despite duplicate or out-of-order chunks", () => {
    const state = createBattle(debugConfig(2), 1),
      recorder = createBattleRecorder();
    const early = captureReplayFrame(state);
    state.tick = 30;
    state.fighters[0].dealt = 900;
    state.fighters[1].taken = 900;
    const final = captureReplayFrame(state);
    recorder.replay([final, early, final], state.fighters);
    expect(
      recorder.finish(state, state.config, "a", true).units[0].combat?.damage,
    ).toBe(900);
    const legacy = createBattleRecorder();
    const { damageStats, ...old } = early;
    legacy.replay([old], state.fighters);
    expect(
      legacy.finish(state, state.config, "a", true).units[0].combat,
    ).toBeUndefined();
  });
  it("tags periodic damage by its actual status source", () => {
    for (const kind of ["burn", "poison", "bleeding", "radiation"] as const) {
      const state = createBattle(debugConfig(2), 1);
      const [source, target] = state.fighters;
      applyStatus(state, source, target, kind, 10, 120);
      for (let tick = 1; tick <= 60; tick++) {
        state.tick = tick;
        target.memory.distanceMoved = 100;
        tickStatuses(state);
      }
      expect(
        state.events.some((e) => e.type === "hit" && e.damageType === kind),
        kind,
      ).toBe(true);
    }
  });
  it("retains kill and synergy events through bursts larger than the visual feed", () => {
    const state = createBattle(debugConfig(2), 10);
    state.events.push(
      { tick: 1, type: "kill", source: 0, target: 1, amount: 1 },
      { tick: 1, type: "bond:01", source: 0, target: 1, amount: 0 },
    );
    for (let i = 0; i < 400; i++)
      state.events.push({
        tick: 2,
        type: "hit",
        source: 0,
        target: 1,
        amount: 1,
      });
    retainCombatEvents(state);
    expect(state.events.filter((event) => event.type === "hit")).toHaveLength(
      120,
    );
    expect(state.events.filter((event) => event.type === "kill")).toHaveLength(
      1,
    );
    expect(
      state.events.filter((event) => event.type.startsWith("bond:")),
    ).toHaveLength(1);
  });
  it("deduplicates overlapping replay frames and records actual kills rather than inferring duels", () => {
    const sample = record();
    expect(sample.kills).toHaveLength(1);
    expect(sample.tactics).toEqual({ bonds: 1, groups: 0 });
    expect(characterMetrics([sample])[0]).toMatchObject({ wins: 1, kills: 1 });
    expect(matchupMetrics([sample])).toHaveLength(1);
    sample.kills.push(
      { tick: 30, source: 1, target: 1 },
      { tick: 30, source: -1, target: 1 },
    );
    expect(matchupMetrics([sample])).toHaveLength(1);
  });
  it("keeps the latest 200, refuses duplicate ids and recovers from malformed history", () => {
    const storage = memory(),
      sample = record();
    storage.setItem(ANALYTICS_KEY, "broken");
    expect(readBattleRecords(storage)).toEqual([]);
    for (let i = 0; i < 205; i++)
      saveBattleRecord(storage, { ...sample, id: String(i) });
    const records = saveBattleRecord(storage, { ...sample, id: "204" });
    expect(records).toHaveLength(200);
    expect(records[0].id).toBe("204");
    expect(records.at(-1)?.id).toBe("5");
  });
  it("does not silently lose history if local storage is full", () => {
    const storage = memory(),
      sample = record();
    saveBattleRecord(storage, sample);
    expect(() =>
      saveBattleRecord(
        {
          getItem: storage.getItem,
          setItem: () => {
            throw Error("quota");
          },
        },
        { ...sample, id: "two" },
      ),
    ).toThrow("quota");
    expect(readBattleRecords(storage)).toHaveLength(1);
  });
});
