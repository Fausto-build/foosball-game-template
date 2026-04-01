export type Team = 'player' | 'ai';

export type GamePhase =
  | 'loading'
  | 'player_turn'
  | 'aiming'
  | 'ball_moving'
  | 'ai_thinking'
  | 'ai_moving'
  | 'goal_scored'
  | 'game_over'
  | 'paused';

export interface ScoreState {
  player: number;
  ai: number;
}

export interface VectorLike {
  x: number;
  y: number;
}

export interface PegSpawn {
  id: string;
  team: Team;
  x: number;
  y: number;
}

export interface ShotTelemetry {
  shooter: Team;
  start: VectorLike;
  wallBounces: number;
  pegHits: number;
  maxSpeed: number;
}
