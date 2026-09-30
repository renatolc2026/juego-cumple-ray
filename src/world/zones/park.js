import { state } from '../../core/state.js';
import { audio } from '../../core/audio.js';
import * as fx from '../../core/fx.js';
import { controls } from '../../core/input.js';
import { MapBuilder } from '../mapgen.js';

// ============================================================================
// Escena 2: el parque
// ============================================================================

const m = new MapBuilder(38, 24, 'g');
m.border('H');
m.sprinkle('g', ['h', 'h', 'f'], 0.12, 7);
// Camino desde la casa (abajo a la izquierda) hacia la plaza
m.rect(3, 12, 3, 12, 'p');
m.rect(3, 12, 10, 3, 'p');
// Plaza central
m.rect(12, 7, 14, 10, 'o');
// Camino hacia la iglesia (arriba a la derecha)
m.rect(25, 7, 8, 3, 'p');
m.rect(31, 0, 3, 10, 'p');
// Camino al sur de la plaza
m.rect(17, 17, 3, 5, 'p');
m.rect(3, 23, 3, 1, 'p');
const MAP = m.build();

const LOOSE_TOTAL = 3;

export default {
  id: 'park',
  title: 'El Parque',
  sub: 'Sullana, 10:00 a. m.',
  map: MAP,
  spawns: { default: { x: 4, y: 21, dir: 'up' } },

  objects: [
    { id: 'fountain', type: 'fountain', x: 17, y: 10, talk: (w) => fountainTalk(w) },
    { type: 'tree', x: 1, y: 1 }, { type: 'tree', x: 6, y: 2 }, { type: 'tree', x: 14, y: 1 },
    { type: 'tree', x: 20, y: 2 }, { type: 'tree', x: 26, y: 1 }, { type: 'tree', x: 35, y: 3 },
    { type: 'tree', x: 1, y: 7 }, { type: 'tree', x: 8, y: 18 }, { type: 'tree', x: 28, y: 19 },
    { type: 'tree', x: 34, y: 13 }, { type: 'tree', x: 12, y: 20 }, { type: 'tree', x: 23, y: 20 },
    { type: 'tree', x: 34, y: 20 }, { type: 'tree', x: 8, y: 7 },
    { type: 'palm', x: 10, y: 5 }, { type: 'palm', x: 26, y: 4 }, { type: 'palm', x: 10, y: 16 }, { type: 'palm', x: 26, y: 15 },
    { type: 'bench', x: 14, y: 16 }, { type: 'bench', x: 21, y: 16 },
    { type: 'bench', x: 13, y: 7, talk: (w) => w.say('ray', 'La banca de siempre. Aquí Hachi me trae la pelota mil veces.', 'happy') },
    { type: 'lamp', x: 12, y: 6 }, { type: 'lamp', x: 25, y: 6 }, { type: 'lamp', x: 12, y: 17 }, { type: 'lamp', x: 25, y: 17 },
    { id: 'cart', type: 'cart', x: 27, y: 11 },
    { type: 'flowers', x: 15, y: 13 }, { type: 'flowers', x: 20, y: 13 },
    { type: 'flowers', x: 7, y: 11 }, { type: 'flowers', x: 29, y: 10 }, { type: 'flowers', x: 2, y: 18 },
    { type: 'bin', x: 24, y: 7 }, { type: 'bin', x: 6, y: 15 },
    { type: 'sign', x: 6, y: 21, talk: (w) => w.say(null, '"Parque de Sullana. Prohibido estar triste en cumpleaños."') },
    { type: 'sign', x: 30, y: 2, talk: (w) => w.say(null, '"Iglesia: siga el camino hacia el norte."') },
  ],

  actors: () => [
    {
      id: 'vendedor', char: 'vendedor', x: 29, y: 12, dir: 'left', idle: 'look',
      talk: async (w) => {
        if (state.flag('park_masked')) {
          await w.say('vendedor', 'Vi pasar a un encapuchado corriendo como loco. Se tropezó con mi carrito y todo.', 'surprised');
          return;
        }
        await w.say('vendedor', '¡Raspadillas! ¡Raspadillas heladitas!... ¿Ves? No me sale ni el grito de vendedor.', 'sad');
        await w.say('vendedor', 'Pero feliz cumpleaños, Ray. Cuando vuelva la música, la raspadilla va por la casa.', 'happy');
      },
    },
    {
      id: 'nino', char: 'nino', x: 22, y: 14, dir: 'left', idle: 'look',
      talk: async (w) => {
        await w.say('nino', 'Quería bailar con la música del parque, pero no suena nada...', 'sad');
        await w.say('nino', '¡Tu perrito es bien bonito! ¿Busca cosas cuando le tiras la pelota?', 'happy');
      },
    },
    {
      id: 'vecina', char: 'vecina', x: 15, y: 8, dir: 'down', idle: 'look',
      talk: async (w) => {
        await w.say('vecina', '¡Ray! Feliz cumpleaños, hijito. ¿Tú también sientes que falta algo? Hasta los pajaritos están callados.', 'normal');
        if (!state.flag('park_masked')) await w.say('vecina', 'Hace rato vi unos brillitos por los arbolitos. ¿Serán notas perdidas?', 'surprised');
      },
    },
  ],

  hidden: [
    { id: 'park1', x: 7, y: 5, run: (w) => looseNote(w) },
    { id: 'park2', x: 31, y: 18, run: (w) => looseNote(w) },
    { id: 'park3', x: 2, y: 11, run: (w) => looseNote(w) },
  ],

  triggers: [
    {
      x: 31, y: 0, w: 3, h: 1,
      run: async (w) => {
        if (!state.flag('park_masked')) {
          await w.say('ray', 'Hachi quiere seguir jugando un rato más en el parque. Esos brillitos en el pasto...');
          await w.player.walk('D1');
          return;
        }
        await w.goto('garden', 'default');
      },
    },
    {
      x: 3, y: 23, w: 3, h: 1,
      run: async (w) => {
        await w.say('ray', 'La casa está por allá. Pero primero hay que recuperar la música.');
        await w.player.walk('U1');
      },
    },
  ],

  music: () => ({ song: 'PARK' }),

  onEnter: (w) => intro(w),
};

async function intro(w) {
  fx.titleCard(w, 'El Parque', 'Sullana, 10:00 a. m.');
  if (state.flag('park_intro')) return;
  state.setFlag('park_intro');
  await w.wait(900);
  await w.say(null, 'El parque de siempre. Ray y Hachi vienen aquí casi todas las tardes.');
  await w.say('ray', 'Qué silencio... Ni el agua de la pileta suena.', 'sad');
  audio.sfx('bark');
  w.emote(w.hachi, '!', 900);
  await w.say('hachi', '¡Guau! (Hachi olfatea el aire. Hay algo escondido por aquí.)', 'happy');
  w.hint(controls.isTouch ? 'Lanza la pelota con B cerca de los brillitos.' : 'Lanza la pelota con X cerca de los brillitos.', 5000);
}

async function looseNote(w) {
  const n = ['park1', 'park2', 'park3'].filter((id) => state.flag(`found_${id}`)).length;
  const tune = [[72, 76], [74, 77], [76, 79]][n - 1] || [72];
  for (const t of tune) {
    audio.note('bell', t, 0.4, 0.8);
    await w.wait(160);
  }
  fx.notesBurst(w, w.hachi.sprite.x, w.hachi.sprite.y - 10, 6);
  await w.say(null, `¡Hachi encontró una nota suelta! (${n} de ${LOOSE_TOTAL})`);
  if (n >= LOOSE_TOTAL) await maskedAppears(w);
}

async function fountainTalk(w) {
  if (state.flag('park_masked')) {
    await w.say(null, 'La pileta suena bajito. Las notas sueltas la despertaron un poco.');
    return;
  }
  await w.say(null, 'La pileta está quieta. Ni una gota.');
}

// Primera aparición del Maestro del Silencio
async function maskedAppears(w) {
  await w.wait(300);
  // La pileta canta un poquito
  audio.setClarity(0.5, 1.5);
  for (const t of [79, 83, 86, 91, 86]) {
    audio.note('bell', t, 0.5, 0.6);
    await w.wait(180);
  }
  fx.notesBurst(w, 19 * 16, 10 * 16, 16);
  await w.say(null, 'Las tres notas sueltas volaron hasta la pileta, que por un segundo volvió a cantar.');
  audio.sfx('whoosh');
  const mk = w.spawn({ id: 'maestro', char: 'maestro', x: 18, y: 5, dir: 'down', ghost: true });
  mk.sprite.setAlpha(0);
  w.tweens.add({ targets: mk.sprite, alpha: 1, duration: 600 });
  await w.pan(18, 8, 700);
  w.emote(w.player, '!', 900);
  w.emote(w.hachi, '!', 900);
  audio.sfx('bark');
  await mk.walk('D2', 300);
  await w.say('maestro', 'Soy el Maestro del Silencio. Nadie conoce mi verdadera identidad.');
  await w.say('ray', '¿Tú te llevaste la música de Sullana?', 'surprised');
  await w.say('maestro', 'Así es. Y esas notitas sueltas no te van a servir de nada, Ray.');
  await w.say('ray', '...¿Cómo sabes mi nombre?', 'surprised');
  await w.say('maestro', '¡Silencio! Si quieres la música, reúne las Notas Legendarias y sube a mi torre. ¡Adiós!');
  // Se da la vuelta... y se tropieza
  mk.face('up');
  await w.wait(300);
  audio.sfx('slip');
  await fx.tween(w, { targets: mk.sprite, angle: -90, y: mk.sprite.y - 2, duration: 350, ease: 'Quad.In' });
  w.shake(200, 0.005);
  w.emote(mk, 'sweat', 1200);
  await w.say('maestro', '¡Auch!');
  await w.wait(300);
  await fx.tween(w, { targets: mk.sprite, angle: 0, duration: 200 });
  mk.face('down');
  await w.say('maestro', '...Digo, ¡ja, ja, ja!');
  mk.face('right');
  const scarfX = mk.x;
  const scarfY = mk.y;
  await mk.walk('R6 U3', 110);
  w.tweens.add({ targets: mk.sprite, alpha: 0, duration: 300 });
  await w.wait(300);
  w.removeActor('maestro');
  // Dejó algo tirado
  const scarf = w.add.image(scarfX * 16 + 8, scarfY * 16 + 10, 'bufanda').setDepth(scarfY * 16 + 10);
  w.emote(w.hachi, '!', 800);
  audio.sfx('bark');
  await w.runDog(w.hachi, scarfX, scarfY + 1, 80);
  scarf.destroy();
  await w.runDog(w.hachi, w.player.x, w.player.y + 1, 80, true);
  w.follow();
  await w.say('hachi', '¡Guau! (Hachi te trae algo que se le cayó al enmascarado.)', 'happy');
  await w.clue('bufanda');
  await w.say('ray', '¿Una bufanda del Barça? Papá es hincha del Barça... pero papá está en el trabajo.', 'surprised');
  await w.say('ray', 'La torre... Bueno, la iglesia queda de camino. Quizá el coro sepa algo.', 'normal');
  state.setFlag('park_masked');
  w.save();
  w.hint('Sigue el camino hacia el norte (arriba a la derecha).', 4000);
}
