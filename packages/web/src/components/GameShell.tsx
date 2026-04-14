"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { useSessionKey } from "@/hooks/useSessionKey";
import { BridgePanel } from "@/components/BridgePanel";
import { GameCanvas } from "@/components/GameCanvas";

export default function GameShell() {
  const { address, username, openConnect, openWallet } = useInterwovenKit();
  const { ready, expiresAt } = useSessionKey();

  if (!address) {
    return (
      <main style={{ padding: 48, textAlign: "center" }}>
        <h1 style={{ fontSize: 48, letterSpacing: "0.1em" }}>RYFT</h1>
        <p style={{ opacity: 0.7 }}>Cross-chain combat. Proven on-chain.</p>
        <button
          onClick={openConnect}
          style={{
            marginTop: 24,
            padding: "14px 32px",
            fontSize: 18,
            background: "var(--ryft-accent)",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Sign in with .init
        </button>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>RYFT</strong>
        <button onClick={openWallet}>
          {username ? `@${username}` : address.slice(0, 10) + "..."}
        </button>
      </header>
      <section style={{ marginTop: 32 }}>
        <p style={{ opacity: 0.6, fontSize: 12 }}>
          Session: {ready ? `ready (until ${new Date(expiresAt ?? 0).toLocaleTimeString()})` : "connecting"}
        </p>
      </section>
      <GameCanvas />
      <BridgePanel />
    </main>
  );
}
