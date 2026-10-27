import { describe, expect, it } from "vitest";
import {
  createBattle,
  debugConfig,
  applyStatus,
  tickStatuses,
  combatMetrics,
  recordActiveEffects,
  recordEffectTick,
  captureReplayFrame,
  serializeBattleState,
  restoreBattleState,
  calculateStateHash,
  stepBattle,
} from "../../packages/battle-engine/src/index";
import { characterDamage } from "../../packages/battle-engine/src/character-combat";
import {
  createBattleRecorder,
  characterMetrics,
} from "../../apps/web/src/battleAnalytics";

function squad() {
  const config = debugConfig(2),
    unit = config.teams[0].loadouts[0];
  config.teams = [
    { id: "a", loadouts: [unit, unit] },
    { id: "b", loadouts: [unit] },
  ];
  return createBattle(config, 17);
}
describe("authoritative support metrics", () => {
  it("counts actual healing and separates teammates from self healing", () => {
    const s = squad(),
      [source, ally] = s.fighters;
    ally.hp--;
    applyStatus(s, source, ally, "blessing", 30, 120);
    for (s.tick = 1; s.tick <= 30; s.tick++) tickStatuses(s);
    expect(combatMetrics(source)).toMatchObject({ healing: 1, allyHealing: 1 });
    source.hp--;
    applyStatus(s, source, source, "blessing", 30, 120);
    for (s.tick = 31; s.tick <= 60; s.tick++) tickStatuses(s);
    expect(combatMetrics(source)).toMatchObject({ healing: 2, allyHealing: 1 });
  });
  it("preserves some ally recovery after closing while self recovery reaches zero", () => {
    const s = squad(),
      [source, ally] = s.fighters;
    s.tick = 900;
    ally.hp -= 100;
    source.hp -= 100;
    applyStatus(s, source, ally, "blessing", 30, 120);
    applyStatus(s, source, source, "blessing", 30, 120);
    const before = [source.hp, ally.hp];
    for (s.tick = 901; s.tick <= 960; s.tick++) tickStatuses(s);
    expect(source.hp).toBe(before[0]);
    expect(ally.hp).toBeGreaterThan(before[1]);
    expect(combatMetrics(source).allyHealing).toBe(ally.hp - before[1]);
  });
  it("credits only consumed shield HP to the shield giver", () => {
    const s = squad(),
      [giver, ally, enemy] = s.fighters;
    ally.shield = 30;
    ally.shields = [{ source: giver.id, amount: 30, until: 100 }];
    ally.stats.defense = 0;
    const hp = ally.hp;
    characterDamage(s, enemy, ally, 20, false, 0);
    expect(ally.hp).toBe(hp);
    expect(combatMetrics(giver)).toMatchObject({
      shieldAbsorbed: 20,
      allyShieldAbsorbed: 20,
    });
    expect(combatMetrics(ally).shieldAbsorbed).toBe(0);
    expect(combatMetrics(enemy).damageByType.direct || 0).toBe(0);
  });
  it("counts successful effects and unions overlapping CC per source-target tick", () => {
    const s = squad(),
      [source, ally, enemy] = s.fighters;
    expect(applyStatus(s, source, enemy, "frozen", 25, 120)).toBe(true);
    expect(applyStatus(s, source, enemy, "frozen", 10, 120)).toBe(false);
    applyStatus(s, source, enemy, "frozen", 25, 120);
    applyStatus(s, source, enemy, "paralyzed", 20, 120);
    for (s.tick = 1; s.tick <= 3; s.tick++) {
      recordActiveEffects(s);
      recordActiveEffects(s);
    }
    expect(combatMetrics(source)).toMatchObject({
      debuffsApplied: 3,
      controlTicks: 3,
      effects: { frozen: 2, paralyzed: 1 },
      effectTicks: { frozen: 3, paralyzed: 3 },
    });
    recordEffectTick(s, source, ally, "aura:attack", "buff");
    recordEffectTick(s, source, ally, "rage", "buff");
    expect(combatMetrics(source).allyBuffTicks).toBe(1);
  });
  it("preserves metrics through checkpoints, replay overlap and historical aggregation", () => {
    const a = squad();
    applyStatus(a, a.fighters[0], a.fighters[2], "poison", 5, 120);
    for (let i = 0; i < 20; i++) stepBattle(a);
    const b = restoreBattleState(serializeBattleState(a));
    for (let i = 0; i < 20; i++) {
      stepBattle(a);
      stepBattle(b);
    }
    expect(calculateStateHash(a)).toBe(calculateStateHash(b));
    const recorder = createBattleRecorder(),
      frame = captureReplayFrame(a);
    recorder.replay([frame, frame], a.fighters);
    const summary = recorder.finish(a, a.config, "a", true);
    expect(summary.units[0].support).toEqual(a.fighters[0].metrics);
    const rows = characterMetrics([
      { ...summary, id: "support", mode: "simulation", savedAt: 1 },
    ]);
    expect(rows.some((row) => row.support.debuffsApplied > 0)).toBe(true);
    expect(
      summary.units.every((unit) => typeof unit.survived === "boolean"),
    ).toBe(true);
  });
});
