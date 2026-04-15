import * as Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { MainMenuScene } from "./scenes/MainMenuScene";
import { LobbyScene } from "./scenes/LobbyScene";
import { BattleScene } from "./scenes/BattleScene";
import { GameOverScene } from "./scenes/GameOverScene";

export interface RyftGameConfig {
  parent: string;
  width?: number;
  height?: number;
}

export function createRyftGame(cfg: RyftGameConfig): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.WEBGL,
    parent: cfg.parent,
    width: cfg.width ?? 1280,
    height: cfg.height ?? 720,
    backgroundColor: "#060612",
    scene: [BootScene, PreloadScene, MainMenuScene, LobbyScene, BattleScene, GameOverScene],
    fps: { target: 60, forceSetTimeOut: false },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, parent: cfg.parent },
    render: { antialias: true, pixelArt: false },
  });
}
