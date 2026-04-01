# Foosball Flick Game Implementation Plan

## Objective

Build a browser-based top-down flick football game inspired by the provided reference:

- dark surrounding UI
- centered framed pitch
- static peg-like players
- one flickable ball
- alternating player and AI turns
- score-based match flow

The first playable target is a polished MVP that reproduces the core feel, not a full production clone.

## Working Product Decisions

These decisions remove ambiguity so implementation can start immediately:

- Stack: `Vite + React + TypeScript + Phaser 3`
- Physics: Phaser Matter integration
- Shared app state: `Zustand`
- Rendering split:
  - React for HUD, controls, and shell layout
  - Phaser for the pitch, pegs, ball, collisions, and turn-state visuals
- Camera: fixed top-down view, single board fully visible at all times
- Input: mouse and touch drag-to-flick on the ball only
- Match rule: first to `3` goals wins
- Peg behavior: static colliders only
- Turns: exactly one shot per side, then wait for motion to settle
- Scope for v1: desktop-first, responsive enough for tablet/mobile
- MVP excludes backend, sign-in, progression saves, and multiplayer

## Visual Target

Use the image and spec as the visual benchmark:

- near-black app background
- metallic/dark framed board container
- saturated green pitch with white markings
- cream/white cylindrical pegs with soft shadows
- compact top HUD with left/right scores and centered status
- bottom control bar with `New Game`, `Menu`, `Share`, instruction text, and sound toggle

## Architecture Plan

### Frontend structure

- `src/main.tsx`
- `src/App.tsx`
- `src/styles/`
- `src/components/Hud.tsx`
- `src/components/BottomControls.tsx`
- `src/components/GameShell.tsx`
- `src/components/GameCanvas.tsx`
- `src/game/FoosballGame.ts`
- `src/game/scenes/MatchScene.ts`
- `src/game/config.ts`
- `src/game/constants.ts`
- `src/game/entities/Ball.ts`
- `src/game/entities/Peg.ts`
- `src/game/systems/TurnManager.ts`
- `src/game/systems/GoalSystem.ts`
- `src/game/systems/AISystem.ts`
- `src/game/systems/InputSystem.ts`
- `src/game/systems/PhysicsTuning.ts`
- `src/state/gameStore.ts` for Zustand-backed shared UI/match state
- `src/types/game.ts`

### State ownership

- React store owns:
  - score
  - turn
  - phase
  - style points
  - winner
  - muted state
- Phaser scene owns:
  - Matter world
  - runtime entity instances
  - aim preview rendering
  - collision callbacks
  - settle detection

### Phaser integration rules

- mount the Phaser game from a dedicated React component
- create the Phaser instance once and destroy it on unmount
- keep the game systems framework-agnostic inside `src/game/`
- do not couple React rerenders to the core game loop

### Core game states

- `loading`
- `player_turn`
- `aiming`
- `ball_moving`
- `ai_thinking`
- `ai_moving`
- `goal_scored`
- `game_over`
- `paused`

## Execution Phases

### Phase 1: Bootstrap project and shell

#### Tasks

- [ ] Initialize Vite app with React and TypeScript
- [ ] Install Phaser and supporting dependencies
- [ ] Create `src/main.tsx`, `src/App.tsx`, and global styles
- [ ] Create a `GameCanvas` component that mounts Phaser safely
- [ ] Create base app layout matching the reference composition
- [ ] Add CSS variables for the dark arcade/tabletop visual language
- [ ] Create placeholder HUD and bottom controls with static text
- [ ] Mount a Phaser canvas inside a framed game board container

#### Exit criteria

- [ ] App runs locally
- [ ] Layout roughly matches the reference image
- [ ] Phaser scene renders inside the board area without scaling issues

### Phase 2: Draw the board and static match setup

#### Tasks

- [ ] Define field dimensions, wall thickness, goal opening size, and safe spawn positions
- [ ] Render the pitch, center line, center circle, penalty-box-like areas, and goal visuals
- [ ] Define peg formations for player and AI from mirrored preset coordinates
- [ ] Render pegs as shaded cylinders or stylized discs with shadows
- [ ] Place the ball at kickoff position

#### Exit criteria

- [ ] Entire playfield is visible at once
- [ ] Board looks recognizably close to the screenshot
- [ ] Pegs and ball are positioned consistently after reload

### Phase 3: Physics foundation

#### Tasks

- [ ] Add Matter bodies for the ball, pegs, pitch walls, and goal sensors
- [ ] Configure ball restitution, damping, friction, and max speed clamps
- [ ] Ensure pegs are static colliders
- [ ] Detect collisions between ball and pegs/walls cleanly
- [ ] Implement settle detection using low-velocity threshold over a short duration

#### Exit criteria

- [ ] Ball bounces believably off walls and pegs
- [ ] Motion slows naturally instead of stopping abruptly
- [ ] Turn resolution can reliably detect when the ball has settled

### Phase 4: Player input and aiming

#### Tasks

- [ ] Allow drag start only when pointer begins within activation radius of the ball
- [ ] Track drag vector for mouse and touch
- [ ] Clamp drag distance to a tunable maximum
- [ ] Convert drag vector into launch impulse on release
- [ ] Lock input while the ball is moving or during AI turn
- [ ] Add an aim line and power feedback
- [ ] Add a subtle active-turn highlight around the ball

#### Exit criteria

- [ ] Player can flick the ball reliably on desktop and touch
- [ ] Shot direction and strength feel predictable
- [ ] Invalid clicks are ignored without breaking state

### Phase 5: Turn system and match loop

#### Tasks

- [ ] Create a turn manager that alternates between player and AI
- [ ] Show status text such as `Your turn — flick the ball!`
- [ ] Transition from `aiming` to `ball_moving` to next turn after settle
- [ ] Prevent duplicate turn transitions during collisions or goal events
- [ ] Add kickoff reset logic after goals
- [ ] Keep score across resets
- [ ] End match when one side reaches `3`

#### Exit criteria

- [ ] One player shot always leads to one AI shot unless a goal ends the turn
- [ ] Scoreboard updates correctly
- [ ] New kickoff state is deterministic after each goal

### Phase 6: Goal detection and win flow

#### Tasks

- [ ] Implement left and right goal sensors
- [ ] Define what counts as a goal, using full entry into goal zone rather than edge overlap
- [ ] Freeze play briefly after scoring
- [ ] Animate or highlight score changes
- [ ] Reset ball and pegs after goal delay
- [ ] Show match-over state and winner text
- [ ] Wire `New Game` to full reset

#### Exit criteria

- [ ] Goals register reliably without false positives from wall collisions
- [ ] Scoring side is always correct
- [ ] Match can restart cleanly from the UI

### Phase 7: Bronze AI

#### Tasks

- [ ] Implement an AI think delay so turns do not feel instant
- [ ] Sample candidate shot directions and powers
- [ ] Score candidates using:
  - progress toward opponent goal
  - shot lane openness
  - chance of immediate self-block
  - chance to score
- [ ] Add randomness so Bronze AI is imperfect
- [ ] Trigger AI flick using the same launch system as the player

#### Exit criteria

- [ ] AI takes legal turns automatically
- [ ] AI sometimes scores but is beatable
- [ ] AI behavior feels varied rather than robotic

### Phase 8: UI polish and game feel

#### Tasks

- [ ] Replace placeholder HUD with final styled components
- [ ] Add player badge, opponent label, centered logo area, and reward/status text
- [ ] Style bottom controls to match the dark arcade reference
- [ ] Add collision feedback such as tiny screen shake or flash on strong hits
- [ ] Add optional style-point events for wall-bounce or long-distance goals
- [ ] Add sound toggle state and stub sound hooks even if audio ships later
- [ ] Improve responsive behavior for smaller screens

#### Exit criteria

- [ ] UI no longer looks like scaffolding
- [ ] Game communicates turn, score, and controls clearly
- [ ] MVP feels visually cohesive

### Phase 9: QA, tuning, and stabilization

#### Tasks

- [ ] Tune field size, peg radius, ball radius, restitution, damping, and max drag
- [ ] Test repeated matches for stuck-ball and false-goal bugs
- [ ] Test quick repeated pointer interactions
- [ ] Test resize behavior and device pixel ratio handling
- [ ] Validate keyboard accessibility for UI controls
- [ ] Add a short README section for running and extending the project

#### Exit criteria

- [ ] Main loop is stable across repeated matches
- [ ] Core tuning values are centralized and documented
- [ ] MVP is ready for feature expansion

## System Details To Implement

### Tunable constants

Create a single constants module for:

- field width and height
- goal width and depth
- ball radius
- peg radius
- wall thickness
- activation radius
- max drag distance
- shot power multiplier
- ball damping
- restitution
- settle speed threshold
- settle confirmation duration
- AI think time
- max match score

### Collision and rule decisions

Use these rules unless testing proves they feel wrong:

- only the ball moves
- pegs never translate
- a turn ends only after settle or a goal
- input is disabled during any non-player phase
- goal immediately interrupts normal settle handling
- ball reset returns to center kickoff position

### Asset strategy

Avoid blocking implementation on art production:

- draw field lines procedurally in Phaser
- render pegs with simple generated shapes plus shadows
- use text/logo placeholders first
- replace with bespoke assets only after mechanics feel right

## Backlog After MVP

- difficulty tiers beyond Bronze AI
- richer style-point system
- sound effects and music
- pause/settings menu
- replay camera or shot trail history
- cosmetics and unlocks
- sign-in/profile integration
- online multiplayer
- spin or curve shots

## Open Questions To Revisit After First Playtest

- exact peg count and final formation balance
- whether goals should require full ball entry or plane crossing only
- whether style points should affect scoring, progression, or just flavor text
- whether mobile drag sensitivity needs separate tuning
- whether the HUD should include a real logo asset or remain text-only for MVP

## Recommended Build Order

Execute the work in this exact order:

1. Project bootstrap and responsive shell
2. Pitch rendering and peg layout
3. Ball physics and collisions
4. Drag-to-flick input
5. Turn manager and score flow
6. Goal detection and resets
7. Bronze AI
8. UI polish and style system
9. Tuning and bug fixing

This order minimizes wasted polish work before the core flick loop is proven.
