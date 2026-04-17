"use client";

import { useState } from "react";
import Link from "next/link";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { useSessionKey } from "@/hooks/useSessionKey";
import { GameCanvas } from "@/components/GameCanvas";
import { SettingsPanel } from "@/components/SettingsPanel";

function QuickGuidePanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="ryft-qguide-overlay" onClick={onClose}>
      <div className="ryft-qguide-panel" onClick={(e) => e.stopPropagation()}>
        <div className="ryft-qguide-header">
          <h2 className="ryft-qguide-title">HOW TO PLAY</h2>
          <button className="ryft-qguide-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="ryft-qguide-body">
          <div>
            <p className="ryft-qguide-section-title">Objective</p>
            <div className="ryft-qguide-items">
              <div className="ryft-qguide-item">Reduce your opponent&apos;s <strong>HP to 0</strong> before they do the same to you. Both players start at <strong>30 HP</strong>.</div>
            </div>
          </div>
          <div>
            <p className="ryft-qguide-section-title">Your Turn</p>
            <div className="ryft-qguide-items">
              <div className="ryft-qguide-item"><strong>Click a card</strong> in your hand to play it — your Warden attacks the opponent directly.</div>
              <div className="ryft-qguide-item">Each card has <strong>ATK</strong> (damage dealt) and <strong>DEF</strong> (damage blocked). Your opponent&apos;s ATK hits you back.</div>
              <div className="ryft-qguide-item">After you play, it&apos;s the opponent&apos;s turn — they auto-play. New cards are drawn each round.</div>
            </div>
          </div>
          <div>
            <p className="ryft-qguide-section-title">Card Rarities</p>
            <div className="ryft-qguide-rarity-row">
              <span className="ryft-qguide-rarity-tag" style={{ background: "rgba(108,92,231,0.2)", color: "#a08cff", border: "1px solid #6c5ce7" }}>COMMON</span>
              <span className="ryft-qguide-rarity-tag" style={{ background: "rgba(0,200,255,0.15)", color: "#00c8ff", border: "1px solid #00c8ff" }}>RARE</span>
              <span className="ryft-qguide-rarity-tag" style={{ background: "rgba(255,184,74,0.2)", color: "#ffb84a", border: "1px solid #ffb84a" }}>LEGENDARY</span>
            </div>
            <div className="ryft-qguide-items" style={{ marginTop: 8 }}>
              <div className="ryft-qguide-item">Higher rarity = stronger stats. <strong>Legendary</strong> cards can swing the match in a single play.</div>
            </div>
          </div>
          <div>
            <p className="ryft-qguide-section-title">Cross-chain</p>
            <div className="ryft-qguide-items">
              <div className="ryft-qguide-item">Use the <strong>Bridge</strong> panel (bottom) to bring cards from any Initia appchain into your deck via the Interwoven Bridge.</div>
            </div>
          </div>
          <Link href="/how-to-play" className="ryft-qguide-link" onClick={onClose}>
            Full guide with all 12 Wardens →
          </Link>
        </div>
      </div>
    </div>
  );
}

const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || "interwoven-1";

/* Small floating particles for the hero background */
function HeroParticles() {
  return (
    <div className="ryft-particles" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="ryft-particle"
          style={
            {
              "--x": `${6 + Math.random() * 88}%`,
              "--delay": `${Math.random() * 6}s`,
              "--dur": `${4 + Math.random() * 5}s`,
              "--size": `${2 + Math.random() * 3}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export default function GameShell() {
  const { address, username, openConnect, openWallet, openBridge } = useInterwovenKit();
  const { ready } = useSessionKey();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const handleBridge = () => {
    openBridge({
      srcChainId: "interwoven-1",
      srcDenom: "uinit",
      dstChainId: CHAIN_ID,
      dstDenom: "uryft",
      quantity: "1",
    });
  };

  if (!address) {
    return (
      <main className="ryft-hero">
        <HeroParticles />
        <h1 className="ryft-logo">RYFT</h1>
        <p className="ryft-tagline">Cross-chain combat. Proven on-chain.</p>
        <p className="ryft-subheading">
          12 Elemental Wardens. 3 Rarity Tiers. One Victor.
        </p>
        <button className="ryft-cta" onClick={openConnect}>
          Sign in with .init
        </button>
        <Link href="/how-to-play" className="ryft-how-link">
          How to Play
        </Link>
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
        <p className="ryft-hero-footer">
          Built on Initia &middot; Interwoven Bridge &middot; .init Usernames
        </p>
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
          <button className="ryft-bridge-btn" onClick={handleBridge} style={{ padding: "8px 14px", fontSize: 13 }}>
            Bridge
          </button>
          <button
            className="ryft-hud-help"
            onClick={() => setGuideOpen(true)}
            aria-label="How to Play"
          >
            ?
          </button>
          <button
            className="ryft-hud-gear"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 13a3 3 0 100-6 3 3 0 000 6z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M11.7 1.5h-3.4l-.5 2.1a6.5 6.5 0 00-1.7 1l-2-.8-1.7 3 1.5 1.4a6.6 6.6 0 000 1.6l-1.5 1.4 1.7 3 2-.8c.5.4 1.1.7 1.7 1l.5 2.1h3.4l.5-2.1a6.5 6.5 0 001.7-1l2 .8 1.7-3-1.5-1.4a6.6 6.6 0 000-1.6l1.5-1.4-1.7-3-2 .8a6.5 6.5 0 00-1.7-1l-.5-2.1z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </header>
      <section className="ryft-game-wrap">
        <div className="ryft-game-frame">
          <GameCanvas />
        </div>
      </section>
      {guideOpen && (
        <QuickGuidePanel onClose={() => setGuideOpen(false)} />
      )}
      {settingsOpen && (
        <SettingsPanel onClose={() => setSettingsOpen(false)} />
      )}
    </main>
  );
}
