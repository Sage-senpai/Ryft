"use client";

import Link from "next/link";

const CARD_TYPES = [
  {
    rarity: "Common",
    border: "#7a7f8c",
    count: 6,
    desc: "Base stats, no ability",
    examples: [
      { name: "Ashveil Soldier", atk: 4, def: 3 },
      { name: "Tidecaller", atk: 3, def: 5 },
    ],
  },
  {
    rarity: "Rare",
    border: "#5b9bf5",
    count: 4,
    desc: "Enhanced stats + triggered ability",
    examples: [
      { name: "Emberstrike Warden", atk: 7, def: 4 },
      { name: "Frostbound Huntress", atk: 6, def: 5 },
    ],
  },
  {
    rarity: "Legendary",
    border: "#ffd700",
    count: 2,
    desc: "Max stats + active ability",
    examples: [
      { name: "The Unbroken", atk: 10, def: 8 },
      { name: "Voidmother", atk: 9, def: 7 },
    ],
  },
];

const STEPS = [
  { step: 1, text: "Sign in with your .init username" },
  { step: 2, text: "Click Quick Match to find an opponent" },
  { step: 3, text: "Hover over cards in your hand to preview stats" },
  { step: 4, text: "Click a card to play it onto the battlefield" },
  { step: 5, text: "Watch the attack animation resolve" },
  { step: 6, text: "Your opponent auto-responds with their play" },
  { step: 7, text: "Draw a new card at the start of each turn" },
  { step: 8, text: "Reach 0 HP = game over" },
];

const STATS = [
  {
    label: "Attack",
    color: "#ff6c8c",
    desc: "Damage dealt to the opponent when this card strikes",
  },
  {
    label: "Defense",
    color: "#5b9bf5",
    desc: "Damage absorbed by the opponent's defending card (~2 reduction)",
  },
  {
    label: "HP Cost",
    color: "#ffb84a",
    desc: "Health you spend from your own pool to play the card",
  },
  {
    label: "Rarity",
    color: "#a08cff",
    desc: "Determines the stat ceiling and whether the card has abilities",
  },
];

export default function HowToPlay() {
  return (
    <div className="ryft-guide">
      <div className="ryft-guide-inner">
        <Link href="/" className="ryft-guide-back">
          &larr; Back to RYFT
        </Link>

        <h1 className="ryft-guide-title">How to Play</h1>

        {/* What is RYFT */}
        <section className="ryft-guide-section">
          <h2 className="ryft-guide-heading">What is RYFT?</h2>
          <p className="ryft-guide-text">
            RYFT is a cross-chain card battle game built on Initia, where
            Elemental Wardens clash in real-time combat proven entirely on-chain.
            Collect cards across appchains, build your deck, and fight to be the
            last player standing.
          </p>
        </section>

        {/* Card Types */}
        <section className="ryft-guide-section">
          <h2 className="ryft-guide-heading">Card Types</h2>
          <div className="ryft-guide-cards-grid">
            {CARD_TYPES.map((ct) => (
              <div
                key={ct.rarity}
                className="ryft-guide-card-type"
                style={
                  {
                    "--card-border": ct.border,
                  } as React.CSSProperties
                }
              >
                <div className="ryft-guide-card-header">
                  <span className="ryft-guide-rarity">{ct.rarity}</span>
                  <span className="ryft-guide-card-count">
                    {ct.count} cards
                  </span>
                </div>
                <p className="ryft-guide-card-desc">{ct.desc}</p>
                <div className="ryft-guide-examples">
                  {ct.examples.map((ex) => (
                    <div key={ex.name} className="ryft-guide-example">
                      <span className="ryft-guide-example-name">{ex.name}</span>
                      <span className="ryft-guide-example-stats">
                        <span style={{ color: "#ff6c8c" }}>{ex.atk}</span>
                        {" / "}
                        <span style={{ color: "#5b9bf5" }}>{ex.def}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How to Win */}
        <section className="ryft-guide-section">
          <h2 className="ryft-guide-heading">How to Win</h2>
          <p className="ryft-guide-text">
            Both players start with 30 HP. Each turn, you play a card to deal
            damage -- your card's attack minus roughly 2 points of defense
            reduction from the opponent's side. The opponent counter-attacks on
            their turn. The first player to reach 0 HP loses the match.
          </p>
        </section>

        {/* How to Play Steps */}
        <section className="ryft-guide-section">
          <h2 className="ryft-guide-heading">Step by Step</h2>
          <ol className="ryft-guide-steps">
            {STEPS.map((s) => (
              <li key={s.step} className="ryft-guide-step">
                <span className="ryft-guide-step-num">{s.step}</span>
                <span className="ryft-guide-step-text">{s.text}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Card Stats Explained */}
        <section className="ryft-guide-section">
          <h2 className="ryft-guide-heading">Card Stats Explained</h2>
          <div className="ryft-guide-stats-grid">
            {STATS.map((s) => (
              <div key={s.label} className="ryft-guide-stat">
                <span
                  className="ryft-guide-stat-label"
                  style={{ color: s.color }}
                >
                  {s.label}
                </span>
                <span className="ryft-guide-stat-desc">{s.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Cross-chain Features */}
        <section className="ryft-guide-section">
          <h2 className="ryft-guide-heading">Cross-chain Features</h2>
          <ul className="ryft-guide-cross-list">
            <li>
              <strong>Interwoven Bridge</strong> -- Import cards from other
              Initia appchains directly into your RYFT deck.
            </li>
            <li>
              <strong>.init Usernames</strong> -- Players are identified by
              human-readable .init names, never raw hex addresses.
            </li>
            <li>
              <strong>Session Keys</strong> -- Auto-sign every move during
              battle with zero wallet popups via InterwovenKit session keys.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
