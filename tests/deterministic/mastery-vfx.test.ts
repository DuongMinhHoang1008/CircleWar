import { masteryUpgrade } from '../../packages/shared/src/mastery-upgrades';
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { Container, Texture } from "pixi.js";
import { ROSTER } from "../../packages/shared/src/catalog";
import { MASTERIES } from "../../packages/shared/src/mastery";
import { adventureConfig, loanUnit } from "../../packages/shared/src/adventure";
import {
  createBattle,
  calculateStateHash,
} from "../../packages/battle-engine/src/index";
import { characterDamage } from "../../packages/battle-engine/src/character-combat";
import {
  kitNormalHit,
  kitShoot,
  kitSuper,
  kitMasteryMelee,
  kitMasteryCounter,
  type KitCombatServices,
} from "../../packages/battle-engine/src/kit-combat";
import {
  MASTERY_VFX_DEFINITIONS,
  MASTERY_VFX_THEMES,
} from "../../apps/web/src/rendering/mastery-vfx-themes";
import {
  collectMasteryCues,
  hasMasteryProjectileSkin,
  MasteryVfxLayer,
} from "../../apps/web/src/rendering/mastery-vfx";
import manifest from "../../apps/web/src/rendering/mastery-vfx.json";

function fixture(id = "char_03:pressure") {
  const mastery = MASTERIES.find((m) => m.id === id)!;
  return createBattle(
    adventureConfig(
      [
        { ...loanUnit(mastery.characterId as any), masteryId: id },
        loanUnit("char_11"),
      ],
      [loanUnit("char_01")],
    ),
    19,
  );
}

describe("Bí kỹ VFX coverage and presentation isolation", () => {
  it('keeps summon bodies readable in reduced effects and hides them when disabled without mutating combat',()=>{
    const s=fixture('char_05:resolve');
    s.constructs=[{id:0,owner:0,kind:'minion',variant:'drone',x:30000,y:30000,vx:0,vy:0,radius:1100,hp:100,maxHp:100,damage:10,until:240,nextAttack:30}];
    const layer=new MasteryVfxLayer(new Container(),new Container(),{casts:new Map([['char_05:resolve',Array(8).fill(Texture.EMPTY)]]),projectiles:new Map([['char_05:resolve',Texture.EMPTY]])});
    const before=JSON.stringify(s);
    layer.draw(s,0,.01,.01,true,true);
    expect(layer.summonSprites.filter(sprite=>sprite.visible)).toHaveLength(1);
    expect(layer.summonSprites[0].x).toBe(300);
    layer.draw(s,0,.01,.01,false,false);
    expect(layer.summonSprites.every(sprite=>!sprite.visible)).toBe(true);
    expect(JSON.stringify(s)).toBe(before);
  });
  it("shows separate spawn effects when three pets appear in the same tick", () => {
    const s = fixture("char_31:tempo");
    s.constructs = Array.from({ length: 3 }, (_, i) => ({
      id: i,
      owner: 0,
      hp: 100,
      x: 20000 + i * 10000,
      y: 40000,
      radius: 900,
      variant: "mortar",
    })) as any;
    const layer = new MasteryVfxLayer(new Container(), new Container(), {
      casts: new Map([["char_31:tempo", Array(8).fill(Texture.EMPTY)]]),
      projectiles: new Map(),
    });
    layer.draw(s, 0, 0.01, 0.01, true, false);
    const positions = layer.sprites
      .filter((sprite) => sprite.visible)
      .map((sprite) => [sprite.x, sprite.y]);
    expect(positions).toContainEqual([200, 400]);
    expect(positions).toContainEqual([300, 400]);
    expect(positions).toContainEqual([400, 400]);
    const snapshot = JSON.stringify(s);
    layer.draw(s, 1, 0.01, 0.01, false, false);
    expect(layer.activeCount).toBe(0);
    expect(layer.sprites.every((sprite) => !sprite.visible)).toBe(true);
    expect(JSON.stringify(s)).toBe(snapshot);
  });
  it("covers every equipped branch with a unique atlas row and 33 original emblems", () => {
    expect(ROSTER).toHaveLength(33);
    expect(MASTERY_VFX_DEFINITIONS).toHaveLength(99);
    expect(Object.keys(manifest.rows).sort()).toEqual(
      MASTERIES.map((m) => m.id).sort(),
    );
    expect(
      new Set(Object.values(manifest.rows).map((r) => `${r.page}:${r.row}`))
        .size,
    ).toBe(99);
    expect(
      new Set(Object.values(manifest.rows).map((r) => r.projectile.join(":")))
        .size,
    ).toBe(99);
    expect(
      new Set(Object.values(MASTERY_VFX_THEMES).map((t) => t.glyph)).size,
    ).toBe(33);
    for (const c of ROSTER) {
      const defs = MASTERY_VFX_DEFINITIONS.filter(
        (d) => d.characterId === c.id,
      );
      expect(defs.map((d) => d.branch).sort()).toEqual([0, 1, 2]);
      expect(defs.every((d) => !!d.pattern && !!d.theme.glyph)).toBe(true);
    }
  });

  it("ships transparent, GPU-sized atlases with distinct animated rows", async () => {
    for (let page = 0; page < 3; page++) {
      const image = sharp(
        readFileSync(`apps/web/public/${manifest.pages[page]}`),
      );
      const metadata = await image.metadata();
      expect(metadata.width).toBe(640);
      expect(metadata.height).toBe(2640);
      expect(metadata.hasAlpha).toBe(true);
      for (let row = 0; row < 33; row++) {
        const first = await image
          .clone()
          .extract({ left: 0, top: row * 80, width: 80, height: 80 })
          .raw()
          .toBuffer();
        const later = await image
          .clone()
          .extract({ left: 320, top: row * 80, width: 80, height: 80 })
          .raw()
          .toBuffer();
        expect(first.equals(later), `page ${page} row ${row} animates`).toBe(
          false,
        );
        expect(first.some((value, i) => i % 4 === 3 && value > 0)).toBe(true);
      }
    }
    expect(
      (
        await sharp(
          readFileSync(`apps/web/public/${manifest.projectiles}`),
        ).metadata()
      ).hasAlpha,
    ).toBe(true);
  });

  it("places actual cast, enemy impact and healing cues without changing authoritative state", () => {
    const s = fixture();
    s.tick = 40;
    const [f, ally, enemy] = s.fighters;
    f.angle = 8;
    s.events = [
      {
        tick: 40,
        type: `mastery:${f.masteryId}`,
        source: 0,
        target: 0,
        amount: 1,
      },
      { tick: 40, type: "hit", source: 0, target: 2, amount: 10 },
      { tick: 40, type: "hit", source: 0, target: 2, amount: 8 },
      { tick: 40, type: "heal", source: 0, target: 1, amount: 8 },
      { tick: 40, type: "hit", source: 0, target: 1, amount: 4 },
      { tick: 40, type: "hit", source: 0, target: 2, amount: 0 },
      { tick: 39, type: "hit", source: 0, target: 2, amount: 10 },
      {
        tick: 40,
        type: "mastery:char_03:resolve",
        source: 0,
        target: 0,
        amount: 1,
      },
    ];
    const before = calculateStateHash(s),
      snapshot = JSON.stringify(s);
    const cues = collectMasteryCues(s, 39);
    expect(cues.map((c) => c.phase)).toEqual(["cast", "impact", "support"]);
    expect(cues[0].angle).toBe(Math.PI / 2);
    expect(cues[1]).toMatchObject({ x: enemy.x, y: enemy.y, target: 2 });
    expect(cues[2]).toMatchObject({ x: ally.x, y: ally.y, target: 1 });
    expect(collectMasteryCues(s, 40)).toEqual([]);
    expect(calculateStateHash(s)).toBe(before);
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it("reacts to incoming damage for Nén Bão and rejects a different character's mastery", () => {
    const s = fixture("tigerBurst");
    s.tick = 30;
    s.fighters[0].statuses = [
      { kind: "introvert", power: 15, source: 0, carry: 0, until: 60 },
    ];
    s.events = [{ tick: 30, type: "hit", source: 2, target: 0, amount: 20 }];
    expect(collectMasteryCues(s, 29)).toEqual([
      expect.objectContaining({ id: "tigerBurst", source: 0, phase: "charge" }),
    ]);
    s.fighters[0].masteryId = "auraEcho";
    s.events = [{ tick: 30, type: "super", source: 0, target: 0, amount: 1 }];
    expect(collectMasteryCues(s, 29)).toEqual([]);
  });

  it("uses real form activation events across the 81 new branches", () => {
    const services: KitCombatServices = {
      damage: (s, f, t, raw, friendly = false) =>
        characterDamage(s, f, t, raw, false, 0, friendly, true, true),
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
    for (const m of MASTERIES.filter((m) => m.form)) {
      const s = fixture(m.id);
      s.tick = 1;
      const f = s.fighters[0];
      f.energy = 100;
      f.nextAttack = 0;
      f.angle = 0;
      f.memory.previousAngle = 0;
      f.memory.spinSteps = 0;
      s.fighters.forEach((f) => {
        f.hp = f.stats.hp = f.baseStats.hp = 1000;
        f.radius = 1500;
        f.vx = f.vy = 0;
        f.shield = 0;
        f.shields = [];
      });
      s.fighters[0].x = 30000;
      s.fighters[0].y = 30000;
      s.fighters[1].x = 5000;
      s.fighters[1].y = 5000;
      s.fighters[2].x = 36000;
      s.fighters[2].y = 30000;
      const r=masteryUpgrade(m.id)!;
      if(r.trigger==='shot')for(let i=0;i<(r.every||1);i++)kitShoot(s,f);
      else if(r.trigger==='hit')for(let i=0;i<r.every!;i++){s.tick+=f.stats.cooldown;kitNormalHit(s,f,s.fighters[2],services);}
      else if(r.trigger==='timer')kitMasteryMelee(s,f,services);
      else if(r.trigger==='super')kitSuper(s,f,services);
      else kitMasteryCounter(s,f,s.fighters[2]);
      expect(
        collectMasteryCues(s, 0).some(
          (c) => c.id === m.id && c.phase === "cast",
        ),
        m.id,
      ).toBe(true);
    }
  });

  it("only replaces projectile art for a valid mastery owner", () => {
    const s = fixture(),
      f = s.fighters[0];
    const p = { mastery: { style: "shard" } } as any;
    expect(hasMasteryProjectileSkin(f, p)).toBe(true);
    expect(hasMasteryProjectileSkin(f, { kit: "fruit" } as any)).toBe(false);
    f.masteryId = "fruitOverflow";
    f.characterId = "char_13";
    expect(hasMasteryProjectileSkin(f, { kit: "fruit" } as any)).toBe(true);
    f.masteryId = undefined;
    expect(hasMasteryProjectileSkin(f, p)).toBe(false);
  });
});
