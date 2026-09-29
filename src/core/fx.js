import Phaser from 'phaser';
import { txt } from './text.js';
import { audio } from './audio.js';

export const W = 480;
export const H = 270;
const TOP = 9000;

export const wait = (scene, ms) => new Promise((r) => scene.time.delayedCall(ms, r));
export const tween = (scene, cfg) => new Promise((r) => scene.tweens.add({ ...cfg, onComplete: () => { cfg.onComplete?.(); r(); } }));

// Burbuja sobre la cabeza de un personaje: '!', '?', 'heart', 'note', 'zzz', 'dots', 'sweat'
export function emote(scene, target, type, dur = 1300) {
  const img = scene.add.image(target.x + (type === 'sweat' ? 7 : 0), target.y - target.displayHeight - 2, `emote_${type}`);
  img.setOrigin(0.5, 1).setDepth(TOP - 10);
  img.setScale(0.2);
  scene.tweens.add({ targets: img, scale: 1, duration: 180, ease: 'Back.Out' });
  const follow = () => img.setPosition(target.x + (type === 'sweat' ? 7 : 0), target.y - target.displayHeight - 2 + Math.sin(scene.time.now / 150) * 1);
  scene.events.on('update', follow);
  if (dur > 0) {
    scene.time.delayedCall(dur, () => {
      scene.events.off('update', follow);
      scene.tweens.add({ targets: img, alpha: 0, duration: 150, onComplete: () => img.destroy() });
    });
  }
  img.stop = () => {
    scene.events.off('update', follow);
    img.destroy();
  };
  return img;
}

// Notas musicales flotando hacia arriba
export function notesBurst(scene, x, y, n = 8, fixed = false) {
  const e = scene.add.particles(x, y, 'noteS', {
    speed: { min: 20, max: 60 },
    angle: { min: 230, max: 310 },
    lifespan: 1400,
    alpha: { start: 1, end: 0 },
    scale: { start: 1, end: 0.6 },
    tint: [0xffd166, 0x8fd3ff, 0xff8fb1, 0xb6e36a, 0xffffff],
    gravityY: -10,
    emitting: false,
  });
  e.setDepth(TOP - 20);
  if (fixed) e.setScrollFactor(0);
  e.explode(n);
  scene.time.delayedCall(1600, () => e.destroy());
  return e;
}

export function hearts(scene, x, y, n = 5) {
  const e = scene.add.particles(x, y, 'heart', {
    speed: { min: 10, max: 35 },
    angle: { min: 240, max: 300 },
    lifespan: 1000,
    alpha: { start: 1, end: 0 },
    scale: { start: 0.9, end: 0.5 },
    gravityY: -20,
    emitting: false,
  });
  e.setDepth(TOP - 20);
  e.explode(n);
  scene.time.delayedCall(1200, () => e.destroy());
}

export function sparkles(scene, x, y, n = 10, fixed = false) {
  const e = scene.add.particles(x, y, 'sparkle', {
    speed: { min: 20, max: 90 },
    lifespan: 700,
    alpha: { start: 1, end: 0 },
    scale: { start: 1, end: 0.2 },
    emitting: false,
  });
  e.setDepth(TOP - 20);
  if (fixed) e.setScrollFactor(0);
  e.explode(n);
  scene.time.delayedCall(900, () => e.destroy());
}

// Lluvia de confeti a pantalla completa
export function confetti(scene, duration = 3000, depth = TOP - 30) {
  const e = scene.add.particles(0, -10, 'confetti', {
    x: { min: 0, max: W },
    speedY: { min: 40, max: 110 },
    speedX: { min: -30, max: 30 },
    rotate: { min: 0, max: 360 },
    lifespan: 4200,
    frequency: 25,
    quantity: 2,
    tint: [0xe8505b, 0xffd166, 0x6cc251, 0x5fb2ea, 0xa77be0, 0xff8fb1, 0xffffff],
    scale: { min: 1, max: 1.8 },
  });
  e.setScrollFactor(0).setDepth(depth);
  if (duration > 0) scene.time.delayedCall(duration, () => e.stop());
  scene.time.delayedCall(duration + 4500, () => e.destroy());
  return e;
}

// Cartel con el nombre de la zona
export function titleCard(scene, title, sub = '') {
  const c = scene.add.container(0, 0).setScrollFactor(0).setDepth(TOP);
  const bar = scene.add.rectangle(0, 36, W, sub ? 44 : 30, 0x120c1f, 0.82).setOrigin(0, 0.5);
  const line1 = scene.add.rectangle(0, 36 - (sub ? 22 : 15), W, 1, 0xffd166, 0.9).setOrigin(0, 0.5);
  const line2 = scene.add.rectangle(0, 36 + (sub ? 22 : 15), W, 1, 0xffd166, 0.9).setOrigin(0, 0.5);
  const t = txt(scene, W / 2, sub ? 30 : 36, title, { size: 16, color: '#fff1d0', origin: 0.5, stroke: '#120c1f', strokeThickness: 4 });
  c.add([bar, line1, line2, t]);
  if (sub) c.add(txt(scene, W / 2, 48, sub, { size: 8, color: '#ffd166', origin: 0.5 }));
  c.alpha = 0;
  c.y = -10;
  scene.tweens.add({ targets: c, alpha: 1, y: 0, duration: 400, ease: 'Cubic.Out' });
  scene.tweens.add({ targets: c, alpha: 0, y: -10, delay: 2600, duration: 500, onComplete: () => c.destroy() });
  return c;
}

// Letrero grande de "¡Obtuviste...!" con ícono girando
export async function banner(scene, { icon, title, sub = '', sound = 'item', color = '#ffd166' }) {
  const c = scene.add.container(W / 2, H / 2 - 20).setScrollFactor(0).setDepth(TOP + 5);
  const glow = scene.add.image(0, -8, 'light').setScale(1.2).setTint(Phaser.Display.Color.HexStringToColor(color).color).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.8);
  const ic = scene.add.image(0, -10, icon).setScale(2);
  const t = txt(scene, 0, 26, title, { size: 8, color: '#fff8ec', origin: 0.5, stroke: '#120c1f', strokeThickness: 4 });
  const st = sub ? txt(scene, 0, 40, sub, { size: 8, color, origin: 0.5 }) : null;
  const bg = scene.add.rectangle(0, 32, Math.max(t.width + 32, (st ? st.width : 0) + 32, 160), sub ? 38 : 24, 0x120c1f, 0.85).setStrokeStyle(1, 0xffd166);
  c.add([glow, bg, ic, t]);
  if (st) c.add(st);
  c.setScale(0.3);
  c.alpha = 0;
  audio.sfx(sound);
  scene.tweens.add({ targets: glow, angle: 360, duration: 4000, repeat: -1 });
  scene.tweens.add({ targets: ic, y: -14, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  await tween(scene, { targets: c, scale: 1, alpha: 1, duration: 350, ease: 'Back.Out' });
  sparkles(scene, W / 2, H / 2 - 30, 14, true);
  await wait(scene, sound === 'note' ? 2200 : 1500);
  await tween(scene, { targets: c, alpha: 0, scale: 1.2, duration: 300 });
  c.destroy();
}

// Corte de ataque especial estilo anime
export async function cutIn(scene, { portrait = 'pt_ray_happy', text = '¡ATAQUE!', color = 0xe8505b, sub = '' }) {
  const c = scene.add.container(0, 0).setScrollFactor(0).setDepth(TOP + 20);
  const dim = scene.add.rectangle(0, 0, W, H, 0x000000, 0.45).setOrigin(0);
  const band = scene.add.rectangle(W / 2, H / 2, W + 40, 96, color).setAngle(-6);
  const band2 = scene.add.rectangle(W / 2, H / 2, W + 40, 104, 0xffffff).setAngle(-6);
  c.add([dim, band2, band]);
  // Líneas de velocidad
  const lines = scene.add.graphics();
  c.add(lines);
  const drawLines = () => {
    lines.clear();
    for (let i = 0; i < 26; i++) {
      const y = H / 2 - 44 + Math.random() * 88;
      const x = Math.random() * W;
      const len = 30 + Math.random() * 90;
      lines.fillStyle(0xffffff, 0.35 + Math.random() * 0.5);
      lines.fillRect(x, y, len, 1 + (Math.random() < 0.3 ? 1 : 0));
    }
  };
  drawLines();
  const ev = scene.time.addEvent({ delay: 45, loop: true, callback: drawLines });
  const pt = scene.add.image(W + 80, H / 2, portrait).setScale(2.4);
  const label = txt(scene, -200, H / 2 + 26, text, { size: 16, color: '#fff8ec', origin: [0, 0.5], stroke: '#120c1f', strokeThickness: 6 });
  c.add([pt, label]);
  if (sub) c.add(txt(scene, -200, H / 2 + 44, sub, { size: 8, color: '#ffd166', origin: [0, 0.5], stroke: '#120c1f', strokeThickness: 3 }).setName('sub'));
  audio.sfx('cutin');
  band.scaleY = 0;
  band2.scaleY = 0;
  scene.tweens.add({ targets: [band, band2], scaleY: 1, duration: 160, ease: 'Cubic.Out' });
  scene.tweens.add({ targets: pt, x: W - 110, duration: 260, ease: 'Cubic.Out' });
  const subT = c.getByName('sub');
  scene.tweens.add({ targets: [label, subT].filter(Boolean), x: 24, duration: 300, delay: 80, ease: 'Cubic.Out' });
  await wait(scene, 1150);
  scene.tweens.add({ targets: pt, x: pt.x - 30, duration: 300 });
  await tween(scene, { targets: c, alpha: 0, duration: 250 });
  ev.remove();
  c.destroy();
}

// Transición a batalla: destello, pantalla que se rompe en fragmentos y barras negras laterales
export function shatter(scene) {
  return new Promise((resolve) => {
    audio.sfx('flash');
    scene.cameras.main.flash(120, 255, 255, 255);
    scene.time.delayedCall(130, () => {
      scene.game.renderer.snapshot((img) => {
        const key = 'snapShatter';
        if (scene.textures.exists(key)) scene.textures.remove(key);
        const tex = scene.textures.addImage(key, img);
        const cols = 10;
        const rows = 6;
        const pw = W / cols;
        const ph = H / rows;
        const c = scene.add.container(0, 0).setScrollFactor(0).setDepth(TOP + 30);
        c.add(scene.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0));
        let i = 0;
        for (let r = 0; r < rows; r++) {
          for (let q = 0; q < cols; q++) {
            tex.add(`p${i}`, 0, q * pw, r * ph, pw, ph);
            const piece = scene.add.image(q * pw + pw / 2, r * ph + ph / 2, key, `p${i}`);
            c.add(piece);
            const dx = piece.x - W / 2;
            const dy = piece.y - H / 2;
            scene.tweens.add({
              targets: piece,
              x: piece.x + dx * (0.8 + Math.random()) + (Math.random() - 0.5) * 60,
              y: piece.y + dy * (0.8 + Math.random()) + 80 + Math.random() * 60,
              angle: (Math.random() - 0.5) * 540,
              scale: 0.3 + Math.random() * 0.4,
              alpha: 0,
              delay: Math.hypot(dx, dy) * 0.6,
              duration: 650,
              ease: 'Cubic.In',
            });
            i++;
          }
        }
        audio.sfx('shatter');
        scene.time.delayedCall(700, () => {
          const l = scene.add.rectangle(-W / 2, 0, W / 2, H, 0x000000).setOrigin(0);
          const rr = scene.add.rectangle(W, 0, W / 2, H, 0x000000).setOrigin(0);
          c.add([l, rr]);
          audio.sfx('whoosh');
          scene.tweens.add({ targets: l, x: 0, duration: 220, ease: 'Cubic.In' });
          scene.tweens.add({ targets: rr, x: W / 2, duration: 220, ease: 'Cubic.In', onComplete: () => resolve(c) });
        });
      });
    });
  });
}

// Revela la escena abriendo barras negras hacia los lados
export function barsOut(scene, dur = 380) {
  const l = scene.add.rectangle(0, 0, W / 2 + 1, H, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(TOP + 40);
  const r = scene.add.rectangle(W / 2, 0, W / 2, H, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(TOP + 40);
  scene.tweens.add({ targets: l, x: -W / 2, duration: dur, ease: 'Cubic.Out', onComplete: () => l.destroy() });
  return tween(scene, { targets: r, x: W, duration: dur, ease: 'Cubic.Out', onComplete: () => r.destroy() });
}

// Texto flotante (+ Perfecto, etc.)
export function floatText(scene, x, y, str, color = '#fff8ec', size = 8) {
  const t = txt(scene, x, y, str, { size, color, origin: 0.5, stroke: '#120c1f', strokeThickness: 3 });
  t.setDepth(TOP - 5);
  scene.tweens.add({ targets: t, y: y - 18, alpha: 0, duration: 700, ease: 'Cubic.Out', onComplete: () => t.destroy() });
  return t;
}

// Aplica saturación / tinte a la cámara (si el navegador soporta WebGL)
export function colorGrade(camera) {
  if (!camera.postFX) return null;
  const cm = camera.postFX.addColorMatrix();
  const state = { sat: 1, bright: 1, cold: 0 };
  const apply = () => {
    cm.reset();
    cm.saturate(state.sat - 1);
    if (state.cold > 0) {
      const k = state.cold;
      cm.multiply([
        1 - 0.15 * k, 0, 0, 0, 0,
        0, 1 - 0.05 * k, 0, 0, 0,
        0, 0, 1 + 0.12 * k, 0, 0.02 * k,
        0, 0, 0, 1, 0,
      ], true);
    }
    if (state.bright !== 1) cm.brightness(state.bright, true);
  };
  apply();
  return {
    state,
    set(sat, cold = state.cold, bright = state.bright) {
      state.sat = sat;
      state.cold = cold;
      state.bright = bright;
      apply();
    },
    to(scene, sat, dur = 1500, cold = state.cold) {
      return tween(scene, { targets: state, sat, cold, duration: dur, ease: 'Sine.InOut', onUpdate: apply });
    },
  };
}
