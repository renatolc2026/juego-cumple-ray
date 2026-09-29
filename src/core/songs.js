// Banda sonora original del juego, escrita como partituras en código.
// Formato de melodía: "C5:4 D5:2 r:2" = nota:duración en pasos (semicorcheas salvo que se indique).

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function midi(name) {
  if (typeof name === 'number') return name;
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  if (!m) throw new Error(`Nota inválida: ${name}`);
  let n = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return n + (parseInt(m[3], 10) + 1) * 12;
}

// Parsea una melodía y devuelve eventos [paso, midi, largo, vel]
export function mel(str, start = 0, vel = 0.8) {
  const ev = [];
  let s = start;
  for (const tok of str.trim().split(/\s+/)) {
    const accent = tok.endsWith('!');
    const t = accent ? tok.slice(0, -1) : tok;
    const [n, l] = t.split(':');
    const len = parseFloat(l || '1');
    if (n !== 'r' && n !== '-') {
      const notes = n.split('+').map(midi);
      ev.push([s, notes.length === 1 ? notes[0] : notes, len, accent ? 1 : vel]);
    }
    s += len;
  }
  return ev;
}

const CHORD_TYPES = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  7: [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  m6: [0, 3, 7, 9],
  sus4: [0, 5, 7],
  '7sus4': [0, 5, 7, 10],
  dim: [0, 3, 6],
  m7b5: [0, 3, 6, 10],
  '7b9': [0, 4, 7, 10, 13],
  add9: [0, 4, 7, 14],
  madd9: [0, 3, 7, 14],
  6: [0, 4, 7, 9],
};

// "Am7" -> { root: 57, tones: [...] }  (octava base 3 para la raíz)
export function chord(name, oct = 3) {
  const [main, slash] = name.split('/');
  const m = /^([A-G])(#|b)?(.*)$/.exec(main);
  const root = midi(`${m[1]}${m[2] || ''}${oct}`);
  const tones = (CHORD_TYPES[m[3]] || CHORD_TYPES['']).map((i) => root + i);
  let bass = root;
  if (slash) {
    const sm = /^([A-G])(#|b)?$/.exec(slash);
    bass = midi(`${sm[1]}${sm[2] || ''}${oct}`);
    if (bass > root) bass -= 12;
  }
  return { root, tones, bass };
}

// Expande una progresión: cada elemento dura `len` pasos (o se da [nombre, largo])
function expand(prog, len) {
  const out = [];
  let s = 0;
  for (const p of prog) {
    const [name, l] = Array.isArray(p) ? p : [p, len];
    out.push({ name, start: s, len: l });
    s += l;
  }
  return out;
}

export function padTrack(prog, len, oct = 4, vel = 0.7) {
  return expand(prog, len).map((c) => {
    const ch = chord(c.name, oct);
    return [c.start, ch.tones.slice(0, 4), c.len, vel];
  });
}

// Arpegio: pattern son índices de las notas del acorde (se extiende a dos octavas)
export function arpTrack(prog, len, pattern, stepLen = 2, oct = 4, vel = 0.7) {
  const ev = [];
  for (const c of expand(prog, len)) {
    const ch = chord(c.name, oct);
    const ext = [...ch.tones, ...ch.tones.map((t) => t + 12), ...ch.tones.map((t) => t + 24)];
    let i = 0;
    for (let s = 0; s < c.len; s += stepLen) {
      const idx = pattern[i % pattern.length];
      i++;
      if (idx == null) continue;
      ev.push([c.start + s, ext[idx], stepLen, vel]);
    }
  }
  return ev;
}

// Bajo: pattern = [[paso, 'r'|'5'|'8'|'3'|'n', largo]] relativo al acorde ('n' = raíz del siguiente)
export function bassTrack(prog, len, pattern, oct = 2, vel = 0.85) {
  const ev = [];
  const chords = expand(prog, len);
  chords.forEach((c, ci) => {
    const ch = chord(c.name, oct);
    const next = chord(chords[(ci + 1) % chords.length].name, oct);
    for (let rep = 0; rep < c.len; rep += pattern.len || c.len) {
      for (const [s, deg, l] of pattern.notes || pattern) {
        if (rep + s >= c.len) continue;
        let n = ch.bass;
        if (deg === '5') n = ch.root + 7;
        if (deg === '8') n = ch.bass + 12;
        if (deg === '3') n = ch.tones[1];
        if (deg === 'n') n = next.bass;
        if (deg === '-5') n = ch.root - 5;
        ev.push([c.start + rep + s, n, l, vel]);
      }
    }
  });
  return ev;
}

// Batería: patrón de caracteres por compás ("x" normal, "X" acento), repetido `bars` veces
export function drums(pattern, bars, note = 60) {
  const ev = [];
  const L = pattern.length;
  for (let b = 0; b < bars; b++) {
    for (let i = 0; i < L; i++) {
      const ch = pattern[i];
      if (ch === 'x' || ch === 'X' || ch === 'o') ev.push([b * L + i, ch === 'o' ? note + 12 : note, 1, ch === 'X' ? 1 : 0.6]);
    }
  }
  return ev;
}

function repeat(events, times, span) {
  const out = [];
  for (let i = 0; i < times; i++) for (const e of events) out.push([e[0] + i * span, ...e.slice(1)]);
  return out;
}

function song(def) {
  const beats = def.beats || 4;
  const spb = def.stepsPerBeat || 4;
  return {
    ...def,
    stepsPerBeat: spb,
    stepsPerBar: beats * spb,
    totalSteps: def.bars * beats * spb,
  };
}

// ============================================================================ Canciones

// Tema principal: dulce y emotivo, piano con pads (título, mensaje final, créditos)
const titleProg = [
  'Fmaj7', ['Em7', 8], ['A7', 8], 'Dm7', ['Cm7', 8], ['F7', 8],
  'Bbmaj7', ['Am7', 8], ['D7', 8], 'Gm7', ['C7sus4', 8], ['C7', 8],
  'Fmaj7', 'Am7', 'Bbmaj7', 'Bbm6', 'Am7', 'D7', ['Gm7', 8], ['C7', 8], 'Fmaj7',
];
const titleMel = `
  C5:4 F5:4 E5:4 C5:4   D5:6 C5:2 A4:8   A4:4 D5:4 C5:4 A4:4   G4:6 A4:2 Bb4:4 A4:4
  F4:4 A4:4 D5:4 C5:4   C5:6 Bb4:2 A4:4 F#4:4   G4:4 Bb4:4 D5:4 F5:4   E5:12 r:4
  F5:4 E5:4 C5:4 A4:4   C5:4 E5:4 G5:4 E5:4   D5:6 C5:2 Bb4:4 D5:4   Db5:6 C5:2 Bb4:8
  A4:4 C5:4 E5:4 G5:4   F#5:8 D5:4 C5:4   Bb4:4 D5:4 C5:4 E5:4   F5:12 r:4`;
export const TITLE = song({
  bpm: 80, bars: 16, gain: 0.9,
  tracks: [
    { inst: 'pad', events: padTrack(titleProg, 16, 3, 0.55), wet: 0.5 },
    { inst: 'epiano', events: arpTrack(titleProg, 16, [0, 1, 2, 3, 4, 3, 2, 1], 2, 3, 0.4), wet: 0.3, delay: 0.25 },
    { inst: 'piano', events: mel(titleMel, 0, 0.75), wet: 0.45, delay: 0.2 },
    { inst: 'bell', events: mel(titleMel, 0, 0.18).map((e) => [e[0], e[1] + 12, e[2], e[3]]), wet: 0.6, minLevel: 1 },
    { inst: 'bass', events: bassTrack(titleProg, 16, [[0, 'r', 6], [8, '5', 6]], 2, 0.5) },
  ],
});

// Hogar: cálido y tranquilo
const homeProg = ['Cmaj7', 'Am7', 'Dm7', 'G7', 'Em7', 'A7', ['Dm7', 8], ['G7', 8], 'Cmaj7'];
const homeMel = `
  E5:4 D5:2 C5:2 G4:8   A4:4 C5:4 E5:4 D5:4   F5:6 E5:2 D5:4 A4:4   B4:8 G4:4 r:4
  E5:4 G5:4 B5:4 G5:4   A5:6 G5:2 E5:4 C#5:4   D5:4 F5:4 B4:4 D5:4   C5:12 r:4`;
export const HOME = song({
  bpm: 92, bars: 8, swing: 0.12,
  tracks: [
    { inst: 'pad', events: padTrack(homeProg, 16, 3, 0.45), wet: 0.4 },
    { inst: 'epiano', events: mel(homeMel, 0, 0.8), wet: 0.3, delay: 0.2 },
    { inst: 'arp', events: arpTrack(homeProg, 16, [0, 2, 1, 2], 4, 4, 0.35), wet: 0.2 },
    { inst: 'bass', events: bassTrack(homeProg, 16, [[0, 'r', 4], [6, '5', 2], [8, '8', 4], [12, '5', 4]], 2, 0.6) },
    { inst: 'shaker', events: drums('x.x.x.x.x.x.x.x.', 8), vol: 0.5 },
  ],
});

// Silencio: casi vacío, con ecos lejanos de la música perdida
export const SILENCE = song({
  bpm: 60, bars: 8, gain: 0.8,
  tracks: [
    { inst: 'pad', events: [[0, [33, 40], 64, 0.35], [64, [31, 38], 64, 0.35]], wet: 0.6 },
    { inst: 'bell', events: [[24, 84, 4, 0.25], [30, 79, 4, 0.18], [88, 81, 4, 0.22], [110, 76, 4, 0.15]], wet: 0.9, delay: 0.5 },
  ],
});

// Parque: alegre y ligero
const parkProg = ['G', 'D/F#', 'Em', 'C', 'G', 'D', 'C', 'D7'];
const parkMel = `
  B4:2 D5:2 G5:4 F#5:2 G5:2 A5:4   F#5:4 D5:4 A4:4 D5:4   E5:2 G5:2 B5:4 A5:2 G5:2 E5:4   C5:4 E5:4 G5:4 E5:4
  D5:2 G5:2 B5:4 A5:4 G5:4   F#5:4 A5:4 D5:8   E5:4 C5:4 E5:2 G5:2 E5:4   D5:8 F#5:4 A5:4`;
export const PARK = song({
  bpm: 116, bars: 8,
  tracks: [
    { inst: 'marimba', events: mel(parkMel, 0, 0.8), wet: 0.2 },
    { inst: 'flute', events: mel(parkMel, 0, 0.45), wet: 0.3, minLevel: 2 },
    { inst: 'pluck', events: arpTrack(parkProg, 16, [0, 1, 2, 1], 2, 4, 0.25), vol: 0.7 },
    { inst: 'bass', events: bassTrack(parkProg, 16, [[0, 'r', 3], [6, '5', 2], [8, 'r', 3], [12, '5', 2], [14, '8', 2]], 2, 0.7) },
    { inst: 'kick', events: drums('x.......x.......', 8) },
    { inst: 'clap', events: drums('....x.......x...', 8), vol: 0.6 },
    { inst: 'shaker', events: drums('x.x.x.x.x.x.x.x.', 8), vol: 0.6 },
  ],
});

// Coro: solemne y luminoso, tipo órgano suave
const choirProg = ['D', 'A/C#', 'Bm', 'F#m/A', 'G', 'D/F#', 'Em7', ['A7sus4', 8], ['A7', 8]];
const choirMel = `
  A4:8 F#4:4 A4:4   E5:8 C#5:8   D5:8 B4:4 D5:4   C#5:12 A4:4
  B4:8 D5:4 G5:4   F#5:8 D5:8   E5:4 D5:4 B4:4 G4:4   A4:12 r:4`;
export const CHOIR = song({
  bpm: 72, bars: 8,
  tracks: [
    { inst: 'organ', events: padTrack(choirProg, 16, 3, 0.6), wet: 0.6 },
    { inst: 'choir', events: mel(choirMel, 0, 0.7), wet: 0.6 },
    { inst: 'bell', events: arpTrack(choirProg, 16, [4, null, 5, null, 6, null, 5, null], 2, 4, 0.2), wet: 0.7, minLevel: 2 },
    { inst: 'bass', events: bassTrack(choirProg, 16, [[0, 'r', 16]], 2, 0.4) },
  ],
});

// Salsa original: piano montuno, bajo tumbao, clave 2-3, congas, campana y trompetas
const salsaProg = ['Am', 'D7', 'G', 'C', 'F', 'Dm', 'E7', 'E7'];
const montuno = [0, 2, 1, 3, 2, 4, 3, 1];
const salsaTrumpet = `
  r:2 E5:1 E5:1 r:1 C5:1 D5:2   C5:2 A4:2 r:4   r:2 D5:1 D5:1 r:1 B4:1 C5:2   B4:2 G4:2 r:4
  r:2 A5:1 A5:1 r:1 F5:1 G5:2   F5:2 D5:2 r:4   G#4:2 B4:2 D5:2 E5:2   G#5:4 r:4`;
function salsaPiano() {
  const ev = [];
  salsaProg.forEach((name, bar) => {
    const ch = chord(name, 4);
    const ext = [...ch.tones, ...ch.tones.map((t) => t + 12)];
    montuno.forEach((idx, i) => {
      const n = ext[idx];
      ev.push([bar * 8 + i, [n, n + 12], 1, i % 2 ? 0.55 : 0.75]);
    });
  });
  return ev;
}
function salsaBass() {
  const ev = [];
  salsaProg.forEach((name, bar) => {
    const ch = chord(name, 2);
    const next = chord(salsaProg[(bar + 1) % salsaProg.length], 2);
    ev.push([bar * 8 + 3, ch.root + 7 > 45 ? ch.root - 5 : ch.root + 7, 3, 0.85]);
    ev.push([bar * 8 + 6, next.bass, 2, 0.9]);
  });
  return ev;
}
export const SALSA = song({
  bpm: 180, bars: 8, stepsPerBeat: 2, gain: 0.95,
  tracks: [
    { inst: 'piano', events: salsaPiano(), vol: 0.75, wet: 0.12 },
    { inst: 'bass', events: salsaBass() },
    { inst: 'clave', events: drums('..x.x...x..x..x.', 4), vol: 0.8 },
    { inst: 'cowbell', events: drums('X.x.X.x.', 8), vol: 0.45 },
    { inst: 'conga', events: [...drums('..x...oo', 8, 50), ...drums('.x......', 8, 62)], vol: 0.8 },
    { inst: 'bongo', events: drums('x.xx.x.x', 8, 50), vol: 0.35 },
    { inst: 'shaker', events: drums('xxxxxxxx', 8), vol: 0.4 },
    { inst: 'kick', events: drums('x.......', 8), vol: 0.35 },
    { inst: 'brass', events: mel(salsaTrumpet, 0, 0.85), wet: 0.25 },
    { inst: 'brass', events: mel(salsaTrumpet, 0, 0.6).map((e) => [e[0], e[1] - 4, e[2], e[3]]), wet: 0.25 },
  ],
});

// Código: electrónico suave, tipo chiptune
const codeProg = ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B7'];
const codeMel = `
  E5:4 G5:2 B5:2 A5:4 G5:4   E5:4 C5:4 G5:4 E5:4   D5:2 G5:2 B5:4 D6:4 B5:4   A5:8 F#5:8
  G5:4 F#5:2 E5:2 B4:4 E5:4   G5:4 E5:4 C6:4 B5:4   A5:4 E5:4 C5:4 E5:4   D#5:8 F#5:4 B5:4`;
export const CODE = song({
  bpm: 112, bars: 8,
  tracks: [
    { inst: 'lead', events: mel(codeMel, 0, 0.55), delay: 0.35 },
    { inst: 'pluck', events: arpTrack(codeProg, 16, [0, 1, 2, 3, 2, 1], 1, 4, 0.3), vol: 0.55 },
    { inst: 'bass', events: bassTrack(codeProg, 16, [[0, 'r', 2], [2, '8', 2], [4, 'r', 2], [6, '8', 2], [8, 'r', 2], [10, '8', 2], [12, 'r', 2], [14, '8', 2]], 2, 0.6) },
    { inst: 'hat', events: drums('..x...x...x...x.', 8) },
    { inst: 'kick', events: drums('x.......x.......', 8), vol: 0.7 },
    { inst: 'snare', events: drums('....x.......x...', 8), vol: 0.4 },
  ],
});

// Torre: tenso y misterioso; sube de intensidad por piso (level 1..7)
const towerProg = ['Dm', 'Bb', 'Gm', 'A7', 'Dm', 'Bb', 'Em7b5', 'A7b9'];
const towerMel = `
  D5:8 F5:4 E5:4   D5:8 Bb4:8   G4:4 Bb4:4 D5:4 G5:4   F5:8 E5:4 C#5:4
  D5:8 A5:8   Bb5:8 A5:4 F5:4   G5:6 F5:2 E5:4 Bb4:4   C#5:12 r:4`;
export const TOWER = song({
  bpm: 84, bars: 8,
  tracks: [
    { inst: 'bass', events: bassTrack(towerProg, 16, [[0, 'r', 2], [2, 'r', 2], [4, 'r', 2], [6, 'r', 2], [8, 'r', 2], [10, 'r', 2], [12, 'r', 2], [14, 'r', 2]], 1, 0.7) },
    { inst: 'pad', events: padTrack(towerProg, 16, 3, 0.5), wet: 0.6 },
    { inst: 'arp', events: arpTrack(towerProg, 16, [0, 1, 2, 3, 2, 1], 1, 4, 0.25), minLevel: 2, delay: 0.3 },
    { inst: 'kick', events: drums('x.......x.x.....', 8), minLevel: 3 },
    { inst: 'strings', events: mel(towerMel, 0, 0.6), minLevel: 4, wet: 0.5 },
    { inst: 'snare', events: drums('....x.......x...', 8), minLevel: 5, vol: 0.5 },
    { inst: 'hat', events: drums('x.x.x.x.x.x.x.x.', 8), minLevel: 5 },
    { inst: 'bell', events: mel(towerMel, 0, 0.3).map((e) => [e[0], e[1] + 12, e[2], e[3]]), minLevel: 6, wet: 0.6 },
  ],
});

// Batalla final (piano, salsa y pelota)
const battleProg = ['Dm', 'Bb', 'C', 'A', 'Dm', 'Bb', 'Gm', 'A7'];
export const battleMel = `
  D5:4 F5:4 A5:4 G5:2 F5:2   F5:4 D5:4 Bb4:8   C5:4 E5:4 G5:4 F5:2 E5:2   E5:4 C#5:4 A4:8
  D5:4 F5:4 A5:4 D6:4   C6:4 Bb5:4 F5:8   G5:4 Bb5:4 D6:4 C6:2 Bb5:2   A5:8 C#6:4 E6:4`;
export const BATTLE = song({
  bpm: 124, bars: 8, gain: 0.9,
  tracks: [
    { inst: 'bass', events: bassTrack(battleProg, 16, [[0, 'r', 2], [2, 'r', 2], [4, '8', 2], [6, 'r', 2], [8, 'r', 2], [10, '8', 2], [12, 'r', 2], [14, '5', 2]], 1, 0.75) },
    { inst: 'strings', events: padTrack(battleProg, 16, 3, 0.55), wet: 0.4 },
    { inst: 'kick', events: drums('x...x...x...x...', 8) },
    { inst: 'snare', events: drums('....x.......x..x', 8), vol: 0.55 },
    { inst: 'hat', events: drums('x.xxx.xxx.xxx.xx', 8), vol: 0.8 },
    { inst: 'brass', events: battleProg.flatMap((name, bar) => [[bar * 16 + 10, chord(name, 4).tones.slice(0, 3), 2, 0.55], [bar * 16 + 14, chord(name, 4).tones.slice(0, 3), 2, 0.7]]), wet: 0.2 },
    { inst: 'strings', events: mel(battleMel, 0, 0.35).map((e) => [e[0], e[1] - 12, e[2], e[3]]), wet: 0.3, minLevel: 2 },
  ],
});

// Minijuego de piano de la iglesia: melodía original tierna (la melodía es la que toca el jugador)
const pianoProg = ['G', 'Em', 'C', 'D', 'G', 'Bm', ['C', 8], ['D', 8], 'G'];
export const pianoMel = `
  B4:4 D5:4 G5:8   E5:4 G5:4 B4:8   C5:4 E5:4 G5:4 E5:4   D5:8 A4:8
  B4:4 D5:4 G5:4 A5:4   F#5:8 D5:8   E5:4 C5:4 D5:4 F#5:4   G5:16`;
export const PIANO_SONG = song({
  bpm: 78, bars: 9, gain: 0.9,
  tracks: [
    { inst: 'pad', events: padTrack(['G', ...pianoProg], 16, 3, 0.4), wet: 0.6 },
    { inst: 'choir', events: padTrack(['G', ...pianoProg], 16, 4, 0.18).map((e) => [e[0], e[1].slice(0, 3), e[2], e[3]]), wet: 0.6, minLevel: 2 },
    { inst: 'arp', events: arpTrack(['G', ...pianoProg], 16, [0, 1, 2, 1], 4, 3, 0.3), wet: 0.3 },
    { inst: 'bell', events: [[0, 79, 1, 0.5], [4, 79, 1, 0.3], [8, 79, 1, 0.3], [12, 79, 1, 0.3]] },
  ],
});

// Fiesta: celebración
const partyProg = ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G'];
const partyMel = `
  E5:2 G5:2 C6:4 B5:2 C6:2 D6:4   C6:4 A5:4 E5:4 A5:4   F5:2 A5:2 C6:4 A5:4 F5:4   G5:4 B5:4 D6:8
  E5:2 G5:2 C6:4 B5:2 C6:2 D6:4   C6:4 E6:4 D6:2 C6:2 A5:4   A5:4 F5:4 A5:4 C6:4   B5:4 D6:4 G5:8`;
export const PARTY = song({
  bpm: 124, bars: 8,
  tracks: [
    { inst: 'marimba', events: mel(partyMel, 0, 0.85), wet: 0.2 },
    { inst: 'brass', events: mel(partyMel, 0, 0.45), wet: 0.25 },
    { inst: 'pluck', events: arpTrack(partyProg, 16, [0, 2, 1, 2], 2, 4, 0.3) },
    { inst: 'bass', events: bassTrack(partyProg, 16, [[0, 'r', 2], [2, '8', 2], [4, 'r', 2], [6, '8', 2], [8, 'r', 2], [10, '8', 2], [12, '5', 2], [14, '8', 2]], 2, 0.7) },
    { inst: 'kick', events: drums('x...x...x...x...', 8) },
    { inst: 'clap', events: drums('....x.......x...', 8), vol: 0.7 },
    { inst: 'hat', events: drums('..x...x...x...x.', 8) },
    { inst: 'conga', events: drums('...x..x....x.x..', 8, 50), vol: 0.5 },
  ],
});

// "Cumpleaños feliz" (melodía tradicional de dominio público) en 3/4
export const BDAY_LYRICS = [
  { text: 'Cumpleaños feliz', step: 0 },
  { text: 'cumpleaños feliz', step: 24 },
  { text: 'te deseamos a ti', step: 48 },
  { text: 'cumpleaños feliz', step: 72 },
];
const bdayMel = `
  G4:3 G4:1 A4:4 G4:4 C5:4 B4:8
  G4:3 G4:1 A4:4 G4:4 D5:4 C5:8
  G4:3 G4:1 G5:4 E5:4 C5:4 B4:4 A4:4
  F5:3 F5:1 E5:4 C5:4 D5:4 C5:12`;
const bdayProg = [['C', 12], ['G', 12], ['G', 12], ['C', 12], ['C', 12], ['F', 12], ['C', 6], ['G7', 6], ['C', 12]];
export function bdaySong({ full = true, voices = 2 } = {}) {
  const tracks = [
    { inst: 'choir', events: mel(bdayMel, 0, 0.85), wet: 0.35 },
  ];
  if (voices > 1) tracks.push({ inst: 'choir', events: mel(bdayMel, 0, 0.6).map((e) => [e[0], e[1] - 12, e[2], e[3]]), wet: 0.35 });
  if (full) {
    tracks.push({ inst: 'choir', events: mel(bdayMel, 0, 0.5).map((e) => [e[0], e[1] + 12, e[2], e[3]]), wet: 0.4 });
    tracks.push({ inst: 'piano', events: padTrack(bdayProg, 12, 3, 0.45).map((e) => [e[0] + 4, e[1], e[2], e[3]]), wet: 0.3 });
    tracks.push({ inst: 'bass', events: bassTrack(bdayProg, 12, [[0, 'r', 4], [4, '5', 4], [8, '5', 4]], 2, 0.5).map((e) => [e[0] + 4, e[1], e[2], e[3]]) });
    tracks.push({ inst: 'bell', events: mel(bdayMel, 0, 0.3).map((e) => [e[0], e[1] + 24, e[2], e[3]]), wet: 0.6 });
    tracks.push({ inst: 'strings', events: padTrack(bdayProg, 12, 4, 0.35).map((e) => [e[0] + 4, e[1], e[2], e[3]]), wet: 0.5 });
  }
  return song({ bpm: 96, beats: 3, bars: 10, tracks, gain: 1 });
}

// Pequeña caja de música para el cuarto a oscuras
export const MUSICBOX = song({
  bpm: 70, bars: 4,
  tracks: [{ inst: 'bell', events: mel('C6:4 E6:4 G6:4 E6:4 B5:4 D6:4 G6:8 A5:4 C6:4 E6:4 C6:4 G5:16', 0, 0.3), wet: 0.6 }],
});

export { repeat };
