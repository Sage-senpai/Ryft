import { WebSocketServer, WebSocket } from "ws";
import { randomUUID, randomBytes } from "node:crypto";
import { createServer } from "node:http";

const PORT = Number(process.env.MATCHMAKING_PORT ?? 3001);

interface PlayerSession {
  session_id: string;
  address?: string;
  username?: string;
  nonce?: string;
  authed: boolean;
  status: "idle" | "in_queue" | "in_match";
}

const sessions = new Map<WebSocket, PlayerSession>();
const queue: WebSocket[] = [];

const http = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, players_online: sessions.size }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server: http });

function send(ws: WebSocket, msg: object) {
  ws.send(JSON.stringify(msg));
}

function pair() {
  while (queue.length >= 2) {
    const hostWs = queue.shift()!;
    const guestWs = queue.shift()!;
    const host = sessions.get(hostWs);
    const guest = sessions.get(guestWs);
    if (!host || !guest) continue;
    const match_id = randomUUID();
    host.status = "in_match";
    guest.status = "in_match";
    const seed = randomBytes(16).toString("hex");
    send(hostWs, {
      type: "match_found",
      match_id,
      opponent: { address: guest.address, username: guest.username },
      role: "host",
      on_chain_match_id: "",
    });
    send(guestWs, {
      type: "match_found",
      match_id,
      opponent: { address: host.address, username: host.username },
      role: "guest",
      on_chain_match_id: "",
    });
    setTimeout(() => {
      send(hostWs, { type: "match_start", seed });
      send(guestWs, { type: "match_start", seed });
    }, 200);
  }
}

wss.on("connection", (ws) => {
  const session: PlayerSession = { session_id: randomUUID(), authed: false, status: "idle" };
  sessions.set(ws, session);

  ws.on("message", (raw) => {
    let msg: { type: string; [k: string]: unknown };
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return send(ws, { type: "error", code: "INVALID_FRAME", recoverable: false });
    }

    if (msg.type === "hello") {
      session.address = String(msg.address ?? "");
      session.username = String(msg.username ?? "");
      session.nonce = randomBytes(32).toString("hex");
      return send(ws, { type: "challenge", nonce: session.nonce });
    }
    if (msg.type === "challenge_response") {
      // TODO Day 2: verify signature against Initia address. Stub accepts for dev.
      session.authed = true;
      return send(ws, { type: "welcome", session_id: session.session_id });
    }
    if (!session.authed) {
      return send(ws, { type: "error", code: "NOT_AUTHENTICATED", recoverable: true });
    }
    if (msg.type === "queue_join") {
      session.status = "in_queue";
      queue.push(ws);
      send(ws, { type: "queue_joined", position: queue.length });
      pair();
      return;
    }
    if (msg.type === "ping") return send(ws, { type: "pong" });
  });

  ws.on("close", () => {
    const idx = queue.indexOf(ws);
    if (idx >= 0) queue.splice(idx, 1);
    sessions.delete(ws);
  });
});

setInterval(() => {
  wss.clients.forEach((c) => send(c, { type: "ping" }));
}, 20_000);

http.listen(PORT, () => {
  console.log(`[ryft-server] listening on :${PORT}`);
});
