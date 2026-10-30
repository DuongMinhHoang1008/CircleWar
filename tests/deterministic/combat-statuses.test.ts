import { describe, expect, it } from "vitest";
import {
  createBattle,
  debugConfig,
  applyStatus,
  clearStatus,
  statusPower,
  tickStatuses,
  stepBattle,
  serializeBattleState,
  restoreBattleState,
  calculateStateHash,
  captureReplayFrame,
  attackCooldown,
} from "../../packages/battle-engine/src/index";
import { alignedRangedTarget } from "../../packages/battle-engine/src/weapons";
import { rotateWeaponAngle } from "../../packages/battle-engine/src/weapon-clash";
import { characterCombat } from "../../packages/battle-engine/src/character-combat";

function fixture() {
  const state = createBattle(debugConfig(2), 77);
  const [a, b] = state.fighters;
  for (const fighter of state.fighters) {
    fighter.baseStats.hp = fighter.stats.hp = fighter.hp = 1000;
    fighter.x = 20000 + fighter.id * 20000;
    fighter.y = 30000;
    fighter.vx = fighter.vy = 0;
  }
  return { state, a, b };
}
function advance(state: ReturnType<typeof createBattle>, ticks: number) {
  for (let i = 0; i < ticks; i++) {
    state.tick++;
    tickStatuses(state);
  }
}
describe("shared combat statuses", () => {
  it("keeps one strongest burn but independently expires at most five poison stacks", () => {
    const { state, a, b } = fixture();
    applyStatus(state, a, b, "burn", 8, 60);
    applyStatus(state, a, b, "burn", 2, 300);
    for (let i = 0; i < 8; i++) applyStatus(state, a, b, "poison", 2, 90);
    expect(b.statuses.filter((effect) => effect.kind === "burn")).toHaveLength(
      1,
    );
    expect(
      b.statuses.filter((effect) => effect.kind === "poison"),
    ).toHaveLength(5);
    advance(state, 30);
    expect(b.hp).toBe(982); // 8 burn + 5*2 poison per second, shield/armor do not absorb HP loss.
    advance(state, 61);
    expect(statusPower(b, "burn", state.tick)).toBe(0);
    expect(statusPower(b, "poison", state.tick)).toBe(0);
  });
  it("credits a periodic kill even after its applier dies without recursive item procs", () => {
    const { state, a, b } = fixture();
    applyStatus(state, a, b, "burn", 8, 60);
    a.hp = 0;
    b.hp = 1;
    b.shield = 100;
    advance(state, 30);
    expect(b.hp).toBe(0);
    expect(a.kills).toBe(1);
    expect(b.shield).toBe(100);
    expect(state.events.filter((event) => event.type === "kill")).toHaveLength(
      1,
    );
  });
  it("caps modifiers, keeps buffs friendly, and never revives a dead unit", () => {
    const { state, a, b } = fixture();
    expect(applyStatus(state, a, b, "blessing")).toBe(false);
    expect(applyStatus(state, a, a, "poison")).toBe(false);
    applyStatus(state, a, a, "rage", 999, 999);
    applyStatus(state, b, a, "paralyzed", 999, 60);
    expect(statusPower(a, "rage", 1)).toBe(50);
    expect(statusPower(a, "paralyzed", 1)).toBe(40);
    applyStatus(state, a, a, "blessing", 5, 90);
    a.hp = 0;
    advance(state, 30);
    expect(a.hp).toBe(0);
  });
  it("keeps fractional periodic healing under anti-heal rather than rounding every HP to zero", () => {
    const { state, a, b } = fixture();
    a.hp -= 100;
    a.buffs.push({ kind: "radiation", value: 3, until: 200, source: b.id });
    applyStatus(state, a, a, "blessing", 4, 90);
    advance(state, 60);
    expect(a.hp).toBe(906); // floor(8 * .76), not zero healing.
  });
  it("Paralyzed reduces spin progress and stretches attacks, then expires without compounding", () => {
    const { state, a, b } = fixture();
    a.angle = 0;
    a.stats.rotation = 1;
    a.nextAttack = 20;
    applyStatus(state, b, a, "paralyzed", 40, 31);
    advance(state, 1);
    expect(a.nextAttack).toBeGreaterThan(20);
    expect(attackCooldown(a, state.tick)).toBe(
      Math.ceil(a.stats.cooldown / 0.6),
    );
    for (let i = 0; i < 10; i++) rotateWeaponAngle(a);
    expect(a.angle).toBe(6);
    const pending = a.nextAttack;
    tickStatuses(state);
    expect(a.nextAttack).toBe(pending);
    advance(state, 31);
    expect(a.memory.statusAttackRate).toBe(100);
  });
  it("Frozen changes movement only and does not alter baseline stats", () => {
    const slow = createBattle(debugConfig(2), 4),
      normal = structuredClone(slow);
    const f = slow.fighters[0],
      other = slow.fighters[1];
    f.x = normal.fighters[0].x = 30000;
    f.y = normal.fighters[0].y = 30000;
    f.vx = normal.fighters[0].vx = 400;
    f.vy = normal.fighters[0].vy = 0;
    other.x = normal.fighters[1].x = 60000;
    other.y = normal.fighters[1].y = 60000;
    applyStatus(slow, other, f, "frozen", 25, 60);
    stepBattle(slow);
    stepBattle(normal);
    expect(f.x - 30000).toBe(300);
    expect(normal.fighters[0].x - 30000).toBe(400);
    expect(f.baseStats).toEqual(normal.fighters[0].baseStats);
    clearStatus(f, "frozen");
    expect(f.slowUntil).toBe(0);
    const x = f.x;
    stepBattle(slow);
    expect(f.x - x).toBe(400);
  });
  it("preserves status carries, poison sources and fractional spin through checkpoints/replay", () => {
    const { state, a, b } = fixture();
    applyStatus(state, a, b, "poison", 3, 120);
    applyStatus(state, b, a, "paralyzed", 25, 90);
    applyStatus(state, a, b, "fracture", 10, 90);
    applyStatus(state, a, a, "ward", 15, 120);
    advance(state, 17);
    rotateWeaponAngle(a);
    const restored = restoreBattleState(serializeBattleState(state));
    for (let i = 0; i < 30; i++) {
      stepBattle(state);
      stepBattle(restored);
    }
    expect(calculateStateHash(state)).toBe(calculateStateHash(restored));
    expect(captureReplayFrame(state).statuses).toEqual(
      state.fighters.map((f) => f.statuses),
    );
  });
});

describe("spin aimed ranged attacks", () => {
  it("does not target behind the weapon; catches a heading swept by a fast spin", () => {
    const { state, a, b } = fixture();
    a.angle = 8;
    a.memory.previousAngle = 8;
    a.memory.spinSteps = 0;
    expect(alignedRangedTarget(state, a)).toBeUndefined();
    a.angle = 31;
    a.stats.rotation = 4;
    rotateWeaponAngle(a);
    expect(alignedRangedTarget(state, a)).toBe(b);
    expect(a.memory.shotAngle).toBe(0);
  });
  it("honors the global shoot cooldown while a target stays aligned", () => {
    const config = debugConfig(2);
    config.teams[0].loadouts[0] = {
      characterId: "char_05",
      classId: "ranger",
      level: 1,
      equipment: [],
    };
    const state = createBattle(config, 45),
      [a, b] = state.fighters;
    a.x = 20000;
    b.x = 40000;
    a.y = b.y = 30000;
    a.stats.rotation = 0;
    a.angle = 0;
    a.nextAttack = 0;
    characterCombat(state);
    expect(state.projectiles.filter((p) => p.owner === a.id)).toHaveLength(1);
    characterCombat(state);
    expect(state.projectiles.filter((p) => p.owner === a.id)).toHaveLength(1);
  });
});
