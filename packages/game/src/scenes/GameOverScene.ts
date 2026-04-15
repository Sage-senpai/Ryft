import * as Phaser from "phaser";
import { EventBus } from "../EventBus";

export class GameOverScene extends Phaser.Scene {
  private won = false;

  constructor() {
    super("GameOver");
  }

  init(data: { won?: boolean }) {
    this.won = data?.won ?? false;
  }

  create() {
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillStyle(0x060612, 0.92);
    bg.fillRect(0, 0, width, height);

    const title = this.add
      .text(width / 2, height / 2 - 80, this.won ? "VICTORY" : "DEFEAT", {
        fontSize: "72px",
        color: this.won ? "#6cff9a" : "#ff6c8c",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    title.setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, y: title.y - 10, duration: 700, ease: "Back.easeOut" });

    const sub = this.add
      .text(width / 2, height / 2 + 10, this.won ? "The warden stands unbroken." : "The void claims another.", {
        fontSize: "16px",
        color: "#a08cff",
        fontStyle: "italic",
      })
      .setOrigin(0.5);
    sub.setAlpha(0);
    this.tweens.add({ targets: sub, alpha: 1, delay: 400, duration: 600 });

    const btnX = width / 2 - 100;
    const btnY = height / 2 + 80;
    const g = this.add.graphics();
    g.fillStyle(0x6c5ce7, 1);
    g.fillRoundedRect(btnX, btnY, 200, 52, 10);
    this.add
      .text(btnX + 100, btnY + 26, "Return to Lobby", { fontSize: "16px", color: "#ffffff", fontStyle: "bold" })
      .setOrigin(0.5);
    const zone = this.add.zone(btnX, btnY, 200, 52).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    zone.on("pointerdown", () => this.scene.start("Lobby"));

    EventBus.emitTyped("SCENE_READY", { scene_key: "GameOver" });
  }
}
