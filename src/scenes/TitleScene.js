import Phaser from 'phaser';
import { Grid, addTexture, addSheet, rng } from '../gfx/pixel.js';
import { txt, panel } from '../core/text.js';
import { controls } from '../core/input.js';
import { audio } from '../core/audio.js';
import { TITLE } from '../core/songs.js';
import { state } from '../core/state.js';
import { S } from '../core/services.js';

function buildTitleArt(scene) {
  if (scene.textures.exists('title_city')) return;
  // Silueta de Sullana: cerros, iglesia, casas, palmeras y algarrobos
  const far = new Grid(480, 90);
  for (let i = 0; i < 7; i++) far.ellipse(i * 80 + 20, 90, 70, 34 + (i % 3) * 8, '#7a3f78');
  addTexture(scene, 'title_far', far);

  const city = new Grid(480, 80);
  const c = '#3b1f52';
  const r = rng(12);
  let x = 0;
  while (x < 480) {
    const w = 18 + Math.floor(r() * 26);
    const h = 16 + Math.floor(r() * 18);
    city.rect(x, 80 - h, w, h, c);
    // ventanitas encendidas
    for (let wy = 80 - h + 4; wy < 76; wy += 7) {
      for (let wx = x + 3; wx < x + w - 3; wx += 6) if (r() < 0.35) city.rect(wx, wy, 2, 3, '#ffcf7a');
    }
    x += w + Math.floor(r() * 4);
  }
  // Iglesia con torre
  city.rect(200, 30, 60, 50, c);
  city.rect(220, 8, 20, 30, c);
  city.rect(228, 0, 4, 10, c);
  city.rect(225, 3, 10, 3, c);
  city.ellipse(230, 18, 4, 5, '#ffcf7a');
  city.rect(226, 56, 8, 24, '#2a1540');
  // Palmeras
  const palm = (px, ph) => {
    for (let y = 0; y < ph; y++) city.rect(px + Math.round(Math.sin(y * 0.07) * 1.5), 80 - y, 3, 1, c);
    const top = 80 - ph;
    for (const [sx, up] of [[-1, 0], [1, 0], [-1, 1], [1, 1], [0, 2]]) {
      for (let k = 0; k < 14; k++) {
        const x = px + 1 + sx * k * (up === 2 ? 0.2 : 1);
        const y = top + (up === 1 ? -k * 0.5 + (k * k) / 14 : up === 2 ? -k * 0.4 : (k * k) / 9);
        city.rect(Math.round(x), Math.round(y), 2, 2, c);
      }
    }
  };
  palm(40, 44);
  palm(150, 50);
  palm(300, 46);
  palm(420, 52);
  addTexture(scene, 'title_city', city);

  const near = new Grid(480, 60);
  near.ellipse(120, 60, 200, 36, '#1f1030');
  near.ellipse(420, 64, 160, 26, '#1f1030');
  near.rect(0, 40, 480, 20, '#1f1030');
  addTexture(scene, 'title_near', near);

  // Hachi grande sentado moviendo la cola
  const frames = [];
  for (let f = 0; f < 3; f++) {
    const g = new Grid(32, 30);
    const W = '#fbf6ee';
    const C = '#f1dcc0';
    const S2 = '#d8bf9c';
    const tailY = [8, 5, 3][f];
    g.ellipse(26, tailY + 4, 3.5, 5, W, C);
    g.ellipse(18, 21, 10, 8, W, S2);
    g.ellipse(24, 26, 4, 3, C);
    g.rect(10, 24, 4, 5, W);
    g.rect(16, 24, 4, 5, W);
    for (let a = 0; a < Math.PI * 2; a += 0.6) g.ellipse(12 + Math.cos(a) * 7, 11 + Math.sin(a) * 6, 3, 3, W, C);
    g.ellipse(12, 11, 8, 7.5, W, C, '#ffffff');
    g.ellipse(5, 13, 3, 5, C, S2);
    g.ellipse(19, 13, 3, 5, C, S2);
    g.ellipse(12, 14, 3.5, 2.8, '#ffffff');
    g.set(12, 13, '#1b1226');
    g.set(11, 13, '#1b1226');
    g.px([[8, 10], [8, 11], [15, 10], [15, 11]], '#1b1226');
    g.set(8, 10, '#5a4e6c');
    g.set(15, 10, '#5a4e6c');
    g.rect(11, 16, 2, 3, '#ff7f9a');
    g.px([[6, 14], [17, 14]], '#ffc2c2');
    // Pelota a su lado
    g.ellipse(27, 26, 3, 3, '#d9ee4b', '#a8c13a');
    g.outline('#1b1226');
    frames.push(g);
  }
  addSheet(scene, 'title_hachi', frames);
  scene.anims.create({ key: 'title_hachi_wag', frames: [0, 1, 2, 1].map((f) => ({ key: 'title_hachi', frame: f })), frameRate: 9, repeat: -1 });
}

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Title' });
  }

  create() {
    buildTitleArt(this);
    S.ui?.setMode('hidden');
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // Cielo de amanecer
    this.add.image(0, 0, 'skyGrad').setOrigin(0).setDisplaySize(480, 270);
    // Estrellas
    const r = rng(4);
    for (let i = 0; i < 40; i++) {
      const s = this.add.image(r() * 480, r() * 110, 'star').setAlpha(0.3 + r() * 0.6).setScale(r() < 0.2 ? 1 : 0.6);
      this.tweens.add({ targets: s, alpha: 0.1, duration: 700 + r() * 1500, yoyo: true, repeat: -1, delay: r() * 1000 });
    }
    // Sol saliendo
    const sunGlow = this.add.image(330, 200, 'light').setScale(3).setAlpha(0.7).setBlendMode(Phaser.BlendModes.ADD);
    const sun = this.add.circle(330, 200, 22, 0xffd08a);
    this.tweens.add({ targets: [sun, sunGlow], y: 178, duration: 9000, ease: 'Sine.Out' });
    this.tweens.add({ targets: sunGlow, scale: 3.4, duration: 2200, yoyo: true, repeat: -1 });

    this.add.image(0, 270 - 70, 'title_far').setOrigin(0, 1).setAlpha(0.9);
    this.add.image(0, 270 - 40, 'title_city').setOrigin(0, 1);
    // Notas musicales flotando
    this.add.particles(0, 280, 'noteS', {
      x: { min: 0, max: 480 },
      speedY: { min: -18, max: -32 },
      speedX: { min: -6, max: 6 },
      lifespan: 9000,
      frequency: 500,
      alpha: { start: 0.9, end: 0 },
      scale: { min: 0.8, max: 1.4 },
      tint: [0xffd166, 0x8fd3ff, 0xff8fb1, 0xfff1d0],
    });
    this.add.image(0, 270, 'title_near').setOrigin(0, 1);

    // Ray y Hachi en la colina
    const ray = this.add.sprite(76, 246, 'ch_ray', 12).setOrigin(0.5, 1).setScale(2);
    this.rayPose = ray;
    const hachi = this.add.sprite(112, 247, 'title_hachi', 0).setOrigin(0.5, 1).setScale(1.3);
    hachi.play('title_hachi_wag');
    this.time.addEvent({
      delay: 3200,
      loop: true,
      callback: () => {
        ray.setFrame(16);
        this.time.delayedCall(700, () => ray.setFrame(12));
      },
    });

    // Logo
    const logo = this.add.container(240, 70);
    const sub = txt(this, 0, -30, 'Ray y la', { size: 16, color: '#fff1d0', origin: 0.5, stroke: '#2a1040', strokeThickness: 6 });
    const main = txt(this, 0, 0, 'Melodía', { size: 32, color: '#ffd166', origin: 0.5, stroke: '#2a1040', strokeThickness: 8, shadow: '#7b2f6a', shadowY: 4 });
    const main2 = txt(this, 0, 34, 'Perdida', { size: 32, color: '#ffd166', origin: 0.5, stroke: '#2a1040', strokeThickness: 8, shadow: '#7b2f6a', shadowY: 4 });
    const n1 = this.add.image(-150, -4, 'nota_hogar').setScale(1.4);
    const n2 = this.add.image(150, 30, 'nota_sabor').setScale(1.4);
    logo.add([sub, main, main2, n1, n2]);
    this.tweens.add({ targets: logo, y: 74, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.tweens.add({ targets: n1, angle: -12, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.tweens.add({ targets: n2, angle: 12, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    logo.setScale(0.2).setAlpha(0);
    this.tweens.add({ targets: logo, scale: 1, alpha: 1, duration: 900, ease: 'Back.Out', delay: 300 });

    this.press = txt(this, 240, 214, controls.isTouch ? 'Toca para comenzar' : 'Presiona ESPACIO para comenzar', { origin: 0.5, color: '#fff8ec', stroke: '#1f1030', strokeThickness: 4 });
    this.tweens.add({ targets: this.press, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });
    txt(this, 474, 262, 'Un regalo de Tato para Ray · 01.10', { origin: [1, 1], color: '#c9b3e6' }).setAlpha(0.85);

    this.stage = 'press';
    this.input.on('pointerdown', () => {
      if (this.stage === 'press') this.begin();
      else if (this.stage === 'menu') this.menuTap = true;
    });
  }

  begin() {
    this.stage = 'wait';
    audio.unlock();
    if (controls.isTouch && this.scale.fullscreenAvailable && !this.scale.isFullscreen) {
      try {
        this.scale.startFullscreen();
        screen.orientation?.lock?.('landscape').catch(() => {});
      } catch {
        /* nada */
      }
    }
    this.time.delayedCall(80, () => {
      audio.playSong(TITLE, { fade: 0.5, fadeIn: 2 });
      audio.setClarity(1, 0.1);
      audio.sfx('select');
    });
    this.press.destroy();
    this.showMenu();
  }

  showMenu() {
    this.options = [];
    if (state.hasSave()) this.options.push({ label: 'Continuar', act: 'continue' });
    this.options.push({ label: state.hasSave() ? 'Nueva partida' : 'Comenzar', act: 'new' });
    const h = this.options.length * 18 + 14;
    this.menu = this.add.container(0, 0);
    this.menu.add(panel(this, 170, 200, 140, h, 'panelGold'));
    this.items = this.options.map((o, i) => {
      const t = txt(this, 196, 209 + i * 18, o.label);
      this.menu.add(t);
      const zone = this.add.zone(170, 204 + i * 18, 140, 18).setOrigin(0).setInteractive();
      zone.on('pointerdown', () => {
        this.idx = i;
        this.refreshMenu();
        this.menuTap = true;
      });
      this.menu.add(zone);
      return t;
    });
    this.cursor = this.add.image(184, 213, 'cursor');
    this.menu.add(this.cursor);
    this.idx = 0;
    this.refreshMenu();
    this.menu.setAlpha(0);
    this.tweens.add({ targets: this.menu, alpha: 1, duration: 300 });
    this.time.delayedCall(200, () => (this.stage = 'menu'));
  }

  refreshMenu() {
    this.cursor.y = 213 + this.idx * 18;
    this.items.forEach((t, i) => t.setColor(i === this.idx ? '#ffd166' : '#fff8ec'));
  }

  update() {
    if (this.stage === 'press' && (controls.consume('a') || controls.consume('menu'))) {
      this.begin();
      return;
    }
    if (this.stage !== 'menu') return;
    if (controls.consume('up') || controls.consume('down')) {
      this.idx = (this.idx + 1) % this.options.length;
      audio.sfx('cursor');
      this.refreshMenu();
    }
    if (controls.consume('a') || this.menuTap) {
      this.menuTap = false;
      this.stage = 'go';
      audio.sfx('select');
      const act = this.options[this.idx].act;
      this.cameras.main.fadeOut(900, 0, 0, 0);
      audio.stopSong(0.9);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (act === 'continue' && state.load()) {
          this.scene.start('World', { zone: state.data.zone, spawn: state.data.spawn, loaded: true });
        } else {
          state.reset();
          state.clearSave();
          this.scene.start('World', { zone: 'home', spawn: 'intro' });
        }
      });
    }
  }
}
