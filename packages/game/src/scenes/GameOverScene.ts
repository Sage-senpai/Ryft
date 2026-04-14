import * as Phaser from "phaser";
import { EventBus } from "../EventBus";

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOver");
  }
  create() {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, "Match resolved", { fontSize: "36px", color: "#e8e8f0" })
      .setOrigin(0.5);
    EventBus.emitTyped("SCENE_READY", { scene_key: "GameOver" });
  }
}
