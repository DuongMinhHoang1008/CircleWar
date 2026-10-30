import { describe, expect, it } from "vitest";
import {
  MASTERIES,
  masteryUnlocked,
  masteriesFor,
  validateMasteryTeam,
} from "../../packages/shared/src/mastery";
import { MASTERY_PATHS } from "../../packages/shared/src/mastery-paths";
import {
  CHARACTER_JOURNEYS,
  journeyObjective,
} from "../../packages/shared/src/mastery-journey";
import { adventureConfig, loanUnit } from "../../packages/shared/src/adventure";
import {
  createBattle,
  applyStatus,
  statusPower,
  incomingStatusMultiplier,
  tickStatuses,
  emptyCombatMetrics,
} from "../../packages/battle-engine/src/index";
import {
  characterCombat,
  characterDamage,
} from "../../packages/battle-engine/src/character-combat";

import { masteryShield } from "../../packages/battle-engine/src/mastery";
import type { KitCombatServices } from "../../packages/battle-engine/src/kit-combat";
import { advanceMastery } from "../../apps/web/src/adventureProgress";
import { experienceOf } from "../../packages/shared/src/experience";
import type { BattleSummary } from "../../apps/web/src/battleAnalytics";

function fixture(id = "char_02:pressure") {
  const skill = MASTERIES.find((m) => m.id === id)!;
  const s = createBattle(
    adventureConfig(
      [
        { ...loanUnit(skill.characterId as any), masteryId: id },
        loanUnit("char_11"),
      ],
      [loanUnit("char_01"), loanUnit("char_12"), loanUnit("char_15")],
    ),
    19,
  );
  s.tick = 1;
  for (const f of s.fighters) {
    f.hp = f.stats.hp = f.baseStats.hp = 1000;
    f.stats.attack = f.baseStats.attack = 10;
    f.stats.defense = f.baseStats.defense = 30;
    f.x = 30000 + f.id * 1000;
    f.y = 30000;
    f.nextAttack = 10000;
    f.energy = 0;
    f.shield = 0;
    f.shields = [];
  }
  const [source, ally, enemy] = s.fighters;
  ally.hp = 300;
  return { s, source, ally, enemy, skill };
}
const services: KitCombatServices = {
  damage: (s, f, t, raw) => characterDamage(s, f, t, raw, false, 0),
  normal: (s, f, t, scale) =>
    !!characterDamage(s, f, t, (f.stats.attack * scale) / 100, true, 0),
  heal: (_s, _f, t, amount) => {
    const actual = Math.min(t.stats.hp - t.hp, amount);
    t.hp += actual;
    return actual;
  },
  shield: masteryShield,
  buff: () => {},
};

describe("bounded new statuses", () => {
  it("uses the strongest effect, clamps armor at zero and distinguishes direct damage from DoT", () => {
    const { s, source, enemy } = fixture();
    applyStatus(s, source, enemy, "fracture", 999, 60);
    applyStatus(s, source, enemy, "fracture", 5, 300);
    applyStatus(s, enemy, enemy, "ward", 999, 60);
    expect(incomingStatusMultiplier(enemy, 1)).toBe(85 * 80);
    expect(applyStatus(s, source, enemy, "ward", 10, 60)).toBe(false);
    enemy.stats.defense = 4;
    expect(incomingStatusMultiplier(enemy, 1)).toBe(100 * 80);
    const before = enemy.hp;
    characterDamage(s, source, enemy, 100, false, 0);
    expect(before - enemy.hp).toBe(80);
    applyStatus(s, source, enemy, "poison", 3, 60);
    for (let i = 0; i < 30; i++) {
      s.tick++;
      tickStatuses(s);
    }
    expect(enemy.hp).toBe(before - 83);
    expect(incomingStatusMultiplier(enemy, 62)).toBe(96 * 100);
  });
});

describe("role-based journey stages", () => {
  function summary(): BattleSummary {
    return {
      version: "test",
      ticks: 900,
      winner: "team-rival",
      tactics: { bonds: 0, groups: 0 },
      kills: [],
      units: [
        {
          id: 0,
          characterId: "char_02",
          team: "team-player",
          teamName: "P",
          level: 10,
          equipment: [],
          equipmentLevels: {},
          maxHp: 1000,
          support: emptyCombatMetrics(),
          combat: { damage: 300, taken: 200 },
          aliveTicks: 600,
        },
      ],
    };
  }
  it("changes objectives at each threshold and counts losses only for actual role contribution", () => {
    const battle = summary(),
      exp = { ...experienceOf({}), mastery: { char_02: 3 } };
    expect(journeyObjective("char_02", 2).kind).toBe("winOrSignature");
    expect(journeyObjective("char_02", 3).kind).toBe("effect");
    expect(journeyObjective("char_02", 8).kind).toBe("damage");
    expect(advanceMastery(exp, battle).mastery.char_02).toBe(3);
    battle.units[0].support!.effects.diabetes = 1;
    expect(advanceMastery(exp, battle).mastery.char_02).toBe(4);
    battle.winner = "team-player";
    battle.units[0].support!.effects = {};
    expect(advanceMastery(exp, battle).mastery.char_02).toBe(3);
  });
  it("requires real ally support rather than self buffs or healing and unlocks once per threshold", () => {
    const battle = summary(),
      u = battle.units[0];
    u.characterId = "char_13";
    const exp = { ...experienceOf({}), mastery: { char_13: 7 } };
    u.support!.healing = 100;
    expect(advanceMastery(exp, battle).mastery.char_13).toBe(7);
    u.support!.allyHealing = 1;
    const next = advanceMastery(exp, battle);
    expect(next.mastery.char_13).toBe(8);
    expect(next.masteryNotices).toEqual(["fruitCleanse"]);
    expect(advanceMastery(next, battle).mastery.char_13).toBe(8);
    expect(next.titles).toContain("Tiếp tế không ngừng II");
  });
});
