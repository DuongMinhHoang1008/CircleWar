import type {
  BattleState,
  Construct,
  DamageType,
} from "../../../../packages/battle-engine/src/types";

export const DAMAGE_NUMBER_LIFE = 27;
export const DAMAGE_NUMBER_LIMIT = 64;
export const SUPPORT_PALETTE = {
  heal: { color: 0x62f2ba, label: "HP" },
  shield: { color: 0x81cfff, label: "Khiên" },
  temporaryHp: { color: 0xc1a0ff, label: "Máu ảo" },
} as const;
export const isRecoveryNumber = (type: DamageNumber["type"]) =>
  type === "heal" || type === "shield" || type === "temporaryHp";
export const DAMAGE_PALETTE: Record<
  DamageType,
  { color: number; label: string }
> = {
  direct: { color: 0xffefbc, label: "Đòn đánh" },
  burn: { color: 0xffa04d, label: "Burn" },
  poison: { color: 0x89ed83, label: "Poison" },
  bleeding: { color: 0xff718c, label: "Bleeding" },
  radiation: { color: 0xe3ee64, label: "Phóng xạ" },
};
export const COMBAT_PALETTE = { ...DAMAGE_PALETTE, ...SUPPORT_PALETTE };
export const COMBAT_NUMBER_TYPES = Object.keys(COMBAT_PALETTE);
export interface DamageNumber {
  key: string;
  tick: number;
  amount: number;
  x: number;
  y: number;
  radius: number;
  lane: number;
  type: DamageType | keyof typeof SUPPORT_PALETTE;
}

/** HP loss only: kill/clash and construct-hit amounts carry different meanings. */
export function collectDamageNumbers(
  events: BattleState["events"],
  fighters: BattleState["fighters"],
  afterTick: number,
  tick: number,
): DamageNumber[] {
  return collectNumbers(events, fighters, afterTick, tick, false);
}
export function collectSupportNumbers(
  events: BattleState["events"],
  fighters: BattleState["fighters"],
  afterTick: number,
  tick: number,
): DamageNumber[] {
  return collectNumbers(events, fighters, afterTick, tick, true);
}
function collectNumbers(
  events: BattleState["events"],
  fighters: BattleState["fighters"],
  afterTick: number,
  tick: number,
  recovery: boolean,
): DamageNumber[] {
  const groups = new Map<string, DamageNumber>();
  for (const event of events) {
    if (
      event.tick <= afterTick ||
      event.tick > tick ||
      tick - event.tick >= DAMAGE_NUMBER_LIFE ||
      event.amount <= 0 ||
      (recovery
        ? event.type !== "heal" && event.type !== "shield"
        : event.type !== "hit")
    )
      continue;
    const target = fighters.find((f) => f.id === event.target);
    if (!target) continue;
    const type =
      event.type === "heal"
        ? "heal"
        : event.type === "shield"
          ? (event.shieldKind ?? "shield")
          : (event.damageType ?? "direct");
    const bucket = Math.floor(event.tick / (recovery ? 15 : type === "direct" ? 3 : 9));
    const key = `${event.target}:${bucket}:${type}`;
    const existing = groups.get(key);
    if (existing) existing.amount += event.amount;
    else
      groups.set(key, {
        key,
        tick: event.tick,
        amount: event.amount,
        x: event.x ?? target.x,
        y: event.y ?? target.y,
        radius: target.radius,
        lane: ((bucket + target.id) % 3) - 1,
        type,
      });
  }
  return [...groups.values()];
}

export function damageNumberMotion(age: number, lane: number) {
  const t = Math.max(0, Math.min(1, age / DAMAGE_NUMBER_LIFE));
  return {
    alpha: age < 0 || t >= 1 ? 0 : Math.min(1, (1 - t) / 0.4),
    x: lane * (7 + 12 * t),
    rise: 4 + 52 * t - 6 * t * t,
    scale: 1 + 0.32 * Math.max(0, 1 - t / 0.18) ** 2,
  };
}

/** Construct events store an id, so use observed HP loss instead of that amount. */
export function collectConstructDamageNumbers(
  events: BattleState["events"],
  constructs: Construct[],
  previous: ReadonlyMap<number, Construct>,
  afterTick: number,
  tick: number,
): DamageNumber[] {
  const hits = new Map(
    events
      .filter(
        (e) =>
          e.type === "kit:construct-hit" &&
          e.tick > afterTick &&
          e.tick <= tick &&
          tick - e.tick < DAMAGE_NUMBER_LIFE,
      )
      .map((e) => [e.amount, e]),
  );
  const popups: DamageNumber[] = [];
  for (const [id, event] of hits) {
    const current = constructs.find((c) => c.id === id),
      before = previous.get(id);
    const body = current ?? before;
    if (!body || (!current && body.until <= tick)) continue;
    const amount = (before?.hp ?? body.maxHp) - (current?.hp ?? 0);
    if (amount <= 0) continue;
    const bucket = Math.floor(event.tick / 3);
    popups.push({
      key: `construct:${id}:${bucket}`,
      tick: event.tick,
      amount,
      x: event.x ?? body.x,
      y: event.y ?? body.y,
      radius: body.radius,
      lane: ((id + bucket) % 3) - 1,
      type: "direct",
    });
  }
  return popups;
}
