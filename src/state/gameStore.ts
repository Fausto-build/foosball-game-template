import { create } from 'zustand';
import type { GamePhase, ScoreState, Team } from '../types/game';

interface GameStore {
  score: ScoreState;
  turn: Team;
  phase: GamePhase;
  statusText: string;
  stylePoints: number;
  styleMessage: string;
  winner: Team | null;
  muted: boolean;
  setTurn: (turn: Team) => void;
  setPhase: (phase: GamePhase) => void;
  setStatusText: (statusText: string) => void;
  setScore: (score: ScoreState) => void;
  awardStyle: (delta: number, label: string) => void;
  setStyleMessage: (styleMessage: string) => void;
  setWinner: (winner: Team | null) => void;
  toggleMuted: () => void;
  resetMatch: () => void;
}

const INITIAL_SCORE: ScoreState = {
  player: 0,
  ai: 0,
};

const defaultStyleMessage = 'Click near the ball · drag back · release to flick';

export const useGameStore = create<GameStore>((set, get) => ({
  score: INITIAL_SCORE,
  turn: 'player',
  phase: 'loading',
  statusText: 'Loading match…',
  stylePoints: 0,
  styleMessage: defaultStyleMessage,
  winner: null,
  muted: false,
  setTurn: (turn) => set({ turn }),
  setPhase: (phase) => set({ phase }),
  setStatusText: (statusText) => set({ statusText }),
  setScore: (score) => set({ score }),
  awardStyle: (delta, label) =>
    set({
      stylePoints: get().stylePoints + delta,
      styleMessage: `+ ${delta} style · ${label}`,
    }),
  setStyleMessage: (styleMessage) => set({ styleMessage }),
  setWinner: (winner) => set({ winner }),
  toggleMuted: () => set({ muted: !get().muted }),
  resetMatch: () =>
    set({
      score: INITIAL_SCORE,
      turn: 'player',
      phase: 'loading',
      statusText: 'Re-racking the board…',
      stylePoints: 0,
      styleMessage: defaultStyleMessage,
      winner: null,
      muted: get().muted,
    }),
}));
