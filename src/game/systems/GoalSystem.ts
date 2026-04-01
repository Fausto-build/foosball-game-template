import Phaser from 'phaser';
import { GOAL_TARGETS, LEFT_GOAL_SENSOR, RIGHT_GOAL_SENSOR } from '../constants';
import type { Side, VectorLike } from '../../types/game';

export class GoalSystem {
  private goalLocked = false;
  private readonly leftSensorBody: MatterJS.BodyType;
  private readonly rightSensorBody: MatterJS.BodyType;

  constructor(private readonly scene: Phaser.Scene) {
    this.leftSensorBody = scene.matter.add.rectangle(
      LEFT_GOAL_SENSOR.centerX,
      LEFT_GOAL_SENSOR.centerY,
      LEFT_GOAL_SENSOR.width,
      LEFT_GOAL_SENSOR.height,
      {
        isSensor: true,
        isStatic: true,
        label: 'goal-sensor-left',
      },
    );

    this.rightSensorBody = scene.matter.add.rectangle(
      RIGHT_GOAL_SENSOR.centerX,
      RIGHT_GOAL_SENSOR.centerY,
      RIGHT_GOAL_SENSOR.width,
      RIGHT_GOAL_SENSOR.height,
      {
        isSensor: true,
        isStatic: true,
        label: 'goal-sensor-right',
      },
    );
  }

  update(ballPosition: VectorLike): Side | null {
    if (this.goalLocked) {
      return null;
    }

    if (LEFT_GOAL_SENSOR.contains(ballPosition.x, ballPosition.y)) {
      this.goalLocked = true;
      return 'ai';
    }

    if (RIGHT_GOAL_SENSOR.contains(ballPosition.x, ballPosition.y)) {
      this.goalLocked = true;
      return 'player';
    }

    return null;
  }

  getGoalTarget(side: Side) {
    return GOAL_TARGETS[side].clone();
  }

  reset() {
    this.goalLocked = false;
  }

  destroy() {
    this.scene.matter.world.remove(this.leftSensorBody);
    this.scene.matter.world.remove(this.rightSensorBody);
  }
}
