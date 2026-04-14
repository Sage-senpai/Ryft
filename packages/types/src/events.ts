import type { LobbyPlayer, MatchFoundPayload } from "./lobby";

export const EVENT = {
  WALLET_CONNECTED: "WALLET_CONNECTED",
  WALLET_DISCONNECTED: "WALLET_DISCONNECTED",
  SESSION_KEY_READY: "SESSION_KEY_READY",
  LOBBY_SNAPSHOT: "LOBBY_SNAPSHOT",
  MATCH_FOUND: "MATCH_FOUND",
  ACTION_CONFIRMED: "ACTION_CONFIRMED",
  ACTION_FAILED: "ACTION_FAILED",
  OPPONENT_MOVED: "OPPONENT_MOVED",
  MATCH_RESOLVED: "MATCH_RESOLVED",
  REQUEST_CONNECT: "REQUEST_CONNECT",
  REQUEST_QUEUE: "REQUEST_QUEUE",
  REQUEST_BRIDGE_OPEN: "REQUEST_BRIDGE_OPEN",
  PLAY_CARD: "PLAY_CARD",
  TURN_ENDED: "TURN_ENDED",
  SCENE_READY: "SCENE_READY",
} as const;

export type EventName = (typeof EVENT)[keyof typeof EVENT];

export interface WalletConnectedPayload {
  address: string;
  username: string;
}

export interface SessionKeyReadyPayload {
  chain_id: string;
  expires_at: number;
}

export interface LobbySnapshotPayload {
  players: LobbyPlayer[];
}

export interface ActionConfirmedPayload {
  event_id: string;
  tx_hash: string;
}

export interface ActionFailedPayload {
  event_id: string;
  code: string;
}

export interface OpponentMovedPayload {
  card_id: string;
  target: number;
  damage: number;
}

export interface MatchResolvedPayload {
  winner: "me" | "opponent";
  reason: string;
}

export type EventPayloads = {
  WALLET_CONNECTED: WalletConnectedPayload;
  WALLET_DISCONNECTED: Record<string, never>;
  SESSION_KEY_READY: SessionKeyReadyPayload;
  LOBBY_SNAPSHOT: LobbySnapshotPayload;
  MATCH_FOUND: MatchFoundPayload;
  ACTION_CONFIRMED: ActionConfirmedPayload;
  ACTION_FAILED: ActionFailedPayload;
  OPPONENT_MOVED: OpponentMovedPayload;
  MATCH_RESOLVED: MatchResolvedPayload;
  REQUEST_CONNECT: Record<string, never>;
  REQUEST_QUEUE: { mode: "quick" };
  REQUEST_BRIDGE_OPEN: Record<string, never>;
  PLAY_CARD: { event_id: string; card_id: string; target_index: number };
  TURN_ENDED: { turn_number: number };
  SCENE_READY: { scene_key: string };
};
