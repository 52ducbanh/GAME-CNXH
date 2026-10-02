import Phaser from 'phaser';
import { MainScene } from '../scenes/MainScene.js';
import { SocketClient } from '../network/socketClient.js';

export function createGame(containerId: string, socketClient: SocketClient): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: containerId,
    width: 1280,
    height: 960,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false
      }
    },
    scene: [MainScene]
  };

  const game = new Phaser.Game(config);
  game.scene.start('MainScene', { socketClient });
  return game;
}
