import Phaser from 'phaser';
import { S } from '../core/services.js';
import { controls } from '../core/input.js';
import { audio } from '../core/audio.js';
import { txt, panel } from '../core/text.js';
import { CHARS } from '../gfx/characters.js';

// Caja de diálogo global: retrato, nombre, texto letra por letra y opciones.
const BOX_Y = 190;
const BOX_H = 74;

export class DialogScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Dialog' });
  }

  create() {
    S.dialog = this;
    this.cur = null;
    this.tap = false;

    this.root = this.add.container(0, 0).setVisible(false);
    this.box = panel(this, 6, BOX_Y, 468, BOX_H, 'panel');
    this.ptFrame = panel(this, 12, BOX_Y + 5, 64, 64, 'panelDark');
    this.portrait = this.add.image(44, BOX_Y + 37, 'pt_ray_normal');
    this.nameBox = panel(this, 84, BOX_Y - 12, 100, 18, 'panelGold');
    this.nameText = txt(this, 92, BOX_Y - 7, '', { color: '#ffd166' });
    this.text = txt(this, 86, BOX_Y + 11, '', { lineSpacing: 6 });
    this.arrow = this.add.image(460, BOX_Y + BOX_H - 9, 'arrowDown');
    this.tweens.add({ targets: this.arrow, y: '+=3', duration: 350, yoyo: true, repeat: -1 });
    this.root.add([this.box, this.ptFrame, this.portrait, this.nameBox, this.nameText, this.text, this.arrow]);

    // Opciones
    this.choiceBox = this.add.container(0, 0).setVisible(false);

    this.input.on('pointerdown', (p) => {
      if (p.__onControl) return;
      if (!this.cur) return;
      if (this.cur.choices) {
        const idx = this.choiceHit(p);
        if (idx >= 0) {
          this.choiceIdx = idx;
          this.tap = true;
        }
        return;
      }
      this.tap = true;
    });
  }

  get active() {
    return !!this.cur;
  }

  // who: id de personaje (o null para narración). expr: normal/happy/surprised/sad/crack
  say(who, text, expr = 'normal', opts = {}) {
    return new Promise((resolve) => {
      this.show({ who, text, expr, resolve, ...opts });
    });
  }

  choice(who, text, choices, expr = 'normal') {
    return new Promise((resolve) => {
      this.show({ who, text, expr, choices, resolve });
    });
  }

  show(cur) {
    // Si ya hay un diálogo abierto, este espera su turno
    if (this.cur) {
      this.queue = this.queue || [];
      this.queue.push(cur);
      return;
    }
    this.cur = cur;
    const { who, expr } = cur;
    const ch = who ? CHARS[who] : null;
    const name = cur.name ?? (ch ? ch.name : who === 'hachi' ? 'Hachi' : who === 'micha' ? 'Micha' : who === 'shiro' ? 'Shiro' : '');
    const ptKey = who ? `pt_${who}_${expr}` : null;
    const hasPt = ptKey && this.textures.exists(ptKey);
    const altKey = who ? `pt_${who}_normal` : null;
    const usePt = hasPt ? ptKey : altKey && this.textures.exists(altKey) ? altKey : null;

    this.portrait.setVisible(!!usePt);
    this.ptFrame.setVisible(!!usePt);
    if (usePt) this.portrait.setTexture(usePt);
    const textX = usePt ? 86 : 20;
    const wrap = usePt ? 372 : 438;
    this.text.setPosition(textX, BOX_Y + 11);
    this.text.setWordWrapWidth(wrap, true);
    this.nameBox.setVisible(!!name);
    this.nameText.setVisible(!!name);
    if (name) {
      this.nameText.setText(name);
      this.nameText.setX(usePt ? 92 : 22);
      this.nameBox.setX(usePt ? 84 : 14);
      this.nameBox.setSize(this.nameText.width + 16, 18);
    }
    this.text.setColor(who ? '#fff8ec' : '#e8dcff');
    this.lines = this.text.getWrappedText(cur.text);
    this.full = this.lines.join('\n');
    this.shown = 0;
    this.typing = true;
    this.text.setText('');
    this.arrow.setVisible(false);
    this.voice = ch ? ch.voice : who === 'hachi' ? 900 : 560;
    this.speed = cur.speed || 26;
    this.acc = 0;
    this.root.setVisible(true);
    this.choiceBox.setVisible(false);
    this.tap = false;
    controls.consume('a');
  }

  showChoices() {
    const cs = this.cur.choices;
    this.choiceBox.removeAll(true);
    const w = Math.max(...cs.map((c) => c.length)) * 8 + 34;
    const h = cs.length * 16 + 12;
    const x = 474 - w;
    const y = BOX_Y - h - 4;
    this.choiceRect = { x, y, w, h };
    this.choiceBox.add(panel(this, x, y, w, h, 'panelGold'));
    this.choiceItems = cs.map((c, i) => {
      const t = txt(this, x + 22, y + 9 + i * 16, c);
      this.choiceBox.add(t);
      return t;
    });
    this.cursor = this.add.image(x + 12, y + 13, 'cursor');
    this.choiceBox.add(this.cursor);
    this.choiceIdx = 0;
    this.choiceBox.setVisible(true);
    this.updateCursor();
  }

  choiceHit(p) {
    const r = this.choiceRect;
    if (!r || p.x < r.x || p.x > r.x + r.w || p.y < r.y || p.y > r.y + r.h) return -1;
    return Math.max(0, Math.min(this.cur.choices.length - 1, Math.floor((p.y - r.y - 6) / 16)));
  }

  updateCursor() {
    this.cursor.y = this.choiceRect.y + 13 + this.choiceIdx * 16;
    this.choiceItems.forEach((t, i) => t.setColor(i === this.choiceIdx ? '#ffd166' : '#fff8ec'));
  }

  close(result) {
    const cur = this.cur;
    this.cur = null;
    this.root.setVisible(false);
    this.choiceBox.setVisible(false);
    cur.resolve(result);
    const next = this.queue?.shift();
    if (next) this.show(next);
  }

  update(time, delta) {
    if (!this.cur) return;
    const adv = controls.consume('a') || this.tap;
    this.tap = false;
    if (this.typing) {
      this.acc += delta;
      let changed = false;
      while (this.acc >= this.speed && this.shown < this.full.length) {
        this.acc -= this.speed;
        const ch = this.full[this.shown];
        this.shown++;
        changed = true;
        if (ch !== ' ' && ch !== '\n' && this.shown % 2 === 0) {
          audio.sfx('blip', { freq: this.voice * (0.94 + Math.random() * 0.12) });
        }
        if ('.!?,'.includes(ch)) this.acc -= this.speed * (ch === ',' ? 3 : 6);
      }
      if (adv) {
        this.shown = this.full.length;
        changed = true;
      }
      if (changed) this.text.setText(this.full.slice(0, this.shown));
      if (this.shown >= this.full.length) {
        this.typing = false;
        if (this.cur.choices) this.showChoices();
        else this.arrow.setVisible(true);
      }
      return;
    }
    if (this.cur.choices) {
      if (controls.consume('up')) {
        this.choiceIdx = (this.choiceIdx + this.cur.choices.length - 1) % this.cur.choices.length;
        audio.sfx('cursor');
        this.updateCursor();
      }
      if (controls.consume('down')) {
        this.choiceIdx = (this.choiceIdx + 1) % this.cur.choices.length;
        audio.sfx('cursor');
        this.updateCursor();
      }
      if (adv) {
        audio.sfx('select');
        this.close(this.choiceIdx);
      }
      return;
    }
    if (adv || (this.cur.auto && (this.autoT = (this.autoT || 0) + delta) > this.cur.auto)) {
      this.autoT = 0;
      this.close();
    }
  }
}
