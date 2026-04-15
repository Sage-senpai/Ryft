// Typed websocket client for the RYFT matchmaking server. Consumed by
// packages/game LobbyScene when NEXT_PUBLIC_MATCHMAKING_WS_URL is set;
// otherwise the lobby falls back to mock players so the demo still works
// without a live server.

export type LobbyStatus = "idle" | "in_queue" | "in_match";

export interface LobbyPlayer {
  username: string;
  address: string;
  status: LobbyStatus;
}

export interface MatchFoundFrame {
  type: "match_found";
  match_id: string;
  opponent: { address: string; username: string };
  role: "host" | "guest";
  on_chain_match_id: string;
}

export type ServerFrame =
  | { type: "ping" }
  | { type: "welcome"; session_id: string }
  | { type: "challenge"; nonce: string }
  | { type: "queue_joined"; position: number }
  | { type: "lobby_snapshot"; players: LobbyPlayer[] }
  | MatchFoundFrame
  | { type: "match_start"; seed: string }
  | { type: "error"; code: string; message?: string };

export interface RyftClientOptions {
  url: string;
  address: string;
  username: string;
  onEvent: (frame: ServerFrame) => void;
}

export class RyftClient {
  private ws: WebSocket | null = null;
  private opts: RyftClientOptions;
  private closed = false;
  private reconnectMs = 1000;

  constructor(opts: RyftClientOptions) {
    this.opts = opts;
    this.connect();
  }

  private connect() {
    if (this.closed) return;
    try {
      this.ws = new WebSocket(this.opts.url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws.onopen = () => {
      this.reconnectMs = 1000;
      this.send({ type: "hello", address: this.opts.address, username: this.opts.username });
    };
    this.ws.onmessage = (ev) => {
      let frame: ServerFrame;
      try {
        frame = JSON.parse(ev.data) as ServerFrame;
      } catch {
        return;
      }
      if (frame.type === "challenge") {
        // Stub signature — real wallet-backed signing happens in the web hook layer.
        this.send({ type: "challenge_response", signature: "demo" });
        return;
      }
      if (frame.type === "ping") {
        this.send({ type: "pong" });
        return;
      }
      this.opts.onEvent(frame);
    };
    this.ws.onclose = () => {
      this.ws = null;
      this.scheduleReconnect();
    };
    this.ws.onerror = () => {
      try {
        this.ws?.close();
      } catch {}
    };
  }

  private scheduleReconnect() {
    if (this.closed) return;
    const delay = Math.min(this.reconnectMs, 15_000);
    this.reconnectMs = Math.min(this.reconnectMs * 2, 15_000);
    setTimeout(() => this.connect(), delay);
  }

  send(msg: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  queueJoin() {
    this.send({ type: "queue_join", mode: "quick" });
  }

  close() {
    this.closed = true;
    this.ws?.close();
    this.ws = null;
  }
}
