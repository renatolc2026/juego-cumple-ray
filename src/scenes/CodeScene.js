import Phaser from 'phaser';

export class CodeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Code' });
  }

  create(data) {
    this.add.text(20, 20, 'Code (pendiente)');
    this.time.delayedCall(1000, () => data.onDone?.({ win: true }));
  }
}
