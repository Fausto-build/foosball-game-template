import Phaser from 'phaser';
import type { PegSpawn, Team } from '../types/game';

export const SCENE_WIDTH = 1080;
export const SCENE_HEIGHT = 620;

export const BOARD_BOUNDS = {
  x: 56,
  y: 44,
  width: 968,
  height: 532,
};

export const PITCH_BOUNDS = {
  x: 120,
  y: 86,
  width: 840,
  height: 448,
};

export const GOAL_WIDTH = 132;
export const GOAL_DEPTH = 58;
export const WALL_THICKNESS = 18;

export const BALL_RADIUS = 10;
export const PEG_RADIUS = 16;
export const ACTIVATION_RADIUS = 40;
export const MAX_DRAG_DISTANCE = 150;
export const SHOT_POWER_MULTIPLIER = 0.082;
export const MAX_BALL_SPEED = 14;
export const BALL_DAMPING = 0.017;
export const BALL_FRICTION = 0.004;
export const BALL_RESTITUTION = 0.96;
export const SETTLE_SPEED_THRESHOLD = 0.14;
export const SETTLE_CONFIRMATION_MS = 420;
export const AI_THINK_TIME_MS = 720;
export const GOAL_RESET_DELAY_MS = 980;
export const MAX_MATCH_SCORE = 3;

export const COLLISION_SHAKE_SPEED = 9.6;
export const LONG_SHOT_DISTANCE = PITCH_BOUNDS.width * 0.38;

export const GOAL_CENTER_Y = PITCH_BOUNDS.y + PITCH_BOUNDS.height / 2;
export const GOAL_OPEN_TOP = GOAL_CENTER_Y - GOAL_WIDTH / 2;
export const GOAL_OPEN_BOTTOM = GOAL_CENTER_Y + GOAL_WIDTH / 2;

const PLAYER_ROW_LAYOUT = [
  { x: 88, ys: [78, 168, 280, 370] },
  { x: 206, ys: [112, 224, 336] },
  { x: 324, ys: [160, 288] },
  { x: 426, ys: [224] },
] as const;

function buildFormation(team: Team): PegSpawn[] {
  const spawns: PegSpawn[] = [];

  PLAYER_ROW_LAYOUT.forEach((row, rowIndex) => {
    row.ys.forEach((y, index) => {
      const x =
        team === 'player'
          ? PITCH_BOUNDS.x + row.x
          : PITCH_BOUNDS.x + PITCH_BOUNDS.width - row.x;

      spawns.push({
        id: `${team}-peg-${rowIndex}-${index}`,
        team,
        x,
        y: PITCH_BOUNDS.y + y,
      });
    });
  });

  return spawns;
}

export const PLAYER_PEGS = buildFormation('player');
export const AI_PEGS = buildFormation('ai');
export const PEG_SPAWNS = [...PLAYER_PEGS, ...AI_PEGS];

export const BALL_KICKOFF_POSITION = {
  x: PITCH_BOUNDS.x + PITCH_BOUNDS.width / 2,
  y: PITCH_BOUNDS.y + PITCH_BOUNDS.height / 2,
};

export const LEFT_GOAL_SENSOR = new Phaser.Geom.Rectangle(
  PITCH_BOUNDS.x - GOAL_DEPTH + BALL_RADIUS + 6,
  GOAL_OPEN_TOP + BALL_RADIUS,
  GOAL_DEPTH - BALL_RADIUS - 10,
  GOAL_WIDTH - BALL_RADIUS * 2,
);

export const RIGHT_GOAL_SENSOR = new Phaser.Geom.Rectangle(
  PITCH_BOUNDS.x + PITCH_BOUNDS.width + BALL_RADIUS,
  GOAL_OPEN_TOP + BALL_RADIUS,
  GOAL_DEPTH - BALL_RADIUS - 10,
  GOAL_WIDTH - BALL_RADIUS * 2,
);

export const GOAL_TARGETS = {
  player: new Phaser.Math.Vector2(
    RIGHT_GOAL_SENSOR.centerX,
    RIGHT_GOAL_SENSOR.centerY,
  ),
  ai: new Phaser.Math.Vector2(LEFT_GOAL_SENSOR.centerX, LEFT_GOAL_SENSOR.centerY),
};

export const AI_ANGLE_OFFSETS = [
  -0.55,
  -0.36,
  -0.22,
  -0.12,
  -0.05,
  0,
  0.05,
  0.12,
  0.22,
  0.36,
  0.55,
];

export const AI_CANDIDATE_POWERS = [8.1, 9.1, 10.3, 11.2, 12.1];

export const PLAYER_TURN_MESSAGE = 'Your turn — flick the ball!';
export const AI_TURN_MESSAGE = 'Computer turn — Bronze AI is thinking.';
export const PLAYER_KICKOFF_MESSAGE = 'Kickoff reset — your turn.';
export const AI_KICKOFF_MESSAGE = 'Kickoff reset — computer serves.';
