import * as Phaser from "phaser";
import type { EventPayloads } from "@ryft/types";

class TypedEventBus extends Phaser.Events.EventEmitter {
  emitTyped<K extends keyof EventPayloads>(event: K, payload: EventPayloads[K]): boolean {
    return this.emit(event, payload);
  }
  onTyped<K extends keyof EventPayloads>(event: K, fn: (p: EventPayloads[K]) => void, ctx?: unknown) {
    return this.on(event, fn, ctx);
  }
  offTyped<K extends keyof EventPayloads>(event: K, fn: (p: EventPayloads[K]) => void) {
    return this.off(event, fn);
  }
}

export const EventBus = new TypedEventBus();
