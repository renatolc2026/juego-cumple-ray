import Phaser from 'phaser';
import { S } from '../core/services.js';
import { audio } from '../core/audio.js';
import { controls } from '../core/input.js';
import { txt, panel } from '../core/text.js';
import * as fx from '../core/fx.js';
import { SALSA } from '../core/songs.js';
import { RhythmTrack, LANE_X, LANE_COLORS, LANE_DIRS } from '../core/rhythm.js';

// Batalla de salsa: flechas al ritmo. El medidor de "Sabor" sube con cada acierto
// y al llenarse Ray hace un paso especial con corte estilo anime.
const TARGET_Y = 40;
const ARROW_ROT = { left: 0, down: -90, up: 90, right: 180 };

// Pasos por compás (en corcheas: 8 por compás)
const PATTERNS = {
  A: [0, 4],
  B: [0, 3, 6],
  C: [0, 2, 4, 6],
  D: [0, 4, 6],
};
const DANCE = ['left', 'right', 'left', 'right', 'up', 'down', 'up', 'down', 'left', 'up', 'right', 'down', 'left', 'left', 'right', 'right'];

export function buildArrowTexture(scene) {
  if (scene.textures.exists('arrowBig')) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // Flecha apuntando a la izquierda
  const pts = [[2, 16], [16, 2], [16, 10], [30, 10], [30, 22], [16, 22], [16, 30]];
  g.fillStyle(0x1b1226);
  g.fillPoints(pts.map(([x, y]) => new Phaser.Math.Vector2(x + 1, y + 1)), true);
  g.fillStyle(0xffffff);
  g.fillPoints(pts.map(([x, y]) => new Phaser.Math.Vector2(x, y)), true);
  g.generateTexture('arrowBig', 34, 34);
  g.clear();
  g.lineStyle(3, 0xffffff);
  g.strokePoints(pts.map(([x, y]) => new Phaser.Math.Vector2(x + 1, y + 1)), true);
  g.generateTexture('arrowOutline', 34, 34);
  g.destroy();
}

export class SalsaScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Salsa' });
  }

  create(data) {
    this.onDone = data.onDone;
    this.mode = data.mode || 'battle';
    this.floor = data.floor || 1;
    this.tower = this.mode === 'tower';
    this.attempt = 1;
    S.ui?.setMode('lanes');
    buildArrowTexture(this);
    fx.barsOut(this);
    this.drawStage();
    this.intro();
  }

  drawStage() {
    const g = this.add.graphics();
    if (this.tower) {
      g.fillGradientStyle(0x2a2e40, 0x2a2e40, 0x4a4e66, 0x4a4e66, 1);
    } else {
      g.fillGradientStyle(0x2a0f3c, 0x2a0f3c, 0x5a1f5a, 0x5a1f5a, 1);
    }
    g.fillRect(0, 0, 480, 270);
    // Pista de baile
    this.tiles = [];
    const cols = [0xff5fa0, 0x6ff0ff, 0xffd166, 0xa77be0, 0x6cc251];
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 16; x++) {
        const t = this.add.rectangle(x * 30 + 15, 196 + y * 20, 29, 19, this.tower ? 0x5a6078 : 0x3a2a60);
        t.baseColor = this.tower ? 0x5a6078 : 0x3a2a60;
        t.hi = cols[(x + y) % cols.length];
        this.tiles.push(t);
      }
    }
    if (!this.tower) {
      // Bola de espejos y haces de luz
      const beams = [[80, 0xff5fa0], [400, 0x6ff0ff], [240, 0xffd166]];
      for (const [x, c] of beams) {
        const b = this.add.image(x, 0, 'obj_lightBeam').setOrigin(0.5, 0).setTint(c).setAlpha(0.45).setScale(3, 4.4).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: b, angle: { from: -30, to: 30 }, duration: 1500 + x * 3, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      }
      this.add.sprite(240, 60, 'obj_discoBall', 0).setScale(2).play('obj_discoBall_anim');
      this.add.image(240, 8, 'obj_neonSign').setOrigin(0.5, 0).setAlpha(0.35);
    }
    // Bailarines
    const rival = this.tower ? 'eco' : 'sharon';
    this.ray = this.add.sprite(170, 250, 'ch_ray', 0).setOrigin(0.5, 1).setScale(3);
    this.rival = this.add.sprite(310, 250, `ch_${rival}`, 0).setOrigin(0.5, 1).setScale(3);
    if (this.tower) this.rival.setAlpha(0.8);
    this.add.image(170, 251, 'shadow').setScale(3);
    this.add.image(310, 251, 'shadow').setScale(3);
    // Receptores de flechas
    this.receptors = LANE_DIRS.map((d, i) => {
      const r = this.add.image(LANE_X[i], TARGET_Y, 'arrowOutline').setAngle(ARROW_ROT[d]).setTint(LANE_COLORS[i]).setAlpha(0.8).setDepth(10);
      return r;
    });
    // Medidor de Sabor
    this.meter = 0;
    this.specials = 0;
    const mx = 140;
    this.add.rectangle(mx, 106, 200, 10, 0x120c1f).setOrigin(0, 0.5).setStrokeStyle(1, 0xfff1d0).setDepth(20);
    this.meterBar = this.add.rectangle(mx + 1, 106, 0, 8, 0xff5fa0).setOrigin(0, 0.5).setDepth(21);
    this.meterLbl = txt(this, mx - 6, 106, this.tower ? 'RITMO' : 'SABOR', { origin: [1, 0.5], color: '#ffd166', depth: 21 });
    this.comboTxt = txt(this, 240, 124, '', { origin: 0.5, color: '#fff1d0', depth: 21, size: 8 });
  }

  async intro() {
    const c = this.add.container(0, 0).setDepth(100);
    c.add(panel(this, 60, 80, 360, 100, 'panelGold'));
    c.add(txt(this, 240, 98, this.tower ? '¡Baile contra el eco!' : '¡Batalla de salsa!', { size: 16, color: '#ffd166', origin: 0.5 }));
    const how = controls.isTouch ? 'Toca la columna de cada flecha cuando llegue arriba.' : 'Presiona la flecha correcta cuando llegue a su silueta arriba.';
    c.add(txt(this, 240, 128, how, { origin: 0.5, wrap: 330, align: 'center' }));
    c.add(txt(this, 240, 160, this.tower ? 'Llena el medidor de ritmo.' : 'Llena el medidor de SABOR para el paso especial.', { origin: 0.5, color: '#b9a8d6', wrap: 330, align: 'center' }));
    await fx.wait(this, 2800);
    this.tweens.add({ targets: c, alpha: 0, duration: 300, onComplete: () => c.destroy() });
    this.startRound();
  }

  buildChart(inst) {
    const song = SALSA;
    const spStep = 60 / song.bpm / song.stepsPerBeat;
    const barSteps = song.stepsPerBar;
    const seq = this.tower
      ? (this.floor >= 5 ? ['-', 'A', 'A', 'B', 'A', 'B', 'D', 'A', 'B', 'A', 'B', 'C', 'A', 'B', 'D', 'A'] : ['-', 'A', 'A', 'A', 'B', 'A', 'A', 'B', 'A', 'D', 'A', 'B', 'A', 'A', 'B', 'A'])
      : ['-', '-', 'A', 'A', 'A', 'B', 'A', 'A', 'B', 'D', 'A', 'B', 'A', 'B', 'D', 'C', 'A', 'B', 'A', 'D', 'B', 'B', 'D', 'C', 'A', 'B', 'D', 'C', 'B', 'D', 'C', 'A'];
    const notes = [];
    let k = 0;
    seq.forEach((p, bar) => {
      if (p === '-') return;
      for (const s of PATTERNS[p]) {
        const dir = DANCE[k % DANCE.length];
        k++;
        notes.push({ time: inst.startTime + (bar * barSteps + s) * spStep, lane: LANE_DIRS.indexOf(dir), dir });
      }
    });
    this.beat = spStep * 2;
    this.bars = seq.length;
    return notes;
  }

  startRound() {
    this.meter = 0;
    this.updateMeter();
    const inst = audio.playSong(SALSA, { restart: true, fadeIn: 0.05 });
    audio.setClarity(1, 0.2);
    this.inst = inst;
    const notes = this.buildChart(inst);
    this.track = new RhythmTrack(this, {
      notes,
      hitY: TARGET_Y,
      spawnY: 300,
      travel: 1.7,
      makeNote: (n) => this.add.image(LANE_X[n.lane], 300, 'arrowBig').setAngle(ARROW_ROT[n.dir]).setTint(LANE_COLORS[n.lane]).setDepth(15),
      onJudge: (n, j, off, lane) => this.judge(n, j, lane),
    });
    this.endAt = notes[notes.length - 1].time + 1.2;
    this.running = true;
    this.combo = 0;
    this.beatIdx = -1;
    // Cuenta regresiva "5, 6, 7, 8" en el compás de entrada
    const spStep = 60 / SALSA.bpm / SALSA.stepsPerBeat;
    const lead = this.tower ? 0 : 8;
    ['5', '6', '7', '8'].forEach((s, i) => {
      const at = (inst.startTime + (lead + i * 2) * spStep - audio.now()) * 1000;
      this.time.delayedCall(Math.max(0, at), () => fx.floatText(this, 240, 130, s, '#fff1d0', 16));
    });
  }

  judge(n, j, lane) {
    const rec = this.receptors[lane];
    if (j === 'empty') {
      this.tweens.add({ targets: rec, scale: 0.85, duration: 60, yoyo: true });
      return;
    }
    if (j === 'miss') {
      this.combo = 0;
      this.meter = Math.max(0, this.meter - 4);
      this.updateMeter();
      fx.floatText(this, LANE_X[lane], TARGET_Y + 26, 'Fallo', '#ff8a8a');
      this.ray.setFrame(0);
      return;
    }
    this.combo++;
    this.meter = Math.min(100, this.meter + ({ perfect: 7, good: 5, ok: 3 })[j]);
    this.updateMeter();
    rec.setScale(1.3);
    this.tweens.add({ targets: rec, scale: 1, duration: 150 });
    audio.sfx('hit', { midi: [84, 88, 91, 96][lane] });
    const label = { perfect: '¡Perfecto!', good: '¡Bien!', ok: 'Casi' }[j];
    const color = { perfect: '#ffd166', good: '#7ff0a8', ok: '#8fd3ff' }[j];
    fx.floatText(this, LANE_X[lane], TARGET_Y + 26, label, color);
    if (this.combo >= 5) this.comboTxt.setText(`¡Combo x${this.combo}!`);
    // Ray baila según la flecha
    const frames = { left: 4, right: 8, up: 16, down: 0 };
    this.ray.setFrame(frames[n.dir] + (n.dir === 'up' ? 0 : 1 + (this.combo % 2) * 2));
    this.tweens.add({ targets: this.ray, y: 244, duration: 80, yoyo: true });
    if (this.meter >= 100 && !this.specialOn) this.special();
  }

  updateMeter() {
    this.meterBar.width = this.meter * 1.98;
    this.meterBar.setFillStyle(this.meter >= 100 ? 0xffd166 : 0xff5fa0);
  }

  async special() {
    this.specialOn = true;
    this.specials++;
    // Durante el corte, las flechas se aciertan solas
    const now = audio.heardTime();
    this.track.autoWindow = [now - 0.05, now + 2.2];
    fx.cutIn(this, {
      portrait: 'pt_ray_happy',
      text: this.tower ? '¡PASO DEL RITMO!' : '¡VUELTA DEL SABOR!',
      sub: this.tower ? 'El eco no puede seguirle el paso' : 'Ray gira como en la academia',
      color: this.tower ? 0x3a6fd8 : 0xe8505b,
    });
    await fx.wait(this, 1400);
    // Giro de Ray
    let k = 0;
    const spin = this.time.addEvent({ delay: 70, repeat: 11, callback: () => this.ray.setFrame([0, 4, 12, 8][k++ % 4] ) });
    fx.sparkles(this, this.ray.x, this.ray.y - 36, 20);
    fx.notesBurst(this, this.ray.x, this.ray.y - 40, 12);
    audio.sfx('success');
    await fx.wait(this, 900);
    spin.remove();
    this.ray.setFrame(16);
    this.meter = 0;
    this.updateMeter();
    this.track.autoWindow = null;
    this.specialOn = false;
  }

  update() {
    if (!this.running) return;
    this.track.update();
    // Pulso de la pista al ritmo de la música
    const bi = Math.floor((audio.heardTime() - this.inst.startTime) / this.beat);
    if (bi !== this.beatIdx && bi >= 0) {
      this.beatIdx = bi;
      this.tiles.forEach((t, i) => t.setFillStyle(((i + bi) % 3 === 0) ? t.hi : t.baseColor));
      // Rival baila
      const f = [0, 4, 16, 8][bi % 4];
      this.rival.setFrame(this.tower ? [0, 4, 0, 8][bi % 4] : f);
      if (!this.specialOn && bi % 2 === 0 && this.ray.frame.name !== 16) this.ray.setFrame(0);
    }
    if (audio.now() > this.endAt && this.track.done) {
      this.running = false;
      this.finish();
    }
  }

  async finish() {
    const t = this.track;
    const ratio = t.hits / t.total;
    const pass = ratio >= 0.5 || this.specials >= 1 || this.attempt >= 3;
    audio.stopSong(1);
    this.comboTxt.setText('');
    if (pass) {
      audio.sfx('fanfare');
      fx.confetti(this, 2000, 200);
      this.ray.setFrame(16);
      this.rival.setFrame(this.tower ? 0 : 16);
      const c = this.add.container(0, 0).setDepth(100);
      c.add(panel(this, 70, 100, 340, 70, 'panelGold'));
      const msg = this.tower ? '¡El eco se deshace en notas!' : ratio > 0.85 ? '¡Sabor de campeonato!' : '¡Con sabor, Ray!';
      c.add(txt(this, 240, 120, msg, { origin: 0.5, color: '#ffd166', size: 8 }));
      c.add(txt(this, 240, 146, `Pasos acertados: ${t.hits} de ${t.total}`, { origin: 0.5 }));
      if (this.tower) {
        this.tweens.add({ targets: this.rival, alpha: 0, scaleY: 4, duration: 800 });
        fx.notesBurst(this, this.rival.x, this.rival.y - 40, 20);
      }
      await fx.wait(this, 2800);
      this.onDone?.({ win: true, ratio });
      return;
    }
    audio.sfx('cancel');
    const c = this.add.container(0, 0).setDepth(100);
    c.add(panel(this, 90, 100, 300, 60, 'panel'));
    c.add(txt(this, 240, 120, this.tower ? '¡Otra vez! El eco se cansa pronto.' : 'Sharon: "¡Otra vez, con más sabor!"', { origin: 0.5, color: '#ffd166' }));
    c.add(txt(this, 240, 140, `Acertaste ${t.hits} de ${t.total}`, { origin: 0.5 }));
    await fx.wait(this, 2200);
    c.destroy();
    t.destroy();
    this.attempt++;
    this.intro();
  }
}
