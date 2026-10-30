import { masteryUpgrade } from '../../packages/shared/src/mastery-upgrades';
import { describe, expect, it } from "vitest";
import {
  MASTERIES,
  masteryUnlocked,
  validateMasteryTeam,
} from "../../packages/shared/src/mastery";
import { MASTERY_PATHS } from "../../packages/shared/src/mastery-paths";
import { adventureConfig, loanUnit } from "../../packages/shared/src/adventure";
import {
  createBattle,
  stepBattle,
  calculateStateHash,
  serializeBattleState,
  restoreBattleState,
  captureReplayFrame,
} from "../../packages/battle-engine/src/index";
import {
  characterDamage,
  characterCombat,
} from "../../packages/battle-engine/src/character-combat";
import {
  kitNormalHit,
  kitShoot,
  kitSuper,
  kitMasteryMelee,
  kitMasteryCounter,
  tickKitProjectiles,
  tickKitFields,
  tickConstructs,
  kitShieldBlocks,
  type KitCombatServices,
} from "../../packages/battle-engine/src/kit-combat";
import { moveConstructs } from "../../packages/battle-engine/src/constructs";
import { formAttackCooldown } from "../../packages/battle-engine/src/mastery-forms";
import { buildMasteryPreview } from "../../apps/web/src/masteryPreviewBattle";

function fixture(id: string) {
  const skill = MASTERIES.find((m) => m.id === id)!;
  const s = createBattle(
    adventureConfig(
      [
        { ...loanUnit(skill.characterId as any), masteryId: id },
        loanUnit("char_11"),
      ],
      [loanUnit("char_01"), loanUnit("char_05"), loanUnit("char_12")],
    ),
    19,
  );
  s.tick = 1;
  for (const f of s.fighters) {
    f.hp = f.stats.hp = f.baseStats.hp = 1000;
    f.stats.attack = f.baseStats.attack = 40;
    f.stats.defense = f.baseStats.defense = 0;
    f.radius = 1500;
    f.vx = f.vy = 0;
    f.angle = 0;
    f.memory.previousAngle = 0;
    f.memory.spinSteps = 0;
    f.nextAttack = 0;
    f.energy = 0;
    f.shield = 0;
    f.shields = [];
  }
  const [source, ally, enemy] = s.fighters;
  source.x = 30000;
  source.y = 30000;
  ally.x = 24000;
  ally.y = 36000;
  ally.hp = 300;
  s.fighters.slice(2).forEach((f, i) => {
    f.x = 36000 + i * 500;
    f.y = 30000 + i * 1000;
  });
  return { s, source, ally, enemy, skill };
}
const ctx: KitCombatServices = {
  damage: (s, f, t, raw, friendly = false, auxiliary = false) =>
    characterDamage(s, f, t, raw, false, 0, friendly, true, true, auxiliary),
  normal: (s, f, t, scale) => {
    const hits = f.hits;
    characterDamage(
      s,
      f,
      t,
      Math.floor((f.stats.attack * scale) / 100),
      true,
      0,
      false,
      false,
      true,
    );
    return f.hits > hits;
  },
  heal: (_s, _f, t, amount) => {
    const actual = Math.min(t.stats.hp - t.hp, amount);
    t.hp += actual;
    return actual;
  },
  shield: () => {},
  buff: () => {},
};
const trigger = (f: ReturnType<typeof fixture>) => {
  const r=masteryUpgrade(f.skill.id)!;
  if(r.trigger==='shot') {
    for(let i=0;i<(r.every||1);i++) { if(i) f.s.projectiles=f.s.projectiles.filter(p=>p.bonus); if(!kitShoot(f.s,f.source))return false; }
  } else if(r.trigger==='hit') {
    for(let i=0;i<r.every!;i++){f.s.tick+=f.source.stats.cooldown;kitNormalHit(f.s,f.source,f.enemy,ctx);}
  } else if(r.trigger==='timer') kitMasteryMelee(f.s,f.source,ctx);
  else if(r.trigger==='super'){if(!kitSuper(f.s,f.source,ctx))return false;}
  else kitMasteryCounter(f.s,f.source,f.enemy);
  return true;
};

describe("physical mastery forms", () => {
  it("preserves all save IDs but has 81 attack forms and no generic stat/proc recipes", () => {
    expect(MASTERY_PATHS).toHaveLength(81);
    expect(new Set(MASTERIES.map((m) => m.name)).size).toBe(99);
    for (const skill of MASTERY_PATHS) {
      expect(skill.form).toBeDefined();
      expect(skill.modifiers).toBeUndefined();
      expect(
        masteryUnlocked(
          { experience: { mastery: { [skill.characterId]: skill.goal } } },
          skill.characterId,
          skill.id,
        ),
      ).toBe(true);
    }
    expect(() =>
      validateMasteryTeam(
        (["char_02", "char_05", "char_15"] as const).map((characterId) => ({
          characterId,
          masteryId: `${characterId}:tempo`,
        })),
      ),
    ).not.toThrow();
  });
  for (const skill of MASTERY_PATHS)
    it(`${skill.name} creates its physical attack, pet or replacement Super`, () => {
      const f = fixture(skill.id),
        form = skill.form!;
      expect(trigger(f)).toBe(true);
      expect(f.s.events.some((e) => e.type === `mastery:${skill.id}`)).toBe(
        true,
      );
      const r=masteryUpgrade(skill.id)!;
      if(['drone','fanTurret','hunter','ram','bodyguard','medic','brazier','supply','bank','mortar'].includes(r.pattern)) {
        expect(f.s.constructs.filter(c=>c.upgrade)).toHaveLength(r.count!);
      } else if(['paintWings','vortexWings','slipperWings','followVortex'].includes(r.pattern)) {
        expect(f.s.zones.filter(z=>z.bonus)).toHaveLength(r.count!);
      } else if(r.trigger==='hit'&&['cross','whirl','whirlPush','sweep'].includes(r.pattern)) {
        expect(f.enemy.hp).toBeLessThan(1000);
      } else if(r.pattern==='echo') expect(f.s.zones.some(z=>z.mastery==='echo')).toBe(true);
      else if(r.pattern.startsWith('delayed')) expect(f.source.memory.upgradeDelayed).toBeGreaterThan(f.s.tick);
      else if(['laser','scan','crossRainbow','crossInk'].includes(r.pattern)) expect(f.s.events.some(e=>e.type==='kit:beam')).toBe(true);
      else expect(f.s.projectiles.some(p=>p.life>0&&p.mastery)).toBe(true);
      expect(
        f.s.fighters.every((t) => Number.isInteger(t.hp) && t.hp >= 0),
      ).toBe(true);
    });
  it("fans have separate lanes and only their centre can proc normal hits", () => {
    const f = fixture("char_21:pressure");
    trigger(f);
    expect(f.s.projectiles).toHaveLength(5);
    expect(new Set(f.s.projectiles.map((p) => `${p.vx}:${p.vy}`)).size).toBe(5);
    expect(f.s.projectiles.filter((p) => p.normal)).toHaveLength(1);
    expect(formAttackCooldown(f.source, 1)).toBe(
      f.source.stats.cooldown,
    );
  });
  it("splits at impact once, starts fragments on the next pass and never chains procs", () => {
    const f = fixture("char_03:pressure");
    trigger(f);
    const mother = f.s.projectiles[0];
    for (let i = 0; i < 12 && !f.s.projectiles.some((p) => p !== mother); i++) {
      f.s.tick++;
      tickKitProjectiles(f.s, ctx);
    }
    const children = f.s.projectiles.filter((p) => p !== mother);
    expect(children).toHaveLength(3);
    expect(mother.life).toBeGreaterThan(0);
    expect(
      children.every(
        (p) => p.normal === false && !p.mastery?.split && p.age === 0,
      ),
    ).toBe(true);
    expect(children.every((p) => p.x === mother.x && p.y === mother.y)).toBe(
      true,
    );
    mother.life=0;
    const hits = f.source.hits;
    for (let i = 0; i < 40; i++) {
      f.s.tick++;
      tickKitProjectiles(f.s, ctx);
    }
    expect(f.source.hits).toBe(hits);
    expect(f.s.projectiles.filter((p) => p !== mother)).toHaveLength(3);
  });
  it("keeps one return weapon, resets its victims on return and restores shield blocking when caught", () => {
    const f = fixture("char_15:pressure");
    trigger(f);
    const p = f.s.projectiles[0];
    expect(f.source.memory.masteryDisarmed||0).toBe(0);
    f.source.nextAttack = 0;
    trigger(f);
    expect(f.s.projectiles).toHaveLength(1);
    p.hit = [f.enemy.id];
    p.x = 45000;
    p.y = 45000;
    p.age = 17;
    f.s.tick++;
    tickKitProjectiles(f.s, ctx);
    expect(p.returning).toBe(true);
    expect(p.hit).toEqual([]);
    p.x = f.source.x + 500;
    p.y = f.source.y;
    p.vx = p.vy = 0;
    f.s.tick++;
    tickKitProjectiles(f.s, ctx);
    expect(p.life).toBe(0);
    expect(f.source.memory.masteryDisarmed||0).toBe(0);
  });
  it("mines stay put until contact/timeout, cannot hit before arming and have bounded splash", () => {
    const f = fixture("char_07:resolve");
    trigger(f);
    const p = f.s.projectiles[0];
    const start = [p.x, p.y];
    f.enemy.x = 60000;
    f.enemy.y = 30000;
    for (let i = 0; i < 10; i++) {
      f.s.tick++;
      tickKitProjectiles(f.s, ctx);
    }
    expect(p.x).toBe(start[0]);
    expect(f.enemy.hp).toBe(1000);
    expect(p.life).toBeGreaterThan(0);
    const anchored = [p.x, p.y];
    f.enemy.x = p.x;
    f.enemy.y = p.y;
    for (let i = 0; i < 10; i++) {
      f.s.tick++;
      tickKitProjectiles(f.s, ctx);
    }
    expect(p.life).toBe(0);
    expect(f.enemy.hp).toBeLessThan(1000);
    expect([p.x, p.y]).toEqual(anchored);
    expect(
      f.s.events.find((e) => e.type.startsWith("kit:explosion:"))?.amount,
    ).toBe(55);
  });
  it("mines stop at a wall without exploding before their arming delay", () => {
    const f = fixture("char_07:resolve");
    trigger(f);
    const p = f.s.projectiles[0];
    p.x = 500;
    p.vx = -1000;
    p.vy = 0;
    f.s.tick++;
    tickKitProjectiles(f.s, ctx);
    expect(p.life).toBeGreaterThan(0);
    expect(p.detonated).not.toBe(true);
    expect(p.x).toBe(450);
    expect(p.vx).toBe(0);
  });
  it("waves change the flight path and seekers steer when their target moves", () => {
    for (const id of ["char_16:resolve", "char_24:resolve"]) {
      const f = fixture(id);
      f.s.fighters.slice(2).forEach((t, i) => {
        t.x = 50000 + i * 1000;
        t.y = 30000;
      });
      trigger(f);
      const p = f.s.projectiles.find(p=>p.mastery?.style===(id==='char_16:resolve'?'wave':'seeker'))!,
        y = p.y;
      if (p.homing) f.enemy.y += 6000;
      f.s.tick++;
      tickKitProjectiles(f.s, ctx);
      expect(p.y).not.toBe(y);
    }
  });
  it("orbits use three distinct phases, then launch and preserve metadata through checkpoints/replay", () => {
    const f = fixture("char_02:tempo");
    trigger(f);
    expect(f.s.projectiles.filter((p) => p.life > 0)).toHaveLength(3);
    expect(
      new Set(f.s.projectiles.map((p) => p.mastery?.orbitAngle)).size,
    ).toBe(3);
    const frame = captureReplayFrame(f.s),
      snapshot = JSON.stringify(frame.kitProjectiles);
    const restored = restoreBattleState(serializeBattleState(f.s));
    for (let i = 0; i < 32; i++) {
      stepBattle(f.s);
      stepBattle(restored);
    }
    expect(calculateStateHash(f.s)).toBe(calculateStateHash(restored));
    expect(JSON.stringify(frame.kitProjectiles)).toBe(snapshot);
    expect(
      f.s.projectiles
        .filter((p) => p.mastery?.style === "orbit")
        .every((p) => !p.mastery?.orbit),
    ).toBe(true);
  });
  it("orbit satellites stay inside walls while circling instead of dying at spawn", () => {
    const f = fixture("char_30:tempo");
    f.source.x = 1700;
    f.source.y = 1700;
    trigger(f);
    for (let i = 0; i < 10; i++) {
      f.s.tick++;
      tickKitProjectiles(f.s, ctx);
    }
    expect(
      f.s.projectiles.filter((p) => p.life > 0 && p.mastery?.orbit),
    ).toHaveLength(8);
    expect(f.s.projectiles.every((p) => p.x >= 450 && p.y >= 450)).toBe(true);
  });
  it("delayed cuts use their original position and can be dodged by leaving the lane", () => {
    const f = fixture("char_12:resolve");
    trigger(f);
    const zone = f.s.zones.find((z) => z.mastery === "echo")!;
    expect(zone).toBeDefined();
    const before = f.enemy.hp;
    f.source.x = 70000;
    f.source.y = 50000;
    f.enemy.y = 50000;
    f.s.tick = zone.start!;
    tickKitFields(f.s, ctx);
    expect(f.enemy.hp).toBe(before);
    expect(
      f.s.events.find((e) => e.type === "shape:echo" && e.tick === f.s.tick)?.x,
    ).toBe(30000);
  });
  it("drone follows its owner, medic heals instead of attacking and gift variants have different behaviour", () => {
    const drone = fixture("char_05:resolve");
    trigger(drone);
    const c = drone.s.constructs[0];
    drone.source.x += 20000;
    const before = Math.abs(c.x - drone.source.x);
    moveConstructs(drone.s);
    expect(Math.abs(c.x - drone.source.x)).toBeLessThan(before);
    const medic = fixture("char_17:tempo");
    trigger(medic);
    for (const c of medic.s.constructs) {
      c.x = medic.ally.x;
      c.y = medic.ally.y;
      c.nextAttack = 0;
      c.upgrade!.nextHeal=0;
    }
    tickConstructs(medic.s, ctx);
    expect(medic.ally.hp).toBe(315);
    expect(medic.enemy.hp).toBe(1000);
    const variants = [];
    for (const id of ["giftTank", "giftShield"]) {
      const f = fixture(id);
      f.s.tick = 90;
      characterCombat(f.s);
      variants.push(f.s.constructs[0].variant);
    }
    expect(variants).toEqual(["bulwark", "medic"]);
  });
  it("pet cannons fire actual three-way shots, and counterattacks require hostile HP loss", () => {
    const f = fixture("char_05:tempo");
    trigger(f);
    const c = f.s.constructs[0];
    c.x = f.source.x;
    c.y = f.source.y;
    c.nextAttack = 0;
    tickConstructs(f.s, ctx);
    expect(f.s.projectiles).toHaveLength(3);
    const guard = fixture("char_15:resolve");
    characterDamage(guard.s, guard.ally, guard.source, 10, false, 0, true);
    expect(guard.s.projectiles).toHaveLength(0);
    guard.source.shield = 100;
    characterDamage(guard.s, guard.enemy, guard.source, 10, false, 0);
    expect(guard.s.projectiles).toHaveLength(0);
    guard.source.shield = 0;
    characterDamage(guard.s, guard.enemy, guard.source, 10, false, 0);
    expect(guard.s.projectiles).toHaveLength(3);
    characterDamage(guard.s, guard.enemy, guard.source, 10, false, 0);
    expect(guard.s.projectiles).toHaveLength(3);
  });
  it("sandbox uses identical initial energy and support conditions across branches", () => {
    const normal = buildMasteryPreview("char_03", "char_03:pressure"),
      ult = buildMasteryPreview("char_05", "char_05:resolve");
    expect(normal.frames[0].fighters[0][4]).toBe(100);
    expect(ult.frames[0].fighters[0][4]).toBe(100);
    expect(
      ult.frames.some((f) => f.constructs?.some((c) => c.variant === "drone")),
    ).toBe(true);
    expect(buildMasteryPreview("char_03", "char_03:pressure").frames).toEqual(
      normal.frames,
    );
  });
});
