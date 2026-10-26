import type { Loadout, Stats } from "../../shared/src/balance";
import type { TeamChoice } from "../../shared/src/catalog";
import type { CombatStatus } from "./statuses";
export const ENGINE_VERSION = "chaos-integer-v26";
export const TICK_RATE = 30;
export interface BattleConfig {
  campaign?: { stage: number; enemyTeamId: string };
  teams: { id: string; name?: string; loadouts: Loadout[]; choice?: TeamChoice }[];
  shrinkSeconds: number;
  width: number;
  height: number;
}
export interface Fighter {
  boss?: boolean;
  id: number;
  team: string;
  classId: Loadout["classId"];
  stats: Stats;
  baseStats: Stats;
  characterId?: Loadout["characterId"];
  slot: number;
  equipment: string[];
  equipmentLevels?: Record<string, number>;
  level: number;
  skillReady: number;
  nextAttack: number;
  memory: Record<string, number>;
  buffs: { kind: string; value: number; until: number; source: number }[];
  statuses: CombatStatus[];
  shields: { amount: number; until: number; source: number }[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  shield: number;
  energy: number;
  angle: number;
  facing: number;
  superUntil: number;
  slowUntil: number;
  burnUntil: number;
  burnSource: number;
  hits: number;
  dealt: number;
  taken: number;
  kills: number;
  supers: number;
  deadAt: number;
  cooldowns: Record<string, number>;
}
export interface Projectile {
  id: number;
  owner: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  pierce: number;
  hit: number[];
  power?: number;
  normal?: boolean;
  push?: number;
  secondary?: number;
  kind?: "skill" | "super";
  slow?: number;
  paralyze?: number;
  radiation?: number;
  splash?: number;
  splashPower?: number;
  kit?: "fruit" | "basket" | "bullet" | "ribbon" | "deadline" | "buffFruit" | "ink" | "envelope" | "rose" | "air" | "randomInk" | "wacom" | "balloon" | "rocket" | "slipper" | "chicken" | "shrapnel";
  bounces?: number;
  age?: number;
  radius?: number;
  friendlyScale?: number;
  selfScale?: number;
  homing?: boolean;
  target?: number;
  returnAfter?: number;
  returning?: boolean;
  heal?: number;
  armedAfter?: number;
  detonated?: boolean;
  superShot?: boolean;
  onHitReady?: Record<number, number>;
}
export interface Zone {
  owner: number;
  x: number;
  y: number;
  until: number;
  radius?: number;
  start?: number;
  every?: number;
  power?: number;
  slow?: number;
  follow?: boolean;
  heal?: number;
  attack?: number;
  auraAttack?: number;
  auraHaste?: number;
  territory?: boolean;
  push?: number;
  trap?: boolean;
  group?: number;
  super?: boolean;
  line?: { dx: number; dy: number; length: number; width: number };
  kit?: "deadline" | "flag" | "fruit" | "rose" | "soup" | "paint" | "vortex" | "slipper";
  allOthers?: boolean;
}
export interface Construct {
  id: number; owner: number; kind: "minion" | "giant" | "turret";
  x: number; y: number; vx: number; vy: number; radius: number;
  hp: number; maxHp: number; damage: number; until: number; nextAttack: number;
}
export interface BattleState {
  version: string;
  config: BattleConfig;
  seed: number;
  rng: number;
  tick: number;
  fighters: Fighter[];
  projectiles: Projectile[];
  zones: Zone[];
  nextProjectile: number;
  constructs: Construct[];
  nextConstruct: number;
  finished: boolean;
  eliminated: Record<string, number>;
  events: {
    tick: number;
    type: string;
    source: number;
    target: number;
    amount: number;
    x?: number;
    y?: number;
  }[];
  pending: {
    owner: number;
    tick: number;
    kind: string;
    x: number;
    y: number;
    target?: number;
    angle?: number;
  }[];
  bonds: Record<string, { uses: number; ready: number }>;
  groups: Record<string, { uses: number; ready: number }>;
}
/** Compact authoritative render sample. Combat-only state stays on the server. */
export interface ReplayFrame {
  tick: number;
  /** x, y, hp, shield, energy, angle, skillReady, superUntil, slowUntil,
   * burnUntil, deadAt, weaponReach, maxHp, swordHits, supers, facing */
  fighters: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ][];
  buffs: BattleState["fighters"][number]["buffs"][];
  statuses?: CombatStatus[][];
  /** attack, speed, rotation, charge, cooldown, effective spin percentage */
  combatStats?: [number, number, number, number, number, number][];
  constructs?: Construct[];
  kitProjectiles?: { id: number; kit: Projectile["kit"]; radius: number; returning?: boolean }[];
  /** id, owner, x, y; optional visual metadata keeps older frames readable. */
  projectiles: [
    number, number, number, number, number?, number?, boolean?, ("skill" | "super")?,
  ][];
  zones: Zone[];
  pending: BattleState["pending"];
  events: BattleState["events"];
}
export interface TeamResult {
  id: string;
  rank: number;
  survivors: number;
  hp: number;
  damage: number;
  taken: number;
  kills: number;
  supers: number;
  eliminatedAt: number;
}
