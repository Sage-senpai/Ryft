import Phaser from "phaser";
import { EventBus } from "../EventBus";

interface Beats {
  attack_ms: number;
  turn_ms: number;
  draw_ms: number;
  death_ms: number;
  special_ms: number;
  damage_display_ms: number;
}

export class BattleScene extends Phaser.Scene {
  private beats!: Beats;

  constructor() {
    super("Battle");
  }
  create() {
    this.beats = this.registry.get("beats") as Beats;
    this.add.text(24, 24, "Battle", { fontSize: "32px", color: "#e8e8f0" });
    EventBus.onTyped("ACTION_CONFIRMED", this.onActionConfirmed, this);
    EventBus.onTyped("OPPONENT_MOVED", this.onOpponentMoved, this);
    EventBus.onTyped("MATCH_RESOLVED", () => this.scene.start("GameOver"));
    EventBus.emitTyped("SCENE_READY", { scene_key: "Battle" });
  }
  private onActionConfirmed(_p: { event_id: string; tx_hash: string }) {
    // D2: play attack tween of duration this.beats.attack_ms
  }
  private onOpponentMoved(_p: { card_id: string; target: number; damage: number }) {
    // D2: play opponent card animation
  }
}
