import * as Phaser from "phaser";
import { EventBus } from "../EventBus";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenu");
  }
  create() {
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a12, 0x0a0a12, 0x1a1a2e, 0x2a1a3e, 1);
    bg.fillRect(0, 0, width, height);

    for (let i = 0; i < 40; i++) {
      const star = this.add.circle(
        Math.random() * width,
        Math.random() * height,
        Math.random() * 1.5 + 0.5,
        0xffffff,
        Math.random() * 0.6 + 0.2
      );
      this.tweens.add({
        targets: star,
        alpha: 0.1,
        duration: 1500 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
      });
    }

    const title = this.add
      .text(width / 2, height / 2 - 60, "RYFT", {
        fontSize: "96px",
        color: "#e8e8f0",
        fontStyle: "bold",
        fontFamily: "serif",
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: title,
      alpha: 0.85,
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });

    this.add
      .text(width / 2, height / 2 + 30, "Cross-chain combat. Proven on-chain.", {
        fontSize: "18px",
        color: "#a08cff",
        fontStyle: "italic",
      })
      .setOrigin(0.5);

    const statusText = this.add
      .text(width / 2, height / 2 + 120, "Connect your wallet to begin", {
        fontSize: "16px",
        color: "#6c6c80",
      })
      .setOrigin(0.5);

    EventBus.onTyped("WALLET_CONNECTED", (p) => {
      statusText.setText(`Welcome @${p.username || "warden"}`);
      statusText.setColor("#a08cff");
      this.time.delayedCall(600, () => this.scene.start("Lobby"));
    });

    EventBus.emitTyped("SCENE_READY", { scene_key: "MainMenu" });
  }
}
