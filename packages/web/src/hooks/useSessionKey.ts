"use client";

import { useEffect, useState } from "react";
import { useInterwovenKit } from "@initia/interwovenkit-react";

const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID ?? "ryft-1";
const RENEW_THRESHOLD_MS = 300_000;
const POLL_MS = 60_000;

export interface SessionKeyState {
  ready: boolean;
  expiresAt: number | null;
  error: string | null;
}

export function useSessionKey(): SessionKeyState {
  const { address, autoSign } = useInterwovenKit() as {
    address?: string;
    autoSign: {
      isLoading: boolean;
      enable: (chainId?: string) => Promise<void>;
      isEnabledByChain: Record<string, boolean>;
      expiredAtByChain: Record<string, Date | null | undefined>;
    };
  };

  const [error, setError] = useState<string | null>(null);
  const enabled = autoSign.isEnabledByChain[CHAIN_ID] ?? false;
  const expiresAt = autoSign.expiredAtByChain[CHAIN_ID]?.getTime() ?? null;

  useEffect(() => {
    if (!address || autoSign.isLoading || enabled) return;
    autoSign.enable(CHAIN_ID).catch((e: Error) => setError(e.message));
  }, [address, autoSign, enabled]);

  useEffect(() => {
    if (!enabled || !expiresAt) return;
    const tick = () => {
      const remaining = expiresAt - Date.now();
      if (remaining < RENEW_THRESHOLD_MS) {
        autoSign.enable(CHAIN_ID).catch((e: Error) => setError(e.message));
      }
    };
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [enabled, expiresAt, autoSign]);

  return { ready: enabled, expiresAt, error };
}
