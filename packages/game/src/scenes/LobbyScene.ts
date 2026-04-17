import * as Phaser from "phaser";
import { EventBus } from "../EventBus";
import { ryftAudio } from "../audio";
import { RYFT_CARDS, RARITY_COLOR, RARITY_GLOW } from "../cards";

const MOCK_PLAYERS = [
  { username: "ashveil",     rating: 1812 },
  { username: "tidecaller",  rating: 1654 },
  { username: "emberstrike", rating: 1973 },
  { username: "voidmother",  rating: 2108 },
  { username: "frostbound",  rating: 1520 },
];

export class LobbyScene extends Phaser.Scene {
  /* overlay containers so we can destroy them cleanly */
  private collectionOverlay: Phaser.GameObjects.Container | null = null;
  private guideOverlay: Phaser.GameObjects.Container | null = null;

  constructor() {
    super("Lobby");
  }

  create() {
    const { width, height } = this.scale;

    /* ── background ── */
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a12, 1);
    bg.fillRect(0, 0, width, height);

    /* subtle grid lines for atmosphere */
    bg.lineStyle(1, 0x1a1a2e, 0.8);
    for (let y = 0; y <= height; y += 60) bg.lineBetween(0, y, width, y);
    for (let x = 0; x <= width; x += 80) bg.lineBetween(x, 0, x, height);

    /* ── header ── */
    this.add.text(40, 28, "LOBBY", { fontSize: "30px", color: "#e8e8f0", fontStyle: "bold", letterSpacing: 6 });
    this.add.text(40, 64, "Elemental Wardens queue", { fontSize: "13px", color: "#6c6c80" });

    /* ── online player list ── */
    const panelX = 40;
    const panelY = 108;
    const panelW = 520;
    const rowH = 54;

    const header = this.add.graphics();
    header.fillStyle(0x14142a, 1);
    header.fillRoundedRect(panelX, panelY, panelW, 36, 6);
    header.lineStyle(1, 0x3a2a5a, 1);
    header.strokeRoundedRect(panelX, panelY, panelW, 36, 6);
    this.add.text(panelX + 16, panelY + 10, "Online Wardens", { fontSize: "13px", color: "#a08cff" });
    this.add.text(panelX + panelW - 84, panelY + 10, "Rating", { fontSize: "13px", color: "#a08cff" });

    MOCK_PLAYERS.forEach((p, i) => {
      const y = panelY + 48 + i * rowH;
      const row = this.add.graphics();
      row.fillStyle(0x10101e, 1);
      row.fillRoundedRect(panelX, y, panelW, rowH - 6, 6);
      row.lineStyle(1, 0x2a1a3e, 1);
      row.strokeRoundedRect(panelX, y, panelW, rowH - 6, 6);

      this.add.text(panelX + 16, y + 10, `@${p.username}.init`, {
        fontSize: "16px",
        color: "#e8e8f0",
        fontStyle: "bold",
      });
      const dot = this.add.circle(panelX + 16 + 168, y + 19, 4, 0x6cff9a);
      this.tweens.add({ targets: dot, alpha: 0.3, duration: 1100, yoyo: true, repeat: -1 });
      this.add.text(panelX + 16 + 178, y + 11, "idle", { fontSize: "12px", color: "#6cff9a" });
      this.add.text(panelX + panelW - 84, y + 10, String(p.rating), {
        fontSize: "16px",
        color: "#ffb84a",
        fontStyle: "bold",
      });
    });

    /* ── right-column action buttons ── */
    const btnX = width - 280;
    const btnY = 108;

    this.makeButton(btnX, btnY, "QUICK MATCH", 240, 64, 0x6c5ce7, 0x8270ff, () => {
      ryftAudio.playTurnStart();
      EventBus.emitTyped("REQUEST_QUEUE", { mode: "quick" });
      this.startCountdown();
    });

    this.makeButton(btnX, btnY + 86, "Bring Cards", 240, 50, 0x1a1a2e, 0x2a2a45, () => {
      ryftAudio.playCardPlace();
      EventBus.emitTyped("REQUEST_BRIDGE_OPEN", {});
    });

    this.makeButton(btnX, btnY + 150, "Collection", 240, 50, 0x1a1a2e, 0x2a2a45, () => {
      ryftAudio.playDraw();
      this.showCollection();
    });

    this.makeButton(btnX, btnY + 214, "? How to Play", 240, 50, 0x10101e, 0x2a1a3e, () => {
      ryftAudio.playDraw();
      this.showGuide();
    });

    /* ── MATCH_FOUND listener ── */
    EventBus.onTyped("MATCH_FOUND", () => {
      if (this.scene.isActive("Lobby")) this.scene.start("Battle");
    });

    ryftAudio.playTurnStart();
    EventBus.emitTyped("SCENE_READY", { scene_key: "Lobby" });
  }

  /* ──────────────────────────────────────────────────────────────── */
  /*  Button factory                                                  */
  /* ──────────────────────────────────────────────────────────────── */
  private makeButton(
    x: number, y: number, label: string,
    w: number, h: number,
    color: number, hoverColor: number,
    onClick: () => void,
  ) {
    const g = this.add.graphics();
    const draw = (c: number) => {
      g.clear();
      g.fillStyle(c, 1);
      g.fillRoundedRect(x, y, w, h, 8);
      g.lineStyle(1, 0xffffff, c === hoverColor ? 0.25 : 0.1);
      g.strokeRoundedRect(x, y, w, h, 8);
    };
    draw(color);

    const txt = this.add
      .text(x + w / 2, y + h / 2, label, {
        fontSize: "15px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const zone = this.add.zone(x, y, w, h).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    zone.on("pointerover",  () => { draw(hoverColor); txt.setScale(1.04); });
    zone.on("pointerout",   () => { draw(color);      txt.setScale(1); });
    zone.on("pointerdown",  onClick);
    return { g, txt };
  }

  /* ──────────────────────────────────────────────────────────────── */
  /*  Matchmaking countdown overlay                                   */
  /* ──────────────────────────────────────────────────────────────── */
  private startCountdown() {
    const { width, height } = this.scale;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.78);
    overlay.fillRect(0, 0, width, height);

    const searchText = this.add
      .text(width / 2, height / 2 - 16, "Searching for opponent...", {
        fontSize: "26px", color: "#e8e8f0", fontStyle: "bold",
      })
      .setOrigin(0.5);

    /* pulsing dots */
    const dots = this.add.text(width / 2, height / 2 + 24, "● ● ●", {
      fontSize: "18px", color: "#6c5ce7",
    }).setOrigin(0.5);
    this.tweens.add({ targets: dots, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });

    this.time.delayedCall(1400, () => {
      searchText.setText("Opponent found: @voidmother.init");
      searchText.setColor("#a08cff");
      dots.setVisible(false);
      ryftAudio.playTurnStart();
      this.time.delayedCall(700, () => {
        EventBus.emitTyped("MATCH_FOUND", {
          match_id: "demo-match-1",
          opponent: { username: "voidmother", address: "init1voidmother", status: "in_match" },
          role: "host",
          on_chain_match_id: "1",
        });
      });
    });
  }

  /* ──────────────────────────────────────────────────────────────── */
  /*  Collection overlay — all 12 Elemental Wardens                  */
  /* ──────────────────────────────────────────────────────────────── */
  private addText(
    ctr: Phaser.GameObjects.Container,
    x: number, y: number, text: string,
    style: Phaser.Types.GameObjects.Text.TextStyle,
    originX = 0, originY = 0,
  ) {
    const t = this.add.text(x, y, text, style).setOrigin(originX, originY);
    ctr.add(t);
    return t;
  }

  private showCollection() {
    if (this.collectionOverlay) return;
    const { width, height } = this.scale;

    const ctr = this.add.container(0, 0);
    this.collectionOverlay = ctr;
    ctr.setDepth(10);

    /* backdrop — also acts as click-to-close */
    const bd = this.add.graphics();
    bd.fillStyle(0x000000, 0.82);
    bd.fillRect(0, 0, width, height);
    bd.setInteractive();
    bd.on("pointerdown", () => this.closeCollection());
    ctr.add(bd);

    /* panel */
    const pw = 960;
    const ph = 540;
    const px = (width - pw) / 2;
    const py = (height - ph) / 2;
    const panel = this.add.graphics();
    panel.fillStyle(0x0d0d1a, 1);
    panel.fillRoundedRect(px, py, pw, ph, 12);
    panel.lineStyle(1, 0x6c5ce7, 0.6);
    panel.strokeRoundedRect(px, py, pw, ph, 12);
    ctr.add(panel);

    this.addText(ctr, px + pw / 2, py + 22,
      "COLLECTION — 12 ELEMENTAL WARDENS",
      { fontSize: "16px", color: "#a08cff", fontStyle: "bold" },
      0.5, 0,
    );

    /* close button */
    const closeG = this.add.graphics();
    const closeBtnX = px + pw - 16;
    const closeBtnY = py + 16;
    closeG.fillStyle(0x6c5ce7, 1);
    closeG.fillCircle(closeBtnX, closeBtnY, 13);
    ctr.add(closeG);
    this.addText(ctr, closeBtnX, closeBtnY, "✕",
      { fontSize: "14px", color: "#ffffff", fontStyle: "bold" }, 0.5, 0.5);
    const closeZone = this.add.zone(closeBtnX - 16, closeBtnY - 16, 32, 32)
      .setInteractive({ useHandCursor: true });
    closeZone.on("pointerdown", () => this.closeCollection());
    ctr.add(closeZone);

    /* card grid — 4 columns × 3 rows */
    const cols = 4;
    const cw  = 200;
    const ch  = 130;
    const gX  = 18;
    const gY  = 14;
    const gridW = cols * cw + (cols - 1) * gX;
    const gridX = px + (pw - gridW) / 2;
    const gridY = py + 58;

    RYFT_CARDS.forEach((card, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const ox = gridX + col * (cw + gX);
      const oy = gridY + row * (ch + gY);

      const colorHex = RARITY_COLOR[card.rarity];
      const glowStr  = RARITY_GLOW[card.rarity];

      /* card background */
      const bg = this.add.graphics();
      bg.fillStyle(0x12121f, 1);
      bg.fillRoundedRect(ox, oy, cw, ch, 8);
      bg.lineStyle(2, colorHex, 0.85);
      bg.strokeRoundedRect(ox, oy, cw, ch, 8);
      ctr.add(bg);

      /* rarity badge */
      const badgeBg = this.add.graphics();
      badgeBg.fillStyle(colorHex, 0.25);
      badgeBg.fillRoundedRect(ox + 6, oy + 6, 82, 18, 4);
      ctr.add(badgeBg);
      this.addText(ctr, ox + 47, oy + 15, card.rarity.toUpperCase(),
        { fontSize: "9px", color: glowStr, fontStyle: "bold" }, 0.5, 0.5);

      /* name */
      this.addText(ctr, ox + 8, oy + 30, card.name,
        { fontSize: "13px", color: "#e8e8f0", fontStyle: "bold", wordWrap: { width: cw - 16 } });

      /* ability (1 line, italic) */
      if (card.ability) {
        this.addText(ctr, ox + 8, oy + 52, card.ability,
          { fontSize: "9px", color: "#a08cff", fontStyle: "italic", wordWrap: { width: cw - 16 }, maxLines: 1 });
      }

      /* stats */
      const sy = oy + ch - 36;
      this.addText(ctr, ox + 8,  sy,      "ATK",               { fontSize: "10px", color: "#ff6c8c" });
      this.addText(ctr, ox + 8,  sy + 14, String(card.attack),  { fontSize: "14px", color: "#ff6c8c", fontStyle: "bold" });
      this.addText(ctr, ox + 56, sy,      "DEF",               { fontSize: "10px", color: "#6cff9a" });
      this.addText(ctr, ox + 56, sy + 14, String(card.defense), { fontSize: "14px", color: "#6cff9a", fontStyle: "bold" });
      this.addText(ctr, ox + 104, sy,     "COST",              { fontSize: "10px", color: "#ffb84a" });
      this.addText(ctr, ox + 104, sy + 14, String(card.hp_cost),{ fontSize: "14px", color: "#ffb84a", fontStyle: "bold" });
    });
  }

  private closeCollection() {
    this.collectionOverlay?.destroy();
    this.collectionOverlay = null;
  }

  /* ──────────────────────────────────────────────────────────────── */
  /*  How-to-Play guide overlay                                       */
  /* ──────────────────────────────────────────────────────────────── */
  private showGuide() {
    if (this.guideOverlay) return;
    const { width, height } = this.scale;

    const ctr = this.add.container(0, 0);
    this.guideOverlay = ctr;
    ctr.setDepth(20);

    /* backdrop */
    const bd = this.add.graphics();
    bd.fillStyle(0x000000, 0.82);
    bd.fillRect(0, 0, width, height);
    ctr.add(bd);

    /* panel */
    const pw = 660;
    const ph = 480;
    const px = (width - pw) / 2;
    const py = (height - ph) / 2;
    const panel = this.add.graphics();
    panel.fillStyle(0x0d0d1a, 1);
    panel.fillRoundedRect(px, py, pw, ph, 12);
    panel.lineStyle(1, 0xa08cff, 0.5);
    panel.strokeRoundedRect(px, py, pw, ph, 12);
    ctr.add(panel);

    /* title */
    ctr.add(
      this.add.text(px + pw / 2, py + 20, "HOW TO PLAY", {
        fontSize: "20px", color: "#a08cff", fontStyle: "bold", letterSpacing: 6,
      }).setOrigin(0.5, 0),
    );

    /* close */
    const closeG = this.add.graphics();
    closeG.fillStyle(0x6c5ce7, 1);
    closeG.fillCircle(px + pw - 16, py + 16, 13);
    ctr.add(closeG);
    ctr.add(
      this.add.text(px + pw - 16, py + 16, "✕", {
        fontSize: "14px", color: "#ffffff", fontStyle: "bold",
      }).setOrigin(0.5),
    );
    const closeZone = this.add.zone(px + pw - 32, py, 32, 32).setInteractive({ useHandCursor: true });
    closeZone.on("pointerdown", () => this.closeGuide());
    ctr.add(closeZone);

    const sections: { title: string; lines: string[] }[] = [
      {
        title: "OBJECTIVE",
        lines: [
          "Reduce your opponent's HP to 0 before they do the same to you.",
          "Both players start at 30 HP.",
        ],
      },
      {
        title: "ON YOUR TURN",
        lines: [
          "→  Click any card in your hand to play it.",
          "→  Your Warden attacks the opponent. ATK damage is applied minus their passive DEF.",
          "→  Their Warden strikes back automatically (opponent ATK − your DEF).",
          "→  After your play, the enemy takes their turn, then you draw a new card.",
        ],
      },
      {
        title: "CARD STATS",
        lines: [
          "ATK — raw damage your Warden deals each time it attacks.",
          "DEF — damage absorbed before HP is reduced.",
          "COST — energy cost (higher = stronger card, drawn less often).",
        ],
      },
      {
        title: "RARITY",
        lines: [
          "COMMON (grey) — balanced, reliable Wardens.  ATK 2–5 / DEF 2–6.",
          "RARE (blue) — powerful with unique abilities.  ATK 5–8 / DEF 3–6.",
          "LEGENDARY (gold) — game-changing.  ATK 9–10 / DEF 7–8.  Rare draws.",
        ],
      },
      {
        title: "WIN CONDITION",
        lines: [
          "First player to reach 0 HP loses. Legendary cards can swing a match in one play.",
        ],
      },
    ];

    let curY = py + 62;
    const leftX = px + 28;

    for (const sec of sections) {
      ctr.add(
        this.add.text(leftX, curY, sec.title, {
          fontSize: "11px", color: "#6c5ce7", fontStyle: "bold", letterSpacing: 3,
        }),
      );
      curY += 18;
      for (const line of sec.lines) {
        ctr.add(
          this.add.text(leftX, curY, line, {
            fontSize: "13px", color: "#d0d0e0",
            wordWrap: { width: pw - 56 },
          }),
        );
        curY += 18;
      }
      curY += 10;
    }

    bd.setInteractive();
    bd.on("pointerdown", () => this.closeGuide());
  }

  private closeGuide() {
    this.guideOverlay?.destroy();
    this.guideOverlay = null;
  }
}
