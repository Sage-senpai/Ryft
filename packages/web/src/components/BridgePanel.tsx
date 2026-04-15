"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";

export function BridgePanel() {
  const { openBridge } = useInterwovenKit();

  const bringCards = () => {
    openBridge({
      srcChainId: "interwoven-1",
      srcDenom: "uinit",
      dstChainId: process.env.NEXT_PUBLIC_CHAIN_ID || "interwoven-1",
      dstDenom: "uryft",
      quantity: "1",
    });
  };

  return (
    <section className="ryft-bridge-panel">
      <div>
        <p className="ryft-bridge-title">Bring cards from another world</p>
        <p className="ryft-bridge-sub">
          Import assets from any Initia appchain via the Interwoven Bridge. Your cards carry their rarity across chains.
        </p>
      </div>
      <button className="ryft-bridge-btn" onClick={bringCards}>
        Open bridge →
      </button>
    </section>
  );
}
