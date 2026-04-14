"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";

export function useIdentity() {
  const { address, username } = useInterwovenKit() as {
    address?: string;
    username?: string;
  };
  const display = username ? `@${username}` : address ? `${address.slice(0, 10)}...` : "—";
  return { address, username, display };
}
