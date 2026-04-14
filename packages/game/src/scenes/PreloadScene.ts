import * as Phaser from "phaser";
import { EventBus } from "../EventBus";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload");
  }
  preload() {
    // Day 3: generate real TextureAtlas with TexturePacker. Placeholder 1x1 atlas
    // keeps Phaser happy so the full scene chain boots without 404s.
    this.load.json("cards_atlas_meta", "/atlas/cards.json");
  }
  create() {
    EventBus.emitTyped("SCENE_READY", { scene_key: "Preload" });
    this.scene.start("MainMenu");
  }
}
