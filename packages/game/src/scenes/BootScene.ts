import * as Phaser from "phaser";
import { EventBus } from "../EventBus";

const DEFAULT_BEATS = {
  draw_ms: 320,
  attack_ms: 480,
  damage_display_ms: 600,
  death_ms: 700,
  special_ms: 900,
  turn_ms: 1800,
  card_enter_ms: 240,
  card_hover_ms: 120,
  hp_bar_tween_ms: 400,
  scene_transition_ms: 350,
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }
  async create() {
    try {
      const res = await fetch("/animation-beats.json");
      if (res.ok) {
        const json = (await res.json()) as { beats: typeof DEFAULT_BEATS };
        this.registry.set("beats", json.beats);
      } else {
        this.registry.set("beats", DEFAULT_BEATS);
      }
    } catch {
      this.registry.set("beats", DEFAULT_BEATS);
    }
    EventBus.emitTyped("SCENE_READY", { scene_key: "Boot" });
    this.scene.start("Preload");
  }
}
