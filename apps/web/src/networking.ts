import type { Action } from "../../../packages/shared/src/protocol";
import type { RoomState } from "../../../packages/shared/src/room";
import type { ReplayInfo } from "../../../packages/shared/src/room";
import type { ReplayFrame } from "../../../packages/battle-engine/src/types";
import { hash } from "../../../packages/battle-engine/src/index";
interface ApiResult {
  error?: string;
  serverTime?: number;
  state?: RoomState;
  token: string;
  id: string;
  code: string;
  ticket: string;
  replay: ReplayInfo;
  chunk: {
    index: number;
    fromTick: number;
    toTick: number;
    count: number;
    hash: string;
    bytes: number;
    data: string;
  };
}
export interface Identity {
  token: string;
  id: string;
  code: string;
}
export const defaultApi =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://127.0.0.1:8787" : "");
export class Connection {
  socket: WebSocket | null = null;
  identity: Identity | null = null;
  offset = 0;
  latency = 0;
  closed = false;
  retry = 0;
  round = 0;
  timer: ReturnType<typeof setTimeout> | undefined;
  constructor(
    public api: string,
    public onState: (state: RoomState) => void,
    public onStatus: (s: string) => void,
    public onError: (s: string) => void,
  ) {}
  async request(path: string, body?: unknown, auth = true) {
    const start = Date.now();
    const response = await fetch(this.api + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth && this.identity
          ? { Authorization: "Bearer " + this.identity.token }
          : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).catch(() => { throw Error(`Không kết nối được máy chủ ${this.api || "API"}. Kiểm tra Backend URL, HTTPS và cấu hình CORS.`); });
    const result = (await response.json().catch(() => ({}))) as ApiResult;
    this.latency = Date.now() - start;
    if (!response.ok) throw Error(result.error || "Lỗi kết nối");
    if (result.serverTime)
      this.offset = result.serverTime - (start + Date.now()) / 2;
    if (result.state) {
      this.round = result.state.round;
      this.onState(result.state);
    }
    return result;
  }
  async enter(name: string, code?: string, spectator = false) {
    this.closed = false;
    const r = await this.request(
      code ? "/api/rooms/" + code + "/join" : "/api/rooms",
      { name, spectator },
      false,
    );
    this.identity = { token: r.token, id: r.id, code: r.code };
    localStorage.setItem(
      "chaos-session",
      JSON.stringify({ ...this.identity, api: this.api }),
    );
    await this.connect();
    return this.identity;
  }
  async connect() {
    if (!this.identity) return;
    clearTimeout(this.timer);
    this.closed = false;
    this.onStatus("Đang kết nối…");
    await this.refresh();
    const { ticket } = await this.request(
      "/api/rooms/" + this.identity.code + "/ticket",
      {},
    );
    if (this.closed) return;
    this.socket?.close();
    const url = new URL(this.api + "/api/rooms/" + this.identity.code + "/ws");
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.searchParams.set("ticket", ticket);
    const socket = new WebSocket(url);
    this.socket = socket;
    socket.onopen = () => {
      this.retry = 0;
      this.onStatus("Đã kết nối");
    };
    socket.onmessage = (event) => {
      if (event.data === "pong") return;
      const data = JSON.parse(event.data);
      if (data.type === "ROOM_CHANGED")
        this.refresh().catch((e) => this.onError(e.message));
    };
    socket.onclose = () => {
      if (this.closed || this.socket !== socket) return;
      this.scheduleReconnect();
    };
  }
  scheduleReconnect() {
    if (this.closed) return;
    this.onStatus("Mất mạng · đang kết nối lại");
    clearTimeout(this.timer);
    this.timer = setTimeout(
      () =>
        this.connect().catch((e) => {
          this.onError(e.message);
          this.scheduleReconnect();
        }),
      Math.min(10000, 1000 * 2 ** Math.min(4, this.retry++)),
    );
  }
  refresh() {
    return this.request("/api/rooms/" + this.identity!.code);
  }
  async replayChunk(index: number, game: number, round: number): Promise<ReplayFrame[]> {
    const result = await this.request(
      `/api/rooms/${this.identity!.code}/replay/chunk?index=${index}&game=${game}&round=${round}`,
    );
    const packed = result.chunk;
    if (!packed || packed.index !== index) throw Error("Replay chunk sai thứ tự");
    const binary = atob(packed.data),
      bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0)),
      stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")),
      frames = (await new Response(stream).json()) as ReplayFrame[];
    if (
      frames.length !== packed.count ||
      frames[0]?.tick !== packed.fromTick ||
      frames[frames.length - 1]?.tick !== packed.toTick ||
      hash(frames) !== packed.hash
    )
      throw Error("Replay chunk sai checksum");
    return frames;
  }
  action(action: Action, requestId = crypto.randomUUID()) {
    return this.request("/api/rooms/" + this.identity!.code + "/action", {
      protocol: 4,
      round: this.round,
      requestId,
      action,
    });
  }
  close() {
    this.closed = true;
    clearTimeout(this.timer);
    this.socket?.close();
  }
}
