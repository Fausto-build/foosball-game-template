import { useGameStore } from '../state/gameStore';

export function Hud() {
  const score = useGameStore((state) => state.score);
  const statusText = useGameStore((state) => state.statusText);
  const stylePoints = useGameStore((state) => state.stylePoints);
  const styleMessage =
    stylePoints > 0 ? `+ ${stylePoints} style` : '0 style';

  return (
    <header className="hud">
      <section className="hud-side hud-side--left">
        <span className="hud-pill hud-pill--player">YOU</span>
        <strong className="hud-score">{score.player}</strong>
      </section>

      <section className="hud-center">
        <div className="hud-logo" aria-hidden="true">
          <span className="hud-logo__top">FREE FLICK</span>
          <span className="hud-logo__bottom">FOOTBALL</span>
        </div>
        <p className="hud-center__status">{statusText}</p>
        <p className="hud-center__reward">{styleMessage}</p>
      </section>

      <section className="hud-side hud-side--right">
        <button type="button" className="hud-signin" disabled>
          Sign in
        </button>
        <div className="hud-opponent">
          <strong className="hud-score">{score.ai}</strong>
          <span className="hud-pill hud-pill--ai">BRONZE AI</span>
        </div>
      </section>
    </header>
  );
}
