import {
  character,
  BONDS,
  FRIEND_GROUPS,
  groupEligible,
  groupTier,
  representatives,
  availableTraits,
  TRAITS,
  validChoice,
} from "../../shared/src/catalog";
import type { BattleState, Fighter, Zone } from "./types";
import { div, normalize, UNIT, DIRECTIONS, random } from "./math";
import { capsuleHit } from "./physics";
import { safeBounds } from "./bounds";
import { roundTempo } from "./pacing";
import { cardEvolutionSteps } from "../../shared/src/progression";
import {
  isClashProtected,
  reverseWeaponSpin,
  rotateWeaponAngle,
} from "./weapon-clash";

const CDs = [7, 6, 7, 6, 7, 8, 8, 7, 7, 8, 8, 6, 8, 7, 7, 7, 6, 7, 8, 7, 7, 8, 7, 7, 7];
const no = (f: Fighter) => Number(f.characterId?.slice(-2) || 0);
const superValue = (f: Fighter, value: number) =>
  div(value * f.stats.superPower, 100);
const has = (f: Fighter, n: number) =>
  f.equipment.includes(`item_${String(n).padStart(2, "0")}`);
const affinity = (f: Fighter, n: number) =>
  [9, 1, 12, 17, 2, 14, 19, 3, 16, 13, 4, 6, 10, 8, 11, 18, 7, 15, 5, 20][
    n - 1
  ] === no(f);
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const within = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  r: number,
) => distance(a, b) <= (r * 100) ** 2;
function nearby(s: BattleState, f: Fighter, r: number, ally = false) {
  return s.fighters.filter(
    (t) =>
      t.hp > 0 &&
      (ally ? t.team === f.team : t.team !== f.team) &&
      within(f, t, r),
  );
}
function nearest(
  s: BattleState,
  f: Fighter,
  r: number,
  ally = false,
  weak = false,
) {
  return nearby(s, f, r, ally).sort(
    (a, b) =>
      (weak ? a.hp * b.stats.hp - b.hp * a.stats.hp : 0) ||
      distance(f, a) - distance(f, b) ||
      a.id - b.id,
  )[0];
}
function event(s: BattleState, type: string, f: Fighter, t = f, amount = 0) {
  s.events.push({ tick: s.tick, type, source: f.id, target: t.id, amount });
}
function buff(
  s: BattleState,
  f: Fighter,
  kind: string,
  value: number,
  ticks: number,
  source = f.id,
) {
  const existing = f.buffs.find((b) => b.kind === kind && b.source === source);
  if (existing) {
    existing.value = value;
    existing.until = s.tick + ticks;
  } else f.buffs.push({ kind, value, until: s.tick + ticks, source });
}
function energy(s: BattleState, f: Fighter, n: number) {
  f.memory.gain = Math.min(100, (f.memory.gain || 0) + n);
}
function shield(
  s: BattleState,
  source: Fighter,
  f: Fighter,
  n: number,
  ticks: number,
) {
  if (f.hp <= 0) return;
  const amount = Math.max(0, Math.min(n, 100 - f.shield));
  if (!amount) return;
  f.shields.push({ amount, until: s.tick + ticks, source: source.id });
  f.shield += amount;
  event(s, "shield", source, f, amount);
}
function heal(s: BattleState, source: Fighter, f: Fighter, n: number) {
  if (f.hp <= 0) return 0;
  const amount = Math.max(0, Math.min(n, f.stats.hp - f.hp));
  f.hp += amount;
  if (amount) event(s, "heal", source, f, amount);
  return amount;
}
function slow(
  s: BattleState,
  source: Fighter,
  f: Fighter,
  power: number,
  ticks: number,
) {
  if ((f.memory.immuneSlow || 0) > s.tick) return;
  if (has(f, 15) && !f.memory.herb) {
    f.memory.herb = 1;
    f.slowUntil = 0;
    f.memory.immuneSlow = s.tick + (affinity(f, 15) ? 60 : 45);
    event(s, "item:15", f);
    return;
  }
  buff(s, f, "slow", Math.min(35, power), ticks, source.id);
  f.slowUntil = Math.max(f.slowUntil, s.tick + ticks);
  f.memory.slowPower = Math.max(
    ...f.buffs
      .filter((b) => b.kind === "slow" && b.until > s.tick)
      .map((b) => b.value),
    0,
  );
}
function push(source: Fighter, f: Fighter, strength: number) {
  const [x, y] = normalize(f.x - source.x, f.y - source.y);
  const resist = 100;
  f.vx += div(x * strength * resist, UNIT * f.stats.stability);
  f.vy += div(y * strength * resist, UNIT * f.stats.stability);
}
function aim(f: Fighter, t: { x: number; y: number }) {
  const [x, y] = normalize(t.x - f.x, t.y - f.y);
  let best = 0,
    dot = -Infinity;
  DIRECTIONS.forEach((d, i) => {
    const v = x * d[0] + y * d[1];
    if (v > dot) {
      best = i;
      dot = v;
    }
  });
  return best;
}
function launch(
  s: BattleState,
  f: Fighter,
  t: Fighter,
  power: number,
  normal = false,
  pushPower = 0,
) {
  if (s.projectiles.length >= 240) return;
  const d = DIRECTIONS[aim(f, t)];
  const projectileSpeed = normal ? 700 : 1700;
  s.projectiles.push({
    id: s.nextProjectile++,
    owner: f.id,
    x: f.x,
    y: f.y,
    vx: div(d[0] * projectileSpeed, UNIT),
    vy: div(d[1] * projectileSpeed, UNIT),
    life: 90,
    pierce: 0,
    hit: [],
    power,
    normal,
    push: pushPower,
  });
}
function zone(s: BattleState, f: Fighter, z: Partial<Zone>) {
  if (s.zones.length >= 180) return;
  s.zones.push({
    owner: f.id,
    x: f.x,
    y: f.y,
    until: s.tick + 120,
    start: s.tick,
    every: 30,
    power: 0,
    radius: 140,
    ...z,
  });
}
function pending(
  s: BattleState,
  f: Fighter,
  tick: number,
  kind: string,
  t: { x: number; y: number },
  target?: number,
  angle?: number,
) {
  if (s.pending.length >= 180) return;
  s.pending.push({
    owner: f.id,
    tick: s.tick + tick,
    kind,
    x: t.x,
    y: t.y,
    target,
    angle,
  });
  event(
    s,
    "warn:" + kind,
    f,
    target === undefined ? f : s.fighters[target],
    tick,
  );
}
function dash(
  s: BattleState,
  f: Fighter,
  t: Fighter,
  length: number,
  power: number,
) {
  const d = DIRECTIONS[aim(f, t)];
  f.vx = div(d[0] * Math.min(900, div(length * 100, 9)), UNIT);
  f.vy = div(d[1] * Math.min(900, div(length * 100, 9)), UNIT);
  f.memory.dash = s.tick + 9;
  f.memory.dashPower = power;
  f.memory.dashSteps = div(length * 100, 9);
}

function threshold(s: BattleState, f: Fighter) {
  if (f.hp <= 0) return;
  const low40 = f.hp * 100 <= f.stats.hp * 40,
    low30 = f.hp * 100 <= f.stats.hp * 30,
    low25 = f.hp * 100 <= f.stats.hp * 25;
  if (low40 && has(f, 2) && !f.memory.bedding) {
    f.memory.bedding = 1;
    shield(s, f, f, affinity(f, 2) ? 45 : 35, 90);
  }
  if (low25 && has(f, 18) && !f.memory.briefs) {
    f.memory.briefs = 1;
    shield(s, f, f, affinity(f, 18) ? 35 : 25, 60);
    buff(s, f, "speed", 15, 60);
    event(s, "item:18", f);
  }
  if (low30 && has(f, 17) && !f.memory.pork) {
    f.memory.pork = 1;
    heal(s, f, f, affinity(f, 17) ? 25 : 20);
  }
  if (low40) friendEvent(s, f, "low");
}
export function characterDamage(
  s: BattleState,
  f: Fighter,
  t: Fighter,
  raw: number,
  normal = false,
  knock = 150,
) {
  if (
    f.hp <= 0 ||
    t.hp <= 0 ||
    f.team === t.team ||
    isClashProtected(t, s.tick)
  )
    return 0;
  let amount = Math.max(1, Math.min(300, raw - t.stats.defense));
  const absorbed = Math.min(t.shield, amount);
  amount -= absorbed;
  t.shield -= absorbed;
  let remain = absorbed;
  t.shields.sort((a, b) => a.until - b.until || a.source - b.source);
  for (const layer of t.shields) {
    const used = Math.min(layer.amount, remain);
    layer.amount -= used;
    remain -= used;
  }
  t.shields = t.shields.filter((l) => l.amount > 0);
  amount = Math.min(t.hp, amount);
  t.hp -= amount;
  t.taken += amount;
  f.dealt += amount;
  if (amount) {
    energy(s, f, div((amount + 3) * f.stats.charge, 100));
    energy(s, t, div((amount + 4) * t.stats.charge, 180));
  }
  event(s, "hit", f, t, amount);
  if (knock) push(f, t, knock);
  if (!t.hp) {
    t.deadAt = s.tick;
    f.kills++;
    event(s, "kill", f, t);
  } else {
    threshold(s, t);
  }
  if (normal && f.hp > 0) normalEffects(s, f, t, amount);
  return amount;
}
function nextBonus(s: BattleState, f: Fighter, value: number, source = -1) {
  buff(s, f, "bonus", value, 90, source);
}
function normalEffects(s: BattleState, f: Fighter, t: Fighter, amount: number) {
  f.hits++;
  if (has(f, 7)) {
    f.memory.iceHits = Math.min(4, (f.memory.iceHits || 0) + 1);
    if (f.memory.iceHits >= 4 && s.tick >= (f.memory.iceReady || 0)) {
      f.memory.iceHits = 0;
      f.memory.iceReady = s.tick + 90;
      if (t.hp > 0) slow(s, f, t, affinity(f, 7) ? 25 : 20, 30);
    }
  }
  if (has(f, 14)) {
    f.memory.sourHits = Math.min(3, (f.memory.sourHits || 0) + 1);
    if (f.memory.sourHits >= 3 && s.tick >= (f.memory.sourReady || 0)) {
      f.memory.sourHits = 0;
      f.memory.sourReady = s.tick + 150;
      if (t.hp > 0) buff(s, t, "dot", affinity(f, 14) ? 5 : 4, 90, f.id);
    }
  }
}
function normalHit(s: BattleState, f: Fighter, t: Fighter, scale = 100) {
  let hit = f.stats.attack;
  let auxiliary = 0;
  for (const kind of ["bonus", "envelope", "electric"]) {
    const bonuses = f.buffs.filter((b) => b.kind === kind && b.until > s.tick);
    for (const b of bonuses) {
      auxiliary += b.value;
      b.until = s.tick;
    }
  }
  auxiliary = Math.min(100, auxiliary);
  hit = div(hit * (100 + auxiliary) * scale, 10000);
  if (random(s) % 100 < f.stats.crit) hit = div(hit * f.stats.critPower, 100);
  if (f.memory.armorIgnore) {
    hit += div(t.stats.defense * f.memory.armorIgnore, 100);
    f.memory.armorIgnore = 0;
  }
  characterDamage(s, f, t, hit, true);
}

// Team composition and representative slots are immutable for the life of a battle.
// Cache references only; HP, positions and buffs are always read from live fighters.
const representativeCache = new WeakMap<BattleState, Map<string, Fighter[]>>();
function chosen(s: BattleState, team: string) {
  let cache = representativeCache.get(s);
  if (!cache) representativeCache.set(s, (cache = new Map()));
  const cached = cache.get(team);
  if (cached) return cached;
  const cfg = s.config.teams.find((t) => t.id === team)!;
  const result = representatives(cfg.loadouts, cfg.choice)
    .map((slot) => s.fighters.find((f) => f.team === team && f.slot === slot)!)
    .filter(Boolean);
  cache.set(team, result);
  return result;
}
function traitMembers(s: BattleState, f: Fighter, trait: string) {
  return {
    trait,
    members: chosen(s, f.team).filter(
      (t) =>
        t.hp > 0 &&
        (character(t.characterId)?.roleClass === trait ||
          character(t.characterId)?.race === trait),
    ),
  };
}
function friendMembers(s: BattleState, f: Fighter, groupId: string) {
  const group = FRIEND_GROUPS.find((g) => g.id === groupId);
  const living = chosen(s, f.team).filter((t) => t.hp > 0);
  return {
    group,
    members:
      group &&
      groupEligible(
        group,
        living.map((t) => t.characterId),
      )
        ? living.filter(
            (t) => t.hp > 0 && group.members.includes(t.characterId || ""),
          )
        : [],
  };
}
function friendEvent(s: BattleState, source: Fighter, kind: string) {
  for (const group of FRIEND_GROUPS)
    friendGroupEvent(s, source, kind, group.id);
}
function friendGroupEvent(
  s: BattleState,
  source: Fighter,
  kind: string,
  groupId: string,
) {
  const { group, members } = friendMembers(s, source, groupId),
    count = members.length;
  if (!group || count < 2 || !members.includes(source) || source.hp <= 0)
    return;
  const id = group.id,
    three =
      groupTier(
        group,
        members.map((t) => t.characterId),
      ) === 3;
  const trigger =
    (id === "G01" &&
      three &&
      kind === "pulse" &&
      [300, 600].includes(s.tick)) ||
    (id === "G02" &&
      ((no(source) === 1 && kind === "gale") ||
        (no(source) === 19 && kind === "gift") ||
        kind === "skill" || kind === "super")) ||
    (id === "G03" &&
      ((no(source) === 2 && kind === "hug") ||
        (no(source) === 10 && kind === "ram") ||
        kind === "skill" || kind === "super")) ||
    (id === "G04" && three && kind === "pulse" && s.tick === 600) ||
    (id === "G05" && kind === "super") ||
    (id === "G06" && kind === "super") ||
    (id === "G07" && kind === "low") ||
    (["G08", "G09"].includes(id) && kind === "super") ||
    (id === "G10" && kind === "pulse" && [300, 600].includes(s.tick)) ||
    (id === "G11" && no(source) === 14 && kind === "super") ||
    (id === "G12" && no(source) === 9 && ["meeting", "super"].includes(kind)) ||
    (id === "G13" && [3, 15].includes(no(source)) && kind === "super");
  if (!trigger) return;
  if (
    ["G02", "G03", "G05", "G06", "G08", "G09", "G11", "G12", "G13"].includes(
      id,
    ) &&
    members.some((f) =>
      members.some(
        (t) => !within(f, t, ["G02", "G03"].includes(id) ? 240 : 280),
      ),
    )
  )
    return;
  const state =
      s.groups[`${source.team}:${id}`] ||
      (s.groups[`${source.team}:${id}`] = { uses: 0, ready: 0 }),
    max = ["G02", "G03"].includes(id) ? 3 : ["G04", "G06"].includes(id) ? 1 : 2;
  if (state.uses >= max || state.ready > s.tick) return;
  state.uses++;
  state.ready =
    s.tick +
    (["G01", "G04", "G10"].includes(id)
      ? 1
      : ["G02", "G03"].includes(id)
        ? 240
        : 360);
  event(s, "group:" + id, source, source, three ? 3 : 2);
  if (id === "G01") members.forEach((t) => energy(s, t, 4));
  if (id === "G02") {
    const partner = members.find((t) => t.id !== source.id)!;
    shield(s, source, partner, 10, 60);
  }
  if (id === "G03")
    members.forEach((t) => {
      shield(s, source, t, 8, 60);
      buff(s, t, "speed", 8, 60, -1000 - Number(id.slice(1)));
    });
  if (id === "G04") members.forEach((t) => shield(s, source, t, 10, 150));
  if (id === "G05")
    members
      .filter((t) => t.id !== source.id)
      .forEach((t) => energy(s, t, three ? 8 : 4));
  if (id === "G06")
    members.forEach((t) => shield(s, source, t, three ? 12 : 8, 90));
  if (id === "G07")
    members
      .filter((t) => within(source, t, 280))
      .forEach((t) => heal(s, source, t, three ? 8 : 6));
  if (id === "G08")
    members.forEach((t) =>
      buff(s, t, "attack", three ? 12 : 8, 90, -1000 - Number(id.slice(1))),
    );
  if (id === "G10") members.forEach((t) => energy(s, t, three ? 5 : 3));
  if (id === "G09")
    members
      .filter((t) => t.id !== source.id)
      .forEach((t) => {
        shield(s, source, t, 16, 90);
        energy(s, t, 4);
      });
  if (id === "G11")
    members
      .filter((t) => t.id !== source.id)
      .forEach((t) => {
        const artist = FRIEND_GROUPS.find(
          (g) => g.id === "G09",
        )!.members.includes(t.characterId!);
        if (three || artist) shield(s, source, t, three ? 24 : 18, 90);
        if (three || !artist) {
          energy(s, t, 6);
          buff(
            s,
            t,
            "haste",
            three ? 115 : 110,
            90,
            -1000 - Number(id.slice(1)),
          );
        } else buff(s, t, "speed", 8, 90, -1000 - Number(id.slice(1)));
      });
  if (id === "G13")
    members
      .filter((t) => t.id !== source.id)
      .forEach((t) => {
        energy(s, t, three ? 6 : 4);
        buff(s, t, "attack", three ? 12 : 8, 90, -1000 - Number(id.slice(1)));
      });
  if (id === "G12")
    members
      .filter((t) => t.id !== source.id)
      .forEach((t) => {
        buff(s, t, "attack", three ? 12 : 8, 90, -1000 - Number(id.slice(1)));
        buff(s, t, "haste", three ? 115 : 110, 90, -1000 - Number(id.slice(1)));
      });
}
export function initializeCharacters(s: BattleState) {
  for (const cfg of s.config.teams) {
    if (cfg.choice && !validChoice(cfg.loadouts, cfg.choice))
      throw Error("Invalid team synergy");
  }
  for (const f of s.fighters) {
    if (!f.characterId) continue;
    if (f.stats.shield > 0) {
      f.shields.push({
        amount: f.stats.shield,
        until: Number.MAX_SAFE_INTEGER,
        source: f.id,
      });
    }
    const n = no(f);
    f.skillReady = 7 * 30;
    const traits = TRAITS.map((trait) => traitMembers(s, f, trait)).filter(
      (t) => t.members.length >= 2 && t.members.includes(f),
    );
    if (traits.some((t) => t.trait === "Thực Linh")) {
      f.baseStats.hp = Math.min(1600, f.baseStats.hp + 20);
      f.stats.hp = f.baseStats.hp;
      f.hp = f.stats.hp;
    }
    if (has(f, 12)) shield(s, f, f, affinity(f, 12) ? 50 : 40, 300);
    if ((has(f, 6) && affinity(f, 6)) || (has(f, 11) && affinity(f, 11)))
      shield(s, f, f, 10, 150);
    const support = traits.find((t) => t.trait === "Hỗ trợ");
    if (support) shield(s, f, f, support.members.length >= 3 ? 16 : 10, 150);
  }
}
export function beforeCharacterTick(s: BattleState) {
  const tempo = roundTempo(s.tick);
  const contexts = new Map(
    s.config.teams.map((cfg) => {
      const living = chosen(s, cfg.id).filter((f) => f.hp > 0);
      const ids = living.map((f) => f.characterId);
      return [
        cfg.id,
        {
          traits: TRAITS.map((trait) => ({
            trait,
            members: living.filter((f) => {
              const profile = character(f.characterId);
              return profile?.roleClass === trait || profile?.race === trait;
            }),
          })).filter((t) => t.members.length >= 2),
          groups: FRIEND_GROUPS.filter((group) =>
            groupEligible(group, ids),
          ).map((group) => ({
            group,
            members: living.filter((f) =>
              group.members.includes(f.characterId || ""),
            ),
          })),
        },
      ] as const;
    }),
  );
  for (const f of s.fighters) {
    if (!f.characterId) continue;
    f.memory.gain = 0;
    f.buffs = f.buffs.filter(
      (b) =>
        b.until >= s.tick && (b.kind !== "dot" || s.fighters[b.source]?.hp > 0),
    );
    f.shields = f.shields.filter((l) => l.until > s.tick && l.amount > 0);
    f.shield = f.shields.reduce((sum, l) => sum + l.amount, 0);
    if (f.hp <= 0) continue;
    const oldSpeed = f.stats.speed,
      oldCooldown = f.stats.cooldown;
    f.stats = { ...f.baseStats };
    let attack = 0,
      speed = 0;
    let synergyAttack = 0,
      synergySpeed = 0,
      synergyHaste = 0;
    for (const { trait, members } of contexts.get(f.team)!.traits) {
      const count = members.length;
      if (count >= 2 && members.includes(f)) {
        if (trait === "Hộ vệ") f.stats.defense += count >= 3 ? 2 : 1;
        if (trait === "Đấu sĩ") synergyAttack += count >= 3 ? 6 : 4;
        if (trait === "Kiểm soát") f.stats.superPower += count >= 3 ? 8 : 5;
        if (trait === "Người Phố Hội") synergySpeed += count >= 3 ? 6 : 4;
        if (trait === "Thú Nhân") f.stats.crit += count >= 3 ? 5 : 3;
        if (trait === "Linh Vật") synergySpeed += 5;
        if (trait === "Vật Linh") f.stats.mass += 20;
      }
    }
    for (const friends of contexts.get(f.team)!.groups) {
      const group = friends.group,
        friendCount = friends.members.length;
      if (friendCount >= 2 && friends.members.includes(f)) {
        const three =
            groupTier(
              group,
              friends.members.map((t) => t.characterId),
            ) === 3,
          id = friends.group!.id;
        if (["G01", "G05"].includes(id)) synergySpeed += three ? 6 : 4;
        if (id === "G04") f.stats.defense += three ? 2 : 1;
        if (id === "G06") f.stats.superPower += three ? 15 : 10;
        if (id === "G07") f.stats.crit += three ? 5 : 3;
      }
    }
    let haste = 100;
    for (const b of f.buffs)
      if (b.until > s.tick) {
        if (b.source <= -1000) {
          if (b.kind === "attack") synergyAttack += b.value;
          if (b.kind === "speed") synergySpeed += b.value;
          if (b.kind === "haste") synergyHaste += b.value - 100;
          if (b.kind === "armor") f.stats.defense += b.value;
          continue;
        }
        if (b.kind === "attack") attack = Math.max(attack, b.value);
        if (b.kind === "speed" || b.kind === "deliverySpeed")
          speed = Math.max(speed, b.value);
        if (b.kind === "armor") f.stats.defense += b.value;
        if (b.kind === "haste") haste = Math.max(haste, b.value);
      }
    attack += synergyAttack;
    speed += synergySpeed;
    haste += synergyHaste;
    f.stats.attack = Math.min(
      300,
      div(div(f.baseStats.attack * tempo.attack, 100) * (100 + attack), 100),
    );
    f.stats.speed = Math.min(
      900,
      div(div(f.baseStats.speed * tempo.speed, 100) * (100 + speed), 100),
    );
    f.stats.cooldown = Math.max(
      8,
      div(div(f.baseStats.cooldown * 100, tempo.haste) * 100, haste),
    );
    f.stats.charge = Math.min(300, div(f.baseStats.charge * tempo.charge, 100));
    f.stats.superPower = Math.min(
      300,
      div(f.stats.superPower * tempo.superPower, 100),
    );
    f.stats.defense = Math.min(60, f.stats.defense);
    f.stats.mass = Math.min(500, f.stats.mass);
    f.stats.crit = Math.min(65, f.stats.crit);
    f.vx = div(f.vx * f.stats.speed, oldSpeed);
    f.vy = div(f.vy * f.stats.speed, oldSpeed);
    if (f.stats.cooldown !== oldCooldown) {
      if (f.nextAttack > s.tick)
        f.nextAttack =
          s.tick +
          Math.max(
            1,
            div((f.nextAttack - s.tick) * f.stats.cooldown, oldCooldown),
          );
      for (const key of Object.keys(f.cooldowns))
        if (f.cooldowns[key] > s.tick)
          f.cooldowns[key] =
            s.tick +
            Math.max(
              1,
              div((f.cooldowns[key] - s.tick) * f.stats.cooldown, oldCooldown),
            );
    }
    const slows = f.buffs.filter((b) => b.kind === "slow" && b.until > s.tick);
    f.slowUntil = Math.max(0, ...slows.map((b) => b.until));
    f.memory.slowPower = Math.max(0, ...slows.map((b) => b.value));
    if (has(f, 1) && s.tick % 300 === 0 && s.tick <= 1800) {
      energy(s, f, affinity(f, 1) && s.tick <= 600 ? 10 : 8);
      event(s, "item:01", f);
    }
    if (has(f, 19) && s.tick % 150 === 0 && s.tick <= 600)
      heal(s, f, f, affinity(f, 19) ? 6 : 5);
  }
  for (const cfg of s.config.teams) {
    for (const group of FRIEND_GROUPS) {
      const source = chosen(s, cfg.id).find(
        (f) => f.hp > 0 && group.members.includes(f.characterId || ""),
      );
      if (source) friendGroupEvent(s, source, "pulse", group.id);
    }
  }
}
export function characterWall(s: BattleState, f: Fighter) {
  void s;
  void f;
}
export function characterContacts(s: BattleState, a: Fighter, b: Fighter) {
  if (
    (!a.characterId && !b.characterId) ||
    a.team === b.team ||
    a.hp <= 0 ||
    b.hp <= 0 ||
    distance(a, b) > (a.radius + b.radius + 2) ** 2
  )
    return;
  for (const [f, t] of [
    [a, b],
    [b, a],
  ]) {
    if (!f.characterId || t.hp <= 0) continue;
    const key = "contact:" + t.id;
    if ((f.memory[key] || 0) > s.tick) continue;
    f.memory[key] = s.tick + 24;
    if (has(f, 11) && s.tick >= (f.memory.fridgeReady || 0)) {
      f.memory.fridgeReady = s.tick + 120;
      slow(s, f, t, 20, 30);
      event(s, "item:11", f, t);
    }
    if (has(f, 13) && !f.memory.goat) {
      f.memory.goat = 1;
      characterDamage(
        s,
        f,
        t,
        div(f.stats.attack * (affinity(f, 13) ? 75 : 60), 100),
      );
    }
    if ((f.memory.dash || 0) > s.tick) {
      f.memory.dash = 0;
      characterDamage(s, f, t, div(f.stats.attack * f.memory.dashPower, 100));
    }
  }
}

function bondEvent(
  s: BattleState,
  source: Fighter,
  kind: string,
  target?: Fighter,
) {
  friendEvent(s, source, kind);
  for (const b of BONDS) resolveBondEvent(s, source, kind, b, target);
}
function resolveBondEvent(
  s: BattleState,
  source: Fighter,
  kind: string,
  b: (typeof BONDS)[number],
  target?: Fighter,
) {
  const buffSource = -2000 - BONDS.indexOf(b);
  const bondBuff = (
    state: BattleState,
    f: Fighter,
    kind: string,
    value: number,
    ticks: number,
  ) => buff(state, f, kind, value, ticks, buffSource);
  const fs = chosen(s, source.team).filter((f) =>
    b.members.includes(f.characterId || ""),
  );
  if (
    fs.length !== b.size ||
    fs.some((f) => f.hp <= 0) ||
    fs.some((f) => fs.some((t) => !within(f, t, b.size === 2 ? 240 : 280)))
  )
    return;
  const state =
    s.bonds[`${source.team}:${b.id}`] ||
    (s.bonds[`${source.team}:${b.id}`] = { uses: 0, ready: 0 });
  if (state.uses >= (b.size === 2 ? 3 : 2) || state.ready > s.tick) return;
  const get = (n: number) => fs.find((f) => no(f) === n)!;
  let ok = false;
  if (b.size === 3) {
    const triggers = [15, 7, 18, 9, 6, 19, 10, 12, 20, 21];
    ok = kind === "super" && no(source) === triggers[Number(b.id.slice(1)) - 1];
  } else {
    const newBonds: Record<string, number[]> = {
      P14: [21, 23], P15: [22, 24], P16: [24, 25], P17: [21, 25], P18: [22, 23],
    };
    ok = newBonds[b.id]
      ? newBonds[b.id].includes(no(source)) &&
        (kind === "super" || (b.id === "P16" && kind === "skill"))
      : fs.includes(source) && (kind === "skill" || kind === "super");
  }
  if (!ok) return;
  state.uses++;
  state.ready = s.tick + (b.size === 2 ? 240 : 360);
  event(s, "bond:" + b.id, source);
  switch (b.id) {
    case "P01":
      shield(s, source, get(8), 15, 60);
      bondBuff(s, get(8), "speed", 8, 60);
      break;
    case "P02":
      energy(s, get(7), 10);
      break;
    case "P03":
      fs.forEach((f) => shield(s, source, f, 10, 60));
      break;
    case "P04":
      bondBuff(s, get(4), "speed", 10, 60);
      break;
    case "P05":
      nextBonus(s, get(16), 30, buffSource);
      break;
    case "P06":
      shield(s, source, get(11), 10, 60);
      break;
    case "P07":
      energy(s, get(16), 8);
      break;
    case "P08":
      nextBonus(s, get(12), 30, buffSource);
      break;
    case "P09":
      energy(s, get(14), 8);
      break;
    case "P10":
      nextBonus(s, get(17), 25, buffSource);
      break;
    case "P11":
      energy(s, get(13), 8);
      break;
    case "P12":
      shield(s, source, get(11), 12, 60);
      break;
    case "P13":
      nextBonus(s, get(13), 25, buffSource);
      break;
    case "P14":
      shield(s, source, get(no(source) === 21 ? 23 : 21), 15, 90);
      break;
    case "P15":
      energy(s, get(no(source) === 22 ? 24 : 22), 8);
      break;
    case "P16":
      bondBuff(s, get(no(source) === 24 ? 25 : 24), "attack", 8, 90);
      break;
    case "P17":
      heal(s, source, get(no(source) === 21 ? 25 : 21), 12);
      break;
    case "P18":
      fs.forEach((f) => shield(s, source, f, 8, 90));
      break;
    case "T10":
      fs.forEach((f) => shield(s, source, f, 12, 90));
      break;
    case "T09":
      fs.forEach((f) => shield(s, source, f, 15, 90));
      break;
    case "T01":
      fs.forEach((f) => shield(s, source, f, 18, 90));
      break;
    case "T02":
      fs.forEach((f) => bondBuff(s, f, "speed", 10, 90));
      break;
    case "T03":
      fs.forEach((f) => heal(s, source, f, 10));
      break;
    case "T04":
      fs.forEach((f) => bondBuff(s, f, "attack", 8, 90));
      break;
    case "T05":
      fs.forEach((f) => {
        shield(s, source, f, 15, 90);
        f.buffs = f.buffs.filter((b) => b.kind !== "slow");
        f.slowUntil = 0;
      });
      break;
    case "T06":
      fs.forEach((f) => nextBonus(s, f, 25, buffSource));
      break;
    case "T07":
      fs.forEach((f) => {
        shield(s, source, f, 12, 90);
        bondBuff(s, f, "speed", 8, 90);
      });
      break;
    case "T08":
      fs.forEach((f) => nextBonus(s, f, 30, buffSource));
      break;
  }
}

function legacySkill(s: BattleState, f: Fighter) {
  const n = no(f),
    up = f.level >= 5;
  let t: Fighter | undefined;
  if ([2, 4, 5, 8, 9, 12, 16, 17, 18, 3].includes(n)) {
    t = nearest(
      s,
      f,
      (
        {
          2: 180,
          3: 260,
          4: 320,
          5: 300,
          8: 200,
          9: 280,
          12: 150,
          16: 260,
          17: 220,
          18: 180,
        } as Record<number, number>
      )[n],
      false,
      n === 8,
    );
    if (!t) return false;
  }
  switch (n) {
    case 1:
      nearby(s, f, 140).forEach((t) =>
        characterDamage(s, f, t, div(f.stats.attack * 55, 100), false, 300),
      );
      bondEvent(s, f, "gale");
      break;
    case 2:
      dash(s, f, t!, 100, up ? 130 : 110);
      break;
    case 3:
      pending(s, f, 15, "jam", t!);
      break;
    case 4:
      launch(s, f, t!, 100, false, up ? 450 : 350);
      break;
    case 5:
      f.memory.markTarget = t!.id;
      f.memory.markUntil = s.tick + (up ? 120 : 90);
      bondEvent(s, f, "mark");
      break;
    case 6:
      nearby(s, f, 160, true).forEach((a) => {
        shield(s, f, a, up ? 22 : 16, 60);
        buff(s, a, "speed", 12, 60, f.id);
        buff(s, a, "attack", 12, 60, f.id);
        bondEvent(s, f, "rally", a);
      });
      break;
    case 7:
      nearby(s, f, 130).forEach((a) => {
        characterDamage(s, f, a, div(f.stats.attack * (up ? 90 : 70), 100));
        if ((a.memory.immuneInterrupt || 0) <= s.tick) {
          a.memory.interrupt = s.tick + 15;
          a.memory.immuneInterrupt = s.tick + 45;
        }
      });
      break;
    case 8:
      dash(s, f, t!, 110, up ? 140 : 120);
      break;
    case 9:
      pending(s, f, 18, "meeting", t!);
      break;
    case 10: {
      const a = nearest(s, f, 240);
      if (!a) return false;
      const d = DIRECTIONS[aim(f, a)];
      f.vx = div(d[0] * f.stats.speed, UNIT);
      f.vy = div(d[1] * f.stats.speed, UNIT);
      buff(s, f, "deliverySpeed", 25, 30);
      f.memory.ram = s.tick + 30;
      break;
    }
    case 11: {
      const a = nearest(s, f, 220, true, true)!;
      shield(s, f, a, up ? 38 : 30, 90);
      a.buffs = a.buffs.filter((b) => b.kind !== "slow");
      a.slowUntil = 0;
      bondEvent(s, f, "flag", a);
      break;
    }
    case 12:
      pending(s, f, 9, "slice", t!, undefined, aim(f, t!));
      break;
    case 13: {
      const a = nearest(s, f, 240, true, true)!;
      const amount = heal(s, f, a, up ? 22 : 18);
      if (amount) bondEvent(s, f, "apple", a);
      break;
    }
    case 14:
      if (s.zones.filter((z) => z.owner === f.id && z.trap).length >= 2) {
        const index = s.zones.findIndex((z) => z.owner === f.id && z.trap);
        s.zones.splice(index, 1);
      }
      zone(s, f, {
        radius: 75,
        trap: true,
        start: s.tick + 15,
        until: s.tick + (up ? 180 : 150),
        power: 125,
      });
      break;
    case 15: {
      const a = nearest(s, f, 220, true, true)!;
      shield(s, f, a, up ? 36 : 28, 90);
      if (a.id !== f.id) {
        const d = DIRECTIONS[aim(f, a)];
        f.vx = div(d[0] * f.stats.speed, UNIT);
        f.vy = div(d[1] * f.stats.speed, UNIT);
      }
      bondEvent(s, f, "guard", a);
      break;
    }
    case 16:
      pending(s, f, 15, "ink", f, undefined, aim(f, t!));
      break;
    case 17: {
      const d = DIRECTIONS[aim(f, t!)];
      f.vx = div(d[0] * f.stats.speed, UNIT);
      f.vy = div(d[1] * f.stats.speed, UNIT);
      buff(s, f, "deliverySpeed", 30, 30);
      f.memory.delivery = s.tick + 30;
      break;
    }
    case 18:
      pending(s, f, 0, "soup", f, undefined, aim(f, t!));
      break;
    case 19: {
      const a = nearest(s, f, 220, true, true)!;
      shield(s, f, a, up ? 28 : 20, 90);
      buff(s, a, "attack", 10, 60, f.id);
      bondEvent(s, f, "gift", a);
      break;
    }
    case 20: {
      const a = nearest(s, f, 240, true, true)!;
      shield(s, f, a, up ? 26 : 20, 90);
      a.buffs = a.buffs.filter((b) => b.kind !== "slow");
      a.slowUntil = 0;
      bondEvent(s, f, "rose", a);
      break;
    }
  }
  event(s, "skill:" + String(n).padStart(2, "0"), f, t || f);
  return true;
}
function legacySuperCast(s: BattleState, f: Fighter) {
  const n = no(f);
  if (n === 9 && !nearest(s, f, 300)) return false;
  f.energy = 0;
  f.superUntil = s.tick + 120;
  f.supers++;
  event(s, "super", f);
  f.memory.hugHits = 0;
  f.memory.swordHits = 0;
  if (has(f, 20) && affinity(f, 20)) {
    const ally = nearest(s, f, 240, true, true);
    if (ally) {
      shield(s, f, ally, 8, 90);
      event(s, "item:20", f, ally, 8);
    }
  }
  if (has(f, 8)) buff(s, f, "electric", affinity(f, 8) ? 60 : 50, 120, -8);
  if (has(f, 9)) buff(s, f, "attack", 12, affinity(f, 9) ? 120 : 90, -9);
  switch (n) {
    case 1:
      shield(s, f, f, superValue(f, 45), 120);
      zone(s, f, { follow: true, radius: 110, power: 55, super: true });
      break;
    case 2:
      break;
    case 3:
      zone(s, f, { follow: true, power: 40, slow: 20, super: true });
      break;
    case 4:
      buff(s, f, "speed", 20, 120);
      break;
    case 5:
      buff(s, f, "haste", 133, 120);
      break;
    case 6:
      nearby(s, f, 180, true).forEach((a) =>
        shield(s, f, a, superValue(f, 30), 120),
      );
      zone(s, f, { follow: true, radius: 180, attack: 20 });
      break;
    case 7:
      for (const dt of [0, 45, 90]) pending(s, f, dt, "sound", f);
      break;
    case 8:
      buff(s, f, "speed", 15, 120);
      break;
    case 9: {
      const a = nearest(s, f, 300)!;
      pending(s, f, 30, "deadline", a, a.id);
      break;
    }
    case 10:
      shield(s, f, f, superValue(f, 50), 120);
      break;
    case 11:
      nearby(s, f, 200, true).forEach((a) => {
        shield(s, f, a, superValue(f, 50), 120);
        a.buffs = a.buffs.filter((b) => b.kind !== "slow");
        a.memory.immuneSlow = s.tick + 30;
      });
      break;
    case 12:
      break;
    case 13:
      zone(s, f, { follow: true, radius: 160, heal: 6, super: true });
      break;
    case 14:
      for (const angle of [0, 11, 21]) {
        const d = DIRECTIONS[angle];
        pending(
          s,
          f,
          21,
          "giftBomb",
          { x: f.x + div(d[0] * 9000, UNIT), y: f.y + div(d[1] * 9000, UNIT) },
          undefined,
          f.superUntil,
        );
      }
      break;
    case 15:
      buff(s, f, "armor", 4, 120);
      zone(s, f, {
        follow: true,
        radius: 130,
        power: 45,
        push: 200,
        super: true,
      });
      break;
    case 16:
      zone(s, f, { radius: 150, power: 50, super: true });
      break;
    case 17:
      buff(s, f, "speed", 20, 120);
      buff(s, f, "haste", 125, 120);
      shield(s, f, f, superValue(f, 25), 120);
      break;
    case 18:
      pending(s, f, 18, "hotpot", f);
      break;
    case 19:
      nearby(s, f, 180, true).forEach((a) => {
        shield(s, f, a, superValue(f, 35), 120);
        buff(s, a, "envelope", 60, 120, -19);
      });
      break;
    case 20:
      zone(s, f, {
        follow: true,
        radius: 150,
        power: 30,
        slow: 20,
        heal: 4,
        super: true,
      });
      break;
  }
  bondEvent(s, f, "super");
  return true;
}
function cone(
  s: BattleState,
  f: Fighter,
  x: number,
  y: number,
  angle: number,
  length: number,
  power: number,
) {
  const d = DIRECTIONS[angle];
  let hit = false;
  for (const t of s.fighters) {
    if (t.hp <= 0 || t.team === f.team || !within({ x, y }, t, length))
      continue;
    const dx = t.x - x,
      dy = t.y - y,
      dot = dx * d[0] + dy * d[1];
    if (dot <= 0 || dot * dot < ((dx * dx + dy * dy) * UNIT * UNIT) / 2)
      continue;
    characterDamage(s, f, t, div(f.stats.attack * power, 100));
    hit = true;
  }
  return hit;
}
function resolvePending(s: BattleState) {
  const ready = s.pending.filter((p) => p.tick <= s.tick);
  s.pending = s.pending.filter((p) => p.tick > s.tick);
  for (const p of ready) {
    const f = s.fighters[p.owner];
    if (f.hp <= 0) continue;
    const up = f.level >= 5;
    if (p.kind === "jam")
      zone(s, f, {
        x: p.x,
        y: p.y,
        radius: up ? 95 : 85,
        start: s.tick,
        until: s.tick + 75,
        every: 15,
        power: 45,
        slow: 25,
      });
    if (p.kind === "meeting") {
      let hit = false;
      for (const t of s.fighters)
        if (t.hp > 0 && t.team !== f.team && within(p, t, 75)) {
          characterDamage(s, f, t, div(f.stats.attack * 75, 100));
          slow(s, f, t, 25, 36);
          hit = true;
        }
      if (hit) bondEvent(s, f, "meeting");
    }
    if (p.kind === "slice") cone(s, f, f.x, f.y, p.angle!, 130, up ? 140 : 120);
    if (p.kind === "ink") {
      const d = DIRECTIONS[p.angle!];
      zone(s, f, {
        x: p.x,
        y: p.y,
        start: s.tick,
        until: s.tick + 75,
        every: 15,
        power: 45,
        slow: 20,
        line: { dx: d[0], dy: d[1], length: 180, width: up ? 55 : 45 },
      });
    }
    if (p.kind === "soup" && cone(s, f, p.x, p.y, p.angle!, 150, up ? 110 : 90))
      bondEvent(s, f, "soup");
    if (p.kind === "sound")
      nearby(s, f, 150).forEach((t) =>
        characterDamage(
          s,
          f,
          t,
          div(f.stats.attack * 60 * f.stats.superPower, 10000),
          false,
          250,
        ),
      );
    if (p.kind === "hotpot")
      zone(s, f, { x: p.x, y: p.y, radius: 140, power: 55, super: true });
    if (p.kind === "deadline") {
      const a = s.fighters[p.target!];
      if (a.hp <= 0) continue;
      for (const t of nearby(s, a, 100, true))
        if (t.team !== f.team)
          characterDamage(
            s,
            f,
            t,
            div(f.stats.attack * 180 * f.stats.superPower, 10000),
          );
    }
    if (p.kind === "giftBomb") {
      for (const t of s.fighters)
        if (t.hp > 0 && t.team !== f.team && within(p, t, 90)) {
          const key = "bomb:" + f.id;
          if (t.memory[key] !== p.angle) {
            t.memory[key] = p.angle!;
            t.memory[key + ":hits"] = 0;
          }
          if ((t.memory[key + ":hits"] || 0) >= 2) continue;
          t.memory[key + ":hits"] = (t.memory[key + ":hits"] || 0) + 1;
          characterDamage(
            s,
            f,
            t,
            div(f.stats.attack * 90 * f.stats.superPower, 10000),
          );
        }
    }
    event(s, "impact:" + p.kind, f);
  }
}

/** Shared, readable skill rules. Character identity keeps its VFX event, while
 * combat behavior is intentionally limited to one clear action per role. */
function skill(s: BattleState, f: Fighter) {
  const n = no(f);
  const power = 100;
  const enemy = nearest(s, f, 300);
  if (!enemy) return false;
  characterDamage(s, f, enemy, div(f.stats.attack * 120 * power, 10000));
  event(s, "skill:" + String(n).padStart(2, "0"), f, enemy);
  bondEvent(s, f, "skill");
  return true;
}

/** Supers use the same role action with a stronger value and retain the
 * existing generic super event so current VFX continue to play. */
function superCast(s: BattleState, f: Fighter) {
  const power = 200;
  const enemy = nearest(s, f, 360);
  if (!enemy) return false;
  f.energy = 0;
  f.superUntil = s.tick + 120;
  f.supers++;
  event(s, "super", f);
  characterDamage(s, f, enemy, div(f.stats.attack * 200 * power, 10000));
  bondEvent(s, f, "super");
  return true;
}

export function characterCombat(s: BattleState) {
  // Supers spend only energy present at the beginning of this tick.
  for (const f of s.fighters) {
    if (f.hp <= 0 || !f.characterId) continue;
    let cast = false;
    if (
      f.energy >= 100 &&
      f.superUntil <= s.tick &&
      (f.memory.interrupt || 0) <= s.tick
    )
      cast = superCast(s, f);
    if (
      !cast &&
      f.skillReady <= s.tick &&
      (f.memory.interrupt || 0) <= s.tick &&
      skill(s, f)
    ) {
      f.skillReady = s.tick + 7 * 30;
    }
  }
  resolvePending(s);
  for (const f of s.fighters) {
    if (f.hp <= 0) continue;
    for (const b of f.buffs)
      if (
        (b.kind === "dot" || b.kind === "soupDot") &&
        b.until >= s.tick &&
        (b.until - s.tick) % 30 === 0 &&
        s.tick > b.until - (b.kind === "dot" ? 90 : 60)
      ) {
        const src = s.fighters[b.source];
        if (src?.hp > 0)
          characterDamage(
            s,
            src,
            f,
            b.kind === "dot" ? b.value : div(src.stats.attack * b.value, 100),
            false,
            0,
          );
      }
    if (f.hp <= 0 || (f.memory.interrupt || 0) > s.tick) continue;
    rotateWeaponAngle(f);
    {
      const reach = f.stats.reach;
      const count = 1;
      for (let w = 0; w < count; w++) {
        const d = DIRECTIONS[(f.angle + w * 16) % 32],
          ax = f.x + div(d[0] * f.radius, UNIT),
          ay = f.y + div(d[1] * f.radius, UNIT),
          x = f.x + div(d[0] * reach, UNIT),
          y = f.y + div(d[1] * reach, UNIT);
        for (const t of s.fighters) {
          const key = "0:" + t.id;
          if (
            t.hp <= 0 ||
            t.team === f.team ||
            (f.cooldowns[key] || 0) > s.tick
          )
            continue;
          if (capsuleHit(ax, ay, x, y, t.x, t.y, t.radius + 500)) {
            if (isClashProtected(t, s.tick)) continue;
            f.cooldowns[key] = s.tick + f.stats.cooldown;
            reverseWeaponSpin(f, s.tick);
            normalHit(s, f, t);
          }
        }
      }
    }
  }
  const bounds = safeBounds(s);
  for (const p of s.projectiles) {
    const f = s.fighters[p.owner],
      ox = p.x,
      oy = p.y;
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (
      f.hp <= 0 ||
      p.x < bounds.left + 450 ||
      p.x > bounds.right - 450 ||
      p.y < bounds.top + 450 ||
      p.y > bounds.bottom - 450
    )
      p.life = 0;
    for (const t of s.fighters) {
      if (p.life <= 0 || t.hp <= 0 || t.team === f.team || p.hit.includes(t.id))
        continue;
      if (capsuleHit(ox, oy, p.x, p.y, t.x, t.y, t.radius + 450)) {
        if (p.normal && !isClashProtected(t, s.tick)) {
          reverseWeaponSpin(f, s.tick);
          normalHit(
            s,
            f,
            t,
            p.hit.length ? Math.min(100, superValue(f, 60)) : 100,
          );
        } else if (!p.normal)
          characterDamage(
            s,
            f,
            t,
            div(f.stats.attack * (p.power || 100), 100),
            false,
            p.push || 150,
          );
        p.hit.push(t.id);
        if (p.pierce-- <= 0) p.life = 0;
      }
    }
  }
  s.projectiles = s.projectiles.filter((p) => p.life > 0);
  for (const z of s.zones) {
    const f = s.fighters[z.owner];
    if (f.hp <= 0 || z.until < s.tick || s.tick < (z.start || 0)) continue;
    if (z.follow) {
      z.x = f.x;
      z.y = f.y;
    }
    if (z.trap) {
      const t = s.fighters.find(
        (t) => t.hp > 0 && t.team !== f.team && within(z, t, z.radius || 65),
      );
      if (t) {
        for (const a of s.fighters)
          if (a.hp > 0 && a.team !== f.team && within(z, a, 100)) {
            characterDamage(s, f, a, div(f.stats.attack * 125, 100));
            slow(s, f, a, 25, 30);
          }
        z.until = s.tick;
        event(s, "impact:trap", f);
      }
      continue;
    }
    for (const t of s.fighters) {
      if (t.hp <= 0) continue;
      const inside = z.line
        ? capsuleHit(
            z.x,
            z.y,
            z.x + div(z.line.dx * z.line.length * 100, UNIT),
            z.y + div(z.line.dy * z.line.length * 100, UNIT),
            t.x,
            t.y,
            div(z.line.width * 100, 2),
          )
        : within(z, t, z.radius || 140);
      if (!inside) continue;
      if (t.team === f.team) {
        if (z.attack) buff(s, t, "attack", z.attack, 2, f.id);
        if (
          z.heal &&
          (s.tick - (z.start || 0)) % (z.every || 30) === 0 &&
          s.tick > (z.start || 0)
        )
          heal(s, f, t, z.super ? superValue(f, z.heal) : z.heal);
      } else {
        if (z.slow) slow(s, f, t, z.slow, 2);
        if (
          z.power &&
          (s.tick - (z.start || 0)) % (z.every || 30) === 0 &&
          s.tick > (z.start || 0)
        )
          characterDamage(
            s,
            f,
            t,
            div(
              f.stats.attack * z.power * (z.super ? f.stats.superPower : 100),
              10000,
            ),
            false,
            z.push || 0,
          );
      }
    }
  }
  s.zones = s.zones.filter(
    (z) => z.until > s.tick && s.fighters[z.owner].hp > 0,
  );
  for (const f of s.fighters)
    f.energy = Math.min(100, f.energy + (f.memory.gain || 0));
  s.events = s.events.slice(-120);
}
