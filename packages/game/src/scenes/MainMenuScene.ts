import * as Phaser from "phaser";
import { EventBus } from "../EventBus";
import { ryftAudio } from "../audio";

interface WalletState {
  address: string;
  username: string;
}

export class MainMenuScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private advanced = false;

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

    this.statusText = this.add
      .text(width / 2, height / 2 + 110, "", {
        fontSize: "16px",
        color: "#6c6c80",
      })
      .setOrigin(0.5);

    this.hintText = this.add
      .text(width / 2, height / 2 + 150, "", {
        fontSize: "13px",
        color: "#a08cff",
      })
      .setOrigin(0.5);

    // Check the registry synchronously — GameCanvas writes the wallet there
    // before Boot/Preload finish, so we can react on first paint even if
    // the WALLET_CONNECTED event fired before we subscribed.
    const existing = this.registry.get("wallet") as WalletState | undefined;
    if (existing?.address) {
      this.onWalletReady(existing);
    } else {
      this.statusText.setText("Connect your wallet to begin");
      this.hintText.setText("Click \"Sign in with .init\" at the top of the page");
    }

    EventBus.onTyped("WALLET_CONNECTED", (p) => {
      this.onWalletReady({ address: p.address, username: p.username });
    });

    ryftAudio.startAmbient();
    EventBus.emitTyped("SCENE_READY", { scene_key: "MainMenu" });
  }

  private onWalletReady(wallet: WalletState) {
    if (this.advanced) return;
    this.advanced = true;
    const name = wallet.username || wallet.address.slice(0, 10) + "...";
    this.statusText.setText(`Welcome @${name}`);
    this.statusText.setColor("#a08cff");
    this.hintText.setText("Entering lobby...");
    this.time.delayedCall(700, () => {
      if (this.scene.isActive("MainMenu")) {
        this.scene.start("Lobby");
      }
    });
  }
}
