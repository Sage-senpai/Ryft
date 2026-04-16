import * as Phaser from "phaser";
import type { Card } from "@ryft/types";
import { EventBus } from "../EventBus";
import { dealHand, RARITY_COLOR } from "../cards";
import { ryftAudio } from "../audio";

interface Beats {
  attack_ms: number;
  turn_ms: number;
  draw_ms: number;
  death_ms: number;
  special_ms: number;
  damage_display_ms: number;
  card_enter_ms: number;
  hp_bar_tween_ms: number;
}

interface CardSprite {
  card: Card;
  container: Phaser.GameObjects.Container;
  baseX: number;
  baseY: number;
}

const CARD_W = 120;
const CARD_H = 168;

export class BattleScene extends Phaser.Scene {
  private beats!: Beats;
  private hand: Card[] = [];
  private opponentHandSize = 5;
  private myHp = 30;
  private opHp = 30;
  private turn = 1;
  private isMyTurn = true;
  private processing = false;

  private myHpBar!: Phaser.GameObjects.Graphics;
  private opHpBar!: Phaser.GameObjects.Graphics;
  private myHpText!: Phaser.GameObjects.Text;
  private opHpText!: Phaser.GameObjects.Text;
  private turnText!: Phaser.GameObjects.Text;
  private logText!: Phaser.GameObjects.Text;
  private handSprites: CardSprite[] = [];
  private opponentUsername = "voidmother";

  constructor() {
    super("Battle");
  }

  create() {
    this.beats =
      (this.registry.get("beats") as Beats) ??
      ({
        attack_ms: 480,
        turn_ms: 1800,
        draw_ms: 320,
        death_ms: 700,
        special_ms: 900,
        damage_display_ms: 600,
        card_enter_ms: 240,
        hp_bar_tween_ms: 400,
      } as Beats);

    this.hand = dealHand(5);
    this.myHp = 30;
    this.opHp = 30;
    this.turn = 1;
    this.isMyTurn = true;

    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x060612, 0x060612, 0x1a0f28, 0x281028, 1);
    bg.fillRect(0, 0, width, height);

    this.drawArena(width, height);
    this.drawHUD(width, height);
    this.drawOpponentZone(width);
    this.drawHand();
    this.pushLog("Match started vs @voidmother.init");
    this.showHint();
    ryftAudio.playTurnStart();
    ryftAudio.startAmbient();

    EventBus.onTyped("ACTION_CONFIRMED", this.onActionConfirmed, this);
    EventBus.emitTyped("SCENE_READY", { scene_key: "Battle" });
  }

  private drawArena(width: number, height: number) {
    const line = this.add.graphics();
    line.lineStyle(1, 0x4a3a7a, 0.4);
    line.lineBetween(60, height / 2, width - 60, height / 2);

    for (let i = 0; i < 20; i++) {
      const p = this.add.circle(
        Math.random() * width,
        Math.random() * height,
        Math.random() * 1 + 0.3,
        0xa08cff,
        Math.random() * 0.3 + 0.1
      );
      this.tweens.add({ targets: p, alpha: 0, duration: 2000 + Math.random() * 2000, yoyo: true, repeat: -1 });
    }
  }

  private drawHUD(width: number, height: number) {
    // opponent bar top
    this.add.text(40, 24, `@${this.opponentUsername}.init`, { fontSize: "16px", color: "#ff6c8c" });
    this.opHpText = this.add.text(40, 44, `${this.opHp} / 30`, { fontSize: "12px", color: "#ff6c8c" });
    this.opHpBar = this.add.graphics();
    this.renderHp(this.opHpBar, 40, 66, 300, this.opHp, 0xff6c8c);

    // me bar top-right
    this.add.text(width - 220, 24, "@you.init", { fontSize: "16px", color: "#6cff9a" }).setOrigin(0, 0);
    this.myHpText = this.add.text(width - 220, 44, `${this.myHp} / 30`, { fontSize: "12px", color: "#6cff9a" });
    this.myHpBar = this.add.graphics();
    this.renderHp(this.myHpBar, width - 220, 66, 180, this.myHp, 0x6cff9a);

    this.turnText = this.add
      .text(width / 2, 32, `Turn ${this.turn} — your move`, {
        fontSize: "18px",
        color: "#a08cff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.logText = this.add.text(40, height - 220, "", {
      fontSize: "11px",
      color: "#6c6c80",
      wordWrap: { width: 360 },
    });
  }

  private renderHp(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, hp: number, color: number) {
    g.clear();
    g.fillStyle(0x1a1a2e, 1);
    g.fillRoundedRect(x, y, w, 10, 4);
    const ratio = Math.max(0, Math.min(1, hp / 30));
    g.fillStyle(color, 1);
    g.fillRoundedRect(x, y, w * ratio, 10, 4);
    g.lineStyle(1, 0xffffff, 0.1);
    g.strokeRoundedRect(x, y, w, 10, 4);
  }

  private drawOpponentZone(width: number) {
    const zoneY = 130;
    for (let i = 0; i < this.opponentHandSize; i++) {
      const x = width / 2 - (this.opponentHandSize * 72) / 2 + i * 72;
      const back = this.add.graphics();
      back.fillStyle(0x2a1a3e, 1);
      back.fillRoundedRect(x, zoneY, 60, 84, 6);
      back.lineStyle(1, 0x6c5ce7, 0.6);
      back.strokeRoundedRect(x, zoneY, 60, 84, 6);
      this.add
        .text(x + 30, zoneY + 42, "R", { fontSize: "22px", color: "#6c5ce7", fontStyle: "bold" })
        .setOrigin(0.5);
    }
  }

  private drawHand() {
    const { width, height } = this.scale;
    const startY = height - CARD_H - 40;
    const totalW = this.hand.length * (CARD_W + 16) - 16;
    const startX = (width - totalW) / 2;

    this.hand.forEach((card, i) => {
      const x = startX + i * (CARD_W + 16);
      const container = this.buildCardSprite(card, x, startY);
      this.handSprites.push({ card, container, baseX: x, baseY: startY });

      container.setScale(0.8);
      container.setAlpha(0);
      this.tweens.add({
        targets: container,
        scale: 1,
        alpha: 1,
        duration: this.beats.card_enter_ms,
        delay: i * 80,
        ease: "Back.easeOut",
      });
    });
  }

  private buildCardSprite(card: Card, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x + CARD_W / 2, y + CARD_H / 2);

    const color = RARITY_COLOR[card.rarity];
    const bg = this.add.graphics();
    bg.fillStyle(0x120f1e, 1);
    bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 8);
    bg.lineStyle(2, color, 1);
    bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 8);
    container.add(bg);

    const nameText = this.add
      .text(0, -CARD_H / 2 + 14, card.name, {
        fontSize: "11px",
        color: "#e8e8f0",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: CARD_W - 16 },
      })
      .setOrigin(0.5, 0);
    container.add(nameText);

    const rarityTag = this.add
      .text(0, -CARD_H / 2 + 40, card.rarity.toUpperCase(), {
        fontSize: "8px",
        color: this.colorToHex(color),
      })
      .setOrigin(0.5);
    container.add(rarityTag);

    const art = this.add.graphics();
    art.fillStyle(color, 0.25);
    art.fillCircle(0, -6, 28);
    art.lineStyle(1, color, 0.8);
    art.strokeCircle(0, -6, 28);
    art.fillStyle(color, 0.9);
    art.fillCircle(0, -6, 4);
    container.add(art);

    const atkText = this.add
      .text(-CARD_W / 2 + 10, CARD_H / 2 - 40, `${card.attack}`, {
        fontSize: "20px",
        color: "#ff6c8c",
        fontStyle: "bold",
      })
      .setOrigin(0, 0);
    container.add(atkText);

    const defText = this.add
      .text(CARD_W / 2 - 10, CARD_H / 2 - 40, `${card.defense}`, {
        fontSize: "20px",
        color: "#6c9aff",
        fontStyle: "bold",
      })
      .setOrigin(1, 0);
    container.add(defText);

    const costText = this.add
      .text(0, CARD_H / 2 - 18, `hp ${card.hp_cost}`, { fontSize: "9px", color: "#a08cff" })
      .setOrigin(0.5);
    container.add(costText);

    container.setSize(CARD_W, CARD_H);
    container.setInteractive(new Phaser.Geom.Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H), Phaser.Geom.Rectangle.Contains);

    container.on("pointerover", () => {
      if (!this.isMyTurn || this.processing) return;
      this.tweens.add({ targets: container, y: container.y - 20, scale: 1.05, duration: 120, ease: "Cubic.easeOut" });
    });
    container.on("pointerout", () => {
      this.tweens.add({
        targets: container,
        y: container.y + ((container.scale - 1) * 200 + 20) / container.scale,
        scale: 1,
        duration: 120,
        ease: "Cubic.easeOut",
      });
    });
    container.on("pointerdown", () => {
      if (!this.isMyTurn || this.processing) return;
      void this.playCard(card, container);
    });

    return container;
  }

  private colorToHex(color: number): string {
    return "#" + color.toString(16).padStart(6, "0");
  }

  private async playCard(card: Card, container: Phaser.GameObjects.Container) {
    this.processing = true;
    this.pushLog(`You play ${card.name}`);
    EventBus.emitTyped("PLAY_CARD", {
      event_id: `evt-${Date.now()}`,
      card_id: card.card_id,
      target_index: 0,
    });

    const { width, height } = this.scale;
    ryftAudio.playCardPlace();
    await this.tweenPromise({
      targets: container,
      x: width / 2,
      y: height / 2 + 40,
      scale: 1.2,
      duration: this.beats.attack_ms,
      ease: "Cubic.easeInOut",
    });

    ryftAudio.playAttack();
    const flash = this.add.circle(width / 2, height / 2 - 20, 6, 0xffffff, 1);
    this.tweens.add({ targets: flash, radius: 120, alpha: 0, duration: this.beats.damage_display_ms, ease: "Cubic.easeOut" });

    const dmg = Math.max(1, card.attack - 2);
    this.dealDamage(dmg, false);
    this.floatingDamage(width / 2, 180, dmg, 0xff6c8c);
    ryftAudio.playDamage();

    await this.delay(this.beats.damage_display_ms);

    await this.tweenPromise({
      targets: container,
      alpha: 0,
      scale: 0.6,
      duration: this.beats.death_ms,
      ease: "Quad.easeIn",
    });
    container.destroy();
    this.hand = this.hand.filter((c) => c.card_id !== card.card_id);
    this.handSprites = this.handSprites.filter((s) => s.card.card_id !== card.card_id);

    if (this.opHp <= 0) {
      this.endMatch(true);
      return;
    }

    this.isMyTurn = false;
    this.turnText.setText(`Turn ${this.turn} — opponent`);
    await this.delay(this.beats.turn_ms - this.beats.attack_ms);
    this.opponentTurn();
  }

  private opponentTurn() {
    const { width } = this.scale;
    const dmg = 3 + Math.floor(Math.random() * 4);
    this.pushLog(`@${this.opponentUsername}.init plays Voidmother`);
    ryftAudio.playOpponentAttack();

    const mockCard = this.add.graphics();
    mockCard.fillStyle(0x2a1a3e, 1);
    mockCard.fillRoundedRect(width / 2 - 30, 130, 60, 84, 6);
    mockCard.lineStyle(2, 0xffb84a, 1);
    mockCard.strokeRoundedRect(width / 2 - 30, 130, 60, 84, 6);

    this.tweens.add({
      targets: mockCard,
      alpha: 0,
      duration: this.beats.attack_ms,
      onComplete: () => mockCard.destroy(),
    });

    this.time.delayedCall(this.beats.attack_ms, () => {
      this.dealDamage(dmg, true);
      this.floatingDamage(this.scale.width - 130, 80, dmg, 0x6cff9a);

      if (this.myHp <= 0) {
        this.endMatch(false);
        return;
      }

      this.turn += 1;
      this.isMyTurn = true;
      this.processing = false;
      this.turnText.setText(`Turn ${this.turn} — your move`);

      if (this.hand.length < 5) {
        this.drawOne();
      }
    });
  }

  private drawOne() {
    const next = dealHand(1)[0];
    if (!next) return;
    this.hand.push(next);
    const { width, height } = this.scale;
    const startY = height - CARD_H - 40;
    const totalW = this.hand.length * (CARD_W + 16) - 16;
    const startX = (width - totalW) / 2;
    this.handSprites.forEach((s, i) => {
      const x = startX + i * (CARD_W + 16);
      this.tweens.add({
        targets: s.container,
        x: x + CARD_W / 2,
        duration: this.beats.draw_ms,
      });
      s.baseX = x;
    });
    const x = startX + (this.hand.length - 1) * (CARD_W + 16);
    const container = this.buildCardSprite(next, x, startY);
    container.setScale(0.6);
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: this.beats.card_enter_ms,
      ease: "Back.easeOut",
    });
    this.handSprites.push({ card: next, container, baseX: x, baseY: startY });
    this.pushLog(`You draw ${next.name}`);
    ryftAudio.playDraw();
  }

  private dealDamage(amount: number, toMe: boolean) {
    if (toMe) {
      this.myHp = Math.max(0, this.myHp - amount);
      this.myHpText.setText(`${this.myHp} / 30`);
      this.renderHp(this.myHpBar, this.scale.width - 220, 66, 180, this.myHp, 0x6cff9a);
    } else {
      this.opHp = Math.max(0, this.opHp - amount);
      this.opHpText.setText(`${this.opHp} / 30`);
      this.renderHp(this.opHpBar, 40, 66, 300, this.opHp, 0xff6c8c);
    }
    this.cameras.main.shake(150, 0.004);
  }

  private floatingDamage(x: number, y: number, amount: number, color: number) {
    const txt = this.add
      .text(x, y, `-${amount}`, {
        fontSize: "32px",
        color: this.colorToHex(color),
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: txt,
      y: y - 60,
      alpha: 0,
      duration: this.beats.damage_display_ms + 200,
      ease: "Cubic.easeOut",
      onComplete: () => txt.destroy(),
    });
  }

  private showHint() {
    const { width, height } = this.scale;
    const hint = this.add
      .text(width / 2, height - CARD_H - 70, "→ Click a card to play it", {
        fontSize: "14px",
        color: "#a08cff",
        fontStyle: "italic",
      })
      .setOrigin(0.5);
    hint.setAlpha(0);
    this.tweens.add({ targets: hint, alpha: 1, duration: 600, delay: 800 });
    this.tweens.add({
      targets: hint,
      alpha: 0,
      duration: 400,
      delay: 6000,
      onComplete: () => hint.destroy(),
    });
  }

  private pushLog(line: string) {
    const current = this.logText.text.split("\n").slice(-4);
    current.push(line);
    this.logText.setText(current.join("\n"));
  }

  private onActionConfirmed(p: { event_id: string; tx_hash: string }) {
    this.pushLog(`✓ confirmed ${p.tx_hash.slice(0, 10)}...`);
  }

  private endMatch(won: boolean) {
    ryftAudio.stopAmbient();
    if (won) { ryftAudio.playVictory(); } else { ryftAudio.playDefeat(); }
    EventBus.emitTyped("MATCH_RESOLVED", { winner: won ? "me" : "opponent", reason: "hp" });
    this.time.delayedCall(600, () => this.scene.start("GameOver", { won }));
  }

  private tweenPromise(config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((resolve) => {
      this.tweens.add({ ...config, onComplete: () => resolve() });
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, () => resolve()));
  }
}
