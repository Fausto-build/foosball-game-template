import { BottomControls } from './BottomControls';
import { GameCanvas } from './GameCanvas';
import { Hud } from './Hud';
import { GAME_EVENTS, gameEvents } from '../game/FoosballGame';
import { useGameStore } from '../state/gameStore';

export function GameShell() {
  const muted = useGameStore((state) => state.muted);
  const phase = useGameStore((state) => state.phase);
  const score = useGameStore((state) => state.score);
  const winner = useGameStore((state) => state.winner);
  const toggleMuted = useGameStore((state) => state.toggleMuted);
  const setStatusText = useGameStore((state) => state.setStatusText);

  function handleNewGame() {
    gameEvents.emit(GAME_EVENTS.NEW_GAME);
  }

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Flick Foosball',
          text: 'See if you can beat my Bronze AI match.',
          url: window.location.href,
        });
        setStatusText('Match shared from the sidelines.');
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      setStatusText('Link copied. Throw down the challenge.');
    } catch {
      setStatusText('Share cancelled. The table stays local.');
    }
  }

  const winnerLabel =
    winner === 'player' ? 'You win the board.' : winner === 'ai' ? 'Bronze AI steals the match.' : null;

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
                <span className="board-overlay__eyebrow">Setting the table</span>
                <p className="board-overlay__body">Generating the pitch and rack positions…</p>
              </div>
            ) : null}

            {winnerLabel ? (
              <div className="board-overlay">
                <span className="board-overlay__eyebrow">Full time</span>
                <h2 className="board-overlay__title">{winnerLabel}</h2>
                <p className="board-overlay__body">
                  Final score {score.player} - {score.ai}. Press New Game to re-rack the table.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <BottomControls
          muted={muted}
          onNewGame={handleNewGame}
          onShare={handleShare}
          onToggleSound={toggleMuted}
        />
      </div>
    </main>
  );
}
