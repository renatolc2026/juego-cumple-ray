import Phaser from 'phaser';
import { state } from '../../core/state.js';
import { audio } from '../../core/audio.js';
import * as fx from '../../core/fx.js';
import { txt } from '../../core/text.js';
import { MapBuilder } from '../mapgen.js';
import { MUSICBOX } from '../../core/songs.js';

// ============================================================================
// Jardín de los Recuerdos: la banca HCJ y nuestras mascotas que ya no están
// ============================================================================

const m = new MapBuilder(26, 17, 'g');
m.border('H');
m.sprinkle('g', ['f', 'f', 'h'], 0.22, 41);
m.rect(12, 7, 2, 10, 'o'); // camino central
m.rect(9, 7, 8, 2, 'o'); // plazuela de la banca
m.rect(4, 11, 18, 1, 'p'); // senderito entre las placas
const MAP = m.build();

// Mascotas: [nombre, tipo, sprite, posición de su placa]
export const PETS = [
  { id: 'pipo', name: 'Pipo', kind: 'gato', sprite: 'ch_shiro', x: 6, y: 5 },
  { id: 'moises', name: 'Moisés', kind: 'perro', sprite: 'ch_hachi', x: 4, y: 9 },
  { id: 'isis', name: 'Isis', kind: 'gata', sprite: 'ch_shiro', x: 19, y: 5 },
  { id: 'bobby', name: 'Bobby', kind: 'perro', sprite: 'ch_hachi', x: 21, y: 9 },
];

const PET_LINES = {
  pipo: 'Aquí recordamos a Pipo, nuestro gato. Siempre en nuestro corazón.',
  moises: 'Aquí recordamos a Moisés, nuestro perro. Siempre en nuestro corazón.',
  isis: 'Aquí recordamos a Isis, nuestra gata. Siempre en nuestro corazón.',
  bobby: 'Aquí recordamos a Bobby, nuestro perro. Siempre en nuestro corazón.',
};

export default {
  id: 'recuerdos',
  title: 'Jardín de los Recuerdos',
  sub: '',
  map: MAP,
  spawns: { default: { x: 12, y: 14, dir: 'up' } },
  objects: [
    { id: 'hcj', type: 'benchHCJ', x: 12, y: 6, talk: (w) => benchHCJ(w) },
    ...PETS.map((p) => ({ id: `memo_${p.id}`, type: 'memorial', x: p.x, y: p.y, talk: (w) => plaque(w, p) })),
    { type: 'tree', x: 1, y: 1 }, { type: 'tree', x: 22, y: 1 }, { type: 'tree', x: 9, y: 2 }, { type: 'tree', x: 15, y: 2 },
    { type: 'tree', x: 1, y: 13 }, { type: 'tree', x: 22, y: 13 },
    { type: 'flowers', x: 10, y: 6 }, { type: 'flowers', x: 15, y: 6 },
    { type: 'flowers', x: 7, y: 5 }, { type: 'flowers', x: 5, y: 9 }, { type: 'flowers', x: 18, y: 5 }, { type: 'flowers', x: 20, y: 9 },
    { type: 'lamp', x: 10, y: 9 }, { type: 'lamp', x: 15, y: 9 },
    { id: 'portal', type: 'portal', x: 12, y: 10, when: () => state.flag('bench_done'), talk: (w) => enterPortal(w) },
  ],
  triggers: [
    {
      x: 12, y: 11, w: 2, h: 1,
      when: () => state.flag('bench_done'),
      run: (w) => enterPortal(w),
    },
  ],
  saturation: () => Math.max(0.75, [0.22, 0.45, 0.65, 0.84, 1][state.noteCount()]),
  music: () => ({ song: 'TITLE', clarity: 0.85 }),
  onEnter: (w) => intro(w),
  objective: () => (state.flag('bench_done') ? 'Entra al portal' : 'Siéntate en la banca del fondo'),
};

async function intro(w) {
  fx.titleCard(w, 'Jardín de los Recuerdos', '');
  if (state.flag('recuerdos_intro')) return;
  state.setFlag('recuerdos_intro');
  await w.wait(900);
  await w.say(null, 'Un jardín tranquilo, lleno de flores. Aquí el silencio no se siente triste: se siente en paz.');
  await w.say(null, 'Al fondo hay una banca de madera, y a los lados, unas plaquitas con nombres.');
}

async function plaque(w, p) {
  await w.say(null, PET_LINES[p.id]);
  if (w.hachi) {
    w.emote(w.hachi, 'heart', 1200);
    audio.sfx('bark1');
  }
}

async function enterPortal(w) {
  await w.goto('salsa', 'default', { portal: true, white: true });
}

// Momento del abuelito Humberto, con las mascotas que ya no están
async function benchHCJ(w) {
  if (state.flag('bench_done')) {
    await w.say(null, 'La banca con la placa "HCJ". Todavía se siente calientita.');
    return;
  }
  const r = await w.ask(null, 'Una banca de madera con una placa discreta que dice "HCJ". ¿Te sientas un ratito?', ['Sí', 'Ahora no']);
  if (r !== 0) return;
  const p = w.player;
  const bench = w.obj('hcj');
  audio.stopSong(1.5);
  audio.setAmbience(false);
  await w.wait(300);
  p.sprite.setPosition(bench.sprite.x - 6, bench.sprite.y - 3);
  p.face('down');
  p.sync();
  p.sprite.setDepth(bench.sprite.depth + 1);
  if (w.hachi) {
    w.hachi.sprite.setPosition(bench.sprite.x + 9, bench.sprite.y - 1);
    w.hachi.setFrame(16);
    w.hachi.sprite.setDepth(bench.sprite.depth + 2);
  }
  await w.wait(900);
  audio.setClarity(1, 2);
  audio.playSong(MUSICBOX, { fadeIn: 2 });
  const light = w.add.image(bench.sprite.x, bench.sprite.y - 12, 'light').setBlendMode('ADD').setDepth(8000).setAlpha(0).setScale(1.8);
  w.tweens.add({ targets: light, alpha: 0.42, duration: 2500 });
  w.tweens.add({ targets: light, scale: 2.1, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  const motes = w.add.particles(bench.sprite.x, bench.sprite.y, 'sparkle', {
    x: { min: -60, max: 60 },
    speedY: { min: -8, max: -20 },
    lifespan: 3000,
    frequency: 160,
    alpha: { start: 0.9, end: 0 },
    scale: { start: 0.6, end: 0.2 },
    tint: [0xffe9a0, 0xffffff, 0xffd166],
  }).setDepth(8001);
  w.setSat(1, 2500);
  await w.wait(2800);
  await w.say(null, 'Una brisa cálida te rodea. Sientes que alguien te acompaña y está orgulloso de ti.', 'normal', { speed: 45 });

  // Las mascotas aparecen como lucecitas y se acercan a Ray
  const spots = [[-64, 6], [-34, 30], [34, 30], [64, 6]];
  const ghosts = PETS.map((pet, i) => {
    const sx = pet.x * 16 + 8;
    const sy = pet.y * 16 + 14;
    const glow = w.add.image(sx, sy - 8, 'light').setBlendMode('ADD').setScale(0.5).setAlpha(0).setDepth(8002);
    const s = w.add.sprite(sx, sy, pet.sprite, 16 + 0).setOrigin(0.5, 1).setDepth(8003).setAlpha(0);
    s.setFrame(pet.sprite === 'ch_hachi' ? 0 : 0);
    s.setTintFill(0xfff1c0);
    const label = txt(w, sx, sy - 22, pet.name, { origin: 0.5, color: '#fff1d0', stroke: '#3a2a10', strokeThickness: 3 }).setDepth(8004).setAlpha(0);
    return { pet, glow, s, label, tx: bench.sprite.x + spots[i][0], ty: bench.sprite.y + spots[i][1] };
  });
  for (const gh of ghosts) {
    audio.note('bell', 79 + ghosts.indexOf(gh) * 2, 0.6, 0.5);
    w.tweens.add({ targets: [gh.s, gh.label], alpha: 0.85, duration: 900 });
    w.tweens.add({ targets: gh.glow, alpha: 0.32, duration: 900 });
    await w.wait(450);
  }
  await w.wait(500);
  for (const gh of ghosts) {
    w.tweens.add({ targets: [gh.s, gh.glow], x: gh.tx, y: (t) => (t === gh.glow ? gh.ty - 8 : gh.ty), duration: 1600, ease: 'Sine.InOut' });
    w.tweens.add({ targets: gh.label, x: gh.tx, y: gh.ty - 22, duration: 1600, ease: 'Sine.InOut' });
  }
  await w.wait(1700);
  for (const gh of ghosts) w.tweens.add({ targets: gh.s, y: gh.ty - 3, duration: 400 + Math.random() * 200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  if (w.hachi) {
    audio.sfx('bark');
    fx.hearts(w, w.hachi.sprite.x, w.hachi.sprite.y - 12, 10);
  }
  await w.say(null, 'Pipo, Moisés, Isis y Bobby también vinieron a acompañarte en tu cumpleaños.', 'normal', { speed: 45 });
  await w.say(null, 'Hachi mueve la cola. Parece que se cuentan cosas de perritos y gatitos.', 'normal', { speed: 40 });
  await w.wait(600);
  await w.give('bendicion', 1, 'Recupera todo el ánimo en la batalla final');
  state.setFlag('bench_done');
  await w.wait(600);
  // Se despiden subiendo como lucecitas
  for (const gh of ghosts) {
    fx.sparkles(w, gh.s.x, gh.s.y - 8, 8);
    w.tweens.killTweensOf(gh.s);
    w.tweens.add({ targets: [gh.s, gh.glow, gh.label], y: '-=60', alpha: 0, duration: 2200, ease: 'Sine.In', onComplete: () => { gh.s.destroy(); gh.glow.destroy(); gh.label.destroy(); } });
  }
  motes.stop();
  w.tweens.add({ targets: light, alpha: 0, duration: 1800, onComplete: () => light.destroy() });
  await w.wait(2400);
  motes.destroy();
  p.place(p.x, p.y);
  if (w.hachi) {
    w.hachi.place(w.hachi.x, w.hachi.y);
    w.hachi.face(p.dir);
  }
  audio.setAmbience(true);
  w.startZoneMusic();
  // Aparece el portal hacia la academia de Sharon
  await w.wait(400);
  audio.sfx('flash');
  w.flash(400, [255, 220, 255]);
  const portal = w.addObject({ id: 'portal', type: 'portal', x: 12, y: 10, talk: (ww) => enterPortal(ww) });
  portal.sprite.setScale(0.1);
  await fx.tween(w, { targets: portal.sprite, scale: 1, duration: 800, ease: 'Back.Out' });
  fx.notesBurst(w, portal.sprite.x, portal.sprite.y - 20, 18);
  await w.say('ray', '¿Un portal? Suena a... ¿salsa? ¡Esa es la academia de Sharon!', 'surprised');
  w.save();
}
