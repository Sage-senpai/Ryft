"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { useSessionKey } from "@/hooks/useSessionKey";
import { BridgePanel } from "@/components/BridgePanel";
import { GameCanvas } from "@/components/GameCanvas";

const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID ?? "ryft-1";

export default function GameShell() {
  const { address, username, openConnect, openWallet } = useInterwovenKit();
  const { ready } = useSessionKey();

  if (!address) {
    return (
      <main className="ryft-hero">
        <h1 className="ryft-logo">RYFT</h1>
        <p className="ryft-tagline">Cross-chain combat. Proven on-chain.</p>
        <button className="ryft-cta" onClick={openConnect}>
          Sign in with .init
        </button>
        <div className="ryft-features">
          <div className="ryft-feature">
            <div className="ryft-feature-title">Auto-signing UX</div>
            <div className="ryft-feature-body">
              Every card play auto-signs via InterwovenKit — zero wallet popups during battle.
            </div>
          </div>
          <div className="ryft-feature">
            <div className="ryft-feature-title">Interwoven Bridge</div>
            <div className="ryft-feature-body">
              Bring cards from any Initia appchain straight into your RYFT deck.
            </div>
          </div>
          <div className="ryft-feature">
            <div className="ryft-feature-title">.init identity</div>
            <div className="ryft-feature-body">
              Queue, battle, and taunt by your Initia Username. No hex addresses, ever.
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="ryft-app">
      <header className="ryft-hud">
        <div>
          <span className="ryft-hud-brand">RYFT</span>
          <span className="ryft-hud-chain">· {CHAIN_ID}</span>
        </div>
        <div className="ryft-hud-user">
          <span className="ryft-session-line">
            {ready ? "session ready" : "connecting..."}
          </span>
          <span className="ryft-hud-dot" />
          <button className="ryft-hud-pill" onClick={openWallet}>
            {username ? `@${username}.init` : `${address.slice(0, 10)}...`}
          </button>
        </div>
      </header>
      <section className="ryft-game-wrap">
        <div className="ryft-game-frame">
          <GameCanvas />
        </div>
      </section>
      <BridgePanel />
    </main>
  );
}
