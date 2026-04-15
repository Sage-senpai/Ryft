"use client";

import { useEffect, useRef } from "react";
import { useInterwovenKit } from "@initia/interwovenkit-react";

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<{ destroy: (a: boolean) => void } | null>(null);
  const { address, username } = useInterwovenKit();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const gameMod = await import("@ryft/game");
      if (cancelled || !containerRef.current) return;
      gameRef.current = gameMod.createRyftGame({
        parent: containerRef.current.id,
      }) as unknown as { destroy: (a: boolean) => void };
      // Allow BootScene → Preload → MainMenu chain to run first, then fire
      // wallet ready so MainMenu catches the event and advances to Lobby.
      setTimeout(() => {
        gameMod.EventBus.emitTyped("WALLET_CONNECTED", {
          address: address ?? "",
          username: username ?? "",
        });
      }, 400);
    })();
    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [address, username]);

  return <div id="ryft-game" ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
