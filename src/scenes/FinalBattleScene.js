import Phaser from 'phaser';

export class FinalBattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FinalBattle' });
  }

  create(data) {
    this.add.text(20, 20, 'FinalBattle (pendiente)');
    this.time.delayedCall(1000, () => data.onDone?.({ win: true }));
  }
}
