import {
  BALL_DAMPING,
  BALL_FRICTION,
  BALL_RESTITUTION,
  MAX_BALL_SPEED,
  SETTLE_SPEED_THRESHOLD,
} from '../constants';
import { Ball } from '../entities/Ball';

export const PhysicsTuning = {
  applyToBall(ball: Ball) {
    const sprite = ball.getSprite();

    sprite.setIgnoreGravity(true);
    sprite.setBounce(BALL_RESTITUTION);
    sprite.setFriction(BALL_FRICTION);
    sprite.setFrictionAir(BALL_DAMPING);
    sprite.setMass(0.12);
  },

  clampBallVelocity(ball: Ball) {
    const velocity = ball.getVelocity();

    if (velocity.length() <= MAX_BALL_SPEED) {
      return;
    }

    velocity.setLength(MAX_BALL_SPEED);
    ball.getSprite().setVelocity(velocity.x, velocity.y);
  },

  isSettled(ball: Ball) {
    return ball.getSpeed() <= SETTLE_SPEED_THRESHOLD;
  },
};
