import { state } from '../../core/state.js';
import { audio } from '../../core/audio.js';
import * as fx from '../../core/fx.js';
import { MapBuilder } from '../mapgen.js';

// ============================================================================
// Escena 3: la Parroquia Santa Beatriz, en Lima (jardín exterior + interior con el coro)
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
  title: 'Parroquia Santa Beatriz',
  sub: 'Lima',
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
        await w.say('ray', 'La Plaza de Armas quedó en Sullana. El portal me trajo hasta Lima.');
        await w.player.walk('U1');
      },
    },
  ],
  music: () => ({ song: state.hasNote('fe') ? 'CHOIR' : 'PARK' }),
  onEnter: (w, spawn) => gardenEnter(w, spawn),
  objective: () => (state.hasNote('fe') ? 'Entra al portal del jardín' : 'Entra a la parroquia'),
};

async function gardenEnter(w, spawn) {
  if (spawn === 'default') {
    fx.titleCard(w, 'Parroquia Santa Beatriz', 'Lima');
    if (!state.flag('garden_intro')) {
      state.setFlag('garden_intro');
      await w.wait(900);
      await w.say('ray', '¿Lima? ¡Es la Parroquia Santa Beatriz! El portal de la plaza me trajo hasta aquí.', 'surprised');
      await w.say(null, 'Desde adentro no se escucha ni un canto. Algo le pasa al coro.');
    }
  }
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
    await w.say('ray', 'Otro portal... Se siente tranquilo, como un abrazo.', 'surprised');
    w.follow();
    w.emote(w.hachi, '!', 900);
    audio.sfx('bark1');
    w.save();
  }
}

async function enterPortal(w) {
  await w.goto('recuerdos', 'default', { portal: true, white: true });
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
  title: 'Parroquia Santa Beatriz',
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
  objective: () => {
    if (!state.flag('choir_asked')) return 'Habla con el coro';
    if (!state.hasNote('fe')) return 'Toca el órgano (a la izquierda)';
    return 'Sal de la parroquia';
  },
  onEnter: (w) => {
    fx.titleCard(w, 'Parroquia Santa Beatriz', 'El coro');
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
      mimi: 'Afuera, en el jardín, apareció un portal. Se siente como un abrazo.',
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
  await w.say('nicol', '¡Yo creo que es culpa del enmascarado que pasó hace rato!', 'surprised');
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
  await w.say('mimi', 'Cuando salgas, mira el jardín. Algo bonito te espera.', 'happy');
  w.save();
}
