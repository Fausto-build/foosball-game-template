import Phaser from 'phaser';
import { createGameConfig } from './config';

export const gameEvents = new Phaser.Events.EventEmitter();

export const GAME_EVENTS = {
  NEW_GAME: 'ui:new-game',
} as const;

export function createFoosballGame(parent: HTMLElement) {
  return new Phaser.Game(createGameConfig(parent));
}

export function destroyFoosballGame(game: Phaser.Game) {
  game.destroy(true);
  gameEvents.removeAllListeners();
}
