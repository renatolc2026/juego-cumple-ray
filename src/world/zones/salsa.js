import Phaser from 'phaser';
import { state } from '../../core/state.js';
import { audio } from '../../core/audio.js';
import * as fx from '../../core/fx.js';
import { MapBuilder } from '../mapgen.js';

// ============================================================================
// Escena 4: el Salón del Sabor (versión fantástica de la academia de salsa de Lima)
// ============================================================================

const m = new MapBuilder(30, 18, ':');
m.rect(0, 0, 30, 1, '#');
m.rect(0, 0, 1, 18, '#');
m.rect(29, 0, 1, 18, '#');
m.rect(0, 17, 30, 1, '#');
for (let x = 1; x < 29; x++) m.set(x, 1, x === 5 || x === 24 ? 'n' : 'W');
m.checker(8, 5, 14, 9, 'x', 'y');
const MAP = m.build();

const DANCERS = [
  { id: 'd1', char: 'bailarin', x: 9, y: 7, dir: 'right' },
  { id: 'd2', char: 'bailarina', x: 10, y: 7, dir: 'left' },
  { id: 'd3', char: 'bailarina', x: 19, y: 11, dir: 'right' },
  { id: 'd4', char: 'bailarin', x: 20, y: 11, dir: 'left' },
  { id: 'd5', char: 'bailarina', x: 20, y: 6, dir: 'down' },
  { id: 'd6', char: 'bailarin', x: 9, y: 12, dir: 'up' },
];

export default {
  id: 'salsa',
  title: 'El Salón del Sabor',
  sub: 'Lima (más o menos)',
  map: MAP,
  bg: '#1a0d26',
  legend: { '#': 'wallSalsaTop', W: 'wallSalsa', n: 'wallSalsaNeon', ':': 'woodDark', x: 'dance', y: 'dance2' },
  spawns: { default: { x: 14, y: 15, dir: 'up' } },
  objects: [
    { type: 'neonSign', x: 13, y: 1, fw: 4 },
    { type: 'mirror', x: 2, y: 1 },
    { type: 'mirror', x: 26, y: 1 },
    { id: 'stage', type: 'stage', x: 12, y: 2 },
    { type: 'speaker', x: 10, y: 2 }, { type: 'speaker', x: 17, y: 2 },
    { id: 'disco', type: 'discoBall', x: 14, y: 6, fw: 2, oy: -22, solid: false },
    { type: 'barCounter', x: 24, y: 7 },
    { type: 'plant', x: 1, y: 15 }, { type: 'plant', x: 28, y: 15 }, { type: 'plant', x: 1, y: 3 }, { type: 'plant', x: 28, y: 3 },
    { type: 'cable', x: 18, y: 4 },
    { id: 'portalCave', type: 'portal', x: 3, y: 11, when: () => state.flag('portal_cave'), talk: (w) => w.goto('cave', 'default', { portal: true, white: true }) },
  ],
  actors: () => {
    const danced = state.hasNote('sabor');
    const list = DANCERS.map((d) => ({
      ...d, idle: danced ? 'bob' : null, emote: danced ? null : 'dots',
      talk: (w) => (danced
        ? w.say(d.char, '¡Azúcar! ¡Qué tal pasito el tuyo, Ray!', 'happy')
        : w.say(d.char, '...(Está congelado en plena vuelta, esperando que vuelva la música.)', 'sad')),
    }));
    list.push({ id: 'sharon', char: 'sharon', x: 14, y: 2, dir: 'down', depthBias: 30, talk: (w) => sharonTalk(w) });
    return list;
  },
  triggers: [
    {
      x: 3, y: 12, w: 2, h: 1,
      when: () => state.flag('portal_cave'),
      run: (w) => w.goto('cave', 'default', { portal: true, white: true }),
    },
  ],
  music: () => ({ song: 'SALSA' }),
  setup: (w) => setupLights(w),
  onEnter: (w) => intro(w),
};

function setupLights(w) {
  // Luces de colores sobre la pista y haces de luz
  const colors = [0xff5fa0, 0x6ff0ff, 0xffd166, 0xa77be0, 0x6cc251];
  w.floorLights = [];
  for (let i = 0; i < 10; i++) {
    const r = w.add.rectangle(0, 0, 16, 16, colors[i % colors.length], 0).setOrigin(0).setDepth(-4).setBlendMode(Phaser.BlendModes.ADD);
    w.floorLights.push(r);
  }
  const beams = [];
  for (const [x, c] of [[6, 0xff5fa0], [23, 0x6ff0ff], [14, 0xffd166]]) {
    const b = w.add.image(x * 16, 24, 'obj_lightBeam').setOrigin(0.5, 0).setDepth(2500).setTint(c).setAlpha(0.5).setScale(2, 2.4).setBlendMode(Phaser.BlendModes.ADD);
    w.tweens.add({ targets: b, angle: { from: -25, to: 25 }, duration: 1800 + x * 40, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    beams.push(b);
  }
  w.salsaBeams = beams;
  w.time.addEvent({
    delay: 333,
    loop: true,
    callback: () => {
      const on = state.hasNote('sabor') || w.salsaParty;
      beams.forEach((b) => b.setVisible(on || Math.random() < 0.15));
      w.floorLights.forEach((r) => {
        r.setPosition((8 + Phaser.Math.Between(0, 13)) * 16, (5 + Phaser.Math.Between(0, 8)) * 16);
        r.setFillStyle(colors[Phaser.Math.Between(0, colors.length - 1)], on ? 0.35 : 0);
      });
    },
  });
}

async function intro(w) {
  fx.titleCard(w, 'El Salón del Sabor', 'Lima (más o menos)');
  if (state.flag('salsa_intro')) return;
  state.setFlag('salsa_intro');
  await w.wait(900);
  await w.say('ray', '¡Es la academia de salsa! Aunque... más brillante que en la vida real.', 'surprised');
  await w.say(null, 'Todos están congelados a mitad de un paso. Sin música, nadie puede bailar.');
}

async function sharonTalk(w) {
  const sh = w.actor('sharon');
  if (state.hasNote('sabor')) {
    await w.say('sharon', '¡Eso es sabor, Ray! Cuando todo esto pase, te espero en clase. ¡Sin faltar!', 'happy');
    return;
  }
  if (!state.flag('sharon_talked')) {
    state.setFlag('sharon_talked');
    await w.say('sharon', '¡Ray! Justo a ti te quería ver. Sin música no puedo dar clase, ¡y hoy tocaba la clase especial de tu cumpleaños!', 'sad');
    await w.say('sharon', 'Pero la salsa se lleva por dentro. Si bailas con sabor, la música tiene que volver.', 'normal');
    await w.say('sharon', '¿Una batalla de baile? Yo marco, tú sigues. ¡Con sabor, Ray!', 'happy');
  }
  const r = await w.ask('sharon', '¿Listo para la batalla de salsa?', ['¡Dale!', 'Un ratito']);
  if (r !== 0) {
    await w.say('sharon', 'Estírate bien. ¡Aquí te espero!', 'normal');
    return;
  }
  await w.minigame('Salsa', { mode: 'battle' });
  // Victoria: vuelve la salsa
  w.salsaParty = true;
  audio.setClarity(1, 1);
  w.music('SALSA', { restart: true });
  for (const d of DANCERS) {
    const a = w.actor(d.id);
    a.persistentEmote?.stop?.();
    a.persistentEmote = null;
    w.tweens.add({ targets: a.sprite, scaleY: 0.93, duration: 333, yoyo: true, repeat: -1 });
    w.emote(a, 'note', 2000);
  }
  sh.setFrame(16);
  await w.wait(1200);
  await w.say('sharon', '¡Eso es sabor, Ray! ¡Así se baila en el Salón del Sabor!', 'happy');
  sh.face('down');
  await w.getNote('sabor');
  await maskedSalsa(w);
}

async function maskedSalsa(w) {
  audio.sfx('whoosh');
  const mk = w.spawn({ id: 'maestro', char: 'maestro', x: 25, y: 9, dir: 'left', ghost: true });
  mk.sprite.setAlpha(0);
  w.tweens.add({ targets: mk.sprite, alpha: 1, duration: 400 });
  w.emote(w.player, '!', 900);
  await w.wait(500);
  await w.say('maestro', 'Nada mal, Ray. Pero en mi torre no habrá salsa que te salve.');
  await w.say('maestro', 'Y ahora... ¡me retiro con estilo!');
  // Intenta un paso de salsa y se enreda
  for (const d of ['down', 'left', 'up', 'right']) {
    mk.face(d);
    await w.wait(110);
  }
  audio.sfx('slip');
  await fx.tween(w, { targets: mk.sprite, angle: 90, duration: 300, ease: 'Quad.In' });
  w.shake(200, 0.005);
  w.emote(mk, 'sweat', 1000);
  await w.wait(500);
  await fx.tween(w, { targets: mk.sprite, angle: 0, duration: 200 });
  const lx = mk.x;
  const ly = mk.y + 1;
  await mk.walk('R2', 90);
  w.tweens.add({ targets: mk.sprite, alpha: 0, duration: 250 });
  await w.wait(300);
  w.removeActor('maestro');
  const key = w.add.image(lx * 16 + 8, ly * 16 + 8, 'llavero').setDepth(ly * 16 + 8);
  await w.say('sharon', 'Ese encapuchado baila medio tieso. Le falta clase. ¡Que se inscriba!', 'happy');
  w.emote(w.hachi, '!', 800);
  audio.sfx('bark');
  await w.runDog(w.hachi, lx, ly, 70);
  key.destroy();
  await w.runDog(w.hachi, w.player.x, w.player.y + 1, 70, true);
  await w.clue('llavero');
  await w.say('ray', '"Recuerdo de Lima"... El enmascarado viene de Lima. ¿Quién de Lima podría...?', 'surprised');
  // Aparece el portal a la Cueva del Código
  await w.wait(300);
  audio.sfx('flash');
  w.flash(300, [200, 255, 220]);
  state.setFlag('portal_cave');
  const p = w.addObject({ id: 'portalCave', type: 'portal', x: 3, y: 11, talk: (ww) => ww.goto('cave', 'default', { portal: true, white: true }) });
  p.sprite.setTint(0x9dffc8);
  p.sprite.setScale(0.1);
  await fx.tween(w, { targets: p.sprite, scale: 1, duration: 700, ease: 'Back.Out' });
  await w.say('sharon', '¡Otro portal! Ese brillo verde... parece código. Ve con cuidado, Ray.', 'surprised');
  w.save();
}
