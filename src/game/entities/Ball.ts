import Phaser from 'phaser';
import { BALL_RADIUS } from '../constants';

export class Ball {
  private static readonly TEXTURE_KEY = 'ball-piece';

  private readonly sprite: Phaser.Physics.Matter.Image;
  private readonly glow: Phaser.GameObjects.Arc;
  private readonly shadow: Phaser.GameObjects.Ellipse;

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
  ) {
    Ball.ensureTexture(scene);

    this.glow = scene.add
      .circle(x, y, BALL_RADIUS + 12, 0x76e7ff, 0)
      .setDepth(14)
      .setBlendMode(Phaser.BlendModes.SCREEN);

    this.shadow = scene.add
      .ellipse(x + 4, y + 6, BALL_RADIUS * 2.05, BALL_RADIUS * 1.45, 0x05090b, 0.24)
      .setDepth(15);

    this.sprite = scene.matter.add.image(x, y, Ball.TEXTURE_KEY);
    this.sprite.setDepth(18);
    this.sprite.setCircle(BALL_RADIUS);
    this.sprite.setIgnoreGravity(true);

    const body = this.sprite.body as MatterJS.BodyType;
    body.label = 'ball';
  }

  private static ensureTexture(scene: Phaser.Scene) {
    if (scene.textures.exists(Ball.TEXTURE_KEY)) {
      return;
    }

    const size = BALL_RADIUS * 2 + 8;
    const graphics = scene.add.graphics();

    graphics.fillStyle(0xf3f1e7, 1);
    graphics.fillCircle(size / 2, size / 2, BALL_RADIUS);
    graphics.fillStyle(0xffffff, 0.9);
    graphics.fillCircle(size / 2 - 3, size / 2 - 4, BALL_RADIUS * 0.42);
    graphics.fillStyle(0xd9d9d1, 0.9);
    graphics.fillCircle(size / 2 + 3, size / 2 + 4, BALL_RADIUS * 0.18);
    graphics.lineStyle(1, 0xb5b5aa, 0.85);
    graphics.strokeCircle(size / 2, size / 2, BALL_RADIUS - 1);
    graphics.generateTexture(Ball.TEXTURE_KEY, size, size);
    graphics.destroy();
  }

  reset(x: number, y: number) {
    this.sprite.setAwake();
    this.sprite.setPosition(x, y);
    this.sprite.setVelocity(0, 0);
    this.sprite.setAngularVelocity(0);
  }

  launch(velocity: Phaser.Math.Vector2) {
    this.sprite.setAwake();
    this.sprite.setAngularVelocity(Phaser.Math.FloatBetween(-0.04, 0.04));
    this.sprite.setVelocity(velocity.x, velocity.y);
  }

  stop() {
    this.sprite.setAwake();
    this.sprite.setVelocity(0, 0);
    this.sprite.setAngularVelocity(0);
  }

  update(time: number, active: boolean, aiming: boolean) {
    const { x, y } = this.sprite;
    const pulse = 0.18 + Math.sin(time / 150) * 0.04;

    this.glow.setPosition(x, y);
    this.glow.setVisible(active);
    this.glow.setAlpha(active ? pulse * 0.7 + (aiming ? 0.08 : 0) : 0);
    this.glow.setScale(aiming ? 1.12 : 1);

    this.shadow.setPosition(x + 5, y + 7);
  }

  destroy() {
    this.glow.destroy();
    this.shadow.destroy();
    this.sprite.destroy();
  }

  getPosition() {
    return new Phaser.Math.Vector2(this.sprite.x, this.sprite.y);
  }

  getVelocity() {
    const velocity = (this.sprite.body as MatterJS.BodyType).velocity;

    return new Phaser.Math.Vector2(velocity.x, velocity.y);
  }

  getSpeed() {
    const velocity = this.getVelocity();
    return velocity.length();
  }

  getBody() {
    return this.sprite.body as MatterJS.BodyType;
  }

  getSprite() {
    return this.sprite;
  }

  get x() {
    return this.sprite.x;
  }

  get y() {
    return this.sprite.y;
  }
}
