import { state } from '../../core/state.js';
import { audio } from '../../core/audio.js';
import * as fx from '../../core/fx.js';
import { txt, panel } from '../../core/text.js';
import { bdaySong, BDAY_LYRICS, PARTY } from '../../core/songs.js';
import home from './home.js';

// ============================================================================
// Final: la fiesta en la casa de Sullana
// ============================================================================

const GUESTS = [
  { id: 'papa', x: 12, y: 8, dir: 'right' },
  { id: 'mama', x: 12, y: 9, dir: 'right' },
  { id: 'cesar', x: 19, y: 8, dir: 'left' },
  { id: 'elbers', x: 19, y: 9, dir: 'left' },
  { id: 'martin', x: 19, y: 10, dir: 'left' },
  { id: 'sharon', x: 12, y: 11, dir: 'right' },
  { id: 'juanmi', x: 13, y: 5, dir: 'down' },
  { id: 'anita', x: 14, y: 5, dir: 'down' },
  { id: 'mariana', x: 15, y: 4, dir: 'down' },
  { id: 'nicol', x: 16, y: 4, dir: 'down' },
  { id: 'angela', x: 17, y: 5, dir: 'down' },
  { id: 'mimi', x: 18, y: 5, dir: 'down' },
  { id: 'ricardo', x: 11, y: 12, dir: 'right' },
  { id: 'bismark', x: 20, y: 12, dir: 'left' },
  { id: 'dev1', x: 20, y: 6, dir: 'left' },
  { id: 'dev2', x: 11, y: 6, dir: 'right' },
  { id: 'dev3', x: 20, y: 11, dir: 'left' },
];

export default {
  id: 'party',
  map: home.map,
  legend: home.legend,
  noSave: false,
  spawns: { default: { x: 15, y: 14, dir: 'up' } },
  objects: [
    { type: 'bed', x: 1, y: 2 },
    { type: 'nightstand', x: 2, y: 2 },
    { type: 'desk', x: 5, y: 2 },
    { type: 'bookshelf', x: 8, y: 2 },
    { type: 'barcaPoster', x: 7, y: 1 },
    { type: 'piano', x: 10, y: 2 },
    { type: 'tv', x: 16, y: 2 },
    { type: 'banner', x: 12, y: 1, fw: 6, oy: -2 },
    { type: 'crossWall', x: 20, y: 1 },
    { type: 'plant', x: 21, y: 2 },
    { type: 'rug', x: 14, y: 7, fw: 3, fh: 2 },
    { id: 'table', type: 'partyTable', x: 14, y: 8, fw: 4 },
    { type: 'balloons', x: 10, y: 7 }, { type: 'balloons', x: 21, y: 7 },
    { type: 'balloons', x: 10, y: 13 }, { type: 'balloons', x: 21, y: 13 },
    { type: 'counter', x: 23, y: 2 }, { type: 'stove', x: 24, y: 2 }, { type: 'counter', x: 25, y: 2 }, { type: 'fridge', x: 28, y: 2 },
    { type: 'table', x: 24, y: 4 },
    { type: 'flowers', x: 2, y: 11 }, { type: 'flowers', x: 6, y: 13 }, { type: 'flowers', x: 24, y: 12 },
    { type: 'balloons', x: 4, y: 11 }, { type: 'balloons', x: 26, y: 11 },
  ],
  actors: () => {
    const list = GUESTS.map((g) => ({ ...g, char: g.id }));
    list.push({ id: 'micha', char: 'micha', x: 16, y: 7, dir: 'down', depthBias: 2 });
    list.push({ id: 'shiro', char: 'shiro', x: 13, y: 13, dir: 'right' });
    return list;
  },
  music: () => ({ song: null, clarity: 1 }),
  saturation: () => 1,
  onEnter: (w) => partyScene(w),
};

// Ventanita de videollamada con Tato y Aurora
function videoCall(w) {
  const c = w.add.container(0, 0).setScrollFactor(0).setDepth(9200);
  c.add(panel(w, 300, 8, 172, 94, 'panelGold'));
  c.add(w.add.rectangle(306, 14, 160, 70, 0x8fd3ff).setOrigin(0));
  c.add(w.add.rectangle(306, 58, 160, 26, 0x6cc251).setOrigin(0));
  c.add(w.add.image(348, 49, 'pt_tato_happy').setScale(1));
  c.add(w.add.image(422, 49, 'pt_aurora_happy').setScale(1));
  const rec = w.add.circle(316, 22, 3, 0xe8505b);
  w.tweens.add({ targets: rec, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });
  c.add(rec);
  c.add(txt(w, 386, 90, 'Videollamada · Lima', { origin: 0.5, color: '#ffd166' }));
  c.setAlpha(0);
  w.tweens.add({ targets: c, alpha: 1, duration: 400 });
  return c;
}

async function partyScene(w) {
  const all = () => GUESTS.map((g) => w.actor(g.id));
  // Todos esperan escondidos en la oscuridad
  const dark = w.add.rectangle(0, 0, w.mapW * 16, w.mapH * 16, 0x05030c, 0.8).setOrigin(0).setDepth(5000);
  audio.setAmbience(false);
  audio.setClarity(1, 0.1);
  w.player.face('up');
  await w.wait(900);
  await w.say('ray', '¿Hola? ¿Por qué está todo apagado...?', 'surprised');
  await w.wait(300);
  // ¡Sorpresa!
  audio.sfx('flash');
  w.tweens.add({ targets: dark, alpha: 0, duration: 200, onComplete: () => dark.destroy() });
  w.flash(300, [255, 255, 255]);
  fx.confetti(w, 3500);
  audio.sfx('confetti');
  audio.playSong(PARTY, { fadeIn: 0.2, restart: true });
  all().forEach((a) => {
    a.setFrame(16);
    a.hop(2, 6);
  });
  await w.say(null, '¡¡SORPRESA!!');
  all().forEach((a) => a.face(a.def.dir));
  w.emote(w.player, '!', 1000);
  w.emote(w.hachi, 'heart', 1200);
  audio.sfx('bark');
  await w.wait(600);
  await w.say('mama', '¡Hijito! Te hicimos tallarines... ¡un plato gigante! Y tu torta, claro.', 'happy');
  await w.say('papa', 'El Barça ganó, la música volvió y mi hijo cumple 36. Día perfecto.', 'happy');
  await w.say('sharon', '¡Y trajimos la salsa a domicilio!', 'happy');
  await w.say('anita', 'El coro completo vino a cantarte.', 'happy');
  await w.say('ricardo', 'Nosotros trajimos el parlante. Probado y sin bugs.', 'happy');
  await w.say('cesar', 'Y nosotros... bueno, nosotros trajimos el hambre.', 'happy');
  // Videollamada
  audio.sfx('ding');
  await w.say(null, 'El celular sobre la mesa empieza a sonar. ¡Es una videollamada!');
  const call = videoCall(w);
  await w.wait(500);
  await w.say('tato', '¡Feliz cumpleaños, hermano! Aquí estamos, conectados desde Lima.', 'happy');
  await w.say('aurora', '¡Feliz cumpleaños, Ray! Tato no paraba de hablar de este juego.', 'happy');
  await w.say('tato', 'Ahora sí... la canción de las cinco de la mañana quedó a medias, ¿no?', 'happy');
  audio.stopSong(1);
  await w.say('papa', 'Es verdad. Esta vez la terminamos.', 'happy');
  await w.say('mama', '¡Todos juntos! A la una, a las dos...', 'happy');
  // La canción completa, todos juntos
  const song = bdaySong({ full: true, voices: 2 });
  const inst = audio.playSong(song, { loop: false, fadeIn: 0.05, restart: true });
  const spStep = 60 / song.bpm / song.stepsPerBeat;
  const bobs = all().map((a) => w.tweens.add({ targets: a.sprite, scaleY: 0.92, duration: 312, yoyo: true, repeat: -1, ease: 'Sine.InOut' }));
  BDAY_LYRICS.forEach((l, i) => {
    const text = i === 2 ? 'te deseamos, Ray' : l.text;
    w.time.delayedCall(l.step * spStep * 1000 + 100, () => {
      w.lyric(text, 3300);
      fx.notesBurst(w, 15.5 * 16, 8 * 16, 10);
    });
  });
  const total = song.totalSteps * spStep * 1000;
  await w.wait(total - 1400);
  // ¡Final con confeti!
  fx.confetti(w, 4000);
  audio.sfx('confetti');
  all().forEach((a) => {
    a.setFrame(16);
    a.hop(3, 8);
  });
  w.player.setFrame(16);
  w.player.hop(3, 8);
  audio.sfx('bark');
  bobs.forEach((b) => b.stop());
  await w.wait(1600);
  audio.playSong(PARTY, { fadeIn: 1, restart: true });
  await w.say(null, '¡¡FELIZ CUMPLEAÑOS, RAY!!');
  w.tweens.add({ targets: call, alpha: 0, duration: 500 });
  await w.say('ray', 'Gracias a todos. De verdad... esta es la mejor música del mundo.', 'happy');
  await w.wait(800);
  state.setFlag('party_done');
  audio.stopSong(2);
  await w.fadeOut(1800);
  w.scene.start('Ending');
}
