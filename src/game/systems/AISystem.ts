import Phaser from 'phaser';
import {
  AI_ANGLE_OFFSETS,
  AI_CANDIDATE_POWERS,
  GOAL_OPEN_BOTTOM,
  GOAL_OPEN_TOP,
  GOAL_TARGETS,
  PITCH_BOUNDS,
} from '../constants';

export class AISystem {
  chooseShot(
    matterPhysics: Phaser.Physics.Matter.MatterPhysics,
    ballPosition: Phaser.Math.Vector2,
    obstacleBodies: MatterJS.BodyType[],
  ) {
    const target = GOAL_TARGETS.ai;
    const baseAngle = Phaser.Math.Angle.Between(
      ballPosition.x,
      ballPosition.y,
      target.x,
      target.y,
    );

    let bestVector = new Phaser.Math.Vector2(-9.4, Phaser.Math.FloatBetween(-0.8, 0.8));
    let bestScore = Number.NEGATIVE_INFINITY;

    AI_ANGLE_OFFSETS.forEach((offset) => {
      AI_CANDIDATE_POWERS.forEach((power) => {
        const angle = baseAngle + offset + Phaser.Math.FloatBetween(-0.018, 0.018);
        const velocity = new Phaser.Math.Vector2(
          Math.cos(angle) * power,
          Math.sin(angle) * power,
        );

        const predictedEnd = new Phaser.Math.Vector2(
          ballPosition.x + velocity.x * 26,
          ballPosition.y + velocity.y * 26,
        );

        let score = (ballPosition.x - predictedEnd.x) * 1.6;
        score -= Phaser.Math.Distance.Between(
          predictedEnd.x,
          predictedEnd.y,
          target.x,
          target.y,
        ) * 0.075;

        if (
          predictedEnd.x < PITCH_BOUNDS.x + 56 &&
          predictedEnd.y > GOAL_OPEN_TOP &&
          predictedEnd.y < GOAL_OPEN_BOTTOM
        ) {
          score += 360;
        }

        if (velocity.x > -1.5) {
          score -= 160;
        }

        if (
          predictedEnd.y < PITCH_BOUNDS.y + 24 ||
          predictedEnd.y > PITCH_BOUNDS.y + PITCH_BOUNDS.height - 24
        ) {
          score -= 40;
        }

        const forwardProbe = {
          x: ballPosition.x + velocity.x * 18,
          y: ballPosition.y + velocity.y * 18,
        };

        const laneHits = matterPhysics.intersectRay(
          ballPosition.x,
          ballPosition.y,
          forwardProbe.x,
          forwardProbe.y,
          9,
          obstacleBodies,
        ) as MatterJS.BodyType[];
        const blocked = laneHits.some((body) => body.label !== 'ball');

        if (blocked) {
          score -= 120;
        }

        score += Phaser.Math.FloatBetween(-18, 18);

        if (score > bestScore) {
          bestScore = score;
          bestVector = velocity;
        }
      });
    });

    return bestVector;
  }
}
