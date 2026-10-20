import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CHARACTERS,
  CLASSES,
  ITEMS,
  calculateRoundRewards,
  type ClassId,
  type Loadout,
  characterPrice,
  BENCH_CAPACITY,
  ITEM_BAG_CAPACITY,
  capacityUpgradePrice,
} from "../../../packages/shared/src/balance";
import {
  DEFAULT_SETTINGS,
  type Action,
} from "../../../packages/shared/src/protocol";
import {
  type RoomState,
  type ReplayInfo,
} from "../../../packages/shared/src/room";
import {
  debugConfig,
  ENGINE_VERSION,
  type BattleConfig,
} from "../../../packages/battle-engine/src/index";
import { Connection, defaultApi } from "./networking";
import { Arena } from "./rendering/Arena";
import { DEFAULT_ARENA_SIZE, DEFAULT_SHRINK_SECONDS } from "../../../packages/shared/src/arena";
import "./styles.css";
import "./catalog.css";
import {
  ROSTER,
  character,
  itemInfo,
  CATALOG_ITEMS,
  validChoice,
  type CharacterId,
  type TeamChoice,
} from "../../../packages/shared/src/catalog";
import { CatalogLibrary, InfoPopup, Portrait, ItemSprite, TeamChoices, type Inspect } from "./GameCatalog";
import { addCardXp, cardEvolution, cardTotalXp, dailyQuestDay, DUPLICATE_CARD_XP, xpForNextLevel, PACK_CAPACITY } from "../../../packages/shared/src/progression";
interface GlobalProfile {
  cards: { characterId: CharacterId; level: number; xp: number }[];
  itemCards: { itemId: string; level: number; xp: number }[];
  team: CharacterId[];
  equipment: Record<string, string[]>;
  packs: number;
  lastPackAt: number;
  missions: { draw: number; win: number; campaign: number };
  claimedMissions: string[];
  missionDay: string;
  campaignStage: number;
  processedMatches: string[];
  lastPull?: { kind: "character" | "item"; id: string; tier: string; rarity: string; duplicate?: boolean; xpGained?: number; oldXp?: number; experience?: number; oldLevel?: number; level?: number; leveledUp?: boolean; batchCount?: number; evolved?: boolean; oldTier?: string };
}
interface TradeView {
  code: string;
  host: string;
  viewer: string;
  players: { profileId: string; name: string; offer: string[]; ready: boolean; applied: boolean }[];
  executing: boolean;
  completed: boolean;
}
const cardTier = (tier: string | number) => typeof tier === "number" ? `T${Math.min(4, tier + 1)}` : tier;
const tierRarity = (tier: string) => ({ T1: "Thường", T2: "Hiếm", T3: "Sử thi", T4: "Huyền thoại", GOD: "GOD" }[tier] || "Thường");
const PROFILE_KEY = "circlewar-player-profile-v1";
const PROFILE_ID_KEY = "circlewar-profile-id-v1";
const PROFILE_TOKEN_KEY = "circlewar-profile-token-v1";
function safeApiUrl(value: string) {
  if (typeof window !== "undefined" && window.location.protocol === "https:" && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(value))
    return import.meta.env.VITE_API_URL || "";
  return value;
}
async function fetchProfileWithRetry(url: string, init: RequestInit) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.status < 500 || attempt === 2) return response;
      lastError = Error(`Máy chủ hồ sơ trả về ${response.status}`);
    } catch (error) { lastError = error; }
    await new Promise((resolve) => window.setTimeout(resolve, 350 * (attempt + 1)));
  }
  throw new TypeError("Không thể kết nối máy chủ hồ sơ sau 3 lần thử.", { cause: lastError });
}
function newProfile(): GlobalProfile {
  const now = Date.now();
  const profile: GlobalProfile = {
    cards: [{ characterId: "char_01", level: 1, xp: 0 }],
    itemCards: [],
    team: ["char_01"],
    equipment: {},
    packs: 10,
    lastPackAt: now,
    missions: { draw: 0, win: 0, campaign: 0 },
    claimedMissions: [],
    missionDay: dailyQuestDay(now),
    campaignStage: 0,
    processedMatches: [],
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}
function newProfileDefaults(): GlobalProfile {
  return {
    cards: [{ characterId: "char_01", level: 1, xp: 0 }],
    itemCards: [], team: ["char_01"], equipment: {}, packs: 10, lastPackAt: Date.now(),
    missions: { draw: 0, win: 0, campaign: 0 }, claimedMissions: [], missionDay: dailyQuestDay(),
    campaignStage: 0, processedMatches: [],
  };
}
function ExperienceBar({ level, xp }: { level: number; xp: number }) {
  const required = xpForNextLevel(level);
  return <div className="card-experience"><div className="card-experience-label"><span>Lv.{level}{level >= 10 ? " · MAX" : ""}</span><span>{level >= 10 ? "MAX" : `${xp}/${required} EXP`}</span></div><div className="xp-track"><i style={{ width: `${level >= 10 ? 100 : Math.min(100, (xp / required) * 100)}%` }} /></div></div>;
}
function App() {
  const [profileIdentity] = useState(() => {
    let id = localStorage.getItem(PROFILE_ID_KEY);
    let token = localStorage.getItem(PROFILE_TOKEN_KEY);
    if (!id || !token) {
      id = crypto.randomUUID();
      token = crypto.randomUUID() + crypto.randomUUID();
      localStorage.setItem(PROFILE_ID_KEY, id);
      localStorage.setItem(PROFILE_TOKEN_KEY, token);
    }
    return { id, token };
  });
  const [profile, setProfile] = useState<GlobalProfile>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) {
        const restored = JSON.parse(saved) as Partial<GlobalProfile> & { lastPull?: unknown };
        if (typeof restored.lastPull === "string") delete restored.lastPull;
        const defaults = newProfileDefaults();
        const team = restored.team || defaults.team;
        const cards = ((restored.cards as unknown as { characterId: CharacterId; level: number; xp?: number }[] | undefined) || defaults.cards).map(card => ({ characterId: card.characterId, level: card.level, xp: card.xp || 0 }));
        const itemCards = ((restored.itemCards as unknown as { itemId: string; level?: number; xp?: number }[] | undefined) || []).map(card => ({ itemId: card.itemId, level: card.level || 1, xp: card.xp || 0 }));
        const ownedItems = new Set(itemCards.map(card => card.itemId));
        const assigned = new Set<string>();
        const equipment: Record<string, string[]> = {};
        for (const characterId of team) {
          const itemId = restored.equipment?.[characterId]?.find(id => ownedItems.has(id) && !assigned.has(id));
          if (itemId) { equipment[characterId] = [itemId]; assigned.add(itemId); }
        }
        const today = dailyQuestDay();
        const sameMissionDay = restored.missionDay === today;
        return {
          ...defaults,
          ...restored,
          team, cards, itemCards, equipment,
          missionDay: today,
          missions: sameMissionDay ? restored.missions || defaults.missions : { draw: 0, win: 0, campaign: 0 },
          claimedMissions: sameMissionDay ? restored.claimedMissions || [] : [],
        } as GlobalProfile;
      }
    } catch {}
    return newProfile();
  });
  const [profileReady, setProfileReady] = useState(false);
  const [profileOnline, setProfileOnline] = useState(false);
  const [profileRoomSynced, setProfileRoomSynced] = useState(false);
  const profileSaveQueue = useRef<Promise<void>>(Promise.resolve());
  const [screen, setScreen] = useState<"arena" | "simulation" | "multiplayer" | "packs" | "inventory" | "training" | "campaign" | "catalog" | "trade">("packs");
  const [lastPull, setLastPull] = useState<NonNullable<GlobalProfile["lastPull"]> | null>(profile.lastPull || null);
  const [openingPack, setOpeningPack] = useState(false);
  const [pullSequence, setPullSequence] = useState(0);
  const [batchPulls, setBatchPulls] = useState<NonNullable<GlobalProfile["lastPull"]>[]>([]);
  const [revealPhase, setRevealPhase] = useState<"idle" | "flash" | "pop" | "slide" | "details">("idle");
  const revealTimers = useRef<number[]>([]);
  const [selectedTeamTarget, setSelectedTeamTarget] = useState<string>(profile.team[0] || "");
  const [campaignBattle, setCampaignBattle] = useState<{ config: BattleConfig; seed: number } | null>(null);
  const [campaignWon, setCampaignWon] = useState<boolean | null>(null);
  const [info, setInfo] = useState<Inspect | null>(null);
  const [trainingTarget, setTrainingTarget] = useState("");
  const [trainingSacrifice, setTrainingSacrifice] = useState<string[]>([]);
  const [tradeCode, setTradeCode] = useState("");
  const [tradeSession, setTradeSession] = useState<TradeView | null>(null);
  const [tradeOffer, setTradeOffer] = useState<string[]>([]);
  const [tradeAnimating, setTradeAnimating] = useState(false);
  const appliedTradeRef = useRef("");
  const [moveSelection, setMoveSelection] = useState<{
    source: "field" | "bench";
    sourceIndex: number;
  } | null>(null);
  const [practice, setPractice] = useState<Loadout[]>(
    profile.team.map((characterId) => ({
      characterId: characterId as CharacterId,
      classId: character(characterId)!.base as ClassId,
      level: 0,
      weaponRank: 1,
      equipment: [],
    })),
  );
  const [practiceChoice, setPracticeChoice] = useState<TeamChoice>({});
  const [practiceSize, setPracticeSize] = useState(3);
  const [room, setRoom] = useState<RoomState | null>(null),
    [id, setId] = useState(""),
    [name, setName] = useState(
      localStorage.getItem("chaos-name") || "Challenger",
    ),
    [code, setCode] = useState(""),
    [api, setApi] = useState(safeApiUrl(localStorage.getItem("chaos-api") || defaultApi));
  const [watchedPlayerId, setWatchedPlayerId] = useState("");
  const [status, setStatus] = useState("Chưa kết nối"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [offline, setOffline] = useState(true),
    [simulationMode, setSimulationMode] = useState(false),
    [count, setCount] = useState(18),
    [simulationTeamCount, setSimulationTeamCount] = useState(4),
    [simulationTeamSize, setSimulationTeamSize] = useState(2),
    [simulationShrinkSeconds, setSimulationShrinkSeconds] = useState(DEFAULT_SHRINK_SECONDS),
    [simulationLineups, setSimulationLineups] = useState<CharacterId[][]>(
      Array.from({ length: 8 }, (_, team) =>
        Array.from({ length: 3 }, (_, slot) =>
          team === 0
            ? (["char_01", "char_05", "char_11"][slot] as CharacterId)
            : (ROSTER[((team - 1) * 3 + slot + 4) % ROSTER.length]
                .id as CharacterId),
        ),
      ),
    ),
    [seed, setSeed] = useState(42017),
    [muted, setMuted] = useState(true),
    [low, setLow] = useState(false),
    [help, setHelp] = useState(false),
    [target, setTarget] = useState(0),
    [replace, setReplace] = useState(-1),
    [now, setNow] = useState(Date.now()),
    [replay, setReplay] = useState<ReplayInfo | null>(null);
  const conn = useRef<Connection | null>(null);
  const roomRef = useRef(room);
  roomRef.current = room;
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);
  const report = (s: string) => setError(s);
  function tradeCardVisual(key: string, className = "trade-card-tag") {
    const isCharacter = key.startsWith("character:");
    const cardId = key.slice(isCharacter ? 10 : 5);
    const title = isCharacter ? character(cardId)?.name : itemInfo(cardId)?.name;
    return <div className={className} key={key}>{isCharacter ? <Portrait id={cardId as CharacterId} /> : <ItemSprite id={cardId} />}<span>{title || cardId}</span></div>;
  }
  function connection() {
    conn.current?.close();
    const c = new Connection(api, setRoom, setStatus, report);
    conn.current = c;
    return c;
  }
  useEffect(() => {
    const saved = localStorage.getItem("chaos-session");
    if (saved)
      try {
        const identity = JSON.parse(saved);
        const sessionApi = safeApiUrl(identity.api || defaultApi);
        setApi(sessionApi);
        if (sessionApi !== identity.api) { localStorage.removeItem("chaos-session"); return; }
        const c = new Connection(sessionApi, setRoom, setStatus, report);
        c.identity = identity;
        conn.current = c;
        setId(identity.id);
        setOffline(false);
        c.connect().catch((e) => report(e.message));
      } catch {}
    return () => conn.current?.close();
  }, []);
  useEffect(() => {
    const canLoadReplay =
      !offline &&
      room &&
      (room.phase === "REPLAY_READY" || room.phase === "FINISHED") &&
      room.replay?.round === room.round;
    if (!canLoadReplay || !conn.current) {
      setReplay(null);
      return;
    }
    const { code: roomCode, game, round } = room;
    let active = true;
    setReplay(null);
    conn.current
      .request("/api/rooms/" + roomCode + "/replay")
      .then((r) => {
        if (!active) return;
        const current = r.replay;
        if (
          !current ||
          current.round !== round ||
          (current.format === 1 && current.game !== game)
        )
          throw Error(
            "Replay của vòng này đã thay đổi. Đang tải lại trạng thái.",
          );
        setReplay(current);
      })
      .catch((e) => {
        if (active) report(e.message);
      });
    return () => {
      active = false;
    };
  }, [offline, room?.game, room?.round, room?.phase, room?.code]);
  useEffect(() => {
    let active = true;
    setProfileOnline(false);
    if (!api) { setProfileReady(true); return () => { active = false; }; }
    const headers = { Authorization: `Bearer ${profileIdentity.token}`, "Content-Type": "application/json" };
    fetchProfileWithRetry(`${api}/api/profiles/${profileIdentity.id}`, {
      method: "POST", headers, body: JSON.stringify({ type: "INIT", profile }),
    }).then(async (response) => {
      const result = await response.json() as { error?: string; profile: GlobalProfile };
      if (!response.ok) throw Error(result.error || "Không tải được hồ sơ người chơi");
      if (!active) return;
      setProfile(result.profile);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(result.profile));
      setProfileOnline(true);
      setProfileReady(true);
    }).catch((error) => {
      if (active) {
        setProfileReady(true);
        if (error instanceof TypeError) report("Không kết nối được máy chủ hồ sơ. Kiểm tra VITE_API_URL, HTTPS và danh sách ALLOWED_ORIGINS; tạm thời đang dùng hồ sơ lưu trên thiết bị.");
        else report(error instanceof Error ? error.message : "Không tải được hồ sơ người chơi");
      }
    });
    return () => { active = false; };
  }, [api, profileIdentity.id, profileIdentity.token]);
  async function run(fn: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      report(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  async function tradeRequest(path: string, body?: unknown) {
    const response = await fetch(`${api}/api/trades${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${profileIdentity.token}`, "X-Profile-ID": profileIdentity.id },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).catch(() => { throw Error("Không kết nối được máy chủ trao đổi. Kiểm tra địa chỉ API và kết nối mạng."); });
    const result = await response.json() as { error?: string; trade?: TradeView };
    if (!response.ok) throw Error(result.error || "Thao tác trao đổi thất bại");
    return result;
  }
  async function startTrade(join = false) {
    const codeValue = tradeCode.trim().toUpperCase();
    const result = await tradeRequest(join ? `/${codeValue}/join` : "", { name });
    setTradeSession(result.trade!);
    setTradeCode(result.trade!.code);
    setTradeOffer([]);
    appliedTradeRef.current = "";
  }
  async function refreshTrade() {
    if (!tradeSession) return;
    const result = await tradeRequest(`/${tradeSession.code}`);
    setTradeSession(result.trade!);
  }
  async function copyTradeCode() {
    try { await navigator.clipboard.writeText(tradeSession?.code || ""); setError("Đã sao chép ID phiên."); }
    catch { setError("Hãy chọn và sao chép ID phiên để gửi cho người chơi khác."); }
  }
  useEffect(() => {
    if (!tradeSession || tradeSession.completed) return;
    const timer = window.setInterval(() => { void refreshTrade().catch((error) => report(error.message)); }, 2500);
    return () => window.clearInterval(timer);
  }, [tradeSession?.code, tradeSession?.completed, api, profileIdentity.id, profileIdentity.token]);
  useEffect(() => {
    if (!tradeSession?.completed) return;
    setTradeAnimating(true);
    const timer = window.setTimeout(() => setTradeAnimating(false), 2800);
    return () => window.clearTimeout(timer);
  }, [tradeSession?.code, tradeSession?.completed]);
  useEffect(() => {
    if (!tradeSession?.completed || appliedTradeRef.current === tradeSession.code) return;
    appliedTradeRef.current = tradeSession.code;
    void fetchProfileWithRetry(`${api}/api/profiles/${profileIdentity.id}`, { headers: { Authorization: `Bearer ${profileIdentity.token}` } })
      .then(async (response) => {
        const result = await response.json() as { error?: string; profile: GlobalProfile };
        if (!response.ok) throw Error(result.error || "Không tải lại được hồ sơ sau trao đổi");
        setProfile(result.profile);
        localStorage.setItem(PROFILE_KEY, JSON.stringify(result.profile));
      }).catch((error) => report(error instanceof Error ? error.message : String(error)));
  }, [tradeSession?.completed, tradeSession?.code, api, profileIdentity.id, profileIdentity.token]);
  function enter(join = false, spectator = false) {
    run(async () => {
      localStorage.setItem("chaos-name", name);
      localStorage.setItem("chaos-api", api);
      const c = connection();
      const identity = await c.enter(
        name,
        join ? code.trim().toUpperCase() : undefined,
        spectator,
      );
      setId(identity.id);
      setOffline(false);
    });
  }
  function act(action: Action) {
    return run(() => conn.current!.action(action));
  }
  function saveProfile(next: GlobalProfile) {
    setProfile(next);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    if (profileReady && profileOnline) {
      profileSaveQueue.current = profileSaveQueue.current.catch(() => {}).then(async () => {
        const response = await fetchProfileWithRetry(`${api}/api/profiles/${profileIdentity.id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${profileIdentity.token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ type: "SAVE", profile: next }),
        });
        if (!response.ok) throw Error("Không lưu được hồ sơ trên máy chủ");
      }).catch((e) => report(e instanceof Error ? e.message : String(e)));
    }
  }
  useEffect(() => {
    const today = dailyQuestDay(now);
    if (profile.missionDay === today) return;
    saveProfile({ ...profile, missionDay: today, missions: { draw: 0, win: 0, campaign: 0 }, claimedMissions: [] });
  }, [now, profile.missionDay]);
  function profileSyncAction(team = profile.team, equipment = profile.equipment, source = profile) {
    return {
      type: "SYNC_PROFILE" as const,
      cards: source.cards,
      itemCards: source.itemCards,
      team,
      equipment: team.map((characterId) => ({ characterId, items: equipment[characterId] || [] })),
      campaignStage: profile.campaignStage,
    };
  }
  function syncProfileToRoom() {
    if (room?.phase !== "LOBBY" || !me || me.ready) return Promise.resolve();
    return act(profileSyncAction());
  }
  const queuedPacks = Math.min(PACK_CAPACITY, profile.packs + Math.floor(Math.max(0, now - profile.lastPackAt) / 60_000));
  const packWait = queuedPacks >= PACK_CAPACITY ? 0 : Math.max(0, 60_000 - ((now - profile.lastPackAt) % 60_000));
  function openPack(count = 1) {
    const amount = Math.min(count, queuedPacks);
    if (amount <= 0 || openingPack) return;
    setOpeningPack(true);
    setRevealPhase("flash");
    revealTimers.current.forEach((timer) => window.clearTimeout(timer));
    revealTimers.current = [
      window.setTimeout(() => setRevealPhase("pop"), 320),
      window.setTimeout(() => setRevealPhase("slide"), 1050),
      window.setTimeout(() => setRevealPhase("details"), 1650),
    ];
    const cards = profile.cards.map((card) => ({ ...card }));
    const itemCards = profile.itemCards.map((card) => ({ ...card }));
    let pulledResult: NonNullable<GlobalProfile["lastPull"]> | undefined;
    let evolvedPull: NonNullable<GlobalProfile["lastPull"]> | undefined;
    const pulledCards: NonNullable<GlobalProfile["lastPull"]>[] = [];
    for (let index = 0; index < amount; index++) {
      const roll = Math.random() * 100;
      const tier = roll < 75 ? "T1" : roll < 95 ? "T2" : roll < 99 ? "T3" : "T4";
      const pool = [
        ...ROSTER.filter((entry) => cardTier(entry.tier) === tier).map((entry) => ({ kind: "character" as const, id: entry.id, tier })),
        ...CATALOG_ITEMS.filter((entry) => cardTier(entry.rarity) === tier).map((entry) => ({ kind: "item" as const, id: entry.id, tier })),
      ];
      const pulled = pool[Math.floor(Math.random() * pool.length)] || { kind: "character" as const, id: ROSTER[0].id, tier: "T1" };
      let isDuplicate = false, xpGained = 0, oldXp = 0, experience = 0, oldLevel = 1, level = 1, leveledUp = false, evolved = false;
      if (pulled.kind === "character") {
        const existing = cards.find((card) => card.characterId === pulled.id);
        if (existing) {
          isDuplicate = true; oldXp = existing.xp; oldLevel = existing.level; xpGained = existing.level < 10 ? DUPLICATE_CARD_XP : 0;
          if (xpGained) Object.assign(existing, addCardXp(existing, xpGained));
          level = existing.level; experience = existing.xp; leveledUp = level > oldLevel;
          evolved = cardEvolution(pulled.tier, level).tierIndex > cardEvolution(pulled.tier, oldLevel).tierIndex;
        } else cards.push({ characterId: pulled.id as CharacterId, level: 1, xp: 0 });
      } else {
        const existing = itemCards.find((card) => card.itemId === pulled.id);
        if (existing) {
          isDuplicate = true; oldXp = existing.xp; oldLevel = existing.level; xpGained = existing.level < 10 ? DUPLICATE_CARD_XP : 0;
          if (xpGained) Object.assign(existing, addCardXp(existing, xpGained));
          level = existing.level; experience = existing.xp; leveledUp = level > oldLevel;
          evolved = cardEvolution(pulled.tier, level).tierIndex > cardEvolution(pulled.tier, oldLevel).tierIndex;
        } else itemCards.push({ itemId: pulled.id, level: 1, xp: 0 });
      }
      const displayTier = isDuplicate ? cardEvolution(pulled.tier, level).tier : tier;
      pulledResult = { ...pulled, tier: displayTier, rarity: tierRarity(displayTier), duplicate: isDuplicate, xpGained, oldXp, experience, oldLevel, level, leveledUp, evolved, oldTier: tier };
      pulledCards.push({ ...pulledResult });
      if (evolved) evolvedPull = pulledResult;
    }
    const remainingPacks = queuedPacks - amount;
    const accruedAt = profile.packs + Math.floor(Math.max(0, now - profile.lastPackAt) / 60_000) >= PACK_CAPACITY ? now : profile.lastPackAt + Math.floor(Math.max(0, now - profile.lastPackAt) / 60_000) * 60_000;
    const next: GlobalProfile = {
      ...profile,
      cards,
      itemCards,
      packs: remainingPacks,
      lastPackAt: accruedAt,
      lastPull: evolvedPull ? { ...evolvedPull, batchCount: amount } : pulledResult ? { ...pulledResult, batchCount: amount } : undefined,
      missions: { ...profile.missions, draw: profile.missions.draw + amount },
      team: profile.team,
    };
    setLastPull(next.lastPull!);
    setBatchPulls(pulledCards);
    setPullSequence((sequence) => sequence + 1);
    saveProfile(next);
    if (!offline && room?.phase === "LOBBY" && me && !me.ready)
      conn.current?.action(profileSyncAction(next.team, next.equipment, next)).catch((e) => report(e.message));
  }
  function closeReveal() {
    revealTimers.current.forEach((timer) => window.clearTimeout(timer));
    revealTimers.current = [];
    setRevealPhase("idle");
    setOpeningPack(false);
  }
  function claimMission(mission: "draw" | "win" | "campaign") {
    const goal = mission === "draw" ? 3 : 1;
    if (profile.missions[mission] < goal || profile.claimedMissions.includes(mission) || queuedPacks >= PACK_CAPACITY) return;
    const accruedAt = profile.packs + Math.floor(Math.max(0, now - profile.lastPackAt) / 60_000) >= PACK_CAPACITY ? now : profile.lastPackAt + Math.floor(Math.max(0, now - profile.lastPackAt) / 60_000) * 60_000;
    const nextPacks = queuedPacks + 1;
    saveProfile({ ...profile, packs: nextPacks, lastPackAt: nextPacks >= PACK_CAPACITY ? now : accruedAt, claimedMissions: [...profile.claimedMissions, mission] });
  }
  function toggleProfileTeam(characterId: CharacterId) {
    const includes = profile.team.includes(characterId);
    const team = includes
      ? profile.team.length > 1 ? profile.team.filter((id) => id !== characterId) : profile.team
      : profile.team.length < 3 ? [...profile.team, characterId] : profile.team;
    const equipment = { ...profile.equipment };
    if (!team.includes(characterId)) delete equipment[characterId];
    const next = { ...profile, team, equipment };
    saveProfile(next);
    if (offline) {
      setPractice(team.map((id) => ({
        characterId: id,
        classId: character(id)!.base as ClassId,
        level: profile.cards.find((card) => card.characterId === id)?.level || 1,
        weaponRank: 1,
        equipment: profile.equipment[id] || [],
        equipmentLevels: Object.fromEntries((profile.equipment[id] || []).map((itemId) => [itemId, profile.itemCards.find((card) => card.itemId === itemId)?.level || 1])),
      })));
    } else if (room?.phase === "LOBBY" && me && !me.ready) {
      conn.current?.action(profileSyncAction(team, equipment, next)).catch((e) => report(e.message));
    }
  }
  function equipProfileItem(characterId: CharacterId, itemId: string) {
    const owned = profile.itemCards.some((card) => card.itemId === itemId);
    if (!owned || !profile.team.includes(characterId)) return;
    const info = itemInfo(itemId);
    if (!info) return;
    const equipment = Object.fromEntries(Object.entries(profile.equipment).map(([id, items]) => [id, [...items]]));
    const equippedOnTarget = equipment[characterId]?.[0];
    if (equippedOnTarget === itemId) delete equipment[characterId];
    else {
      for (const [ownerId, items] of Object.entries(equipment)) if (items.includes(itemId)) delete equipment[ownerId];
      if (equippedOnTarget) delete equipment[characterId];
      equipment[characterId] = [itemId];
    }
    const next = { ...profile, equipment };
    saveProfile(next);
    if (offline) setPractice((previous) => previous.map((unit) => unit.characterId === characterId ? { ...unit, level: profile.cards.find((card) => card.characterId === characterId)?.level || 1, equipment: equipment[characterId] || [], equipmentLevels: Object.fromEntries((equipment[characterId] || []).map((id) => [id, profile.itemCards.find((card) => card.itemId === id)?.level || 1])) } : unit));
    if (!offline && room?.phase === "LOBBY" && me && !me.ready) conn.current?.action(profileSyncAction(next.team, equipment, next)).catch((e) => report(e.message));
  }
  function cardByKey(key: string) {
    const [kind, id] = key.split(":", 2);
    return kind === "character"
      ? profile.cards.find((card) => card.characterId === id)
      : kind === "item"
        ? profile.itemCards.find((card) => card.itemId === id)
        : undefined;
  }
  function canSacrifice(key: string) {
    if (key.startsWith("character:")) return !profile.team.includes(key.slice(10) as CharacterId) && !!cardByKey(key);
    if (key.startsWith("item:")) return !!cardByKey(key) && !Object.values(profile.equipment).some((ids) => ids.includes(key.slice(5)));
    return false;
  }
  const trainingMaterials = trainingSacrifice.filter(canSacrifice).map(cardByKey).filter((card): card is NonNullable<ReturnType<typeof cardByKey>> => Boolean(card));
  const trainingRecipient = cardByKey(trainingTarget);
  const trainingXp = trainingMaterials.reduce((total, card) => total + cardTotalXp(card), 0);
  const trainingPreview = trainingMaterials.length > 0 && trainingRecipient && !trainingSacrifice.includes(trainingTarget)
    ? addCardXp(trainingRecipient, trainingXp)
    : null;
  const trainingBaseTier = trainingTarget.startsWith("character:")
    ? character(trainingTarget.slice("character:".length))?.tier || "T1"
    : itemInfo(trainingTarget.slice("item:".length))?.rarity || 0;
  const trainingEvolution = trainingPreview ? cardEvolution(trainingBaseTier, trainingPreview.level).tier : "";
  function trainCard() {
    if (!trainingPreview || !trainingMaterials.length || !trainingRecipient || trainingSacrifice.includes(trainingTarget) || !trainingSacrifice.every(canSacrifice)) return;
    const [targetKind, targetId] = trainingTarget.split(":", 2);
    const materialKeys = new Set(trainingSacrifice);
    const xp = trainingXp;
    const evolutionBase = targetKind === "character" ? character(targetId)?.tier || "T1" : itemInfo(targetId)?.rarity || 0;
    const oldTier = cardEvolution(evolutionBase, trainingRecipient.level).tier;
    const newTier = cardEvolution(evolutionBase, trainingPreview.level).tier;
    const cards = profile.cards.map((card) => card.characterId === targetId && targetKind === "character" ? { ...card, ...addCardXp(card, xp) } : card).filter((card) => !materialKeys.has(`character:${card.characterId}`));
    const itemCards = profile.itemCards.map((card) => card.itemId === targetId && targetKind === "item" ? { ...card, ...addCardXp(card, xp) } : card).filter((card) => !materialKeys.has(`item:${card.itemId}`));
    const equipment = profile.equipment;
    const next = { ...profile, cards, itemCards, equipment };
    saveProfile(next);
    if (offline) setPractice((previous) => previous.map((unit) => {
      const characterId = unit.characterId as CharacterId;
      const equipped = equipment[characterId] || [];
      return { ...unit, level: cards.find((card) => card.characterId === characterId)?.level || unit.level, equipment: equipped, equipmentLevels: Object.fromEntries(equipped.map((id) => [id, itemCards.find((card) => card.itemId === id)?.level || 1])) };
    }));
    if (!offline && room?.phase === "LOBBY" && me && !me.ready) conn.current?.action(profileSyncAction(next.team, equipment, next)).catch((e) => report(e.message));
    setTrainingSacrifice([]);
    if (newTier !== oldTier) {
      const id = targetId;
      setLastPull({ kind: targetKind as "character" | "item", id, tier: newTier, rarity: tierRarity(newTier), duplicate: false, evolved: true, oldTier, batchCount: 0 });
      setPullSequence((sequence) => sequence + 1);
      setOpeningPack(true);
      setRevealPhase("flash");
      revealTimers.current.forEach((timer) => window.clearTimeout(timer));
      revealTimers.current = [window.setTimeout(() => setRevealPhase("pop"), 220), window.setTimeout(() => setRevealPhase("details"), 700)];
    }
  }
  function dropInventoryCard(event: React.DragEvent, characterId: CharacterId) {
    event.preventDefault();
    try {
      const payload = JSON.parse(event.dataTransfer.getData("application/json")) as { kind: string; id: string };
      if (payload.kind === "character") toggleProfileTeam(payload.id as CharacterId);
      if (payload.kind === "item") equipProfileItem(characterId, payload.id);
    } catch { /* ignore invalid drag data */ }
  }
  function launchCampaign() {
    const base = debugConfig(2);
    const playerLoadouts: Loadout[] = profile.team.map((characterId) => ({
      characterId,
      classId: character(characterId)!.base as ClassId,
      level: profile.cards.find((card) => card.characterId === characterId)?.level || 1,
      weaponRank: 1,
      equipment: profile.equipment[characterId] || [],
      equipmentLevels: Object.fromEntries((profile.equipment[characterId] || []).map((id) => [id, profile.itemCards.find((card) => card.itemId === id)?.level || 1])),
    }));
    const opponentLoadouts: Loadout[] = Array.from({ length: Math.min(3, Math.max(1, playerLoadouts.length)) }, (_, index) => {
      const entry = ROSTER[(profile.campaignStage * 3 + index + 5) % ROSTER.length];
      return { characterId: entry.id as CharacterId, classId: entry.base as ClassId, level: Math.min(10, 1 + Math.floor(profile.campaignStage / 2)), weaponRank: 1, equipment: [] };
    });
    base.teams = [
      { id: "team-player", name, loadouts: playerLoadouts },
      { id: "team-rival", name: `Đối thủ ải ${profile.campaignStage + 1}`, loadouts: opponentLoadouts },
    ];
    setCampaignWon(null);
    setCampaignBattle({ config: base, seed: 51000 + profile.campaignStage * 97 + Math.floor(Math.random() * 97) });
  }
  function finishCampaign(winningTeam: string) {
    if (!campaignBattle || campaignWon !== null) return;
    const won = winningTeam === "team-player";
    setCampaignWon(won);
    if (!won) return;
    const accruedAt = profile.packs + Math.floor(Math.max(0, now - profile.lastPackAt) / 60_000) >= PACK_CAPACITY
      ? now
      : profile.lastPackAt + Math.floor(Math.max(0, now - profile.lastPackAt) / 60_000) * 60_000;
    const packs = Math.min(PACK_CAPACITY, queuedPacks + 3);
    saveProfile({
      ...profile,
      packs,
      lastPackAt: packs >= PACK_CAPACITY ? now : accruedAt,
      campaignStage: profile.campaignStage + 1,
      missions: { ...profile.missions, campaign: profile.missions.campaign + 1 },
    });
  }
  const me = room?.players.find((p) => p.id === id),
    host = room?.host === id;
  useEffect(() => {
    if (!room?.players.length) { setWatchedPlayerId(""); return; }
    if (!room.players.some((player) => player.id === watchedPlayerId)) setWatchedPlayerId(id || room.players.find((player) => !player.spectator)?.id || room.players[0].id);
  }, [room?.players, id, watchedPlayerId]);
  useEffect(() => {
    if (offline || room?.phase !== "LOBBY" || !me || me.ready || !profileReady) {
      setProfileRoomSynced(false);
      return;
    }
    const currentCards = JSON.stringify(me.cards || []);
    const desiredCards = JSON.stringify(profile.cards);
    const currentItems = JSON.stringify(me.itemCards || []);
    const desiredItems = JSON.stringify(profile.itemCards);
    const currentTeam = JSON.stringify(me.loadouts.map((unit) => unit.characterId));
    const desiredTeam = JSON.stringify(profile.team);
    const currentEquipment = JSON.stringify(me.loadouts.map((unit) => ({ characterId: unit.characterId, items: unit.equipment })));
    const desiredEquipment = JSON.stringify(profile.team.map((characterId) => ({ characterId, items: profile.equipment[characterId] || [] })));
    if (currentCards !== desiredCards || currentItems !== desiredItems || currentTeam !== desiredTeam || currentEquipment !== desiredEquipment || (me.campaignStage || 0) !== profile.campaignStage) {
      setProfileRoomSynced(false);
      conn.current?.action(profileSyncAction()).then(() => setProfileRoomSynced(true)).catch((e) => report(e.message));
    } else setProfileRoomSynced(true);
  }, [offline, room?.phase, room?.round, me?.id, me?.ready, me?.cards, me?.itemCards, me?.loadouts, me?.campaignStage, profileReady, profile]);
  useEffect(() => {
    if (!room || room.phase !== "FINISHED" || !me) return;
    const matchKey = `${room.code}:${room.game}:${room.round}`;
    if (profile.processedMatches.includes(matchKey)) return;
    const won = room.champion === id;
    const next = { ...profile, processedMatches: [...profile.processedMatches, matchKey] };
    if (won) {
      const accruedAt = profile.packs + Math.floor(Math.max(0, now - profile.lastPackAt) / 60_000) >= PACK_CAPACITY ? now : profile.lastPackAt + Math.floor(Math.max(0, now - profile.lastPackAt) / 60_000) * 60_000;
      next.packs = Math.min(PACK_CAPACITY, queuedPacks + (room.mode === "campaign" ? 3 : 5));
      next.lastPackAt = next.packs >= PACK_CAPACITY ? now : accruedAt;
      next.missions = { ...profile.missions };
      if (room.mode === "campaign") {
        next.campaignStage = profile.campaignStage + 1;
        next.missions.campaign++;
      } else next.missions.win++;
    }
    saveProfile(next);
  }, [room?.phase, room?.game, room?.round, room?.champion, room?.code, id, profile, now]);
  const debug = useMemo(() => {
    if (simulationMode) {
      const loadout = (characterId: CharacterId): Loadout => ({
        characterId,
        classId: character(characterId)!.base as ClassId,
        level: 0,
        weaponRank: 1,
        equipment: [],
      });
      return {
        width: DEFAULT_ARENA_SIZE,
        height: DEFAULT_ARENA_SIZE,
        shrinkSeconds: simulationShrinkSeconds,
        teams: Array.from({ length: simulationTeamCount }, (_, index) => ({
          id: `team-${String(index).padStart(2, "0")}`,
          name: index === 0 ? name : `Đội mô phỏng ${index + 1}`,
          loadouts: simulationLineups[index]
            .slice(0, simulationTeamSize)
            .map((characterId, slot) =>
              index === 0
                ? {
                    ...(practice[slot] || loadout(characterId)),
                    characterId,
                    classId: character(characterId)!.base as ClassId,
                  }
                : loadout(characterId),
            ),
          choice:
            index === 0 &&
            validChoice(
              simulationLineups[index]
                .slice(0, simulationTeamSize)
                .map(loadout),
              practiceChoice,
            )
              ? practiceChoice
              : {},
        })),
      } satisfies BattleConfig;
    }
    const total = Math.max(2, count),
      size = Math.min(practiceSize, total - 1);
    const c = debugConfig(total);
    const rest = total - size,
      enemyTeams = Math.ceil(rest / 3);
    c.teams = [
      { id: "team-00", name, loadouts: practice.slice(0, size) },
      ...Array.from({ length: enemyTeams }, (_, i) => ({
        id: "team-" + String(i + 1).padStart(2, "0"),
        loadouts: Array.from(
          { length: Math.min(3, rest - i * 3) },
          () => practice[0],
        ),
      })),
    ];
    let cursor = 0;
    c.teams = c.teams.map((t, index) => ({
      ...t,
      loadouts:
        index === 0
          ? practice.slice(0, t.loadouts.length)
          : t.loadouts.map(() => {
              const ch = ROSTER[(cursor++ + 7) % ROSTER.length];
              return {
                characterId: ch.id as CharacterId,
                classId: ch.base as ClassId,
                level: 0,
                equipment: [],
              };
            }),
      choice:
        index === 0 &&
        validChoice(practice.slice(0, t.loadouts.length), practiceChoice)
          ? practiceChoice
          : {},
    }));
    return c;
  }, [
    count,
    practice,
    practiceChoice,
    practiceSize,
    simulationMode,
    simulationTeamCount,
    simulationTeamSize,
    simulationShrinkSeconds,
    simulationLineups,
    name,
  ]);
  const slots = offline ? debug.teams[0].loadouts : me?.loadouts || [];
  const selected = slots[Math.min(target, Math.max(0, slots.length - 1))];
  useEffect(() => {
    setTarget((t) => Math.max(0, Math.min(t, slots.length - 1)));
    setReplace(-1);
  }, [slots.length]);
  function pickCharacter(characterId: CharacterId) {
    if (offline && simulationMode) {
      setSimulationLineups((previous) =>
        previous.map((lineup, index) =>
          index === 0
            ? lineup.map((id, slot) => (slot === target ? characterId : id))
            : lineup,
        ),
      );
      setPracticeChoice({});
      setReplace(-1);
    } else if (offline) {
      setPractice((prev) =>
        prev.map((l, i) =>
          i === Math.min(target, slots.length - 1)
            ? {
                characterId,
                classId: character(characterId)!.base as ClassId,
                level: 0,
                weaponRank: 1,
                equipment: [],
              }
            : l,
        ),
      );
      setPracticeChoice({});
      setReplace(-1);
    } else if (me)
      act({
        type: "SET_TEAM",
        characters: me.loadouts.map((l, i) =>
          i === target ? characterId : l.characterId || "char_01",
        ),
      });
  }
  function equipPractice(id: string) {
    const item = itemInfo(id);
    if (!item || !selected) return;
    const indices = selected.equipment
        .map((x, i) => (itemInfo(x)?.slot === item.slot ? i : -1))
        .filter((i) => i >= 0),
      limit = item.slot === "accessory" ? 2 : 1;
    if (item.slot === "accessory" && selected.equipment.includes(id)) {
      setError("Nhân vật đã có phụ kiện này.");
      return;
    }
    if (indices.length >= limit && !indices.includes(replace)) {
      setError("Hết ô. Bấm Chọn thay ở món muốn thay rồi trang bị lại.");
      return;
    }
    setPractice((prev) =>
      prev.map((l, i) => {
        if (i !== Math.min(target, slots.length - 1)) return l;
        const equipment = [...l.equipment];
        if (indices.length >= limit) equipment[replace] = id;
        else equipment.push(id);
        return { ...l, equipment };
      }),
    );
    setReplace(-1);
  }
  function inspectItem(id: string, actions?: Inspect["actions"]) {
    setInfo({ kind: "item", id, loadout: selected, actions });
  }
  function toggleCardTeam(characterId: CharacterId) {
    if (!me) return;
    const current = me.loadouts.map((unit) => unit.characterId as CharacterId);
    const next = current.includes(characterId)
      ? current.filter((id) => id !== characterId)
      : current.length < 3
        ? [...current, characterId]
        : current;
    if (next.length) act({ type: "SET_TEAM", characters: next });
  }
  const replayMatchesRoom =
    !offline &&
    !!room &&
    !!room.replay &&
    (room.phase === "REPLAY_READY" || room.phase === "FINISHED") &&
    room.replay.round === room.round &&
    replay?.round === room.round &&
    (replay.format === 0 || replay.game === room.game);
  const currentReplay = replayMatchesRoom ? replay : null;
  const config = offline ? debug : currentReplay?.config;
  const inventoryLoadouts: Loadout[] = profile.team.map((characterId) => ({
    characterId,
    classId: character(characterId)!.base as ClassId,
    level: profile.cards.find((card) => card.characterId === characterId)?.level || 1,
    weaponRank: 1,
    equipment: profile.equipment[characterId] || [],
    equipmentLevels: Object.fromEntries((profile.equipment[characterId] || []).map((id) => [id, profile.itemCards.find((card) => card.itemId === id)?.level || 1])),
  }));
  const eqArgs = { target, ...(replace >= 0 ? { replace } : {}) };
  function itemName(id: string | null) {
    return (
      (id && (character(id)?.name || ITEMS.find((i) => i.id === id)?.name)) ||
      "Đã mua"
    );
  }
  const revealCharacter = lastPull?.kind === "character" ? character(lastPull.id) : undefined;
  const revealItem = lastPull?.kind === "item" ? itemInfo(lastPull.id) : undefined;
  const revealDescription = revealCharacter
    ? revealCharacter.passive?.[1] || revealCharacter.skill?.[1] || revealCharacter.role
    : revealItem?.description || "Một vật phẩm sưu tầm có thể trang bị cho nhân vật trong Kho đồ.";
  function moveUnit(
    source: "field" | "bench",
    sourceIndex: number,
    destination: "field" | "bench",
    destinationIndex: number,
  ) {
    setMoveSelection(null);
    return act({
      type: "MOVE_UNIT",
      source,
      sourceIndex,
      destination,
      destinationIndex,
    });
  }
  function dropUnit(
    event: React.DragEvent,
    destination: "field" | "bench",
    destinationIndex: number,
  ) {
    event.preventDefault();
    try {
      const value = JSON.parse(
        event.dataTransfer.getData("application/x-circle-unit"),
      );
      if (
        (value.source === "field" || value.source === "bench") &&
        Number.isInteger(value.sourceIndex)
      )
        moveUnit(
          value.source,
          value.sourceIndex,
          destination,
          destinationIndex,
        );
    } catch {}
  }
  const countdown = room?.deadline
    ? Math.max(
        0,
        Math.ceil((room.deadline - now - (conn.current?.offset || 0)) / 1000),
      )
    : 0;
  const fieldCapacity = offline ? slots.length : me?.unitLimit || 1;
  const readyPlayers = room?.players.filter((player) => !player.spectator) || [];
  const readyToStart = !!room && readyPlayers.length >= (room.mode === "campaign" ? 1 : 2) && (room.mode === "campaign" ? readyPlayers.length === 1 : true) && readyPlayers.every((player) => player.ready);
  const canRearrange =
    !offline && room?.phase === "PREPARATION" && !!me && !me.ready;
  useEffect(() => {
    if (!canRearrange) setMoveSelection(null);
  }, [canRearrange, room?.round]);
  return (
    <div className="app">
      <header>
        <a className="brand" href="./" aria-label="RiseOn Ultimate TCG">
          <span className="brand-mark" aria-hidden="true">
            <span className="brand-portrait brand-portrait-left">
              <img
                src={`${import.meta.env.BASE_URL}avatars/char_02.png`}
                alt=""
              />
            </span>
            <span className="brand-portrait brand-portrait-right">
              <img
                src={`${import.meta.env.BASE_URL}avatars/char_10.png`}
                alt=""
              />
            </span>
            <svg className="brand-impact" viewBox="0 0 48 48">
              <path d="m24 2 5.2 13.1 14.1 1.1-10.7 9.2 3.5 13.8L24 31.7 11.9 39.2l3.5-13.8L4.7 16.2l14.1-1.1z" />
              <path d="m24 12 3.3 8.1 8.8.7-6.7 5.8 2.2 8.6-7.6-4.7-7.6 4.7 2.2-8.6-6.7-5.8 8.8-.7z" />
            </svg>
          </span>
          <span className="brand-name">
            <strong>RISEON</strong>
            <small>ULTIMATE TCG</small>
          </span>
        </a>
        <nav>
          <button className={screen === "packs" ? "active" : ""} onClick={() => setScreen("packs")}>Mở thẻ <small>{queuedPacks}</small></button>
          <button className={screen === "inventory" ? "active" : ""} onClick={() => setScreen("inventory")}>Kho đồ</button>
          <button className={screen === "training" ? "active" : ""} onClick={() => setScreen("training")}>Luyện bài</button>
          <button className={screen === "trade" ? "active" : ""} onClick={() => setScreen("trade")}>Trao đổi bài</button>
          <button className={screen === "campaign" ? "active" : ""} onClick={() => setScreen("campaign")}>Đi ải</button>
          <button onClick={() => setHelp(!help)}>Cách chơi</button>
          <button className={screen === "catalog" ? "active" : ""} onClick={() => setScreen("catalog")}>Catalog</button>
          <button
            className={screen === "simulation" ? "active" : ""}
            onClick={() => {
              setScreen("simulation");
              setOffline(true);
              setSimulationMode(true);
            }}
          >
            Mô phỏng
          </button>
          <button
            className={screen === "multiplayer" ? "active" : ""}
            onClick={() => {
              setScreen("multiplayer");
              setOffline(false);
              setSimulationMode(false);
            }}
          >
            Multiplayer
          </button>
        </nav>
        <button className="icon" onClick={() => setMuted(!muted)}>
          {muted ? "Âm thanh: Tắt" : "Âm thanh: Bật"}
        </button>
      </header>
      <main>
        <div className="page-title">
          <div className="eyebrow">BOUNCE. BATTLE. SURVIVE.</div>
          <h1>{screen === "packs" ? "Mở thẻ." : screen === "inventory" ? "Kho đồ." : screen === "training" ? "Luyện bài." : screen === "trade" ? "Trao đổi bài." : screen === "campaign" ? "Đi ải." : screen === "catalog" ? "Catalog." : screen === "simulation" ? "Mô phỏng." : screen === "multiplayer" ? "Đấu trường." : <>Mỗi vòng đấu.<br /><span>Một quyết định mới.</span></>}</h1>
          <p>{screen === "packs" ? "Mỗi pack mở ra một thẻ nhân vật hoặc vật phẩm." : screen === "inventory" ? "Xây team, trang bị và xem chi tiết bộ sưu tập thẻ." : screen === "training" ? "Hy sinh thẻ dư để truyền EXP cho thẻ bạn muốn nâng." : screen === "trade" ? "Tạo phiên, chọn thẻ muốn đổi và xác nhận cùng người chơi khác." : screen === "campaign" ? "Vượt ải trong trận cục bộ để kiếm thêm pack." : screen === "catalog" ? "Tra cứu nhân vật, vật phẩm, kỹ năng và liên kết." : "Xây đội hình. Xem hỗn loạn bùng nổ."}</p>
        </div>
        {help && (
          <section className="notice">
            Mở pack để nhận thẻ nhân vật hoặc vật phẩm. Trong Kho đồ, kéo nhân vật
            vào đội (tối đa 3) và kéo vật phẩm lên nhân vật để trang bị. Tạo hoặc
            tham gia phòng rồi sẵn sàng; hai đội chiến đấu trên đấu trường tròn.
            Thắng PvP nhận 5 pack, thắng ải nhận 3 pack.
          </section>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
            <button onClick={() => setError("")}>×</button>
          </div>
        )}
        {screen === "catalog" ? <section className="catalog-page"><CatalogLibrary inspect={setInfo} initialOpen /></section> : screen === "trade" ? <section className="profile-screen trade-screen">
          {!tradeSession ? <div className="trade-lobby panel">
            <div className="panel-title"><h2>Tạo hoặc tham gia phiên</h2><b>{profileOnline ? "Hồ sơ đã kết nối" : "Cần kết nối máy chủ"}</b></div>
            {!profileOnline && <p className="muted">{!api ? "Backend URL chưa được cấu hình. Trong tab Multiplayer, nhập HTTPS URL của Cloudflare Worker để bật hồ sơ và trao đổi." : "Trao đổi cần máy chủ hồ sơ. Kiểm tra Backend URL, HTTPS và ALLOWED_ORIGINS của Worker nếu không kết nối được."}</p>}
            <label>Tên hiển thị<input value={name} maxLength={24} onChange={(event) => setName(event.target.value)} /></label>
            <button className="primary wide" disabled={!profileOnline || !name.trim()} onClick={() => void run(() => startTrade(false))}>Tạo phiên mới</button>
            <div className="trade-join"><input value={tradeCode} maxLength={8} placeholder="Nhập ID phiên 8 ký tự" onChange={(event) => setTradeCode(event.target.value.toUpperCase())} /><button disabled={!profileOnline || tradeCode.trim().length !== 8 || !name.trim()} onClick={() => void run(() => startTrade(true))}>Tham gia</button></div>
          </div> : <>
            <div className="trade-session-head panel"><div><span className="trade-kicker">ID PHIÊN</span><strong>{tradeSession.code}</strong><small>Gửi mã này cho người muốn trao đổi với bạn.</small></div><div className="trade-session-buttons"><button onClick={() => void copyTradeCode()}>Sao chép ID</button><button onClick={() => { setTradeSession(null); setTradeOffer([]); }}>Đóng phiên</button></div></div>
            <div className="trade-players">{tradeSession.players.map((player) => <article key={player.profileId} className={`trade-player ${player.ready ? "ready" : ""}`}><header><div><b>{player.name}{player.profileId === tradeSession.host ? " · Chủ phiên" : ""}</b><small>{player.ready ? "SẴN SÀNG" : "ĐANG CHỌN BÀI"}</small></div><span>{player.offer.length} lá</span></header><div className="trade-player-offer">{player.offer.length ? player.offer.map((key) => tradeCardVisual(key)) : <small>Chưa chọn bài</small>}</div></article>)}</div>
            {tradeAnimating && tradeSession.players.length === 2 && <div className="trade-animation" role="status" aria-label="Đang chuyển bài giữa hai người chơi"><div className="trade-animation-side trade-animation-left"><b>{tradeSession.players[0].name}</b><div>{tradeSession.players[0].offer.map((key) => tradeCardVisual(key, "trade-flying-card"))}</div></div><span className="trade-animation-spark" aria-hidden="true">⇄</span><div className="trade-animation-side trade-animation-right"><b>{tradeSession.players[1].name}</b><div>{tradeSession.players[1].offer.map((key) => tradeCardVisual(key, "trade-flying-card"))}</div></div></div>}
            {!tradeSession.completed && tradeSession.players.length < 2 && <p className="trade-waiting">Đang chờ người chơi khác tham gia bằng ID phiên.</p>}
            {!tradeSession.completed && tradeSession.players.length === 2 && <section className="trade-pick panel"><div className="panel-title"><h2>Bài muốn trao đổi</h2><b>{tradeOffer.length} lá chọn</b></div><p className="muted">Có thể chọn nhiều lá. Nhân vật trong đội và vật phẩm đang gắn bị khóa.</p><div className="trade-card-grid">{profile.cards.map((card) => { const key = `character:${card.characterId}`, inTeam = profile.team.includes(card.characterId); return <label key={key} className={`trade-card-option ${tradeOffer.includes(key) ? "selected" : ""} ${inTeam ? "locked" : ""}`}><input type="checkbox" checked={tradeOffer.includes(key)} disabled={inTeam || tradeSession.executing} onChange={() => setTradeOffer((items) => items.includes(key) ? items.filter((item) => item !== key) : [...items, key])} /><Portrait id={card.characterId} /><span><b>{character(card.characterId)?.name}</b><small>Lv.{card.level} · {card.xp} EXP{inTeam ? " · Trong đội" : ""}</small></span></label>; })}{profile.itemCards.map((card) => { const key = `item:${card.itemId}`, equipped = Object.values(profile.equipment).some((ids) => ids.includes(card.itemId)); return <label key={key} className={`trade-card-option ${tradeOffer.includes(key) ? "selected" : ""} ${equipped ? "locked" : ""}`}><input type="checkbox" checked={tradeOffer.includes(key)} disabled={equipped || tradeSession.executing} onChange={() => setTradeOffer((items) => items.includes(key) ? items.filter((item) => item !== key) : [...items, key])} /><ItemSprite id={card.itemId} /><span><b>{itemInfo(card.itemId)?.name}</b><small>Lv.{card.level} · {card.xp} EXP{equipped ? " · Đang gắn" : ""}</small></span></label>; })}</div><div className="trade-actions"><button disabled={tradeSession.executing} onClick={() => void run(async () => { const result = await tradeRequest(`/${tradeSession.code}/offer`, { offer: tradeOffer }); setTradeSession(result.trade!); })}>Cập nhật bài chọn</button><button className="primary" disabled={tradeSession.executing || !tradeSession.players.find((player) => player.profileId === profileIdentity.id)?.offer.length} onClick={() => void run(async () => { const result = await tradeRequest(`/${tradeSession.code}/ready`, { ready: !tradeSession.players.find((player) => player.profileId === profileIdentity.id)?.ready }); setTradeSession(result.trade!); })}>{tradeSession.players.find((player) => player.profileId === profileIdentity.id)?.ready ? "Hủy sẵn sàng" : "Sẵn sàng"}</button>{profileIdentity.id === tradeSession.host && tradeSession.players.length === 2 && tradeSession.players.every((player) => player.ready) && <button className="trade-execute" onClick={() => void run(async () => { const result = await tradeRequest(`/${tradeSession.code}/execute`, {}); setTradeSession(result.trade!); })}>Thực hiện trao đổi</button>}</div></section>}
            {tradeSession.completed && <div className="trade-complete">Trao đổi hoàn tất. Các lá bài đã được cập nhật vào Kho đồ; lá trùng nhận được cộng 150 EXP như khi roll (lá Lv.MAX không nhận thêm EXP).</div>}
          </>}
        </section> : screen === "packs" || screen === "inventory" || screen === "training" || screen === "campaign" ? <section className={`profile-screen ${screen}`}>
          {screen === "packs" && <>
            <section className="pack-hero">
              <div className="pack-hero-copy">
                <span className="pack-eyebrow">RISEON · COLLECTOR SERIES</span>
                <h2>Mở thẻ.<br /><em>Viết nên huyền thoại.</em></h2>
                <p>Mỗi pack hé lộ một nhân vật hoặc vật phẩm. Sưu tầm, nâng cấp và tạo đội hình của riêng bạn.</p>
                <div className="pack-queue-card"><span>PACK ĐANG CHỜ</span><strong>{queuedPacks}<small> / {PACK_CAPACITY}</small></strong><i><b style={{ width: `${queuedPacks / PACK_CAPACITY * 100}%` }} /></i></div>
                <div className="pack-open-options">{[1, 3, 5, 10, 20, 50, 100].map((count) => <button key={count} className={count === 1 ? "primary" : ""} disabled={!profileReady || queuedPacks < count || openingPack} onClick={() => openPack(count)}>Mở x{count}</button>)}</div>
                <div className="pack-promise"><span>✦ 1 thẻ mỗi pack</span><span>✦ Nhân vật & vật phẩm</span><span>✦ 4 bậc hiếm</span></div>
              </div>
              <div className="pack-hero-art">
                <i className="pack-orbit orbit-one" /><i className="pack-orbit orbit-two" />
                <div className={`pack-booster ${openingPack ? "opening" : ""}`} aria-label="Gói thẻ sưu tầm">
                  <i className="booster-crimp" />
                  <span className="booster-edition">RISEON · COLLECTOR SERIES</span>
                  <img className="booster-logo" src={`${import.meta.env.BASE_URL}riseon-pack-logo.png`} alt="RiseOn Game Studio" />
                  <strong>ULTIMATE<br />TCG</strong>
                  <span className="booster-ribbon">ONE CARD · INFINITE BATTLES</span>
                  <i className="booster-seal">✦</i>
                  <i className="booster-crimp bottom" />
                </div>
                <span className="pack-total-badge">{queuedPacks} PACK{queuedPacks === 1 ? "" : "S"}</span>
              </div>
            </section>
            <div className="pack-recharge">{queuedPacks >= PACK_CAPACITY ? "Hàng chờ đã đầy · pack tự hồi khi còn chỗ" : `Pack tiếp theo sau ${Math.floor(packWait / 60000)}:${String(Math.floor(packWait / 1000) % 60).padStart(2, "0")} · tự hồi mỗi phút, tối đa ${PACK_CAPACITY}`}</div>
            <h3>Nhiệm Vụ Hằng Ngày · tiến độ làm mới mỗi ngày · mỗi nhiệm vụ nhận 1 pack</h3>
            {([ ["draw", "Bóc 3 thẻ"], ["win", "Thắng một trận PvP"], ["campaign", "Thắng một ải"] ] as const).map(([mission, label]) => { const goal = mission === "draw" ? 3 : 1; const progress = Math.min(goal, profile.missions[mission]); const claimed = profile.claimedMissions.includes(mission); return <div className="mission-row" key={mission}><span>{label} · {progress}/{goal}</span><button disabled={!profileReady || claimed || progress < goal || queuedPacks >= PACK_CAPACITY} onClick={() => claimMission(mission)}>{claimed ? "Đã nhận" : "Nhận pack"}</button></div>; })}
          </>}
          {screen === "inventory" && <div className="inventory-workspace">
            <div className="inventory-columns">
            <div className="inventory-team-panel">
              <div className="panel-title"><h2>Đội hình của tôi</h2><b>{profile.team.length}/3</b></div>
              <p className="muted">Kéo thẻ nhân vật vào đội, hoặc mở chi tiết thẻ trong Kho đồ để thêm. Mỗi nhân vật chỉ gắn được một vật phẩm.</p>
              <div className="team-drop-grid">{Array.from({ length: 3 }, (_, index) => { const characterId = profile.team[index]; const c = character(characterId); const card = profile.cards.find(x => x.characterId === characterId); const rarity = c ? cardEvolution(c.tier, card?.level || 1).tier : "T1"; return <div key={index} className={`team-drop ${characterId ? "filled" : "empty"} ${selectedTeamTarget === characterId ? "selected" : ""}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => characterId ? dropInventoryCard(e, characterId) : (() => { e.preventDefault(); try { const d = JSON.parse(e.dataTransfer.getData("application/json")); if (d.kind === "character") toggleProfileTeam(d.id as CharacterId); } catch {} })()} onClick={() => characterId && setSelectedTeamTarget(characterId)}>{characterId && c ? <><Portrait id={characterId as CharacterId} /><b>{c.name}</b><small className={`rarity-label tier-${rarity.toLowerCase()}`}>{tierRarity(rarity)} · Lv.{card?.level || 1}</small><div className="equipped-items">{(profile.equipment[characterId] || []).map(id => <span className="equipped-item-chip" key={id}><ItemSprite id={id} />{itemInfo(id)?.name}<button className="unequip-item" aria-label={`Gỡ ${itemInfo(id)?.name || "vật phẩm"} khỏi ${c.name}`} title="Gỡ vật phẩm" onClick={(e) => { e.stopPropagation(); equipProfileItem(characterId, id); }}>×</button></span>)}</div><button onClick={(e) => { e.stopPropagation(); toggleProfileTeam(characterId as CharacterId); }}>Bỏ khỏi đội</button></> : <span>Ô đội trống · kéo thẻ vào</span>}</div>; })}</div>
              <TeamChoices loadouts={inventoryLoadouts} choice={{}} onChange={() => {}} disabled inspect={setInfo} />
            </div><div className="inventory-cards-panel">
              <div className="panel-title"><h2>Thẻ sở hữu</h2><b>{profile.cards.length} nhân vật · {profile.itemCards.length} vật phẩm</b></div>
              <div className="inventory-target"><span>Vật phẩm sẽ gắn vào:</span><select aria-label="Chọn nhân vật để gắn vật phẩm" value={selectedTeamTarget} onChange={e => setSelectedTeamTarget(e.target.value)}>{profile.team.map(id => <option key={id} value={id}>{character(id)?.name}</option>)}</select></div>
              <h3>Nhân vật</h3><div className="card-collection">{profile.cards.map(card => { const c = character(card.characterId); if (!c) return null; const evolution = cardEvolution(c.tier, card.level); return <button draggable className={`inventory-card tier-${evolution.tier.toLowerCase()} ${evolution.evolved ? "evolved" : ""} ${profile.team.includes(card.characterId) ? "active" : ""}`} key={card.characterId} onDragStart={e => e.dataTransfer.setData("application/json", JSON.stringify({ kind: "character", id: card.characterId }))} onClick={() => setInfo({ kind: "character", id: card.characterId, loadout: inventoryLoadouts.find(l => l.characterId === card.characterId), actions: [{ label: profile.team.includes(card.characterId) ? "Bỏ khỏi team" : profile.team.length >= 3 ? "Team đã đủ 3 người" : "Thêm vào team", disabled: !profile.team.includes(card.characterId) && profile.team.length >= 3, run: () => toggleProfileTeam(card.characterId) }] })}><Portrait id={card.characterId} /><b>{c.name}</b><span className={`rarity-label tier-${evolution.tier.toLowerCase()}`}>{tierRarity(evolution.tier)} · {c.role}</span><ExperienceBar level={card.level} xp={card.xp} /><small>Chỉ số nền theo rarity hiện tại</small><small>{profile.team.includes(card.characterId) ? "Đang trong team · xem chi tiết" : "Chạm để xem chi tiết"}</small></button>; })}</div>
              <h3>Vật phẩm</h3><div className="card-collection">{profile.itemCards.map(card => { const it = itemInfo(card.itemId); if (!it) return null; const evolution = cardEvolution(it.rarity, card.level); const owner = profile.team.find(id => (profile.equipment[id] || []).includes(card.itemId)); const selectedOwner = owner || selectedTeamTarget; return <button draggable className={`inventory-card tier-${evolution.tier.toLowerCase()} ${evolution.evolved ? "evolved" : ""} ${owner ? "equipped" : ""}`} key={card.itemId} onDragStart={e => e.dataTransfer.setData("application/json", JSON.stringify({ kind: "item", id: card.itemId }))} onClick={() => setInfo({ kind: "item", id: card.itemId, loadout: inventoryLoadouts.find(l => l.characterId === selectedOwner), actions: [{ label: owner ? `Tháo khỏi ${character(owner)?.name || "team"}` : `Gắn cho ${character(selectedTeamTarget)?.name || "nhân vật"}`, run: () => equipProfileItem(selectedOwner as CharacterId, card.itemId) }] })}><ItemSprite id={card.itemId} /><b>{it.name}</b><span className={`rarity-label tier-${evolution.tier.toLowerCase()}`}>{tierRarity(evolution.tier)}</span><ExperienceBar level={card.level} xp={card.xp} /><small>Hiệu quả theo rarity hiện tại</small><small>{owner ? `Đang gắn · ${character(owner)?.name} · chạm để tháo` : "Chạm để xem chi tiết"}</small></button>; })}{!profile.itemCards.length && <p className="muted">Chưa có thẻ vật phẩm. Mở pack để nhận.</p>}</div>
            </div>
            </div>
          </div>}
          {screen === "training" && <div className="training-workspace">
            <section className="training-furnace">
              <div className="training-section-heading"><span>01 · LÒ LUYỆN</span><strong>Truyền EXP</strong></div>
              <label className="training-target-select">Thẻ nhận EXP<select value={trainingTarget} onChange={(event) => setTrainingTarget(event.target.value)}><option value="">Chọn thẻ cần luyện</option>{profile.cards.map((card) => <option key={`character:${card.characterId}`} value={`character:${card.characterId}`}>{character(card.characterId)?.name} · Lv.{card.level}</option>)}{profile.itemCards.map((card) => <option key={`item:${card.itemId}`} value={`item:${card.itemId}`}>{itemInfo(card.itemId)?.name} · Lv.{card.level}</option>)}</select></label>
              {trainingRecipient ? <div className="training-recipient" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const key = event.dataTransfer.getData("text/training-card"); if (!cardByKey(key)) return; setTrainingTarget(key); setTrainingSacrifice((items) => items.filter((item) => item !== key)); }}><span className="forge-arrow" aria-hidden="true">↑</span><div className={`forge-card tier-${trainingEvolution.toLowerCase()}`}><span className="forge-drop-hint">Thả thẻ để luyện</span>{trainingTarget.startsWith("character:") ? <Portrait id={trainingTarget.slice(10) as CharacterId} /> : <ItemSprite id={trainingTarget.slice(5)} />}<b>{trainingTarget.startsWith("character:") ? character(trainingTarget.slice(10))?.name : itemInfo(trainingTarget.slice(5))?.name}</b><span>{tierRarity(trainingEvolution)} · Lv.{trainingPreview?.level ?? trainingRecipient.level}</span></div><small>THẺ NHẬN EXP · KÉO THẺ VÀO ĐÂY</small></div> : <div className="training-recipient empty" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const key = event.dataTransfer.getData("text/training-card"); if (!cardByKey(key)) return; setTrainingTarget(key); setTrainingSacrifice((items) => items.filter((item) => item !== key)); }}><span className="forge-arrow" aria-hidden="true">↑</span><div className="forge-card"><span>Thả thẻ vào đây</span></div><small>THẺ NHẬN EXP · KÉO THẺ VÀO ĐÂY</small></div>}
              <div className="training-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const key = event.dataTransfer.getData("text/training-card"); if (key && key !== trainingTarget && canSacrifice(key) && !trainingSacrifice.includes(key)) setTrainingSacrifice((items) => [...items, key]); }}>
                <div className="training-dropzone-heading"><div><b>THẺ HY SINH</b><span>Kéo thẻ vào lò luyện</span></div><strong>{trainingXp} <small>EXP</small></strong></div>
                {trainingSacrifice.length ? <div className="training-sacrifices">{trainingSacrifice.map((key) => { const [kind, id] = key.split(":", 2); const card = cardByKey(key); const title = kind === "character" ? character(id)?.name : itemInfo(id)?.name; return <div className="sacrifice-chip" key={key}>{kind === "character" ? <Portrait id={id as CharacterId} /> : <ItemSprite id={id} />}<span><b>{title}</b><small>+{card ? cardTotalXp(card) : 0} EXP</small></span><button onClick={() => setTrainingSacrifice((items) => items.filter((item) => item !== key))} aria-label={`Bỏ ${title} khỏi lò`}>×</button></div>; })}</div> : <div className="training-drop-empty">✦<span>Thả thẻ dư vào đây</span><small>Có thể luyện nhiều thẻ cùng lúc</small></div>}
              </div>
              <div className="training-xp-preview"><div className="training-xp-label"><span>EXP SAU KHI LUYỆN</span><b>{trainingPreview ? `Lv.${trainingRecipient?.level} → Lv.${trainingPreview.level}` : "Chưa chọn thẻ"}</b></div><div className="training-xp-track"><i style={{ width: `${trainingPreview ? trainingPreview.level >= 10 ? 100 : trainingPreview.xp / xpForNextLevel(trainingPreview.level) * 100 : 0}%` }} /></div><div className="training-xp-caption"><span>{trainingPreview ? trainingPreview.level >= 10 ? "LEVEL MAX" : `${trainingPreview.xp} / ${xpForNextLevel(trainingPreview.level)} EXP` : "Chọn thẻ nhận và thẻ hy sinh"}</span><span>{trainingPreview && trainingPreview.level > trainingRecipient!.level ? `+${trainingPreview.level - trainingRecipient!.level} CẤP` : trainingXp ? `+${trainingXp} EXP` : ""}</span></div></div>
              {trainingPreview && trainingRecipient && <div className="training-preview-result"><b>{tierRarity(cardEvolution(trainingBaseTier, trainingRecipient.level).tier)} <span>→</span> {tierRarity(trainingEvolution)}</b><small>Thẻ hiến sẽ bị xóa khỏi Kho đồ.</small><button className="primary" disabled={!trainingMaterials.length || trainingSacrifice.includes(trainingTarget) || trainingRecipient.level >= 10} onClick={trainCard}>Luyện thẻ · nhận {trainingXp} EXP</button></div>}
            </section>
            <section className="training-card-pool"><div className="training-section-heading"><span>02 · THẺ CỦA BẠN</span><strong>Kéo thả để chọn</strong></div><p>Kéo thẻ vào lò để nhận EXP hoặc vào khung hy sinh. Nhân vật trong đội và vật phẩm đang gắn chỉ có thể làm thẻ nhận EXP.</p><div className="training-pool-grid">{profile.cards.map((card) => { const key = `character:${card.characterId}`; const c = character(card.characterId); const disabled = profile.team.includes(card.characterId); const selected = trainingSacrifice.includes(key); return <button key={key} className={`training-pool-card ${selected ? "selected" : ""} ${disabled ? "unavailable" : ""}`} draggable onDragStart={(event) => event.dataTransfer.setData("text/training-card", key)} onClick={() => disabled ? (setTrainingTarget(key), setTrainingSacrifice((items) => items.filter((item) => item !== key))) : key !== trainingTarget && setTrainingSacrifice((items) => selected ? items.filter((item) => item !== key) : [...items, key])}><Portrait id={card.characterId} /><b>{c?.name}</b><span>Lv.{card.level} · {card.xp} EXP</span><small>{disabled ? "ĐANG TRONG ĐỘI · kéo để luyện" : selected ? "ĐÃ CHỌN · chạm để bỏ" : "Kéo để luyện · chạm để hiến"}</small></button>; })}{profile.itemCards.map((card) => { const key = `item:${card.itemId}`; const it = itemInfo(card.itemId); const selected = trainingSacrifice.includes(key); const equipped = Object.values(profile.equipment).some((ids) => ids.includes(card.itemId)); return <button key={key} className={`training-pool-card ${selected ? "selected" : ""} ${equipped ? "unavailable" : ""}`} draggable onDragStart={(event) => event.dataTransfer.setData("text/training-card", key)} onClick={() => equipped ? (setTrainingTarget(key), setTrainingSacrifice((items) => items.filter((item) => item !== key))) : key !== trainingTarget && setTrainingSacrifice((items) => selected ? items.filter((item) => item !== key) : [...items, key])}><ItemSprite id={card.itemId} /><b>{it?.name}</b><span>Lv.{card.level} · {card.xp} EXP</span><small>{equipped ? "ĐANG GẮN · kéo để luyện" : selected ? "ĐÃ CHỌN · chạm để bỏ" : "Kéo để luyện · chạm để hiến"}</small></button>; })}{!profile.cards.length && !profile.itemCards.length && <div className="training-pool-empty">Mở pack để nhận thẻ có thể luyện.</div>}</div></section>
          </div>}
          {screen === "campaign" && <><div className="panel-title"><h2>Đi ải · ải {profile.campaignStage + 1}</h2><b>Đã vượt {profile.campaignStage}</b></div><p className="muted">Trận chạy cục bộ, tách khỏi phòng Multiplayer. Dùng team trong Kho đồ; thắng nhận 3 pack (tối đa 100 pack đang chờ).</p>{!campaignBattle && <button className="primary wide" disabled={!profileReady} onClick={launchCampaign}>Bắt đầu ải {profile.campaignStage + 1}</button>}{campaignBattle && <>{campaignWon === null && <Arena key={`campaign-${campaignBattle.seed}`} config={campaignBattle.config} seed={campaignBattle.seed} replay={null} loadReplayChunk={async () => []} muted={muted} low={low} label="ĐI ẢI · TRẬN CỤC BỘ" highlightTeamId="team-player" onError={report} onFinished={finishCampaign} />}<div className="campaign-result">{campaignWon === null ? "Trận đang diễn ra…" : campaignWon ? "🏆 Vượt ải thành công · đã nhận 3 pack" : "💥 Ải thất bại · hãy chỉnh team rồi thử lại"}</div>{campaignWon !== null && <button className="primary wide" onClick={() => setCampaignBattle(null)}>{campaignWon ? `Đi tiếp · ải ${profile.campaignStage + 1}` : "Thử lại"}</button>}</>}</>}
        </section> : <div className="layout">
          <aside className="panel">
            <div className="panel-title">
              <h2>
                {offline
                  ? simulationMode
                    ? "Mô phỏng"
                    : "Phòng tập"
                  : "Phòng chơi"}
              </h2>
              <span className="tag">
                {offline
                  ? simulationMode
                    ? "SIM"
                    : "LOCAL"
                  : room?.code || "ONLINE"}
              </span>
            </div>
            {offline ? (
              <>
                <p className="muted">
                  {simulationMode
                    ? "Tự chọn số đội, số nhân vật, đội hình và nhịp thu đấu trường cho một ván mô phỏng."
                    : "Kiểm tra đội hình, vật lý và replay bằng seed. Chế độ này độc lập với trận multiplayer."}
                </p>
                {simulationMode ? (
                  <>
                    <label>
                      Số đội
                      <select
                        aria-label="Số đội mô phỏng"
                        value={simulationTeamCount}
                        onChange={(e) =>
                          setSimulationTeamCount(+e.target.value)
                        }
                      >
                        {Array.from({ length: 7 }, (_, i) => i + 2).map((n) => (
                          <option key={n} value={n}>
                            {n} đội
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Nhân vật mỗi đội
                      <select
                        aria-label="Nhân vật mỗi đội mô phỏng"
                        value={simulationTeamSize}
                        onChange={(e) => {
                          setSimulationTeamSize(+e.target.value);
                          setPracticeChoice({});
                        }}
                      >
                        {[1, 2, 3].map((n) => (
                          <option key={n} value={n}>
                            {n} nhân vật
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Tường dừng thu sau
                      <select
                        aria-label="Thời gian thu đấu trường mô phỏng"
                        value={simulationShrinkSeconds}
                        onChange={(e) =>
                          setSimulationShrinkSeconds(+e.target.value)
                        }
                      >
                        {[10, 20, 30, 45, 60].map((n) => (
                          <option key={n} value={n}>
                            {n} giây
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="simulation-rosters">
                      <b>Đội hình các đội</b>
                      {Array.from(
                        { length: simulationTeamCount },
                        (_, team) => (
                          <div className="simulation-team" key={team}>
                            <small>Đội {team + 1}</small>
                            {Array.from(
                              { length: simulationTeamSize },
                              (_, slot) => (
                                <select
                                  aria-label={`Đội ${team + 1} nhân vật ${slot + 1}`}
                                  key={slot}
                                  value={simulationLineups[team][slot]}
                                  onChange={(e) => {
                                    const characterId = e.target
                                      .value as CharacterId;
                                    setSimulationLineups((previous) =>
                                      previous.map((row, index) =>
                                        index === team
                                          ? row.map((id, position) =>
                                              position === slot
                                                ? characterId
                                                : id,
                                            )
                                          : row,
                                      ),
                                    );
                                  }}
                                >
                                  {ROSTER.map((entry) => (
                                    <option key={entry.id} value={entry.id}>
                                      {entry.name}
                                    </option>
                                  ))}
                                </select>
                              ),
                            )}
                          </div>
                        ),
                      )}
                    </div>
                    <p className="muted">
                      Chỉnh mọi đội tại đây. Đội 1 còn có thể gắn trang bị và
                      chọn bộ kỹ năng ở phần đội hình bên dưới.
                    </p>
                  </>
                ) : (
                  <>
                    <label>
                      Số nhân vật <b>{count}</b>
                      <input
                        aria-label="Số nhân vật"
                        type="range"
                        min="2"
                        max="60"
                        value={count}
                        onChange={(e) => setCount(+e.target.value)}
                      />
                    </label>
                    <label>
                      Nhân vật mỗi đội thử
                      <select
                        aria-label="Số slot đội thử"
                        value={practiceSize}
                        onChange={(e) => {
                          setPracticeSize(+e.target.value);
                          setPracticeChoice({});
                          setCount((n) => Math.max(n, +e.target.value + 1));
                        }}
                      >
                        {[1, 2, 3].map((n) => (
                          <option key={n} value={n}>
                            {n} nhân vật
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
                <label>
                  Battle seed
                  <input
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(+e.target.value >>> 0)}
                  />
                </label>
                <button
                  className="primary wide"
                  onClick={() => setSeed((s) => (s + 1) >>> 0)}
                >
                  {simulationMode ? "Chạy mô phỏng ↗" : "Bắt đầu trận mới ↗"}
                </button>
                <div className="stat-grid">
                  <div>
                    <b>{ROSTER.length}</b>
                    <small>NHÂN VẬT</small>
                  </div>
                  <div>
                    <b>30</b>
                    <small>TICKS / GIÂY</small>
                  </div>
                </div>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={low}
                    onChange={(e) => setLow(e.target.checked)}
                  />{" "}
                  Giảm hiệu ứng
                </label>
              </>
            ) : (
              <>
                {!room ? (
                  <>
                    <label>
                      Tên của bạn
                      <input
                        value={name}
                        maxLength={24}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </label>
                    <label>
                      Backend URL
                      <input
                        value={api}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\/$/, "");
                          setApi(value);
                          localStorage.setItem("chaos-api", value);
                        }}
                      />
                    </label>
                    <button
                      disabled={busy}
                      className="primary wide"
                      onClick={() => enter()}
                    >
                      Tạo phòng
                    </button>
                    <div className="divider">HOẶC THAM GIA</div>
                    <label>
                      Mã phòng
                      <input
                        value={code}
                        maxLength={8}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                      />
                    </label>
                    <div className="row">
                      <button
                        disabled={busy || code.length !== 8}
                        onClick={() => enter(true)}
                      >
                        Tham gia
                      </button>
                      <button
                        disabled={busy || code.length !== 8}
                        onClick={() => enter(true, true)}
                      >
                        Xem trận
                      </button>
                    </div>
                    <p className="muted">
                      Local: chạy <code>npm run dev</code>. Khi chơi qua
                      Internet, đặt URL Worker đã deploy.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="connection">
                      <i className="live-dot" />
                      {status} · {conn.current?.latency || 0}ms
                    </div>
                    <div className="row">
                      <button
                        onClick={() =>
                          navigator.clipboard
                            .writeText(room.code)
                            .catch((e) => report(e.message))
                        }
                      >
                        Copy mã
                      </button>
                      <button
                        onClick={() => run(() => conn.current!.connect())}
                      >
                        Kết nối lại
                      </button>
                    </div>
                    <h3>{room.settings.name}</h3>
                    <p className="muted">
                      Vòng {room.round} · {room.phase}{" "}
                      {countdown > 0 ? `· ${countdown}s` : ""}
                    </p>
                    {host && room.phase === "LOBBY" && (
                      <div className="settings">
                        <label>
                          Số người tối đa
                          <input
                            type="number"
                            min="2"
                            max="20"
                            value={room.settings.maxPlayers}
                            onChange={(e) =>
                              act({
                                type: "SET_CONFIG",
                                settings: {
                                  ...room.settings,
                                  maxPlayers: +e.target.value,
                                },
                              })
                            }
                          />
                        </label>
                        <label>
                          Tường dừng thu sau (giây)
                          <input
                            type="number"
                            min="10"
                            max="60"
                            value={room.settings.shrinkSeconds}
                            onChange={(e) =>
                              act({
                                type: "SET_CONFIG",
                                settings: {
                                  ...room.settings,
                                  shrinkSeconds: +e.target.value,
                                },
                              })
                            }
                          />
                        </label>
                        <label className="check">
                          <input
                            type="checkbox"
                            checked={room.settings.spectators}
                            onChange={(e) =>
                              act({
                                type: "SET_CONFIG",
                                settings: {
                                  ...room.settings,
                                  spectators: e.target.checked,
                                },
                              })
                            }
                          />{" "}
                          Cho phép khán giả
                        </label>
                      </div>
                    )}
                    {me && !me.spectator && (
                      <>
                        <p className="muted">Đội hình đã đồng bộ từ Kho đồ · {profile.team.length}/3 nhân vật.</p>
                        {(room.phase === "LOBBY" ||
                          room.phase === "PREPARATION") && (
                          <button
                            disabled={busy || me.hp <= 0 || !profileReady || (room.phase === "LOBBY" && !profileRoomSynced)}
                            className="primary wide"
                            onClick={() =>
                              act({ type: "READY", ready: !me.ready })
                            }
                          >
                            {me.ready ? "Hủy sẵn sàng" : "Sẵn sàng ✓"}
                          </button>
                        )}
                        {host && room.phase === "LOBBY" && (
                          <button
                            disabled={busy || !readyToStart}
                            className="wide"
                            onClick={() => act({ type: "START" })}
                          >
                            Bắt đầu trận
                          </button>
                        )}
                        {host && room.phase === "FINISHED" && (
                          <button
                            className="primary wide"
                            onClick={() => act({ type: "REMATCH" })}
                          >
                            Chơi lại
                          </button>
                        )}
                      </>
                    )}
                    {room.phase === "FINISHED" && (
                      <div className="notice">
                        {room.mode === "campaign"
                          ? room.champion === id
                            ? "🏆 Vượt ải thành công · nhận 3 pack"
                            : "💥 Ải thất bại · thử nâng cấp đội rồi chơi lại"
                          : `🏆 ${room.players.find((p) => p.id === room.champion)?.name || "Đối thủ"} thắng · người thắng nhận 5 pack`}
                      </div>
                    )}
                    <button
                      className="wide subtle"
                      onClick={() =>
                        run(async () => {
                          await conn.current!.action({ type: "LEAVE" });
                          conn.current!.close();
                          localStorage.removeItem("chaos-session");
                          setRoom(null);
                          setReplay(null);
                        })
                      }
                    >
                      Rời phòng
                    </button>
                  </>
                )}
              </>
            )}
          </aside>
          <section className="battle-column">
            <div className="section-heading">
              <h2>
                Đấu trường{" "}
                <span>/ {offline ? "SANDBOX" : room?.phase || "LOBBY"}</span>
              </h2>
              <span className="muted">
                {offline
                  ? debug.teams.length
                  : room?.players.filter((p) => !p.spectator).length || 0}{" "}
                ĐỘI
              </span>
            </div>
            {config &&
            (offline ||
              room?.phase === "REPLAY_READY" ||
              room?.phase === "FINISHED") ? (
              <Arena
                key={
                  offline
                    ? "debug-" + seed
                    : "replay-" +
                      (currentReplay?.format === 1
                        ? currentReplay.game + "-"
                        : "legacy-") +
                      currentReplay?.round
                }
                config={config}
                seed={
                  offline
                    ? seed
                    : currentReplay?.format === 0
                      ? currentReplay.seed
                      : 1
                }
                replay={offline ? null : currentReplay}
                loadReplayChunk={(index) => {
                  if (!conn.current) throw Error("Mất kết nối phòng");
                  if (currentReplay?.format !== 1)
                    throw Error("Replay này không có frame để tải");
                  return conn.current.replayChunk(
                    index,
                    currentReplay.game,
                    currentReplay.round,
                  );
                }}
                officialResult={room?.results[0]?.id}
                offset={conn.current?.offset}
                muted={muted}
                low={low}
                highlightTeamId={offline ? debug.teams[0]?.id : id || undefined}
                watchedTeamId={!offline && watchedPlayerId !== id ? watchedPlayerId : undefined}
                onError={report}
                onInspect={(fighter, tick) =>
                  setInfo({
                    kind: "character",
                    id: fighter.characterId || "char_01",
                    live: structuredClone(fighter),
                    liveTick: tick,
                    loadout: {
                      classId: fighter.classId,
                      characterId: fighter.characterId,
                      level: fighter.level,
                      weaponRank: config.teams.find(
                        (t) => t.id === fighter.team,
                      )?.loadouts[fighter.slot]?.weaponRank,
                      equipment: fighter.equipment,
                    },
                  })
                }
              />
            ) : (
              <div className="waiting">
                <div className="orb">◉</div>
                <h2>
                  {room?.phase === "SIMULATING"
                    ? "Server đang mô phỏng…"
                    : "Sẵn sàng cho hỗn loạn?"}
                </h2>
                <p>
                  {room
                    ? "Chọn đội hình và chuẩn bị trang bị."
                    : "Tạo phòng hoặc nhập mã để chơi cùng bạn bè."}
                </p>
                {busy && <progress />}
              </div>
            )}
            <aside className="panel leaderboard">
              <div className="panel-title">
                <h2>{offline ? "Luật đấu" : "Người chơi"}</h2>
                <span className="tag">
                  {offline ? "V1" : room?.players.length || 0}
                </span>
              </div>
              {!offline && <small className="watch-hint">Đội của bạn luôn được tô vàng. Chọn người chơi khác để theo dõi thêm đội đó.</small>}
              {offline ? (
                <>
                  <div className="rule">
                    <span>01</span>
                    <div>
                      <b>Chuyển động bi-a</b>
                      <p>
                        Va chạm, khối lượng, phản xạ. Mọi quyết định theo tick.
                      </p>
                    </div>
                  </div>
                  <div className="rule">
                    <span>02</span>
                    <div>
                      <b>Sức mạnh từ lựa chọn</b>
                      <p>
                        Giáp, sát thương, tốc độ và Super. Kết hợp để sống sót.
                      </p>
                    </div>
                  </div>
                  <div className="rule">
                    <span>03</span>
                    <div>
                      <b>Tường đấu trường thu hẹp</b>
                      <p>
                        Tường thu đến giới hạn rồi dừng. Chạm tường bật lại,
                        không mất máu. Trận chỉ kết thúc khi còn một đội.
                      </p>
                    </div>
                  </div>
                  <div className="mini-banner">
                    LAST TEAM
                    <br />
                    <strong>BOUNCING.</strong>
                    <p>
                      Chiến thuật của bạn.
                      <br />
                      Hỗn loạn của đấu trường.
                    </p>
                  </div>
                </>
              ) : (
                room?.players.map((p) => (
                  <div
                    className={"player " + (p.id === id ? "you" : "") + (p.id === watchedPlayerId ? " watched" : "")}
                    key={p.id}
                    onClick={() => !p.spectator && setWatchedPlayerId(p.id)}
                    title={p.spectator ? undefined : "Theo dõi đội này trên sân"}
                  >
                    <span className="avatar">
                      {p.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <b>
                        {p.name} {room.host === p.id ? "♛" : ""}
                      </b>
                      <small>
                        {p.spectator
                          ? "KHÁN GIẢ"
                          : p.hp <= 0
                            ? "ĐÃ BỊ LOẠI"
                            : p.ready
                              ? "SẴN SÀNG"
                              : "ĐANG CHUẨN BỊ"}
                      </small>
                    </div>
                    <div className="mini-avatars">
                      {p.loadouts.map((l, i) => (
                        <button
                          key={i}
                          aria-label={
                            character(l.characterId)?.name || "Nhân vật"
                          }
                          onClick={() =>
                            setInfo({
                              kind: "character",
                              id: l.characterId || "char_01",
                              loadout: l,
                            })
                          }
                        >
                          <Portrait id={l.characterId || "char_01"} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
              {!offline && room && room.results.length > 0 && (
                <>
                  <h3>Kết quả vòng {room.settledRound}</h3>
                  {room.results.map((r) => (
                    <div className="result" key={r.id}>
                      <b>
                        #{r.rank}{" "}
                        {room.players.find((p) => p.id === r.id)?.name}
                      </b>
                      <small>
                        {r.damage} sát thương · {r.kills} hạ · {r.supers} Super
                        · +
                        {
                          calculateRoundRewards(r.rank, room.results.length)
                            .gold
                        }
                        G
                      </small>
                    </div>
                  ))}
                </>
              )}
            </aside>
            <div className="section-heading">
              <h2>
                {offline
                  ? simulationMode
                    ? "Đội 1 mô phỏng"
                    : "Đội thử của bạn"
                  : "Đội hình ra sân"}
              </h2>
              <span className="muted">
                {offline
                  ? "CHỌN SLOT → CHỌN NHÂN VẬT"
                  : `RA SÂN ${slots.length}/${fieldCapacity} · KÉO THẢ ĐỂ SẮP XẾP`}
              </span>
            </div>
            <div className="loadouts">
              {slots.map((l, i) => {
                const c = character(l.characterId);
                return (
                  <article
                    className={"team-slot " + (target === i ? "selected" : "")}
                    key={i}
                    draggable={canRearrange}
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "application/x-circle-unit",
                        JSON.stringify({ source: "field", sourceIndex: i }),
                      );
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => canRearrange && e.preventDefault()}
                    onDrop={(e) => canRearrange && dropUnit(e, "field", i)}
                  >
                    <button
                      className="slot-profile"
                      onClick={() => {
                        setTarget(i);
                        setReplace(-1);
                        setInfo({
                          kind: "character",
                          id: l.characterId || "char_01",
                          loadout: l,
                        });
                      }}
                    >
                      {c && <Portrait id={c.id} />}
                      <div>
                        <small>
                          QUÂN {i + 1} · ★{l.level}
                        </small>
                        <h3>{c?.name || CHARACTERS[l.classId].name}</h3>
                        <small>
                          {c?.roleClass} · {c?.race}
                        </small>
                        <small>★ {c?.super[0]}</small>
                      </div>
                    </button>
                    <div className="slot-actions">
                      <button
                        className={target === i ? "active" : ""}
                        onClick={() => {
                          setTarget(i);
                          setReplace(-1);
                        }}
                      >
                        Chọn slot {i + 1}
                      </button>
                      {!offline && room?.phase === "LOBBY" && (
                        <select
                          aria-label={"Chọn nhân vật slot " + (i + 1)}
                          disabled={busy || me?.ready}
                          value={l.characterId || "char_01"}
                          onChange={(e) => {
                            if (me)
                              act({
                                type: "SET_TEAM",
                                characters: me.loadouts.map((x, j) =>
                                  j === i
                                    ? (e.target.value as CharacterId)
                                    : x.characterId || "char_01",
                                ),
                              });
                          }}
                        >
                          {(me?.cards || []).map((card) => {
                            const c = character(card.characterId);
                            return c ? (
                            <option key={c.id} value={c.id}>
                              {c.name} · Lv.{card.level}
                            </option>
                            ) : null;
                          })}
                        </select>
                      )}
                      {canRearrange && (
                        <button
                          disabled={
                            busy ||
                            (me?.bench.length || 0) >= BENCH_CAPACITY ||
                            slots.length <= 1
                          }
                          onClick={() =>
                            moveUnit("field", i, "bench", me?.bench.length || 0)
                          }
                        >
                          Đưa về kho
                        </button>
                      )}
                    </div>
                    {l.equipment.map((eid, j) => (
                      <div className="equipment-chip" key={j}>
                        <button
                          onClick={() => {
                            setTarget(i);
                            setInfo({ kind: "item", id: eid, loadout: l });
                          }}
                        >
                          <ItemSprite id={eid} /> {itemName(eid)} ↗
                        </button>
                        <button
                          className={
                            target === i && replace === j ? "active" : ""
                          }
                          onClick={() => {
                            setTarget(i);
                            setReplace(j);
                          }}
                        >
                          Chọn thay
                        </button>
                        <button
                          aria-label={"Tháo " + itemName(eid)}
                          disabled={
                            !offline &&
                            (busy || me?.ready || room?.phase !== "PREPARATION")
                          }
                          onClick={() =>
                            offline
                              ? setPractice((prev) =>
                                  prev.map((x, k) =>
                                    k === i
                                      ? {
                                          ...x,
                                          equipment: x.equipment.filter(
                                            (_, n) => n !== j,
                                          ),
                                        }
                                      : x,
                                  ),
                                )
                              : act({
                                  type: "UNEQUIP",
                                  target: i,
                                  equipment: j,
                                })
                          }
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {(offline || room?.phase === "PREPARATION") && (
                      <div className="slot-actions">
                        <button
                          disabled={
                            (l.weaponRank || 1) >= 3 ||
                            l.level < ((l.weaponRank || 1) === 1 ? 3 : 6) ||
                            (!offline && (busy || me?.ready))
                          }
                          onClick={() =>
                            offline
                              ? setPractice((prev) =>
                                  prev.map((x, k) =>
                                    k === i
                                      ? {
                                          ...x,
                                          weaponRank: Math.min(
                                            3,
                                            (x.weaponRank || 1) + 1,
                                          ),
                                        }
                                      : x,
                                  ),
                                )
                              : act({ type: "WEAPON_UPGRADE", target: i })
                          }
                        >
                          Vũ khí {l.weaponRank || 1} → {(l.weaponRank || 1) + 1}{" "}
                          · {(l.weaponRank || 1) === 1 ? 8 : 12}G
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
              {!offline && canRearrange && slots.length < fieldCapacity && (
                <button
                  className="unit-drop-slot"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => dropUnit(e, "field", slots.length)}
                  onClick={() => {
                    if (moveSelection?.source === "bench")
                      moveUnit(
                        "bench",
                        moveSelection.sourceIndex,
                        "field",
                        slots.length,
                      );
                  }}
                >
                  <span>＋</span>
                  <b>Ô ra sân trống</b>
                  <small>Kéo quân từ kho vào đây</small>
                </button>
              )}
            </div>
            {!offline && me && (
              <section className="bench-panel">
                <div className="panel-title">
                  <h3>Kho nhân vật</h3>
                  <span>
                    {me.bench.length}/{BENCH_CAPACITY} ô · kéo quân trùng cấp để
                    hợp nhất
                  </span>
                </div>
                <div className="bench-grid">
                  {me.bench.map((unit, i) => {
                    const c = character(unit.characterId);
                    return (
                      <article
                        className={`bench-unit ${moveSelection?.source === "bench" && moveSelection.sourceIndex === i ? "selected" : ""}`}
                        key={`${unit.characterId}-${i}`}
                        draggable={canRearrange}
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            "application/x-circle-unit",
                            JSON.stringify({ source: "bench", sourceIndex: i }),
                          );
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragOver={(e) => canRearrange && e.preventDefault()}
                        onDrop={(e) => canRearrange && dropUnit(e, "bench", i)}
                        onClick={() => {
                          if (moveSelection && canRearrange)
                            moveUnit(
                              moveSelection.source,
                              moveSelection.sourceIndex,
                              "bench",
                              i,
                            );
                          else
                            setMoveSelection({
                              source: "bench",
                              sourceIndex: i,
                            });
                        }}
                      >
                        {c && <Portrait id={c.id} />}
                        <b>{c?.name || "Nhân vật"}</b>
                        <small>★{unit.level}</small>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInfo({
                              kind: "character",
                              id: unit.characterId || "char_01",
                              loadout: unit,
                            });
                          }}
                        >
                          Xem
                        </button>
                        <button
                          disabled={
                            !canRearrange ||
                            busy ||
                            slots.length >= fieldCapacity
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            moveUnit("bench", i, "field", slots.length);
                          }}
                        >
                          Ra sân
                        </button>
                      </article>
                    );
                  })}
                  {Array.from(
                    { length: Math.max(0, BENCH_CAPACITY - me.bench.length) },
                    (_, i) => (
                      <div
                        className="bench-empty"
                        key={`empty-${i}`}
                        onDragOver={(e) => canRearrange && e.preventDefault()}
                        onDrop={(e) =>
                          canRearrange && dropUnit(e, "bench", me.bench.length)
                        }
                        onClick={() => {
                          if (moveSelection && canRearrange)
                            moveUnit(
                              moveSelection.source,
                              moveSelection.sourceIndex,
                              "bench",
                              me.bench.length,
                            );
                        }}
                      >
                        Kho trống
                      </div>
                    ),
                  )}
                </div>
                {moveSelection && canRearrange && (
                  <p className="muted move-hint">
                    Đã chọn quân trong kho. Chạm quân khác để đổi chỗ/hợp nhất,
                    hoặc chạm ô ra sân trống.
                  </p>
                )}
              </section>
            )}
          </section>

        </div>}
        {revealPhase !== "idle" && lastPull && <div className={`pack-reveal-overlay tier-${lastPull.tier.toLowerCase()} phase-${revealPhase}`} role="dialog" aria-modal="true" aria-label="Thẻ vừa mở">
          <div className="reveal-flash" aria-hidden="true" />
          {revealPhase === "details" && <button className="reveal-close" onClick={closeReveal} aria-label="Đóng">×</button>}
          {lastPull.batchCount && lastPull.batchCount > 1 ? <section className="reveal-batch"><header><span>ĐÃ MỞ {lastPull.batchCount} PACK</span><strong>{batchPulls.length} THẺ</strong></header><div className="reveal-batch-grid">{batchPulls.map((pull, index) => { const c = pull.kind === "character" ? character(pull.id) : undefined; const it = pull.kind === "item" ? itemInfo(pull.id) : undefined; return <article className={`reveal-batch-card tier-${pull.tier.toLowerCase()} ${pull.evolved ? "evolved" : ""}`} key={`${pull.kind}-${pull.id}-${index}`} style={{ "--batch-delay": `${index * 55}ms` } as React.CSSProperties}><span className="reveal-batch-tier">{pull.evolved ? `${tierRarity(pull.oldTier || "")} → ` : ""}{tierRarity(pull.tier)}</span><div className="reveal-batch-art">{pull.kind === "character" ? <Portrait id={pull.id as CharacterId} /> : <ItemSprite id={pull.id} />}</div><b>{c?.name || it?.name}</b><small>{pull.rarity} · {pull.kind === "character" ? "Nhân vật" : "Vật phẩm"}</small>{pull.duplicate && <em>+{pull.xpGained || 0} EXP {pull.leveledUp ? `· Lv.${pull.oldLevel} → ${pull.level}` : ""}</em>}</article>; })}</div><button className="primary" onClick={closeReveal}>Tiếp tục</button></section> : <div className="reveal-stage">
            <article key={pullSequence} className={`reveal-card tier-${lastPull.tier.toLowerCase()} ${lastPull.evolved ? "evolved" : ""}`}>
              <div className="reveal-card-top"><span>{lastPull.evolved ? `TIẾN HÓA ${tierRarity(lastPull.oldTier || "")} → ${lastPull.rarity}` : lastPull.batchCount && lastPull.batchCount > 1 ? `ĐÃ MỞ ${lastPull.batchCount} PACK · KẾT QUẢ CUỐI` : "RISEON · CARD COLLECTION"}</span><b>{lastPull.rarity}</b></div>
              {lastPull.evolved && <strong className="evolution-banner">TIẾN HÓA!</strong>}
              <div className="reveal-card-art">{lastPull.kind === "character" ? <Portrait id={lastPull.id as CharacterId} /> : <ItemSprite id={lastPull.id} />}</div>
              <div className="reveal-card-name"><b>{revealCharacter?.name || revealItem?.name}</b><span>{lastPull.rarity} · {lastPull.kind === "character" ? "Nhân vật" : "Vật phẩm"}</span></div>
              <div className="reveal-card-shine" />
            </article>
            <section className="reveal-description">
              <span className="eyebrow">{lastPull.evolved ? "ĐỘT PHÁ TIẾN HÓA" : "THẺ MỚI ĐÃ ĐƯỢC THU THẬP"}</span>
              <h2>{revealCharacter?.name || revealItem?.name}</h2>
              {revealCharacter?.role && <p className="reveal-role">{revealCharacter.role}</p>}
              {revealItem?.effectName && <p className="reveal-role">{revealItem.effectName}</p>}
              <p>{lastPull.evolved ? `Thẻ đã tiến hóa từ ${tierRarity(lastPull.oldTier || "")} lên ${lastPull.rarity}. Chỉ số chiến đấu được cải thiện theo cấp.` : revealDescription}</p>
              {revealCharacter?.skill?.[0] && <div className="reveal-skill"><b>{revealCharacter.skill[0]}</b><span>{revealCharacter.skill[1]}</span></div>}
              {lastPull.duplicate && <div className={`reveal-xp ${lastPull.leveledUp ? "level-up" : ""}`}><div className="reveal-xp-label"><b>THẺ TRÙNG · +{lastPull.xpGained || 0} EXP</b><span>Lv.{lastPull.oldLevel} → Lv.{lastPull.level}</span></div><div className="xp-track reveal-xp-track"><i style={{ "--xp-from": `${Math.min(100, ((lastPull.oldXp || 0) / Math.max(1, xpForNextLevel(lastPull.oldLevel || 1))) * 100)}%`, "--xp-to": `${lastPull.leveledUp ? 100 : Math.min(100, ((lastPull.experience || 0) / Math.max(1, xpForNextLevel(lastPull.level || 1))) * 100)}%`, width: `${lastPull.leveledUp ? 100 : Math.min(100, ((lastPull.experience || 0) / Math.max(1, xpForNextLevel(lastPull.level || 1))) * 100)}%` } as React.CSSProperties} /></div>{lastPull.evolved && <strong className="level-up-label">TIẾN HÓA · {lastPull.rarity}</strong>}{lastPull.leveledUp ? <strong className="level-up-label">LEVEL UP!</strong> : lastPull.level === 10 ? <strong className="level-up-label">LEVEL MAX</strong> : <small>EXP {lastPull.experience || 0}/{Math.max(1, xpForNextLevel(lastPull.level || 1))}</small>}</div>}
              <button className="primary" onClick={closeReveal}>Tiếp tục</button>
            </section>
          </div>}
        </div>}
        <footer>
          <span>RISEON ULTIMATE TCG</span>
          <span>{ENGINE_VERSION} · Server authoritative</span>
          <span>Made for the chaos.</span>
        </footer>
      </main>
      <InfoPopup info={info?.kind === "item" ? { ...info, itemLevel: profile.itemCards.find(card => card.itemId === info.id)?.level || 1 } : info} close={() => setInfo(null)} inspect={setInfo} />
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
