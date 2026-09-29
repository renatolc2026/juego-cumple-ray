import { state } from '../../core/state.js';
import { audio } from '../../core/audio.js';
import * as fx from '../../core/fx.js';
import { MapBuilder } from '../mapgen.js';

// ============================================================================
// Escena 5: la Cueva del Código
// ============================================================================

const m = new MapBuilder(30, 20, '.');
m.rect(0, 0, 30, 1, '#');
m.rect(0, 0, 1, 20, '#');
m.rect(29, 0, 1, 20, '#');
m.rect(0, 19, 30, 1, '#');
for (let x = 1; x < 29; x++) m.set(x, 1, x % 3 === 0 ? 'G' : 'W');
m.sprinkle('.', [','], 0.06, 31);
m.rect(13, 4, 4, 15, '.');
const MAP = m.build();

const DEVS = [
  { id: 'ricardo', x: 8, y: 7, dir: 'right' },
  { id: 'bismark', x: 21, y: 7, dir: 'left' },
  { id: 'dev1', x: 5, y: 11, dir: 'right' },
  { id: 'dev2', x: 24, y: 11, dir: 'left' },
  { id: 'dev3', x: 10, y: 14, dir: 'up' },
];

export default {
  id: 'cave',
  title: 'La Cueva del Código',
  sub: 'Piura, versión 2.0',
  map: MAP,
  bg: '#0a1210',
  legend: { '#': 'caveTop', W: 'caveWall', G: 'caveWallGlyph', '.': 'cave', ',': 'cave2' },
  spawns: { default: { x: 14, y: 17, dir: 'up' } },
  objects: [
    { id: 'frozen', type: 'portalFrozen', x: 14, y: 3, when: () => !state.flag('cave_fixed'), talk: (w) => portalTalk(w) },
    { id: 'portalTower', type: 'portal', x: 14, y: 3, when: () => state.flag('cave_fixed'), talk: (w) => portalTalk(w) },
    { id: 'bug', type: 'bug', x: 16, y: 5, when: () => !state.flag('cave_fixed'), talk: (w) => w.say(null, 'Un bug gigante. Cada vez que se mueve, el portal se congela un poquito más.') },
    { type: 'terminal', x: 5, y: 3, talk: (w) => w.say(null, 'La pantalla dice: "ERROR 36: la música no fue encontrada".') },
    { type: 'terminal', x: 22, y: 3, talk: (w) => w.say(null, '"while (silencio) { esperar(); }"... Qué código más triste.') },
    { type: 'server', x: 2, y: 3 }, { type: 'server', x: 3, y: 3 },
    { type: 'server', x: 26, y: 3 }, { type: 'server', x: 27, y: 3 },
    { type: 'crystal', x: 3, y: 15 }, { type: 'crystal', x: 26, y: 16 }, { type: 'crystal', x: 7, y: 17 },
    { type: 'crystal', x: 22, y: 14 }, { type: 'crystal', x: 1, y: 8 }, { type: 'crystal', x: 28, y: 9 },
    { type: 'cable', x: 6, y: 5 }, { type: 'cable', x: 20, y: 5 }, { type: 'cable', x: 17, y: 10 },
  ],
  actors: () => {
    const list = DEVS.map((d) => ({ ...d, char: d.id, idle: 'look', talk: (w) => devTalk(w, d.id) }));
    if (state.flag('friends_joined')) {
      list.push({ id: 'cesar', char: 'cesar', x: 12, y: 12, dir: 'up', idle: 'look', talk: (w) => w.say('cesar', '¡Dale, Ray! Nosotros te esperamos con todo listo.', 'happy') });
      list.push({ id: 'elbers', char: 'elbers', x: 17, y: 12, dir: 'up', idle: 'look', talk: (w) => w.say('elbers', 'Si ves al enmascarado, dile que nadie le gana a este grupo.', 'happy') });
      list.push({ id: 'martin', char: 'martin', x: 15, y: 13, dir: 'up', idle: 'look', talk: (w) => w.say('martin', 'Ve nomás, causa. Hachi te cuida.', 'happy') });
    }
    return list;
  },
  triggers: [
    {
      x: 14, y: 4, w: 2, h: 1,
      when: () => state.flag('cave_fixed') && state.hasNote('amistad'),
      run: (w) => w.goto('tower', 'default', { portal: true }),
    },
  ],
  music: () => ({ song: 'CODE' }),
  onEnter: (w) => intro(w),
  update: (w, time) => {
    const bug = w.obj('bug');
    if (bug) bug.sprite.x = (16 * 16 + 8) + Math.sin(time / 300) * 3;
  },
};

async function intro(w) {
  fx.titleCard(w, 'La Cueva del Código', 'Piura, versión 2.0');
  if (state.flag('cave_intro')) return;
  state.setFlag('cave_intro');
  await w.wait(900);
  await w.say('ray', 'Esto parece... ¿el grupo de programadores de Piura?', 'surprised');
}

async function devTalk(w, id) {
  if (state.flag('cave_fixed')) {
    const lines = {
      ricardo: '¡Compiló a la primera! Eso nunca pasa. Feliz cumpleaños, Ray.',
      bismark: 'Hay que celebrar con un buen deploy... y con torta.',
      dev1: '¡Ya se escucha la música en mis audífonos!',
      dev2: 'Te debemos una, Ray. El portal ya funciona.',
      dev3: 'Commit: "arreglado por Ray, el cumpleañero".',
    };
    await w.say(id, lines[id], 'happy');
    return;
  }
  if (!state.flag('cave_asked')) {
    await caveScene(w);
    return;
  }
  await w.say(id, 'Anda al portal congelado y reordena las instrucciones, Ray.', 'normal');
}

async function caveScene(w) {
  state.setFlag('cave_asked');
  await w.say('ricardo', '¡Ray! Estamos atrapados. Un bug congeló el portal que lleva a la Torre del Silencio.', 'sad');
  await w.say('bismark', 'Llevamos horas debuggeando. Sin música no hay concentración, causa.', 'sad');
  await w.say('dev2', 'El código del portal está todo desordenado. Hay que ponerlo en el orden correcto.', 'normal');
  // El enmascarado aparece junto al portal
  audio.sfx('glitch');
  const mk = w.spawn({ id: 'maestro', char: 'maestro', x: 17, y: 4, dir: 'down', ghost: true });
  mk.sprite.setAlpha(0);
  w.tweens.add({ targets: mk.sprite, alpha: 1, duration: 300 });
  await w.pan(16, 6, 600);
  DEVS.forEach((d) => w.emote(d.id, '!', 900));
  w.emote(w.player, '!', 900);
  await w.wait(500);
  await w.say('maestro', 'Ese bug lo programé yo mismo.');
  await w.wait(300);
  await w.say('maestro', 'Bueno... en realidad me salió sin querer.');
  await w.say('ricardo', '¿Sin querer? Clásico.', 'normal');
  await w.say('maestro', '¡Silencio! Nos vemos en la torre, Ray.');
  // Se le cae un papelito al irse
  const px = mk.x;
  const py = mk.y + 1;
  audio.sfx('glitch');
  fx.sparkles(w, mk.sprite.x, mk.sprite.y - 12, 12);
  w.removeActor('maestro');
  const note = w.add.image(px * 16 + 8, py * 16 + 8, 'postit').setDepth(py * 16 + 8);
  w.follow();
  await w.wait(300);
  w.emote(w.hachi, '!', 800);
  audio.sfx('bark');
  await w.runDog(w.hachi, px, py, 70);
  note.destroy();
  await w.runDog(w.hachi, w.player.x, w.player.y + 1, 70, true);
  await w.clue('postit');
  await w.say('ray', '"No olvidar: torta para Ray. Y tallarines." ...¿Por qué el villano anota mi torta?', 'surprised');
  await w.say('ricardo', 'Ray, el portal. ¡Tú puedes ordenar ese código!', 'normal');
  w.save();
  await portalTalk(w);
}

async function portalTalk(w) {
  if (state.flag('cave_fixed')) {
    if (!state.hasNote('amistad')) return;
    await w.goto('tower', 'default', { portal: true });
    return;
  }
  if (!state.flag('cave_asked')) {
    await w.say(null, 'Un portal congelado. Tiene un letrero rojo: "ERROR".');
    return;
  }
  const r = await w.ask('ray', '¿Reordenar el código del portal?', ['Sí', 'Todavía no']);
  if (r !== 0) return;
  await w.minigame('Code', {}, 'fade');
  // El bug explota y el portal se descongela
  state.setFlag('cave_fixed');
  const bug = w.obj('bug');
  audio.sfx('glitch');
  w.tweens.add({ targets: bug.sprite, scale: 1.8, alpha: 0, angle: 180, duration: 600 });
  fx.sparkles(w, bug.sprite.x, bug.sprite.y - 6, 20);
  await w.wait(600);
  w.removeObject('bug');
  w.flash(400, [180, 255, 200]);
  audio.sfx('success');
  w.removeObject('frozen');
  const p = w.addObject({ id: 'portalTower', type: 'portal', x: 14, y: 3, talk: (ww) => portalTalk(ww) });
  p.sprite.setScale(0.2);
  await fx.tween(w, { targets: p.sprite, scale: 1, duration: 600, ease: 'Back.Out' });
  audio.setClarity(0.9, 1);
  DEVS.forEach((d) => w.emote(d.id, 'note', 1500));
  await w.say('ricardo', '¡Compiló! ¡El portal funciona!', 'happy');
  await friendsArrive(w);
}

async function friendsArrive(w) {
  await w.wait(400);
  await w.say(null, '¡Se escuchan pasos que vienen de la entrada!');
  const cesar = w.spawn({ id: 'cesar', char: 'cesar', x: 13, y: 19, dir: 'up' });
  const elbers = w.spawn({ id: 'elbers', char: 'elbers', x: 14, y: 19, dir: 'up' });
  const martin = w.spawn({ id: 'martin', char: 'martin', x: 15, y: 19, dir: 'up' });
  await w.pan(14, 14, 600);
  await Promise.all([cesar.walk('U5', 180), elbers.walk('U5', 180), martin.walk('U4', 180)]);
  w.player.face('down');
  await w.say('cesar', '¡Ray! ¡Te encontramos! ¡Feliz cumpleaños, causa!', 'happy');
  await w.say('elbers', 'Nos enteramos de que andabas recuperando la música. ¿Y creías que te íbamos a dejar solo?', 'happy');
  await w.say('martin', 'Los de siempre, pues. Donde va Ray, vamos nosotros.', 'happy');
  await w.say('ray', 'Gracias, muchachos. De verdad.', 'happy');
  fx.hearts(w, w.player.sprite.x, w.player.sprite.y - 20, 8);
  state.setFlag('friends_joined');
  await w.getNote('amistad');
  await w.say('cesar', '¡Cuatro notas! Ya tienes todas. Ahora sí, a la torre.', 'happy');
  await w.say('martin', 'Nosotros vamos preparando todo en tu casa. Tú encárgate del enmascarado.', 'normal');
  w.follow();
  w.save();
  w.hint('Entra al portal (arriba) para ir a la Torre del Silencio.', 4000);
}
