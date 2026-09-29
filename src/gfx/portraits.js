import { Grid, addTexture, shade, mix } from './pixel.js';
import { PAL } from './palette.js';
import { CHARS } from './characters.js';

// Retratos 64x64 para los diálogos. Expresiones: normal, happy, surprised, sad.
export const EXPRESSIONS = ['normal', 'happy', 'surprised', 'sad'];

const EYE = '#2a1f36';
const EYE2 = '#4a3656';

function hairInCap(style, x, y) {
  // Devuelve true si (x,y) dentro de la "gorra" de pelo debe ser pelo (define el flequillo)
  const dx = x - 32;
  switch (style) {
    case 'gray':
      return y < 19 + Math.abs(dx) * 0.12 || (Math.abs(dx) > 14 && y < 30);
    case 'bob':
    case 'long':
    case 'pigtails':
      // Raya al costado
      return y < 21 + (dx < -2 ? Math.max(0, -dx - 2) * 0.35 : Math.sin(dx * 0.7) * 1.2) || Math.abs(dx) > 13;
    case 'ponytail':
    case 'bun':
      return y < 19 + Math.abs(dx) * 0.2 || Math.abs(dx) > 14.5;
    case 'spiky':
      return y < 21 + ((x >> 2) % 2 ? 2 : -1) || (Math.abs(dx) > 14 && y < 30);
    case 'curly':
      return y < 22 + Math.sin(x * 0.9) * 1.5 || (Math.abs(dx) > 14 && y < 32);
    default:
      // Corto con flequillo en mechones
      return y < 21 + ((x + 1) % 5 < 2 ? 2 : 0) + (dx > 4 ? 1 : 0) || (Math.abs(dx) > 14.5 && y < 30);
  }
}

function drawClef(g, cx, cy, col) {
  // Pequeña clave de sol pixelada
  const rows = [
    '..X..',
    '.X.X.',
    '.X.X.',
    '..XX.',
    '..X..',
    '.XX..',
    'X.X..',
    'X.XXX',
    'X.X.X',
    '.XXX.',
    '..X..',
    'X.X..',
    '.X...',
  ];
  g.pattern(cx - 2, cy - 6, rows, { X: col });
}

export function drawPortrait(id, expr = 'normal', variant = null) {
  const p = CHARS[id];
  const g = new Grid(64, 64);
  const skin = p.skin || PAL.skin;
  const skinSh = shade(skin, -0.14);
  const skinHi = shade(skin, 0.14);
  const H = p.hair;
  const Hs = shade(H, -0.28);
  const Hh = shade(H, 0.25);
  const top = p.top;
  const topSh = shade(top, -0.22);
  const topHi = shade(top, 0.15);
  const round = p.roundFace;
  const rx = round ? 17.5 : 16;
  const ry = round ? 17 : 18;
  const cx = 32;
  const cy = 29;
  const style = p.style;
  const isMask = p.mask && variant !== 'unmasked';
  const older = id === 'papa' || id === 'mama';

  // --- Capas traseras -----------------------------------------------------
  if (style === 'hood') {
    g.ellipse(32, 31, 24, 27, H, Hs, Hh);
  }
  if (style === 'long') {
    g.rrect(12, 24, 40, 40, 10, Hs);
    g.ellipse(32, 30, 21, 22, H, Hs);
  }
  if (style === 'bob') {
    g.ellipse(32, 30, 21, 19, H, Hs);
    g.rect(12, 30, 40, 16, H);
    g.rect(12, 42, 8, 4, Hs);
    g.rect(44, 42, 8, 4, Hs);
  }
  if (style === 'pigtails') {
    g.ellipse(9, 40, 6, 12, H, Hs);
    g.ellipse(55, 40, 6, 12, H, Hs);
    g.ellipse(32, 29, 20, 19, H, Hs);
  }
  if (style === 'ponytail') {
    g.ellipse(52, 38, 5, 12, H, Hs);
  }
  if (style === 'bun') {
    g.ellipse(32, 8, 8, 6.5, H, Hs, Hh);
  }
  if (p.cape) {
    g.rrect(2, 46, 60, 18, 8, p.cape);
  }

  // --- Cuerpo -------------------------------------------------------------
  const bodyTop = 49;
  g.rrect(8, bodyTop, 48, 20, 9, top);
  for (let y = bodyTop; y < 64; y++) {
    for (let x = 8; x < 56; x++) {
      if (g.get(x, y) === top && x > 44) g.set(x, y, topSh);
      if (g.get(x, y) === top && x < 16 && y < bodyTop + 6) g.set(x, y, topHi);
    }
  }
  if (p.belly) g.ellipse(32, 64, 20, 8, top, topSh);
  // Cuello
  g.rect(26, 42, 12, 10, skinSh);
  // Cuello de ropa
  if (p.dress || p.sleeves === 'none') {
    g.ellipse(32, 50, 9, 4, skin, skinSh);
    g.hline(22, 53, 20, p.collar);
    if (p.sparkle) {
      g.px([[14, 58], [20, 55], [40, 60], [48, 56], [30, 61]], p.sparkle);
      g.px([[15, 57], [15, 59], [14, 58], [16, 58]], shade(p.sparkle, 0.5));
    }
  } else if (id === 'ray') {
    // Chompa arena con polo marrón debajo
    g.line(26, 49, 32, 57, p.collar);
    g.line(38, 49, 32, 57, p.collar);
    g.line(27, 49, 32, 56, p.collar);
    g.line(37, 49, 32, 56, p.collar);
    g.rect(30, 49, 4, 5, p.collar);
    g.line(25, 49, 32, 58, shade(top, -0.3));
    g.line(39, 49, 32, 58, shade(top, -0.3));
    // Textura de tejido
    for (let x = 12; x < 54; x += 3) g.vline(x, 58, 4, shade(top, -0.1));
  } else if (p.robe) {
    g.ellipse(32, 51, 12, 4, p.collar, shade(p.collar, -0.1));
    g.rect(27, 49, 10, 2, skinSh);
  } else if (p.cape) {
    g.rect(24, 48, 16, 6, top);
    // Notas tachadas en la capa
    const note = (x, y) => {
      g.rect(x, y, 3, 2, '#b9a8d6');
      g.vline(x + 2, y - 5, 5, '#b9a8d6');
      g.line(x - 2, y + 2, x + 5, y - 5, PAL.red);
    };
    note(8, 60);
    note(50, 59);
  } else {
    // Polo con cuello
    g.line(26, 49, 31, 53, p.collar);
    g.line(38, 49, 33, 53, p.collar);
    g.line(26, 50, 31, 54, p.collar);
    g.line(38, 50, 33, 54, p.collar);
    g.rect(31, 52, 2, 3, skinSh);
    if (id === 'bismark' || id === 'dev1' || id === 'ricardo' || id === 'dev2') {
      // Capucha de hoodie
      g.ellipse(16, 51, 6, 3, topHi);
      g.ellipse(48, 51, 6, 3, topSh);
      g.vline(29, 55, 6, '#f2f2f2');
      g.vline(35, 55, 6, '#f2f2f2');
    }
  }
  if (id === 'tato' || variant === 'unmasked') {
    // Logo simple en el polo negro
    g.px([[38, 58], [39, 57], [40, 58], [39, 59]], '#6b6a78');
  }

  // --- Cabeza -------------------------------------------------------------
  // Orejas
  g.ellipse(cx - rx + 0.5, 31, 3.2, 4.5, skin, skinSh);
  g.ellipse(cx + rx - 0.5, 31, 3.2, 4.5, skinSh);
  g.ellipse(cx, cy, rx, ry, skin, skinSh, skinHi, 0.78);

  // --- Pelo (capa frontal) -------------------------------------------------
  if (style === 'hood') {
    // El borde de la capucha rodea la cara
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const dx = (x + 0.5 - 32) / 24;
        const dy = (y + 0.5 - 31) / 27;
        const inHood = dx * dx + dy * dy <= 1;
        const fx = (x + 0.5 - 32) / 15.5;
        const fy = (y + 0.5 - 31) / 18;
        const inFace = fx * fx + fy * fy <= 1;
        if (inHood && !inFace && y < 50) g.set(x, y, dx * 0.5 + dy * 0.8 > 0.4 ? Hs : H);
      }
    }
  } else if (style === 'cap') {
    const hat = p.hat;
    g.ellipse(32, 18, 18.5, 11, hat, shade(hat, -0.2), shade(hat, 0.25));
    g.rect(13, 21, 38, 4, hat);
    g.rrect(12, 22, 40, 4, 2, shade(hat, -0.3));
    g.rect(13, 26, 4, 8, H);
    g.rect(47, 26, 4, 8, H);
    g.ellipse(32, 12, 3, 2, shade(hat, 0.35));
  } else {
    const capRx = rx + 2.5;
    const capRy = 16;
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const dx = (x + 0.5 - 32) / capRx;
        const dy = (y + 0.5 - 23) / capRy;
        if (dx * dx + dy * dy <= 1 && hairInCap(style, x, y)) {
          let c = H;
          if (dx * 0.5 + dy * 0.85 > 0.5) c = Hs;
          // Brillo de anime en el pelo
          const rr = Math.sqrt(dx * dx + dy * dy);
          if (rr > 0.7 && rr < 0.8 && dy < -0.35 && dx < 0.25) c = Hh;
          g.set(x, y, c);
        }
      }
    }
    if (style === 'curly') {
      for (let a = 0; a < Math.PI; a += 0.35) {
        g.ellipse(32 - Math.cos(a) * 19, 22 - Math.sin(a) * 14, 3.2, 3.2, H, Hs);
      }
    }
    if (style === 'spiky') {
      for (let i = 0; i < 6; i++) {
        const x = 16 + i * 6;
        g.line(x, 11, x + 2, 3 + (i % 2) * 2, H);
        g.line(x + 1, 11, x + 3, 4 + (i % 2) * 2, H);
        g.line(x + 2, 11, x + 3, 6, H);
      }
    }
    if (style === 'headphones') {
      const hp = p.hat;
      for (let a = 0.05; a < Math.PI; a += 0.02) {
        g.set(32 - Math.cos(a) * 20, 24 - Math.sin(a) * 18, hp);
        g.set(32 - Math.cos(a) * 20, 25 - Math.sin(a) * 18, hp);
      }
      g.rrect(9, 25, 7, 12, 2, hp);
      g.rrect(48, 25, 7, 12, 2, shade(hp, -0.2));
    }
    if (style === 'ponytail' || style === 'pigtails') {
      g.rect(47, 16, 4, 3, '#ff6f91');
      if (style === 'pigtails') g.rect(13, 16, 4, 3, '#ff6f91');
    }
    if (style === 'bun') g.rect(29, 13, 6, 2, shade(H, 0.4));
  }

  // --- Rasgos -------------------------------------------------------------
  const eyeY = 31;
  const lx = 25;
  const rxE = 39;
  if (isMask) {
    const m = p.maskColor || '#f2efe6';
    g.ellipse(32, 31, 15, 17.5, m, shade(m, -0.12), shade(m, 0.4));
    // Ojos rasgados
    g.line(20, 27, 27, 29, EYE);
    g.line(20, 28, 27, 30, EYE);
    g.line(44, 27, 37, 29, EYE);
    g.line(44, 28, 37, 30, EYE);
    g.set(25, 29, '#b9a8ff');
    g.set(39, 29, '#b9a8ff');
    drawClef(g, 32, 38, H === '#2b2142' ? '#3d2e63' : shade(H, -0.2));
    if (variant === 'crack') {
      const crack = PAL.ink;
      g.line(30, 14, 34, 22, crack);
      g.line(34, 22, 29, 30, crack);
      g.line(29, 30, 35, 38, crack);
      g.line(35, 38, 31, 47, crack);
      g.line(34, 22, 42, 24, crack);
      g.line(29, 30, 21, 33, crack);
      g.line(35, 38, 43, 40, crack);
      // Se asoma un ojo de Tato
      g.ellipse(40, 33, 2.5, 3, EYE);
      g.set(39, 32, '#ffffff');
    }
  } else {
    // Cejas
    const browY = expr === 'surprised' ? 23 : expr === 'happy' ? 24 : 25;
    const browC = style === 'gray' ? shade(H, -0.35) : shade(H, -0.1);
    if (expr === 'sad') {
      g.line(20, 26, 27, 24, browC);
      g.line(44, 26, 37, 24, browC);
    } else if (id === 'tato' && expr === 'normal') {
      g.hline(20, 25, 8, browC);
      g.hline(36, 25, 8, browC);
    } else {
      g.hline(21, browY, 6, browC);
      g.hline(37, browY, 6, browC);
      g.set(20, browY + 1, browC);
      g.set(43, browY + 1, browC);
    }
    // Ojos
    const eye = (x) => {
      if (expr === 'happy') {
        g.px([[x - 3, eyeY + 1], [x - 2, eyeY], [x - 1, eyeY - 1], [x, eyeY - 1], [x + 1, eyeY], [x + 2, eyeY + 1]], EYE);
        g.px([[x - 2, eyeY + 1], [x + 1, eyeY + 1]], EYE2);
      } else if (expr === 'surprised') {
        g.ellipse(x, eyeY, 3.5, 4.2, '#ffffff');
        g.ellipse(x, eyeY + 0.5, 1.6, 2, EYE);
        g.set(x - 1, eyeY - 1, '#ffffff');
      } else if (id === 'tato' && expr === 'normal') {
        g.rect(x - 2, eyeY - 1, 4, 3, EYE);
        g.set(x - 1, eyeY - 1, '#ffffff');
      } else {
        g.rect(x - 2, eyeY - 2, 4, 5, EYE);
        g.rect(x - 1, eyeY + 1, 2, 2, EYE2);
        g.set(x - 1, eyeY - 1, '#ffffff');
        g.set(x - 2, eyeY - 1, '#ffffff');
        if (p.blush) {
          g.set(x - 3, eyeY - 2, EYE);
          g.set(x + 2, eyeY - 2, EYE);
        }
      }
    };
    eye(lx);
    eye(rxE);
    if (older && expr !== 'surprised') {
      g.px([[lx - 5, eyeY + 1], [lx - 5, eyeY + 2], [rxE + 5, eyeY + 1], [rxE + 5, eyeY + 2]], skinSh);
    }
    // Lentes
    if (p.glasses) {
      const gc = p.glasses;
      const lens = mix(skin, '#ffffff', 0.18);
      for (const x0 of [18, 34]) {
        g.frame(x0, 27, 13, 9, gc);
        g.hline(x0, 26, 13, gc);
        for (let yy = 28; yy < 35; yy++) {
          for (let xx = x0 + 1; xx < x0 + 12; xx++) {
            if (g.get(xx, yy) === skin || g.get(xx, yy) === skinHi || g.get(xx, yy) === skinSh) g.set(xx, yy, lens);
          }
        }
        g.line(x0 + 8, 28, x0 + 10, 30, '#ffffff');
      }
      g.hline(31, 29, 3, gc);
      g.hline(14, 29, 4, gc);
      g.hline(47, 29, 4, gc);
    }
    // Nariz
    g.set(32, 36, skinSh);
    g.set(33, 37, skinSh);
    g.set(31, 37, skinSh);
    // Rubor
    if (p.blush || expr === 'happy') {
      g.ellipse(21, 38.5, 3, 1.4, PAL.blush);
      g.ellipse(43, 38.5, 3, 1.4, PAL.blush);
    }
    // Boca
    const my = 42;
    if (expr === 'happy') {
      g.ellipse(32, my, 4.5, 2.8, '#7a2d38');
      g.hline(28, my - 2, 9, '#7a2d38');
      g.hline(29, my - 2, 7, '#ffffff');
      g.ellipse(32, my + 1.5, 2.2, 1, '#f07a8a');
    } else if (expr === 'surprised') {
      g.ellipse(32, my + 0.5, 2.2, 2.8, '#7a2d38');
    } else if (expr === 'sad') {
      g.hline(29, my, 7, PAL.mouth);
      g.set(28, my + 1, PAL.mouth);
      g.set(36, my + 1, PAL.mouth);
    } else if (id === 'tato') {
      g.hline(29, my, 6, PAL.mouth);
    } else {
      g.hline(29, my, 7, PAL.mouth);
      g.set(28, my - 1, PAL.mouth);
      g.set(36, my - 1, PAL.mouth);
    }
    if (older) {
      g.set(25, my - 1, skinSh);
      g.set(39, my - 1, skinSh);
    }
  }

  g.outline(PAL.ink);
  return g;
}

export function buildPortraits(scene) {
  for (const id of Object.keys(CHARS)) {
    for (const e of EXPRESSIONS) addTexture(scene, `pt_${id}_${e}`, drawPortrait(id, e));
  }
  addTexture(scene, 'pt_maestro_crack', drawPortrait('maestro', 'normal', 'crack'));
  // Animalitos
  addTexture(scene, 'pt_hachi_normal', drawAnimalPortrait('hachi'));
  addTexture(scene, 'pt_hachi_happy', drawAnimalPortrait('hachi', true));
  addTexture(scene, 'pt_micha_normal', drawAnimalPortrait('micha'));
  addTexture(scene, 'pt_shiro_normal', drawAnimalPortrait('shiro'));
}

function drawAnimalPortrait(kind, happy = false) {
  const g = new Grid(64, 64);
  if (kind === 'hachi') {
    const W = '#fbf6ee';
    const C = '#f1dcc0';
    const S = '#dcc3a0';
    g.ellipse(32, 56, 20, 12, W, S);
    // Pelaje esponjoso alrededor
    for (let a = 0; a < Math.PI * 2; a += 0.4) g.ellipse(32 + Math.cos(a) * 17, 30 + Math.sin(a) * 15, 6, 6, W, C);
    g.ellipse(32, 30, 18, 16, W, C, '#ffffff');
    g.ellipse(12, 34, 7, 12, C, S);
    g.ellipse(52, 34, 7, 12, C, S);
    g.ellipse(32, 38, 8, 6, '#ffffff', C);
    g.ellipse(32, 34, 3, 2.2, PAL.ink);
    g.set(31, 33, '#6a6a7a');
    if (happy) {
      g.px([[22, 28], [23, 27], [24, 26], [25, 26], [26, 27], [27, 28]], PAL.ink);
      g.px([[37, 28], [38, 27], [39, 26], [40, 26], [41, 27], [42, 28]], PAL.ink);
    } else {
      g.ellipse(24, 27, 2.6, 3, PAL.ink);
      g.ellipse(40, 27, 2.6, 3, PAL.ink);
      g.set(23, 26, '#ffffff');
      g.set(39, 26, '#ffffff');
    }
    g.ellipse(32, 43, 3, 4, '#ff7f9a', '#e0607c');
    g.ellipse(20, 36, 3, 1.5, '#ffc2c2');
    g.ellipse(44, 36, 3, 1.5, '#ffc2c2');
  } else {
    const B = kind === 'micha' ? '#26222e' : '#f7f7fb';
    const S = kind === 'micha' ? '#3a3548' : '#d9d9e6';
    const eye = kind === 'micha' ? '#ffd166' : '#6cc6ff';
    g.ellipse(32, 58, 18, 10, B, S);
    g.line(14, 26, 18, 8, B);
    g.ellipse(32, 32, 18, 15, B, S);
    for (let i = 0; i < 8; i++) {
      g.line(14 + i, 24, 17 + i * 0.4, 9 + i, B);
      g.line(50 - i, 24, 47 - i * 0.4, 9 + i, B);
    }
    g.line(17, 12, 20, 20, '#ff9fb8');
    g.line(47, 12, 44, 20, '#ff9fb8');
    if (kind === 'micha') {
      // Dormida
      g.px([[22, 32], [23, 33], [24, 33], [25, 33], [26, 32]], '#8a86a0');
      g.px([[38, 32], [39, 33], [40, 33], [41, 33], [42, 32]], '#8a86a0');
    } else {
      g.ellipse(24, 30, 3, 4, eye);
      g.ellipse(40, 30, 3, 4, eye);
      g.rect(24, 28, 1, 5, PAL.ink);
      g.rect(40, 28, 1, 5, PAL.ink);
    }
    g.ellipse(32, 37, 2, 1.4, '#ff8fb1');
    g.line(8, 36, 20, 37, S);
    g.line(8, 40, 20, 39, S);
    g.line(56, 36, 44, 37, S);
    g.line(56, 40, 44, 39, S);
  }
  return g.outline(PAL.ink);
}
