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
        width: 1280,
        height: 720,
      }) as unknown as { destroy: (a: boolean) => void };
      if (address) {
        gameMod.EventBus.emitTyped("WALLET_CONNECTED", {
          address,
          username: username ?? "",
        });
      }
    })();
    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [address, username]);

  return (
    <div
      id="ryft-game"
      ref={containerRef}
      style={{ width: "100%", aspectRatio: "16/9", maxWidth: 1280, marginTop: 16 }}
    />
  );
}
