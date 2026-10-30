import { masteryInfo } from "../../shared/src/mastery";
import type {
  MasteryForm,
  ShotPattern,
  SummonVariant,
} from "../../shared/src/mastery-forms";
import type {
  BattleState,
  Fighter,
  Projectile,
  Zone,
  Construct,
} from "./types";
import type { KitCombatServices } from "./kit-combat";
import { DIRECTIONS, div, normalize, UNIT } from "./math";
import { capsuleHit } from "./physics";
import {
  combatTargets,
  isConstruct,
  hitConstruct,
  targetTeam,
} from "./constructs";
import { alignedRangedTarget } from "./weapons";
import { attackCooldown } from "./statuses";
import { safeBounds } from "./bounds";

export interface FormOperations {
  shoot(
    s: BattleState,
    f: Fighter,
    angle: number,
    kind: NonNullable<Projectile["kit"]>,
    power?: number,
    options?: Partial<Projectile>,
  ): Projectile | undefined;
  field(
    s: BattleState,
    f: Fighter,
    kind: NonNullable<Zone["kit"]>,
    x: number,
    y: number,
    radius: number,
    duration: number,
    power: number,
    options?: Partial<Zone>,
  ): boolean;
  summon(
    s: BattleState,
    f: Fighter,
    kind: Construct["kind"],
    variant?: SummonVariant,
  ): boolean;
  beam(
    s: BattleState,
    f: Fighter,
    target: Fighter,
    power: number,
    width: number,
    range: number,
    ctx: KitCombatServices,
    rainbow?: boolean,
  ): void;
  dash(
    s: BattleState,
    f: Fighter,
    target: Fighter,
    duration: number,
    speed: number,
  ): void;
}
export function masteryForm(f: Fighter) {
  const skill = masteryInfo(f.masteryId);
  return skill && skill.characterId === f.characterId ? skill.form : undefined;
}
export function formAttackCooldown(f: Fighter, tick: number) {
  return attackCooldown(f, tick);
}
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const aim = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const [dx, dy] = normalize(b.x - a.x, b.y - a.y);
  let best = -Infinity,
    angle = 0;
  for (let i = 0; i < 32; i++) {
    const dot = dx * DIRECTIONS[i][0] + dy * DIRECTIONS[i][1];
    if (dot > best) {
      best = dot;
      angle = i;
    }
  }
  return angle;
};
const event = (s: BattleState, f: Fighter) =>
  s.events.push({
    tick: s.tick,
    type: `mastery:${f.masteryId}`,
    source: f.id,
    target: f.id,
    amount: 1,
  });
const theme = (f: Fighter): NonNullable<Projectile["kit"]> =>
  f.characterId === "char_03"
    ? "fruit"
    : f.characterId === "char_19"
      ? "envelope"
      : f.characterId === "char_33"
        ? "chicken"
        : "air";

/** Returns undefined when the base shot should be used. Child shots never have
 * normal-hit procs and do not themselves own split/chain recipes. */
export function formShot(
  s: BattleState,
  f: Fighter,
  angle: number,
  kind: NonNullable<Projectile["kit"]>,
  options: Partial<Projectile>,
  ops: FormOperations,
): boolean | undefined {
  const form = masteryForm(f);
  if (form?.kind !== "shot") return undefined;
  const fired = patternShot(
    s,
    f,
    angle,
    kind,
    form.pattern,
    form.power,
    form.count || 3,
    options,
    ops,
  );
  if (fired) event(s, f);
  return fired;
}
export function patternShot(
  s: BattleState,
  f: Fighter,
  angle: number,
  kind: NonNullable<Projectile["kit"]>,
  pattern: ShotPattern,
  power: number,
  count: number,
  options: Partial<Projectile>,
  ops: FormOperations,
) {
  const active = s.projectiles.filter(
    (p) => p.owner === f.id && p.life > 0 && p.mastery,
  );
  if (pattern === "return" && active.some((p) => p.returnAfter)) return false;
  if (pattern === "orbit" && active.some((p) => p.mastery?.orbit)) return false;
  const offsets =
    pattern === "fan"
      ? count === 2
        ? [-2, 2]
        : Array.from(
            { length: count },
            (_, i) => (i - Math.floor(count / 2)) * 2,
          )
      : pattern === "orbit"
        ? [0, 16]
        : [0];
  let fired = false;
  for (const [index, offset] of offsets.entries()) {
    const primary = pattern !== "fan" || index === Math.floor(count / 2);
    const extra: Partial<Projectile> = {
      ...options,
      normal:
        pattern === "mine" || pattern === "orbit"
          ? false
          : !!options.normal && primary,
      bounces: 0,
      power,
    };
    const meta: NonNullable<Projectile["mastery"]> = { style: "shard" };
    if (pattern === "return") {
      extra.returnAfter = 18;
      extra.life = 90;
      extra.pierce = 5;
      extra.heal = 0;
      meta.style = "disc";
    }
    if (pattern === "split") {
      meta.split = 3;
      meta.style = "shard";
    }
    if (pattern === "seeker") {
      const t = alignedRangedTarget(s, f, 300);
      extra.homing = true;
      extra.target = t && !isConstruct(t) ? t.id : undefined;
      meta.style = "seeker";
    }
    if (pattern === "ricochet") {
      extra.bounces = 2;
      meta.style = "shard";
    }
    if (pattern === "pierce") {
      extra.pierce = 2;
      extra.radius = 850;
      extra.push = 0;
      meta.style = "drill";
    }
    if (pattern === "wave") {
      extra.pierce = 1;
      extra.radius = 650;
      meta.style = "wave";
    }
    if (pattern === "mine") {
      const d = DIRECTIONS[(Math.round(angle + offset) + 64) % 32];
      extra.vx = options.normal ? div(d[0] * 1000, UNIT) : 0;
      extra.vy = options.normal ? div(d[1] * 1000, UNIT) : 0;
      if (options.normal) meta.anchorAt = 8;
      extra.life = 90;
      extra.armedAfter = 18;
      extra.splash = 55;
      extra.pierce = 0;
      meta.style = "mine";
    }
    if (pattern === "chain") {
      extra.pierce = 0;
      meta.chain = Math.max(0, count - 1);
      meta.style = "chain";
    }
    if (pattern === "orbit") {
      extra.life = 45;
      extra.pierce = 5;
      extra.radius = 750;
      meta.style = "orbit";
      meta.orbit = 50;
      meta.orbitAngle = angle + offset;
    }
    if (pattern === "harpoon") {
      extra.life = 25;
      extra.radius = 800;
      extra.push = 0;
      meta.style = "hook";
      meta.pull = 380;
    }
    extra.mastery = meta;
    const p = ops.shoot(s, f, angle + offset, kind, power, extra);
    if (p) {
      meta.baseVx = p.vx;
      meta.baseVy = p.vy;
      if (meta.orbit) {
        const d = DIRECTIONS[(meta.orbitAngle || 0) % 32];
        p.x = f.x + div(d[0] * meta.orbit * 100, UNIT);
        p.y = f.y + div(d[1] * meta.orbit * 100, UNIT);
      }
      fired = true;
    }
  }
  return fired;
}

export function shapeStrike(
  s: BattleState,
  f: Fighter,
  pattern: "sweep" | "whirl" | "cross" | "echo",
  x: number,
  y: number,
  angle: number,
  reach: number,
  power: number,
  ctx: KitCombatServices,
  secondary = false,
) {
  const d = DIRECTIONS[angle % 32],
    perpendicular = DIRECTIONS[(angle + 8) % 32];
  let hit = 0;
  for (const t of combatTargets(s).sort(
    (a, b) => dist({ x, y }, a) - dist({ x, y }, b),
  )) {
    if (
      targetTeam(s, t) === f.team ||
      dist({ x, y }, t) > (reach * 100 + t.radius) ** 2
    )
      continue;
    const dx = t.x - x,
      dy = t.y - y,
      dot = dx * d[0] + dy * d[1];
    const line = (v: readonly number[]) =>
      capsuleHit(
        x,
        y,
        x + div(v[0] * reach * 100, UNIT),
        y + div(v[1] * reach * 100, UNIT),
        t.x,
        t.y,
        t.radius + 650,
      );
    const matches =
      pattern === "whirl" ||
      (pattern === "sweep" &&
        dot > 0 &&
        dot * dot * 100 >= (dx * dx + dy * dy) * UNIT * UNIT * 30) ||
      (pattern === "cross" && (line(d) || line(perpendicular))) ||
      (pattern === "echo" && line(d));
    if (!matches) continue;
    if (isConstruct(t)) hitConstruct(s, f, t, div(f.stats.attack * power, 100));
    else if (secondary) ctx.damage(s, f, t, div(f.stats.attack * power, 100), false, true);
    else ctx.normal(s, f, t, power, 0);
    if (++hit >= 3) break;
  }
  if (hit)
    s.events.push({
      tick: s.tick,
      type: `shape:${pattern}`,
      source: f.id,
      target: f.id,
      amount: reach,
      x,
      y,
      angle,
    });
  return hit;
}
export function formMelee(
  s: BattleState,
  f: Fighter,
  ctx: KitCombatServices,
  ops: FormOperations,
) {
  const form = masteryForm(f);
  if (form?.kind !== "melee") return false;
  if (f.nextAttack > s.tick) return true;
  let fired = false;
  if (["sweep", "whirl", "cross", "echo"].includes(form.pattern)) {
    // Wait for a target in range instead of spending the attack into empty space.
    if (
      !combatTargets(s).some(
        (t) =>
          targetTeam(s, t) !== f.team &&
          dist(f, t) <= (form.reach * 100 + t.radius) ** 2,
      )
    )
      return true;
    if (
      !shapeStrike(
        s,
        f,
        form.pattern as "sweep",
        f.x,
        f.y,
        f.angle,
        form.reach,
        form.power,
        ctx,
      )
    )
      return true;
    if (form.pattern === "echo" && s.zones.length < 120) {
      const d = DIRECTIONS[f.angle];
      s.zones.push({
        owner: f.id,
        x: f.x,
        y: f.y,
        kit: "paint",
        mastery: "echo",
        radius: form.reach,
        start: s.tick + 12,
        until: s.tick + 13,
        power: div(form.power, 2),
        line: { dx: d[0], dy: d[1], length: form.reach, width: 13 },
      });
    }
    fired = true;
  } else {
    const target = alignedRangedTarget(s, f, form.reach);
    if (!target) return true;
    const pattern: ShotPattern =
      form.pattern === "throw"
        ? "return"
        : form.pattern === "thrust" || form.pattern === "charge"
          ? "pierce"
          : (form.pattern as ShotPattern);
    fired = patternShot(
      s,
      f,
      f.memory.shotAngle,
      theme(f),
      pattern,
      form.power,
      3,
      {
        normal: true,
        life: Math.max(8, Math.ceil((form.reach * 100) / 1000)),
        push: 0,
      },
      ops,
    );
    if (fired && form.pattern === "charge") {
      const d = DIRECTIONS[f.angle];
      ops.dash(s, f, { ...f, x: f.x + d[0] * 10, y: f.y + d[1] * 10 }, 8, 1000);
    }
    if (fired && form.pattern === "throw" && f.characterId === "char_15") {
      f.memory.masteryDisarmed = s.tick + 90;
      const p = s.projectiles[s.projectiles.length - 1];
      if (p?.mastery) p.mastery.disarm = true;
    }
  }
  if (fired) {
    f.nextAttack = s.tick + formAttackCooldown(f, s.tick);
    event(s, f);
  }
  return true;
}

export function formCounter(
  s: BattleState,
  f: Fighter,
  attacker: Fighter,
  ops: FormOperations,
) {
  const form = masteryForm(f);
  if (
    form?.kind !== "counter" ||
    f.hp <= 0 ||
    (f.memory.formCounterReady || 0) > s.tick
  )
    return;
  if (
    patternShot(
      s,
      f,
      aim(f, attacker),
      theme(f),
      form.pattern,
      form.power,
      3,
      { normal: false },
      ops,
    )
  ) {
    f.memory.formCounterReady = s.tick + form.cooldown;
    event(s, f);
  }
}

export function formSuper(
  s: BattleState,
  f: Fighter,
  target: Fighter,
  ctx: KitCombatServices,
  ops: FormOperations,
): boolean | undefined {
  const form = masteryForm(f);
  if (form?.kind !== "super") return undefined;
  let fired = false;
  const angle = aim(f, target),
    power = div(form.power * f.stats.superPower, 100);
  const shoot = (
    a: number,
    pattern: ShotPattern,
    extra: Partial<Projectile> = {},
  ) => {
    if (pattern === "orbit") {
      const p = ops.shoot(s, f, a, "air", power, {
        normal: false,
        kind: "super",
        life: 100,
        pierce: 0,
        mastery: {
          style: "orbit",
          orbit: 80,
          orbitAngle: (a + 64) % 32,
          releaseAt: 30,
        },
      });
      if (p) {
        const d = DIRECTIONS[(a + 64) % 32];
        p.x = f.x + div(d[0] * 8000, UNIT);
        p.y = f.y + div(d[1] * 8000, UNIT);
      }
      return !!p;
    }
    if (
      !patternShot(
        s,
        f,
        a,
        "air",
        pattern,
        power,
        form.count,
        { normal: false, kind: "super", superShot: false, life: 90, ...extra },
        ops,
      )
    )
      return false;
    return true;
  };
  if (form.pattern === "summon") {
    for (let i = 0; i < form.count; i++)
      fired =
        ops.summon(
          s,
          f,
          form.variant === "drone" ||
            form.variant === "hunter" ||
            form.variant === "ram" ||
            form.variant === "medic" ||
            form.variant === "bodyguard"
            ? "minion"
            : "turret",
          form.variant,
        ) || fired;
  } else if (form.pattern === "beams" || form.pattern === "crossBeams") {
    for (let i = 0; i < form.count; i++) {
      const offset =
        form.pattern === "beams" ? (i - (form.count - 1) / 2) * 3 : i * 8;
      const d = DIRECTIONS[(angle + Math.round(offset) + 64) % 32];
      ops.beam(
        s,
        f,
        { ...target, x: f.x + d[0] * 100, y: f.y + d[1] * 100 },
        form.power,
        18,
        260,
        ctx,
        f.characterId === "char_06",
      );
    }
    fired = true;
  } else if (["paint", "slipper", "vortex"].includes(form.pattern)) {
    for (let i = 0; i < form.count; i++) {
      const d = DIRECTIONS[(angle + div(i * 32, form.count)) % 32];
      const following = form.pattern === "vortex" && form.count === 1;
      const radius = form.pattern === "vortex" ? (following ? 120 : 95) : 70;
      const side = DIRECTIONS[(angle + 8) % 32];
      const x =
        form.pattern === "paint"
          ? target.x + div(side[0] * (i - 1) * 7000, UNIT)
          : target.x + div(d[0] * 7000, UNIT);
      const y =
        form.pattern === "paint"
          ? target.y + div(side[1] * (i - 1) * 7000, UNIT)
          : target.y + div(d[1] * 7000, UNIT);
      fired =
        ops.field(
          s,
          f,
          form.pattern as "paint",
          following ? f.x : x,
          following ? f.y : y,
          radius,
          90,
          form.power,
          { start: 15 + i * 6, super: true, follow: following },
        ) || fired;
    }
  } else if (form.pattern === "mines") {
    for (let i = 0; i < form.count; i++) {
      const before = s.projectiles.length;
      if (shoot(angle + div(i * 32, form.count), "mine")) {
        const p = s.projectiles[before],
          d = DIRECTIONS[div(i * 32, form.count)];
        const bounds = safeBounds(s);
        p.x = Math.max(
          bounds.left + 450,
          Math.min(bounds.right - 450, target.x + div(d[0] * 7000, UNIT)),
        );
        p.y = Math.max(
          bounds.top + 450,
          Math.min(bounds.bottom - 450, target.y + div(d[1] * 7000, UNIT)),
        );
        fired = true;
      }
    }
  } else if (form.pattern === "boomerangs") {
    // Three independent return lanes, rather than normal-shot single-disc gating.
    for (let i = 0; i < form.count; i++) {
      const p = ops.shoot(s, f, angle + (i - 1) * 4, "chicken", power, {
        normal: false,
        kind: "super",
        superShot: true,
        life: 100,
        returnAfter: 24,
        pierce: 5,
        heal: Math.min(20, div(f.baseStats.hp, 100)),
        mastery: { style: "disc" },
      });
      fired = !!p || fired;
    }
  } else if (form.pattern === "orbit" || form.pattern === "ricochet") {
    for (let i = 0; i < form.count; i++)
      fired = shoot(angle + div(i * 32, form.count), form.pattern) || fired;
  } else {
    fired = shoot(angle, form.pattern as ShotPattern);
    if (fired && form.pattern === "split")
      s.projectiles[s.projectiles.length - 1].mastery!.split = form.count;
  }
  if (fired) {
    f.superUntil = s.tick + 90;
    f.memory.formSuperUntil = f.superUntil;
    event(s, f);
  }
  return fired;
}

export function moveFormProjectile(s: BattleState, f: Fighter, p: Projectile) {
  const m = p.mastery;
  if (!m) return;
  if (m.anchorAt !== undefined && (p.age || 0) >= m.anchorAt) {
    p.vx = p.vy = 0;
  }
  if (m.orbit) {
    if (f.hp <= 0) {
      p.life = 0;
      return;
    }
    if (m.releaseAt !== undefined && (p.age || 0) >= m.releaseAt) {
      m.orbit = 0;
      if (!m.releaseSingleHit) p.hit.length = 0;
      p.pierce = 0;
      p.homing = true;
      p.target = s.fighters
        .filter((t) => t.hp > 0 && t.team !== f.team)
        .sort((a, b) => dist(p, a) - dist(p, b) || a.id - b.id)[0]?.id;
      const target = p.target !== undefined ? s.fighters[p.target] : undefined;
      if (target) {
        const [dx, dy] = normalize(target.x - p.x, target.y - p.y);
        p.vx = div(dx * 1000, UNIT);
        p.vy = div(dy * 1000, UNIT);
      }
    } else {
      m.orbitAngle = ((m.orbitAngle || 0) + 1) % 32;
      const d = DIRECTIONS[m.orbitAngle];
      const bounds = safeBounds(s);
      const nx = Math.max(
          bounds.left + 450,
          Math.min(bounds.right - 450, f.x + div(d[0] * m.orbit * 100, UNIT)),
        ),
        ny = Math.max(
          bounds.top + 450,
          Math.min(bounds.bottom - 450, f.y + div(d[1] * m.orbit * 100, UNIT)),
        );
      p.vx = nx - p.x;
      p.vy = ny - p.y;
    }
  } else if (m.style === "wave") {
    const baseX = m.baseVx || 0,
      baseY = m.baseVy || 0,
      phase = DIRECTIONS[((p.age || 0) * 2) % 32][0];
    const previous = DIRECTIONS[(((p.age || 0)-1)*2+32)%32][0];
    const [dx,dy]=normalize(baseX,baseY);
    p.vx = baseX + div(-dy*(phase-previous)*(m.waveWidth??10)*100,UNIT*UNIT);
    p.vy = baseY + div(dx*(phase-previous)*(m.waveWidth??10)*100,UNIT*UNIT);
  }
}

/** One-generation fragments, travelling chains and capped physical pull. */
export function impactFormProjectile(
  s: BattleState,
  f: Fighter,
  p: Projectile,
  target: Fighter | Construct | undefined,
  ops: FormOperations,
) {
  const m = p.mastery;
  if (!m) return;
  if (m.split && (!m.onlyOnHit || target)) {
    const count = m.split;
    m.split = 0;
    const angle = aim({ x: 0, y: 0 }, { x: p.vx, y: p.vy });
    for (let i = 0; i < count; i++) {
      const child = ops.shoot(
        s,
        f,
        Math.round(angle + (i - (count - 1) / 2) * 3),
        "shrapnel",
        m.splitPower ?? Math.max(1, div((p.power || 100) * 30, 100)),
        { normal: false, bonus: true, budget:p.budget, life: 24, kind: p.kind, mastery: { style: "shard" } },
      );
      if (child) {
        child.x = p.x;
        child.y = p.y;
        if (target)
          child.hit.push(isConstruct(target) ? -target.id - 1 : target.id);
      }
    }
    if (!m.keepParent) p.life = 0;
    s.events.push({
      tick: s.tick,
      type: "shape:split",
      source: f.id,
      target: f.id,
      amount: count,
      x: p.x,
      y: p.y,
    });
  }
  if (m.impactMine !== undefined) {
    const power=m.impactMine,count=m.impactMines||1;
    delete m.impactMine;
    const group=f.memory.upgradeGroup=(f.memory.upgradeGroup||0)+1;
    const budget=count>1?{id:group,cap:div(f.stats.attack*30*f.stats.superPower,10000)}:undefined;
    const available=f.masteryId==='char_09:resolve'?Math.max(0,3-s.projectiles.filter(q=>q.owner===f.id&&q.life>0&&q.mastery?.style==='mine').length):count;
    for(let i=0;i<Math.min(count,available);i++) {
      const d=DIRECTIONS[div(i*32,count)];
      const mine=ops.shoot(s,f,0,'air',power,{bonus:true,normal:false,budget,life:90,armedAfter:count>1?18:12,splash:55,vx:0,vy:0,mastery:{style:'mine'}});
      if(mine){mine.x=p.x+(count>1?div(d[0]*3500,UNIT):0);mine.y=p.y+(count>1?div(d[1]*3500,UNIT):0);}
    }
  }
  if (target && m.plantOnce) {
    m.plantOnce=false;
    ops.field(s,f,'slipper',p.x,p.y,55,75,18,{bonus:true});
  }
  if (target && m.piercePower!==undefined) {
    if(!m.firstHit){p.push=div((p.push||0)*(m.piercePush||0),100);m.firstHit=true;}
    p.power=m.piercePower;p.normal=false;p.bonus=true;
  }
  if (target && m.chain && m.chain > 0) {
    const next = s.fighters
      .filter(
        (t) =>
          t.hp > 0 &&
          t.team !== f.team &&
          t !== target &&
          !p.hit.includes(t.id) &&
          dist(p, t) <= 14000 ** 2,
      )
      .sort((a, b) => dist(p, a) - dist(p, b) || a.id - b.id)[0];
    m.chain--;
    if (next) {
      p.homing = true;
      p.target = next.id;
      p.pierce = Math.max(1, p.pierce);
    }
  }
  if (target && !isConstruct(target) && m.pull) {
    const [dx, dy] = normalize(f.x - target.x, f.y - target.y);
    target.memory.impulseX = Math.max(
      -650,
      Math.min(650, (target.memory.impulseX || 0) + div(dx * m.pull, UNIT)),
    );
    target.memory.impulseY = Math.max(
      -650,
      Math.min(650, (target.memory.impulseY || 0) + div(dy * m.pull, UNIT)),
    );
  }
}
export function tickFormEchoes(s: BattleState, ctx: KitCombatServices) {
  for (const z of s.zones)
    if (z.mastery === "echo" && z.start === s.tick && z.line) {
      const f = s.fighters[z.owner];
      if (f?.hp > 0)
        shapeStrike(
          s,
          f,
          "echo",
          z.x,
          z.y,
          aim({ x: 0, y: 0 }, { x: z.line.dx, y: z.line.dy }),
          z.line.length,
          z.power || 0,
          ctx,
          true,
        );
    }
}
