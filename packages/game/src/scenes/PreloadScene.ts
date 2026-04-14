import Phaser from "phaser";
import { EventBus } from "../EventBus";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload");
  }
  preload() {
    this.load.atlas("cards", "/atlas/cards.png", "/atlas/cards.json");
  }
  create() {
    EventBus.emitTyped("SCENE_READY", { scene_key: "Preload" });
    this.scene.start("MainMenu");
  }
}
