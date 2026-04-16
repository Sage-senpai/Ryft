import * as Phaser from "phaser";
import { EventBus } from "../EventBus";
import { ryftAudio } from "../audio";

const MOCK_PLAYERS = [
  { username: "ashveil", rating: 1812 },
  { username: "tidecaller", rating: 1654 },
  { username: "emberstrike", rating: 1973 },
  { username: "voidmother", rating: 2108 },
  { username: "frostbound", rating: 1520 },
];

export class LobbyScene extends Phaser.Scene {
  constructor() {
    super("Lobby");
  }
  create() {
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a12, 1);
    bg.fillRect(0, 0, width, height);

    this.add.text(40, 32, "LOBBY", { fontSize: "28px", color: "#e8e8f0", fontStyle: "bold" });
    this.add.text(40, 66, "Elemental Wardens queue", { fontSize: "14px", color: "#6c6c80" });

    // How-to-play banner
    const tipBar = this.add.graphics();
    tipBar.fillStyle(0x1a1a2e, 0.9);
    tipBar.fillRoundedRect(40, height - 60, width - 80, 44, 6);
    tipBar.lineStyle(1, 0x6c5ce7, 0.5);
    tipBar.strokeRoundedRect(40, height - 60, width - 80, 44, 6);
    this.add
      .text(
        width / 2,
        height - 38,
        "→ Click QUICK MATCH to battle. Click Bring Cards to open the Interwoven Bridge.",
        { fontSize: "13px", color: "#a08cff" }
      )
      .setOrigin(0.5);

    const panelX = 40;
    const panelY = 110;
    const panelW = 520;
    const rowH = 56;

    const header = this.add.graphics();
    header.fillStyle(0x1a1a2e, 1);
    header.fillRoundedRect(panelX, panelY, panelW, 38, 6);
    this.add.text(panelX + 16, panelY + 10, "Online Wardens", { fontSize: "13px", color: "#a08cff" });
    this.add.text(panelX + panelW - 80, panelY + 10, "Rating", { fontSize: "13px", color: "#a08cff" });

    MOCK_PLAYERS.forEach((p, i) => {
      const y = panelY + 50 + i * rowH;
      const row = this.add.graphics();
      row.fillStyle(0x12121f, 1);
      row.fillRoundedRect(panelX, y, panelW, rowH - 8, 6);
      this.add.text(panelX + 16, y + 12, `@${p.username}.init`, { fontSize: "16px", color: "#e8e8f0" });
      const statusDot = this.add.circle(panelX + 16 + 160, y + 20, 4, 0x6cff9a);
      this.tweens.add({ targets: statusDot, alpha: 0.4, duration: 1200, yoyo: true, repeat: -1 });
      this.add.text(panelX + 16 + 170, y + 13, "idle", { fontSize: "12px", color: "#6cff9a" });
      this.add.text(panelX + panelW - 80, y + 12, String(p.rating), {
        fontSize: "16px",
        color: "#ffb84a",
      });
    });

    const btnX = width - 280;
    const btnY = 110;

    this.drawButton(btnX, btnY, "QUICK MATCH", 240, 64, 0x6c5ce7, () => {
      EventBus.emitTyped("REQUEST_QUEUE", { mode: "quick" });
      this.startCountdown();
    });

    this.drawButton(btnX, btnY + 88, "Bring Cards", 240, 48, 0x1a1a2e, () => {
      EventBus.emitTyped("REQUEST_BRIDGE_OPEN", {});
    });

    this.drawButton(btnX, btnY + 152, "Collection", 240, 48, 0x1a1a2e, () => {});

    EventBus.onTyped("MATCH_FOUND", () => {
      if (this.scene.isActive("Lobby")) {
        this.scene.start("Battle");
      }
    });

    ryftAudio.playTurnStart();
    EventBus.emitTyped("SCENE_READY", { scene_key: "Lobby" });
  }

  private drawButton(x: number, y: number, label: string, w: number, h: number, color: number, onClick: () => void) {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRoundedRect(x, y, w, h, 8);
    g.lineStyle(1, 0xffffff, 0.1);
    g.strokeRoundedRect(x, y, w, h, 8);

    const txt = this.add
      .text(x + w / 2, y + h / 2, label, { fontSize: "16px", color: "#ffffff", fontStyle: "bold" })
      .setOrigin(0.5);

    const zone = this.add.zone(x, y, w, h).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    zone.on("pointerover", () => {
      g.clear();
      g.fillStyle(color === 0x6c5ce7 ? 0x8270ff : 0x2a2a45, 1);
      g.fillRoundedRect(x, y, w, h, 8);
      g.lineStyle(1, 0xffffff, 0.25);
      g.strokeRoundedRect(x, y, w, h, 8);
    });
    zone.on("pointerout", () => {
      g.clear();
      g.fillStyle(color, 1);
      g.fillRoundedRect(x, y, w, h, 8);
      g.lineStyle(1, 0xffffff, 0.1);
      g.strokeRoundedRect(x, y, w, h, 8);
    });
    zone.on("pointerdown", onClick);
    return { g, txt };
  }

  private startCountdown() {
    const { width, height } = this.scale;
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);

    const text = this.add
      .text(width / 2, height / 2, "Searching for opponent...", {
        fontSize: "24px",
        color: "#e8e8f0",
      })
      .setOrigin(0.5);

    this.time.delayedCall(1200, () => {
      text.setText("Opponent found: @voidmother.init");
      text.setColor("#a08cff");
      this.time.delayedCall(800, () => {
        EventBus.emitTyped("MATCH_FOUND", {
          match_id: "demo-match-1",
          opponent: { username: "voidmother", address: "init1voidmother", status: "in_match" },
          role: "host",
          on_chain_match_id: "1",
        });
      });
    });
  }
}
