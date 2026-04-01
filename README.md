# Flick Foosball

Browser MVP of a turn-based flick football game built from the implementation plan in `implementation-plan.md`.

## Stack

- Vite
- React 19
- TypeScript
- Phaser 3 with Matter physics
- Zustand for shared HUD and match state

## Run

```bash
npm install
npm run dev
```

## Controls

- Click or tap near the ball
- Drag backwards to aim and set power
- Release to flick
- Wait for the ball to settle, then the AI takes one shot
- First to 3 goals wins

## Project structure

- `src/components/` React shell, HUD, and control bar
- `src/game/scenes/MatchScene.ts` Phaser scene and board rendering
- `src/game/entities/` Ball and peg wrappers
- `src/game/systems/` input, AI, goals, physics tuning, and turn flow
- `src/state/gameStore.ts` Zustand-backed match/UI state

## Notes

- Pegs are static colliders and only the ball moves.
- Field art is drawn procedurally in Phaser so mechanics can be tuned before asset production.
- `Menu` is intentionally a placeholder; the MVP loop focuses on the match flow and reset/share controls.
