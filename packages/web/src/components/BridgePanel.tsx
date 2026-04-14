"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";

export function BridgePanel() {
  const { openBridge } = useInterwovenKit();

  const bringCards = () => {
    openBridge({
      srcChainId: "interwoven-1",
      srcDenom: "uinit",
      dstChainId: process.env.NEXT_PUBLIC_CHAIN_ID ?? "ryft-1",
      dstDenom: "uryft",
      quantity: "1",
    });
  };

  return (
    <section style={{ marginTop: 32, padding: 16, border: "1px solid #333", borderRadius: 8 }}>
      <h3 style={{ margin: 0 }}>Collection</h3>
      <p style={{ opacity: 0.7 }}>Bring a card from another world.</p>
      <button onClick={bringCards}>Open bridge</button>
    </section>
  );
}
