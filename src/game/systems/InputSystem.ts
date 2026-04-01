import Phaser from 'phaser';
import {
  ACTIVATION_RADIUS,
  BALL_RADIUS,
  MAX_DRAG_DISTANCE,
  SHOT_POWER_MULTIPLIER,
} from '../constants';
import { useGameStore } from '../../state/gameStore';
import { Ball } from '../entities/Ball';

interface InputSystemOptions {
  onAimingStart: () => void;
  onAimingCancel: () => void;
  onShoot: (velocity: Phaser.Math.Vector2) => void;
}

export class InputSystem {
  private readonly aimGraphics: Phaser.GameObjects.Graphics;
  private readonly dragVector = new Phaser.Math.Vector2();
  private dragging = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly ball: Ball,
    private readonly options: InputSystemOptions,
  ) {
    this.aimGraphics = scene.add.graphics().setDepth(26);

    scene.input.on('pointerdown', this.handlePointerDown, this);
    scene.input.on('pointermove', this.handlePointerMove, this);
    scene.input.on('pointerup', this.handlePointerUp, this);
    scene.input.on('pointerupoutside', this.handlePointerUp, this);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    const state = useGameStore.getState();
    if (
      state.turn !== 'player' ||
      (state.phase !== 'player_turn' && state.phase !== 'aiming')
    ) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      pointer.x,
      pointer.y,
      this.ball.x,
      this.ball.y,
    );

    if (distance > ACTIVATION_RADIUS) {
      return;
    }

    this.dragging = true;
    this.options.onAimingStart();
    this.updateDrag(pointer);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.dragging) {
      return;
    }

    this.updateDrag(pointer);
  }

  private handlePointerUp() {
    if (!this.dragging) {
      return;
    }

    this.dragging = false;

    const velocity = this.dragVector.clone().scale(SHOT_POWER_MULTIPLIER);
    this.clearAim();

    if (velocity.length() < 0.9) {
      this.options.onAimingCancel();
      return;
    }

    this.options.onShoot(velocity);
  }

  private updateDrag(pointer: Phaser.Input.Pointer) {
    this.dragVector.set(this.ball.x - pointer.x, this.ball.y - pointer.y);

    if (this.dragVector.length() > MAX_DRAG_DISTANCE) {
      this.dragVector.setLength(MAX_DRAG_DISTANCE);
    }

    this.renderAim();
  }

  private renderAim() {
    if (this.dragVector.lengthSq() === 0) {
      this.clearAim();
      return;
    }

    const direction = this.dragVector.clone().normalize();
    const power = this.dragVector.length() / MAX_DRAG_DISTANCE;
    const start = new Phaser.Math.Vector2(this.ball.x, this.ball.y).add(
      direction.clone().scale(BALL_RADIUS + 4),
    );
    const arrowLength = 26 + power * 88;
    const end = start.clone().add(direction.clone().scale(arrowLength));
    const headLength = 10 + power * 12;
    const headWidth = 8 + power * 10;
    const headBase = end.clone().subtract(direction.clone().scale(headLength));
    const normal = new Phaser.Math.Vector2(-direction.y, direction.x).scale(headWidth / 2);

    this.aimGraphics.clear();
    this.aimGraphics.lineStyle(3, 0xf7f7f0, 0.92);
    this.aimGraphics.strokeLineShape(
      new Phaser.Geom.Line(
        start.x,
        start.y,
        headBase.x,
        headBase.y,
      ),
    );
    this.aimGraphics.fillStyle(0xf7f7f0, 0.24 + power * 0.18);
    this.aimGraphics.fillTriangle(
      headBase.x + normal.x,
      headBase.y + normal.y,
      end.x,
      end.y,
      headBase.x - normal.x,
      headBase.y - normal.y,
    );
    this.aimGraphics.lineStyle(2, 0xffffff, 0.82);
    this.aimGraphics.strokeTriangle(
      headBase.x + normal.x,
      headBase.y + normal.y,
      end.x,
      end.y,
      headBase.x - normal.x,
      headBase.y - normal.y,
    );
    this.aimGraphics.fillStyle(0xffffff, 0.18 + power * 0.18);
    this.aimGraphics.fillCircle(
      start.x,
      start.y,
      2 + power * 3,
    );
  }

  update() {
    if (!this.dragging && useGameStore.getState().phase !== 'aiming') {
      this.clearAim();
    }
  }

  reset() {
    this.dragging = false;
    this.dragVector.set(0, 0);
    this.clearAim();
  }

  destroy() {
    this.scene.input.off('pointerdown', this.handlePointerDown, this);
    this.scene.input.off('pointermove', this.handlePointerMove, this);
    this.scene.input.off('pointerup', this.handlePointerUp, this);
    this.scene.input.off('pointerupoutside', this.handlePointerUp, this);
    this.aimGraphics.destroy();
  }

  private clearAim() {
    this.aimGraphics.clear();
  }
}
