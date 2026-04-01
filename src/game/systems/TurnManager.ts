import Phaser from 'phaser';
import {
  AI_KICKOFF_MESSAGE,
  AI_THINK_TIME_MS,
  AI_TURN_MESSAGE,
  GOAL_RESET_DELAY_MS,
  GOAL_TARGETS,
  LONG_SHOT_DISTANCE,
  MAX_MATCH_SCORE,
  PLAYER_KICKOFF_MESSAGE,
  PLAYER_TURN_MESSAGE,
} from '../constants';
import { useGameStore } from '../../state/gameStore';
import type { ShotTelemetry, Team } from '../../types/game';

interface TurnManagerOptions {
  onRequestAiShot: () => void;
  onResetBoard: () => void;
}

interface StyleResult {
  delta: number;
  label: string;
}

export class TurnManager {
  private aiTimer?: Phaser.Time.TimerEvent;
  private startTimer?: Phaser.Time.TimerEvent;
  private resetTimer?: Phaser.Time.TimerEvent;
  private goalLocked = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: TurnManagerOptions,
  ) {}

  startNewMatch() {
    this.clearTimers();
    this.goalLocked = false;

    const store = useGameStore.getState();
    store.resetMatch();
    this.options.onResetBoard();

    this.startTimer = this.scene.time.delayedCall(250, () => {
      this.beginPlayerTurn();
    });
  }

  beginPlayerTurn(message = PLAYER_TURN_MESSAGE) {
    const store = useGameStore.getState();
    store.setTurn('player');
    store.setPhase('player_turn');
    store.setWinner(null);
    store.setStatusText(message);
    store.setStyleMessage(
      store.stylePoints > 0
        ? `Estilo acumulado: ${store.stylePoints}`
        : 'Haz clic cerca de la pelota · arrastra hacia atrás · suelta para patear',
    );
  }

  beginAiming() {
    if (useGameStore.getState().phase !== 'player_turn') {
      return;
    }

    const store = useGameStore.getState();
    store.setPhase('aiming');
    store.setStatusText('Alinea el tiro y suelta.');
  }

  cancelAiming() {
    if (useGameStore.getState().phase !== 'aiming') {
      return;
    }

    const store = useGameStore.getState();
    store.setPhase('player_turn');
    store.setStatusText(PLAYER_TURN_MESSAGE);
  }

  onShotLaunched(shooter: Team) {
    this.goalLocked = false;

    const store = useGameStore.getState();
    store.setTurn(shooter);
    store.setPhase(shooter === 'player' ? 'ball_moving' : 'ai_moving');
    store.setStatusText(
      shooter === 'player' ? 'Pelota en juego…' : 'Disparo de la computadora en movimiento.',
    );
  }

  onBallSettled() {
    if (this.goalLocked || useGameStore.getState().winner) {
      return;
    }

    if (useGameStore.getState().turn === 'player') {
      this.beginAiThinking();
      return;
    }

    this.beginPlayerTurn();
  }

  beginAiThinking(message = AI_TURN_MESSAGE) {
    this.clearAiTimer();

    const store = useGameStore.getState();
    store.setTurn('ai');
    store.setPhase('ai_thinking');
    store.setStatusText(message);

    this.aiTimer = this.scene.time.delayedCall(AI_THINK_TIME_MS, () => {
      if (useGameStore.getState().phase === 'ai_thinking') {
        this.options.onRequestAiShot();
      }
    });
  }

  onGoal(scoringTeam: Team, shot: ShotTelemetry | null) {
    if (this.goalLocked) {
      return;
    }

    this.goalLocked = true;
    this.clearTimers();

    const store = useGameStore.getState();
    const nextScore = {
      ...store.score,
      [scoringTeam]: store.score[scoringTeam] + 1,
    };
    const isMatchWinner = nextScore[scoringTeam] >= MAX_MATCH_SCORE;
    const styleResult = this.calculateStyle(scoringTeam, shot, isMatchWinner);

    store.setScore(nextScore);

    if (styleResult.delta > 0) {
      store.awardStyle(styleResult.delta, styleResult.label);
    } else {
      store.setStyleMessage(
        store.stylePoints > 0
          ? `Estilo acumulado: ${store.stylePoints}`
          : 'Definición limpia. Sin bono de estilo.',
      );
    }

    if (isMatchWinner) {
      store.setWinner(scoringTeam);
      store.setPhase('game_over');
      store.setStatusText(
        scoringTeam === 'player'
          ? 'Final del partido: ganaste el encuentro.'
          : 'Final del partido: la IA Bronce se lo lleva.',
      );
      return;
    }

    store.setPhase('goal_scored');
    store.setStatusText(
      scoringTeam === 'player'
        ? 'Gol tuyo. Rearmando la mesa…'
        : 'Gol de la IA Bronce. Rearmando la mesa…',
    );

    const nextTurn: Team = scoringTeam === 'player' ? 'ai' : 'player';
    this.resetTimer = this.scene.time.delayedCall(GOAL_RESET_DELAY_MS, () => {
      this.goalLocked = false;
      this.options.onResetBoard();

      if (nextTurn === 'player') {
        this.beginPlayerTurn(PLAYER_KICKOFF_MESSAGE);
        return;
      }

      this.beginAiThinking(AI_KICKOFF_MESSAGE);
    });
  }

  destroy() {
    this.clearTimers();
  }

  private clearAiTimer() {
    this.aiTimer?.remove(false);
    this.aiTimer = undefined;
  }

  private clearTimers() {
    this.clearAiTimer();
    this.startTimer?.remove(false);
    this.startTimer = undefined;
    this.resetTimer?.remove(false);
    this.resetTimer = undefined;
  }

  private calculateStyle(
    scoringTeam: Team,
    shot: ShotTelemetry | null,
    isMatchWinner: boolean,
  ): StyleResult {
    let delta = 0;
    const labels: string[] = [];

    if (shot) {
      const goalTarget = GOAL_TARGETS[scoringTeam];
      const distance = Phaser.Math.Distance.Between(
        shot.start.x,
        shot.start.y,
        goalTarget.x,
        goalTarget.y,
      );

      if (shot.wallBounces > 0) {
        delta += 10;
        labels.push('gol con rebote');
      }

      if (distance >= LONG_SHOT_DISTANCE) {
        delta += 5;
        labels.push('larga distancia');
      }

      if (shot.pegHits >= 2) {
        delta += 10;
        labels.push('entre el tráfico');
      }

      if (shot.maxSpeed >= 11.4) {
        delta += 5;
        labels.push('disparo potente');
      }
    }

    if (isMatchWinner) {
      delta += 25;
      labels.push('gol decisivo');
    }

    return {
      delta,
      label: labels.length > 0 ? labels.slice(0, 2).join(' · ') : 'definición precisa',
    };
  }
}
