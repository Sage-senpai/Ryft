import * as Phaser from "phaser";
import { EventBus } from "../EventBus";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }
  async preload() {
    const beats = await fetch("/animation-beats.json").then((r) => r.json());
    this.registry.set("beats", beats.beats);
  }
  create() {
    EventBus.emitTyped("SCENE_READY", { scene_key: "Boot" });
    this.scene.start("Preload");
  }
}
