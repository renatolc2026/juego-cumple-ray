import Phaser from 'phaser';
import { S } from '../core/services.js';
import { audio } from '../core/audio.js';
import { controls } from '../core/input.js';
import { txt, panel } from '../core/text.js';
import * as fx from '../core/fx.js';
import { LANE_X, LANE_COLORS, LANE_DIRS } from '../core/rhythm.js';

// Piso de la torre: el eco toca una secuencia y Ray la repite en el piano.
const NOTES = [60, 64, 67, 72];
const ROT = { left: 0, down: -90, up: 90, right: 180 };

export class SimonScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Simon' });
  }

  create(data) {
    this.onDone = data.onDone;
    this.length = data.length || 3;
    this.seq = [];
    const r = new Phaser.Math.RandomDataGenerator([`piso${data.floor || 1}`]);
    for (let i = 0; i < this.length; i++) this.seq.push(r.between(0, 3));
    // Evitar la misma tecla tres veces seguidas
    for (let i = 2; i < this.seq.length; i++) if (this.seq[i] === this.seq[i - 1] && this.seq[i] === this.seq[i - 2]) this.seq[i] = (this.seq[i] + 1) % 4;
    this.round = 1;
    this.input_ = [];
    this.listening = false;
    S.ui?.setMode('lanes');
    fx.barsOut(this);
    this.draw();
    this.onPress = (btn) => {
      const lane = LANE_DIRS.indexOf(btn);
      if (lane >= 0 && this.listening) this.play(lane);
    };
    controls.on('press', this.onPress);
    this.events.once('shutdown', () => controls.off('press', this.onPress));
    this.intro();
  }

  draw() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x2a2e40, 0x2a2e40, 0x454a60, 0x454a60, 1);
    g.fillRect(0, 0, 480, 270);
    this.eco = this.add.sprite(240, 110, 'ch_eco', 0).setOrigin(0.5, 1).setScale(3).setAlpha(0.8);
    this.tweens.add({ targets: this.eco, y: 104, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.status = txt(this, 240, 128, '', { origin: 0.5, color: '#fff1d0' });
    this.dots = txt(this, 240, 146, '', { origin: 0.5, color: '#ffd166' });
    this.keys = LANE_X.map((x, i) => {
      const k = this.add.rectangle(x, 170, 104, 88, 0x6b7089).setOrigin(0.5, 0).setStrokeStyle(2, 0x2a2e40);
      const glow = this.add.rectangle(x, 170, 104, 88, LANE_COLORS[i], 0).setOrigin(0.5, 0);
      const lbl = this.add.image(x, 214, 'arrowIcon').setAngle(ROT[LANE_DIRS[i]]).setScale(2);
      return { k, glow, lbl };
    });
  }

  async intro() {
    const c = this.add.container(0, 0).setDepth(100);
    c.add(panel(this, 70, 30, 340, 80, 'panelGold'));
    c.add(txt(this, 240, 48, 'El piano mudo', { size: 16, color: '#ffd166', origin: 0.5 }));
    c.add(txt(this, 240, 80, 'Escucha la melodía del eco y repítela.', { origin: 0.5, wrap: 310, align: 'center' }));
    await fx.wait(this, 2200);
    this.tweens.add({ targets: c, alpha: 0, duration: 300, onComplete: () => c.destroy() });
    this.playRound();
  }

  light(lane, ms = 350) {
    const k = this.keys[lane];
    k.glow.setFillStyle(LANE_COLORS[lane], 0.85);
    k.k.setFillStyle(0xfff1d0);
    this.time.delayedCall(ms, () => {
      k.glow.setFillStyle(LANE_COLORS[lane], 0);
      k.k.setFillStyle(0x6b7089);
    });
  }

  async playRound() {
    this.listening = false;
    this.input_ = [];
    this.status.setText('Escucha...');
    this.dots.setText('');
    await fx.wait(this, 700);
    for (let i = 0; i < this.round; i++) {
      const lane = this.seq[i];
      this.light(lane, 380);
      audio.note('piano', NOTES[lane], 0.5, 0.9);
      audio.note('bell', NOTES[lane] + 12, 0.3, 0.3);
      this.eco.setFrame([4, 0, 12, 8][lane]);
      await fx.wait(this, 560);
    }
    this.eco.setFrame(0);
    this.status.setText('¡Tu turno!');
    this.listening = true;
  }

  async play(lane) {
    this.light(lane, 200);
    audio.note('piano', NOTES[lane], 0.5, 0.95);
    this.input_.push(lane);
    const i = this.input_.length - 1;
    this.dots.setText(`${this.input_.length} / ${this.round}`);
    if (this.seq[i] !== lane) {
      this.listening = false;
      audio.sfx('error');
      this.cameras.main.shake(150, 0.004);
      this.status.setText('¡Uy! Otra vez, escucha bien.');
      await fx.wait(this, 1100);
      this.playRound();
      return;
    }
    if (this.input_.length === this.round) {
      this.listening = false;
      audio.sfx('success');
      fx.notesBurst(this, 240, 150, 8);
      if (this.round >= this.length) {
        this.win();
        return;
      }
      this.status.setText('¡Bien!');
      this.round++;
      await fx.wait(this, 800);
      this.playRound();
    }
  }

  async win() {
    this.status.setText('¡El piano volvió a sonar!');
    // La melodía completa, rapidito
    for (const lane of [...this.seq, 3]) {
      this.light(lane, 150);
      audio.note('piano', NOTES[lane], 0.3, 0.9);
      await fx.wait(this, 160);
    }
    this.tweens.killTweensOf(this.eco);
    this.tweens.add({ targets: this.eco, alpha: 0, scaleY: 4, duration: 700 });
    fx.notesBurst(this, 240, 80, 24);
    audio.sfx('fanfare');
    await fx.wait(this, 1800);
    this.onDone?.({ win: true });
  }
}
