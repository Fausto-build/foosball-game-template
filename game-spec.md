## What this game is

This is a **turn-based flick football / tabletop soccer game** with a top-down view.

Core idea:

- Each side has a set of circular/peg-like players
- There is a ball on the field
- On your turn, you **click near the ball, drag backwards, and release** to flick it
- The ball moves with physics and interacts with players/walls/goals
- Then the turn passes to the opponent AI
- Score updates when the ball enters a goal

It looks like a digital version of:

- finger football
- button football
- tabletop flick soccer

---

# 1. Core gameplay loop

## Player turn

1. User sees “**Your turn — flick the ball!**”
2. User clicks/touches **near the ball**
3. User drags backward to define:
  - direction
  - power
4. User releases
5. Ball is launched with impulse physics
6. Ball collides with:
  - players
  - pitch boundaries
  - goal area
7. Motion resolves until velocity is near zero
8. If goal scored:
  - score updates
  - reset positions
9. Turn passes to AI

## AI turn

1. AI calculates shot target
2. AI applies a flick/impulse to the ball
3. Physics resolves
4. Goal check
5. Turn returns to player

---

# 2. Visible UI structure

## Top HUD

Left:

- Player label: **You**
- Score: **1**

Center:

- Game logo
- Turn status text: **Your turn — flick the ball!**
- Reward/status text: **+ 10 style**

Right:

- Opponent score: **0**
- Opponent name/rank: **Bronze AI**
- **Sign in** button above/right

## Main field

- Green football pitch
- White outer border
- Midfield line
- center circle
- two penalty-box-like areas
- two black goal mouths on left/right edges

## Bottom controls

- **New Game**
- **Menu**
- **Share**
- instructional text: **Click near the ball · drag back · release to flick**
- sound/music toggle button

---

# 3. Game board layout

## Camera / perspective

- Fixed **top-down orthographic view**
- No camera movement
- Entire pitch visible at once

## Field proportions

Looks like a landscape rectangle centered on screen.

### Pitch elements

- outer white lines
- center line
- center circle
- left and right goal boxes
- left and right goals rendered as dark vertical slots
- slightly inset play area inside a framed board

## Goals

- Goals are narrow vertical openings centered on left and right sides
- Likely the ball must fully cross a goal plane or enter a goal hitbox

---

# 4. Teams and pieces

## Players

Each side appears to have multiple stationary round pegs/discs.

From screenshot, each team seems arranged in preset rows, something like:

- 1 near midfield
- 2 attacking/central
- 3 midfield/defensive rows
- 4 near back line

Not realistic 11v11 movement. It feels more like **fixed board obstacles / strikers**.

### Visual style

- beige/white cylindrical pegs
- subtle shadow/highlight
- static pieces

### Likely behavior

Most likely:

- these player pieces **do not move independently**
- they act as **colliders/obstacles**
- only the **ball is flicked**

Possible alternative:

- some variants of flick football let you flick players, not the ball
- but the on-screen instruction explicitly says **flick the ball**, so here the ball is the only directly controlled object

---

# 5. Ball interaction model

The instruction text strongly suggests a slingshot/flick mechanic.

## Input model

### Desktop

- `mousedown` near ball
- drag vector sampled
- `mouseup` launches

### Mobile

- `touchstart`
- `touchmove`
- `touchend`

## Shot logic

When drag begins:

- detect if pointer is within a radius around the ball

When dragging:

- compute vector from current pointer to ball center
- clamp to max drag distance
- show aim guide optionally

On release:

- convert drag vector into launch impulse

### Likely formula

- `direction = normalize(ballPos - pointerPos)`
- `power = min(dragDistance, maxDrag) * powerMultiplier`
- `ballVelocity = direction * power`

This produces the classic “pull back and release” feel.

---

# 6. Physics system

This game likely relies on **simple 2D rigid-body physics**.

## Entities with colliders

- ball: circle collider
- players: circle colliders
- field boundaries: box/segment colliders
- goals: trigger zones or open boundary with goal sensor

## Needed behaviors

### Ball vs player

- elastic or semi-elastic collision
- bounce angle based on impact normal

### Ball vs wall

- rebound with damping

### Ball friction

- velocity gradually decays over time

### Turn resolution

A turn ends when:

- ball speed < threshold for N frames
- all motion is effectively settled

---

# 7. AI behavior

Opponent is labeled **Bronze AI**, which implies multiple difficulty tiers may exist.

## Likely Bronze AI behavior

Simple shot selection:

1. Check direct shot to goal
2. Check angle shot using nearby gaps
3. Prefer forward progress
4. Choose moderate power
5. Add randomness/error

## Easy replication approach

For MVP:

- AI samples several candidate shot directions
- simulate lightweight trajectory
- score candidates by:
  - distance advanced toward player goal
  - chance to score
  - avoiding self-blocking
- pick best candidate + some randomness

### Bronze AI should feel:

- not perfect
- occasionally dumb
- sometimes stylish/lucky

---

# 8. Score and match flow

## Score system

Visible score:

- You: 1
- AI: 0

## Goal event

When ball enters opponent goal:

- increment scorer’s score
- show feedback
- possibly give style points/reward
- reset to kickoff position

## Match structure

Unknown from screenshot, but likely one of:

- first to X goals
- timed match
- casual endless quick-play

For replication, I’d recommend:

- **first to 3** or **first to 5**
- fastest MVP loop

---

# 9. “Style” points / meta reward

The text `+ 10 style` suggests a secondary reward layer.

Possible meanings:

- cosmetic score
- trick shot reward
- progression currency
- flair bonus for a good angle/long shot/bank shot

For MVP in Cursor:

- add a lightweight style system:
  - goal after wall bounce = +10
  - goal after threading defenders = +10
  - strong shot from distance = +5
  - win = +25

This is not required for the core gameplay, but it helps recreate the feel.

---

# 10. States and screens

## Main states

1. **Loading**
2. **Main match**
3. **Player aiming**
4. **Ball in motion**
5. **AI thinking**
6. **AI shot in motion**
7. **Goal celebration**
8. **Match over**
9. **Pause/Menu**

## UI state machine

### During player turn

- aim enabled
- instruction visible
- no AI processing

### During motion

- input disabled

### During AI turn

- show opponent turn text
- input disabled

### After goal

- freeze briefly
- animate score
- reset board

---

# 11. Controls spec

## Player interaction rules

- User can only start drag if pointer is within an activation radius of the ball
- Dragging away from ball creates shot preview
- Release launches shot
- Ignore extra clicks while ball is moving

## Helpful polish

- aiming arrow
- dotted predicted path
- power bar or stretching line
- glow around ball on player turn
- subtle screen shake on hard collisions

---

# 12. Visual design spec

## Art direction

- minimal
- dark surrounding UI
- realistic tabletop feel
- clean sports-game arcade aesthetic

## Colors

- background: near-black
- pitch: saturated green
- lines: white
- pieces: cream/white
- UI: dark gray buttons
- accents: cyan/teal for player label

## Shadows

- soft shadows under pieces
- slight lighting on cylinders
- subtle field border depth

---

# 13. Technical implementation recommendation for Cursor

Best stack for replication:

## Option A: Fastest web MVP

- **Next.js**
- **React**
- **TypeScript**
- **HTML Canvas** or **PixiJS**
- **Matter.js** for physics

This is the best option for quickly cloning the mechanic.

## Option B: More game-native feel

- **Phaser 3** + Matter physics

Also a great fit, maybe even better if you want cleaner game structure.

### My recommendation

Use:

- **Next.js + Phaser 3 + Matter.js**  
or
- **Vite + Phaser 3**

If you want this embedded into a site/app, Phaser is very convenient.

---

# 14. Suggested object model

## Entities

### Ball

- id
- position
- velocity
- radius
- isMoving

### PlayerPeg

- id
- team
- x/y
- radius
- static = true

### Goal

- side: left/right
- hitbox
- scoringTeam

### MatchState

- playerScore
- aiScore
- turn: `"player" | "ai"`
- gamePhase: `"idle" | "aiming" | "moving" | "goal" | "gameOver"`
- stylePoints
- winner

---

# 15. Core systems to build

## A. Physics system

Responsibilities:

- ball motion
- collision response
- friction
- settle detection

## B. Turn manager

Responsibilities:

- enforce alternating turns
- lock input when needed
- trigger AI turn after settle

## C. Goal detection

Responsibilities:

- detect ball crossing goal zone
- increment score
- reset board

## D. AI shot selector

Responsibilities:

- choose direction + power
- trigger shot after short delay

## E. UI layer

Responsibilities:

- score display
- buttons
- instruction text
- sound/share/new game/menu

---

# 16. Replication MVP scope

## MVP v1

Build only:

- static board
- static pegs
- one flickable ball
- player turn
- simple AI turn
- score counting
- goal reset
- first to 3 wins

This gets the core loop working.

## MVP v2

Add:

- aim guide
- style points
- difficulty levels
- better AI
- sound effects
- goal animations
- menu/settings

## MVP v3

Add:

- cosmetics
- ranked AI tiers
- online multiplayer
- shot replays
- spin/curve mechanics

---

# 17. Inferred gameplay rules

These are inferred, but likely close:

- Only one flick per turn
- Only ball is flicked
- Ball continues until it stops
- Static pegs shape the lane strategy
- Goal immediately ends the turn and triggers reset
- Player and AI alternate automatically
- Score persists across kickoff resets

---

# 18. Cursor-ready spec prompt

You can paste this into Cursor as the implementation brief:

```
Build a browser-based top-down flick football game inspired by tabletop button soccer.

Core gameplay:
- Two sides: player and AI
- Static circular player pegs are arranged in formation on a rectangular pitch
- A single ball sits on the field
- On the player's turn, the user clicks/touches near the ball, drags backward, and releases to flick the ball
- The drag direction determines shot direction and power
- The ball uses 2D physics, collides with pegs and walls, and can enter either goal
- When the ball stops moving, the turn ends
- Then the AI takes its turn using the same ball and launches a shot automatically
- If the ball enters a goal, update the score and reset the field
- Match ends when one side reaches 3 goals

Tech:
- Use TypeScript
- Use Phaser 3 with Matter.js physics, or React + Matter.js if simpler
- Fixed top-down camera
- Responsive layout but optimized for desktop first

Entities:
- Ball: dynamic circle body
- Pegs: static circle bodies
- Goals: sensor zones on left and right edges
- Match state: score, turn, phase, winner

Game states:
- player_turn
- aiming
- ball_moving
- ai_turn
- goal_scored
- game_over

UI:
- Top HUD with player score, AI score, turn text
- Bottom controls: New Game, Menu, Share, sound toggle
- Instruction text: click near the ball, drag back, release to flick

Physics:
- Ball has friction / damping
- Ball bounces off walls and pegs
- Turn ends when ball velocity is below a threshold for a short time

AI:
- Bronze AI difficulty
- Simple heuristic: choose a direction toward the player goal, avoid obvious blockers, add some randomness
- Delay briefly before shooting to feel natural

Visual style:
- Dark outer UI
- Green football pitch with white lines
- Cream-colored cylindrical pegs
- Minimal arcade polish
- Soft shadows and subtle impact feedback

Deliverables:
- Working playable MVP
- Clean component structure
- Constants for tuning: ball radius, peg radius, max drag distance, shot power multiplier, friction, restitution
- Easy to extend for future difficulty levels and cosmetics
```

---

# 19. Open questions / unknowns

These are the parts we can’t confirm from this single screen:

-   
exact peg count and formation rules  

-   
whether there are special trick shots  

-   
exact AI difficulty differences  

-   
whether “style” affects progression  

-   
match length / victory condition  

-   
whether sound/music includes crowd/impact effects  

-   
whether sign-in unlocks cosmetics, rankings, or saves  


---

# 20. Best replication strategy

To replicate this fast and well:

1.   
Clone the **core flick mechanic** first  

2.   
Make **pegs static**  

3.   
Use **simple turn-based ball-only gameplay**  

4.   
Add **Bronze AI**  

5.   
Tune physics until it feels satisfying  

6.   
Only then add menu, style points, cosmetics, etc.  


That is the shortest path to “feels like the original.”

If you want, I can now turn this into a **full engineering spec in markdown** with:

-   
architecture  

-   
components  

-   
physics formulas  

-   
state machine  

-   
file structure  

-   
implementation plan for Cursor.

