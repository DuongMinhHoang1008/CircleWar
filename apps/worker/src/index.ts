import { DurableObject } from "cloudflare:workers";
import {
  envelopeSchema,
  PROTOCOL,
} from "../../../packages/shared/src/protocol";
import {
  applyAction,
  advance,
  newRoom,
  viewRoom,
  viewReplay,
  type RoomState,
} from "../../../packages/shared/src/room";
import { hash } from "../../../packages/battle-engine/src/index";
import { CHARACTER_IDS, CATALOG_ITEMS, type CharacterId } from "../../../packages/shared/src/catalog";
import { addCardXp, DUPLICATE_CARD_XP, xpForNextLevel, PACK_CAPACITY } from "../../../packages/shared/src/progression";
interface Env {
  ROOMS: DurableObjectNamespace<Room>;
  PROFILES: DurableObjectNamespace<Profile>;
  TRADES: DurableObjectNamespace<Trade>;
  ALLOWED_ORIGINS: string;
}
interface Session {
  id: string;
  tokenHash: string;
  requests: Record<string, number>;
  window: number;
  count: number;
  expires: number;
}
interface Data {
  room: RoomState;
  sessions: Session[];
  tickets: Record<string, { id: string; expires: number }>;
  replayScope?: string;
}
const json = (value: unknown, status = 200) => Response.json(value, { status });
async function digest(token: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)),
    ),
  )
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
const seed = () => crypto.getRandomValues(new Uint32Array(1))[0] || 1;
async function gzipBase64(value: string) {
  const stream = new CompressionStream("gzip"),
    writer = stream.writable.getWriter();
  await writer.write(new TextEncoder().encode(value));
  await writer.close();
  const bytes = new Uint8Array(await new Response(stream.readable).arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { data: btoa(binary), bytes: bytes.length };
}
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = req.headers.get("Origin"),
      allowed = env.ALLOWED_ORIGINS.split(",").map((x) => x.trim());
    if (origin && !allowed.includes(origin))
      return json({ error: "Origin không được phép" }, 403);
    const cors = {
      "Access-Control-Allow-Origin": origin || allowed[0] || "",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Profile-ID",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      Vary: "Origin",
    };
    if (req.method === "OPTIONS")
      return new Response(null, { status: 204, headers: cors });
    try {
      const url = new URL(req.url);
      if (url.pathname === "/health")
        return json({ ok: true, protocol: PROTOCOL });
      const profileMatch = url.pathname.match(/^\/api\/profiles\/([0-9a-f-]{36})$/i);
      if (profileMatch) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(profileMatch[1]))
          return json({ error: "Profile ID không hợp lệ" }, 400);
        if (Number(req.headers.get("Content-Length") || 0) > 65536) return json({ error: "Profile request quá lớn" }, 413);
        url.pathname = "/";
        const response = await env.PROFILES.get(env.PROFILES.idFromName(profileMatch[1])).fetch(new Request(url, req));
        const out = new Response(response.body, response);
        for (const [key, value] of Object.entries(cors)) out.headers.set(key, value);
        return out;
      }
      let code: string, path: string;
      if (url.pathname === "/api/trades" && req.method === "POST") {
        code = Array.from(crypto.getRandomValues(new Uint8Array(8)), (n) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[n % 32]).join("");
        path = "/create";
        url.pathname = path;
        const headers = new Headers(req.headers);
        headers.set("X-Trade-Code", code);
        headers.set("X-Profile-ID", req.headers.get("X-Profile-ID") || "");
        const body = await req.arrayBuffer();
        if (body.byteLength > 8192) return json({ error: "Message too large" }, 413);
        const response = await env.TRADES.get(env.TRADES.idFromName(code)).fetch(new Request(url, { method: req.method, headers, body }));
        const out = new Response(response.body, response);
        for (const [key, value] of Object.entries(cors)) out.headers.set(key, value);
        return out;
      } else {
        const tradeMatch = url.pathname.match(/^\/api\/trades\/([A-Z2-9]{8})(\/(?:join|offer|ready|execute))?$/);
        if (tradeMatch) {
          code = tradeMatch[1];
          path = tradeMatch[2] || "/state";
          url.pathname = path;
          const headers = new Headers(req.headers);
          headers.set("X-Trade-Code", code);
          headers.set("X-Profile-ID", req.headers.get("X-Profile-ID") || "");
          const body = req.method === "GET" ? undefined : await req.arrayBuffer();
          if (body && body.byteLength > 8192) return json({ error: "Message too large" }, 413);
          const response = await env.TRADES.get(env.TRADES.idFromName(code)).fetch(new Request(url, { method: req.method, headers, body }));
          const out = new Response(response.body, response);
          for (const [key, value] of Object.entries(cors)) out.headers.set(key, value);
          return out;
        }
      }
      if (url.pathname === "/api/rooms" && req.method === "POST") {
        code = Array.from(
          crypto.getRandomValues(new Uint8Array(8)),
          (n) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[n % 32],
        ).join("");
        path = "/create";
      } else {
        const match = url.pathname.match(
          /^\/api\/rooms\/([A-Z2-9]{8})(\/(?:join|action|ticket|ws|replay(?:\/chunk)?|export))?$/,
        );
        if (!match) return json({ error: "Không tìm thấy API" }, 404);
        code = match[1];
        path = match[2] || "/state";
      }
      url.pathname = path;
      const headers = new Headers(req.headers);
      headers.set("X-Room-Code", code);
      if (Number(req.headers.get("Content-Length") || 0) > 8192)
        return json({ error: "Message too large" }, 413);
      const body = req.method === "GET" ? undefined : await req.arrayBuffer();
      if (body && body.byteLength > 8192)
        return json({ error: "Message too large" }, 413);
      const forwarded = new Request(url, { method: req.method, headers, body });
      const response = await env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(
        forwarded,
      );
      if (response.status === 101) return response;
      const out = new Response(response.body, response);
      for (const [key, value] of Object.entries(cors))
        out.headers.set(key, value);
      return out;
    } catch (error) {
      console.error(error);
      return new Response(
        JSON.stringify({ error: "Backend tạm thời không khả dụng" }),
        {
          status: 503,
          headers: { ...cors, "Content-Type": "application/json" },
        },
      );
    }
  },
} satisfies ExportedHandler<Env>;

interface GlobalProfile {
  cards: { characterId: CharacterId; level: number; xp: number }[];
  itemCards: { itemId: string; level: number; xp: number }[];
  team: CharacterId[];
  equipment: Record<string, string[]>;
  packs: number;
  lastPackAt: number;
  missions: { draw: number; win: number; campaign: number };
  claimedMissions: string[];
  campaignStage: number;
  processedMatches: string[];
  lastPull?: { kind: "character" | "item"; id: string; tier: string; rarity: string; duplicate?: boolean; xpGained?: number; oldXp?: number; experience?: number; oldLevel?: number; level?: number; leveledUp?: boolean };
}
interface StoredProfile { tokenHash: string; profile: GlobalProfile; appliedTrades?: string[] }
function normalizeProfile(raw: Partial<GlobalProfile>): GlobalProfile {
  const starter = starterProfile();
  const lastPull = typeof raw.lastPull === "string" ? undefined : raw.lastPull;
  const cards = Array.isArray(raw.cards) ? raw.cards.map((card) => ({ characterId: card.characterId, level: card.level || 1, xp: Number.isInteger(card.xp) ? card.xp : 0 })) : starter.cards;
  const itemCards = Array.isArray(raw.itemCards) ? raw.itemCards.map((card) => ({ itemId: card.itemId, level: card.level || 1, xp: Number.isInteger(card.xp) ? card.xp : 0 })) : [];
  const team = Array.isArray(raw.team) && raw.team.length ? raw.team : starter.team;
  const owned = new Set(itemCards.map((card) => card.itemId));
  const equipment: Record<string, string[]> = {};
  const assigned = new Set<string>();
  for (const [characterId, values] of Object.entries(raw.equipment || {})) {
    if (!team.includes(characterId as CharacterId) || !Array.isArray(values)) continue;
    const itemId = values.find((value) => owned.has(value) && !assigned.has(value));
    if (itemId) { equipment[characterId] = [itemId]; assigned.add(itemId); }
  }
  return { ...starter, ...raw, team, cards, itemCards, equipment, lastPull, missions: raw.missions || starter.missions, claimedMissions: raw.claimedMissions || [], processedMatches: raw.processedMatches || [] };
}
function validProfile(raw: unknown): raw is GlobalProfile {
  if (!raw || typeof raw !== "object") return false;
  const p = raw as Partial<GlobalProfile>;
  const ids = new Set<string>(CHARACTER_IDS);
  const items = new Set<string>(CATALOG_ITEMS.map((item) => item.id));
  const ownedItems = new Set((p.itemCards || []).map((item) => item.itemId));
  const equipped = p.equipment || {};
  const assignedItems = Object.values(equipped).flat();
  const equipmentValid = Object.entries(equipped).every(([characterId, values]) => ids.has(characterId) && p.team?.includes(characterId as CharacterId) && Array.isArray(values) && values.length <= 1 && values.every((itemId) => items.has(itemId) && ownedItems.has(itemId))) && new Set(assignedItems).size === assignedItems.length;
  return Array.isArray(p.cards) && p.cards.length > 0 && p.cards.length <= CHARACTER_IDS.length &&
    p.cards.every((c) => ids.has(c.characterId) && Number.isInteger(c.level) && c.level >= 1 && c.level <= 10 && Number.isInteger(c.xp) && c.xp >= 0 && (c.level === 10 ? c.xp === 0 : c.xp < xpForNextLevel(c.level))) &&
    Array.isArray(p.itemCards) && p.itemCards.length <= CATALOG_ITEMS.length && new Set(p.itemCards.map((item) => item.itemId)).size === p.itemCards.length && p.itemCards.every((item) => items.has(item.itemId) && Number.isInteger(item.level) && item.level >= 1 && item.level <= 10 && Number.isInteger(item.xp) && item.xp >= 0 && (item.level === 10 ? item.xp === 0 : item.xp < xpForNextLevel(item.level))) && equipmentValid &&
    Array.isArray(p.team) && p.team.length >= 1 && p.team.length <= 3 && new Set(p.team).size === p.team.length && p.team.every((id) => ids.has(id) && p.cards!.some((card) => card.characterId === id)) &&
    Number.isInteger(p.packs) && p.packs! >= 0 && p.packs! <= PACK_CAPACITY && Number.isFinite(p.lastPackAt) &&
    !!p.missions && [p.missions.draw, p.missions.win, p.missions.campaign].every((n) => Number.isInteger(n) && n >= 0) &&
    Array.isArray(p.claimedMissions) && p.claimedMissions.every((m) => ["draw", "win", "campaign"].includes(m)) &&
    Number.isInteger(p.campaignStage) && p.campaignStage! >= 0 && Array.isArray(p.processedMatches) && p.processedMatches.length <= 5000 && p.processedMatches.every((key) => typeof key === "string" && key.length <= 128) &&
    (p.lastPull === undefined || (typeof p.lastPull.id === "string" && (p.lastPull.tier.startsWith("T") || p.lastPull.tier === "GOD")));
}
function starterProfile(): GlobalProfile {
  return { cards: [{ characterId: "char_01", level: 1, xp: 0 }], itemCards: [], equipment: {}, team: ["char_01"], packs: 10, lastPackAt: Date.now(), missions: { draw: 0, win: 0, campaign: 0 }, claimedMissions: [], campaignStage: 0, processedMatches: [] };
}
function accrue(profile: GlobalProfile, now = Date.now()) {
  const elapsed = Math.floor(Math.max(0, now - profile.lastPackAt) / 60_000);
  if (!elapsed) return;
  const gained = Math.min(PACK_CAPACITY - profile.packs, elapsed);
  if (gained > 0) profile.packs += gained;
  profile.lastPackAt = profile.packs >= PACK_CAPACITY ? now : profile.lastPackAt + elapsed * 60_000;
}
export class Profile extends DurableObject<Env> {
  async fetch(req: Request) {
    return this.ctx.blockConcurrencyWhile(async () => {
      try {
        const token = req.headers.get("Authorization")?.replace(/^Bearer /, "") || "";
        if (token.length < 32) return json({ error: "Profile token không hợp lệ" }, 401);
        const tokenHash = await digest(token);
        let stored = await this.ctx.storage.get<StoredProfile>("profile");
        const url = new URL(req.url);
        if (req.method === "POST" && url.pathname === "/") {
          const raw = await req.text();
          if (raw.length > 65536) return json({ error: "Profile request quá lớn" }, 413);
          const body = raw ? JSON.parse(raw) as { type?: string; profile?: unknown } : {};
          if (!stored) {
            const candidate = body.profile && typeof body.profile === "object" ? normalizeProfile(body.profile as Partial<GlobalProfile>) : starterProfile();
            const profile = validProfile(candidate) ? candidate : starterProfile();
            accrue(profile);
            stored = { tokenHash, profile };
            await this.ctx.storage.put("profile", stored);
          } else if (stored.tokenHash !== tokenHash) return json({ error: "Không có quyền truy cập hồ sơ" }, 401);
          else if (body.type === "SAVE") {
            if (!validProfile(body.profile)) return json({ error: "Dữ liệu hồ sơ không hợp lệ" }, 400);
            stored.profile = normalizeProfile(body.profile as Partial<GlobalProfile>);
            if (!validProfile(stored.profile)) return json({ error: "Dữ liệu hồ sơ không hợp lệ" }, 400);
            accrue(stored.profile);
            await this.ctx.storage.put("profile", stored);
          } else { stored.profile = normalizeProfile(stored.profile); accrue(stored.profile); await this.ctx.storage.put("profile", stored); }
          return json({ profile: stored.profile });
        }
        if (!stored || stored.tokenHash !== tokenHash) return json({ error: "Hồ sơ không tồn tại hoặc token sai" }, 401);
        if (req.method === "POST" && url.pathname === "/trade") {
          const body = await req.json() as {
            tradeId?: string;
            remove?: { characters?: string[]; items?: string[] };
            add?: { characters?: GlobalProfile["cards"]; items?: GlobalProfile["itemCards"] };
          };
          if (!/^[A-Z2-9]{8}$/.test(body.tradeId || "")) return json({ error: "Phiên trao đổi không hợp lệ" }, 400);
          stored.appliedTrades ||= [];
          if (stored.appliedTrades.includes(body.tradeId!)) return json({ profile: stored.profile, applied: true });
          const removeCharacters = body.remove?.characters || [], removeItems = body.remove?.items || [];
          const addCharacters = body.add?.characters || [], addItems = body.add?.items || [];
          if (new Set(removeCharacters).size !== removeCharacters.length || new Set(removeItems).size !== removeItems.length ||
            new Set(addCharacters.map((card) => card.characterId)).size !== addCharacters.length || new Set(addItems.map((card) => card.itemId)).size !== addItems.length)
            return json({ error: "Danh sách thẻ trao đổi không hợp lệ" }, 400);
          if (removeCharacters.some((id) => stored!.profile.team.includes(id as CharacterId)) ||
            removeItems.some((id) => Object.values(stored!.profile.equipment).some((items) => items.includes(id))))
            return json({ error: "Không thể trao đổi thẻ trong đội hoặc vật phẩm đang gắn" }, 400);
          const removeCharacterSet = new Set(removeCharacters), removeItemSet = new Set(removeItems);
          const cards = stored.profile.cards.filter((card) => !removeCharacterSet.has(card.characterId));
          const itemCards = stored.profile.itemCards.filter((card) => !removeItemSet.has(card.itemId));
          if (removeCharacters.length !== stored.profile.cards.filter((card) => removeCharacterSet.has(card.characterId)).length ||
            removeItems.length !== stored.profile.itemCards.filter((card) => removeItemSet.has(card.itemId)).length)
            return json({ error: "Một số thẻ đã không còn trong Kho đồ" }, 409);
          for (const card of addCharacters) {
            if (!CHARACTER_IDS.includes(card.characterId) || !Number.isInteger(card.level) || card.level < 1 || card.level > 10 || !Number.isInteger(card.xp) || card.xp < 0 || card.xp >= (card.level === 10 ? 1 : xpForNextLevel(card.level)) || (card.level === 10 && card.xp !== 0)) return json({ error: "Thẻ nhân vật nhận được không hợp lệ" }, 400);
            const existing = cards.find((owned) => owned.characterId === card.characterId);
            if (existing) {
              if (existing.level < 10) Object.assign(existing, addCardXp(existing, DUPLICATE_CARD_XP));
            } else cards.push(card);
          }
          for (const card of addItems) {
            if (!CATALOG_ITEMS.some((item) => item.id === card.itemId) || !Number.isInteger(card.level) || card.level < 1 || card.level > 10 || !Number.isInteger(card.xp) || card.xp < 0 || card.xp >= (card.level === 10 ? 1 : xpForNextLevel(card.level)) || (card.level === 10 && card.xp !== 0)) return json({ error: "Thẻ vật phẩm nhận được không hợp lệ" }, 400);
            const existing = itemCards.find((owned) => owned.itemId === card.itemId);
            if (existing) {
              if (existing.level < 10) Object.assign(existing, addCardXp(existing, DUPLICATE_CARD_XP));
            } else itemCards.push(card);
          }
          if (cards.length > CHARACTER_IDS.length || itemCards.length > CATALOG_ITEMS.length) return json({ error: "Kho thẻ đã đạt giới hạn" }, 400);
          stored.profile = { ...stored.profile, cards, itemCards };
          stored.appliedTrades = [...stored.appliedTrades.slice(-100), body.tradeId!];
          await this.ctx.storage.put("profile", stored);
          return json({ profile: stored.profile, applied: true });
        }
        if (req.method === "GET") { stored.profile = normalizeProfile(stored.profile); accrue(stored.profile); await this.ctx.storage.put("profile", stored); return json({ profile: stored.profile }); }
        return json({ error: "Method not allowed" }, 405);
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : "Profile request failed" }, 400);
      }
    });
  }
}

type TradeCharacter = GlobalProfile["cards"][number];
type TradeItem = GlobalProfile["itemCards"][number];
interface TradePlayer {
  profileId: string;
  name: string;
  token: string;
  tokenHash: string;
  offer: string[];
  ready: boolean;
  applied: boolean;
}
interface TradeData {
  code: string;
  host: string;
  players: TradePlayer[];
  created: number;
  executing?: boolean;
  completed?: boolean;
  escrow?: { characters: TradeCharacter[]; items: TradeItem[] }[];
}
async function profileFetch(env: Env, profileId: string, token: string, path = "/", body?: unknown) {
  const headers = new Headers({ Authorization: `Bearer ${token}` });
  if (body !== undefined) headers.set("Content-Type", "application/json");
  const response = await env.PROFILES.get(env.PROFILES.idFromName(profileId)).fetch(new Request(`https://profile${path}`, {
    method: body === undefined ? "GET" : "POST", headers, body: body === undefined ? undefined : JSON.stringify(body),
  }));
  const result = await response.json() as { error?: string; profile?: GlobalProfile };
  if (!response.ok) throw Error(result.error || "Không thể cập nhật hồ sơ trao đổi");
  return result.profile!;
}
function parseTradeOffer(offer: string[]) {
  const characters = offer.filter((key) => key.startsWith("character:")).map((key) => key.slice(10));
  const items = offer.filter((key) => key.startsWith("item:")).map((key) => key.slice(5));
  if (characters.length + items.length !== offer.length || new Set(offer).size !== offer.length ||
    characters.some((id) => !CHARACTER_IDS.includes(id as CharacterId)) ||
    items.some((id) => !CATALOG_ITEMS.some((item) => item.id === id))) throw Error("Danh sách thẻ trao đổi không hợp lệ");
  return { characters, items };
}
export class Trade extends DurableObject<Env> {
  async fetch(req: Request) {
    return this.ctx.blockConcurrencyWhile(async () => {
      try { return await this.handle(req); }
      catch (error) { return json({ error: error instanceof Error ? error.message : "Phiên trao đổi lỗi" }, 400); }
    });
  }
  private async handle(req: Request) {
    const url = new URL(req.url), code = req.headers.get("X-Trade-Code") || "";
    const token = req.headers.get("Authorization")?.replace(/^Bearer /, "") || "";
    const tokenHash = await digest(token), profileId = req.headers.get("X-Profile-ID") || "";
    let data = await this.ctx.storage.get<TradeData>("data");
    if (req.method === "POST" && url.pathname === "/create") {
      if (data) return json({ error: "Mã phiên bị trùng, hãy thử lại" }, 409);
      if (!/^[0-9a-f-]{36}$/i.test(profileId) || token.length < 32) return json({ error: "Hồ sơ người chơi không hợp lệ" }, 401);
      const body = await req.json() as { name?: string };
      if (!body.name?.trim() || body.name.length > 24) return json({ error: "Tên người chơi không hợp lệ" }, 400);
      await profileFetch(this.env, profileId, token);
      const host: TradePlayer = { profileId, name: body.name.trim(), token, tokenHash, offer: [], ready: false, applied: false };
      data = { code, host: profileId, players: [host], created: Date.now() };
      await this.ctx.storage.put("data", data);
      return json({ trade: this.view(data, profileId) });
    }
    if (!data || data.code !== code) return json({ error: "Phiên trao đổi không tồn tại" }, 404);
    if (req.method === "POST" && url.pathname === "/join") {
      if (!/^[0-9a-f-]{36}$/i.test(profileId) || token.length < 32) return json({ error: "Hồ sơ người chơi không hợp lệ" }, 401);
      const body = await req.json() as { name?: string };
      if (!body.name?.trim() || body.name.length > 24) return json({ error: "Tên người chơi không hợp lệ" }, 400);
      if (data.players.length >= 2 || data.completed) return json({ error: "Phiên đã đủ người hoặc đã kết thúc" }, 409);
      if (data.players.some((player) => player.profileId === profileId)) return json({ error: "Bạn không thể tham gia phiên do mình tạo" }, 400);
      await profileFetch(this.env, profileId, token);
      data.players.push({ profileId, name: body.name.trim(), token, tokenHash, offer: [], ready: false, applied: false });
      await this.ctx.storage.put("data", data);
      return json({ trade: this.view(data, profileId) });
    }
    const actor = data.players.find((player) => player.tokenHash === tokenHash && player.profileId === profileId);
    if (!actor) return json({ error: "Không có quyền truy cập phiên trao đổi" }, 401);
    if (req.method === "GET" && url.pathname === "/state") return json({ trade: this.view(data, profileId) });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    if (data.completed) return json({ trade: this.view(data, profileId), completed: true });
    if (url.pathname === "/offer") {
      if (data.executing) return json({ error: "Phiên đã khóa để trao đổi" }, 409);
      const body = await req.json() as { offer?: unknown };
      if (!Array.isArray(body.offer) || body.offer.length > CHARACTER_IDS.length + CATALOG_ITEMS.length || body.offer.some((key) => typeof key !== "string")) return json({ error: "Danh sách thẻ không hợp lệ" }, 400);
      const offer = body.offer as string[];
      try { parseTradeOffer(offer); } catch (error) { return json({ error: error instanceof Error ? error.message : "Danh sách thẻ không hợp lệ" }, 400); }
      actor.offer = offer;
      actor.ready = false;
      await this.ctx.storage.put("data", data);
      return json({ trade: this.view(data, profileId) });
    }
    if (url.pathname === "/ready") {
      if (data.executing) return json({ error: "Phiên đã khóa để trao đổi" }, 409);
      const body = await req.json() as { ready?: boolean };
      actor.ready = body.ready !== false;
      await this.ctx.storage.put("data", data);
      return json({ trade: this.view(data, profileId) });
    }
    if (url.pathname === "/execute") {
      if (actor.profileId !== data.host) return json({ error: "Chỉ chủ phiên mới có thể thực hiện trao đổi" }, 403);
      if (data.players.length !== 2 || !data.players.every((player) => player.ready)) return json({ error: "Cả hai người chơi phải sẵn sàng" }, 409);
      if (!data.players.every((player) => player.offer.length > 0)) return json({ error: "Mỗi người cần chọn ít nhất một lá bài" }, 409);
      if (!data.escrow) {
        const snapshots = await Promise.all(data.players.map((player) => profileFetch(this.env, player.profileId, player.token)));
        const escrow = data.players.map((player, index) => {
          const parsed = parseTradeOffer(player.offer), profile = snapshots[index];
          if (parsed.characters.some((id) => profile.team.includes(id as CharacterId))) throw Error("Không thể trao đổi nhân vật đang trong đội");
          if (parsed.items.some((id) => Object.values(profile.equipment).some((items) => items.includes(id)))) throw Error("Không thể trao đổi vật phẩm đang gắn");
          const characters = parsed.characters.map((id) => profile.cards.find((card) => card.characterId === id));
          const items = parsed.items.map((id) => profile.itemCards.find((card) => card.itemId === id));
          if (characters.some((card) => !card) || items.some((card) => !card)) throw Error("Một số thẻ đã không còn trong Kho đồ");
          return { characters: characters as TradeCharacter[], items: items as TradeItem[] };
        });
        for (let index = 0; index < 2; index++) {
          const receiver = snapshots[index], incoming = escrow[1 - index], parsed = parseTradeOffer(data.players[index].offer);
          const remainingCharacters = receiver.cards.filter((card) => !parsed.characters.includes(card.characterId));
          const remainingItems = receiver.itemCards.filter((card) => !parsed.items.includes(card.itemId));
          const newCharacters = incoming.characters.filter((card) => !remainingCharacters.some((owned) => owned.characterId === card.characterId)).length;
          const newItems = incoming.items.filter((card) => !remainingItems.some((owned) => owned.itemId === card.itemId)).length;
          if (remainingCharacters.length + newCharacters > CHARACTER_IDS.length || remainingItems.length + newItems > CATALOG_ITEMS.length) throw Error("Kho thẻ của người nhận đã đạt giới hạn");
        }
        data.escrow = escrow;
        data.executing = true;
        await this.ctx.storage.put("data", data);
      }
      const escrow = data.escrow;
      if (!escrow) throw Error("Không tạo được bản ghi trao đổi");
      for (let index = 0; index < 2; index++) {
        const player = data.players[index];
        if (player.applied) continue;
        const incoming = escrow[1 - index], offer = parseTradeOffer(player.offer);
        await profileFetch(this.env, player.profileId, player.token, "/trade", {
          tradeId: code,
          remove: { characters: offer.characters, items: offer.items },
          add: { characters: incoming.characters, items: incoming.items },
        });
        player.applied = true;
        await this.ctx.storage.put("data", data);
      }
      data.completed = true;
      await this.ctx.storage.put("data", data);
      return json({ trade: this.view(data, profileId), completed: true });
    }
    return json({ error: "Không tìm thấy thao tác trao đổi" }, 404);
  }
  private view(data: TradeData, viewer: string) {
    return {
      code: data.code,
      host: data.host,
      viewer,
      players: data.players.map(({ profileId, name, offer, ready, applied }) => ({ profileId, name, offer, ready, applied })),
      executing: !!data.executing,
      completed: !!data.completed,
    };
  }
}
export class Room extends DurableObject<Env> {
  async fetch(req: Request) {
    return this.ctx.blockConcurrencyWhile(async () => {
      try {
        return await this.handle(req);
      } catch (e) {
        return json(
          { error: e instanceof Error ? e.message : "Invalid request" },
          400,
        );
      }
    });
  }
  private async save(d: Data) {
    d.room.replayFrames ??= [];
    d.room.replayChunks ??= [];
    d.room.game ??= 0;
    const scope = `${d.room.game}:${d.room.round}`;
    let chunk: { key: string; data: string } | undefined;
    if (d.room.replayFrames.length) {
      const frames = d.room.replayFrames,
        packed = await gzipBase64(JSON.stringify(frames)),
        index = d.room.replayChunks.length,
        info = {
          index,
          fromTick: frames[0].tick,
          toTick: frames[frames.length - 1].tick,
          count: frames.length,
          hash: hash(frames),
          bytes: packed.bytes,
        };
      d.room.replayChunks.push(info);
      d.room.replayFrames = [];
      if (d.room.replay) d.room.replay.chunks = structuredClone(d.room.replayChunks);
      chunk = {
        key: `replay:${scope}:${index}`,
        data: packed.data,
      };
    }
    await this.ctx.storage.transaction(async (tx) => {
      if (d.replayScope !== scope) {
        const stored = await tx.list({ prefix: "replay:" });
        const stale = Array.from(stored.keys()).filter(
          (key) => !key.startsWith(`replay:${scope}:`),
        );
        if (stale.length) await tx.delete(stale);
        d.replayScope = scope;
      }
      if (chunk) await tx.put(chunk.key, chunk.data);
      await tx.put("data", d);
      await tx.setAlarm(d.room.deadline || d.room.updated + 86400000);
    });
  }
  private notify(d: Data) {
    const message = JSON.stringify({
      type: "ROOM_CHANGED",
      protocol: PROTOCOL,
      seq: d.room.seq,
      serverTime: Date.now(),
    });
    for (const ws of this.ctx.getWebSockets())
      try {
        ws.send(message);
      } catch {
        ws.close(1011, "Reconnect");
      }
  }
  private async handle(req: Request): Promise<Response> {
    const url = new URL(req.url),
      now = Date.now();
    let d = await this.ctx.storage.get<Data>("data");
    if (d) {
      d.room.game ??= 0;
      d.room.replayFrames ??= [];
      d.room.replayChunks ??= [];
    }
    if (
      req.method === "POST" &&
      (url.pathname === "/create" || url.pathname === "/join")
    ) {
      const raw = await req.text();
      if (raw.length > 2048) return json({ error: "Message too large" }, 413);
      const body = JSON.parse(raw) as { name?: unknown; spectator?: unknown };
      if (
        typeof body.name !== "string" ||
        !body.name.trim() ||
        body.name.length > 24
      )
        throw Error("Tên không hợp lệ");
      if (url.pathname === "/create") {
        if (d) return json({ error: "Mã phòng trùng, thử lại" }, 409);
        d = {
          room: newRoom(req.headers.get("X-Room-Code")!, seed(), now),
          sessions: [],
          tickets: {},
        };
      }
      if (!d) return json({ error: "Phòng không tồn tại" }, 404);
      const token = crypto.randomUUID() + crypto.randomUUID(),
        id = crypto.randomUUID();
      d.room = applyAction(
        d.room,
        id,
        {
          type: "JOIN",
          name: body.name.trim(),
          spectator: body.spectator === true,
        },
        now,
      );
      d.sessions.push({
        id,
        tokenHash: await digest(token),
        requests: {},
        window: now,
        count: 0,
        expires: now + 7 * 86400000,
      });
      await this.save(d);
      this.notify(d);
      return json({
        token,
        id,
        code: d.room.code,
        state: viewRoom(d.room, id),
        serverTime: now,
      });
    }
    if (!d) return json({ error: "Phòng không tồn tại" }, 404);
    if (url.pathname === "/ws" && req.method === "GET") {
      if (req.headers.get("Upgrade")?.toLowerCase() !== "websocket")
        return json({ error: "WebSocket required" }, 426);
      const ticket = url.searchParams.get("ticket") || "",
        entry = d.tickets[ticket];
      if (!entry || entry.expires < now)
        return json({ error: "Ticket hết hạn" }, 401);
      const id = entry.id;
      delete d.tickets[ticket];
      await this.save(d);
      const existing = this.ctx.getWebSockets(id);
      for (const ws of existing) ws.close(1000, "Replaced connection");
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1], [id]);
      pair[1].serializeAttachment({ id });
      pair[1].send(
        JSON.stringify({
          type: "ROOM_CHANGED",
          protocol: PROTOCOL,
          seq: d.room.seq,
          serverTime: now,
        }),
      );
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    const token =
      req.headers.get("Authorization")?.replace(/^Bearer /, "") || "";
    const tokenHash = await digest(token);
    const session = d.sessions.find(
      (s) => s.tokenHash === tokenHash && s.expires > now,
    );
    if (!session || !d.room.players.some((p) => p.id === session.id))
      return json(
        { error: "Phiên không hợp lệ. Hãy tham gia lại phòng." },
        401,
      );
    if (now - session.window > 10000) {
      session.window = now;
      session.count = 0;
    }
    if (++session.count > 60) return json({ error: "Thao tác quá nhanh" }, 429);
    if (req.method === "GET" && url.pathname === "/state") {
      await this.save(d);
      return json({ state: viewRoom(d.room, session.id), serverTime: now });
    }
    if (req.method === "GET" && url.pathname === "/replay") {
      return json({ replay: viewReplay(d.room.replay), serverTime: now });
    }
    if (req.method === "GET" && url.pathname === "/replay/chunk") {
      const index = Number(url.searchParams.get("index")),
        expectedGame = Number(url.searchParams.get("game")),
        expectedRound = Number(url.searchParams.get("round"));
      const replay = d.room.replay;
      if (
        !replay ||
        !Number.isInteger(index) ||
        index < 0 ||
        !Number.isInteger(expectedGame) ||
        !Number.isInteger(expectedRound) ||
        replay.game !== d.room.game ||
        replay.round !== d.room.round ||
        replay.game !== expectedGame ||
        replay.round !== expectedRound
      )
        return json({ error: "Replay của vòng này đã thay đổi" }, 409);
      const info = replay.chunks.find((c) => c.index === index);
      if (!info) return json({ error: "Replay chunk không tồn tại" }, 404);
      const data = await this.ctx.storage.get<string>(
        `replay:${replay.game}:${replay.round}:${index}`,
      );
      if (!data) return json({ error: "Replay chunk chưa sẵn sàng" }, 503);
      return json({ chunk: { ...info, data }, serverTime: now });
    }
    if (req.method === "GET" && url.pathname === "/export")
      return json({
        state: viewRoom(d.room, session.id),
        replay: viewReplay(d.room.replay),
      });
    if (req.method === "POST" && url.pathname === "/ticket") {
      d.tickets = Object.fromEntries(
        Object.entries(d.tickets).filter(([, v]) => v.expires > now),
      );
      const ticket = crypto.randomUUID();
      d.tickets[ticket] = { id: session.id, expires: now + 30000 };
      await this.save(d);
      return json({ ticket });
    }
    if (req.method === "POST" && url.pathname === "/action") {
      const raw = await req.text();
      if (raw.length > 8192) return json({ error: "Message too large" }, 413);
      const envelope = envelopeSchema.parse(JSON.parse(raw));
      if (session.requests[envelope.requestId] !== undefined)
        return json({
          state: viewRoom(d.room, session.id),
          serverTime: now,
          duplicate: true,
        });
      if (envelope.round !== d.room.round)
        throw Error("Vòng đã thay đổi; tải lại trạng thái trước khi thao tác");
      session.requests = Object.fromEntries(
        Object.entries(session.requests).filter(
          ([, value]) => value >= d!.room.round,
        ),
      );
      d.room = applyAction(d.room, session.id, envelope.action, now);
      session.requests[envelope.requestId] = envelope.round;
      // Retain IDs for this round. Stale requests from older rounds cannot mutate newer rounds.
      const entries = Object.entries(session.requests);
      if (entries.length > 1024)
        throw Error("Giới hạn thao tác trong vòng đã đạt");
      await this.save(d);
      this.notify(d);
      return json({ state: viewRoom(d.room, session.id), serverTime: now });
    }
    return json({ error: "Method not allowed" }, 405);
  }
  async alarm() {
    await this.ctx.blockConcurrencyWhile(async () => {
      const d = await this.ctx.storage.get<Data>("data");
      if (!d) return;
      const now = Date.now();
      if (!d.room.deadline && now >= d.room.updated + 86400000) {
        await this.ctx.storage.deleteAll();
        for (const ws of this.ctx.getWebSockets())
          ws.close(1000, "Room expired");
        return;
      }
      d.room = advance(d.room, now);
      await this.save(d);
      this.notify(d);
    });
  }
  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (message === "ping") {
      ws.send("pong");
      return;
    }
    ws.close(1008, "Use authenticated HTTP actions");
  }
  webSocketClose(ws: WebSocket, code: number) {
    ws.close(
      code === 1000 || (code >= 3000 && code <= 4999) ? code : 1000,
      "Closed",
    );
  }
  webSocketError(ws: WebSocket) {
    ws.close(1011, "Reconnect");
  }
}
