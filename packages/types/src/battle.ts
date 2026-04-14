import type { CardInstance } from "./cards";

export type MatchStatus = "pending" | "active" | "resolved" | "cancelled";

export interface MatchState {
  match_id: string;
  on_chain_match_id: string;
  host: string;
  guest: string;
  status: MatchStatus;
  turn: number;
  host_hp: number;
  guest_hp: number;
  host_hand: CardInstance[];
  guest_hand_size: number;
}

export interface PlayCardPayload {
  event_id: string;
  card_id: string;
  target_index: number;
}

export interface CommitPlayMsg {
  commit_play: {
    match_id: string;
    commitment: string;
  };
}

export interface RevealPlayMsg {
  reveal_play: {
    match_id: string;
    card_id: string;
    target_index: number;
    salt: string;
  };
}

export type RyftBattleExecuteMsg =
  | { open_match: { opponent: string } }
  | CommitPlayMsg
  | RevealPlayMsg
  | { resolve_match: { match_id: string } };
