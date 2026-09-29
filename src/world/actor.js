import { DIR } from '../gfx/characters.js';

export const DXY = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
const ANIMALS = new Set(['hachi', 'micha', 'shiro']);

export function dirFromDelta(dx, dy) {
  if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'up' : 'down';
}

// Personaje en la grilla del mapa (jugador, NPC o mascota)
export class Actor {
  constructor(scene, def) {
    this.scene = scene;
    this.id = def.id;
    this.char = def.char || def.id;
    this.def = def;
    this.dir = def.dir || 'down';
    this.moving = false;
    this.animal = ANIMALS.has(this.char);
    this.depthBias = def.depthBias || 0;
    this.shadow = scene.add.image(0, 0, 'shadow');
    this.sprite = scene.add.sprite(0, 0, `ch_${this.char}`, 0).setOrigin(0.5, 1);
    if (def.alpha != null) this.sprite.setAlpha(def.alpha);
    this.place(def.x, def.y);
    if (def.frame != null) this.sprite.setFrame(def.frame);
    else this.face(this.dir);
    if (def.hidden) this.setVisible(false);
  }

  get px() {
    return this.x * 16 + 8;
  }

  get py() {
    return this.y * 16 + 15;
  }

  place(x, y) {
    this.x = x;
    this.y = y;
    this.sprite.setPosition(this.px, this.py);
    this.sync();
  }

  sync() {
    this.shadow.setPosition(this.sprite.x, this.sprite.y - 1);
    this.sprite.setDepth(this.sprite.y + this.depthBias);
    this.shadow.setDepth(this.sprite.y - 15);
  }

  setVisible(v) {
    this.sprite.setVisible(v);
    this.shadow.setVisible(v);
    this.visible = v;
    return this;
  }

  face(dir) {
    if (!dir) return;
    this.dir = dir;
    if (!this.moving) {
      this.sprite.anims.stop();
      this.sprite.setFrame(DIR[dir] * 4);
    }
  }

  faceTo(other) {
    const o = other.x != null ? other : other;
    const d = dirFromDelta(o.x - this.x, o.y - this.y);
    this.face(d);
  }

  setFrame(f) {
    this.sprite.anims.stop();
    this.sprite.setFrame(f);
  }

  playWalk(dir) {
    const key = `${this.char}_walk_${dir}`;
    if (this.sprite.anims.currentAnim?.key !== key || !this.sprite.anims.isPlaying) this.sprite.play(key, true);
  }

  // Mueve una casilla (o a una casilla vecina) con animación
  moveTo(nx, ny, dur = 170) {
    const dir = dirFromDelta(nx - this.x, ny - this.y);
    this.dir = dir;
    this.moving = true;
    this.playWalk(dir);
    this.x = nx;
    this.y = ny;
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.sprite,
        x: nx * 16 + 8,
        y: ny * 16 + 15,
        duration: dur,
        onUpdate: () => this.sync(),
        onComplete: () => {
          this.moving = false;
          this.sync();
          resolve();
        },
      });
    });
  }

  idle() {
    if (this.moving) return;
    this.sprite.anims.stop();
    this.sprite.setFrame(DIR[this.dir] * 4);
  }

  async step(dir, dur) {
    const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    await this.moveTo(this.x + dx, this.y + dy, dur);
  }

  // Camina siguiendo un recorrido tipo "L3 U2 R1" (ignora colisiones: es para escenas)
  async walk(path, dur = 200) {
    const map = { L: 'left', R: 'right', U: 'up', D: 'down' };
    for (const seg of path.trim().split(/\s+/)) {
      const d = map[seg[0]];
      const n = parseInt(seg.slice(1) || '1', 10);
      for (let i = 0; i < n; i++) await this.step(d, dur);
    }
    this.idle();
  }

  async walkTo(tx, ty, dur = 200, verticalFirst = false) {
    const h = () => (tx !== this.x ? `${tx < this.x ? 'L' : 'R'}${Math.abs(tx - this.x)}` : '');
    const v = () => (ty !== this.y ? `${ty < this.y ? 'U' : 'D'}${Math.abs(ty - this.y)}` : '');
    if (verticalFirst) {
      if (v()) await this.walk(v(), dur);
      if (h()) await this.walk(h(), dur);
    } else {
      if (h()) await this.walk(h(), dur);
      if (v()) await this.walk(v(), dur);
    }
    this.idle();
  }

  // Salto de alegría
  hop(times = 1, height = 6) {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.sprite,
        y: this.py - height,
        duration: 120,
        yoyo: true,
        repeat: times - 1,
        ease: 'Quad.Out',
        onUpdate: () => this.shadow.setPosition(this.sprite.x, this.py - 1),
        onComplete: () => {
          this.sprite.y = this.py;
          this.sync();
          resolve();
        },
      });
    });
  }

  destroy() {
    this.sprite.destroy();
    this.shadow.destroy();
  }
}
