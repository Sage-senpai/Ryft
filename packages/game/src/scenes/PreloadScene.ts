import * as Phaser from "phaser";
import { EventBus } from "../EventBus";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload");
  }
  preload() {
    // No external assets — scenes render with Phaser Graphics primitives so
    // the game boots instantly without waiting on atlases. Real atlas is a
    // post-hackathon polish pass.
  }
  create() {
    EventBus.emitTyped("SCENE_READY", { scene_key: "Preload" });
    this.scene.start("MainMenu");
  }
}
