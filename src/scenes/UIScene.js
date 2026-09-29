import Phaser from 'phaser';
import { S } from '../core/services.js';
import { controls } from '../core/input.js';
import { txt } from '../core/text.js';

// Controles táctiles superpuestos: cruceta, botón A, botón B y menú.
// En modo "lanes" la pantalla se divide en 4 columnas (← ↓ ↑ →) para los minijuegos de ritmo.
// En modo "tap" cualquier toque es el botón A.
const DPAD = { x: 54, y: 214, r: 44 };
const BTN_A = { x: 448, y: 206, r: 20 };
const BTN_B = { x: 408, y: 236, r: 17 };
const BTN_M = { x: 460, y: 18, r: 14 };
const LANE_DIRS = ['left', 'down', 'up', 'right'];

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UI' });
  }

  create() {
    S.ui = this;
    this.pointers = new Map(); // pointer.id -> botón presionado
    this.root = this.add.container(0, 0).setVisible(false);
    this.dpad = this.add.image(DPAD.x, DPAD.y, 'dpad');
    this.btnA = this.add.image(BTN_A.x, BTN_A.y, 'btnCircle').setScale(1.25);
    this.btnB = this.add.image(BTN_B.x, BTN_B.y, 'btnCircle');
    this.btnM = this.add.image(BTN_M.x, BTN_M.y, 'btnSmall').setScale(1.4);
    this.lblA = txt(this, BTN_A.x + 1, BTN_A.y + 1, 'A', { origin: 0.5, color: '#fff1d0' });
    this.lblB = txt(this, BTN_B.x + 1, BTN_B.y + 1, 'B', { origin: 0.5, color: '#fff1d0' });
    this.lblM = this.add.image(BTN_M.x + 1, BTN_M.y + 1, 'iconMenu');
    this.root.add([this.dpad, this.btnA, this.btnB, this.btnM, this.lblA, this.lblB, this.lblM]);

    this.lanes = this.add.container(0, 0).setVisible(false);
    this.laneRects = LANE_DIRS.map((d, i) => {
      const r = this.add.rectangle(i * 120 + 60, 240, 116, 56, 0xfff1d0, 0.08).setStrokeStyle(1, 0xfff1d0, 0.35);
      const rot = { left: 0, down: -90, up: 90, right: 180 };
      const t = this.add.image(i * 120 + 60, 240, 'arrowIcon').setAngle(rot[d]).setScale(2).setAlpha(0.6);
      this.lanes.add([r, t]);
      return r;
    });

    this.input.on('pointerdown', (p) => this.onDown(p));
    this.input.on('pointermove', (p) => this.onMove(p));
    this.input.on('pointerup', (p) => this.onUp(p));
    this.input.on('pointerupoutside', (p) => this.onUp(p));
    this.input.addPointer(3);

    controls.on('touchdetected', () => this.refresh());
    this.refresh();
  }

  setMode(mode) {
    controls.mode = mode;
    this.releaseAllPointers();
    this.refresh();
  }

  refresh() {
    const touch = controls.isTouch;
    const mode = controls.mode;
    this.root.setVisible(touch && (mode === 'world' || mode === 'menuOnly'));
    const world = mode === 'world';
    this.dpad.setVisible(world);
    this.btnA.setVisible(world);
    this.btnB.setVisible(world);
    this.lblA.setVisible(world);
    this.lblB.setVisible(world);
    this.lanes.setVisible(touch && mode === 'lanes');
  }

  releaseAllPointers() {
    for (const [, btn] of this.pointers) if (btn) controls.release(btn, 'touch');
    this.pointers.clear();
  }

  hit(p, b) {
    return Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y) <= b.r + 6;
  }

  dpadDir(p) {
    const dx = p.x - DPAD.x;
    const dy = p.y - DPAD.y;
    if (Math.hypot(dx, dy) > DPAD.r + 26) return null;
    if (Math.hypot(dx, dy) < 5) return null;
    return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
  }

  target(p) {
    const mode = controls.mode;
    if (mode === 'hidden') return null;
    // Con un diálogo abierto, cualquier toque avanza el texto (menos el botón de menú en el mundo)
    if (S.dialog?.active) return null;
    if (this.hit(p, BTN_M) && mode !== 'lanes' && mode !== 'tap') return 'menu';
    if (mode === 'lanes') {
      if (p.y < 40) return null;
      return LANE_DIRS[Math.max(0, Math.min(3, Math.floor(p.x / 120)))];
    }
    if (mode === 'tap') return p.y < 40 ? null : 'a';
    if (mode !== 'world') return null;
    if (this.hit(p, BTN_A)) return 'a';
    if (this.hit(p, BTN_B)) return 'b';
    const d = this.dpadDir(p);
    if (d) return d;
    return null;
  }

  onDown(p) {
    if (!controls.isTouch && p.wasTouch) {
      controls.isTouch = true;
      this.refresh();
    }
    if (!controls.isTouch) return;
    const btn = this.target(p);
    if (btn) {
      p.__onControl = true;
      this.pointers.set(p.id, btn);
      controls.press(btn, 'touch');
      this.visual();
    } else {
      p.__onControl = false;
    }
  }

  onMove(p) {
    if (!p.isDown || !this.pointers.has(p.id)) return;
    const cur = this.pointers.get(p.id);
    if (!['up', 'down', 'left', 'right'].includes(cur) || controls.mode !== 'world') return;
    const d = this.dpadDir(p) || cur;
    if (d !== cur) {
      controls.release(cur, 'touch');
      controls.press(d, 'touch');
      this.pointers.set(p.id, d);
      this.visual();
    }
  }

  onUp(p) {
    const btn = this.pointers.get(p.id);
    if (btn) {
      controls.release(btn, 'touch');
      this.pointers.delete(p.id);
      this.visual();
    }
  }

  update() {
    // Ocultar los controles mientras hay un diálogo abierto
    const dlg = !!S.dialog?.active;
    if (dlg !== this.dlgShown) {
      this.dlgShown = dlg;
      this.tweens.add({ targets: [this.dpad, this.btnA, this.btnB, this.lblA, this.lblB, this.lanes], alpha: dlg ? 0 : 1, duration: 150 });
    }
  }

  visual() {
    const held = new Set(this.pointers.values());
    const d = ['up', 'down', 'left', 'right'].find((x) => held.has(x));
    this.dpad.setTexture(d ? `dpad_${d}` : 'dpad');
    this.btnA.setTexture(held.has('a') ? 'btnCircleOn' : 'btnCircle');
    this.btnB.setTexture(held.has('b') ? 'btnCircleOn' : 'btnCircle');
    LANE_DIRS.forEach((dir, i) => this.laneRects[i].setFillStyle(0xfff1d0, held.has(dir) ? 0.3 : 0.08));
  }
}
