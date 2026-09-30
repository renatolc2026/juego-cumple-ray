import { Grid, addSheet, shade } from './pixel.js';
import { PAL } from './palette.js';

// ---------------------------------------------------------------------------
// Personajes del juego. Cada uno define su aspecto (sprite 16x24 y retrato 64x64),
// su nombre en pantalla y el tono de su "voz" (sonido de las letras del diálogo).
// Para ajustar un personaje (por ejemplo Aurora), basta con cambiar sus colores aquí.
// ---------------------------------------------------------------------------

const JEAN = '#3d6399';
const ROBE = '#7a2140';
const ROBE_COLLAR = '#f4efe4';

export const CHARS = {
  ray: {
    name: 'Ray', voice: 470,
    hair: PAL.hairBlack, style: 'short', glasses: '#15121c',
    top: '#a88a5e', collar: '#6b4430', sleeves: 'long',
    bottom: JEAN, shoes: '#3b2b24',
  },
  mama: {
    name: 'Mamá', voice: 640,
    hair: '#2b2233', style: 'bob', glasses: '#8a4f5a', short: 1,
    top: '#8ccbf0', collar: '#bfe4fa', sleeves: 'short',
    bottom: '#5a5470', shoes: '#e6e0f0', blush: true,
  },
  papa: {
    name: 'Papá', voice: 300,
    hair: '#bdbdc6', style: 'gray', glasses: '#3a3a44',
    top: '#9fd3f2', collar: '#cfeafb', sleeves: 'short', belly: true, watch: '#d8b04a',
    bottom: JEAN, shoes: '#f4f4f4',
  },
  tato: {
    name: 'Tato', voice: 390,
    hair: PAL.hairBlack, style: 'short', roundFace: true,
    top: '#26252e', collar: '#3a3945', sleeves: 'short',
    bottom: '#34496e', shoes: '#26222c',
  },
  maestro: {
    name: 'Maestro del Silencio', voice: 210,
    hair: '#2b2142', style: 'hood', mask: true, cape: '#3d2e63',
    top: '#2b2142', collar: '#2b2142', sleeves: 'long',
    bottom: '#241c38', shoes: '#1a1426',
  },
  eco: {
    name: 'Eco del Silencio', voice: 180,
    hair: '#5b5f78', style: 'hood', mask: true, maskColor: '#9aa0b4', cape: '#4a4e66',
    top: '#4a4e66', collar: '#4a4e66', sleeves: 'long',
    bottom: '#3d4055', shoes: '#2d3040',
  },
  sharon: {
    name: 'Sharon', voice: 720,
    hair: '#3a2218', style: 'bun', blush: true,
    top: '#e23a64', collar: '#ffd166', sleeves: 'none', dress: true,
    bottom: '#e23a64', shoes: '#f4c04a', sparkle: '#ffd166',
  },
  juanmi: {
    name: 'Juanmi', voice: 400,
    hair: '#2a1d17', style: 'curly',
    top: ROBE, collar: ROBE_COLLAR, sleeves: 'long', robe: true, bottom: ROBE, shoes: '#2d1f1a',
  },
  anita: {
    name: 'Anita', voice: 690,
    hair: '#3b2417', style: 'long', blush: true,
    top: ROBE, collar: ROBE_COLLAR, sleeves: 'long', robe: true, bottom: ROBE, shoes: '#2d1f1a',
  },
  mariana: {
    name: 'Mariana', voice: 660,
    hair: PAL.hairBlack, style: 'ponytail', blush: true,
    top: ROBE, collar: ROBE_COLLAR, sleeves: 'long', robe: true, bottom: ROBE, shoes: '#2d1f1a',
  },
  nicol: {
    name: 'Nicol', voice: 740,
    hair: '#6b3b22', style: 'long', blush: true,
    top: ROBE, collar: ROBE_COLLAR, sleeves: 'long', robe: true, bottom: ROBE, shoes: '#2d1f1a',
  },
  angela: {
    name: 'Angela', voice: 610,
    hair: '#2a1c14', style: 'bob', glasses: '#7a3b5a', blush: true,
    top: ROBE, collar: ROBE_COLLAR, sleeves: 'long', robe: true, bottom: ROBE, shoes: '#2d1f1a',
  },
  mimi: {
    name: 'Mimi', voice: 780,
    hair: PAL.hairBlack, style: 'pigtails', blush: true,
    top: ROBE, collar: ROBE_COLLAR, sleeves: 'long', robe: true, bottom: ROBE, shoes: '#2d1f1a',
  },
  ricardo: {
    name: 'Ricardo', voice: 430,
    hair: PAL.hairBlack, style: 'short', glasses: '#2a2a33',
    top: '#3b7a57', collar: '#56a077', sleeves: 'long', bottom: JEAN, shoes: '#2b2b33',
  },
  bismark: {
    name: 'Bismark', voice: 360,
    hair: '#2a1d17', style: 'cap', hat: '#d94f3d',
    top: '#2d3a66', collar: '#46558c', sleeves: 'long', bottom: '#2f2f3a', shoes: '#e8e8e8',
  },
  // Nombres pendientes en el documento de diseño: se cambian aquí.
  dev1: {
    name: 'Programador', voice: 410,
    hair: '#3a2a20', style: 'headphones', hat: '#e0e0e8',
    top: '#5a3d8a', collar: '#7b5bb0', sleeves: 'long', bottom: JEAN, shoes: '#2b2b33',
  },
  dev2: {
    name: 'Programadora', voice: 700,
    hair: '#2a1c14', style: 'ponytail', glasses: '#2a2a33', blush: true,
    top: '#2f8f9a', collar: '#58b8c2', sleeves: 'long', bottom: '#3a3a4a', shoes: '#2b2b33',
  },
  dev3: {
    name: 'Programador', voice: 340,
    hair: PAL.hairBlack, style: 'spiky',
    top: '#c46a2f', collar: '#e08a4f', sleeves: 'short', bottom: '#3a3a4a', shoes: '#2b2b33',
  },
  cesar: {
    name: 'César', voice: 380,
    hair: PAL.hairBlack, style: 'spiky',
    top: '#e0873a', collar: '#f2a861', sleeves: 'short', bottom: JEAN, shoes: '#f0f0f0',
  },
  elbers: {
    name: 'Elbers', voice: 330,
    hair: '#2a1d17', style: 'short', glasses: '#2a2a33',
    top: '#c94b4b', collar: '#e06b6b', sleeves: 'short', bottom: '#2f3f5f', shoes: '#2b2b33',
  },
  martin: {
    name: 'Martín', voice: 420,
    hair: '#241a14', style: 'curly',
    top: '#e8c64a', collar: '#f5dc7a', sleeves: 'short', bottom: JEAN, shoes: '#3a2a22',
  },
  // Aspecto pendiente en el documento: aquí se ajusta.
  aurora: {
    name: 'Aurora', voice: 680,
    hair: '#5a3322', style: 'long', blush: true,
    top: '#b58ee0', collar: '#d3b8f2', sleeves: 'short', dress: true,
    bottom: '#b58ee0', shoes: '#6a4a8a',
  },
  vendedor: {
    name: 'Raspadillero', voice: 330,
    hair: '#8a8a94', style: 'cap', hat: '#f4f4f4',
    top: '#f4f4f4', collar: '#ffffff', sleeves: 'short', belly: true, bottom: '#4a5a7a', shoes: '#3a2a22',
  },
  bailarin: {
    name: 'Bailarín', voice: 360,
    hair: '#2a1d17', style: 'short',
    top: '#f4f4f4', collar: '#ffd166', sleeves: 'long', bottom: '#26252e', shoes: '#26252e',
  },
  bailarina: {
    name: 'Bailarina', voice: 700,
    hair: '#1f1b29', style: 'ponytail', blush: true,
    top: '#3fb5e8', collar: '#8fd3ff', sleeves: 'none', dress: true, bottom: '#3fb5e8', shoes: '#f4c04a', sparkle: '#ffffff',
  },
  vecina: {
    name: 'Tía Charo', voice: 600,
    hair: '#3a2a22', style: 'bun', blush: true,
    top: '#f28c8c', collar: '#ffb0b0', sleeves: 'short', dress: true, bottom: '#f28c8c', shoes: '#8a4a4a',
  },
  nino: {
    name: 'Niño', voice: 820,
    hair: PAL.hairBlack, style: 'spiky', short: 3,
    top: '#56b4e9', collar: '#8fd3ff', sleeves: 'short', bottom: '#e8a33b', shoes: '#e84a4a',
  },
};

// Direcciones: 0 abajo, 1 izquierda, 2 derecha, 3 arriba
export const DIR = { down: 0, left: 1, right: 2, up: 3 };
export const DIR_NAMES = ['down', 'left', 'right', 'up'];

// ---------------------------------------------------------------------------
// Dibujo del cuerpo 16x24
// ---------------------------------------------------------------------------

function colors(p) {
  const skin = p.skin || PAL.skin;
  return {
    skin,
    skinSh: p.skinSh || shade(skin, -0.16),
    hair: p.hair,
    hairHi: shade(p.hair, 0.22),
    hairSh: shade(p.hair, -0.25),
    top: p.top,
    topSh: shade(p.top, -0.22),
    topHi: shade(p.top, 0.18),
    collar: p.collar || shade(p.top, 0.2),
    bottom: p.bottom,
    bottomSh: shade(p.bottom, -0.25),
    shoes: p.shoes,
    glasses: p.glasses,
    mask: p.maskColor || '#f2efe6',
    maskSh: shade(p.maskColor || '#f2efe6', -0.15),
    cape: p.cape,
    capeSh: p.cape ? shade(p.cape, -0.25) : null,
    hat: p.hat || '#d94f3d',
  };
}

// Piernas / falda. step: 0 quieto, 1 paso con pie izq, 3 paso con pie der
function drawLegsFront(g, p, c, step, oy) {
  const lUp = step === 3 ? 1 : 0;
  const rUp = step === 1 ? 1 : 0;
  if (p.robe) {
    // Túnica larga del coro
    g.rect(4, 17 + oy, 8, 4, c.bottom);
    g.rect(3, 19 + oy, 10, 2, c.bottom);
    g.hline(3, 20 + oy, 10, c.bottomSh);
    g.rect(4, 21 - lUp, 3, 1, c.shoes);
    g.rect(9, 21 - rUp, 3, 1, c.shoes);
    return;
  }
  if (p.dress) {
    g.rect(4, 16 + oy, 8, 2, c.bottom);
    g.rect(3, 18 + oy, 10, 2, c.bottom);
    g.hline(3, 19 + oy, 10, c.bottomSh);
    if (p.sparkle) g.px([[5, 18 + oy], [9, 17 + oy], [11, 19 + oy]], p.sparkle);
    g.rect(5, 20 + oy, 2, 2 - lUp, c.skin);
    g.rect(9, 20 + oy, 2, 2 - rUp, c.skin);
    g.rect(4, 22 - lUp, 3, 1, c.shoes);
    g.rect(9, 22 - rUp, 3, 1, c.shoes);
    return;
  }
  g.rect(4, 18 + oy, 8, 1, c.bottom);
  const legH = 21 - (19 + oy) + 1;
  g.rect(5, 19 + oy, 3, legH - lUp, c.bottom);
  g.rect(8, 19 + oy, 3, legH - rUp, c.bottom);
  g.vline(7, 19 + oy, legH - lUp, c.bottomSh);
  g.vline(10, 19 + oy, legH - rUp, c.bottomSh);
  g.rect(4, 22 - lUp, 4, 1, c.shoes);
  g.rect(8, 22 - rUp, 4, 1, c.shoes);
}

function drawTorsoFront(g, p, c, step, oy, back = false, pose = false) {
  // Capa (detrás del cuerpo)
  if (p.cape && !back) {
    g.rect(2, 13 + oy, 12, 8, c.capeSh);
  }
  const y0 = 13 + oy;
  g.rect(4, y0, 8, 5, c.top);
  g.vline(11, y0, 5, c.topSh);
  g.hline(4, y0 + 4, 8, c.topSh);
  g.set(4, y0, c.topHi);
  if (p.belly) {
    g.rect(4, y0 + 2, 8, 3, c.top);
    g.hline(5, y0 + 4, 6, c.topSh);
    g.set(3, y0 + 3, c.top);
    g.set(12, y0 + 3, c.topSh);
  }
  if (!back) {
    // Cuello de polo / chompa
    g.rect(6, y0, 4, 1, c.collar);
    g.set(7, y0 + 1, c.collar);
    g.set(8, y0 + 1, c.collar);
    if (p.sparkle) g.px([[5, y0 + 2], [10, y0 + 1]], p.sparkle);
  }
  // Brazos
  const armC = c.top;
  const skinArm = p.sleeves === 'long' ? c.topSh : c.skin;
  if (pose) {
    // Brazos arriba celebrando
    g.rect(2, y0 - 4, 2, 5, p.sleeves === 'long' ? c.top : c.skin);
    g.rect(12, y0 - 4, 2, 5, p.sleeves === 'long' ? c.top : c.skin);
    g.rect(2, y0 - 5, 2, 1, c.skin);
    g.rect(12, y0 - 5, 2, 1, c.skin);
    if (p.sleeves !== 'long') {
      g.rect(2, y0, 2, 1, armC);
      g.rect(12, y0, 2, 1, armC);
    }
    return;
  }
  const lSwing = step === 1 ? -1 : step === 3 ? 1 : 0;
  const rSwing = -lSwing;
  const armL = (sw) => {
    g.rect(3, y0, 1, 2, armC);
    g.rect(3, y0 + 2, 1, 2 + sw, p.sleeves === 'none' ? c.skin : skinArm);
    if (p.sleeves === 'none') g.rect(3, y0, 1, 2, c.skin);
    g.set(3, y0 + 4 + sw, c.skin);
  };
  const armR = (sw) => {
    g.rect(12, y0, 1, 2, armC);
    g.rect(12, y0 + 2, 1, 2 + sw, p.sleeves === 'none' ? c.skin : skinArm);
    if (p.sleeves === 'none') g.rect(12, y0, 1, 2, c.skin);
    g.set(12, y0 + 4 + sw, c.skin);
    if (p.watch && !back) g.set(12, y0 + 3 + sw, p.watch);
  };
  armL(lSwing);
  armR(rSwing);
  if (p.sleeves === 'short') {
    g.set(3, y0 + 2, c.skin);
    g.set(12, y0 + 2, c.skin);
  }
}

function headRows(p) {
  return p.roundFace ? { l: 3, r: 12 } : { l: 4, r: 11 };
}

function drawHeadFront(g, p, c, oy) {
  const { l, r } = headRows(p);
  // Cara
  g.rect(l, 5 + oy, r - l + 1, 6, c.skin);
  g.rect(l + 1, 11 + oy, r - l - 1, 1, c.skin);
  g.set(r, 10 + oy, c.skinSh);
  g.rect(l + 1, 11 + oy, r - l - 1, 1, c.skin);
  g.set(r - 1, 11 + oy, c.skinSh);
  // Orejas
  g.set(3, 8 + oy, c.skin);
  g.set(12, 8 + oy, c.skinSh);
  // Cuello
  g.rect(6, 12 + oy, 4, 1, c.skinSh);

  if (p.mask) {
    // Máscara blanca con clave de sol
    g.rect(l, 6 + oy, r - l + 1, 6, c.mask);
    g.rect(l + 1, 11 + oy, r - l - 1, 1, c.maskSh);
    g.set(5, 8 + oy, PAL.ink);
    g.set(6, 8 + oy, PAL.ink);
    g.set(9, 8 + oy, PAL.ink);
    g.set(10, 8 + oy, PAL.ink);
    g.set(7, 7 + oy, c.hair);
    g.set(8, 8 + oy, c.hair);
    g.set(7, 9 + oy, c.hair);
    g.set(8, 10 + oy, c.hair);
    g.set(7, 10 + oy, c.hair);
  } else {
    // Ojos
    if (p.glasses) {
      const lens = '#d8e6ee';
      g.hline(5, 8 + oy, 6, p.glasses);
      g.set(4, 8 + oy, p.glasses);
      g.set(11, 8 + oy, p.glasses);
      g.set(5, 9 + oy, lens);
      g.set(6, 9 + oy, PAL.ink);
      g.set(7, 9 + oy, p.glasses);
      g.set(8, 9 + oy, p.glasses);
      g.set(9, 9 + oy, PAL.ink);
      g.set(10, 9 + oy, lens);
    } else {
      g.set(6, 8 + oy, PAL.ink);
      g.set(6, 9 + oy, PAL.ink);
      g.set(9, 8 + oy, PAL.ink);
      g.set(9, 9 + oy, PAL.ink);
      g.set(6, 8 + oy, '#3a2f4a');
      g.set(9, 8 + oy, '#3a2f4a');
    }
    if (p.blush) {
      g.set(l, 10 + oy, PAL.blush);
      g.set(r, 10 + oy, PAL.blush);
    }
    g.set(7, 11 + oy, PAL.mouth);
    g.set(8, 11 + oy, PAL.mouth);
  }
}

function drawHairFront(g, p, c, oy) {
  const H = c.hair;
  const Hh = c.hairHi;
  const Hs = c.hairSh;
  const st = p.style;
  if (st === 'hood') {
    g.rect(4, 1 + oy, 8, 1, H);
    g.rect(3, 2 + oy, 10, 4, H);
    g.rect(2, 4 + oy, 2, 9, H);
    g.rect(12, 4 + oy, 2, 9, H);
    g.hline(4, 2 + oy, 3, Hh);
    g.vline(13, 5 + oy, 7, Hs);
    return;
  }
  if (st === 'cap') {
    g.rect(4, 1 + oy, 8, 1, c.hat);
    g.rect(3, 2 + oy, 10, 3, c.hat);
    g.hline(4, 2 + oy, 3, shade(c.hat, 0.25));
    g.rect(2, 5 + oy, 12, 1, shade(c.hat, -0.25));
    g.set(3, 6 + oy, H);
    g.set(12, 6 + oy, H);
    g.set(3, 7 + oy, H);
    g.set(12, 7 + oy, H);
    return;
  }
  // Base de pelo corto
  g.rect(5, 1 + oy, 6, 1, H);
  g.rect(4, 2 + oy, 8, 1, H);
  g.rect(3, 3 + oy, 10, 3, H);
  g.set(3, 6 + oy, H);
  g.set(12, 6 + oy, H);
  g.set(3, 7 + oy, H);
  g.set(12, 7 + oy, Hs);
  g.hline(5, 2 + oy, 3, Hh);
  g.hline(4, 3 + oy, 2, Hh);
  // Flequillo
  g.set(6, 6 + oy, H);
  g.set(9, 6 + oy, H);
  g.set(10, 6 + oy, H);
  g.set(11, 6 + oy, H);
  g.set(4, 6 + oy, H);

  if (st === 'gray') {
    g.set(7, 6 + oy, null);
    g.set(9, 6 + oy, null);
    g.set(7, 6 + oy, c.skin);
    g.set(9, 6 + oy, c.skin);
  }
  if (st === 'bob' || st === 'long' || st === 'pigtails') {
    g.rect(2, 5 + oy, 2, 6, H);
    g.rect(12, 5 + oy, 2, 6, Hs);
    g.set(3, 11 + oy, H);
    g.set(12, 11 + oy, Hs);
    g.set(3, 8 + oy, H);
    g.set(12, 8 + oy, Hs);
  }
  if (st === 'long') {
    g.rect(2, 11 + oy, 2, 5, H);
    g.rect(12, 11 + oy, 2, 5, Hs);
  }
  if (st === 'pigtails') {
    g.rect(0, 6 + oy, 2, 5, H);
    g.rect(14, 6 + oy, 2, 5, Hs);
    g.set(2, 5 + oy, '#ff6f91');
    g.set(13, 5 + oy, '#ff6f91');
  }
  if (st === 'bun') {
    g.rect(6, 0, 4, 2, H);
    g.set(7, 0, Hh);
  }
  if (st === 'ponytail') {
    g.set(12, 4 + oy, '#ff6f91');
  }
  if (st === 'curly') {
    g.px([[4, 1 + oy], [11, 1 + oy], [2, 4 + oy], [13, 4 + oy], [2, 6 + oy], [13, 6 + oy]], H);
    g.px([[6, 1 + oy], [9, 3 + oy]], Hh);
  }
  if (st === 'spiky') {
    g.px([[5, 0], [8, 0], [10, 0 + oy], [3, 2 + oy], [12, 2 + oy]], H);
    g.set(7, 1 + oy, Hh);
  }
  if (st === 'headphones') {
    g.hline(4, 1 + oy, 8, c.hat);
    g.rect(2, 6 + oy, 2, 3, c.hat);
    g.rect(12, 6 + oy, 2, 3, shade(c.hat, -0.2));
  }
}

function drawHeadBack(g, p, c, oy) {
  const H = c.hair;
  const Hs = c.hairSh;
  const st = p.style;
  g.rect(6, 12 + oy, 4, 1, c.skinSh);
  if (st === 'hood') {
    g.rect(4, 1 + oy, 8, 1, H);
    g.rect(3, 2 + oy, 10, 10, H);
    g.rect(2, 4 + oy, 12, 9, H);
    g.vline(13, 4 + oy, 8, Hs);
    return;
  }
  if (st === 'cap') {
    g.rect(4, 1 + oy, 8, 1, c.hat);
    g.rect(3, 2 + oy, 10, 4, c.hat);
    g.rect(3, 6 + oy, 10, 4, H);
    g.rect(5, 10 + oy, 6, 1, H);
    g.set(3, 8 + oy, c.skin);
    g.set(12, 8 + oy, c.skinSh);
    return;
  }
  g.rect(5, 1 + oy, 6, 1, H);
  g.rect(4, 2 + oy, 8, 1, H);
  g.rect(3, 3 + oy, 10, 7, H);
  g.rect(4, 10 + oy, 8, 1, H);
  g.rect(5, 11 + oy, 6, 1, c.skin);
  g.set(3, 8 + oy, c.skin);
  g.set(12, 8 + oy, c.skinSh);
  g.vline(12, 3 + oy, 7, Hs);
  g.hline(5, 2 + oy, 3, c.hairHi);
  if (st === 'gray') g.hline(5, 11 + oy, 6, c.skin);
  if (st === 'bob' || st === 'long' || st === 'pigtails') {
    g.rect(2, 5 + oy, 12, 7, H);
    g.vline(13, 5 + oy, 7, Hs);
  }
  if (st === 'long') g.rect(3, 12 + oy, 10, 4, H);
  if (st === 'pigtails') {
    g.rect(0, 6 + oy, 2, 5, H);
    g.rect(14, 6 + oy, 2, 5, Hs);
  }
  if (st === 'ponytail') {
    g.rect(7, 10 + oy, 2, 5, H);
    g.set(7, 9 + oy, '#ff6f91');
    g.set(8, 9 + oy, '#ff6f91');
  }
  if (st === 'bun') g.rect(6, 0, 4, 2, H);
  if (st === 'curly') g.px([[2, 4 + oy], [13, 4 + oy], [2, 7 + oy], [13, 7 + oy]], H);
  if (st === 'spiky') g.px([[5, 0], [8, 0], [10, 0], [3, 2 + oy], [12, 2 + oy]], H);
  if (st === 'headphones') {
    g.hline(4, 1 + oy, 8, c.hat);
    g.rect(2, 6 + oy, 2, 3, c.hat);
    g.rect(12, 6 + oy, 2, 3, shade(c.hat, -0.2));
  }
}

function drawFront(p, step, pose = false) {
  const c = colors(p);
  const g = new Grid(16, 24);
  const oy = p.short ? Math.min(p.short, 1) : 0;
  const bob = step === 1 || step === 3 ? 1 : 0;
  if (p.style === 'long') {
    // Pelo largo detrás de los hombros
  }
  drawLegsFront(g, p, c, pose ? 0 : step, oy);
  const up = new Grid(16, 24);
  drawTorsoFront(up, p, c, step, oy, false, pose);
  drawHeadFront(up, p, c, oy);
  drawHairFront(up, p, c, oy);
  if (p.cape) {
    // Bordes de la capa asoman por los lados
    up.rect(2, 13 + oy, 1, 7, c.cape);
    up.rect(13, 13 + oy, 1, 7, c.capeSh);
  }
  g.blit(up, 0, bob);
  shrinkFor(p, g);
  return g.outline(PAL.ink);
}

function drawBack(p, step) {
  const c = colors(p);
  const g = new Grid(16, 24);
  const oy = p.short ? Math.min(p.short, 1) : 0;
  const bob = step === 1 || step === 3 ? 1 : 0;
  drawLegsFront(g, p, c, step === 1 ? 3 : step === 3 ? 1 : 0, oy);
  const up = new Grid(16, 24);
  drawTorsoFront(up, p, c, step, oy, true);
  if (p.cape) {
    up.rect(3, 13 + oy, 10, 8, c.cape);
    up.vline(12, 13 + oy, 8, c.capeSh);
    // Notas tachadas en la capa
    up.px([[5, 16 + oy], [5, 17 + oy], [6, 15 + oy], [9, 17 + oy], [9, 18 + oy], [10, 16 + oy]], '#b9a8d6');
    up.line(4, 18 + oy, 7, 15 + oy, '#e8505b');
    up.line(8, 19 + oy, 11, 16 + oy, '#e8505b');
  }
  drawHeadBack(up, p, c, oy);
  g.blit(up, 0, bob);
  shrinkFor(p, g);
  return g.outline(PAL.ink);
}

function drawSide(p, step) {
  // Mirando a la izquierda
  const c = colors(p);
  const g = new Grid(16, 24);
  const oy = p.short ? Math.min(p.short, 1) : 0;
  const bob = step === 1 || step === 3 ? 1 : 0;
  const H = c.hair;
  const Hs = c.hairSh;

  // Piernas
  if (p.robe) {
    g.rect(5, 17 + oy, 6, 4, c.bottom);
    g.rect(4, 19 + oy, 8, 2, c.bottom);
    g.hline(4, 20 + oy, 8, c.bottomSh);
    if (step === 1) g.rect(3, 21, 3, 1, c.shoes);
    else if (step === 3) g.rect(8, 21, 3, 1, c.shoes);
    else g.rect(5, 21, 4, 1, c.shoes);
  } else if (p.dress) {
    g.rect(5, 16 + oy, 6, 2, c.bottom);
    g.rect(4, 18 + oy, 8, 2, c.bottom);
    g.hline(4, 19 + oy, 8, c.bottomSh);
    if (step === 1 || step === 3) {
      g.rect(5, 20 + oy, 1, 2, c.skin);
      g.rect(9, 20 + oy, 1, 2, c.skin);
      g.rect(3, 22, 3, 1, c.shoes);
      g.rect(9, 22, 3, 1, c.shoes);
    } else {
      g.rect(7, 20 + oy, 2, 2, c.skin);
      g.rect(6, 22, 4, 1, c.shoes);
    }
  } else {
    g.rect(5, 18 + oy, 6, 1, c.bottom);
    if (step === 1 || step === 3) {
      // Piernas abiertas
      g.line(6, 19 + oy, 4, 21, c.bottom);
      g.line(7, 19 + oy, 5, 21, c.bottom);
      g.line(8, 19 + oy, 10, 21, c.bottomSh);
      g.line(9, 19 + oy, 11, 21, c.bottomSh);
      g.rect(2, 22, 4, 1, c.shoes);
      g.rect(10, 22, 3, 1, shade(c.shoes, -0.2));
    } else {
      g.rect(6, 19 + oy, 4, 3 - oy, c.bottom);
      g.vline(9, 19 + oy, 3 - oy, c.bottomSh);
      g.rect(5, 22, 5, 1, c.shoes);
    }
  }

  const up = new Grid(16, 24);
  const y0 = 13 + oy;
  // Capa por detrás
  if (p.cape) up.rect(8, y0, 5, 8, c.capeSh);
  // Torso
  up.rect(5, y0, 6, 5, c.top);
  up.vline(10, y0, 5, c.topSh);
  up.hline(5, y0 + 4, 6, c.topSh);
  if (p.belly) {
    up.rect(4, y0 + 2, 1, 3, c.top);
    up.set(4, y0 + 4, c.topSh);
  }
  up.set(5, y0, c.collar);
  up.set(6, y0, c.collar);
  // Brazo
  const sw = step === 1 ? -2 : step === 3 ? 2 : 0;
  const armCol = p.sleeves === 'long' ? c.topSh : c.skin;
  up.rect(7, y0, 2, 2, p.sleeves === 'none' ? c.skin : c.topSh);
  if (sw === 0) {
    up.rect(7, y0 + 2, 2, 2, armCol);
    up.rect(7, y0 + 4, 2, 1, c.skin);
    if (p.watch) up.set(7, y0 + 3, p.watch);
  } else {
    up.line(7, y0 + 2, 7 + sw, y0 + 3, armCol);
    up.line(8, y0 + 2, 8 + sw, y0 + 3, armCol);
    up.set(7 + sw, y0 + 4, c.skin);
    up.set(8 + sw, y0 + 4, c.skin);
  }

  // Cabeza
  up.rect(6, 12 + oy, 3, 1, c.skinSh);
  if (p.roundFace) {
    up.rect(2, 5 + oy, 8, 6, c.skin);
  } else {
    up.rect(3, 5 + oy, 7, 6, c.skin);
  }
  up.rect(4, 11 + oy, 5, 1, c.skin);
  up.set(2, 9 + oy, c.skin); // nariz
  if (p.mask) {
    up.rect(2, 6 + oy, 6, 6, c.mask);
    up.rect(3, 11 + oy, 5, 1, c.maskSh);
    up.set(3, 8 + oy, PAL.ink);
    up.set(4, 8 + oy, PAL.ink);
    up.set(5, 9 + oy, c.hair);
    up.set(5, 10 + oy, c.hair);
  } else if (p.glasses) {
    up.hline(3, 8 + oy, 6, p.glasses);
    up.set(3, 9 + oy, p.glasses);
    up.set(4, 9 + oy, PAL.ink);
    up.set(5, 9 + oy, p.glasses);
    up.hline(3, 10 + oy, 3, p.glasses);
    up.set(3, 11 + oy, PAL.mouth);
  } else {
    up.set(4, 8 + oy, '#3a2f4a');
    up.set(4, 9 + oy, PAL.ink);
    up.set(3, 11 + oy, PAL.mouth);
  }
  if (p.blush && !p.mask) up.set(5, 10 + oy, PAL.blush);
  // Oreja
  if (!p.mask) up.set(8, 8 + oy, c.skinSh);

  // Pelo
  if (p.style === 'hood') {
    up.rect(4, 1 + oy, 7, 1, H);
    up.rect(3, 2 + oy, 9, 4, H);
    up.rect(8, 5 + oy, 5, 8, H);
    up.vline(12, 5 + oy, 7, Hs);
  } else if (p.style === 'cap') {
    up.rect(4, 1 + oy, 7, 1, c.hat);
    up.rect(3, 2 + oy, 9, 3, c.hat);
    up.rect(0, 5 + oy, 6, 1, shade(c.hat, -0.25));
    up.rect(6, 5 + oy, 5, 1, c.hat);
    up.rect(9, 6 + oy, 3, 4, H);
  } else {
    up.rect(4, 1 + oy, 7, 1, H);
    up.rect(3, 2 + oy, 9, 3, H);
    up.rect(2, 5 + oy, 4, 1, H);
    up.rect(6, 5 + oy, 6, 1, H);
    up.rect(9, 6 + oy, 3, 3, H);
    up.set(10, 9 + oy, Hs);
    up.hline(4, 2 + oy, 3, c.hairHi);
    if (p.style === 'gray') up.set(3, 5 + oy, c.skin);
    if (p.style === 'bob' || p.style === 'long' || p.style === 'pigtails') {
      up.rect(8, 5 + oy, 5, 7, H);
      up.vline(12, 5 + oy, 7, Hs);
    }
    if (p.style === 'long') up.rect(9, 12 + oy, 4, 4, H);
    if (p.style === 'pigtails') up.rect(11, 7 + oy, 3, 5, H);
    if (p.style === 'ponytail') {
      up.rect(11, 5 + oy, 2, 6, H);
      up.set(11, 4 + oy, '#ff6f91');
    }
    if (p.style === 'bun') up.rect(8, 0, 4, 2, H);
    if (p.style === 'curly') up.px([[3, 1 + oy], [12, 3 + oy], [12, 6 + oy]], H);
    if (p.style === 'spiky') up.px([[5, 0], [8, 0], [12, 1 + oy], [2, 3 + oy]], H);
    if (p.style === 'headphones') {
      up.hline(5, 1 + oy, 5, c.hat);
      up.rect(7, 6 + oy, 3, 3, c.hat);
    }
  }
  if (p.cape) {
    up.rect(10, y0, 3, 8, c.cape);
  }
  g.blit(up, 0, bob);
  shrinkFor(p, g);
  return g.outline(PAL.ink);
}

// Para personajes pequeños (niño) desplazamos todo hacia abajo
function shrinkFor(p, g) {
  if (p.short && p.short > 1) {
    const s = g.shifted(0, p.short - 1);
    g.d = s.d;
  }
}

// Genera la hoja de sprites de un personaje: 16 cuadros de caminar + pose
export function buildCharacter(scene, id) {
  const p = CHARS[id];
  const frames = [];
  const front = [0, 1, 2, 3].map((s) => drawFront(p, s));
  const left = [0, 1, 2, 3].map((s) => drawSide(p, s));
  const right = left.map((f) => f.flipped());
  const back = [0, 1, 2, 3].map((s) => drawBack(p, s));
  frames.push(...front, ...left, ...right, ...back);
  frames.push(drawFront(p, 0, true)); // 16: pose brazos arriba
  addSheet(scene, `ch_${id}`, frames);
}

// Animaciones de caminar para todos los personajes
export function buildCharacterAnims(scene, id) {
  const key = `ch_${id}`;
  DIR_NAMES.forEach((d, i) => {
    const k = `${id}_walk_${d}`;
    if (!scene.anims.exists(k)) {
      scene.anims.create({
        key: k,
        frames: [1, 2, 3, 0].map((f) => ({ key, frame: i * 4 + f })),
        frameRate: 8,
        repeat: -1,
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Animales 16x16 (Hachi, Micha, Shiro)
// ---------------------------------------------------------------------------

function drawDog(dir, frame, opts = {}) {
  const g = new Grid(16, 16);
  const W = '#fbf6ee';
  const C = '#f1dcc0';
  const S = '#d8bf9c';
  const E = '#1b1226';
  const T = '#ff7f9a';
  const bob = frame % 2 === 1 ? 1 : 0;
  if (dir === 0 || dir === 3) {
    // Cuerpo
    g.ellipse(8, 11 + bob * 0.5, 5, 3.6, W, S);
    // Patitas
    const l = frame === 1 ? 1 : 0;
    const r = frame === 3 ? 1 : 0;
    g.rect(4, 13 - l, 2, 2, C);
    g.rect(10, 13 - r, 2, 2, C);
    if (dir === 0) {
      // Cabeza de frente
      g.ellipse(8, 6.5, 5, 4.5, W, C);
      g.ellipse(3.5, 7, 1.8, 3, C, S); // orejas
      g.ellipse(12.5, 7, 1.8, 3, C, S);
      g.set(6, 6, E);
      g.set(10, 6, E);
      g.set(6, 5, '#3a2f4a');
      g.set(10, 5, '#3a2f4a');
      g.set(8, 8, E); // nariz
      if (!opts.ball) {
        g.set(8, 9, T); // lengua
        g.set(8, 10, T);
      } else {
        g.ellipse(8, 10, 2.2, 2, '#d9ee4b', '#a8c13a');
      }
      g.set(5, 8, '#ffc2c2');
      g.set(11, 8, '#ffc2c2');
    } else {
      g.ellipse(8, 6.5, 5, 4.5, W, C);
      g.ellipse(3.5, 7, 1.8, 3, C, S);
      g.ellipse(12.5, 7, 1.8, 3, C, S);
      // Colita
      const wag = frame % 2 === 0 ? -1 : 1;
      g.ellipse(8 + wag, 10, 1.6, 1.6, W, C);
    }
  } else {
    // De lado (mirando a la izquierda)
    g.ellipse(9, 10.5, 5.2, 3.4, W, S);
    const a = frame === 1 ? 1 : frame === 3 ? -1 : 0;
    g.rect(5 + a, 13, 2, 2, C);
    g.rect(11 - a, 13, 2, 2, C);
    g.ellipse(5, 6.5, 4.2, 4, W, C);
    g.ellipse(7, 7, 1.7, 3, C, S); // oreja
    g.set(3, 6, E);
    g.set(1, 7, E); // nariz
    if (!opts.ball) {
      g.set(2, 9, T);
      g.set(2, 10, T);
    } else {
      g.ellipse(2, 9, 2, 2, '#d9ee4b', '#a8c13a');
    }
    // Cola
    const wag = frame % 2 === 0 ? 0 : 1;
    g.ellipse(14, 7 + wag, 1.6, 2, W, C);
  }
  if (opts.sit) {
    // Sentado feliz: ojos cerrados
    g.set(6, 6, null);
    g.set(10, 6, null);
    g.set(6, 6, W);
    g.set(10, 6, W);
    g.px([[5, 6], [7, 6], [9, 6], [11, 6]], E);
    g.px([[6, 5], [10, 5]], E);
  }
  return g.outline(PAL.ink);
}

function drawCat(color, dir, frame, sleep = false) {
  const g = new Grid(16, 16);
  const B = color;
  const Bs = shade(color, color === '#26222e' ? 0.15 : -0.14);
  const Bh = shade(color, color === '#26222e' ? 0.3 : 0.1);
  const eye = color === '#26222e' ? '#ffd166' : '#6cc6ff';
  if (sleep) {
    g.ellipse(8, 11, 6, 3.6, B, Bs, Bh);
    g.ellipse(4.5, 9.5, 3, 2.6, B, Bs);
    g.px([[2, 7], [3, 6], [5, 6], [6, 7]], B);
    g.hline(3, 10, 2, Bs === B ? '#555' : PAL.ink);
    g.ellipse(12.5, 12.5, 2.5, 1.3, Bh);
    return g.outline(PAL.ink);
  }
  const step = frame % 2;
  if (dir === 0 || dir === 3) {
    g.ellipse(8, 11, 4, 3.4, B, Bs);
    g.rect(5, 13 - (frame === 1 ? 1 : 0), 2, 2, B);
    g.rect(9, 13 - (frame === 3 ? 1 : 0), 2, 2, B);
    g.ellipse(8, 6.5, 4.2, 3.6, B, Bs, Bh);
    g.px([[4, 3], [4, 4], [5, 3], [11, 3], [11, 4], [10, 3]], B);
    if (dir === 0) {
      g.set(6, 6, eye);
      g.set(10, 6, eye);
      g.set(8, 8, '#ff8fb1');
    } else {
      g.line(12, 10, 14, 6 + step, B);
    }
  } else {
    g.ellipse(9, 10.5, 4.6, 3, B, Bs);
    const a = frame === 1 ? 1 : frame === 3 ? -1 : 0;
    g.rect(6 + a, 12, 1, 3, B);
    g.rect(11 - a, 12, 1, 3, B);
    g.ellipse(5, 7, 3.4, 3.2, B, Bs, Bh);
    g.px([[3, 3], [3, 4], [6, 3], [6, 4]], B);
    g.set(3, 6, eye);
    g.set(1, 8, '#ff8fb1');
    g.line(13, 9, 15, 5 + step, B);
  }
  return g.outline(PAL.ink);
}

export function buildAnimals(scene) {
  // Hachi: 4 dir x 4 cuadros + 16 sentado + 17 con pelota (frente)
  const dogFrames = [];
  for (const d of [0, 1, 2, 3]) {
    for (let f = 0; f < 4; f++) {
      const fr = drawDog(d === 2 ? 1 : d, f);
      dogFrames.push(d === 2 ? fr.flipped() : fr);
    }
  }
  dogFrames.push(drawDog(0, 0, { sit: true }));
  dogFrames.push(drawDog(0, 0, { ball: true }));
  dogFrames.push(drawDog(1, 1, { ball: true }));
  dogFrames.push(drawDog(1, 1, { ball: true }).flipped());
  addSheet(scene, 'ch_hachi', dogFrames);

  const cat = (key, color) => {
    const fr = [];
    for (const d of [0, 1, 2, 3]) {
      for (let f = 0; f < 4; f++) {
        const x = drawCat(color, d === 2 ? 1 : d, f);
        fr.push(d === 2 ? x.flipped() : x);
      }
    }
    fr.push(drawCat(color, 0, 0, true));
    addSheet(scene, key, fr);
  };
  cat('ch_micha', '#26222e');
  cat('ch_shiro', '#f7f7fb');

  for (const id of ['hachi', 'micha', 'shiro']) {
    DIR_NAMES.forEach((d, i) => {
      const k = `${id}_walk_${d}`;
      if (!scene.anims.exists(k)) {
        scene.anims.create({
          key: k,
          frames: [1, 2, 3, 0].map((f) => ({ key: `ch_${id}`, frame: i * 4 + f })),
          frameRate: id === 'shiro' ? 12 : 9,
          repeat: -1,
        });
      }
    });
  }
  // Hachi moviendo la cola (pantalla de título)
  if (!scene.anims.exists('hachi_wag')) {
    scene.anims.create({
      key: 'hachi_wag',
      frames: [12, 13, 14, 13].map((f) => ({ key: 'ch_hachi', frame: f })),
      frameRate: 8,
      repeat: -1,
    });
  }
}

export function buildAllCharacters(scene) {
  for (const id of Object.keys(CHARS)) {
    buildCharacter(scene, id);
    buildCharacterAnims(scene, id);
  }
  buildAnimals(scene);
}
