import Phaser from 'phaser';
import { audio } from './audio.js';

// Controles unificados: teclado y táctil alimentan el mismo estado.
// Botones: up, down, left, right, a (hablar), b (pelota), menu.
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'a', Enter: 'a', NumpadEnter: 'a', KeyZ: 'a',
  KeyX: 'b', KeyB: 'b',
  Escape: 'menu', KeyM: 'menu', KeyC: 'menu',
};

export const DIRS = ['up', 'down', 'left', 'right'];

class Controls extends Phaser.Events.EventEmitter {
  constructor() {
    super();
    this.sources = {}; // botón -> Set de fuentes que lo mantienen presionado
    this.pending = new Set();
    this.now = new Set();
    this.dirStack = [];
    this.isTouch = typeof window !== 'undefined' && (
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || navigator.maxTouchPoints > 0
    );
    this.mode = 'world'; // 'world' | 'lanes' | 'hidden'
    this.enabled = true;
  }

  attach() {
    window.addEventListener('keydown', (e) => {
      const btn = KEYMAP[e.code];
      if (!btn) return;
      e.preventDefault();
      if (e.repeat) return;
      this.press(btn, 'kb');
    });
    window.addEventListener('keyup', (e) => {
      const btn = KEYMAP[e.code];
      if (!btn) return;
      e.preventDefault();
      this.release(btn, 'kb');
    });
    window.addEventListener('blur', () => this.releaseAll());
    window.addEventListener('touchstart', () => {
      if (!this.isTouch) {
        this.isTouch = true;
        this.emit('touchdetected');
      }
    }, { passive: true });
  }

  press(btn, src = 'kb') {
    if (!this.sources[btn]) this.sources[btn] = new Set();
    const wasDown = this.sources[btn].size > 0;
    this.sources[btn].add(src);
    if (!wasDown) {
      this.pending.add(btn);
      if (DIRS.includes(btn)) {
        this.dirStack = this.dirStack.filter((d) => d !== btn);
        this.dirStack.push(btn);
      }
      this.emit('press', btn, audio.heardTime());
    }
  }

  release(btn, src = 'kb') {
    const s = this.sources[btn];
    if (!s) return;
    s.delete(src);
    if (s.size === 0) {
      if (DIRS.includes(btn)) this.dirStack = this.dirStack.filter((d) => d !== btn);
      this.emit('release', btn);
    }
  }

  releaseAll() {
    for (const b of Object.keys(this.sources)) this.sources[b].clear();
    this.dirStack = [];
  }

  // Se llama una vez por cuadro, antes de actualizar las escenas
  update() {
    this.now = this.pending;
    this.pending = new Set();
  }

  pressed(btn) {
    return this.enabled && this.now.has(btn);
  }

  // Consume la pulsación (para que otra escena no la procese en el mismo cuadro)
  consume(btn) {
    if (!this.pressed(btn)) return false;
    this.now.delete(btn);
    return true;
  }

  down(btn) {
    return this.enabled && !!this.sources[btn] && this.sources[btn].size > 0;
  }

  dir() {
    if (!this.enabled) return null;
    return this.dirStack.length ? this.dirStack[this.dirStack.length - 1] : null;
  }
}

export const controls = new Controls();
