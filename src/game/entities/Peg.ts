import Phaser from 'phaser';
import { PEG_RADIUS } from '../constants';
import type { PegSpawn, Team } from '../../types/game';

export class Peg {
  private static readonly TEXTURE_KEYS: Record<Team, string> = {
    player: 'peg-player',
    ai: 'peg-ai',
  };

  private readonly sprite: Phaser.Physics.Matter.Image;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly home: Phaser.Math.Vector2;

  constructor(
    private readonly scene: Phaser.Scene,
    spawn: PegSpawn,
  ) {
    Peg.ensureTexture(scene, spawn.team);

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
      Peg.TEXTURE_KEYS[spawn.team],
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
    body.label = `peg-${spawn.team}`;
  }

  private static ensureTexture(scene: Phaser.Scene, team: Team) {
    const textureKey = Peg.TEXTURE_KEYS[team];
    if (scene.textures.exists(textureKey)) {
      return;
    }

    const size = PEG_RADIUS * 2 + 16;
    const bodyWidth = PEG_RADIUS * 1.18;
    const bodyHeight = PEG_RADIUS * 1.72;
    const bodyX = size / 2 - bodyWidth / 2;
    const bodyY = size / 2 - bodyHeight / 2 + 1;
    const graphics = scene.add.graphics();

    graphics.fillStyle(0xd9d3c1, 1);
    graphics.fillRoundedRect(bodyX, bodyY + 3, bodyWidth, bodyHeight - 5, 4);
    graphics.fillStyle(0xf7f2e3, 1);
    graphics.fillEllipse(size / 2, bodyY + 4, bodyWidth, PEG_RADIUS * 0.62);
    graphics.fillStyle(0xfefcf4, 0.95);
    graphics.fillRoundedRect(bodyX + 2, bodyY + 5, bodyWidth * 0.3, bodyHeight - 9, 3);
    graphics.fillStyle(0xffffff, 0.72);
    graphics.fillEllipse(size / 2 - 2, bodyY + 2, bodyWidth * 0.55, PEG_RADIUS * 0.26);
    graphics.lineStyle(1, 0xb3ab99, 0.75);
    graphics.strokeEllipse(size / 2, bodyY + 4, bodyWidth, PEG_RADIUS * 0.62);
    graphics.lineStyle(1, 0xc4bcaa, 0.65);
    graphics.strokeRoundedRect(bodyX, bodyY + 3, bodyWidth, bodyHeight - 5, 4);
    graphics.generateTexture(textureKey, size, size);
    graphics.destroy();
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
