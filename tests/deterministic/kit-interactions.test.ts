import { describe, it, expect } from "vitest";
import {
  createBattle,
  applyStatus,
  tickStatuses,
  statusPower,
  serializeBattleState,
  restoreBattleState,
  captureReplayFrame,
} from "../../packages/battle-engine/src/index";
import {
  characterCombat,
  characterDamage,
  beforeCharacterTick,
} from "../../packages/battle-engine/src/character-combat";
import {
  kitShoot,
  kitIncoming,
} from "../../packages/battle-engine/src/kit-combat";
import { character } from "../../packages/shared/src/catalog";
import type { Loadout } from "../../packages/shared/src/balance";
function fixture(id: string, equipment: string[] = []) {
  const load = (id: string, equipment: string[] = []): Loadout => ({
    characterId: id as Loadout["characterId"],
    classId: character(id)!.base as Loadout["classId"],
    level: 10,
    equipment,
  });
  const s = createBattle(
    {
      width: 120000,
      height: 72000,
      shrinkSeconds: 60,
      teams: [
        { id: "a", loadouts: [load(id, equipment), load("char_04")] },
        { id: "b", loadouts: [load("char_05")] },
      ],
    },
    777,
  );
  for (const f of s.fighters) {
    Object.assign(f, {
      x: 40000 + f.id * 8000,
      y: 36000,
      vx: 0,
      vy: 0,
      angle: 0,
      nextAttack: 999999,
    });
    f.baseStats.rotation = f.stats.rotation = 0;
    f.cooldowns = {
      "0:0": 999999,
      "0:1": 999999,
      "0:2": 999999,
      "1:0": 999999,
      "1:1": 999999,
      "1:2": 999999,
    };
    f.baseStats.hp = f.stats.hp = f.hp = 1000;
    f.stats.crit = 0;
  }
  s.tick = 1;
  return s;
}
function advance(s: ReturnType<typeof fixture>, ticks: number) {
  for (let i = 0; i < ticks; i++) {
    s.tick++;
    characterCombat(s);
  }
}
describe("v26 kit interactions", () => {
  it("a projectile retains its weapon's Burn after the caster dies", () => {
    const s = fixture("char_05"),
      [f, , enemy] = s.fighters;
    f.stats.burn = 5;
    expect(kitShoot(s, f)).toBe(true);
    f.hp = 0;
    f.deadAt = s.tick;
    advance(s, 18);
    expect(statusPower(enemy, "burn", s.tick)).toBe(5);
  });
  it("Gift Box summons on a four-second timer without making any attacks", () => {
    const s = fixture("char_14"),
      f = s.fighters[0];
    s.tick = 119;
    characterCombat(s);
    expect(s.constructs).toHaveLength(0);
    s.tick = 120;
    characterCombat(s);
    expect(s.constructs.filter((c) => c.kind === "minion")).toHaveLength(1);
    expect(f.hits).toBe(0);
    s.tick = 240;
    characterCombat(s);
    expect(s.constructs.filter((c) => c.kind === "minion")).toHaveLength(2);
    s.tick = 360;
    characterCombat(s);
    expect(s.constructs.filter((c) => c.kind === "minion")).toHaveLength(2);
    f.hp = 0;
    f.deadAt = s.tick;
    s.tick = 480;
    characterCombat(s);
    expect(s.constructs.filter((c) => c.kind === "minion")).toHaveLength(2);
    expect(f.memory.nextSummon).toBe(480);
  });
  it("a normal projectile hits after its owner dies and may earn a posthumous kill", () => {
    const s = fixture("char_05"),
      [f, , enemy] = s.fighters;
    expect(kitShoot(s, f)).toBe(true);
    f.hp = 0;
    f.deadAt = s.tick;
    enemy.hp = 1;
    advance(s, 18);
    expect(enemy.hp).toBe(0);
    expect(f.kills).toBe(1);
    expect(f.hits).toBe(1);
  });
  it("delayed fields activate after owner death, retain damage/status, and expire on time", () => {
    const s = fixture("char_16"),
      [f, , enemy] = s.fighters;
    f.energy = 100;
    characterCombat(s);
    const z = s.zones[0];
    f.hp = 0;
    f.deadAt = s.tick;
    s.tick = z.start!;
    characterCombat(s);
    expect(enemy.hp).toBeLessThan(1000);
    expect(statusPower(enemy, "frozen", s.tick)).toBe(25);
    expect(s.zones).toHaveLength(1);
    s.tick = z.until;
    characterCombat(s);
    expect(s.zones).toHaveLength(0);
  });
  it("support fields keep healing living allies after source death without reviving the source", () => {
    const s = fixture("char_20"),
      [f, ally] = s.fighters;
    f.energy = 100;
    characterCombat(s);
    const z = s.zones[0];
    f.hp = 0;
    f.deadAt = s.tick;
    ally.x = z.x;
    ally.y = z.y;
    ally.hp = 500;
    s.tick = z.start! + 30;
    characterCombat(s);
    expect(ally.hp).toBeGreaterThan(500);
    expect(f.hp).toBe(0);
  });

  it("a rocket's self-elimination does not cancel damage/status at the opposite corner", () => {
    const s = fixture("char_31"),
      [f, ally, enemy] = s.fighters;
    ally.x = 110000;
    ally.y = 62000;
    f.energy = 100;
    characterCombat(s);
    f.hp = 1;
    const p = s.projectiles[0];
    p.x = enemy.x - 1000;
    p.y = enemy.y;
    characterCombat(s);
    expect(f.hp).toBe(0);
    expect(enemy.hp).toBeLessThan(1000);
    expect(ally.hp).toBeLessThan(1000);
    expect(statusPower(ally, "radiation", s.tick)).toBe(2);
  });
  it("Paralyzed also slows the Wacom Super burst cadence", () => {
    const s = fixture("char_29", ["item_29"]),
      [f, , enemy] = s.fighters;
    applyStatus(s, enemy, f, "paralyzed", 40, 90);
    f.energy = 100;
    characterCombat(s);
    expect(f.memory.burstReady - s.tick).toBe(15);
  });
  it("Wacom form has reduced shot power/cadence and never overlaps its Super burst", () => {
    const s = fixture("char_29", ["item_29"]),
      f = s.fighters[0];
    beforeCharacterTick(s);
    expect(f.stats.cooldown).toBe(Math.ceil(f.baseStats.cooldown * 1.3));
    expect(kitShoot(s, f)).toBe(true);
    expect(s.projectiles[0].power).toBe(60);
    s.projectiles = [];
    f.energy = 100;
    f.nextAttack = 0;
    characterCombat(s);
    expect(f.memory.burstLeft).toBe(7);
    expect(s.projectiles).toHaveLength(1);
    expect(s.projectiles[0].power).toBe(28);
    expect(s.projectiles[0].normal).toBe(false);
    for (let i = 0; i < 63; i++) {
      s.tick++;
      characterCombat(s);
      expect(s.projectiles.every((p) => !p.normal)).toBe(true);
    }
    expect(f.memory.burstLeft).toBe(0);
  });
  it("the giant rocket damages and irradiates enemies and allies at the opposite corner", () => {
    const s = fixture("char_31"),
      [f, ally, enemy] = s.fighters;
    ally.x = 110000;
    ally.y = 62000;
    const far = structuredClone(enemy);
    far.id = 3;
    far.x = 110000;
    far.y = 60000;
    s.fighters.push(far);
    f.energy = 100;
    characterCombat(s);
    const p = s.projectiles[0];
    p.x = enemy.x - 1000;
    p.y = enemy.y;
    characterCombat(s);
    expect(far.hp).toBeLessThan(1000);
    expect(ally.hp).toBeLessThan(1000);
    expect(statusPower(far, "radiation", s.tick)).toBe(2);
    expect(statusPower(ally, "burn", s.tick)).toBe(5);
    expect(1000 - far.hp).toBeLessThan(1000 - enemy.hp);
    expect(
      s.events.some(
        (e) => e.type === "kit:explosion:rocket" && e.amount > 1200,
      ),
    ).toBe(true);
  });
  it("Wacom friendly fire decreases over time and its transformed form excludes allies", () => {
    const shoot = (item: string[] = [], tick = 1) => {
      const s = fixture("char_29", item),
        [f, ally] = s.fighters;
      s.tick = tick;
      expect(kitShoot(s, f)).toBe(true);
      advance(s, 8);
      return 1000 - ally.hp;
    };
    expect(shoot()).toBeGreaterThan(0);
    expect(shoot([], 3600)).toBeLessThan(shoot());
    expect(shoot(["item_29"])).toBe(0);
  });
  it.each([
    ["char_30", [], true],
    ["char_30", ["item_30"], false],
  ] as const)(
    "balloon %s/%j respects its friendly damage rules",
    (id, gear, harm) => {
      const s = fixture(id, [...gear]),
        [f, ally] = s.fighters;
      expect(kitShoot(s, f)).toBe(true);
      const p = s.projectiles[0];
      p.x = ally.x;
      p.y = ally.y;
      p.vx = p.vy = 0;
      p.life = 1;
      characterCombat(s);
      expect(ally.hp < 1000).toBe(harm);
      expect(s.events.some((e) => e.type === "kit:explosion:balloon")).toBe(
        true,
      );
    },
  );
  it("giant rocket leaves the muzzle, then hurts allies and applies intentional radioactive burn", () => {
    const s = fixture("char_31"),
      [f, ally, enemy] = s.fighters;
    ally.y += 18000;
    f.energy = 100;
    characterCombat(s);
    expect(s.projectiles).toHaveLength(1);
    expect(f.hp).toBe(1000);
    ally.x = enemy.x;
    ally.y = enemy.y;
    const p = s.projectiles[0];
    p.x = enemy.x - 1000;
    p.y = enemy.y;
    characterCombat(s);
    expect(ally.hp).toBeLessThan(1000);
    expect(enemy.hp).toBeLessThan(ally.hp);
    expect(statusPower(ally, "radiation", s.tick)).toBe(2);
    expect(statusPower(ally, "burn", s.tick)).toBe(5);
    expect(f.kills).toBe(0);
  });
  it("fruit and upgraded Wacom bounce with finite hit cooldowns", () => {
    for (const [id, gear] of [
      ["char_03", []],
      ["char_29", ["item_29"]],
    ] as [string, string[]][]) {
      const s = fixture(id, gear),
        f = s.fighters[0];
      expect(kitShoot(s, f)).toBe(true);
      const p = s.projectiles[0];
      p.x = 119900;
      p.vx = 1000;
      characterCombat(s);
      expect(p.vx).toBeLessThan(0);
      expect(p.bounces).toBe(0);
      expect(p.life).toBeGreaterThan(0);
    }
  });
  it("rose and slipper impacts on a construct create their ground fields", () => {
    for (const id of ["char_20", "char_32"]) {
      const s = fixture(id),
        [f, , enemy] = s.fighters;
      expect(kitShoot(s, f)).toBe(true);
      const p = s.projectiles[0];
      s.constructs.push({
        id: 0,
        owner: enemy.id,
        kind: "turret",
        x: p.x + 1000,
        y: p.y,
        vx: 0,
        vy: 0,
        radius: 1100,
        hp: 100,
        maxHp: 100,
        damage: 1,
        until: 200,
        nextAttack: 9999,
      });
      characterCombat(s);
      expect(
        s.zones.some((z) => z.kit === (id === "char_20" ? "rose" : "slipper")),
      ).toBe(true);
    }
  });
  it("overlapping fields cannot multiply tick damage and refresh their status continuously", () => {
    const s = fixture("char_32"),
      f = s.fighters[0],
      t = s.fighters[2];
    f.energy = 100;
    characterCombat(s);
    s.tick = s.zones[0].start!;
    const copy = restoreBattleState(serializeBattleState(s));
    copy.zones.push({ ...copy.zones[0] });
    characterCombat(s);
    characterCombat(copy);
    expect(copy.fighters[2].hp).toBe(t.hp);
    s.tick++;
    characterCombat(s);
    expect(statusPower(t, "frozen", s.tick)).toBeGreaterThan(0);
  });
  it("boomerang heals its owner only on return and heals a living ally on its Super path", () => {
    const s = fixture("char_33"),
      [f, ally] = s.fighters;
    f.hp = ally.hp = 500;
    f.energy = 100;
    characterCombat(s);
    expect(f.hp).toBe(500);
    advance(s, 100);
    expect(f.hp).toBeGreaterThan(500);
    expect(ally.hp).toBeGreaterThan(500);
    expect(s.events.some((e) => e.type === "kit:boomerang-return")).toBe(true);
  });
  it("stock losses bypass virtual HP, while capital and shields remain capped", () => {
    const s = fixture("char_25"),
      f = s.fighters[0];
    let losses = 0;
    for (let i = 0; i < 80; i++) {
      const hp = f.hp;
      f.memory.nextStock = s.tick;
      characterCombat(s);
      if (s.events.at(-1)?.type === "kit:loss" || f.hp < hp) losses++;
      s.tick += 90;
      if (f.hp <= 0) break;
    }
    expect(losses).toBeGreaterThan(0);
    expect(f.memory.assets).toBeGreaterThanOrEqual(0);
    expect(f.memory.assets).toBeLessThanOrEqual(300);
    expect(f.shield).toBeLessThanOrEqual(100);
    expect(f.hp).toBeLessThan(1000);
  });
  it("Courage dodge has a successful-proc cooldown; invulnerability never suppresses existing DoT", () => {
    const s = fixture("char_07"),
      [f, , enemy] = s.fighters;
    let dodge = false;
    for (let i = 0; i < 100; i++)
      if (kitIncoming(s, enemy, f, 10) === 0) {
        dodge = true;
        break;
      }
    expect(dodge).toBe(true);
    expect(kitIncoming(s, enemy, f, 10)).toBe(10);
    const fast = fixture("char_17"),
      runner = fast.fighters[0];
    runner.energy = 100;
    characterCombat(fast);
    expect(kitIncoming(fast, fast.fighters[2], runner, 100)).toBe(0);
    applyStatus(fast, fast.fighters[2], runner, "burn", 5, 90);
    const hp = runner.hp;
    for (let i = 0; i < 30; i++) {
      fast.tick++;
      tickStatuses(fast);
    }
    expect(runner.hp).toBeLessThan(hp);
  });
  it("normal procs preserve the requested exclusive identities", () => {
    for (const [id, effect] of [
      ["char_01", "introvert"],
      ["char_02", "diabetes"],
      ["char_05", "myopia"],
      ["char_08", "bleeding"],
      ["char_09", "paralyzed"],
      ["char_16", "frozen"],
      ["char_18", "burn"],
      ["char_27", "burn"],
      ["char_31", "radiation"],
    ] as const) {
      const s = fixture(id),
        [f, , t] = s.fighters;
      for (let i = 0; i < 60; i++) characterDamage(s, f, t, 1, true, 0);
      expect(
        statusPower(effect === "introvert" ? f : t, effect, s.tick),
        id,
      ).toBeGreaterThan(0);
    }
  });
  it("kit constructs and projectile shape survive replay snapshots", () => {
    const s = fixture("char_14");
    s.fighters[0].energy = 100;
    characterCombat(s);
    expect(captureReplayFrame(s).constructs).toEqual(s.constructs);
    const b = fixture("char_30");
    b.fighters[0].energy = 100;
    characterCombat(b);
    expect(
      captureReplayFrame(b).kitProjectiles?.every(
        (p) => p.kit === "balloon" && p.radius === 1000,
      ),
    ).toBe(true);
  });
});
