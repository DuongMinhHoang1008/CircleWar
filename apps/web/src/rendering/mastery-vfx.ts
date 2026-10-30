import {
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Texture,
} from "pixi.js";
import type {
  BattleState,
  Fighter,
  Projectile,
} from "../../../../packages/battle-engine/src/types";
import { masteryInfo } from "../../../../packages/shared/src/mastery";
import { masteryVfxDefinition } from "./mastery-vfx-themes";
import manifest from "./mastery-vfx.json";

export interface MasteryVfxAtlas {
  casts: Map<string, Texture[]>;
  projectiles: Map<string, Texture>;
}
const pageCache = new Map<number, Promise<Texture>>();
let projectileCache: Promise<Texture> | undefined;
const frameCache = new Map<string, Texture[]>(),
  objectCache = new Map<string, Texture>();
/** Atlas sources are shared across battles; no per-frame textures or SVG decoding. */
export async function loadMasteryVfx(
  ids: readonly string[],
): Promise<MasteryVfxAtlas> {
  const rows = manifest.rows as Record<
    string,
    { page: number; row: number; projectile: number[] }
  >;
  const valid = [...new Set(ids)].filter((id) => rows[id]);
  if (!valid.length) return { casts: new Map(), projectiles: new Map() };
  await Promise.all(
    [...new Set(valid.map((id) => rows[id].page))].map(async (page) => {
      if (!pageCache.has(page))
        pageCache.set(
          page,
          Assets.load<Texture>(
            import.meta.env.BASE_URL + manifest.pages[page] + '?v=38.2',
          ).catch((e) => {
            pageCache.delete(page);
            throw e;
          }),
        );
      await pageCache.get(page);
    }),
  );
  projectileCache ??= Assets.load<Texture>(
    import.meta.env.BASE_URL + manifest.projectiles + '?v=38.2',
  ).catch((e) => {
    projectileCache = undefined;
    throw e;
  });
  const objects = await projectileCache;
  for (const id of valid) {
    const row = rows[id],
      atlas = await pageCache.get(row.page)!;
    if (!frameCache.has(id))
      frameCache.set(
        id,
        Array.from(
          { length: manifest.frames },
          (_, i) =>
            new Texture({
              source: atlas.source,
              frame: new Rectangle(
                i * manifest.size,
                row.row * manifest.size,
                manifest.size,
                manifest.size,
              ),
            }),
        ),
      );
    if (!objectCache.has(id))
      objectCache.set(
        id,
        new Texture({
          source: objects.source,
          frame: new Rectangle(
            row.projectile[0] * manifest.size,
            row.projectile[1] * manifest.size,
            manifest.size,
            manifest.size,
          ),
        }),
      );
  }
  return {
    casts: new Map(valid.map((id) => [id, frameCache.get(id)!])),
    projectiles: new Map(valid.map((id) => [id, objectCache.get(id)!])),
  };
}
export const masteryTint = (id?: string) =>
  Number.parseInt(
    (masteryVfxDefinition(id)?.theme.color || "#b8edff").slice(1),
    16,
  );
const accentTint = (id?: string) =>
  Number.parseInt(
    (masteryVfxDefinition(id)?.theme.accent || "#fff1ca").slice(1),
    16,
  );
export function hasMasteryProjectileSkin(
  f: Fighter | undefined,
  p: Projectile,
) {
  const m = masteryInfo(f?.masteryId);
  return (
    !!m &&
    m.characterId === f?.characterId &&
    (!!p.mastery || (!m.form && !!p.kit))
  );
}
export type MasteryCue = {
  id: string;
  source: number;
  target: number;
  tick: number;
  x: number;
  y: number;
  phase: "cast" | "impact" | "support" | "charge" | "summon" | "return";
  angle: number;
};
/** Presentation-only interpretation of existing authoritative events. */
export function collectMasteryCues(
  state: Pick<BattleState, "events" | "fighters">,
  afterTick: number,
): MasteryCue[] {
  const cues: MasteryCue[] = [];
  const seen = new Set<string>();
  for (const e of state.events) {
    if (e.tick <= afterTick) continue;
    const source = state.fighters[e.source],
      target = state.fighters[e.target];
    const equipped = masteryInfo(source?.masteryId);
    const id = e.type.startsWith("mastery:") ? e.type.slice(8) : equipped?.id;
    let phase: MasteryCue["phase"] | undefined;
    if (e.type.startsWith("mastery:")) phase = "cast";
    else if (equipped && equipped.characterId === source?.characterId) {
      if (
        e.type === "super" &&
        (!equipped.form || equipped.form.kind === "super")
      )
        phase = "cast";
      else if (
        e.type === "hit" &&
        e.amount > 0 &&
        source.team !== target?.team &&
        (!equipped.form ||
          equipped.form.kind !== "super" ||
          source.superUntil >= e.tick - 30)
      )
        phase = "impact";
      else if ((e.type === "heal" || e.type === "shield") && e.amount > 0)
        phase = "support";
      else if (
        e.type === "status:introvert" ||
        (e.type === "status:paralyzed" && equipped.id === "flagParalyze")
      )
        phase = "charge";
      else if (e.type === "kit:boomerang-return") phase = "return";
      else if (e.type.startsWith("kit:summon:")) phase = "summon";
    }
    // Nén Bão receives a charge flash on actual incoming HP damage during introversion.
    if (
      e.type === "hit" &&
      e.amount > 0 &&
      target?.masteryId === "tigerBurst" &&
      target.statuses.some((s) => s.kind === "introvert" && s.until > e.tick)
    ) {
      cues.push({
        id: "tigerBurst",
        source: target.id,
        target: target.id,
        tick: e.tick,
        x: target.x,
        y: target.y,
        phase: "charge",
        angle: 0,
      });
    }
    if (
      !id ||
      !phase ||
      !source ||
      id !== equipped?.id ||
      masteryInfo(id)?.characterId !== source.characterId
    )
      continue;
    const point = phase === "impact" || phase === "support" ? target : source;
    if (!point) continue;
    const key = `${id}:${e.tick}:${phase}:${point.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cues.push({
      id,
      source: source.id,
      target: point.id,
      tick: e.tick,
      x: e.x ?? point.x,
      y: e.y ?? point.y,
      phase,
      angle:
        phase === "cast"
          ? ((e.angle ?? source.angle) * Math.PI) / 16
          : Math.atan2(point.y - source.y, point.x - source.x),
    });
  }
  return cues;
}
interface Flash {
  cue: MasteryCue;
  until: number;
  size: number;
}
/** A bounded, reusable render layer. It never mutates battle/replay state. */
export class MasteryVfxLayer {
  readonly ground = new Graphics({ label: "mastery-ground-vfx" });
  readonly trails = new Graphics({ label: "mastery-projectile-trails" });
  readonly lights = new Graphics({ label: "mastery-support-links" });
  readonly sprites: Sprite[] = [];
  readonly summonSprites: Sprite[] = [];
  private flashes: Flash[] = [];
  private lastTick = -1;
  private casts = new Map<string, number>();
  private histories = new Map<number, { x: number; y: number }[]>();
  private summons = new Set<number>();
  private attuned = new Set<number>();
  constructor(
    ground: Container,
    combat: Container,
    readonly atlas: MasteryVfxAtlas,
    readonly renderSummonBodies = true,
  ) {
    ground.addChild(this.ground);
    combat.addChild(this.trails, this.lights);
    for (let i = 0; i < 40; i++) {
      const sprite = new Sprite(Texture.EMPTY);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      sprite.label = "mastery-cast-vfx";
      ground.addChild(sprite);
      this.sprites.push(sprite);
    }
    for(let i=0;i<64;i++){
      const sprite=new Sprite(Texture.EMPTY);sprite.anchor.set(.5);sprite.visible=false;
      sprite.label='mastery-summon-body';combat.addChild(sprite);this.summonSprites.push(sprite);
    }
  }
  private emit(cue: MasteryCue, low: boolean) {
    if (!this.atlas.casts.has(cue.id)) return;
    const recipient =
      cue.phase === "summon"
        ? `${cue.x}:${cue.y}`
        : cue.phase === "impact" || cue.phase === "support"
          ? cue.target
          : "";
    const key = `${cue.source}:${cue.phase}:${recipient}`,
      gap =
        cue.phase === "impact"
          ? low
            ? 10
            : 4
          : cue.phase === "cast"
            ? low
              ? 9
              : 4
            : 5;
    if (cue.tick - (this.casts.get(key) ?? -1000) < gap) return;
    this.casts.set(key, cue.tick);
    const branch = masteryVfxDefinition(cue.id)!.branch;
    const life = low
      ? 10
      : cue.phase === "impact"
        ? 13
        : cue.phase === "summon"
          ? 28
          : 22;
    const size =
      cue.phase === "impact"
        ? 34
        : cue.phase === "support"
          ? 48
          : cue.phase === "charge"
            ? 44
            : branch === 2
              ? 100
              : 72;
    this.flashes.push({ cue, until: cue.tick + life, size });
    const limit = low ? 12 : 40;
    if (this.flashes.length > limit)
      this.flashes.splice(0, this.flashes.length - limit);
  }
  draw(
    state: BattleState,
    tick: number,
    sx: number,
    sy: number,
    enabled: boolean,
    low: boolean,
  ) {
    this.ground.clear();
    this.trails.clear();
    this.lights.clear();
    this.summonSprites.forEach(sprite=>sprite.visible=false);
    if (state.tick < this.lastTick) {
      this.flashes = [];
      this.histories.clear();
      this.casts.clear();
      this.attuned.clear();
      this.summons.clear();
      this.lastTick = -1;
    }
    this.ground.visible = this.trails.visible = this.lights.visible = enabled;
    if (!enabled) {
      this.flashes = [];
      this.histories.clear();
      this.lastTick = state.tick;
      this.sprites.forEach((s) => (s.visible = false));
      return;
    }
    if (state.tick !== this.lastTick) {
      for (const cue of collectMasteryCues(state, this.lastTick))
        this.emit(cue, low);
      for (const f of state.fighters)
        if (f.hp > 0 && f.masteryId && !this.attuned.has(f.id)) {
          this.attuned.add(f.id);
          this.emit(
            {
              id: f.masteryId,
              source: f.id,
              target: f.id,
              tick: state.tick,
              x: f.x,
              y: f.y,
              phase: "charge",
              angle: 0,
            },
            low,
          );
        }
      const alive = new Set<number>();
      for (const p of state.projectiles) {
        if (!hasMasteryProjectileSkin(state.fighters[p.owner], p)) continue;
        alive.add(p.id);
        const history = this.histories.get(p.id) || [];
        history.push({ x: p.x, y: p.y });
        if (history.length > 7) history.shift();
        this.histories.set(p.id, history);
      }
      for (const id of this.histories.keys())
        if (!alive.has(id)) this.histories.delete(id);
      const summoned = new Set<number>();
      for (const c of state.constructs)
        if (c.hp > 0) {
          summoned.add(c.id);
          const f = state.fighters[c.owner];
          if (f?.masteryId && !this.summons.has(c.id))
            this.emit(
              {
                id: f.masteryId,
                source: f.id,
                target: f.id,
                tick: state.tick,
                x: c.x,
                y: c.y,
                phase: "summon",
                angle: 0,
              },
              low,
            );
        }
      this.summons = summoned;
      this.lastTick = state.tick;
    }
    this.flashes = this.flashes.filter(
      (f) => f.until > tick && f.cue.tick <= tick,
    );
    if (low && this.flashes.length > 12)
      this.flashes.splice(0, this.flashes.length - 12);
    this.sprites.forEach((sprite, i) => {
      const f = this.flashes[i];
      sprite.visible = !!f;
      if (!f) return;
      const progress = (tick - f.cue.tick) / (f.until - f.cue.tick),
        frames = this.atlas.casts.get(f.cue.id)!;
      sprite.texture =
        frames[
          Math.min(frames.length - 1, Math.floor(progress * frames.length))
        ];
      sprite.position.set(f.cue.x * sx, f.cue.y * sy);
      sprite.rotation =
        f.cue.phase === "impact" || f.cue.phase === "cast" ? f.cue.angle : 0;
      const scale = 0.65 + Math.sin(progress * Math.PI * 0.8) * 0.45;
      sprite.width = sprite.height = f.size * scale;
      sprite.alpha = (1 - progress) * 0.85;
      sprite.tint = 0xffffff;
      if (f.cue.phase === "support" && f.cue.source !== f.cue.target && !low) {
        const source = state.fighters[f.cue.source],
          target = state.fighters[f.cue.target];
        if (source && target) {
          const origin =
            state.constructs.find(
              (c) =>
                c.owner === source.id &&
                c.hp > 0 &&
                (c.variant === "medic" || c.variant === "supply"),
            ) || source;
          const x =
              origin.x + (target.x - origin.x) * Math.min(1, progress * 2),
            y = origin.y + (target.y - origin.y) * Math.min(1, progress * 2);
          this.lights
            .moveTo(origin.x * sx, origin.y * sy)
            .lineTo(target.x * sx, target.y * sy)
            .stroke({
              color: masteryTint(f.cue.id),
              width: 1.2,
              alpha: (1 - progress) * 0.3,
            });
          this.lights
            .circle(x * sx, y * sy, 3)
            .fill({ color: accentTint(f.cue.id), alpha: 1 - progress });
        }
      }
    });
    let summonIndex=0;
    for(const c of state.constructs){
      if(!this.renderSummonBodies)break;
      const owner=state.fighters[c.owner],id=owner?.masteryId;
      if(c.hp<=0||!id||!c.variant)continue;
      const texture=this.atlas.projectiles.get(id);if(!texture)continue;
      const sprite=this.summonSprites[summonIndex++];if(!sprite)break;
      sprite.texture=texture;sprite.visible=true;sprite.position.set(c.x*sx,c.y*sy);
      sprite.width=sprite.height=Math.max(24,Math.min(56,c.radius*sx*2.8));
      sprite.rotation=c.variant==='ram'?tick*.12:0;
      sprite.alpha=.95;
    }
    if (low) return;
    for(const z of state.zones){
      const id=state.fighters[z.owner]?.masteryId;
      if(!id||!z.bonus||z.until<=tick)continue;
      const x=z.x*sx,y=z.y*sy,r=(z.radius||45)*100*sx;
      const warning=(z.start||0)>tick,color=masteryTint(id);
      this.ground.circle(x,y,r).fill({color,alpha:warning?.06:.10});
      this.ground.circle(x,y,r).stroke({color,width:warning?1:2,alpha:warning?.35:.65});
      if(warning){const progress=Math.max(0,1-((z.start||0)-tick)/15);this.ground.arc(x,y,r,-Math.PI/2,-Math.PI/2+Math.PI*2*progress).stroke({color:accentTint(id),width:2,alpha:.8});}
    }
    for (const e of state.events) {
      const age = tick - e.tick,
        source = state.fighters[e.source];
      if (
        e.type !== "kit:beam" ||
        e.x === undefined ||
        e.y === undefined ||
        age < 0 ||
        age > 12 ||
        !source?.masteryId ||
        !this.atlas.casts.has(source.masteryId)
      )
        continue;
      const d = masteryVfxDefinition(source.masteryId)!;
      const alpha = (1 - age / 13) * 0.8,
        color = masteryTint(source.masteryId),
        accent = accentTint(source.masteryId);
      for (let i = 0; i < 3; i++) {
        const t = (age / 10 + i / 3) % 1,
          x = (source.x + (e.x - source.x) * t) * sx,
          y = (source.y + (e.y - source.y) * t) * sy;
        if (d.theme.motif === "pixel")
          this.lights
            .rect(x - 2, y - 2, 4, 4)
            .fill({ color: i % 2 ? accent : color, alpha });
        else
          this.lights
            .circle(x, y, 2.5)
            .fill({ color: i % 2 ? accent : color, alpha });
      }
    }
    for (const p of state.projectiles) {
      const owner = state.fighters[p.owner];
      if (!hasMasteryProjectileSkin(owner, p)) continue;
      const d = masteryVfxDefinition(owner.masteryId)!;
      const history = this.histories.get(p.id) || [];
      const color = masteryTint(owner.masteryId),
        accent = accentTint(owner.masteryId);
      for (let i = 1; i < history.length; i++) {
        const a = history[i - 1],
          b = history[i],
          fade = i / history.length;
        if (d.theme.motif === "pixel")
          this.trails
            .rect(a.x * sx - 1, a.y * sy - 1, 2.5, 2.5)
            .fill({ color: i % 2 ? accent : color, alpha: fade * 0.65 });
        else
          this.trails
            .moveTo(a.x * sx, a.y * sy)
            .lineTo(b.x * sx, b.y * sy)
            .stroke({
              color: i % 2 ? color : accent,
              width: 0.5 + fade * 2.1,
              alpha: fade * 0.55,
            });
        if (
          i % 2 === 0 &&
          ["grapes", "rose", "paint", "citrus", "balloon"].includes(
            d.theme.motif,
          )
        )
          this.trails
            .ellipse(a.x * sx, a.y * sy, 2, 3)
            .fill({ color: accent, alpha: fade * 0.5 });
      }
      if (p.returning)
        this.trails
          .circle(p.x * sx, p.y * sy, 8 + Math.sin(tick * 0.4) * 2)
          .stroke({ color: accent, width: 1.5, alpha: 0.5 });
      if (p.mastery?.style === "mine") {
        const r = 7 + Math.sin(tick * 0.18 + p.id) * 1.5;
        for (let j = 0; j < 4; j++) {
          const a = (j * Math.PI) / 2;
          this.ground
            .moveTo(
              p.x * sx + Math.cos(a) * (r + 3),
              p.y * sy + Math.sin(a) * (r + 3),
            )
            .lineTo(
              p.x * sx + Math.cos(a) * (r + 6),
              p.y * sy + Math.sin(a) * (r + 6),
            )
            .stroke({ color, width: 1.5, alpha: 0.8 });
        }
      }
    }
    for (const c of state.constructs) {
      const f = state.fighters[c.owner];
      if (c.hp <= 0 || !f?.masteryId || !this.atlas.casts.has(f.masteryId))
        continue;
      const x = c.x * sx,
        y = c.y * sy,
        r = c.radius * sx + 6,
        color = masteryTint(f.masteryId),
        accent = accentTint(f.masteryId);
      const theta = tick * 0.045 + c.id;
      for (let i = 0; i < 3; i++) {
        const a = theta + (i * Math.PI * 2) / 3;
        this.ground
          .arc(x, y, r, a, a + 0.8)
          .stroke({ color: i % 2 ? accent : color, width: 1.8, alpha: 0.45 });
      }
      if (c.variant === "medic" || c.variant === "supply") {
        const up = (tick + c.id * 7) % 35;
        this.lights
          .moveTo(x - 3, y - r - up * 0.35)
          .lineTo(x + 3, y - r - up * 0.35)
          .moveTo(x, y - r - up * 0.35 - 3)
          .lineTo(x, y - r - up * 0.35 + 3)
          .stroke({ color: accent, width: 1.5, alpha: (1 - up / 35) * 0.7 });
      }
    }
  }
  get activeCount() {
    return this.flashes.length;
  }
}
