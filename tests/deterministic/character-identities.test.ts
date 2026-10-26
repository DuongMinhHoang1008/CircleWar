import { describe, expect, it } from "vitest";
import {
  ROSTER,
  character,
  type CharacterId,
} from "../../packages/shared/src/catalog";
import {
  CHARACTER_KITS,
  characterKit,
  kitGrowth,
} from "../../packages/shared/src/character-kits";
import {
  createBattle,
  stepBattle,
  calculateStateHash,
  serializeBattleState,
  restoreBattleState,
  applyStatus,
  tickStatuses,
  statusPower,
} from "../../packages/battle-engine/src/index";
import {
  characterCombat,
  characterContacts,
  characterDamage,
  beforeCharacterTick,
} from "../../packages/battle-engine/src/character-combat";
import {
  kitRange,
  kitShoot,
  kitShieldBlocks,
} from "../../packages/battle-engine/src/kit-combat";
import { weaponCount } from "../../packages/battle-engine/src/weapons";
import type { Loadout } from "../../packages/shared/src/balance";
const load = (id: string, equipment: string[] = []): Loadout => ({
  characterId: id as CharacterId,
  classId: character(id as CharacterId)!.base as Loadout["classId"],
  level: 10,
  equipment,
});
function fixture(id = "char_01", equipment: string[] = []) {
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
    f.x = 50000 + f.id * 4000;
    f.y = 36000;
    f.vx = f.vy = 0;
    f.nextAttack = 999999;
    f.baseStats.rotation = f.stats.rotation = 0;
    f.cooldowns = {};
    f.stats.hp = f.baseStats.hp = f.hp = 10000;
  }
  s.tick = 1;
  return s;
}
const forms = Object.values(CHARACTER_KITS).map((k) => ({
  kit: k,
  id:
    k.id === "fu_di"
      ? "char_28"
      : k.id === "wacom"
        ? "char_29"
        : k.id === "skyrocket"
          ? "char_30"
          : k.id,
  equipment:
    k.id === "fu_di"
      ? ["item_28"]
      : k.id === "wacom"
        ? ["item_29"]
        : k.id === "skyrocket"
          ? ["item_30"]
          : [],
}));
describe("v26 character kits", () => {
  it("defines 33 cards and three equipment forms with distinct normal/Super identities", () => {
    expect(ROSTER).toHaveLength(33);
    expect(forms).toHaveLength(36);
    expect(new Set(forms.map((x) => x.kit.normal)).size).toBe(36);
    expect(new Set(forms.map((x) => x.kit.super)).size).toBe(36);
    for (const { kit, id, equipment } of forms) {
      expect(characterKit(id, equipment)).toBe(kit);
      expect(new Set(kit.growth).size).toBe(2);
    }
  });
  for (const { kit, id, equipment } of forms)
    it(kit.id + " casts its own Super and resumes deterministically", () => {
      const s = fixture(id, equipment),
        f = s.fighters[0];
      f.energy = 100;
      characterCombat(s);
      expect(f.supers).toBe(1);
      expect(f.energy).toBeLessThan(100);
      expect(s.events.some((e) => e.type === "kit:super:" + kit.id)).toBe(true);
      const copy = restoreBattleState(serializeBattleState(s));
      for (let i = 0; i < 80; i++) {
        stepBattle(s);
        stepBattle(copy);
      }
      expect(calculateStateHash(copy)).toBe(calculateStateHash(s));
      expect(s.projectiles.length).toBeLessThanOrEqual(240);
      expect(s.constructs.length).toBeLessThanOrEqual(64);
    });
  it("changes only each kit's two growth axes, caps growth, and resets per battle", () => {
    for (const { kit, id, equipment } of forms) {
      const f = fixture(id, equipment).fighters[0],
        zero = kitGrowth(f, 0),
        late = kitGrowth(f, 3600);
      for (const key of Object.keys(zero) as (keyof typeof zero)[])
        expect(late[key] !== zero[key]).toBe(kit.growth.includes(key));
      expect(kitGrowth(f, 90000)).toBe(late);
      expect(kitGrowth(f, 0)).toBe(zero);
    }
  });
  it("Hướng Nội belongs exclusively to the self-applying Tiger and has stronger benefits", () => {
    const s = fixture(),
      [f, ally, enemy] = s.fighters;
    f.hp -= 500;
    expect(applyStatus(s, f, ally, "introvert")).toBe(false);
    expect(applyStatus(s, enemy, f, "introvert")).toBe(false);
    expect(applyStatus(s, f, f, "introvert")).toBe(true);
    const copy = restoreBattleState(serializeBattleState(s));
    copy.fighters[0].statuses = [];
    const protectedLoss = characterDamage(s, enemy, f, 100),
      normalLoss = characterDamage(
        copy,
        copy.fighters[2],
        copy.fighters[0],
        100,
      );
    expect(protectedLoss).toBeLessThan(normalLoss);
    const hp = f.hp;
    for (let i = 0; i < 30; i++) {
      s.tick++;
      tickStatuses(s);
    }
    expect(f.hp).toBeGreaterThan(hp);
  });
  it("Bleeding requires movement, anti-heal is capped, and stun prevents chained locks", () => {
    const s = fixture(),
      [f, , enemy] = s.fighters;
    applyStatus(s, enemy, f, "bleeding", 6, 120);
    const hp = f.hp;
    for (let i = 0; i < 30; i++) {
      s.tick++;
      tickStatuses(s);
    }
    expect(f.hp).toBe(hp);
    f.memory.distanceMoved = 100;
    for (let i = 0; i < 30; i++) {
      s.tick++;
      tickStatuses(s);
    }
    expect(f.hp).toBe(hp - 6);
    expect(applyStatus(s, enemy, f, "stunned")).toBe(true);
    expect(applyStatus(s, enemy, f, "stunned")).toBe(false);
    f.energy = 100;
    characterCombat(s);
    expect(f.supers).toBe(0);
  });
  it("Cận Thị affects ranged acquisition while keeping melee reach unchanged", () => {
    const s = fixture("char_05"),
      [f, , enemy] = s.fighters,
      range = kitRange(s, f),
      reach = f.stats.reach;
    applyStatus(s, enemy, f, "myopia");
    expect(kitRange(s, f)).toBeLessThan(range);
    expect(f.stats.reach).toBe(reach);
  });
  it("Aura benefits nearby allies, uses strongest source, and ends on death", () => {
    const s = fixture("char_22"),
      [f, ally] = s.fighters;
    beforeCharacterTick(s);
    const buffed = ally.stats.attack;
    ally.x = f.x + 30000;
    s.tick++;
    beforeCharacterTick(s);
    expect(ally.stats.attack).toBeLessThan(buffed);
    ally.x = f.x + 4000;
    f.hp = 0;
    s.tick++;
    beforeCharacterTick(s);
    expect(ally.stats.attack).toBeLessThan(buffed);
  });
  it("deadline fields harm allies but never their owner or apply Hướng Nội", () => {
    const s = fixture("char_09"),
      [f, ally] = s.fighters;
    f.energy = 100;
    characterCombat(s);
    const z = s.zones.find((z) => z.kit === "deadline")!;
    ally.x = z.x;
    ally.y = z.y;
    s.tick = z.start! + 30;
    const hp = ally.hp,
      ownerHp = f.hp;
    characterCombat(s);
    expect(ally.hp).toBeLessThan(hp);
    expect(f.hp).toBe(ownerHp);
    expect(statusPower(ally, "pressure", s.tick)).toBe(20);
    expect(statusPower(ally, "introvert", s.tick)).toBe(0);
  });
  it("territory damage waits for its telegraph and respects the boundary", () => {
    const s = fixture("char_32"),
      [f, , enemy] = s.fighters;
    f.energy = 100;
    characterCombat(s);
    const z = s.zones.find((z) => z.kit === "slipper")!;
    const hp = enemy.hp;
    s.tick = z.start! - 1;
    characterCombat(s);
    expect(enemy.hp).toBe(hp);
    s.tick = z.start!;
    characterCombat(s);
    expect(enemy.hp).toBeLessThan(hp);
    enemy.x = z.x + (z.radius! + 50) * 100;
    const after = enemy.hp;
    s.tick += 30;
    characterCombat(s);
    expect(enemy.hp).toBe(after);
  });
  it("constructs persist after owner death until their own lifetime", () => {
    const s = fixture("char_14"),
      [f] = s.fighters;
    f.energy = 100;
    characterCombat(s);
    expect(s.constructs[0].kind).toBe("giant");
    expect(s.constructs[0].hp).toBeGreaterThan(0);
    f.hp = 0;
    f.deadAt = s.tick;
    characterCombat(s);
    expect(s.constructs).toHaveLength(1);
    s.tick = s.constructs[0].until;
    characterCombat(s);
    expect(s.constructs).toHaveLength(0);
  });
  it("shield and chicken are physical second weapons", () => {
    const s = fixture("char_15"),
      f = s.fighters[0];
    expect(weaponCount(f)).toBe(2);
    f.angle = 16;
    const p = {
      id: 1,
      owner: 2,
      x: f.x + 3000,
      y: f.y,
      vx: -1000,
      vy: 0,
      life: 10,
      pierce: 0,
      hit: [],
      kit: "bullet" as const,
    };
    expect(kitShieldBlocks(s, f, f.x + 6000, f.y, p)).toBe(true);
    expect(p.life).toBe(0);
    expect(weaponCount(fixture("char_33").fighters[0])).toBe(2);
  });
  it("support contact has a per-pair cooldown and never revives", () => {
    const s = fixture("char_19"),
      [f, ally] = s.fighters;
    ally.x = f.x + 3000;
    characterContacts(s, f, ally);
    const count = ally.statuses.length;
    expect(count).toBeGreaterThan(0);
    characterContacts(s, f, ally);
    expect(ally.statuses).toHaveLength(count);
    ally.hp = 0;
    s.tick += 31;
    characterContacts(s, f, ally);
    expect(ally.hp).toBe(0);
  });
  it("rose stops at a wall and becomes a bounded ground field", () => {
    const s = fixture("char_20"),
      [f, ally, enemy] = s.fighters;
    f.x = 110000;
    ally.x = 20000;
    enemy.x = 119000;
    f.angle = 0;
    expect(kitShoot(s, f)).toBe(true);
    s.projectiles[0].x = 119900;
    characterCombat(s);
    expect(s.zones.some((z) => z.kit === "rose")).toBe(true);
  });
});
