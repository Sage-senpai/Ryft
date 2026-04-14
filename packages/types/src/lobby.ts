export type LobbyStatus = "idle" | "in_queue" | "in_match";

export interface LobbyPlayer {
  username: string;
  address: string;
  status: LobbyStatus;
}

export interface MatchFoundPayload {
  match_id: string;
  opponent: LobbyPlayer;
  role: "host" | "guest";
  on_chain_match_id: string;
}
