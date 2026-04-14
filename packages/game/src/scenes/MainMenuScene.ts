import * as Phaser from "phaser";
import { EventBus } from "../EventBus";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenu");
  }
  create() {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2 - 40, "RYFT", { fontSize: "72px", color: "#e8e8f0" })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height / 2 + 30, "Cross-chain combat", { fontSize: "18px", color: "#6c5ce7" })
      .setOrigin(0.5);
    EventBus.onTyped("WALLET_CONNECTED", () => this.scene.start("Lobby"));
    EventBus.emitTyped("SCENE_READY", { scene_key: "MainMenu" });
  }
}
