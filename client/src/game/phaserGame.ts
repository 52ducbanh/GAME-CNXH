import Phaser from 'phaser';
import { MainScene } from '../scenes/MainScene.js';
import { SocketClient } from '../network/socketClient.js';
import { MapId } from 'shared';

export function createGame(containerId: string, socketClient: SocketClient,mapId:MapId='hanoi'): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: containerId,
    width: window.innerWidth,
    height: window.innerHeight,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#54733e',
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
  game.scene.start('MainScene', { socketClient,mapId });
  return game;
}
