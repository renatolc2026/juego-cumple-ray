import Phaser from 'phaser';

export class SimonScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Simon' });
  }

  create(data) {
    this.add.text(20, 20, 'Simon (pendiente)');
    this.time.delayedCall(1000, () => data.onDone?.({ win: true }));
  }
}
