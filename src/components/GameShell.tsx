import { useEffect } from 'react';
import { BottomControls } from './BottomControls';
import { GameCanvas } from './GameCanvas';
import { Hud } from './Hud';
import { GAME_EVENTS, gameEvents } from '../game/FoosballGame';
import { webAudioSfx } from '../game/audio/WebAudioSfx';
import { useGameStore } from '../state/gameStore';

export function GameShell() {
  const muted = useGameStore((state) => state.muted);
  const phase = useGameStore((state) => state.phase);
  const score = useGameStore((state) => state.score);
  const winner = useGameStore((state) => state.winner);
  const toggleMuted = useGameStore((state) => state.toggleMuted);

  useEffect(() => {
    webAudioSfx.setMuted(muted);
  }, [muted]);

  function handleNewGame() {
    gameEvents.emit(GAME_EVENTS.NEW_GAME);
  }

  const winnerLabel =
    winner === 'player' ? 'Ganaste el partido.' : winner === 'ai' ? 'La IA Bronce se lleva el partido.' : null;

  return (
    <main className="app-shell">
      <div className="app-shell__ambient app-shell__ambient--left" />
      <div className="app-shell__ambient app-shell__ambient--right" />

      <div className="app-frame">
        <Hud />

        <section className="board-stage">
          <div className="board-stage__frame">
            <GameCanvas />

            {phase === 'loading' ? (
              <div className="board-overlay board-overlay--soft">
                <span className="board-overlay__eyebrow">Preparando la mesa</span>
                <p className="board-overlay__body">Generando la cancha y la posición inicial…</p>
              </div>
            ) : null}

            {winnerLabel ? (
              <div className="board-overlay">
                <span className="board-overlay__eyebrow">Final del partido</span>
                <h2 className="board-overlay__title">{winnerLabel}</h2>
                <p className="board-overlay__body">
                  Marcador final {score.player} - {score.ai}. Presiona Nuevo juego para rearmar la
                  mesa.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <BottomControls muted={muted} onNewGame={handleNewGame} onToggleSound={toggleMuted} />
      </div>
    </main>
  );
}
