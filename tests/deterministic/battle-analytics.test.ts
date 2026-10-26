import { describe, expect, it } from "vitest";
import {
  createBattle,
  debugConfig,
  captureReplayFrame,
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
