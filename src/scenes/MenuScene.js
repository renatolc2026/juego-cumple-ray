import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Menu' });
  }

  create(data) {
    this.add.text(20, 20, 'Menu (pendiente)');
    this.time.delayedCall(1000, () => data.onDone?.({ win: true }));
  }
}
