import Phaser from 'phaser';
import { PEG_RADIUS } from '../constants';
import { getSideProfile } from '../teamConfig';
import type { PegSpawn, Side } from '../../types/game';

export class Peg {
  private readonly sprite: Phaser.Physics.Matter.Image;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly home: Phaser.Math.Vector2;

  constructor(
    private readonly scene: Phaser.Scene,
    spawn: PegSpawn,
  ) {
    const textureKey = Peg.ensureTexture(scene, spawn.side);

    this.home = new Phaser.Math.Vector2(spawn.x, spawn.y);
    this.shadow = scene.add
      .ellipse(
        spawn.x + 4,
        spawn.y + 9,
        PEG_RADIUS * 2,
        PEG_RADIUS * 0.95,
        0x061012,
        0.34,
      )
      .setDepth(9);

    this.sprite = scene.matter.add.image(
      spawn.x,
      spawn.y,
      textureKey,
      undefined,
      {
        isStatic: true,
      },
    );
    this.sprite.setDepth(12);
    this.sprite.setCircle(PEG_RADIUS);
    this.sprite.setStatic(true);
    this.sprite.setIgnoreGravity(true);

    const body = this.sprite.body as MatterJS.BodyType;
    body.label = `peg-${spawn.side}`;
  }

  private static getTextureKey(side: Side) {
    return `peg-${side}-${getSideProfile(side).id}`;
  }

  private static ensureTexture(scene: Phaser.Scene, side: Side) {
    const textureKey = Peg.getTextureKey(side);
    if (scene.textures.exists(textureKey)) {
      return textureKey;
    }

    const palette = getSideProfile(side).pegPalette;
    const size = PEG_RADIUS * 2 + 16;
    const bodyWidth = PEG_RADIUS * 1.18;
    const bodyHeight = PEG_RADIUS * 1.72;
    const bodyX = size / 2 - bodyWidth / 2;
    const bodyY = size / 2 - bodyHeight / 2 + 1;
    const graphics = scene.add.graphics();

    graphics.fillStyle(palette.body, 1);
    graphics.fillRoundedRect(bodyX, bodyY + 3, bodyWidth, bodyHeight - 5, 4);
    graphics.fillStyle(palette.cap, 1);
    graphics.fillEllipse(size / 2, bodyY + 4, bodyWidth, PEG_RADIUS * 0.62);
    graphics.fillStyle(palette.stripe, 0.95);
    graphics.fillRoundedRect(bodyX + 2, bodyY + 5, bodyWidth * 0.3, bodyHeight - 9, 3);
    graphics.fillStyle(palette.shine, 0.72);
    graphics.fillEllipse(size / 2 - 2, bodyY + 2, bodyWidth * 0.55, PEG_RADIUS * 0.26);
    graphics.lineStyle(1, palette.outline, 0.75);
    graphics.strokeEllipse(size / 2, bodyY + 4, bodyWidth, PEG_RADIUS * 0.62);
    graphics.lineStyle(1, palette.trim, 0.65);
    graphics.strokeRoundedRect(bodyX, bodyY + 3, bodyWidth, bodyHeight - 5, 4);
    graphics.generateTexture(textureKey, size, size);
    graphics.destroy();

    return textureKey;
  }

  reset() {
    this.sprite.setPosition(this.home.x, this.home.y);
    this.sprite.setVelocity(0, 0);
    this.shadow.setPosition(this.home.x + 4, this.home.y + 9);
  }

  destroy() {
    this.shadow.destroy();
    this.sprite.destroy();
  }

  getBody() {
    return this.sprite.body as MatterJS.BodyType;
  }
}
