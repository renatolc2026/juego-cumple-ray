import Phaser from 'phaser';
import { S } from '../core/services.js';
import { audio } from '../core/audio.js';
import { controls } from '../core/input.js';
import { txt, panel } from '../core/text.js';
import * as fx from '../core/fx.js';

// Puzzle de la Cueva del Código: ordenar bloques de instrucciones para arreglar el portal.
const BLOCKS = [
  { id: 0, code: 'let musica = recuperarNotas(4);' },
  { id: 1, code: 'portal.cargar(musica);' },
  { id: 2, code: 'portal.encender();' },
  { id: 3, code: 'ray.entrar(portal);' },
];
const START = [2, 3, 1, 0];

const ERRORS = {
  // clave: id que aparece antes de tiempo
  1: 'ReferenceError: "musica" todavía no existe. ¿De dónde sale la música?',
  2: 'Error: el portal no tiene música. Se enciende y se apaga solito.',
  3: 'Error: Ray entró a un portal apagado. ¡Pum! Se chocó con la pared.',
};

const BX = 36;
const BY = 64;
const BH = 22;

export class CodeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Code' });
  }

  create(data) {
    this.onDone = data.onDone;
    this.order = [...START];
    this.cursor = 0;
    this.held = -1;
    this.tries = 0;
    this.busy = false;
    S.ui?.setMode('world');
    this.cameras.main.fadeIn(400);
    this.draw();
    this.refresh();
    this.say('ricardo', 'Estas son las instrucciones del portal, pero están en desorden. Ordénalas para que funcione.');
  }

  draw() {
    const g = this.add.graphics();
    g.fillStyle(0x07100c);
    g.fillRect(0, 0, 480, 270);
    // Lluvia de código de fondo
    this.rain = [];
    for (let i = 0; i < 26; i++) {
      const t = txt(this, i * 19, Phaser.Math.Between(-270, 270), '0\n1\n{\n}\n;\n=\n(\n)', { color: '#12402a', lineSpacing: 2 });
      t.speed = Phaser.Math.FloatBetween(0.2, 0.6);
      this.rain.push(t);
    }
    panel(this, 20, 22, 300, 150, 'panelCode');
    txt(this, 32, 32, 'portal.js', { color: '#46f08a' });
    this.add.rectangle(20, 46, 300, 1, 0x1c5a3a).setOrigin(0);
    this.lines = BLOCKS.map((_, i) => {
      const num = txt(this, BX - 4, BY + i * BH + 2, `${i + 1}`, { color: '#2a6a4a', origin: [1, 0] });
      const bg = this.add.rectangle(BX + 2, BY + i * BH - 4, 272, BH - 4, 0x10261c).setOrigin(0).setStrokeStyle(1, 0x1c5a3a);
      const t = txt(this, BX + 10, BY + i * BH + 2, '', { color: '#c8ffe0' });
      const zone = this.add.zone(BX, BY + i * BH - 4, 276, BH - 2).setOrigin(0).setInteractive();
      zone.on('pointerdown', () => this.tapLine(i));
      return { num, bg, t };
    });
    this.cursorImg = this.add.image(BX - 14, 0, 'cursor');
    // Botones
    this.btnRun = this.button(40, 178, 120, 'Ejecutar', () => this.run());
    this.btnHint = this.button(176, 178, 120, '? Pista', () => this.hint());
    this.help = txt(this, 330, 30, '', { color: '#b9d8c8', wrap: 140, lineSpacing: 5 });
    this.help.setText(controls.isTouch
      ? 'Toca una línea y luego otra para intercambiarlas.\n\nToca "Ejecutar" cuando creas que está bien.'
      : 'Arriba/abajo: elegir\nESPACIO: agarrar y soltar una línea\n\nX: pista\nEn "Ejecutar", presiona ESPACIO.');
    // Consola de salida
    this.console = txt(this, 30, 210, '> _', { color: '#46f08a', wrap: 420 });
    panel(this, 20, 200, 440, 60, 'panelCode').setDepth(-1);
    this.bug = this.add.sprite(420, 150, 'obj_bug', 0).setScale(2).play('obj_bug_anim');
    this.tweens.add({ targets: this.bug, x: 400, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  button(x, y, w, label, cb) {
    const bg = this.add.rectangle(x, y, w, 16, 0x10261c).setOrigin(0).setStrokeStyle(1, 0x46f08a).setInteractive();
    const t = txt(this, x + w / 2, y + 8, label, { origin: 0.5, color: '#46f08a' });
    bg.on('pointerdown', () => {
      if (!this.busy) cb();
    });
    return { bg, t };
  }

  say(who, text) {
    if (this.talking) return;
    this.talking = true;
    S.dialog.say(who, text).then(() => (this.talking = false));
  }

  refresh() {
    this.order.forEach((id, i) => {
      const L = this.lines[i];
      L.t.setText(BLOCKS[id].code);
      const sel = i === this.cursor;
      const held = i === this.held;
      L.bg.setFillStyle(held ? 0x2a6a4a : sel ? 0x173a28 : 0x10261c);
      L.bg.setStrokeStyle(1, held ? 0xffd166 : sel ? 0x46f08a : 0x1c5a3a);
      L.t.setColor(held ? '#ffd166' : '#c8ffe0');
    });
    const onRun = this.cursor === 4;
    const onHint = this.cursor === 5;
    this.btnRun.bg.setFillStyle(onRun ? 0x2a6a4a : 0x10261c);
    this.btnHint.bg.setFillStyle(onHint ? 0x2a6a4a : 0x10261c);
    if (this.cursor < 4) this.cursorImg.setPosition(BX - 16, BY + this.cursor * BH + 5);
    else this.cursorImg.setPosition(onRun ? 32 : 168, 186);
  }

  tapLine(i) {
    if (this.busy || this.talking) return;
    if (this.held === -1) {
      this.held = i;
      this.cursor = i;
      audio.sfx('cursor');
    } else if (this.held === i) {
      this.held = -1;
    } else {
      [this.order[this.held], this.order[i]] = [this.order[i], this.order[this.held]];
      this.held = -1;
      this.cursor = i;
      audio.sfx('select');
    }
    this.refresh();
  }

  update() {
    for (const t of this.rain) {
      t.y += t.speed;
      if (t.y > 280) t.y = -120;
    }
    if (this.busy || this.talking || S.dialog.active) return;
    if (controls.consume('up')) this.move(-1);
    if (controls.consume('down')) this.move(1);
    if (controls.consume('left') && this.cursor === 5) {
      this.cursor = 4;
      this.refresh();
    }
    if (controls.consume('right') && this.cursor === 4) {
      this.cursor = 5;
      this.refresh();
    }
    if (controls.consume('b')) this.hint();
    if (controls.consume('a')) {
      if (this.cursor === 4) this.run();
      else if (this.cursor === 5) this.hint();
      else if (this.held === -1) {
        this.held = this.cursor;
        audio.sfx('cursor');
        this.refresh();
      } else {
        this.held = -1;
        audio.sfx('select');
        this.refresh();
      }
    }
  }

  move(d) {
    const max = this.held >= 0 ? 3 : 5;
    const next = Phaser.Math.Clamp(this.cursor + d, 0, max);
    if (next === this.cursor) return;
    if (this.held >= 0) {
      // Mover la línea agarrada
      [this.order[this.held], this.order[next]] = [this.order[next], this.order[this.held]];
      this.held = next;
    }
    this.cursor = next;
    audio.sfx('cursor');
    this.refresh();
  }

  hint() {
    this.tries++;
    audio.sfx('select');
    this.say('ricardo', 'Pista: primero hay que conseguir la música, después cargarla al portal, encenderlo... y recién ahí entrar.');
  }

  async run() {
    if (this.busy) return;
    this.busy = true;
    this.held = -1;
    this.refresh();
    audio.sfx('select');
    this.console.setText('> Compilando portal.js');
    for (let i = 0; i < 3; i++) {
      await fx.wait(this, 300);
      this.console.setText(this.console.text + '.');
    }
    // Revisar el orden línea por línea
    for (let i = 0; i < 4; i++) {
      const L = this.lines[i];
      L.bg.setFillStyle(0x2a6a4a);
      await fx.wait(this, 220);
      if (this.order[i] !== i) {
        L.bg.setFillStyle(0x6a1a2a);
        audio.sfx('error');
        audio.sfx('glitch');
        this.cameras.main.shake(200, 0.004);
        this.console.setColor('#ff8a8a');
        this.console.setText(`> Línea ${i + 1}: ${ERRORS[this.order[i]] || 'Algo no cuadra en este orden.'}`);
        await fx.wait(this, 900);
        this.console.setColor('#46f08a');
        this.busy = false;
        this.refresh();
        this.tries++;
        if (this.tries === 2) this.say('bismark', 'Tranqui, causa. Si te trabas, pide una pista. Hasta los seniors lo hacen.');
        return;
      }
      L.bg.setFillStyle(0x1c7a4a);
    }
    audio.sfx('success');
    this.console.setText('> ¡Compilado con éxito! Portal en línea. 0 errores, 0 warnings.');
    this.tweens.killTweensOf(this.bug);
    this.tweens.add({ targets: this.bug, scale: 4, alpha: 0, angle: 360, duration: 700 });
    fx.sparkles(this, this.bug.x, this.bug.y, 20);
    fx.notesBurst(this, 240, 120, 16);
    this.cameras.main.flash(300, 150, 255, 190);
    await fx.wait(this, 1800);
    this.cameras.main.fadeOut(400);
    await fx.wait(this, 450);
    this.onDone?.({ win: true });
  }
}
