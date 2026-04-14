"use client";

import { useCallback, useRef } from "react";
import { useInterwovenKit } from "@initia/interwovenkit-react";

const BATTLE_ADDR = process.env.NEXT_PUBLIC_CONTRACT_RYFT_BATTLE ?? "";

export interface QueuedAction {
  event_id: string;
  execute_msg: Record<string, unknown>;
}

export interface ActionResult {
  event_id: string;
  tx_hash?: string;
  error?: string;
}

export function useRyftAction() {
  const { requestTxBlock, address } = useInterwovenKit();

  const queue = useRef<QueuedAction[]>([]);
  const processing = useRef(false);

  const drain = useCallback(
    async (onResult: (r: ActionResult) => void) => {
      if (processing.current) return;
      processing.current = true;
      while (queue.current.length > 0) {
        const next = queue.current.shift();
        if (!next) break;
        try {
          const result = await requestTxBlock({
            messages: [
              {
                typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
                value: {
                  sender: address,
                  contract: BATTLE_ADDR,
                  msg: new TextEncoder().encode(JSON.stringify(next.execute_msg)),
                  funds: [],
                },
              },
            ],
          });
          onResult({ event_id: next.event_id, tx_hash: result.transactionHash });
        } catch (e) {
          onResult({ event_id: next.event_id, error: (e as Error).message });
        }
      }
      processing.current = false;
    },
    [requestTxBlock, address]
  );

  const enqueue = useCallback(
    (action: QueuedAction, onResult: (r: ActionResult) => void) => {
      queue.current.push(action);
      void drain(onResult);
    },
    [drain]
  );

  return { enqueue };
}
