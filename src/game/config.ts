import Phaser from 'phaser';
import { SCENE_HEIGHT, SCENE_WIDTH } from './constants';
import { MatchScene } from './scenes/MatchScene';

export function createGameConfig(
  parent: string | HTMLElement,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: SCENE_WIDTH,
    height: SCENE_HEIGHT,
    backgroundColor: '#071013',
    render: {
      antialias: true,
      roundPixels: false,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'matter',
      matter: {
        gravity: {
          x: 0,
          y: 0,
        },
        enableSleeping: false,
        debug: false,
      },
    },
    scene: [MatchScene],
  };
}
