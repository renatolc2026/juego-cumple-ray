import Phaser from 'phaser';
import { S } from '../core/services.js';
import { audio } from '../core/audio.js';
import { controls } from '../core/input.js';
import { state } from '../core/state.js';
import { txt } from '../core/text.js';
import * as fx from '../core/fx.js';
import { TITLE } from '../core/songs.js';

// Mensaje final (letra por letra), créditos como postales y "Gracias por jugar".
export const FINAL_MESSAGE = [
  'La vida es como un videojuego donde tú eres el personaje principal. Dios te regala cada día para que lo disfrutes y seas feliz, y subir cada nivel depende de ti.',
  'Eres el mejor, Ray. Dios te bendiga mucho, y nosotros siempre te amaremos.',
  'Aunque en este cumpleaños no estamos cerca, quise aparecer en este videojuego para recordarte que siempre estaré para ti.',
  'Feliz cumpleaños 36.  - Tato',
];

const CARDS = [
  { caption: 'Ray y Hachi', bg: 0x6cc251, floor: 0x5fb247, chars: [['ray', 0], ['hachi', 17]], extra: 'ball' },
  { caption: 'Papá, mamá, Micha y Shiro', bg: 0xf6e3c0, floor: 0xc88a52, chars: [['papa', 0], ['mama', 0], ['micha', 0], ['shiro', 0]] },
  { caption: 'El coro: Juanmi, Anita, Mariana, Nicol, Angela y Mimi', bg: 0xfbf7ee, floor: 0xe9e1d0, chars: [['juanmi', 16], ['anita', 0], ['mariana', 16], ['nicol', 0], ['angela', 16], ['mimi', 0]] },
  { caption: 'Sharon y su academia de salsa', bg: 0x5a2a78, floor: 0x3a2a60, chars: [['bailarin', 16], ['sharon', 16], ['bailarina', 16]], extra: 'disco' },
  { caption: 'Ricardo, Bismark y los programadores de Piura', bg: 0x243a38, floor: 0x1c2a2a, chars: [['ricardo', 0], ['bismark', 16], ['dev1', 0], ['dev2', 16], ['dev3', 0]] },
  { caption: 'César, Elbers y Martín: los de siempre', bg: 0x8fd3ff, floor: 0x6cc251, chars: [['cesar', 16], ['elbers', 16], ['martin', 16]] },
  { caption: 'Tato y Aurora, desde Lima', bg: 0x1a1a22, floor: 0x1a1a22, phone: true },
  { caption: 'HCJ · Siempre acompañándote', bg: 0x3a2a4a, floor: 0x2a6e35, bench: true },
  { caption: 'Pipo, Moisés, Isis y Bobby · Siempre en nuestro corazón', bg: 0xffe9b0, floor: 0x6cc251, chars: [['shiro', 0], ['hachi', 0], ['shiro', 0], ['hachi', 0]] },
];

export class EndingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Ending' });
  }

  create() {
    S.ui?.setMode('hidden');
    this.cameras.main.fadeIn(1500, 0, 0, 0);
    audio.setAmbience(false);
    audio.setClarity(1, 0.1);
    audio.playSong(TITLE, { fadeIn: 3, restart: true });
    this.drawSky();
    this.skip = false;
    this.input.on('pointerdown', () => (this.skip = true));
    this.sequence();
  }

  drawSky() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x0d0820, 0x0d0820, 0x3a1f5a, 0x3a1f5a, 1);
    g.fillRect(0, 0, 480, 270);
    for (let i = 0; i < 70; i++) {
      const s = this.add.image(Phaser.Math.Between(0, 480), Phaser.Math.Between(0, 200), 'star').setAlpha(Phaser.Math.FloatBetween(0.2, 0.9));
      this.tweens.add({ targets: s, alpha: 0.1, duration: Phaser.Math.Between(700, 2400), yoyo: true, repeat: -1 });
    }
    if (this.textures.exists('title_city')) this.add.image(0, 270, 'title_city').setOrigin(0, 1).setTint(0x2a1850);
    this.add.particles(0, 280, 'noteS', {
      x: { min: 0, max: 480 },
      speedY: { min: -12, max: -26 },
      lifespan: 10000,
      frequency: 700,
      alpha: { start: 0.7, end: 0 },
      tint: [0xffd166, 0x8fd3ff, 0xff8fb1, 0xfff1d0],
    });
  }

  pressed() {
    const p = controls.consume('a') || this.skip;
    this.skip = false;
    return p;
  }

  async waitOrPress(ms) {
    const end = this.time.now + ms;
    while (this.time.now < end) {
      if (this.pressed()) return;
      await fx.wait(this, 30);
    }
  }

  async typeText(t, full, speed = 45) {
    const lines = t.getWrappedText(full).join('\n');
    for (let i = 1; i <= lines.length; i++) {
      t.setText(lines.slice(0, i));
      const ch = lines[i - 1];
      if (ch !== ' ' && ch !== '\n' && i % 2 === 0) audio.sfx('blip', { freq: 390 + Math.random() * 30 });
      let delay = speed;
      if ('.,'.includes(ch)) delay = speed * 6;
      if (this.pressed()) {
        t.setText(lines);
        return;
      }
      await fx.wait(this, delay);
    }
  }

  async sequence() {
    await fx.wait(this, 1600);
    // --- Mensaje final
    const container = this.add.container(0, 0);
    let y = 34;
    for (let i = 0; i < FINAL_MESSAGE.length; i++) {
      const last = i === FINAL_MESSAGE.length - 1;
      const t = txt(this, last ? 440 : 40, y, '', {
        wrap: 400, lineSpacing: 8, color: last ? '#ffd166' : '#fff8ec', align: last ? 'right' : 'left', size: 8,
      });
      if (last) t.setOrigin(1, 0);
      container.add(t);
      await this.typeText(t, FINAL_MESSAGE[i]);
      y += t.height + 16;
      await this.waitOrPress(last ? 3500 : 1800);
    }
    const hint = txt(this, 240, 258, controls.isTouch ? 'toca para continuar' : 'presiona ESPACIO', { origin: 0.5, color: '#b9a8d6' });
    this.tweens.add({ targets: hint, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });
    while (!this.pressed()) await fx.wait(this, 50);
    hint.destroy();
    await fx.tween(this, { targets: container, alpha: 0, duration: 1200 });
    container.destroy();

    // --- Créditos: postales
    const cards = [...CARDS];
    const photos = await this.loadPhotos();
    if (photos.length) cards.splice(1, 0, ...photos);
    const title = txt(this, 240, 20, 'Ray y la Melodía Perdida', { origin: 0.5, size: 16, color: '#ffd166', stroke: '#120c1f', strokeThickness: 4 });
    title.setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 800 });
    const credits = [
      'Un regalo de Tato para Ray',
      'Idea, historia y mucho cariño: Renato (Tato)',
      'Protagonista: Ray · Mejor compañero: Hachi',
      'Con la participación especial de la familia y los amigos de siempre',
    ];
    const creditTxt = txt(this, 240, 250, '', { origin: 0.5, color: '#d8c8ff' });
    for (let i = 0; i < cards.length; i++) {
      creditTxt.setText(credits[i % credits.length]);
      const card = this.makeCard(cards[i]);
      card.x = 600;
      card.angle = Phaser.Math.Between(-4, 4);
      await fx.tween(this, { targets: card, x: 240, duration: 700, ease: 'Cubic.Out' });
      await this.waitOrPress(3000);
      await fx.tween(this, { targets: card, x: -140, angle: card.angle - 8, duration: 600, ease: 'Cubic.In' });
      card.destroy();
    }
    title.destroy();
    creditTxt.destroy();

    // --- Gracias por jugar
    const thanks = txt(this, 240, 110, 'GRACIAS POR JUGAR', { origin: 0.5, size: 24, color: '#ffd166', stroke: '#2a1040', strokeThickness: 6, shadow: '#7b2f6a', shadowY: 4 });
    thanks.setScale(0.2).setAlpha(0);
    await fx.tween(this, { targets: thanks, scale: 1, alpha: 1, duration: 800, ease: 'Back.Out' });
    fx.confetti(this, 3000, 50);
    audio.sfx('confetti');
    if (this.textures.exists('title_hachi')) {
      const hachi = this.add.sprite(240, 196, 'title_hachi', 0).setScale(1.3);
      if (this.anims.exists('title_hachi_wag')) hachi.play('title_hachi_wag');
    }
    const again = txt(this, 240, 230, controls.isTouch ? 'Toca para volver a jugar' : 'Presiona ESPACIO para volver a jugar', { origin: 0.5, color: '#fff8ec' });
    this.tweens.add({ targets: again, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });
    state.setFlag('game_finished');
    state.save('party');
    await fx.wait(this, 1500);
    this.skip = false;
    while (!this.pressed()) await fx.wait(this, 50);
    audio.stopSong(1.5);
    this.cameras.main.fadeOut(1200);
    await fx.wait(this, 1300);
    this.scene.start('Title');
  }

  makeCard(cd) {
    const c = this.add.container(240, 130);
    const W = 230;
    const H = 150;
    c.add(this.add.rectangle(3, 4, W, H, 0x000000, 0.35));
    c.add(this.add.rectangle(0, 0, W, H, 0xfff8ec));
    const iw = W - 16;
    const ih = H - 40;
    const ix = -iw / 2;
    const iy = -H / 2 + 8;
    if (cd.photoKey) {
      c.add(this.add.image(0, iy + ih / 2, cd.photoKey).setDisplaySize(iw, ih));
    } else {
      c.add(this.add.rectangle(ix, iy, iw, ih, cd.bg).setOrigin(0));
      c.add(this.add.rectangle(ix, iy + ih * 0.62, iw, ih * 0.38, cd.floor).setOrigin(0));
      if (cd.chars) {
        const n = cd.chars.length;
        cd.chars.forEach(([id, frame], i) => {
          const x = ix + ((i + 1) * iw) / (n + 1);
          const s = this.add.sprite(x, iy + ih - 12, `ch_${id}`, frame).setOrigin(0.5, 1).setScale(n > 4 ? 2 : 2.5);
          c.add(s);
          this.tweens.add({ targets: s, y: s.y - 3, duration: 300 + i * 40, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        });
      }
      if (cd.extra === 'ball') c.add(this.add.image(ix + iw - 30, iy + ih - 18, 'ball').setScale(2));
      if (cd.extra === 'disco') c.add(this.add.sprite(0, iy + 16, 'obj_discoBall', 0).setScale(1.2).play('obj_discoBall_anim'));
      if (cd.phone) {
        c.add(this.add.rectangle(0, iy + ih / 2, 150, ih - 8, 0x2a2a36).setStrokeStyle(2, 0x5a5a6a));
        c.add(this.add.rectangle(0, iy + ih / 2, 140, ih - 18, 0x8fd3ff));
        c.add(this.add.image(-34, iy + ih / 2, 'pt_tato_happy'));
        c.add(this.add.image(34, iy + ih / 2, 'pt_aurora_happy'));
        const heart = this.add.image(0, iy + 18, 'heart').setScale(1.5);
        c.add(heart);
        this.tweens.add({ targets: heart, scale: 2, duration: 500, yoyo: true, repeat: -1 });
      }
      if (cd.bench) {
        c.add(this.add.image(0, iy + ih - 10, 'obj_benchHCJ').setOrigin(0.5, 1).setScale(2.5));
        const l = this.add.image(0, iy + ih / 2, 'light').setBlendMode('ADD').setAlpha(0.6).setScale(1.3);
        c.add(l);
        this.tweens.add({ targets: l, alpha: 0.9, duration: 1500, yoyo: true, repeat: -1 });
      }
    }
    c.add(txt(this, 0, H / 2 - 16, cd.caption, { origin: 0.5, color: '#43281d', wrap: W - 12, align: 'center' }));
    return c;
  }

  // Fotos opcionales: si existe public/fotos/fotos.json se convierten en postales pixeladas
  loadPhotos() {
    return new Promise((resolve) => {
      fetch('fotos/fotos.json')
        .then((r) => (r.ok ? r.json() : []))
        .then((list) => {
          if (!Array.isArray(list) || !list.length) return resolve([]);
          const out = [];
          let pending = list.length;
          list.forEach((p, i) => {
            const img = new Image();
            img.onload = () => {
              const key = `photo_${i}`;
              const cv = pixelate(img, 108, 66);
              if (this.textures.exists(key)) this.textures.remove(key);
              this.textures.addCanvas(key, cv);
              out[i] = { caption: p.caption || '', photoKey: key };
              if (--pending === 0) resolve(out.filter(Boolean));
            };
            img.onerror = () => {
              if (--pending === 0) resolve(out.filter(Boolean));
            };
            img.src = `fotos/${p.file}`;
          });
        })
        .catch(() => resolve([]));
    });
  }
}

// Reduce una foto a pocos píxeles y colores para que parezca pixel art
function pixelate(img, w, h) {
  const small = document.createElement('canvas');
  small.width = w;
  small.height = h;
  const ctx = small.getContext('2d');
  // Recorte tipo "cover"
  const r = Math.max(w / img.width, h / img.height);
  const sw = w / r;
  const sh = h / r;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const q = (v) => Math.round(v / 42) * 42;
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = q(data.data[i]);
    data.data[i + 1] = q(data.data[i + 1]);
    data.data[i + 2] = q(data.data[i + 2]);
  }
  ctx.putImageData(data, 0, 0);
  const big = document.createElement('canvas');
  big.width = w * 2;
  big.height = h * 2;
  const bctx = big.getContext('2d');
  bctx.imageSmoothingEnabled = false;
  bctx.drawImage(small, 0, 0, w * 2, h * 2);
  return big;
}
