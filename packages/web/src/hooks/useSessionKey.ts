"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";

// InterwovenKit v2 does not yet expose an AutoSign/session-key API surface
// (the docs page describing `autoSign.enable()` is ahead of the published
// 2.0.0 package). Until it lands, RYFT treats "session ready" as "wallet
// connected" — every card play goes through requestTxBlock which shows the
// InterwovenKit drawer. When AutoSign lands, this hook is the single place
// we swap the implementation in.
export interface SessionKeyState {
  ready: boolean;
  expiresAt: number | null;
  error: string | null;
}

export function useSessionKey(): SessionKeyState {
  const { isConnected } = useInterwovenKit();
  return { ready: isConnected, expiresAt: null, error: null };
}
