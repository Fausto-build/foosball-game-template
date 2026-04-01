import type { Side } from '../types/game';

export interface TeamProfile {
  id: string;
  displayName: string;
  hudLabel: string;
  hudPalette: {
    background: string;
    text: string;
  };
  pegPalette: {
    body: number;
    cap: number;
    stripe: number;
    shine: number;
    outline: number;
    trim: number;
  };
  goalHighlight: number;
}

interface MatchSideConfig {
  controller: 'human' | 'ai';
  profileId: TeamProfileId;
}

// Most future identity customizations only need edits in this file:
// 1. change the `profileId` assigned to each side in `MATCH_SIDE_CONFIG`
// 2. update the names and palettes in `TEAM_PROFILES`
export const TEAM_PROFILES = {
  argentina: {
    id: 'argentina',
    displayName: 'Argentina',
    hudLabel: 'ARGENTINA',
    hudPalette: {
      background: '#c6edf8',
      text: '#16384a',
    },
    pegPalette: {
      body: 0x7dcbe2,
      cap: 0xf8fcff,
      stripe: 0xf3fbff,
      shine: 0xffffff,
      outline: 0x5a93ad,
      trim: 0xaedfeb,
    },
    goalHighlight: 0x7ddcf6,
  },
  bronze_ai: {
    id: 'bronze_ai',
    displayName: 'Bronze AI',
    hudLabel: 'BRONZE AI',
    hudPalette: {
      background: '#5c3b24',
      text: '#f6dcc1',
    },
    pegPalette: {
      body: 0x885b37,
      cap: 0xd7a16c,
      stripe: 0xf0c99b,
      shine: 0xffebd1,
      outline: 0x5d381f,
      trim: 0xbd8655,
    },
    goalHighlight: 0xd68a43,
  },
} as const satisfies Record<string, TeamProfile>;

export type TeamProfileId = keyof typeof TEAM_PROFILES;

export const MATCH_SIDE_CONFIG = {
  player: {
    controller: 'human',
    profileId: 'argentina',
  },
  ai: {
    controller: 'ai',
    profileId: 'bronze_ai',
  },
} as const satisfies Record<Side, MatchSideConfig>;

function getSideConfig(side: Side) {
  return MATCH_SIDE_CONFIG[side];
}

export function getSideProfile(side: Side) {
  return TEAM_PROFILES[getSideConfig(side).profileId];
}

export function getSideDisplayName(side: Side) {
  return getSideProfile(side).displayName;
}

export function getSideHudLabel(side: Side) {
  return getSideProfile(side).hudLabel;
}

export function getSideHudPalette(side: Side) {
  return getSideProfile(side).hudPalette;
}

export function getSideGoalHighlight(side: Side) {
  return getSideProfile(side).goalHighlight;
}

export function getTurnPromptMessage(side: Side) {
  const sideName = getSideDisplayName(side);

  return getSideConfig(side).controller === 'human'
    ? `Tu turno: ${sideName} patea la pelota.`
    : `Turno de ${sideName}: está pensando.`;
}

export function getKickoffMessage(side: Side) {
  const sideName = getSideDisplayName(side);

  return getSideConfig(side).controller === 'human'
    ? `Saque reiniciado: ${sideName} ataca.`
    : `Saque reiniciado: saca ${sideName}.`;
}

export function getShotMovingMessage(side: Side) {
  const sideName = getSideDisplayName(side);

  return getSideConfig(side).controller === 'human'
    ? `Pelota en juego para ${sideName}…`
    : `Disparo de ${sideName} en movimiento.`;
}

export function getGoalScoredMessage(side: Side) {
  return `Gol de ${getSideDisplayName(side)}. Rearmando la mesa…`;
}

export function getGameOverStatusMessage(side: Side) {
  return `Final del partido: ${getSideDisplayName(side)} gana el encuentro.`;
}

export function getWinnerOverlayMessage(side: Side) {
  return `${getSideDisplayName(side)} gana el partido.`;
}
