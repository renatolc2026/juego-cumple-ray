import Phaser from 'phaser';
import { state } from '../../core/state.js';
import { audio } from '../../core/audio.js';
import * as fx from '../../core/fx.js';
import { txt } from '../../core/text.js';
import { MapBuilder } from '../mapgen.js';
import { TITLE } from '../../core/songs.js';

// ============================================================================
// Escena 6: la Torre del Silencio (el edificio de Lima, siete pisos)
// ============================================================================

const m = new MapBuilder(22, 14, '.');
m.rect(0, 0, 22, 1, '#');
m.rect(0, 0, 1, 14, '#');
m.rect(21, 0, 1, 14, '#');
m.rect(0, 13, 22, 1, '#');
for (let x = 1; x < 21; x++) m.set(x, 1, x % 4 === 1 ? 'w' : 'W');
m.checker(8, 5, 6, 5, ',', '.');
const MAP = m.build();

// Tipo de prueba por piso
const FLOORS = {
  1: { kind: 'simon', len: 3, name: 'Piso 1: la sala de espera' },
  2: { kind: 'salsa', name: 'Piso 2: la oficina sin ritmo' },
  3: { kind: 'hachi', spot: [4, 10], name: 'Piso 3: el archivo perdido' },
  4: { kind: 'simon', len: 4, name: 'Piso 4: el piano mudo' },
  5: { kind: 'salsa', name: 'Piso 5: el pasillo congelado' },
  6: { kind: 'hachi', spot: [18, 4], name: 'Piso 6: el depósito' },
  7: { kind: 'boss', name: 'Piso 7: la azotea del silencio' },
};

const floor = () => state.data.flags.towerFloor || 1;
const floorDone = (f = floor()) => state.flag(`tower_done_${f}`);

export default {
  id: 'tower',
  map: MAP,
  bg: '#1a1c26',
  legend: { '#': 'towerTop', W: 'towerWall', w: 'towerWallWin', '.': 'tower', ',': 'tower2' },
  spawns: { default: { x: 10, y: 3, dir: 'down' } },
  cold: 1,
  saturation: () => (floorDone() ? 1 : 0.12 + floor() * 0.04),
  objects: [
    { id: 'elevator', type: 'elevator', x: 10, y: 1, talk: (w) => elevatorTalk(w) },
    { type: 'pillar', x: 3, y: 3 }, { type: 'pillar', x: 18, y: 3 }, { type: 'pillar', x: 3, y: 9 }, { type: 'pillar', x: 18, y: 9 },
    { type: 'plant', x: 1, y: 2 }, { type: 'plant', x: 20, y: 2 }, { type: 'flowers', x: 6, y: 12 }, { type: 'flowers', x: 15, y: 12 },
    { type: 'officeDesk', x: 1, y: 6, when: () => floor() % 2 === 0 },
    { type: 'officeDesk', x: 19, y: 6, when: () => floor() % 2 === 1 && floor() < 7 },
    { type: 'fogBox', x: 5, y: 10, when: () => floor() === 3 }, { type: 'fogBox', x: 3, y: 11, when: () => floor() === 3 },
    { type: 'fogBox', x: 16, y: 11, when: () => floor() === 3 }, { type: 'fogBox', x: 12, y: 11, when: () => floor() === 3 },
    { type: 'fogBox', x: 17, y: 4, when: () => floor() === 6 }, { type: 'fogBox', x: 19, y: 5, when: () => floor() === 6 },
    { type: 'fogBox', x: 5, y: 5, when: () => floor() === 6 }, { type: 'fogBox', x: 14, y: 11, when: () => floor() === 6 },
    { type: 'silentJukebox', x: 1, y: 11, when: () => floor() !== 3 },
  ],
  actors: () => {
    const f = floor();
    const cfg = FLOORS[f];
    const list = [];
    if (cfg.kind === 'boss') {
      if (!state.flag('boss_beaten')) list.push({ id: 'maestro', char: 'maestro', x: 10, y: 8, dir: 'up', talk: (w) => bossTalk(w) });
    } else if (!floorDone(f)) {
      list.push({ id: 'eco', char: 'eco', x: 10, y: 8, dir: 'up', alpha: 0.85, talk: (w) => ecoTalk(w) });
    }
    return list;
  },
  hidden: [
    { id: 'tower3', x: 4, y: 10, when: () => floor() === 3, run: (w) => foundEcho(w) },
    { id: 'tower6', x: 18, y: 4, when: () => floor() === 6, run: (w) => foundEcho(w) },
  ],
  triggers: [
    {
      x: 10, y: 2, w: 2, h: 1,
      run: (w) => elevatorTalk(w),
    },
  ],
  music: () => {
    const f = floor();
    if (f === 7 && state.flag('boss_beaten')) return { song: TITLE, clarity: 1 };
    return { song: 'TOWER', level: f, clarity: floorDone() ? 0.85 : 0.35 + f * 0.05 };
  },
  onEnter: (w) => enterFloor(w),
  update: (w, time) => {
    const e = w.actor('eco');
    if (e) e.sprite.setAlpha(0.65 + Math.sin(time / 300) * 0.2);
  },
};

// ---------------------------------------------------------------------------
function doors(w, closing) {
  const c = w.add.container(0, 0).setScrollFactor(0).setDepth(9300);
  const l = w.add.rectangle(closing ? -240 : 0, 0, 240, 270, 0x8a90a4).setOrigin(0).setStrokeStyle(2, 0x5a6078);
  const r = w.add.rectangle(closing ? 480 : 240, 0, 240, 270, 0x8a90a4).setOrigin(0).setStrokeStyle(2, 0x5a6078);
  const lh = w.add.rectangle(closing ? -10 : 230, 135, 4, 40, 0x5a6078);
  const rh = w.add.rectangle(closing ? 490 : 250, 135, 4, 40, 0x5a6078);
  c.add([l, r, lh, rh]);
  return { c, l, r, lh, rh };
}

async function enterFloor(w) {
  if (!state.data.flags.towerFloor) state.data.flags.towerFloor = 1;
  const f = floor();
  const cfg = FLOORS[f];
  // Puertas del ascensor que se abren
  const d = doors(w, false);
  const panelTxt = txt(w, 240, 40, `PISO ${f}`, { size: 16, color: '#ff5a5a', origin: 0.5, fixed: true, depth: 9310, stroke: '#1a0a0a', strokeThickness: 4 });
  audio.sfx('ding');
  await w.wait(700);
  audio.sfx('door');
  w.tweens.add({ targets: [d.l, d.lh], x: '-=240', duration: 700, ease: 'Cubic.InOut' });
  w.tweens.add({ targets: [d.r, d.rh], x: '+=240', duration: 700, ease: 'Cubic.InOut' });
  w.tweens.add({ targets: panelTxt, alpha: 0, duration: 700, delay: 400 });
  await w.wait(750);
  d.c.destroy();
  panelTxt.destroy();
  fx.titleCard(w, 'Torre del Silencio', cfg.name);
  if (f === 1 && !state.flag('tower_intro')) {
    state.setFlag('tower_intro');
    await w.wait(600);
    await w.say('ray', 'Esta torre... ¡es igualita al edificio de Lima! Siete pisos. Todo gris y en silencio.', 'surprised');
    await w.say(null, 'En cada piso, un Eco del Silencio guarda el camino. El ascensor solo sube si lo vences.');
  }
  if (cfg.kind === 'boss' && !state.flag('boss_beaten')) {
    await w.wait(400);
    await bossTalk(w);
  }
}

async function elevatorTalk(w) {
  const f = floor();
  if (FLOORS[f].kind === 'boss') {
    if (state.flag('boss_beaten')) return;
    await w.say('ray', 'No hay vuelta atrás. El Maestro está aquí.');
    await w.player.walk('D1');
    return;
  }
  if (!floorDone(f)) {
    await w.say('ray', 'El ascensor no se mueve. Primero hay que devolverle el sonido a este piso.');
    if (w.player.y <= 2) await w.player.walk('D1');
    return;
  }
  // Subir al siguiente piso
  const d = doors(w, true);
  audio.sfx('door');
  w.tweens.add({ targets: [d.l, d.lh], x: '+=240', duration: 600, ease: 'Cubic.InOut' });
  w.tweens.add({ targets: [d.r, d.rh], x: '-=240', duration: 600, ease: 'Cubic.InOut' });
  await w.wait(700);
  const t = txt(w, 240, 40, `PISO ${f}`, { size: 16, color: '#ff5a5a', origin: 0.5, fixed: true, depth: 9310, stroke: '#1a0a0a', strokeThickness: 4 });
  const arrow = w.add.image(240, 70, 'arrowIcon').setAngle(90).setScale(2).setTint(0xff5a5a).setScrollFactor(0).setDepth(9310);
  w.tweens.add({ targets: arrow, alpha: 0.2, duration: 200, yoyo: true, repeat: -1 });
  w.shake(900, 0.002);
  audio.sfx('whoosh');
  await w.wait(700);
  t.setText(`PISO ${f + 1}`);
  await w.wait(400);
  state.data.flags.towerFloor = f + 1;
  w.transitioning = true;
  audio.stopSong(0.5);
  w.scene.restart({ zone: 'tower', spawn: 'default' });
}

async function ecoTalk(w) {
  const f = floor();
  const cfg = FLOORS[f];
  const eco = w.actor('eco');
  if (cfg.kind === 'hachi') {
    if (!state.flag(`eco_${f}`)) {
      state.setFlag(`eco_${f}`);
      await w.say('eco', '...Shhh... El sonido de este piso está escondido... Nadie lo encontrará...');
      await w.say('ray', 'Hachi, ¿lo hueles? Busquemos entre las cajas.', 'normal');
      w.emote(w.hachi, '!', 800);
      audio.sfx('bark1');
    } else {
      await w.say('eco', '...Shhh...');
    }
    return;
  }
  const intros = {
    1: '...Shhh... Aquí nadie toca... nadie recuerda las melodías...',
    2: '...Shhh... En esta oficina está prohibido bailar...',
    4: '...Shhh... Este piano no volverá a sonar... a menos que recuerdes...',
    5: '...Shhh... Tus pies están cansados... no podrás seguir el ritmo...',
  };
  await w.say('eco', intros[f] || '...Shhh...');
  const r = await w.ask('ray', cfg.kind === 'simon' ? '¿Repetir la melodía del eco?' : '¿Bailar contra el eco?', ['¡Sí!', 'Espera']);
  if (r !== 0) return;
  if (cfg.kind === 'simon') await w.minigame('Simon', { length: cfg.len, floor: f });
  else await w.minigame('Salsa', { mode: 'tower', floor: f });
  await floorCleared(w, eco);
}

async function foundEcho(w) {
  const f = floor();
  await w.say(null, '¡Hachi encontró el sonido escondido del piso!');
  await floorCleared(w, w.actor('eco'));
}

async function floorCleared(w, eco) {
  const f = floor();
  state.setFlag(`tower_done_${f}`);
  if (eco) {
    audio.sfx('shatter');
    fx.notesBurst(w, eco.sprite.x, eco.sprite.y - 12, 16);
    w.tweens.add({ targets: eco.sprite, alpha: 0, scaleY: 1.6, duration: 600 });
    await w.wait(600);
    w.removeActor('eco');
  }
  // El piso recupera el color
  audio.sfx('note');
  w.flash(300, [255, 255, 255]);
  w.grade?.to(w, 1, 1500, 0);
  audio.setClarity(0.85, 1.5);
  fx.notesBurst(w, w.player.sprite.x, w.player.sprite.y - 20, 12);
  await w.wait(1200);
  await w.say(null, `¡El piso ${f} recuperó su color! El ascensor ya puede subir.`);
  w.save();
}

async function bossTalk(w) {
  const mk = w.actor('maestro');
  w.player.face('down');
  audio.stopSong(1);
  await w.wait(500);
  mk.face('up');
  await w.say('maestro', 'Has llegado lejos, Ray.');
  await w.say('maestro', 'Veamos si tu música es más fuerte que mi silencio.');
  await w.say('ray', 'Traigo cuatro notas, a Hachi y un táper de tallarines. Estoy listo.', 'normal');
  const res = await w.minigame('FinalBattle', {});
  state.setFlag('boss_beaten');
  await reveal(w);
}

// La revelación: el Maestro del Silencio es Tato
async function reveal(w) {
  const mk = w.actor('maestro');
  w.player.face('down');
  mk.face('up');
  audio.stopSong(0.5);
  audio.setAmbience(false);
  await w.wait(600);
  await w.say('maestro', '...Está bien. Me ganaste, Ray.', 'crack');
  audio.sfx('crack');
  w.shake(300, 0.004);
  await w.wait(500);
  audio.sfx('crack');
  w.shake(300, 0.006);
  await w.wait(500);
  // La máscara se rompe: destello blanco
  audio.sfx('shatter');
  w.flash(1200, [255, 255, 255]);
  const flash = w.add.rectangle(0, 0, 480, 270, 0xffffff).setOrigin(0).setScrollFactor(0).setDepth(9400);
  await w.wait(300);
  w.removeActor('maestro');
  const tato = w.spawn({ id: 'tato', char: 'tato', x: 10, y: 8, dir: 'up' });
  // Retrato grande de Tato
  const pt = w.add.image(240, 120, 'pt_tato_happy').setScrollFactor(0).setDepth(9450).setScale(0.5).setAlpha(0);
  audio.setClarity(1, 0.5);
  audio.playSong(TITLE, { fadeIn: 3, restart: true });
  w.grade?.set(1, 0);
  w.tweens.add({ targets: flash, alpha: 0, duration: 1500 });
  await fx.tween(w, { targets: pt, alpha: 1, scale: 2.2, duration: 900, ease: 'Back.Out' });
  fx.sparkles(w, 240, 120, 20, true);
  await w.wait(1400);
  await fx.tween(w, { targets: pt, alpha: 0, scale: 2.6, duration: 500 });
  pt.destroy();
  flash.destroy();
  w.emote(w.player, '!', 1000);
  w.emote(w.hachi, 'heart', 1400);
  audio.sfx('bark');
  await w.wait(800);
  await w.say('tato', 'Sorpresa, Ray. Soy yo, Tato.', 'happy');
  await w.say('tato', 'Este año no podía estar en Sullana, así que me metí al juego para acompañarte.', 'happy');
  await w.say('ray', '¿Tato? ...Con razón tanta bufanda del Barça.', 'surprised');
  await w.say('tato', 'Y el llavero de Lima. Y lo del desayuno. Y la carta... Sí, como villano no me va muy bien.', 'normal');
  await w.say('tato', 'Pero todo esto era para que hoy no te faltara nada: tu casa, tu fe, tu salsa y tus amigos. Esa es tu música, Ray.', 'happy');
  // Hachi salta a saludar a Tato
  await w.runDog(w.hachi, 10, 7, 80);
  w.hachi.face('down');
  fx.hearts(w, tato.sprite.x, tato.sprite.y - 16, 10);
  audio.sfx('bark');
  await w.say('tato', '¡Hachi! Tú sí me reconociste desde el principio, ¿no?', 'happy');
  await w.say('tato', 'Ahora anda a casa, hermano. Te están esperando. Yo te alcanzo... a mi manera.', 'happy');
  // La música vuelve a toda Sullana
  await w.say(null, 'Las cuatro Notas Legendarias brillan juntas... ¡y la música vuelve a toda Sullana!');
  audio.sfx('note');
  fx.notesBurst(w, w.player.sprite.x, w.player.sprite.y - 20, 30);
  fx.confetti(w, 2500);
  w.flash(800, [255, 240, 200]);
  await w.wait(2200);
  state.setFlag('tower_done');
  await w.goto('party', 'default', { white: true, fade: 1200 });
}
