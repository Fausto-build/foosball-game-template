import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import { createFoosballGame, destroyFoosballGame } from '../game/FoosballGame';

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) {
      return;
    }

    const game = createFoosballGame(containerRef.current);
    const resizeObserver = new ResizeObserver(() => {
      game.scale.refresh();
    });

    resizeObserver.observe(containerRef.current);
    gameRef.current = game;

    return () => {
      resizeObserver.disconnect();

      if (gameRef.current) {
        destroyFoosballGame(gameRef.current);
        gameRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className="game-canvas" aria-label="Mesa de fútbol de mesa" />;
}
