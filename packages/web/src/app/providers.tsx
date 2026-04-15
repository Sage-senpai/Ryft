"use client";

import { PropsWithChildren, useEffect } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  initiaPrivyWalletConnector,
  injectStyles,
  InterwovenKitProvider,
} from "@initia/interwovenkit-react";
import InterwovenKitStyles from "@initia/interwovenkit-react/styles.js";

const wagmiConfig = createConfig({
  connectors: [initiaPrivyWalletConnector],
  chains: [mainnet],
  transports: { [mainnet.id]: http() },
});

const queryClient = new QueryClient();

// InterwovenKit ships a chain registry that includes `interwoven-1`
// (Initia testnet) and all known Minitias. Our own `ryft-1` chain is not
// in the registry yet because it has not been launched with `weave`.
// Until it is, we default to `interwoven-1` so the hackathon demo boots
// against a real chain. The moment ryft-1 is live, set
// NEXT_PUBLIC_CHAIN_ID=ryft-1 in .env.local and register it via the
// customChain prop below (the shape is @initia/initia-registry-types#Chain).
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || "interwoven-1";

export default function Providers({ children }: PropsWithChildren) {
  useEffect(() => {
    injectStyles(InterwovenKitStyles);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <InterwovenKitProvider defaultChainId={CHAIN_ID}>
          {children}
        </InterwovenKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
