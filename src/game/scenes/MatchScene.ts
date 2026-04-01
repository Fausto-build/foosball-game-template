import Phaser from 'phaser';
import { GAME_EVENTS, gameEvents } from '../FoosballGame';
import { Ball } from '../entities/Ball';
import { Peg } from '../entities/Peg';
import {
  AI_PEGS,
  BALL_KICKOFF_POSITION,
  COLLISION_SHAKE_SPEED,
  GOAL_CENTER_Y,
  GOAL_DEPTH,
  GOAL_OPEN_BOTTOM,
  GOAL_OPEN_TOP,
  PITCH_BOUNDS,
  PLAYER_PEGS,
  SETTLE_CONFIRMATION_MS,
  WALL_THICKNESS,
} from '../constants';
import { useGameStore } from '../../state/gameStore';
import type { ShotTelemetry, Team } from '../../types/game';
import { AISystem } from '../systems/AISystem';
import { GoalSystem } from '../systems/GoalSystem';
import { InputSystem } from '../systems/InputSystem';
import { PhysicsTuning } from '../systems/PhysicsTuning';
import { TurnManager } from '../systems/TurnManager';

export class MatchScene extends Phaser.Scene {
  private ball!: Ball;
  private pegs: Peg[] = [];
  private leftGoalHighlight!: Phaser.GameObjects.Rectangle;
  private rightGoalHighlight!: Phaser.GameObjects.Rectangle;
  private goalSystem!: GoalSystem;
  private inputSystem!: InputSystem;
  private turnManager!: TurnManager;
  private aiSystem!: AISystem;
  private walls: MatterJS.BodyType[] = [];
  private settleElapsedMs = 0;
  private currentShot: ShotTelemetry | null = null;

  constructor() {
    super('MatchScene');
  }

  create() {
    const store = useGameStore.getState();
    store.setPhase('loading');
    store.setStatusText('Lighting the table…');

    this.cameras.main.setBackgroundColor('#d7d7d7');
    this.drawBoard();
    this.createGoalHighlights();
    this.drawGoalDetails();
    this.walls = this.createWalls();
    this.goalSystem = new GoalSystem(this);

    this.pegs = [...PLAYER_PEGS, ...AI_PEGS].map((spawn) => new Peg(this, spawn));

    this.ball = new Ball(this, BALL_KICKOFF_POSITION.x, BALL_KICKOFF_POSITION.y);
    PhysicsTuning.applyToBall(this.ball);

    this.aiSystem = new AISystem();
    this.turnManager = new TurnManager(this, {
      onRequestAiShot: () => {
        this.fireAiShot();
      },
      onResetBoard: () => {
        this.resetBoard();
      },
    });
    this.inputSystem = new InputSystem(this, this.ball, {
      onAimingStart: () => {
        this.turnManager.beginAiming();
      },
      onAimingCancel: () => {
        this.turnManager.cancelAiming();
      },
      onShoot: (velocity) => {
        this.launchBall(velocity, 'player');
      },
    });

    this.matter.world.on('collisionstart', this.handleCollisionStart, this);
    gameEvents.on(GAME_EVENTS.NEW_GAME, this.handleNewGame, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);

    this.handleNewGame();
  }

  update(time: number, delta: number) {
    const phase = useGameStore.getState().phase;

    this.ball.update(
      time,
      phase === 'player_turn' || phase === 'aiming',
      phase === 'aiming',
    );
    this.inputSystem.update();

    if (phase !== 'ball_moving' && phase !== 'ai_moving') {
      return;
    }

    PhysicsTuning.clampBallVelocity(this.ball);
    if (this.currentShot) {
      this.currentShot.maxSpeed = Math.max(this.currentShot.maxSpeed, this.ball.getSpeed());
    }

    const scoringTeam = this.goalSystem.update(this.ball.getPosition());
    if (scoringTeam) {
      this.showGoalHighlight(scoringTeam);
      this.turnManager.onGoal(scoringTeam, this.currentShot);
      return;
    }

    if (PhysicsTuning.isSettled(this.ball)) {
      this.settleElapsedMs += delta;

      if (this.settleElapsedMs >= SETTLE_CONFIRMATION_MS) {
        this.settleElapsedMs = 0;
        this.ball.stop();
        this.currentShot = null;
        this.turnManager.onBallSettled();
      }

      return;
    }

    this.settleElapsedMs = 0;
  }

  private handleNewGame() {
    this.turnManager.startNewMatch();
  }

  private handleShutdown() {
    this.matter.world.off('collisionstart', this.handleCollisionStart, this);
    gameEvents.off(GAME_EVENTS.NEW_GAME, this.handleNewGame, this);
    this.goalSystem.destroy();
    this.inputSystem.destroy();
    this.turnManager.destroy();
    this.leftGoalHighlight.destroy();
    this.rightGoalHighlight.destroy();
    this.pegs.forEach((peg) => {
      peg.destroy();
    });
    this.ball.destroy();
  }

  private launchBall(velocity: Phaser.Math.Vector2, shooter: Team) {
    this.goalSystem.reset();
    this.settleElapsedMs = 0;
    this.currentShot = {
      shooter,
      start: {
        x: this.ball.x,
        y: this.ball.y,
      },
      wallBounces: 0,
      pegHits: 0,
      maxSpeed: velocity.length(),
    };

    this.ball.launch(velocity);
    this.turnManager.onShotLaunched(shooter);
  }

  private fireAiShot() {
    const velocity = this.aiSystem.chooseShot(
      this.matter,
      this.ball.getPosition(),
      this.getObstacleBodies(),
    );
    this.launchBall(velocity, 'ai');
  }

  private resetBoard() {
    this.ball.reset(BALL_KICKOFF_POSITION.x, BALL_KICKOFF_POSITION.y);
    this.pegs.forEach((peg) => {
      peg.reset();
    });
    this.clearGoalHighlights();
    this.goalSystem.reset();
    this.inputSystem.reset();
    this.currentShot = null;
    this.settleElapsedMs = 0;
  }

  private getObstacleBodies() {
    return [...this.walls, ...this.pegs.map((peg) => peg.getBody())];
  }

  private handleCollisionStart(event: { pairs: MatterJS.IPair[] }) {
    event.pairs.forEach((pair) => {
      const bodyA = pair.bodyA as MatterJS.BodyType;
      const bodyB = pair.bodyB as MatterJS.BodyType;
      const labels = [bodyA.label, bodyB.label];
      const ballHit = labels.includes('ball');
      if (!ballHit || !this.currentShot) {
        return;
      }

      const nonBallLabel = labels.find((label) => label !== 'ball') ?? '';
      const speed = this.ball.getSpeed();

      if (nonBallLabel.startsWith('wall') || nonBallLabel.startsWith('goal-')) {
        this.currentShot.wallBounces += 1;
      }

      if (nonBallLabel.startsWith('peg-')) {
        this.currentShot.pegHits += 1;
      }

      if (speed >= COLLISION_SHAKE_SPEED) {
        this.cameras.main.shake(85, 0.0018);
      }
    });
  }

  private createWalls() {
    const walls: MatterJS.BodyType[] = [];
    const pitchRight = PITCH_BOUNDS.x + PITCH_BOUNDS.width;
    const topWallHeight = GOAL_OPEN_TOP - PITCH_BOUNDS.y;
    const bottomWallHeight = PITCH_BOUNDS.y + PITCH_BOUNDS.height - GOAL_OPEN_BOTTOM;

    const addWall = (
      x: number,
      y: number,
      width: number,
      height: number,
      label: string,
    ) => {
      const body = this.matter.add.rectangle(x, y, width, height, {
        isStatic: true,
        label,
      });

      walls.push(body);
    };

    addWall(
      PITCH_BOUNDS.x + PITCH_BOUNDS.width / 2,
      PITCH_BOUNDS.y - WALL_THICKNESS / 2,
      PITCH_BOUNDS.width,
      WALL_THICKNESS,
      'wall-top',
    );
    addWall(
      PITCH_BOUNDS.x + PITCH_BOUNDS.width / 2,
      PITCH_BOUNDS.y + PITCH_BOUNDS.height + WALL_THICKNESS / 2,
      PITCH_BOUNDS.width,
      WALL_THICKNESS,
      'wall-bottom',
    );
    addWall(
      PITCH_BOUNDS.x - WALL_THICKNESS / 2,
      PITCH_BOUNDS.y + topWallHeight / 2,
      WALL_THICKNESS,
      topWallHeight,
      'wall-left-top',
    );
    addWall(
      PITCH_BOUNDS.x - WALL_THICKNESS / 2,
      GOAL_OPEN_BOTTOM + bottomWallHeight / 2,
      WALL_THICKNESS,
      bottomWallHeight,
      'wall-left-bottom',
    );
    addWall(
      pitchRight + WALL_THICKNESS / 2,
      PITCH_BOUNDS.y + topWallHeight / 2,
      WALL_THICKNESS,
      topWallHeight,
      'wall-right-top',
    );
    addWall(
      pitchRight + WALL_THICKNESS / 2,
      GOAL_OPEN_BOTTOM + bottomWallHeight / 2,
      WALL_THICKNESS,
      bottomWallHeight,
      'wall-right-bottom',
    );

    addWall(
      PITCH_BOUNDS.x - GOAL_DEPTH / 2,
      GOAL_OPEN_TOP - WALL_THICKNESS / 2,
      GOAL_DEPTH,
      WALL_THICKNESS,
      'goal-left-top',
    );
    addWall(
      PITCH_BOUNDS.x - GOAL_DEPTH / 2,
      GOAL_OPEN_BOTTOM + WALL_THICKNESS / 2,
      GOAL_DEPTH,
      WALL_THICKNESS,
      'goal-left-bottom',
    );
    addWall(
      PITCH_BOUNDS.x - GOAL_DEPTH - WALL_THICKNESS / 2,
      GOAL_CENTER_Y,
      WALL_THICKNESS,
      GOAL_OPEN_BOTTOM - GOAL_OPEN_TOP + WALL_THICKNESS * 2,
      'goal-left-back',
    );

    addWall(
      pitchRight + GOAL_DEPTH / 2,
      GOAL_OPEN_TOP - WALL_THICKNESS / 2,
      GOAL_DEPTH,
      WALL_THICKNESS,
      'goal-right-top',
    );
    addWall(
      pitchRight + GOAL_DEPTH / 2,
      GOAL_OPEN_BOTTOM + WALL_THICKNESS / 2,
      GOAL_DEPTH,
      WALL_THICKNESS,
      'goal-right-bottom',
    );
    addWall(
      pitchRight + GOAL_DEPTH + WALL_THICKNESS / 2,
      GOAL_CENTER_Y,
      WALL_THICKNESS,
      GOAL_OPEN_BOTTOM - GOAL_OPEN_TOP + WALL_THICKNESS * 2,
      'goal-right-back',
    );

    return walls;
  }

  private drawBoard() {
    const graphics = this.add.graphics();
    const stripeCount = 8;
    const stripeHeight = PITCH_BOUNDS.height / stripeCount;
    const goalHeight = GOAL_OPEN_BOTTOM - GOAL_OPEN_TOP;
    const leftGoalX = PITCH_BOUNDS.x - GOAL_DEPTH;
    const rightGoalX = PITCH_BOUNDS.x + PITCH_BOUNDS.width;

    graphics.fillStyle(0xbbbbbb, 0.9);
    graphics.fillRect(PITCH_BOUNDS.x - 10, PITCH_BOUNDS.y, 10, PITCH_BOUNDS.height);
    graphics.fillRect(
      PITCH_BOUNDS.x + PITCH_BOUNDS.width,
      PITCH_BOUNDS.y,
      10,
      PITCH_BOUNDS.height,
    );

    graphics.fillStyle(0x33853b, 1);
    graphics.fillRect(
      PITCH_BOUNDS.x,
      PITCH_BOUNDS.y,
      PITCH_BOUNDS.width,
      PITCH_BOUNDS.height,
    );

    for (let index = 0; index < stripeCount; index += 1) {
      graphics.fillStyle(index % 2 === 0 ? 0x3c9244 : 0x32853b, 0.14);
      graphics.fillRect(
        PITCH_BOUNDS.x,
        PITCH_BOUNDS.y + stripeHeight * index,
        PITCH_BOUNDS.width,
        stripeHeight,
      );
    }

    graphics.fillStyle(0x242424, 1);
    graphics.fillRect(leftGoalX, GOAL_OPEN_TOP, GOAL_DEPTH, goalHeight);
    graphics.fillRect(rightGoalX, GOAL_OPEN_TOP, GOAL_DEPTH, goalHeight);

    graphics.lineStyle(3, 0xffffff, 0.18);
    graphics.strokeRect(
      PITCH_BOUNDS.x,
      PITCH_BOUNDS.y,
      PITCH_BOUNDS.width,
      PITCH_BOUNDS.height,
    );
    graphics.strokeLineShape(
      new Phaser.Geom.Line(
        PITCH_BOUNDS.x + PITCH_BOUNDS.width / 2,
        PITCH_BOUNDS.y,
        PITCH_BOUNDS.x + PITCH_BOUNDS.width / 2,
        PITCH_BOUNDS.y + PITCH_BOUNDS.height,
      ),
    );
    graphics.strokeCircle(
      PITCH_BOUNDS.x + PITCH_BOUNDS.width / 2,
      PITCH_BOUNDS.y + PITCH_BOUNDS.height / 2,
      62,
    );
    graphics.fillStyle(0xffffff, 0.28);
    graphics.fillCircle(
      PITCH_BOUNDS.x + PITCH_BOUNDS.width / 2,
      PITCH_BOUNDS.y + PITCH_BOUNDS.height / 2,
      5,
    );

    graphics.strokeRect(
      PITCH_BOUNDS.x,
      PITCH_BOUNDS.y + 114,
      120,
      PITCH_BOUNDS.height - 228,
    );
    graphics.strokeRect(
      PITCH_BOUNDS.x + PITCH_BOUNDS.width - 120,
      PITCH_BOUNDS.y + 114,
      120,
      PITCH_BOUNDS.height - 228,
    );
    graphics.strokeRect(
      PITCH_BOUNDS.x,
      PITCH_BOUNDS.y + 170,
      56,
      PITCH_BOUNDS.height - 340,
    );
    graphics.strokeRect(
      PITCH_BOUNDS.x + PITCH_BOUNDS.width - 56,
      PITCH_BOUNDS.y + 170,
      56,
      PITCH_BOUNDS.height - 340,
    );
  }

  private createGoalHighlights() {
    const goalHeight = GOAL_OPEN_BOTTOM - GOAL_OPEN_TOP;
    const leftGoalX = PITCH_BOUNDS.x - GOAL_DEPTH;
    const rightGoalX = PITCH_BOUNDS.x + PITCH_BOUNDS.width;

    this.leftGoalHighlight = this.add
      .rectangle(leftGoalX + GOAL_DEPTH / 2, GOAL_CENTER_Y, GOAL_DEPTH, goalHeight, 0x23c552, 0)
      .setDepth(1);
    this.rightGoalHighlight = this.add
      .rectangle(
        rightGoalX + GOAL_DEPTH / 2,
        GOAL_CENTER_Y,
        GOAL_DEPTH,
        goalHeight,
        0x23c552,
        0,
      )
      .setDepth(1);
  }

  private drawGoalDetails() {
    const graphics = this.add.graphics().setDepth(2);
    const leftGoalX = PITCH_BOUNDS.x - GOAL_DEPTH;
    const rightGoalX = PITCH_BOUNDS.x + PITCH_BOUNDS.width;

    graphics.fillStyle(0xffffff, 0.78);
    graphics.fillRect(PITCH_BOUNDS.x - 3, GOAL_OPEN_TOP - 2, 3, 4);
    graphics.fillRect(PITCH_BOUNDS.x - 3, GOAL_OPEN_BOTTOM - 2, 3, 4);
    graphics.fillRect(PITCH_BOUNDS.x + PITCH_BOUNDS.width, GOAL_OPEN_TOP - 2, 3, 4);
    graphics.fillRect(PITCH_BOUNDS.x + PITCH_BOUNDS.width, GOAL_OPEN_BOTTOM - 2, 3, 4);

    graphics.lineStyle(1, 0x575757, 0.38);
    for (let x = leftGoalX + 6; x < leftGoalX + GOAL_DEPTH; x += 6) {
      graphics.strokeLineShape(new Phaser.Geom.Line(x, GOAL_OPEN_TOP, x, GOAL_OPEN_BOTTOM));
    }
    for (let x = rightGoalX + 6; x < rightGoalX + GOAL_DEPTH; x += 6) {
      graphics.strokeLineShape(new Phaser.Geom.Line(x, GOAL_OPEN_TOP, x, GOAL_OPEN_BOTTOM));
    }
    for (let y = GOAL_OPEN_TOP + 6; y < GOAL_OPEN_BOTTOM; y += 6) {
      graphics.strokeLineShape(new Phaser.Geom.Line(leftGoalX, y, leftGoalX + GOAL_DEPTH, y));
      graphics.strokeLineShape(new Phaser.Geom.Line(rightGoalX, y, rightGoalX + GOAL_DEPTH, y));
    }
  }

  private clearGoalHighlights() {
    this.tweens.killTweensOf(this.leftGoalHighlight);
    this.tweens.killTweensOf(this.rightGoalHighlight);
    this.leftGoalHighlight.setAlpha(0);
    this.rightGoalHighlight.setAlpha(0);
  }

  private showGoalHighlight(scoringTeam: Team) {
    this.clearGoalHighlights();

    const highlight = scoringTeam === 'player' ? this.rightGoalHighlight : this.leftGoalHighlight;
    const color = scoringTeam === 'player' ? 0x23c552 : 0xd63a3a;

    highlight.setFillStyle(color, 1);
    this.tweens.add({
      targets: highlight,
      alpha: { from: 0.2, to: 0.92 },
      duration: 120,
      ease: 'Sine.easeOut',
      yoyo: true,
      repeat: 1,
    });
    highlight.setAlpha(0.72);
  }
}
