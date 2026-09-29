import Phaser from 'phaser';

export class SalsaScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Salsa' });
  }

  create(data) {
    this.add.text(20, 20, 'Salsa (pendiente)');
    this.time.delayedCall(1000, () => data.onDone?.({ win: true }));
  }
}
