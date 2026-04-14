import * as Phaser from "phaser";
import { EventBus } from "../EventBus";

export class LobbyScene extends Phaser.Scene {
  constructor() {
    super("Lobby");
  }
  create() {
    this.add.text(24, 24, "Lobby", { fontSize: "32px", color: "#e8e8f0" });
    EventBus.onTyped("MATCH_FOUND", () => this.scene.start("Battle"));
    EventBus.emitTyped("SCENE_READY", { scene_key: "Lobby" });
  }
}
