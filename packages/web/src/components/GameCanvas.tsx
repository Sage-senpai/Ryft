"use client";

import { useEffect, useRef } from "react";
import { useInterwovenKit } from "@initia/interwovenkit-react";

const WS_URL = process.env.NEXT_PUBLIC_MATCHMAKING_WS_URL;
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || "interwoven-1";

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<{
    destroy: (a: boolean) => void;
    registry: { set: (k: string, v: unknown) => void };
  } | null>(null);
  const clientRef = useRef<{ close: () => void; queueJoin: () => void } | null>(null);
  const { address, username, openBridge } = useInterwovenKit();

  /* always-current ref so the Phaser event handler never captures a stale fn */
  const openBridgeRef = useRef(openBridge);
  openBridgeRef.current = openBridge;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const gameMod = await import("@ryft/game");
      if (cancelled || !containerRef.current) return;

      const game = gameMod.createRyftGame({
        parent: containerRef.current.id,
      }) as unknown as {
        destroy: (a: boolean) => void;
        registry: { set: (k: string, v: unknown) => void };
      };
      gameRef.current = game;

      // Write the wallet into the Phaser registry IMMEDIATELY so
      // MainMenuScene.create() can read it synchronously regardless of how
      // long Boot/Preload take. Scenes also listen for WALLET_CONNECTED
      // for the case where the wallet connects AFTER the game is already
      // on the menu scene.
      if (address) {
        game.registry.set("wallet", { address, username: username ?? "" });
      }

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

        /* Bridge button inside Phaser → open InterwovenKit bridge modal */
        gameMod.EventBus.onTyped("REQUEST_BRIDGE_OPEN", () => {
          openBridgeRef.current({
            srcChainId: "interwoven-1",
            srcDenom: "uinit",
            dstChainId: CHAIN_ID,
            dstDenom: "uryft",
            quantity: "1",
          });
        });
        } catch (e) {
          console.warn("[ryft] matchmaking client disabled:", (e as Error).message);
        }
      }

      // Also emit WALLET_CONNECTED for scenes that mount later. The
      // registry path handles the case where MainMenu runs create() before
      // this emit fires; this emit handles the case where the user
      // connects their wallet AFTER the game is already running.
      if (address) {
        gameMod.EventBus.emitTyped("WALLET_CONNECTED", {
          address,
          username: username ?? "",
        });
      }
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
