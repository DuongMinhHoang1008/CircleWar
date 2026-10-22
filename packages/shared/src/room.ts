import {
  ITEMS,
  CLASSES,
  type Loadout,
  BENCH_CAPACITY,
  ITEM_BAG_CAPACITY,
  SHOP_SIZE,
  MAX_FIELD_UNITS,
  characterPrice,
  capacityUpgradePrice,
} from "./balance";
import { DEFAULT_SETTINGS, type Action, type Settings } from "./protocol";
import { campaignEncounter, campaignPackReward, campaignBossPackReward } from "./campaign";
import { packPool, packTier } from "./packs";
import { DEFAULT_ARENA_SIZE, DEFAULT_SHRINK_SECONDS } from "./arena";
import { addCardXp, dailyQuestDay, DUPLICATE_CARD_XP, xpForNextLevel, PACK_CAPACITY } from "./progression";
import {
  ROSTER,
  character,
  validChoice,
  CATALOG_ITEMS,
  type CharacterId,
  type TeamChoice,
} from "./catalog";
import {
  createBattle,
  stepBattle,
  captureReplayFrame,
  calculateBattleResult,
  calculateStateHash,
  hash,
  random,
  type BattleState,
  type BattleConfig,
  type TeamResult,
  type ReplayFrame,
  ENGINE_VERSION,
} from "../../battle-engine/src/index";
export type Phase =
  | "LOBBY"
  | "PREPARATION"
  | "LOCKING"
  | "SIMULATING"
  | "REPLAY_READY"
  | "SETTLEMENT"
  | "FINISHED";
export interface Player {
  id: string;
  name: string;
  spectator: boolean;
  hp: number;
  gold: number;
  ready: boolean;
  /** Characters currently deployed to battle. */
  loadouts: Loadout[];
  /** Purchased characters waiting on the limited bench. */
  bench: Loadout[];
  /** Maximum number of characters that may fight this round (1–3). */
  unitLimit: number;
  inventory: string[];
  shop: (string | null)[];
  rewards: string[];
  freeRerolls: number;
  reliefUsed: boolean;
  reliefAvailable: boolean;
  joined: number;
  totalDamage: number;
  choice?: TeamChoice;
  cards: { characterId: CharacterId; level: number; xp: number }[];
  itemCards?: { itemId: string; level: number; xp: number }[];
  packs: number;
  bossPacks?: number;
  packsSinceRare?: number;
  packsSinceHighRarity?: number;
  lastPackAt: number;
  missions: { draw: number; win: number; campaign: number };
  claimedMissions: string[];
  missionDay: string;
  campaignStage: number;
}
export interface Replay {
  format: 1;
  version: string;
  game: number;
  config: BattleConfig;
  configHash: string;
  seed: number;
  round: number;
  start: number;
  totalTicks: number;
  chunks: ReplayChunkInfo[];
  finalHash: string;
  checkpoints: { tick: number; hash: string }[];
  result: TeamResult[];
  final: BattleState;
}
export interface ReplayChunkInfo {
  index: number;
  fromTick: number;
  toTick: number;
  count: number;
  hash: string;
  bytes: number;
}
export type RecordedReplayInfo = Pick<
  Replay,
  | "format"
  | "version"
  | "game"
  | "config"
  | "configHash"
  | "round"
  | "start"
  | "totalTicks"
  | "chunks"
  | "finalHash"
>;
export interface LegacyReplayInfo {
  format: 0;
  version: string;
  config: BattleConfig;
  configHash: string;
  seed: number;
  round: number;
  start: number;
  totalTicks: number;
  checkpoints: { tick: number; hash: string }[];
  finalHash: string;
}
export type ReplayInfo = RecordedReplayInfo | LegacyReplayInfo;
export function viewReplay(replay: Replay | null): ReplayInfo | null {
  if (!replay) return null;
  const legacy = replay as Replay & {
    format?: number;
    chunks?: ReplayChunkInfo[];
  };
  if (legacy.format !== 1 || !Array.isArray(legacy.chunks))
    return {
      format: 0,
      version: replay.version,
      config: replay.config,
      configHash: replay.configHash,
      seed: replay.seed,
      round: replay.round,
      start: replay.start,
      totalTicks: replay.final.tick,
      checkpoints: replay.checkpoints || [],
      finalHash: replay.finalHash,
    };
  const {
    format,
    version,
    game,
    config,
    configHash,
    round,
    start,
    totalTicks,
    chunks,
    finalHash,
  } = replay;
  return {
    format,
    version,
    game,
    config,
    configHash,
    round,
    start,
    totalTicks,
    chunks,
    finalHash,
  };
}
export interface RoomState {
  code: string;
  settings: Settings;
  host: string;
  phase: Phase;
  round: number;
  game: number;
  settledRound: number;
  seq: number;
  players: Player[];
  deadline: number;
  rng: number;
  replay: Replay | null;
  simulation: BattleState | null;
  checksums: { tick: number; hash: string }[];
  replayFrames: ReplayFrame[];
  replayChunks: ReplayChunkInfo[];
  results: TeamResult[];
  champion: string | null;
  placement: string[];
  updated: number;
  mode: "pvp" | "campaign";
}
function currentSettings(settings: Settings): Settings {
  // Existing lobbies keep their wall schedule when the old battle timer is removed.
  const { battleSeconds, ...rest } = settings as Settings & {
    battleSeconds?: number;
  };
  return {
    ...rest,
    teamSize: 1,
    shrinkSeconds: rest.shrinkSeconds ?? battleSeconds ?? DEFAULT_SHRINK_SECONDS,
  };
}
export function newRoom(code: string, seed: number, now: number): RoomState {
  return {
    code,
    settings: { ...DEFAULT_SETTINGS },
    host: "",
    phase: "LOBBY",
    round: 0,
    game: 0,
    settledRound: 0,
    seq: 0,
    players: [],
    deadline: 0,
    rng: seed || 1,
    replay: null,
    simulation: null,
    checksums: [],
    replayFrames: [],
    replayChunks: [],
    results: [],
    champion: null,
    placement: [],
    updated: now,
    mode: "pvp",
  };
}
export function offers(s: RoomState, count: number): string[] {
  return Array.from({ length: count }, () => {
    if (random(s) % 100 < 52) {
      const roll = random(s) % 100;
      const tier = roll < 75 ? "T1" : roll < 95 ? "T2" : roll < 99 ? "T3" : "T4";
      const pool = ROSTER.filter((c) => c.tier === tier);
      return pool[random(s) % pool.length].id;
    }
    const roll = random(s) % 100,
      rarity = roll < 75 ? 0 : roll < 95 ? 1 : roll < 99 ? 2 : 3;
    const pool = CATALOG_ITEMS.filter((i) => i.rarity === rarity);
    return pool[random(s) % pool.length].id;
  });
}
function itemOffers(s: RoomState, count: number): string[] {
  return Array.from({ length: count }, () => {
    const roll = random(s) % 100,
      rarity = roll < 75 ? 0 : roll < 95 ? 1 : roll < 99 ? 2 : 3,
      pool = CATALOG_ITEMS.filter((i) => i.rarity === rarity);
    return pool[random(s) % pool.length].id;
  });
}
function makeUnit(id: CharacterId): Loadout {
  const c = character(id)!;
  return {
    characterId: id,
    classId: c.base as Loadout["classId"],
    level: 1,
    weaponRank: 1,
    equipment: [],
  };
}
function requireRule(condition: unknown, message: string): asserts condition {
  if (!condition) throw Error(message);
}
function equip(p: Player, id: string, target: number, replace?: number) {
  const l = p.loadouts[target],
    it = ITEMS.find((i) => i.id === id);
  requireRule(l && it, "Trang bị không hợp lệ");
  requireRule(
    it.slot !== "accessory" ||
      !l.equipment.includes(id) ||
      (replace !== undefined && l.equipment[replace] === id),
    "Không thể mang hai phụ kiện giống nhau",
  );
  const indices = l.equipment
    .map((eid, i) => ({ it: ITEMS.find((x) => x.id === eid)!, i }))
    .filter((x) => x.it.slot === it.slot)
    .map((x) => x.i);
  const limit = it.slot === "accessory" ? 2 : 1;
  if (indices.length >= limit) {
    requireRule(
      replace !== undefined && indices.includes(replace),
      "Hết ô trang bị; hãy chọn vật phẩm cần thay",
    );
    requireRule(
      p.inventory.length < ITEM_BAG_CAPACITY,
      "Túi đầy, không thể trả trang bị cũ",
    );
    const old = l.equipment[replace];
    l.equipment[replace] = id;
    p.inventory.push(old);
  } else l.equipment.push(id);
}
export function prepare(s: RoomState, now: number) {
  s.phase = "PREPARATION";
  s.round++;
  s.deadline = now + s.settings.preparationSeconds * 1000;
  for (const p of s.players) {
    p.ready = false;
    if (p.hp <= 0 || p.spectator) continue;
    p.bench ??= [];
    p.unitLimit ??= Math.min(MAX_FIELD_UNITS, Math.max(1, p.loadouts.length));
    p.shop = offers(s, SHOP_SIZE);
    if (s.round > 1) {
      p.rewards = itemOffers(s, s.settings.comeback && p.hp < 60 ? 4 : 3);
      p.freeRerolls = s.settings.comeback && p.hp < 35 ? 1 : 0;
      p.reliefAvailable = s.settings.comeback && p.hp < 15 && !p.reliefUsed;
    }
  }
}
export function lock(s: RoomState, now: number) {
  if (s.phase !== "PREPARATION") s.round = Math.max(1, s.round + 1);
  s.settings = currentSettings(s.settings);
  s.phase = "LOCKING";
  const teams = s.players
    .filter((p) => !p.spectator && p.hp > 0)
    .map((p) => ({
      id: p.id,
      name: p.name,
      loadouts: structuredClone(p.loadouts),
      choice: structuredClone(p.choice || {}),
    }));
  let campaign: BattleConfig["campaign"];
  if (s.mode === "campaign" && teams.length === 1) {
    const stage = (s.players.find((p) => !p.spectator)?.campaignStage || 0) + 1;
    const encounter = campaignEncounter(stage, teams[0].loadouts.length);
    teams.push({ id: "campaign-bot", name: encounter.boss ? `BOSS · ẢI ${stage}` : `Đối thủ ải ${stage}`, loadouts: encounter.loadouts, choice: {} });
    campaign = { stage, enemyTeamId: "campaign-bot" };
  }
  if (teams.length < 2) {
    s.phase = "FINISHED";
    s.champion = teams[0]?.id || null;
    s.deadline = 0;
    return;
  }
  const config: BattleConfig = {
    teams,
    campaign,
    shrinkSeconds: s.settings.shrinkSeconds,
    width: DEFAULT_ARENA_SIZE,
    height: DEFAULT_ARENA_SIZE,
  };
  const seed = random(s);
  s.simulation = createBattle(config, seed);
  s.replay = null;
  s.replayFrames = [captureReplayFrame(s.simulation)];
  s.replayChunks = [];
  s.checksums = [];
  s.phase = "SIMULATING";
  s.deadline = now + 1;
}
export function applyAction(
  original: RoomState,
  id: string,
  action: Action,
  now: number,
): RoomState {
  const s = structuredClone(original);
  s.settings = currentSettings(s.settings);
  let p = s.players.find((p) => p.id === id);
  if (action.type === "JOIN") {
    requireRule(!p, "Đã ở trong phòng");
    requireRule(s.players.length < 40, "Phòng đã đầy");
    const spectator = action.spectator || false;
    requireRule(
      spectator ? s.settings.spectators : s.phase === "LOBBY",
      "Trận đã bắt đầu hoặc không cho khán giả",
    );
    requireRule(
      spectator ||
        s.players.filter((p) => !p.spectator).length < s.settings.maxPlayers,
      "Phòng đã đầy",
    );
    requireRule(
      spectator || s.mode !== "campaign" || s.players.filter((p) => !p.spectator).length === 0,
      "Phòng đi ải chỉ dành cho một người chơi",
    );
    p = {
      id,
      name: action.name,
      spectator,
      hp: 100,
      gold: 10,
      ready: false,
      loadouts: [makeUnit(ROSTER[0].id as CharacterId)],
      bench: [],
      unitLimit: 1,
      inventory: [],
      shop: [],
      rewards: [],
      freeRerolls: 0,
      reliefUsed: false,
      reliefAvailable: false,
      joined: now,
      totalDamage: 0,
      cards: [{ characterId: ROSTER[0].id as CharacterId, level: 1, xp: 0 }],
      packs: 0,
      lastPackAt: 0,
      missions: { draw: 0, win: 0, campaign: 0 },
      claimedMissions: [],
      missionDay: dailyQuestDay(now),
      campaignStage: 0,
    };
    s.players.push(p);
    if (!s.host && !spectator) s.host = id;
  } else {
    requireRule(p, "Bạn chưa tham gia phòng");
    // Upgrade old persisted players without discarding their active roster.
    p.bench ??= [];
    p.unitLimit ??= Math.min(MAX_FIELD_UNITS, Math.max(1, p.loadouts.length));
    p.cards = (p.cards || [{ characterId: (p.loadouts[0]?.characterId || ROSTER[0].id) as CharacterId, level: 1, xp: 0 }]).map((card) => ({ characterId: card.characterId, level: card.level, xp: "xp" in card ? card.xp : 0 }));
    p.packs ??= 0;
    p.lastPackAt ??= 0;
    p.missions ??= { draw: 0, win: 0, campaign: 0 };
    p.claimedMissions ??= [];
    if (p.missionDay !== dailyQuestDay(now)) {
      p.missions = { draw: 0, win: 0, campaign: 0 };
      p.claimedMissions = [];
      p.missionDay = dailyQuestDay(now);
    }
    p.campaignStage ??= 0;
    if (action.type === "LEAVE") {
      if (s.phase === "LOBBY" || s.phase === "FINISHED" || p.spectator)
        s.players = s.players.filter((x) => x.id !== id);
      else {
        p.spectator = true;
        p.hp = 0;
      }
      if (s.host === id)
        s.host =
          s.players
            .filter((x) => !x.spectator)
            .sort((a, b) => a.joined - b.joined || (a.id < b.id ? -1 : 1))[0]
            ?.id || "";
    } else {
      requireRule(!p.spectator, "Khán giả chỉ có thể xem");
      if (action.type === "SET_CONFIG") {
        requireRule(
          s.host === id && s.phase === "LOBBY",
          "Chỉ chủ phòng được sửa trong lobby",
        );
        requireRule(
          action.settings.maxPlayers >=
            s.players.filter((p) => !p.spectator).length,
          "Giới hạn nhỏ hơn số người hiện tại",
        );
        s.settings = { ...action.settings, teamSize: 1 };
        for (const x of s.players) {
          x.ready = false;
          if (!validChoice(x.loadouts, x.choice || {})) x.choice = {};
        }
      } else if (action.type === "SELECT_CHARACTERS") {
        requireRule(s.phase === "LOBBY", "Nhân vật đã khóa");
        requireRule(action.characters.length <= 3 && new Set(action.characters).size === action.characters.length, "Đội hình tối đa 3 nhân vật khác nhau");
        const cards = p.cards;
        requireRule(action.characters.every((c) => cards.some((card) => card.characterId === c)), "Chỉ dùng nhân vật đã sở hữu");
        p.loadouts = action.characters.map((c) => {
          const unit = makeUnit(c);
          unit.level = cards.find((card) => card.characterId === c)!.level;
          return unit;
        });
        p.unitLimit = 3;
        if (!validChoice(p.loadouts, p.choice || {})) p.choice = {};
        p.ready = false;
      } else if (action.type === "SET_MODE") {
        requireRule(s.host === id && s.phase === "LOBBY", "Chỉ chủ phòng chọn chế độ trong lobby");
        requireRule(action.mode !== "campaign" || s.players.filter((player) => !player.spectator).length === 1, "Đi ải chỉ dành cho một người chơi; hãy tạo phòng solo");
        s.mode = action.mode;
      } else if (action.type === "SYNC_PROFILE") {
        requireRule(s.phase === "LOBBY" && !p.ready, "Chỉ đồng bộ bộ sưu tập trong lobby");
        requireRule(new Set(action.cards.map((card) => card.characterId)).size === action.cards.length, "Bộ sưu tập có thẻ trùng dữ liệu");
        requireRule(new Set(action.team).size === action.team.length, "Đội hình không thể có nhân vật trùng");
        requireRule(action.team.every((c) => action.cards.some((card) => card.characterId === c)), "Đội hình chỉ được dùng thẻ đã sở hữu");
        const validItems = action.itemCards.every((card) => CATALOG_ITEMS.some((item) => item.id === card.itemId));
        requireRule(validItems && new Set(action.itemCards.map((card) => card.itemId)).size === action.itemCards.length, "Bộ sưu tập vật phẩm không hợp lệ");
        const assigned = action.equipment.flatMap((entry) => entry.items);
        requireRule(action.equipment.every((entry) => action.team.includes(entry.characterId)), "Chỉ trang bị cho nhân vật trong đội");
        requireRule(new Set(action.equipment.map((entry) => entry.characterId)).size === action.equipment.length && action.equipment.every((entry) => entry.items.length <= 1), "Mỗi nhân vật chỉ được trang bị một vật phẩm");
        requireRule(new Set(assigned).size === assigned.length, "Mỗi thẻ vật phẩm chỉ được trang bị cho một nhân vật");
        requireRule(assigned.every((itemId) => action.itemCards.some((card) => card.itemId === itemId)), "Chỉ dùng vật phẩm đã sở hữu");
        requireRule(action.cards.every((card) => card.level === 10 ? card.xp === 0 : card.xp < xpForNextLevel(card.level)) && action.itemCards.every((card) => card.level === 10 ? card.xp === 0 : card.xp < xpForNextLevel(card.level)), "EXP thẻ không hợp lệ");
        p.cards = structuredClone(action.cards);
        p.itemCards = structuredClone(action.itemCards);
        p.campaignStage = action.campaignStage;
        p.inventory = action.itemCards.filter((card) => !assigned.includes(card.itemId)).map((card) => card.itemId);
        p.loadouts = action.team.map((c) => {
          const unit = makeUnit(c);
          unit.level = action.cards.find((card) => card.characterId === c)!.level;
          unit.equipment = structuredClone(action.equipment.find((entry) => entry.characterId === c)?.items || []);
          unit.equipmentLevels = Object.fromEntries(unit.equipment.map((id) => [id, action.itemCards.find((card) => card.itemId === id)?.level || 1]));
          return unit;
        });
        p.unitLimit = 3;
        p.choice = {};
      } else if (action.type === "SET_TEAM") {
        requireRule(s.phase === "LOBBY" && !p.ready, "Chỉ sửa đội trong lobby");
        const cards = p.cards;
        requireRule(action.characters.every((c) => cards.some((card) => card.characterId === c)), "Chỉ dùng nhân vật đã sở hữu");
        requireRule(new Set(action.characters).size === action.characters.length, "Không thể chọn trùng nhân vật");
        p.loadouts = action.characters.map((c) => {
          const unit = makeUnit(c);
          unit.level = cards.find((card) => card.characterId === c)!.level;
          return unit;
        });
        p.unitLimit = 3;
        p.choice = {};
      } else if (action.type === "CLAIM_PACK") {
        requireRule(s.phase === "LOBBY" || s.phase === "FINISHED", "Chỉ nhận pack ngoài trận");
        requireRule(p.packs < PACK_CAPACITY, "Kho pack đã đầy");
        requireRule(!p.lastPackAt || now - p.lastPackAt >= 60_000, "Lượt nhận pack chưa hồi");
        p.packs++;
        p.lastPackAt = now;
      } else if (action.type === "OPEN_PACK") {
        requireRule(s.phase === "LOBBY" || s.phase === "FINISHED", "Chỉ mở pack ngoài trận");
        const kind = action.kind || "normal";
        requireRule((kind === "boss" ? p.bossPacks || 0 : p.packs) > 0, "Bạn không có pack");
        p.itemCards ||= [];
        const ownedCards = p.cards, ownedItems = p.itemCards;
        const available = [
          ...ROSTER.filter(c => (ownedCards.find(owned => owned.characterId === c.id)?.level || 0) < 10).map(c => ({ id: c.id, kind: "character" as const, tier: c.tier === "RAC" ? "T1" : c.tier })),
          ...CATALOG_ITEMS.filter(it => (ownedItems.find(owned => owned.itemId === it.id)?.level || 0) < 10).map(it => ({ id: it.id, kind: "item" as const, tier: `T${it.rarity + 1}` })),
        ];
        requireRule(available.length > 0, "Tất cả thẻ đã đạt cấp tối đa");
        const tier = packTier(kind, (random(s) % 100000) / 1000, p.packsSinceRare || 0);
        const pool = packPool(available, tier, kind === "normal" && (p.packsSinceHighRarity || 0) >= 99);
        const pulled = pool[random(s) % pool.length];
        if (kind === "boss") p.bossPacks!--;
        else {
          p.packs--;
          p.packsSinceRare = pulled.tier === "T1" ? Math.min(19, (p.packsSinceRare || 0) + 1) : 0;
          p.packsSinceHighRarity = ["T3", "T4"].includes(pulled.tier) ? 0 : Math.min(99, (p.packsSinceHighRarity || 0) + 1);
        }
        if (pulled.kind === "character") {
          const card = p.cards.find(c => c.characterId === pulled.id);
          if (card) Object.assign(card, addCardXp(card, DUPLICATE_CARD_XP));
          else p.cards.push({ characterId: pulled.id as CharacterId, level: 1, xp: 0 });
          const active = p.loadouts.find(l => l.characterId === pulled.id);
          if (active) active.level = p.cards.find(c => c.characterId === pulled.id)!.level;
        } else {
          const card = p.itemCards.find(c => c.itemId === pulled.id);
          if (card) Object.assign(card, addCardXp(card, DUPLICATE_CARD_XP));
          else p.itemCards.push({ itemId: pulled.id, level: 1, xp: 0 });
        }
        p.missions.draw++;
      } else if (action.type === "CLAIM_MISSION") {
        const goals = { draw: 3, win: 1, campaign: 1 };
        requireRule(!p.claimedMissions.includes(action.mission), "Nhiệm vụ đã nhận");
        requireRule(p.missions[action.mission] >= goals[action.mission], "Nhiệm vụ chưa hoàn thành");
        requireRule(p.packs < PACK_CAPACITY, "Kho pack đầy");
        p.claimedMissions.push(action.mission);
        p.packs++;
      } else if (action.type === "TEAM_CHOICE") {
        requireRule(
          (s.phase === "LOBBY" || s.phase === "PREPARATION") &&
            !p.ready &&
            p.hp > 0,
          "Đội hình đã khóa",
        );
        const choice = {
          trait: action.trait,
          bond: action.bond,
          group: action.group,
          representatives: action.representatives,
        };
        requireRule(
          validChoice(p.loadouts, choice),
          "Không đủ điều kiện liên kết hoặc đặc tính",
        );
        p.choice = choice;
      } else if (action.type === "SELECT") {
        requireRule(s.phase === "LOBBY", "Lớp đã khóa");
        requireRule(action.classes.length === 1, "Chọn một nhân vật trong bộ sưu tập");
        const chosen = ROSTER.find((c) => c.base === action.classes[0]);
        requireRule(chosen && p.cards.some((card) => card.characterId === chosen.id), "Chỉ dùng nhân vật đã sở hữu");
        p.loadouts = [
          makeUnit(chosen.id as CharacterId),
        ];
        p.ready = false;
        p.choice = {};
      } else if (action.type === "START") {
        requireRule(s.host === id && s.phase === "LOBBY", "Không thể bắt đầu");
        const active = s.players.filter((p) => !p.spectator);
        requireRule(
          (s.mode === "campaign" ? active.length === 1 : active.length >= 2) &&
            active.every(
              (x) =>
                x.ready &&
                x.loadouts.length >= 1 &&
                x.loadouts.length <= x.unitLimit,
            ),
          "Cần ít nhất 2 người đã sẵn sàng",
        );
        lock(s, now);
      } else if (action.type === "REMATCH") {
        requireRule(
          s.host === id && s.phase === "FINISHED",
          "Chỉ chủ phòng được mở trận mới",
        );
        s.phase = "LOBBY";
        s.round = 0;
        s.game = (s.game ?? 0) + 1;
        s.settledRound = 0;
        s.replay = null;
        s.results = [];
        s.champion = null;
        s.placement = [];
        for (const x of s.players) {
          x.cards ??= [{ characterId: (x.loadouts[0]?.characterId || ROSTER[0].id) as CharacterId, level: 1, xp: 0 }];
          x.hp = 100;
          x.gold = 10;
          x.ready = false;
          x.inventory = [];
          x.bench = [];
          x.unitLimit = 1;
          x.rewards = [];
          x.shop = [];
          x.reliefUsed = false;
          x.totalDamage = 0;
          x.loadouts = (x.loadouts.length ? x.loadouts : [makeUnit(ROSTER[0].id as CharacterId)]).map((old) => {
            const unit = makeUnit(old.characterId || ROSTER[0].id as CharacterId);
            unit.level = x.cards.find((card) => card.characterId === old.characterId)?.level || 1;
            return unit;
          }).slice(0, 3);
        }
      } else if (action.type === "READY") {
        requireRule(
          s.phase === "LOBBY" || s.phase === "PREPARATION",
          "Không đúng giai đoạn",
        );
        requireRule(p.hp > 0, "Bạn đã bị loại");
        p.ready = action.ready;
        if (
          s.phase === "PREPARATION" &&
          s.players
            .filter((x) => !x.spectator && x.hp > 0)
            .every((x) => x.ready)
        )
          lock(s, now);
      } else {
        requireRule(
          s.phase === "PREPARATION" && now < s.deadline && p.hp > 0 && !p.ready,
          "Giao dịch đã khóa",
        );
        if (action.type === "BUY") {
          const offer = p.shop[action.offer];
          const unit = offer ? character(offer) : undefined;
          const it = ITEMS.find((i) => i.id === offer);
          const price = unit ? characterPrice(offer!) : it?.price || Infinity;
          requireRule(!!offer && p.gold >= price, "Không đủ Gold");
          requireRule(
            unit
              ? p.bench.length < BENCH_CAPACITY
              : p.inventory.length < ITEM_BAG_CAPACITY,
            unit ? "Kho nhân vật đã đầy" : "Túi vật phẩm đã đầy",
          );
          p.gold -= price;
          if (unit) p.bench.push(makeUnit(unit.id as CharacterId));
          else if (it) p.inventory.push(it.id);
          else throw Error("Mặt hàng không hợp lệ");
          p.shop[action.offer] = null;
        }
        if (action.type === "MOVE_UNIT") {
          const source = action.source === "field" ? p.loadouts : p.bench;
          const destination =
            action.destination === "field" ? p.loadouts : p.bench;
          const from = source[action.sourceIndex];
          requireRule(!!from, "Không tìm thấy nhân vật cần di chuyển");

          if (
            source === destination &&
            action.sourceIndex === action.destinationIndex
          ) {
            // Dropping a unit back into its own slot is a harmless no-op.
          } else {
            const targetUnit = destination[action.destinationIndex];
            if (
              targetUnit &&
              targetUnit.characterId === from.characterId &&
              targetUnit.level === from.level &&
              from.level < 10
            ) {
              requireRule(
                p.inventory.length + from.equipment.length <= ITEM_BAG_CAPACITY,
                "Túi vật phẩm cần chỗ để hợp nhất",
              );
              source.splice(action.sourceIndex, 1);
              const targetIndex =
                source === destination &&
                action.sourceIndex < action.destinationIndex
                  ? action.destinationIndex - 1
                  : action.destinationIndex;
              const survivor = destination[targetIndex];
              requireRule(!!survivor, "Không tìm thấy nhân vật để hợp nhất");
              survivor.level++;
              survivor.weaponRank = Math.max(
                survivor.weaponRank || 1,
                from.weaponRank || 1,
              );
              p.inventory.push(...from.equipment);
              requireRule(
                p.loadouts.length >= 1,
                "Phải giữ ít nhất một nhân vật trên sân",
              );
            } else if (targetUnit) {
              if (source === destination) {
                [source[action.sourceIndex], source[action.destinationIndex]] =
                  [source[action.destinationIndex], source[action.sourceIndex]];
              } else {
                [
                  source[action.sourceIndex],
                  destination[action.destinationIndex],
                ] = [
                  destination[action.destinationIndex],
                  source[action.sourceIndex],
                ];
              }
            } else {
              if (source === p.loadouts)
                requireRule(
                  p.loadouts.length > 1,
                  "Phải giữ ít nhất một nhân vật trên sân",
                );
              if (destination === p.loadouts && source !== destination)
                requireRule(
                  p.loadouts.length < p.unitLimit,
                  "Hãy mua nâng cấp số quân trước",
                );
              if (destination === p.bench && source !== destination)
                requireRule(
                  p.bench.length < BENCH_CAPACITY,
                  "Kho nhân vật đã đầy",
                );
              source.splice(action.sourceIndex, 1);
              destination.splice(
                Math.min(action.destinationIndex, destination.length),
                0,
                from,
              );
            }
          }
          if (!validChoice(p.loadouts, p.choice || {})) p.choice = {};
        }
        if (action.type === "EQUIP") {
          const it = p.inventory[action.inventory];
          requireRule(it, "Vật phẩm không tồn tại");
          p.inventory.splice(action.inventory, 1);
          equip(p, it, action.target, action.replace);
        }
        if (action.type === "REWARD") {
          const it = p.rewards[action.choice];
          requireRule(it, "Phần thưởng không hợp lệ");
          equip(p, it, action.target, action.replace);
          p.rewards = [];
        }
        if (action.type === "UPGRADE") {
          throw Error("Nâng cấp nhân vật bằng cách hợp nhất bản sao cùng cấp");
        }
        if (action.type === "WEAPON_UPGRADE") {
          const l = p.loadouts[action.target],
            rank = l?.weaponRank || 1;
          requireRule(
            l?.characterId &&
              rank < 3 &&
              l.level >= (rank === 1 ? 3 : 6) &&
              p.gold >= (rank === 1 ? 8 : 12),
            "Không đủ cấp hoặc Gold nâng vũ khí",
          );
          p.gold -= rank === 1 ? 8 : 12;
          l.weaponRank = rank + 1;
        }
        if (action.type === "UNEQUIP") {
          const l = p.loadouts[action.target];
          requireRule(
            l &&
              l.equipment[action.equipment] &&
              p.inventory.length < ITEM_BAG_CAPACITY,
            "Không thể tháo vật phẩm",
          );
          p.inventory.push(l.equipment.splice(action.equipment, 1)[0]);
        }
        if (action.type === "REROLL") {
          requireRule(p.gold >= 2 || p.freeRerolls > 0, "Không đủ Gold");
          if (p.freeRerolls) p.freeRerolls--;
          else p.gold -= 2;
          p.shop = offers(s, SHOP_SIZE);
        }
        if (action.type === "UPGRADE_CAPACITY") {
          const price = capacityUpgradePrice(p.unitLimit);
          requireRule(
            p.unitLimit < MAX_FIELD_UNITS && p.gold >= price,
            "Không đủ Gold nâng số quân",
          );
          p.gold -= price;
          p.unitLimit++;
        }
        if (action.type === "RELIEF") {
          requireRule(p.reliefAvailable && !p.reliefUsed, "Không có cứu trợ");
          equip(p, "shield", action.target, action.replace);
          p.reliefUsed = true;
          p.reliefAvailable = false;
        }
      }
    }
  }
  s.seq++;
  s.updated = now;
  return s;
}
export function settle(s: RoomState, now: number) {
  if (
    (s.phase !== "REPLAY_READY" && s.phase !== "SETTLEMENT") ||
    !s.replay ||
    s.replay.round !== s.round ||
    s.settledRound >= s.round
  )
    return;
  s.phase = "SETTLEMENT";
  s.results = s.replay.result;
  const winner = s.results.find((r) => r.rank === 1);
  for (const r of s.results) {
    const p = s.players.find((p) => p.id === r.id);
    if (!p || p.spectator) continue;
    p.packs ??= 0;
    p.missions ??= { draw: 0, win: 0, campaign: 0 };
    p.claimedMissions ??= [];
    if (p.missionDay !== dailyQuestDay(now)) {
      p.missions = { draw: 0, win: 0, campaign: 0 };
      p.claimedMissions = [];
      p.missionDay = dailyQuestDay(now);
    }
    const won = r.id === winner?.id;
    const campaignWin = s.mode === "campaign" && won;
    p.packs = Math.min(PACK_CAPACITY, p.packs + (won ? (campaignWin ? campaignPackReward((p.campaignStage || 0) + 1) : 10) : 0));
    if (won && !campaignWin) p.missions.win++;
    if (campaignWin) { p.bossPacks = (p.bossPacks || 0) + campaignBossPackReward((p.campaignStage || 0) + 1); p.missions.campaign++; p.campaignStage = (p.campaignStage || 0) + 1; }
    p.totalDamage += r.damage;
  }
  s.settledRound = s.round;
  s.phase = "FINISHED";
  s.champion = winner?.id === "campaign-bot" ? null : winner?.id || null;
  s.deadline = 0;
}
export function advance(
  original: RoomState,
  now: number,
  batch = 120,
): RoomState {
  const s = structuredClone(original);
  s.game ??= 0;
  s.replayFrames ??= [];
  s.replayChunks ??= [];
  if (!s.deadline || now < s.deadline) return s;
  if (s.phase === "PREPARATION") lock(s, now);
  else if (s.phase === "SIMULATING") {
    const b = s.simulation!;
    // Older persisted rooms may predate frame capture. Start their recording at
    // the first state available after upgrade; their playback clock is offset
    // to begin at this tick rather than showing a fabricated opening state.
    if (s.replayFrames.length === 0 && s.replayChunks.length === 0)
      s.replayFrames.push(captureReplayFrame(b));
    for (let i = 0; i < batch && !b.finished; i++) {
      stepBattle(b);
      if (b.tick % 3 === 0 || b.finished)
        s.replayFrames.push(captureReplayFrame(b));
      if (b.tick % 120 === 0) {
        s.checksums.push({ tick: b.tick, hash: calculateStateHash(b) });
        // Unlimited battle duration must not grow the stored replay metadata forever.
        if (s.checksums.length > 256) s.checksums.shift();
      }
    }
    if (b.finished) {
      s.replay = {
        format: 1,
        version: ENGINE_VERSION,
        game: s.game,
        config: b.config,
        configHash: hash(b.config),
        seed: b.seed,
        round: s.round,
        // The worker drains replayFrames into persisted chunks while the
        // simulation is running. Anchor playback to the first persisted frame,
        // not the first frame left in the final in-memory batch.
        start:
          now +
          1500 -
          (s.replayChunks[0]?.fromTick ?? s.replayFrames[0]?.tick ?? 0) *
            (1000 / 30),
        totalTicks: b.tick,
        chunks: structuredClone(s.replayChunks),
        finalHash: calculateStateHash(b),
        checkpoints: s.checksums,
        result: calculateBattleResult(b),
        final: b,
      };
      s.simulation = null;
      s.phase = "REPLAY_READY";
      s.deadline = s.replay.start + Math.ceil((b.tick * 1000) / 30) + 2000;
    } else s.deadline = now + 1;
  } else if (s.phase === "REPLAY_READY") settle(s, now);
  s.seq++;
  s.updated = now;
  return s;
}
export function viewRoom(s: RoomState, id: string) {
  return {
    ...s,
    mode: s.mode || "pvp",
    settings: currentSettings(s.settings),
    rng: undefined,
    simulation: undefined,
    checksums: undefined,
    replayFrames: undefined,
    replayChunks: undefined,
    replay: viewReplay(s.replay),
    players: s.players.map((p) => {
      const currentDay = dailyQuestDay();
      const dailyIsCurrent = p.missionDay === currentDay;
      const migrated = {
        ...p,
        cards: (p.cards || [{ characterId: (p.loadouts[0]?.characterId || ROSTER[0].id) as CharacterId, level: 1, xp: 0 }]).map((card) => ({ characterId: card.characterId, level: card.level, xp: "xp" in card ? card.xp : 0 })),
        itemCards: p.itemCards || [],
        packs: p.packs || 0,
        bossPacks: p.bossPacks || 0,
        lastPackAt: p.lastPackAt || 0,
        missions: dailyIsCurrent ? p.missions || { draw: 0, win: 0, campaign: 0 } : { draw: 0, win: 0, campaign: 0 },
        claimedMissions: dailyIsCurrent ? p.claimedMissions || [] : [],
        missionDay: currentDay,
        campaignStage: p.campaignStage || 0,
        bench: p.bench || [],
        unitLimit:
          p.unitLimit ??
          Math.min(MAX_FIELD_UNITS, Math.max(1, p.loadouts.length)),
      };
      return p.id === id
        ? migrated
        : {
            ...migrated,
            inventory: [],
            shop: [],
            rewards: [],
            freeRerolls: 0,
            reliefAvailable: false,
          };
    }),
  };
}
