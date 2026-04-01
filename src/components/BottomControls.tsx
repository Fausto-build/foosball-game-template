interface BottomControlsProps {
  muted: boolean;
  onNewGame: () => void;
  onToggleSound: () => void;
}

function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 9H9L14 5V19L9 15H5V9Z" />
      {muted ? (
        <path d="M17 8L21 12L17 16M21 8L17 12L21 16" />
      ) : (
        <>
          <path d="M17 9.5C18.2 10.4 19 11.6 19 13C19 14.4 18.2 15.6 17 16.5" />
          <path d="M19.5 7C21.1 8.5 22 10.5 22 13C22 15.5 21.1 17.5 19.5 19" />
        </>
      )}
    </svg>
  );
}

export function BottomControls({
  muted,
  onNewGame,
  onToggleSound,
}: BottomControlsProps) {
  return (
    <footer className="bottom-controls">
      <div className="bottom-controls__actions">
        <button type="button" className="control-button control-button--primary" onClick={onNewGame}>
          Nuevo juego
        </button>
        <button type="button" className="control-button control-button--muted" disabled>
          Menú
        </button>
      </div>

      <p className="bottom-controls__hint">
        Haz clic cerca de la pelota · arrastra hacia atrás · suelta para patear
      </p>

      <button
        type="button"
        className="control-icon-button"
        onClick={onToggleSound}
        aria-pressed={!muted}
        aria-label={muted ? 'Activar efectos de sonido' : 'Silenciar efectos de sonido'}
      >
        <SoundIcon muted={muted} />
      </button>
    </footer>
  );
}
