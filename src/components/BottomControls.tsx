interface BottomControlsProps {
  muted: boolean;
  onNewGame: () => void;
  onShare: () => void;
  onToggleSound: () => void;
}

export function BottomControls({
  muted,
  onNewGame,
  onShare,
  onToggleSound,
}: BottomControlsProps) {
  return (
    <footer className="bottom-controls">
      <div className="bottom-controls__actions">
        <button type="button" className="control-button control-button--primary" onClick={onNewGame}>
          New Game
        </button>
        <button type="button" className="control-button control-button--muted" disabled>
          Menu
        </button>
        <button type="button" className="control-button control-button--share" onClick={onShare}>
          X Share
        </button>
      </div>

      <p className="bottom-controls__hint">
        Click near the ball · drag back · release to flick
      </p>

      <button type="button" className="control-icon-button" onClick={onToggleSound}>
        {muted ? 'SFX' : 'SFX'}
      </button>
    </footer>
  );
}
