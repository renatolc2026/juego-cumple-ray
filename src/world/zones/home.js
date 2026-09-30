import { state } from '../../core/state.js';
import { audio } from '../../core/audio.js';
import { bdaySong, BDAY_LYRICS } from '../../core/songs.js';
import * as fx from '../../core/fx.js';
import { txt } from '../../core/text.js';
import { controls } from '../../core/input.js';

// ============================================================================
// Prólogo: la casa de Sullana
// ============================================================================

const MAP = [
  '##############################',
  '#WWwWWWWW#WWWWWwWWWWWW#WwWWWW#',
  '#........#............#,,,,,,#',
  '#........#............#,,,,,,#',
  '#........#............#,,,,,,#',
  '#........#............#,,,,,,#',
  '#.....................,,,,,,,#',
  '#........#............#,,,,,,#',
  '##########............########',
  '#EEeEEEEE#............#EEeEEE#',
  '#ggggggggg............ggggggg#',
  '#gfggghgg#............#ggfggg#',
  '#ggggggfg#............#gggggh#',
  '#hgggfggg#............#gfgggg#',
  '#gggggggg#............#ggggfg#',
  '###############..#############',
  'ggggggggggggggpppggggggggggggg',
];

const touchWord = () => (controls.isTouch ? 'la cruceta' : 'las flechas o WASD');
const aWord = () => (controls.isTouch ? 'el botón A' : 'ESPACIO');
const bWord = () => (controls.isTouch ? 'el botón B' : 'la tecla X');

export default {
  id: 'home',
  title: 'Casa de Sullana',
  sub: 'Prólogo',
  map: MAP,
  legend: { E: 'wallHouseOut', e: 'wallHouseOutWin' },
  spawns: {
    intro: { x: 3, y: 4, dir: 'down' },
    default: { x: 4, y: 4, dir: 'down' },
  },

  objects: [
    // Cuarto de Ray
    { id: 'bed', type: 'bedRay', x: 1, y: 2, when: () => !state.flag('home_morning') },
    { id: 'bed2', type: 'bed', x: 1, y: 2, when: () => state.flag('home_morning') },
    { type: 'nightstand', x: 2, y: 2 },
    { type: 'desk', x: 5, y: 2, talk: (w) => w.say('ray', 'Mi laptop. Hoy nada de trabajo... bueno, casi nada.') },
    { type: 'bookshelf', x: 8, y: 2 },
    { type: 'barcaPoster', x: 7, y: 1, talk: (w) => w.say('ray', 'Visca el Barça. Papá me pegó la costumbre.') },
    { type: 'rugSmall', x: 3, y: 5 },
    { type: 'plant', x: 1, y: 7 },
    // Sala
    { id: 'piano', type: 'piano', x: 10, y: 2, talk: (w) => pianoTalk(w) },
    { type: 'familyPhoto', x: 13, y: 1, talk: (w) => w.say('ray', 'La foto familiar. Tato sale con los ojos cerrados, como siempre.') },
    { type: 'tv', x: 16, y: 2, talk: (w) => w.say(null, 'La tele está apagada. Papá la prende en la noche para ver al Barça.') },
    { type: 'clock', x: 19, y: 1 },
    { type: 'crossWall', x: 20, y: 1 },
    { type: 'plant', x: 21, y: 2 },
    { type: 'rug', x: 15, y: 6 },
    { type: 'sofa', x: 15, y: 5 },
    { type: 'dogBed', x: 12, y: 10 },
    { type: 'bowl', x: 13, y: 10 },
    { type: 'rug', x: 14, y: 12 },
    { type: 'plant', x: 10, y: 14 },
    { type: 'plant', x: 21, y: 14 },
    { type: 'bookshelf', x: 21, y: 8 },
    { id: 'letter', type: 'letter', x: 15, y: 14, when: () => state.flag('letter_arrived') && !state.flag('letter_read'), talk: (w) => readLetter(w) },
    // Cocina
    { type: 'counter', x: 23, y: 2 },
    { type: 'stove', x: 24, y: 2, talk: (w) => w.say('ray', 'Huele a tallarines rojos. Mamá los hace como nadie.') },
    { type: 'counter', x: 25, y: 2 },
    { type: 'fridge', x: 28, y: 2 },
    { type: 'table', x: 24, y: 4, talk: (w) => tableTalk(w) },
    { type: 'chair', x: 23, y: 4 },
    { type: 'chair', x: 26, y: 4 },
    // Patios
    { type: 'flowers', x: 2, y: 11 },
    { type: 'flowers', x: 6, y: 13 },
    { type: 'hedgeObj', x: 1, y: 14 },
    { type: 'bin', x: 8, y: 14 },
    { type: 'flowers', x: 24, y: 12 },
    { type: 'hedgeObj', x: 28, y: 14 },
    { type: 'plant', x: 28, y: 10 },
  ],

  actors: () => {
    const list = [];
    if (state.flag('home_morning')) {
      list.push({ id: 'mama', char: 'mama', x: 26, y: 6, dir: 'left', idle: 'look', talk: (w) => mamaTalk(w) });
      list.push({
        id: 'micha', char: 'micha', x: 11, y: 2, frame: 16, depthBias: 8, emote: 'zzz', turn: false,
        talk: (w) => w.say(null, 'Micha duerme sobre el teclado. Ni un terremoto la despierta.'),
      });
      if (!state.flag('hachi_joined')) {
        list.push({
          id: 'hachiNpc', char: 'hachi', x: 12, y: 10, frame: state.flag('shiro_chase') ? 0 : 17, turn: false,
          talk: (w) => hachiNpcTalk(w),
        });
      }
      if (state.flag('shiro_chase') && !state.flag('shiro_caught')) {
        list.push({ id: 'shiro', char: 'shiro', x: 16, y: 11, dir: 'down', talk: (w) => catchShiro(w) });
      }
      if (state.flag('shiro_caught')) {
        list.push({
          id: 'shiro', char: 'shiro', x: 5, y: 12, dir: 'down', idle: 'look',
          talk: (w) => { audio.sfx('meow', { high: true }); return w.say(null, 'Shiro te mira con cara de "yo no fui".'); },
        });
      }
    }
    return list;
  },

  triggers: [
    {
      x: 15, y: 16, w: 2, h: 1,
      run: async (w) => {
        if (!state.flag('note_hogar')) {
          let msg = 'Todavía no. Algo raro está pasando en la casa...';
          if (!state.flag('piano_tried')) msg = 'Todavía no. ¿Qué le pasó a la música? Quiero probar el piano de la sala.';
          else if (!state.flag('hachi_joined')) msg = 'No me voy sin Hachi. ¡Primero hay que recuperar su pelota!';
          else if (!state.flag('got_tallarines')) msg = 'Mamá quería verme en la cocina antes de salir.';
          else if (!state.flag('got_mapa')) msg = 'Papá me dejó algo en la mesa de la cocina. Mejor lo reviso.';
          await w.say('ray', msg);
          await w.player.walk('U1');
          return;
        }
        if (!state.flag('letter_read')) {
          await w.say('ray', 'Hachi ladra hacia la carta que dejaron en la entrada. Mejor la leo primero.');
          await w.player.walk('U1');
          return;
        }
        state.setFlag('home_done');
        await w.goto('park', 'default');
      },
    },
  ],

  saturation: () => (state.flag('home_morning') ? [0.22, 0.45, 0.65, 0.84, 1][state.noteCount()] : 1),

  music: () => {
    if (!state.flag('home_morning')) return { song: null, clarity: 1 };
    return { song: 'HOME' };
  },

  onEnter: (w, spawn) => {
    if (!state.flag('home_morning')) return intro5am(w);
    if (!state.flag('home_intro_done')) return morning(w);
    return null;
  },

  update: (w, time) => shiroAI(w, time),
};

// ---------------------------------------------------------------------------
async function intro5am(w) {
  w.player.setVisible(false);
  audio.setAmbience(false);
  audio.setClarity(1, 0.05);
  const W = w.mapW * 16;
  const H = w.mapH * 16;
  const dark = w.add.rectangle(0, 0, W, H, 0x05030c, 0.86).setOrigin(0).setDepth(5000);
  const black = w.add.rectangle(0, 0, 480, 270, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(9400);
  const clock = txt(w, 240, 128, '05:00', { size: 32, color: '#ff5a5a', origin: 0.5, fixed: true, depth: 9500, stroke: '#3a0a0a', strokeThickness: 4 });
  const ampm = txt(w, 334, 146, 'a. m.', { size: 8, color: '#ff5a5a', origin: 0.5, fixed: true, depth: 9500 });
  const date = txt(w, 240, 162, '1 de octubre', { size: 8, color: '#9a6a8a', origin: 0.5, fixed: true, depth: 9500 });
  w.tweens.add({ targets: clock, alpha: 0.55, duration: 500, yoyo: true, repeat: 3 });
  await w.wait(2600);
  w.tweens.add({ targets: [clock, ampm, date, black], alpha: 0, duration: 900 });
  await w.wait(1100);
  clock.destroy();
  ampm.destroy();
  date.destroy();
  black.destroy();
  await w.say(null, 'Sullana. Madrugada del 1 de octubre. Ray duerme tranquilo...');

  // Papá y mamá entran cantando, con una tortita con vela
  audio.sfx('door');
  const mama = w.spawn({ id: 'mama', char: 'mama', x: 9, y: 6, dir: 'left' });
  const papa = w.spawn({ id: 'papa', char: 'papa', x: 10, y: 6, dir: 'left' });
  const glow = w.add.image(mama.sprite.x, mama.sprite.y - 16, 'light').setBlendMode('ADD').setDepth(5001).setScale(1.3).setAlpha(0.9);
  const glowTick = () => {
    glow.setPosition(mama.sprite.x, mama.sprite.y - 16);
    glow.setScale(1.25 + Math.sin(w.time.now / 90) * 0.04);
  };
  w.events.on('update', glowTick);

  const song = bdaySong({ full: false, voices: 2 });
  const inst = audio.playSong(song, { loop: false, fadeIn: 0.05, restart: true });
  const spStep = 60 / song.bpm / song.stepsPerBeat;
  BDAY_LYRICS.slice(0, 3).forEach((l, i) => {
    w.time.delayedCall(l.step * spStep * 1000 + 80, () => w.lyric(i === 2 ? 'te dese...' : l.text, i === 2 ? 900 : 2600));
  });
  mama.walk('L5 U1', 330);
  await w.wait(250);
  await papa.walk('L5', 330);
  papa.face('up');
  await w.wait(1400);
  // Ray se despierta
  const bed = w.obj('bed');
  w.emote({ sprite: { x: bed.sprite.x, y: bed.sprite.y - 12, displayHeight: 12 } }, '!', 900);
  await w.wait(2900);

  // La canción se corta de golpe
  const cutAt = inst.startTime + 52 * spStep;
  await w.wait(Math.max(0, (cutAt - audio.now()) * 1000));
  audio.stopSong(0.08);
  audio.sfx('glitch');
  w.shake(250, 0.004);
  w.events.off('update', glowTick);
  w.tweens.add({ targets: glow, alpha: 0, duration: 900, onComplete: () => glow.destroy() });
  w.setSat(0.22, 1800);
  audio.setClarity(0.05, 2);
  audio.setAmbience(true);
  await w.wait(700);
  w.emote(mama, '?', 1500);
  w.emote(papa, '?', 1500);
  await w.wait(1200);
  mama.face('right');
  await w.say('mama', '¿Y ahora? ¡No nos sale la voz!', 'surprised');
  papa.face('left');
  await w.say('papa', 'Hace un ratito cantábamos lo más bien...', 'surprised');
  await w.say('ray', '¿Ma? ¿Pa? ¿Qué pasó con la canción?', 'surprised');
  await w.say('papa', 'No sé, hijo... Bueno, feliz cumpleaños igual. Hoy me voy temprano al trabajo, pero en la noche vemos juntos al Barça.', 'normal');
  await w.say(null, 'En ese mismo instante, en toda Sullana... la música desapareció.');
  await w.fadeOut(900);
  dark.destroy();

  // Mañana siguiente
  state.setFlag('home_morning');
  w.scene.restart({ zone: 'home', spawn: 'default' });
}

async function morning(w) {
  const card = txt(w, 240, 135, 'Más tarde...', { size: 16, color: '#fff1d0', origin: 0.5, fixed: true, depth: 9600 });
  const black = w.add.rectangle(0, 0, 480, 270, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(9500);
  await w.wait(1500);
  w.tweens.add({ targets: [card, black], alpha: 0, duration: 800 });
  await w.wait(800);
  card.destroy();
  black.destroy();

  const p = w.player;
  p.place(3, 4);
  p.face('down');
  const mama = w.actor('mama');
  mama.place(9, 6);
  mama.face('left');
  audio.sfx('door');
  await mama.walk('L4', 260);
  mama.face('up');
  p.face('down');
  await w.say('mama', '¡Buenos días, cumpleañero! Tu desayuno, como todos los años: pan con pollo y tu juguito de piña.', 'happy');
  await w.say('ray', 'Gracias, ma. ¿Y lo de hace rato? La canción se cortó así nomás.');
  await w.say('mama', 'No sé, hijito. Desde esa hora no suena nada: ni la radio, ni los pajaritos, ni la vecina que canta en la ducha.', 'sad');
  await w.say('mama', 'Tu papá ya se fue a trabajar, pero te dejó algo en la mesa de la cocina. Y Hachi te está esperando.', 'normal');
  await mama.walk('R4', 230);
  await mama.walkTo(26, 6, 200);
  mama.face('left');
  state.setFlag('home_intro_done');
  w.save();
  w.hint(`Muévete con ${touchWord()}. Habla con ${aWord()}.`, 5000);
  fx.titleCard(w, 'Casa de Sullana', 'Prólogo');
}

// ---------------------------------------------------------------------------
async function tableTalk(w) {
  if (state.flag('got_mapa')) {
    await w.say(null, 'La mesa del comedor. Todavía huele a pan con pollo.');
    return;
  }
  await w.say(null, 'Sobre la mesa hay un mapa doblado con una nota de papá:');
  await w.say('papa', '"Para el cumpleañero. Algo me dice que hoy vas a caminar bastante. Nos vemos en la noche."', 'happy');
  await w.give('mapa');
  state.setFlag('got_mapa');
  await checkNote(w);
}

async function mamaTalk(w) {
  if (state.flag('hachi_joined') && !state.flag('got_tallarines')) {
    await w.say('mama', '¡Feliz cumpleaños, hijito! Dios te bendiga.', 'happy');
    await w.say('mama', 'Llévate tus tallarines. Con la barriga llena todo sale mejor.', 'happy');
    await w.give('tallarines', 3, 'Recuperan ánimo en la batalla final');
    state.setFlag('got_tallarines');
    await checkNote(w);
    return;
  }
  if (!state.flag('hachi_joined')) {
    await w.say('mama', 'Estoy preparando algo rico para ti... Anda a ver a Hachi, que está solito en su camita.');
    return;
  }
  await w.say('mama', 'Dios te acompañe, hijito. Y no te olvides de comer.', 'happy');
}

async function pianoTalk(w) {
  if (state.flag('note_hogar')) {
    audio.note('piano', 60 + [0, 4, 7, 12][Math.floor(Math.random() * 4)], 0.6, 0.8);
    await w.say('ray', 'Suena un poquito. La Nota del Hogar trajo algo de vuelta.', 'happy');
    return;
  }
  if (!state.flag('piano_tried')) {
    state.setFlag('piano_tried');
    audio.sfx('thud');
    await w.wait(300);
    await w.say('ray', '...No suena. ¿Qué le pasó a la música?', 'sad');
    await w.say(null, 'Micha sigue durmiendo sobre las teclas, como si nada.');
    await shiroSteals(w);
    return;
  }
  await w.say('ray', 'Nada. Ni una nota.', 'sad');
}

async function hachiNpcTalk(w) {
  if (state.flag('shiro_chase') && !state.flag('shiro_caught')) {
    audio.sfx('bark');
    await w.say('hachi', '¡Guau! ¡Guau! (Hachi mira a Shiro con ojitos tristes.)');
    return;
  }
  audio.sfx('bark1');
  await w.say(null, 'Hachi mueve la cola con su pelota en la boca. ¡Quiere jugar!');
  if (!state.flag('piano_tried')) await w.say('ray', 'Ya vamos, Hachi. Primero déjame ver qué pasa con la música.');
}

// Shiro se roba la pelota de Hachi
async function shiroSteals(w) {
  const hachi = w.actor('hachiNpc');
  const shiro = w.spawn({ id: 'shiro', char: 'shiro', x: 20, y: 13, dir: 'left', talk: (ww) => catchShiro(ww) });
  audio.sfx('meow', { high: true });
  await w.pan(15, 10, 500);
  await shiro.walk('L7 U3', 60);
  shiro.face('left');
  hachi.setFrame(0);
  w.emote(hachi, '!', 800);
  audio.sfx('pop');
  await w.wait(300);
  await shiro.walk('R3 D2', 60);
  audio.sfx('bark');
  w.emote(hachi, '?', 1000);
  await w.say(null, '¡Shiro le robó la pelota a Hachi y salió corriendo!');
  w.follow();
  await w.say('ray', '¡Shiro! Devuélvele su pelota a Hachi.');
  state.setFlag('shiro_chase');
  w.shiroStart = w.time.now;
  w.hint(`Atrapa a Shiro: acércate y presiona ${aWord()}.`, 5000);
}

function shiroAI(w, time) {
  if (!state.flag('shiro_chase') || state.flag('shiro_caught')) return;
  const s = w.actor('shiro');
  if (!s || s.moving || w.locked) return;
  if (!w.shiroStart) w.shiroStart = time;
  if (time - w.shiroStart > 15000) {
    if (!s.tired) {
      s.tired = true;
      w.emote(s, 'sweat', 0);
      s.face('down');
      w.hint('Shiro se cansó. ¡Ahora sí!', 2500);
    }
    return;
  }
  if (time < (s.nextMove || 0)) return;
  const p = w.player;
  const dist = Math.abs(p.x - s.x) + Math.abs(p.y - s.y);
  const opts = [[0, -1], [0, 1], [-1, 0], [1, 0]]
    .map(([dx, dy]) => [s.x + dx, s.y + dy])
    .filter(([x, y]) => !w.blocked(x, y, false, s) && !(x === p.x && y === p.y) && y >= 2 && y <= 14);
  if (!opts.length) {
    s.nextMove = time + 400;
    return;
  }
  let pick;
  if (dist <= 4) {
    opts.sort((a, b) => (Math.abs(p.x - b[0]) + Math.abs(p.y - b[1])) - (Math.abs(p.x - a[0]) + Math.abs(p.y - a[1])));
    pick = Math.random() < 0.8 ? opts[0] : opts[Math.floor(Math.random() * opts.length)];
  } else {
    if (Math.random() < 0.5) {
      s.nextMove = time + 300;
      return;
    }
    pick = opts[Math.floor(Math.random() * opts.length)];
  }
  s.moveTo(pick[0], pick[1], 150).then(() => s.idle());
  s.nextMove = time + (dist <= 3 ? 200 : 380);
}

async function catchShiro(w) {
  if (!state.flag('shiro_chase') || state.flag('shiro_caught')) return;
  const s = w.actor('shiro');
  state.setFlag('shiro_caught');
  s.persistentEmote?.stop?.();
  audio.sfx('meow');
  w.emote(s, '!', 800);
  await w.wait(500);
  await w.say(null, '¡Atrapaste a Shiro! Suelta la pelota con cara de inocente.');
  const hachi = w.actor('hachiNpc');
  // Hachi corre feliz hacia Ray
  audio.sfx('bark');
  const p = w.player;
  const tx = p.x + (s.x > p.x ? 1 : s.x < p.x ? -1 : 0);
  const ty = p.y + (s.y > p.y ? 1 : s.y < p.y ? -1 : 0);
  await s.walk(p.x > 5 ? 'L1' : 'R1', 90).catch(() => {});
  await hachi.walkTo(Math.max(10, Math.min(21, tx)), Math.max(2, Math.min(14, ty)), 90);
  w.removeActor('hachiNpc');
  w.addHachi();
  w.hachi.setFrame(17);
  fx.hearts(w, w.hachi.sprite.x, w.hachi.sprite.y - 12, 8);
  state.setFlag('hachi_joined');
  await fxBanner(w);
  await w.say('hachi', '¡Guau! (Hachi no se va a despegar de ti en todo el día.)', 'happy');
  w.hint(`Lanza la pelota con ${bWord()}. Acaricia a Hachi con ${aWord()}.`, 5500);
  await w.wait(400);
  await w.say('ray', 'Mamá quería verme antes de salir. Y papá me dejó algo en la mesa de la cocina. Vamos, Hachi.');
}

async function fxBanner(w) {
  await fx.banner(w, { icon: 'ball', title: '¡Hachi se unió a Ray!', sub: 'Te seguirá a todas partes', sound: 'fanfare' });
}

// Cuando mamá y papá ya entregaron sus regalos, Micha despierta la primera nota
async function checkNote(w) {
  if (!state.flag('got_mapa') || !state.flag('got_tallarines') || state.flag('note_hogar')) return;
  await w.wait(400);
  const micha = w.actor('micha');
  await w.pan(11, 4, 700);
  micha.persistentEmote?.stop?.();
  await w.wait(400);
  micha.face('left');
  audio.sfx('meow');
  await w.wait(500);
  // Micha camina sobre las teclas y... ¡suena!
  micha.sprite.setFlipX(false);
  for (const m of [60, 64, 67, 72]) {
    micha.sprite.x -= 3;
    audio.note('piano', m, 0.5, 0.8);
    await w.wait(220);
  }
  fx.notesBurst(w, micha.sprite.x, micha.sprite.y - 12, 12);
  await w.say('ray', '¡¿Escuchaste, ma?! ¡Sonó el piano!', 'surprised');
  await w.say('mama', '¡Micha lo hizo sonar! La música no se fue del todo...', 'surprised');
  // La nota dorada sale del piano
  const note = w.add.image(w.obj('piano').sprite.x, 20, 'nota_hogar').setDepth(8000).setScale(0.2);
  audio.sfx('chime');
  await fx.tween(w, { targets: note, scale: 1.4, y: 30, duration: 900, ease: 'Back.Out' });
  w.tweens.add({ targets: note, y: 26, duration: 500, yoyo: true, repeat: 2 });
  await w.wait(1200);
  await fx.tween(w, { targets: note, x: w.player.sprite.x, y: w.player.sprite.y - 20, scale: 0.5, duration: 700, ease: 'Cubic.In' });
  note.destroy();
  w.follow();
  state.setFlag('note_hogar');
  await w.getNote('hogar');
  micha.setFrame(16);
  micha.persistentEmote = w.emote(micha, 'zzz', 0);
  await w.say('ray', 'Una Nota Legendaria... Se siente calientita, como la casa.', 'happy');
  // Llega una carta misteriosa
  await w.wait(300);
  audio.sfx('door');
  state.setFlag('letter_arrived');
  w.addObject({ id: 'letter', type: 'letter', x: 15, y: 14, talk: (ww) => readLetter(ww) });
  w.emote(w.hachi, '!', 900);
  audio.sfx('bark');
  await w.say(null, 'Alguien deslizó una carta por debajo de la puerta de entrada. Hachi ladra hacia allá.');
  w.save();
}

async function readLetter(w) {
  state.setFlag('letter_read');
  w.removeObject('letter');
  audio.sfx('item');
  await w.say(null, '"Querido Ray: la música de Sullana ahora es mía. Si la quieres de vuelta, reúne las cuatro Notas Legendarias y sube a la Torre del Silencio."');
  await w.say(null, '"Atentamente: Ta... digo, el Maestro del Silencio."');
  await w.say('ray', '¿"Ta... digo"? Qué firma más rara.', 'surprised');
  await w.say('ray', 'Bueno. Si hay que buscar notas, las buscamos. ¿Vamos, Hachi?', 'happy');
  audio.sfx('bark');
  w.save();
}
