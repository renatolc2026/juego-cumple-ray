import Phaser from 'phaser';
import { S } from '../core/services.js';
import { audio } from '../core/audio.js';
import { controls } from '../core/input.js';
import { txt, panel } from '../core/text.js';
import * as fx from '../core/fx.js';
import { PIANO_SONG, pianoMel, mel } from '../core/songs.js';
import { RhythmTrack, chartFromMelody, LANE_X, LANE_COLORS, LANE_DIRS } from '../core/rhythm.js';

// Minijuego de piano de la iglesia: notas que caen sobre cuatro teclas.
const HIT_Y = 214;
const ROT = { left: 0, down: -90, up: 90, right: 180 };
const PASS = 0.55;

export class PianoScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Piano' });
  }

  create(data) {
    this.onDone = data.onDone;
    this.attempt = 1;
    S.ui?.setMode('lanes');
    fx.barsOut(this);
    this.drawBackground();
    this.drawKeys();
    this.hud = txt(this, 8, 6, '', { color: '#ffd166' });
    this.progress = this.add.rectangle(0, 0, 0, 3, 0xffd166).setOrigin(0);
    this.intro();
  }

  drawBackground() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x1a1030, 0x1a1030, 0x3a1f48, 0x3a1f48, 1);
    g.fillRect(0, 0, 480, 270);
    // Vitrales que se iluminan con cada acierto
    this.windows = [];
    const cols = [0x3fb5e8, 0xffd166, 0xe8505b, 0x6cc251, 0xa77be0];
    for (let i = 0; i < 5; i++) {
      const x = 48 + i * 96;
      const w = this.add.container(x, 70);
      const frame = this.add.rectangle(0, 0, 34, 70, 0x6b5a3a);
      const arch = this.add.circle(0, -35, 17, 0x6b5a3a);
      const glass = this.add.rectangle(0, 2, 26, 62, cols[i], 0.35);
      const glassTop = this.add.circle(0, -33, 13, cols[(i + 2) % 5], 0.35);
      w.add([frame, arch, glass, glassTop]);
      this.windows.push({ glass, glassTop });
    }
    // Velas
    for (const x of [24, 456]) {
      this.add.sprite(x, 190, 'obj_candle', 0).setScale(2).play('obj_candle_anim');
    }
    // Carriles
    LANE_X.forEach((x, i) => {
      this.add.rectangle(x, 0, 90, HIT_Y, LANE_COLORS[i], 0.06).setOrigin(0.5, 0);
    });
    this.add.rectangle(240, HIT_Y, 480, 2, 0xfff1d0, 0.7);
    // Coro mirando
    this.choir = ['juanmi', 'anita', 'mariana', 'nicol', 'angela', 'mimi'].map((id, i) => {
      const x = i < 3 ? 16 + i * 14 : 436 + (i - 3) * 14;
      return this.add.sprite(x, 204, `ch_${id}`, 0).setOrigin(0.5, 1);
    });
  }

  drawKeys() {
    this.keys = LANE_X.map((x, i) => {
      const k = this.add.rectangle(x, HIT_Y + 4, 110, 50, 0xfff8ec).setOrigin(0.5, 0).setStrokeStyle(2, 0x2a1e2e);
      const lbl = this.add.image(x, HIT_Y + 30, 'arrowIcon').setAngle(ROT[LANE_DIRS[i]]).setScale(2).setTint(0x43281d);
      const glow = this.add.rectangle(x, HIT_Y, 100, 8, LANE_COLORS[i], 0).setBlendMode(Phaser.BlendModes.ADD);
      return { k, lbl, glow };
    });
    this.add.rectangle(240, HIT_Y + 2, 480, 4, 0x2a1e2e);
  }

  async intro() {
    const c = this.add.container(0, 0).setDepth(100);
    c.add(panel(this, 60, 70, 360, 110, 'panelGold'));
    c.add(txt(this, 240, 88, 'La melodía del coro', { size: 16, color: '#ffd166', origin: 0.5 }));
    const how = controls.isTouch ? 'Toca la tecla cuando la nota llegue a la línea.' : 'Presiona las flechas cuando la nota llegue a la línea.';
    c.add(txt(this, 240, 118, how, { origin: 0.5, wrap: 330, align: 'center' }));
    c.add(txt(this, 240, 150, `Intento ${this.attempt} de 3`, { origin: 0.5, color: '#b9a8d6' }));
    await fx.wait(this, 2600);
    this.tweens.add({ targets: c, alpha: 0, duration: 300, onComplete: () => c.destroy() });
    this.startRound();
  }

  startRound() {
    const song = PIANO_SONG;
    const inst = audio.playSong(song, { loop: false, restart: true, fadeIn: 0.05, level: this.attempt >= 2 ? 2 : 1 });
    audio.setClarity(1, 0.2);
    const spStep = 60 / song.bpm / song.stepsPerBeat;
    this.spStep = spStep;
    const events = mel(pianoMel);
    const notes = chartFromMelody(events, { startTime: inst.startTime, spStep, offsetSteps: 16 });
    this.track = new RhythmTrack(this, {
      notes,
      hitY: HIT_Y,
      spawnY: -20,
      travel: 1.9,
      makeNote: (n) => this.makeNote(n),
      onJudge: (n, j, off, lane) => this.judge(n, j, lane),
    });
    this.running = true;
    this.endAt = notes[notes.length - 1].time + 1.6;
    // Cuenta regresiva en el compás de entrada
    ['3', '2', '1', '¡Ya!'].forEach((s, i) => {
      this.time.delayedCall(Math.max(0, (inst.startTime - audio.now()) * 1000) + i * 4 * spStep * 1000, () => {
        fx.floatText(this, 240, 120, s, '#fff1d0', 16);
      });
    });
  }

  makeNote(n) {
    const len = Math.max(14, Math.min(40, n.len * 60));
    const c = this.add.container(LANE_X[n.lane], -20);
    const glow = this.add.rectangle(0, 0, 70, len + 6, LANE_COLORS[n.lane], 0.3).setOrigin(0.5, 1);
    const body = this.add.rectangle(0, 0, 60, len, LANE_COLORS[n.lane]).setOrigin(0.5, 1).setStrokeStyle(2, 0xfff8ec);
    const icon = this.add.image(0, -len / 2, 'noteS').setTint(0x2a1e2e);
    c.add([glow, body, icon]);
    return c;
  }

  judge(n, j, lane) {
    const key = this.keys[lane];
    if (j === 'empty') {
      this.pressKey(key);
      return;
    }
    if (j === 'miss') {
      audio.sfx('miss');
      fx.floatText(this, LANE_X[lane], HIT_Y - 20, 'Fallo', '#ff8a8a');
      return;
    }
    this.pressKey(key, true);
    audio.note('piano', n.midi, Math.max(0.3, n.len), 0.95, true);
    audio.note('bell', n.midi + 12, 0.3, 0.25, true);
    const label = { perfect: '¡Perfecto!', good: '¡Bien!', ok: 'Casi' }[j];
    const color = { perfect: '#ffd166', good: '#7ff0a8', ok: '#8fd3ff' }[j];
    fx.floatText(this, LANE_X[lane], HIT_Y - 22, label, color);
    fx.notesBurst(this, LANE_X[lane], HIT_Y - 6, j === 'perfect' ? 5 : 3);
    const w = this.windows[(n.i + lane) % this.windows.length];
    w.glass.setFillStyle(w.glass.fillColor, 0.95);
    w.glassTop.setFillStyle(w.glassTop.fillColor, 0.95);
    this.tweens.add({ targets: [w.glass, w.glassTop], fillAlpha: 0.35, duration: 700 });
    const ch = this.choir[Math.floor(Math.random() * this.choir.length)];
    this.tweens.add({ targets: ch, y: 200, duration: 90, yoyo: true });
  }

  pressKey(key, hit = false) {
    key.k.setFillStyle(hit ? 0xffe9a0 : 0xd8d0c2);
    key.glow.setFillStyle(key.glow.fillColor, hit ? 0.9 : 0.3);
    this.time.delayedCall(110, () => {
      key.k.setFillStyle(0xfff8ec);
      key.glow.setFillStyle(key.glow.fillColor, 0);
    });
  }

  update() {
    if (!this.running) return;
    this.track.update();
    const t = this.track;
    const judged = t.notes.filter((n) => n.judged).length;
    this.hud.setText(`Notas: ${t.hits}/${t.total}   Intento ${this.attempt}/3`);
    this.progress.width = (judged / t.total) * 480;
    if (audio.now() > this.endAt && t.done) {
      this.running = false;
      this.finish();
    }
  }

  async finish() {
    const t = this.track;
    const ratio = t.hits / t.total;
    audio.stopSong(1.2);
    if (ratio >= PASS || this.attempt >= 3) {
      const helped = ratio < PASS;
      const msg = helped ? '¡El coro se une a ti y la melodía despierta!' : ratio > 0.9 ? '¡Precioso! La iglesia entera se llenó de música.' : '¡Lo lograste! La música despertó.';
      audio.sfx('fanfare');
      fx.confetti(this, 2000, 200);
      this.choir.forEach((c) => c.setFrame(16));
      const c = this.add.container(0, 0).setDepth(100);
      c.add(panel(this, 70, 90, 340, 80, 'panelGold'));
      c.add(txt(this, 240, 112, msg, { origin: 0.5, wrap: 310, align: 'center', color: '#ffd166' }));
      c.add(txt(this, 240, 146, `Notas acertadas: ${t.hits} de ${t.total}`, { origin: 0.5 }));
      await fx.wait(this, 3000);
      this.onDone?.({ win: true, ratio });
      return;
    }
    audio.sfx('cancel');
    const c = this.add.container(0, 0).setDepth(100);
    c.add(panel(this, 90, 96, 300, 64, 'panel'));
    c.add(txt(this, 240, 116, '¡Casi! Vamos otra vez.', { origin: 0.5, color: '#ffd166' }));
    c.add(txt(this, 240, 138, `Acertaste ${t.hits} de ${t.total}`, { origin: 0.5 }));
    await fx.wait(this, 2200);
    c.destroy();
    t.destroy();
    this.attempt++;
    this.intro();
  }
}
