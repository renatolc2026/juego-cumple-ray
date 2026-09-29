import Phaser from 'phaser';
import { S } from '../core/services.js';
import { audio } from '../core/audio.js';
import { controls } from '../core/input.js';
import { state } from '../core/state.js';
import { txt, panel } from '../core/text.js';
import * as fx from '../core/fx.js';
import { BATTLE, SALSA, battleMel, mel } from '../core/songs.js';
import { RhythmTrack, chartFromMelody, LANE_X, LANE_COLORS, LANE_DIRS } from '../core/rhythm.js';
import { buildArrowTexture } from './SalsaScene.js';

const ARROW_ROT = { left: 0, down: -90, up: 90, right: 180 };
const BOSS_X = 240;
const BOSS_Y = 128;

// Batalla final contra el Maestro del Silencio: piano, salsa y la pelota de Hachi.
export class FinalBattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FinalBattle' });
  }

  create(data) {
    this.onDone = data.onDone;
    this.startPhase = data.phase || 1;
    this.hp = 300;
    this.animo = 100;
    this.phase = 0;
    this.lowWarned = false;
    this.hachiHelped = false;
    buildArrowTexture(this);
    S.ui?.setMode('lanes');
    this.grade = fx.colorGrade(this.cameras.main);
    this.grade?.set(0.3, 1);
    this.drawArena();
    this.drawHud();
    this.onMenu = (btn) => {
      if (btn === 'menu') this.useItem();
    };
    controls.on('press', this.onMenu);
    this.events.once('shutdown', () => controls.off('press', this.onMenu));
    fx.barsOut(this);
    this.run();
  }

  // ------------------------------------------------------------------ Escenario
  drawArena() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x10142a, 0x10142a, 0x3a3f5a, 0x3a3f5a, 1);
    g.fillRect(0, 0, 480, 270);
    // Estrellas y nubes grises
    for (let i = 0; i < 40; i++) this.add.image(Phaser.Math.Between(0, 480), Phaser.Math.Between(0, 140), 'star').setAlpha(Phaser.Math.FloatBetween(0.2, 0.7));
    this.clouds = [];
    for (let i = 0; i < 6; i++) {
      const c = this.add.ellipse(Phaser.Math.Between(0, 480), Phaser.Math.Between(20, 140), Phaser.Math.Between(90, 160), Phaser.Math.Between(20, 34), 0x6b7089, 0.35);
      c.speed = Phaser.Math.FloatBetween(0.05, 0.2);
      this.clouds.push(c);
    }
    // Siluetas de Lima
    const sky = this.add.graphics();
    sky.fillStyle(0x1a1c2c);
    let x = 0;
    while (x < 480) {
      const w = Phaser.Math.Between(20, 44);
      const h = Phaser.Math.Between(30, 80);
      sky.fillRect(x, 270 - h, w, h);
      x += w + 2;
    }
    // Aura oscura del Maestro
    this.aura = this.add.particles(BOSS_X, BOSS_Y - 20, 'px', {
      speed: { min: 10, max: 40 },
      lifespan: 1200,
      scale: { start: 2, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: [0x3d2e63, 0x7b4fa8, 0x1b1226],
      frequency: 60,
    });
    this.boss = this.add.sprite(BOSS_X, BOSS_Y, 'ch_maestro', 0).setOrigin(0.5, 1).setScale(3);
    this.tweens.add({ targets: this.boss, y: BOSS_Y - 6, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    // Ray y Hachi aparecen en la fase de la pelota
    this.ray = this.add.sprite(200, 268, 'ch_ray', 12).setOrigin(0.5, 1).setScale(2).setVisible(false);
    this.hachi = this.add.sprite(240, 268, 'ch_hachi', 12).setOrigin(0.5, 1).setScale(2).setVisible(false);
  }

  drawHud() {
    // Vida del jefe
    this.add.rectangle(140, 12, 200, 8, 0x120c1f).setOrigin(0, 0.5).setStrokeStyle(1, 0xfff1d0);
    this.hpBar = this.add.rectangle(141, 12, 198, 6, 0xa77be0).setOrigin(0, 0.5);
    for (const k of [1, 2]) this.add.rectangle(140 + (200 * k) / 3, 12, 1, 8, 0xfff1d0);
    txt(this, 240, 24, 'Maestro del Silencio', { origin: [0.5, 0], color: '#d8c8ff' });
    // Ánimo de Ray
    this.add.rectangle(372, 4, 104, 34, 0x1d1533, 0.9).setOrigin(0).setStrokeStyle(1, 0xffd166);
    this.rayFace = this.add.image(390, 21, 'pt_ray_normal').setScale(0.42);
    txt(this, 408, 9, 'ÁNIMO', { color: '#ffd166' });
    this.add.rectangle(408, 26, 62, 8, 0x120c1f).setOrigin(0, 0.5).setStrokeStyle(1, 0xfff1d0);
    this.animoBar = this.add.rectangle(409, 26, 60, 6, 0x6cc251).setOrigin(0, 0.5);
    // Objetos (se pueden tocar)
    this.itemBtns = [];
    const mk = (x, key, icon) => {
      const bg = this.add.rectangle(x, 4, 44, 26, 0x1d1533, 0.9).setOrigin(0).setStrokeStyle(1, 0xffd166).setInteractive();
      const ic = this.add.image(x + 12, 17, icon);
      const t = txt(this, x + 24, 13, '', { color: '#fff8ec' });
      bg.on('pointerdown', () => this.useItem(key));
      this.itemBtns.push({ key, bg, ic, t });
    };
    mk(4, 'tallarines', 'tallarines');
    mk(52, 'bendicion', 'bendicion');
    txt(this, 4, 33, controls.isTouch ? 'toca para usar' : 'Esc: usar', { color: '#b9a8d6' });
    this.lowTxt = txt(this, 240, 176, '', { origin: 0.5, color: '#ff8a8a', stroke: '#120c1f', strokeThickness: 4 }).setDepth(50);
    this.refreshHud();
  }

  refreshHud() {
    this.hpBar.width = Math.max(0, (this.hp / 300) * 198);
    this.animoBar.width = Math.max(0, (this.animo / 100) * 60);
    this.rayFace?.setTexture(this.animo > 60 ? 'pt_ray_happy' : this.animo > 30 ? 'pt_ray_normal' : 'pt_ray_sad');
    this.animoBar.setFillStyle(this.animo > 50 ? 0x6cc251 : this.animo > 25 ? 0xffd166 : 0xe8505b);
    for (const b of this.itemBtns) {
      const n = state.item(b.key);
      b.t.setText(`x${n}`);
      b.bg.setAlpha(n > 0 ? 1 : 0.4);
      b.ic.setAlpha(n > 0 ? 1 : 0.4);
    }
  }

  // ------------------------------------------------------------------ Flujo
  async run() {
    await fx.wait(this, 500);
    const p = this.startPhase;
    if (p <= 1) {
      await S.dialog.say('maestro', '¡Silencio absoluto! Tu música no llegará a ninguna parte.');
      await this.phasePiano();
    }
    if (p <= 2) {
      await S.dialog.say('maestro', '¿Piano? ¡Bah! A ver si bailas igual de bien.');
      await this.phaseSalsa();
    }
    await S.dialog.say('maestro', '¡Mi escudo del silencio es impenetrable!');
    await S.dialog.say('ray', '¡Hachi! ¡La pelota!', 'happy');
    this.hp = Math.min(this.hp, 100);
    await this.phaseHachi();
    await this.finale();
  }

  damage(amount, color = 0xffffff) {
    this.hp = Math.max(this.phaseFloor, this.hp - amount);
    this.boss.setTintFill(color);
    this.time.delayedCall(70, () => {
      this.boss.tintFill = false;
      this.boss.clearTint();
    });
    fx.sparkles(this, BOSS_X + Phaser.Math.Between(-16, 16), BOSS_Y - 40 + Phaser.Math.Between(-16, 16), 5);
    this.refreshHud();
    // El mundo recupera color a medida que el Maestro se debilita
    this.grade?.set(0.3 + (1 - this.hp / 300) * 0.7, Math.max(0, this.hp / 300));
  }

  silenceWave(amount) {
    this.animo = Math.max(0, this.animo - amount);
    this.refreshHud();
    const ring = this.add.circle(BOSS_X, BOSS_Y - 40, 10, 0x7b4fa8, 0).setStrokeStyle(3, 0x7b4fa8, 0.8);
    this.tweens.add({ targets: ring, radius: 150, alpha: 0, duration: 450, onComplete: () => ring.destroy() });
    this.rayFace.setTintFill(0x7b4fa8);
    this.time.delayedCall(90, () => {
      this.rayFace.tintFill = false;
      this.rayFace.clearTint();
    });
    this.cameras.main.shake(120, 0.003);
    if (this.animo <= 30 && this.animo > 0) this.warnLow();
  }

  warnLow() {
    if (state.item('tallarines') + state.item('bendicion') > 0) {
      this.lowTxt.setText(controls.isTouch ? '¡Ánimo bajo! Toca un objeto arriba' : '¡Ánimo bajo! Presiona Esc');
    } else if (!this.hachiHelped) {
      this.hachiHelped = true;
      this.animo = Math.min(100, this.animo + 35);
      audio.sfx('bark');
      fx.hearts(this, this.rayFace.x, this.rayFace.y, 8);
      fx.floatText(this, 400, 50, '¡Hachi te da ánimos! +35', '#7ff0a8');
      this.refreshHud();
      return;
    }
    if (!this.lowWarned) {
      this.lowWarned = true;
      audio.sfx('bark');
    }
    this.tweens.add({ targets: this.lowTxt, alpha: 0.3, duration: 250, yoyo: true, repeat: 3 });
  }

  useItem(key) {
    if (!key) key = state.item('tallarines') > 0 ? 'tallarines' : 'bendicion';
    if (this.animo >= 100 || !state.useItem(key)) {
      if (state.item(key) <= 0) audio.sfx('cancel');
      return;
    }
    const amount = key === 'bendicion' ? 100 : 50;
    this.animo = Math.min(100, this.animo + amount);
    this.lowTxt.setText('');
    audio.sfx('heal');
    fx.sparkles(this, this.rayFace.x, this.rayFace.y, 16);
    if (key === 'bendicion') {
      const l = this.add.image(240, 135, 'light').setBlendMode('ADD').setScale(2.5).setAlpha(0.9);
      this.tweens.add({ targets: l, alpha: 0, scale: 6, duration: 1500, onComplete: () => l.destroy() });
      fx.floatText(this, 340, 50, 'Bendición del Abuelo: ¡ánimo al máximo!', '#ffe9a0');
    } else {
      fx.floatText(this, 380, 50, '¡Tallarines de mamá! +50', '#ffd166');
    }
    this.refreshHud();
  }

  checkKO() {
    return this.animo <= 0;
  }

  async retryMessage() {
    audio.stopSong(0.5);
    this.track?.destroy();
    this.animo = 100;
    this.refreshHud();
    await S.dialog.say(null, 'Ray respira hondo. Hachi le mueve la cola. ¡Otra vez, tú puedes!');
  }

  // ------------------------------------------------------------------ Fase 1: piano
  async phasePiano() {
    this.phase = 1;
    this.phaseFloor = 200;
    await fx.cutIn(this, { portrait: 'pt_ray_normal', text: 'FASE 1: ¡PIANO!', sub: 'Toca la melodía con las flechas', color: 0x3a6fd8 });
    for (;;) {
      const inst = audio.playSong(BATTLE, { restart: true, level: 1, fadeIn: 0.05, delay: 1.9 });
      audio.setClarity(1, 0.1);
      const spStep = 60 / BATTLE.bpm / BATTLE.stepsPerBeat;
      const notes = chartFromMelody(mel(battleMel), { startTime: inst.startTime, spStep, offsetSteps: 0, minLen: 4, loops: 2, loopSteps: BATTLE.totalSteps });
      const lanes = this.drawPianoLanes();
      const per = 100 / (notes.length * 0.75);
      const ok = await this.runTrack({
        notes, hitY: 226, spawnY: 70, travel: 1.7,
        make: (n) => {
          const c = this.add.container(LANE_X[n.lane], 70);
          c.add(this.add.rectangle(0, 0, 58, 14, LANE_COLORS[n.lane]).setStrokeStyle(2, 0xfff8ec));
          c.add(this.add.image(0, 0, 'noteS').setTint(0x1b1226));
          return c;
        },
        hit: (n) => {
          audio.note('piano', n.midi, 0.4, 0.9, true);
          audio.note('strings', n.midi, 0.4, 0.5, true);
          this.damage(per, 0xffd166);
          lanes.flash(n.lane);
        },
      });
      lanes.destroy();
      if (ok) break;
      await this.retryMessage();
    }
    audio.stopSong(0.8);
    this.hp = 200;
    this.refreshHud();
  }

  drawPianoLanes() {
    const objs = [];
    LANE_X.forEach((x, i) => {
      objs.push(this.add.rectangle(x, 70, 80, 156, LANE_COLORS[i], 0.05).setOrigin(0.5, 0));
    });
    objs.push(this.add.rectangle(240, 226, 480, 2, 0xfff1d0, 0.7));
    const keys = LANE_X.map((x, i) => {
      const k = this.add.rectangle(x, 230, 100, 16, 0xfff8ec, 0.9).setOrigin(0.5, 0);
      objs.push(k);
      objs.push(this.add.image(x, 238, 'arrowIcon').setAngle([0, -90, 90, 180][i]).setTint(0x43281d));
      return k;
    });
    return {
      flash: (lane) => {
        keys[lane].setFillStyle(LANE_COLORS[lane], 1);
        this.time.delayedCall(120, () => keys[lane].setFillStyle(0xfff8ec, 0.9));
      },
      destroy: () => objs.forEach((o) => o.destroy()),
    };
  }

  // ------------------------------------------------------------------ Fase 2: salsa
  async phaseSalsa() {
    this.phase = 2;
    this.phaseFloor = 100;
    await fx.cutIn(this, { portrait: 'pt_ray_happy', text: 'FASE 2: ¡SALSA!', sub: 'Baila con las flechas', color: 0xe8505b });
    const PATS = { A: [0, 4], B: [0, 3, 6], C: [0, 2, 4, 6], D: [0, 4, 6] };
    const seq = ['-', 'A', 'A', 'B', 'A', 'B', 'A', 'D', 'A', 'B', 'A', 'B', 'D', 'C', 'A', 'C'];
    const dance = ['left', 'right', 'up', 'down', 'left', 'left', 'right', 'right', 'up', 'left', 'down', 'right'];
    for (;;) {
      const inst = audio.playSong(SALSA, { restart: true, fadeIn: 0.05 });
      const spStep = 60 / SALSA.bpm / SALSA.stepsPerBeat;
      const notes = [];
      let k = 0;
      seq.forEach((p, bar) => {
        if (p === '-') return;
        for (const s of PATS[p]) {
          const dir = dance[k++ % dance.length];
          notes.push({ time: inst.startTime + (bar * 8 + s) * spStep, lane: LANE_DIRS.indexOf(dir), dir });
        }
      });
      const receptors = LANE_DIRS.map((d, i) => this.add.image(LANE_X[i], 156, 'arrowOutline').setAngle(ARROW_ROT[d]).setTint(LANE_COLORS[i]).setAlpha(0.8));
      const per = 100 / (notes.length * 0.75);
      let spin = 0;
      const ok = await this.runTrack({
        notes, hitY: 156, spawnY: 300, travel: 1.5,
        make: (n) => this.add.image(LANE_X[n.lane], 300, 'arrowBig').setAngle(ARROW_ROT[n.dir]).setTint(LANE_COLORS[n.lane]).setDepth(5),
        hit: (n) => {
          audio.sfx('hit', { midi: [84, 88, 91, 96][n.lane] });
          this.damage(per, 0xff5fa0);
          const r = receptors[n.lane];
          r.setScale(1.3);
          this.tweens.add({ targets: r, scale: 1, duration: 140 });
          this.boss.setFrame([0, 4, 12, 8][spin++ % 4]);
        },
      });
      receptors.forEach((r) => r.destroy());
      this.boss.setFrame(0);
      if (ok) break;
      await this.retryMessage();
    }
    audio.stopSong(0.8);
    this.hp = 100;
    this.refreshHud();
  }

  // Ejecuta un carril de ritmo hasta que termine. Devuelve false si el ánimo llegó a 0.
  runTrack({ notes, hitY, spawnY, travel, make, hit }) {
    return new Promise((resolve) => {
      const track = new RhythmTrack(this, {
        notes, hitY, spawnY, travel,
        makeNote: make,
        onJudge: (n, j, off, lane) => {
          if (j === 'empty') return;
          if (j === 'miss') {
            audio.sfx('miss');
            this.silenceWave(6);
            fx.floatText(this, LANE_X[lane], hitY - 18, 'Fallo', '#ff8a8a');
            return;
          }
          hit(n);
          fx.floatText(this, LANE_X[lane], hitY - 18, { perfect: '¡Perfecto!', good: '¡Bien!', ok: 'Casi' }[j], { perfect: '#ffd166', good: '#7ff0a8', ok: '#8fd3ff' }[j]);
        },
      });
      this.track = track;
      const endAt = notes[notes.length - 1].time + 1;
      const tick = () => {
        track.update();
        if (this.checkKO()) {
          this.events.off('update', tick);
          track.destroy();
          resolve(false);
          return;
        }
        if (track.done && audio.now() > endAt) {
          this.events.off('update', tick);
          track.destroy();
          resolve(true);
        }
      };
      this.events.on('update', tick);
    });
  }

  // ------------------------------------------------------------------ Fase 3: pelota de Hachi
  async phaseHachi() {
    this.phase = 3;
    this.phaseFloor = 0;
    await fx.cutIn(this, { portrait: 'pt_hachi_happy', text: 'FASE 3: ¡LA PELOTA!', sub: 'Lanza cuando el hueco del escudo esté abajo', color: 0x6cc251 });
    S.ui?.setMode('tap');
    audio.playSong(BATTLE, { restart: true, level: 2, fadeIn: 0.05 });
    // Hachi al centro
    this.ray.setVisible(true);
    this.hachi.setVisible(true).setFrame(12);
    this.ray.setAlpha(0);
    this.hachi.setAlpha(0);
    this.tweens.add({ targets: [this.ray, this.hachi], alpha: 1, duration: 400 });
    const R = 52;
    const cy = BOSS_Y - 40;
    const segs = 12;
    const shield = this.add.graphics();
    let angle = 0;
    let speed = 1.4;
    let hits = 0;
    let cooldown = 0;
    const gapSize = (Math.PI * 2) / segs * 1.6;
    const draw = () => {
      shield.clear();
      for (let i = 0; i < segs; i++) {
        const a0 = angle + (i / segs) * Math.PI * 2;
        const a1 = a0 + (Math.PI * 2) / segs - 0.08;
        if (i === 0) continue; // hueco
        shield.lineStyle(7, hits === 2 ? 0xe8505b : 0x9aa0b4, 0.95);
        shield.beginPath();
        shield.arc(BOSS_X, cy, R, a0, a1);
        shield.strokePath();
        shield.lineStyle(2, 0xffffff, 0.6);
        shield.beginPath();
        shield.arc(BOSS_X, cy, R - 3, a0, a1);
        shield.strokePath();
      }
    };
    const marker = this.add.image(BOSS_X, cy + R + 14, 'arrowDown').setAngle(180).setScale(1.5).setTint(0x6cc251);
    const help = txt(this, 240, 212, controls.isTouch ? 'Toca la pantalla para lanzar' : 'ESPACIO o X para lanzar', { origin: 0.5, color: '#b6e36a' });
    this.tweens.add({ targets: marker, y: cy + R + 18, duration: 300, yoyo: true, repeat: -1 });
    await new Promise((resolve) => {
      let last = this.time.now;
      const tick = (time) => {
        const dt = (time - last) / 1000;
        last = time;
        angle = (angle + speed * dt) % (Math.PI * 2);
        cooldown -= dt;
        draw();
        if (this.checkKO()) {
          this.animo = 100;
          this.refreshHud();
          fx.floatText(this, 240, 200, 'Ray respira hondo... ¡otra vez!', '#ffd166');
        }
      };
      const onPress = (btn) => {
        if (!['a', 'b', 'left', 'right', 'up', 'down'].includes(btn) || cooldown > 0) return;
        cooldown = 0.55;
        // ¿El hueco está abajo (ángulo PI/2)?
        const gapCenter = angle + Math.PI / segs;
        let diff = Math.atan2(Math.sin(gapCenter - Math.PI / 2), Math.cos(gapCenter - Math.PI / 2));
        const good = Math.abs(diff) < gapSize / 2 + 0.12;
        const ball = this.add.image(this.hachi.x, this.hachi.y - 30, 'ball').setScale(2);
        audio.sfx('throw');
        audio.sfx('bark1');
        this.hachi.setFrame(16);
        this.time.delayedCall(300, () => this.hachi.setFrame(12));
        this.tweens.add({
          targets: ball,
          y: good ? cy : cy + R + 4,
          angle: 720,
          duration: 260,
          onComplete: () => {
            if (good) {
              hits++;
              audio.sfx('shatter');
              this.cameras.main.shake(200, 0.008);
              this.damage(34, 0xb6e36a);
              fx.floatText(this, 240, cy + 10, ['¡Grieta!', '¡Se rompe!', '¡ESCUDO ROTO!'][hits - 1], '#b6e36a', 16);
              speed *= 1.35;
              ball.destroy();
              if (hits >= 3) {
                this.events.off('update', tick);
                controls.off('press', onPress);
                resolve();
              }
            } else {
              audio.sfx('bump');
              this.silenceWave(10);
              fx.floatText(this, 240, cy + R + 20, '¡Rebotó!', '#ff8a8a');
              this.tweens.add({ targets: ball, y: this.hachi.y - 30, alpha: 0, duration: 300, onComplete: () => ball.destroy() });
            }
          },
        });
      };
      this.events.on('update', tick);
      controls.on('press', onPress);
      this.events.once('shutdown', () => controls.off('press', onPress));
    });
    // El escudo se hace pedazos
    shield.destroy();
    marker.destroy();
    help.destroy();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const p = this.add.rectangle(BOSS_X + Math.cos(a) * R, cy + Math.sin(a) * R, 8, 4, 0x9aa0b4).setAngle((a * 180) / Math.PI);
      this.tweens.add({ targets: p, x: p.x + Math.cos(a) * 120, y: p.y + Math.sin(a) * 120, alpha: 0, angle: p.angle + 360, duration: 700, onComplete: () => p.destroy() });
    }
    S.ui?.setMode('lanes');
  }

  // ------------------------------------------------------------------ Final
  async finale() {
    audio.stopSong(0.4);
    this.hp = 0;
    this.refreshHud();
    await fx.cutIn(this, { portrait: 'pt_ray_happy', text: '¡MELODÍA DE CUMPLEAÑOS!', sub: 'Piano + salsa + Hachi + cuatro Notas Legendarias', color: 0xffd166 });
    // Las cuatro notas giran alrededor del Maestro
    const icons = ['nota_hogar', 'nota_fe', 'nota_sabor', 'nota_amistad'].map((k) => this.add.image(this.ray.x, this.ray.y - 30, k).setScale(1.2));
    audio.sfx('note');
    await fx.wait(this, 200);
    icons.forEach((ic, i) => {
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 1600,
        onUpdate: (tw) => {
          const k = tw.getValue();
          const a = k * Math.PI * 4 + (i * Math.PI) / 2;
          const r = 90 * (1 - k) + 10;
          ic.x = Phaser.Math.Linear(this.ray.x, BOSS_X, Math.min(1, k * 2)) + Math.cos(a) * r * Math.min(1, k * 2);
          ic.y = Phaser.Math.Linear(this.ray.y - 30, BOSS_Y - 40, Math.min(1, k * 2)) + Math.sin(a) * r * 0.6 * Math.min(1, k * 2);
        },
      });
    });
    for (const [i, m] of [72, 76, 79, 84].entries()) this.time.delayedCall(i * 300, () => audio.note('bell', m, 0.5, 0.8));
    await fx.wait(this, 1700);
    icons.forEach((ic) => ic.destroy());
    audio.sfx('flash');
    this.cameras.main.flash(900, 255, 255, 255);
    this.cameras.main.shake(700, 0.012);
    this.aura.stop();
    this.grade?.to(this, 1, 1200, 0);
    fx.notesBurst(this, BOSS_X, BOSS_Y - 40, 40);
    fx.confetti(this, 1500, 200);
    this.tweens.killTweensOf(this.boss);
    this.tweens.add({ targets: this.boss, y: BOSS_Y + 10, angle: -8, duration: 800, ease: 'Quad.Out' });
    await fx.wait(this, 1800);
    this.cameras.main.fadeOut(900, 255, 255, 255);
    await fx.wait(this, 950);
    this.onDone?.({ win: true });
  }

  update() {
    for (const c of this.clouds) {
      c.x += c.speed;
      if (c.x > 560) c.x = -80;
    }
  }
}
