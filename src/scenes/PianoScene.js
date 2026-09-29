import Phaser from 'phaser';

export class PianoScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Piano' });
  }

  create(data) {
    this.add.text(20, 20, 'Piano (pendiente)');
    this.time.delayedCall(1000, () => data.onDone?.({ win: true }));
  }
}
