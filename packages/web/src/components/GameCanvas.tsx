"use client";

import { useEffect, useRef } from "react";
import { useInterwovenKit } from "@initia/interwovenkit-react";

const WS_URL = process.env.NEXT_PUBLIC_MATCHMAKING_WS_URL;

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<{ destroy: (a: boolean) => void } | null>(null);
  const clientRef = useRef<{ close: () => void; queueJoin: () => void } | null>(null);
  const { address, username } = useInterwovenKit();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const gameMod = await import("@ryft/game");
      if (cancelled || !containerRef.current) return;

      gameRef.current = gameMod.createRyftGame({
        parent: containerRef.current.id,
      }) as unknown as { destroy: (a: boolean) => void };

      // Wire the optional matchmaking ws client. If the env var is not
      // set we silently skip — the lobby falls back to its mock roster.
      if (WS_URL && address) {
        try {
          const { RyftClient } = await import("@ryft/server/client");
          clientRef.current = new RyftClient({
            url: WS_URL,
            address,
            username: username ?? "",
            onEvent: (frame) => {
              if (frame.type === "match_found") {
                gameMod.EventBus.emitTyped("MATCH_FOUND", {
                  match_id: frame.match_id,
                  opponent: {
                    username: frame.opponent.username,
                    address: frame.opponent.address,
                    status: "in_match",
                  },
                  role: frame.role,
                  on_chain_match_id: frame.on_chain_match_id,
                });
              }
            },
          });
          gameMod.EventBus.onTyped("REQUEST_QUEUE", () => clientRef.current?.queueJoin());
        } catch (e) {
          console.warn("[ryft] matchmaking client disabled:", (e as Error).message);
        }
      }

      setTimeout(() => {
        gameMod.EventBus.emitTyped("WALLET_CONNECTED", {
          address: address ?? "",
          username: username ?? "",
        });
      }, 400);
    })();
    return () => {
      cancelled = true;
      clientRef.current?.close();
      clientRef.current = null;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [address, username]);

  return <div id="ryft-game" ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
