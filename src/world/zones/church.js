import { state } from '../../core/state.js';
import { audio } from '../../core/audio.js';
import * as fx from '../../core/fx.js';
import { MapBuilder } from '../mapgen.js';
import { MUSICBOX } from '../../core/songs.js';

// ============================================================================
// Escena 3: la iglesia (jardín exterior + interior con el coro)
// ============================================================================

// ---------------------------------------------------------------- Jardín
const g = new MapBuilder(30, 20, 'g');
g.border('H');
g.sprinkle('g', ['h', 'f', 'f'], 0.14, 21);
g.rect(1, 1, 28, 5, 'o'); // atrio frente a la fachada
g.rect(13, 6, 4, 14, 'o'); // camino central
g.rect(17, 11, 7, 2, 'o'); // camino hacia la banca
g.rect(5, 11, 8, 2, 'o'); // camino hacia el portal
g.rect(14, 19, 2, 1, 'o');
const GARDEN = g.build();

export const garden = {
  id: 'garden',
  title: 'La Iglesia',
  sub: 'El jardín',
  map: GARDEN,
  spawns: {
    default: { x: 14, y: 18, dir: 'up' },
    fromChurch: { x: 14, y: 6, dir: 'down' },
  },
  objects: [
    { id: 'facade', type: 'churchFacade', x: 11, y: 3, solid: false },
    { type: 'tree', x: 22, y: 8 },
    { type: 'tree', x: 2, y: 15 }, { type: 'tree', x: 25, y: 15 }, { type: 'tree', x: 6, y: 6 },
    { type: 'palm', x: 1, y: 6 }, { type: 'palm', x: 27, y: 6 },
    { id: 'hcj', type: 'benchHCJ', x: 22, y: 11, talk: (w) => benchHCJ(w) },
    { type: 'flowers', x: 21, y: 13 }, { type: 'flowers', x: 24, y: 13 }, { type: 'flowers', x: 20, y: 10 },
    { type: 'flowers', x: 11, y: 8 }, { type: 'flowers', x: 17, y: 8 }, { type: 'flowers', x: 11, y: 15 }, { type: 'flowers', x: 17, y: 15 },
    { type: 'hedgeObj', x: 9, y: 17 }, { type: 'hedgeObj', x: 19, y: 17 },
    { type: 'lamp', x: 12, y: 5 }, { type: 'lamp', x: 17, y: 5 },
    { id: 'portal', type: 'portal', x: 5, y: 10, when: () => state.flag('portal_salsa'), talk: (w) => enterPortal(w) },
  ],
  // La fachada bloquea excepto la puerta
  blocked: (w, x, y) => (y === 3 || y === 4) && x >= 11 && x <= 17 && !(y === 4 && (x === 14 || x === 15)),
  triggers: [
    {
      x: 14, y: 4, w: 2, h: 1,
      run: async (w) => {
        audio.sfx('door');
        await w.goto('church', 'default', { fade: 400 });
      },
    },
    {
      x: 5, y: 11, w: 2, h: 2,
      when: () => state.flag('portal_salsa'),
      run: (w) => enterPortal(w),
    },
    {
      x: 14, y: 19, w: 2, h: 1,
      run: async (w) => {
        await w.say('ray', 'El parque queda por allá. Pero el camino sigue por aquí.');
        await w.player.walk('U1');
      },
    },
  ],
  music: () => ({ song: state.hasNote('fe') ? 'CHOIR' : 'PARK' }),
  onEnter: (w, spawn) => gardenEnter(w, spawn),
};

async function gardenEnter(w, spawn) {
  if (spawn === 'default') fx.titleCard(w, 'La Iglesia', 'Sullana');
  if (state.hasNote('fe') && !state.flag('portal_salsa')) {
    await w.wait(600);
    // Aparece el portal musical
    audio.sfx('flash');
    w.flash(400, [255, 220, 255]);
    state.setFlag('portal_salsa');
    const p = w.addObject({ id: 'portal', type: 'portal', x: 5, y: 10, talk: (ww) => enterPortal(ww) });
    p.sprite.setScale(0.1);
    await w.pan(6, 11, 600);
    await fx.tween(w, { targets: p.sprite, scale: 1, duration: 800, ease: 'Back.Out' });
    fx.notesBurst(w, p.sprite.x, p.sprite.y - 20, 18);
    audio.sfx('chime');
    await w.wait(500);
    await w.say('ray', '¿Un portal? Suena a... ¿salsa? ¡Esa es la academia de Sharon!', 'surprised');
    w.follow();
    if (!state.flag('bench_done')) {
      await w.wait(200);
      w.emote(w.hachi, '!', 900);
      await w.say(null, 'Hachi mira hacia la banca del jardín, junto al algarrobo.');
    }
    w.save();
  }
}

async function enterPortal(w) {
  if (!state.flag('bench_done')) {
    audio.sfx('bark');
    await w.say(null, 'Hachi se sienta y jala hacia la banca del jardín. Parece que quiere que descanses un ratito antes de irte.');
    await w.player.walk('R1');
    return;
  }
  await w.goto('salsa', 'default', { portal: true, white: true });
}

// Momento del abuelito Humberto: banca con placa "HCJ"
async function benchHCJ(w) {
  if (state.flag('bench_done')) {
    await w.say(null, 'La banca con la placa "HCJ". Todavía se siente calientita.');
    return;
  }
  const r = await w.ask(null, 'Una banca de madera con una placa discreta que dice "HCJ". ¿Te sientas un ratito?', ['Sí', 'Ahora no']);
  if (r !== 0) return;
  const p = w.player;
  // Ray se sienta en la banca
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
  const light = w.add.image(bench.sprite.x, bench.sprite.y - 12, 'light').setBlendMode('ADD').setDepth(8000).setAlpha(0).setScale(2.5);
  w.tweens.add({ targets: light, alpha: 0.75, duration: 2500 });
  w.tweens.add({ targets: light, scale: 2.8, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  const motes = w.add.particles(bench.sprite.x, bench.sprite.y, 'sparkle', {
    x: { min: -40, max: 40 },
    speedY: { min: -8, max: -20 },
    lifespan: 3000,
    frequency: 180,
    alpha: { start: 0.9, end: 0 },
    scale: { start: 0.6, end: 0.2 },
    tint: [0xffe9a0, 0xffffff, 0xffd166],
  }).setDepth(8001);
  const prevSat = w.grade?.state.sat ?? 1;
  w.setSat(1, 2500);
  await w.wait(2800);
  await w.say(null, 'Una brisa cálida te rodea. Sientes que alguien te acompaña y está orgulloso de ti.', 'normal', { speed: 45 });
  await w.wait(600);
  await w.give('bendicion', 1, 'Recupera todo el ánimo en la batalla final');
  state.setFlag('bench_done');
  await w.wait(800);
  motes.stop();
  w.tweens.add({ targets: light, alpha: 0, duration: 1500, onComplete: () => light.destroy() });
  w.setSat(prevSat, 1500);
  await w.wait(1200);
  motes.destroy();
  // Se levanta
  p.place(p.x, p.y);
  if (w.hachi) {
    w.hachi.place(w.hachi.x, w.hachi.y);
    w.hachi.face(p.dir);
  }
  w.startZoneMusic();
  audio.setAmbience(true);
  w.save();
}

// ---------------------------------------------------------------- Interior
const c = new MapBuilder(24, 20, 's');
c.rect(0, 0, 24, 1, '#');
c.rect(0, 0, 1, 20, '#');
c.rect(23, 0, 1, 20, '#');
c.rect(0, 19, 24, 1, '#');
for (let x = 1; x < 23; x++) c.set(x, 1, x % 4 === 2 ? 'w' : 'W');
c.rect(1, 2, 22, 17, '.');
c.rect(11, 5, 2, 14, 'r'); // alfombra central
c.rect(11, 19, 2, 1, '.');
const CHURCH = c.build();

const CHOIR_IDS = ['juanmi', 'anita', 'mariana', 'nicol', 'angela', 'mimi'];

export const church = {
  id: 'church',
  title: 'La Iglesia',
  sub: 'El coro',
  map: CHURCH,
  legend: { W: 'wallChurch', w: 'wallChurchWin', '#': 'wallChurchTop', '.': 'stone', r: 'carpet' },
  spawns: { default: { x: 11, y: 17, dir: 'up' } },
  objects: [
    { type: 'bigCross', x: 11, y: 1, ox: 8 },
    { id: 'altar', type: 'altar', x: 10, y: 3 },
    { type: 'candle', x: 8, y: 3 }, { type: 'candle', x: 15, y: 3 },
    { type: 'candle', x: 3, y: 2 }, { type: 'candle', x: 20, y: 2 },
    { id: 'organ', type: 'organ', x: 2, y: 4, talk: (w) => organTalk(w) },
    { type: 'pew', x: 4, y: 9 }, { type: 'pew', x: 4, y: 11 }, { type: 'pew', x: 4, y: 13 }, { type: 'pew', x: 4, y: 15 },
    { type: 'pew', x: 15, y: 9 }, { type: 'pew', x: 15, y: 11 }, { type: 'pew', x: 15, y: 13 }, { type: 'pew', x: 15, y: 15 },
    { type: 'plant', x: 21, y: 4 }, { type: 'plant', x: 1, y: 17 }, { type: 'plant', x: 22, y: 17 },
  ],
  actors: () => {
    const pos = [[7, 6], [8, 6], [9, 6], [14, 6], [15, 6], [16, 6]];
    return CHOIR_IDS.map((id, i) => ({
      id, char: id, x: pos[i][0], y: pos[i][1], dir: 'down', idle: state.hasNote('fe') ? 'bob' : 'look',
      talk: (w) => choirTalk(w, id),
    }));
  },
  triggers: [
    {
      x: 11, y: 19, w: 2, h: 1,
      run: async (w) => {
        if (!state.flag('choir_asked')) {
          await w.say('ray', 'El coro está allá adelante. Mejor saludo primero.');
          await w.player.walk('U1');
          return;
        }
        if (!state.hasNote('fe')) {
          await w.say('ray', 'No puedo irme sin ayudar al coro.');
          await w.player.walk('U1');
          return;
        }
        audio.sfx('door');
        await w.goto('garden', 'fromChurch', { fade: 400 });
      },
    },
  ],
  music: () => ({ song: 'CHOIR' }),
  onEnter: (w) => {
    fx.titleCard(w, 'La Iglesia', 'El coro');
    return null;
  },
};

async function choirTalk(w, id) {
  if (state.hasNote('fe')) {
    const lines = {
      juanmi: '¡Gracias, Ray! Esta noche cantamos en tu honor. Bueno, cuando vuelva toda la música.',
      anita: 'Esa melodía que tocaste nos llegó al alma.',
      mariana: '¡Feliz cumpleaños! Te lo cantamos completito cuando todo vuelva a la normalidad.',
      nicol: 'Dios te bendiga, Ray. Ve con cuidado a esa torre.',
      angela: 'El coro ya afinó. Solo falta que el resto del mundo también afine.',
      mimi: 'Antes de irte, pasa por el jardín. La banca junto al algarrobo siempre está calentita.',
    };
    await w.say(id, lines[id], 'happy');
    return;
  }
  if (!state.flag('choir_asked')) {
    await choirScene(w);
    return;
  }
  await w.say(id, 'El órgano está a la izquierda, Ray. ¡Tú puedes!', 'normal');
}

async function choirScene(w) {
  state.setFlag('choir_asked');
  const a = (id) => w.actor(id);
  CHOIR_IDS.forEach((id) => a(id).faceTo(w.player));
  await w.say('juanmi', '¡Ray! Qué bueno que viniste. Tenemos un problemón: no podemos cantar.', 'sad');
  await w.say('anita', 'Abrimos la boca y... nada. Ni un "la".', 'sad');
  await w.say('mariana', '¡Y justo hoy! Te habíamos preparado una canción por tu cumpleaños.', 'sad');
  await w.say('nicol', 'Nicol dice que es culpa del enmascarado que pasó hace rato...', 'surprised');
  // Aparece el enmascarado detrás del órgano
  audio.sfx('whoosh');
  const mk = w.spawn({ id: 'maestro', char: 'maestro', x: 4, y: 6, dir: 'right', ghost: true });
  mk.sprite.setAlpha(0);
  w.tweens.add({ targets: mk.sprite, alpha: 1, duration: 400 });
  await w.wait(400);
  CHOIR_IDS.forEach((id) => w.emote(id, '!', 900));
  w.emote(w.player, '!', 900);
  if (w.hachi) {
    w.emote(w.hachi, '!', 900);
    audio.sfx('bark');
  }
  w.player.face('left');
  await w.wait(700);
  await w.say('maestro', 'Ray, ¿ya tomaste tu desayuno?');
  await w.wait(300);
  w.emote(mk, 'sweat', 1000);
  await w.say('maestro', '...Digo, ¡tiembla ante el silencio!');
  audio.sfx('flash');
  fx.sparkles(w, mk.sprite.x, mk.sprite.y - 12, 16);
  w.removeActor('maestro');
  await w.wait(500);
  await w.say('ray', '¿Por qué le importa tanto si tomé desayuno...?', 'surprised');
  await w.say('angela', 'Qué personaje más raro. Oye, Ray... tú tocas el piano, ¿no?', 'normal');
  await w.say('mimi', '¡Si tocas una melodía en el órgano, quizá la música despierte!', 'happy');
  await w.say('ray', 'Puedo intentarlo.', 'happy');
  w.save();
  await organTalk(w);
}

async function organTalk(w) {
  if (state.hasNote('fe')) {
    await w.say(null, 'El órgano brilla suavemente. Ya cumplió su misión.');
    return;
  }
  if (!state.flag('choir_asked')) {
    await w.say('ray', 'El órgano de la iglesia. Tampoco suena...');
    return;
  }
  const r = await w.ask('ray', '¿Tocar la melodía en el órgano?', ['¡Vamos!', 'Todavía no']);
  if (r !== 0) return;
  await w.minigame('Piano', {});
  // Ganó: el coro vuelve a cantar
  CHOIR_IDS.forEach((id) => {
    const ac = w.actor(id);
    w.tweens.add({ targets: ac.sprite, scaleY: 0.94, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    w.emote(ac, 'note', 2500);
  });
  audio.setClarity(1, 1.5);
  w.music('CHOIR', { restart: true });
  await w.wait(1500);
  await w.say('juanmi', '¡Podemos cantar! ¡Escuchen!', 'happy');
  fx.notesBurst(w, 11 * 16, 6 * 16, 20);
  await w.wait(800);
  await w.getNote('fe');
  await w.say('anita', 'Una Nota Legendaria... ¡la Nota de la Fe! Llévala contigo, Ray.', 'happy');
  await w.say('mimi', 'Antes de irte, pasa por el jardín. La banca junto al algarrobo siempre está calentita.', 'happy');
  w.save();
}
