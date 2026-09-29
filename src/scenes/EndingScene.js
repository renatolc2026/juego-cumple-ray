import Phaser from 'phaser';

export class EndingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Ending' });
  }

  create(data) {
    this.add.text(20, 20, 'Ending (pendiente)');
    this.time.delayedCall(1000, () => data.onDone?.({ win: true }));
  }
}
