import { Grid, addTexture, addSheet, shade, rng } from './pixel.js';
import { PAL } from './palette.js';

// Objetos del mundo (muebles, árboles, decoración) e íconos.
// fw/fh = huella en tiles (lo que bloquea el paso). El sprite se apoya en la base de la huella.
// flat = se dibuja debajo de los personajes (alfombras, cuadros en la pared).
export const OBJECTS = {};

function def(key, w, h, opts, draw) {
  OBJECTS[key] = { key, w, h, fw: opts.fw ?? Math.ceil(w / 16), fh: opts.fh ?? 1, flat: !!opts.flat, solid: opts.solid !== false, frames: opts.frames || 1, draw };
}

const O = PAL.ink;

// ---------------------------------------------------------------- Casa
def('bed', 16, 30, { fw: 1, fh: 2 }, (g) => {
  g.rrect(0, 0, 16, 12, 3, '#8a5a3b');
  g.rect(1, 1, 14, 3, '#a86e3c');
  g.rect(1, 8, 14, 21, '#fff8ec');
  g.rrect(2, 9, 12, 6, 2, '#ffffff');
  g.hline(3, 14, 10, '#e3dcd0');
  g.rect(1, 15, 14, 14, '#4a8fd8');
  g.hline(1, 15, 14, '#7ab4ee');
  for (let y = 18; y < 28; y += 4) g.hline(2, y, 12, '#3a74b8');
  g.px([[4, 20], [10, 24], [7, 26]], '#ffd166');
  g.rect(0, 28, 16, 2, '#6b4430');
  g.outline(O);
});
def('bedRay', 16, 30, { fw: 1, fh: 2 }, (g) => {
  // Ray dormido en su cama
  g.rrect(0, 0, 16, 12, 3, '#8a5a3b');
  g.rect(1, 1, 14, 3, '#a86e3c');
  g.rect(1, 8, 14, 21, '#fff8ec');
  g.rrect(2, 9, 12, 6, 2, '#ffffff');
  g.ellipse(8, 13, 4.5, 4, '#e7b38b', '#c78c67');
  g.rect(4, 9, 8, 3, '#1f1b29');
  g.px([[5, 12], [3, 12]], '#1f1b29');
  g.hline(6, 14, 2, '#3a2f4a');
  g.hline(9, 14, 2, '#3a2f4a');
  g.rect(1, 15, 14, 14, '#4a8fd8');
  g.hline(1, 15, 14, '#7ab4ee');
  for (let y = 18; y < 28; y += 4) g.hline(2, y, 12, '#3a74b8');
  g.px([[4, 20], [10, 24], [7, 26]], '#ffd166');
  g.rect(0, 28, 16, 2, '#6b4430');
  g.outline(O);
});
def('letter', 12, 8, { flat: true, solid: false }, (g) => {
  g.rect(0, 0, 12, 8, '#fff8ec');
  g.line(0, 0, 6, 4, '#c8c0b4');
  g.line(11, 0, 6, 4, '#c8c0b4');
  g.set(6, 5, '#7b4fa8');
  g.outline(O);
});
def('nightstand', 14, 16, { fw: 1 }, (g) => {
  g.rect(1, 4, 12, 11, '#a86e3c');
  g.hline(1, 4, 12, '#c88a52');
  g.hline(2, 9, 10, '#8a5a3b');
  g.set(7, 7, '#ffd166');
  g.set(7, 12, '#ffd166');
  // Reloj despertador
  g.rrect(4, 0, 7, 5, 2, '#e8505b');
  g.rect(5, 1, 5, 3, '#fff8ec');
  g.set(7, 2, O);
  g.outline(O);
});
def('desk', 32, 24, { fw: 2 }, (g) => {
  g.rect(0, 10, 32, 4, '#a86e3c');
  g.hline(0, 10, 32, '#c88a52');
  g.rect(1, 14, 3, 9, '#8a5a3b');
  g.rect(28, 14, 3, 9, '#8a5a3b');
  g.rect(20, 14, 10, 7, '#8a5a3b');
  // Laptop
  g.rect(5, 1, 14, 9, '#3a3a48');
  g.rect(6, 2, 12, 7, '#5fb2ea');
  g.hline(7, 4, 6, '#ffffff');
  g.hline(7, 6, 8, '#bfe4fa');
  g.rect(3, 9, 18, 2, '#9aa0b4');
  // Taza
  g.rect(24, 6, 4, 4, '#fff8ec');
  g.set(28, 7, '#fff8ec');
  g.outline(O);
});
def('chair', 12, 18, { fw: 1 }, (g) => {
  g.rect(1, 0, 10, 9, '#8a5a3b');
  g.rect(2, 1, 8, 7, '#a86e3c');
  g.rect(0, 9, 12, 3, '#a86e3c');
  g.rect(1, 12, 2, 6, '#6b4430');
  g.rect(9, 12, 2, 6, '#6b4430');
  g.outline(O);
});
def('piano', 32, 30, { fw: 2 }, (g) => {
  g.rect(0, 0, 32, 20, '#2a1e2e');
  g.rect(1, 1, 30, 3, '#4a3a50');
  g.rect(3, 5, 26, 8, '#3a2c40');
  g.frame(3, 5, 26, 8, '#5a4a62');
  // Partitura
  g.rect(12, 6, 8, 6, '#fff8ec');
  g.hline(13, 8, 6, '#9aa0b4');
  g.hline(13, 10, 6, '#9aa0b4');
  // Teclado
  g.rect(0, 16, 32, 6, '#fff8ec');
  for (let x = 1; x < 32; x += 4) g.vline(x, 16, 6, '#c8c0b4');
  for (let x = 3; x < 30; x += 4) if (x % 16 !== 15) g.rect(x, 16, 2, 3, O);
  g.rect(0, 22, 32, 6, '#2a1e2e');
  g.rect(2, 28, 3, 2, '#1a1220');
  g.rect(27, 28, 3, 2, '#1a1220');
  g.px([[24, 2], [25, 2]], '#ffd166');
  g.outline(O);
});
def('pianoBench', 20, 10, { fw: 1 }, (g) => {
  g.rect(0, 0, 20, 5, '#2a1e2e');
  g.hline(0, 0, 20, '#4a3a50');
  g.rect(1, 5, 2, 5, '#1a1220');
  g.rect(17, 5, 2, 5, '#1a1220');
  g.outline(O);
});
def('sofa', 40, 22, { fw: 3 }, (g) => {
  g.rrect(0, 0, 40, 12, 3, '#3fa08a');
  g.rect(0, 8, 40, 10, '#3fa08a');
  g.rect(4, 10, 32, 6, '#58b8a0');
  g.vline(20, 10, 6, '#2f8070');
  g.rect(0, 6, 5, 12, '#2f8070');
  g.rect(35, 6, 5, 12, '#2f8070');
  g.rect(2, 18, 3, 4, '#6b4430');
  g.rect(35, 18, 3, 4, '#6b4430');
  // Cojín del Barça
  g.rect(7, 4, 7, 6, '#a50044');
  g.vline(9, 4, 6, '#004d98');
  g.vline(11, 4, 6, '#004d98');
  g.set(10, 6, '#ffd166');
  g.outline(O);
});
def('tv', 30, 28, { fw: 2 }, (g) => {
  g.rect(0, 16, 30, 10, '#8a5a3b');
  g.hline(0, 16, 30, '#a86e3c');
  g.rect(2, 26, 3, 2, '#6b4430');
  g.rect(25, 26, 3, 2, '#6b4430');
  g.rect(3, 0, 24, 15, '#1a1a22');
  g.rect(4, 1, 22, 12, '#2f7f33');
  // Partido del Barça en la tele
  g.hline(4, 7, 22, '#ffffff');
  g.ellipse(15, 7, 3, 3, '#3f9a3e');
  g.px([[9, 4], [20, 9], [12, 10]], '#a50044');
  g.px([[18, 4], [8, 9]], '#ffd166');
  g.rect(13, 15, 4, 1, '#1a1a22');
  g.outline(O);
});
def('table', 32, 22, { fw: 2 }, (g) => {
  g.rrect(0, 0, 32, 14, 2, '#c88a52');
  g.rect(1, 2, 30, 10, '#fff1d0');
  g.hline(1, 7, 30, '#f2d49b');
  g.rect(0, 12, 32, 3, '#a86e3c');
  g.rect(2, 15, 3, 7, '#8a5a3b');
  g.rect(27, 15, 3, 7, '#8a5a3b');
  // Frutero
  g.ellipse(16, 5, 5, 3, '#a86e3c');
  g.ellipse(14, 3, 2, 2, '#e8505b');
  g.ellipse(18, 3, 2, 2, '#ffd166');
  g.outline(O);
});
def('counter', 16, 22, { fw: 1 }, (g) => {
  g.rect(0, 4, 16, 18, '#f4ecdc');
  g.rect(0, 2, 16, 4, '#9aa0b4');
  g.hline(0, 2, 16, '#c8ccd6');
  g.rect(2, 9, 12, 11, '#e3d6bd');
  g.frame(2, 9, 12, 11, '#cbbd9f');
  g.set(12, 14, '#8a5a3b');
  g.outline(O);
});
def('stove', 16, 22, { fw: 1 }, (g) => {
  g.rect(0, 4, 16, 18, '#fff8ec');
  g.rect(0, 2, 16, 4, '#3a3a48');
  g.ellipse(4.5, 3.5, 2.5, 1.5, '#1a1a22');
  g.ellipse(11.5, 3.5, 2.5, 1.5, '#1a1a22');
  g.rect(2, 9, 12, 9, '#3a3a48');
  g.rect(3, 10, 10, 7, '#5a5a6a');
  g.hline(3, 7, 10, '#9aa0b4');
  // Olla de tallarines humeando
  g.rect(8, 0, 7, 3, '#c8ccd6');
  g.outline(O);
});
def('fridge', 16, 32, { fw: 1 }, (g) => {
  g.rrect(0, 0, 16, 32, 2, '#f2f4f8');
  g.hline(0, 12, 16, '#c8ccd6');
  g.vline(13, 3, 7, '#9aa0b4');
  g.vline(13, 15, 10, '#9aa0b4');
  g.rect(3, 4, 3, 3, '#ffd166');
  g.rect(7, 16, 3, 4, '#ff8fb1');
  g.rect(0, 30, 16, 2, '#9aa0b4');
  g.outline(O);
});
def('plant', 14, 24, { fw: 1 }, (g) => {
  g.ellipse(7, 7, 6, 7, '#3f9a3e', '#2a6e35', '#6cc251');
  g.ellipse(4, 11, 3, 3, '#3f9a3e', '#2a6e35');
  g.ellipse(10, 11, 3, 3, '#3f9a3e', '#2a6e35');
  g.rect(3, 15, 8, 8, '#c4583c');
  g.hline(2, 15, 10, '#e07050');
  g.outline(O);
});
def('plantGray', 14, 24, { fw: 1 }, (g) => {
  OBJECTS.plant.draw(g);
  g.mapColors((c) => (c === O ? c : shade('#8a90a4', 0)));
  g.rect(3, 15, 8, 8, '#6b7089');
  g.outline(O);
});
def('bookshelf', 16, 30, { fw: 1 }, (g) => {
  g.rect(0, 0, 16, 30, '#8a5a3b');
  const books = ['#e8505b', '#3a6fd8', '#ffd166', '#6cc251', '#a77be0', '#f07b3f'];
  const r = rng(5);
  for (let s = 0; s < 3; s++) {
    const y = 2 + s * 9;
    g.rect(1, y, 14, 7, '#5a3a2a');
    let x = 2;
    while (x < 14) {
      const w = r() < 0.5 ? 2 : 1;
      g.rect(x, y + 1 + Math.floor(r() * 2), w, 6, books[Math.floor(r() * books.length)]);
      x += w + 0;
    }
  }
  g.outline(O);
});
def('rug', 48, 32, { flat: true, solid: false, fw: 3, fh: 2 }, (g) => {
  g.rrect(0, 0, 48, 32, 6, '#e8a33b');
  g.rrect(3, 3, 42, 26, 5, '#c4583c');
  g.rrect(6, 6, 36, 20, 4, '#f2d49b');
  g.ellipse(24, 16, 10, 6, '#c4583c');
  g.ellipse(24, 16, 5, 3, '#ffd166');
});
def('rugSmall', 32, 16, { flat: true, solid: false, fw: 2, fh: 1 }, (g) => {
  g.rrect(0, 0, 32, 16, 4, '#7b4fa8');
  g.rrect(2, 2, 28, 12, 3, '#a77be0');
  g.hline(6, 8, 20, '#ffd166');
});
def('window', 16, 16, { flat: true, solid: false, fh: 1 }, (g) => {
  g.rect(2, 2, 12, 10, '#8a5a3b');
  g.rect(3, 3, 10, 8, '#9fdcff');
  g.vline(8, 3, 8, '#8a5a3b');
  g.px([[4, 4], [5, 4], [4, 5]], '#ffffff');
});
def('crossWall', 10, 14, { flat: true, solid: false }, (g) => {
  g.rect(4, 0, 2, 14, '#a86e3c');
  g.rect(0, 4, 10, 2, '#a86e3c');
  g.outline(O);
});
def('barcaPoster', 14, 16, { flat: true, solid: false }, (g) => {
  g.rect(0, 0, 14, 16, '#fff8ec');
  g.rect(1, 1, 12, 14, '#004d98');
  g.vline(3, 1, 14, '#a50044');
  g.vline(6, 1, 14, '#a50044');
  g.vline(9, 1, 14, '#a50044');
  g.ellipse(7, 7, 3.5, 4, '#ffd166');
  g.ellipse(7, 7, 2, 2.5, '#a50044');
  g.outline(O);
});
def('familyPhoto', 14, 12, { flat: true, solid: false }, (g) => {
  g.rect(0, 0, 14, 12, '#c88a52');
  g.rect(1, 1, 12, 10, '#9fdcff');
  g.rect(1, 7, 12, 4, '#6cc251');
  g.px([[3, 5], [3, 6], [6, 4], [6, 5], [6, 6], [9, 5], [9, 6], [11, 6]], O);
  g.outline(O);
});
def('clock', 12, 12, { flat: true, solid: false }, (g) => {
  g.ellipse(6, 6, 6, 6, '#8a5a3b');
  g.ellipse(6, 6, 4.6, 4.6, '#fff8ec');
  g.vline(6, 3, 4, O);
  g.hline(6, 6, 3, O);
});
def('dogBed', 20, 12, { flat: true, solid: false, fw: 1 }, (g) => {
  g.ellipse(10, 6, 10, 6, '#e8505b', '#c4404a');
  g.ellipse(10, 6, 7, 3.5, '#ffb3c6');
  g.ellipse(17, 9, 2, 2, '#d9ee4b');
});
def('bowl', 10, 6, { flat: true, solid: false }, (g) => {
  g.ellipse(5, 3, 5, 3, '#3a6fd8');
  g.ellipse(5, 2.5, 3.5, 1.5, '#c89a64');
  g.outline(O);
});

// ---------------------------------------------------------------- Exteriores
def('tree', 34, 42, { fw: 2 }, (g) => {
  // Algarrobo piurano
  g.rect(14, 24, 7, 18, '#7a4a2e');
  g.vline(15, 24, 18, '#9a623c');
  g.line(17, 30, 9, 22, '#7a4a2e');
  g.line(18, 28, 26, 20, '#7a4a2e');
  const leaves = [[17, 14, 15, 10], [8, 18, 8, 6], [26, 17, 8, 7], [17, 6, 10, 6]];
  for (const [x, y, rx, ry] of leaves) g.ellipse(x, y, rx, ry, '#3f9a3e', '#2a6e35', '#6cc251');
  const r = rng(9);
  for (let i = 0; i < 26; i++) g.set(4 + Math.floor(r() * 27), 3 + Math.floor(r() * 20), '#2a6e35');
  for (let i = 0; i < 10; i++) g.set(6 + Math.floor(r() * 20), 4 + Math.floor(r() * 10), '#8fd46a');
  g.outline(O);
});
def('palm', 30, 48, { fw: 2 }, (g) => {
  for (let y = 12; y < 48; y++) {
    const x = 14 + Math.round(Math.sin(y * 0.08) * 2);
    g.rect(x, y, 4, 1, y % 4 === 0 ? '#8a5a3b' : '#a86e3c');
  }
  const leaf = (dx, dy) => {
    for (let i = 0; i < 12; i++) {
      const x = 16 + dx * i;
      const y = 12 + dy * i + (i * i) / 10;
      g.rect(x - 1, y, 3, 2, i % 3 === 0 ? '#2a6e35' : '#3f9a3e');
    }
  };
  leaf(1.1, -0.5);
  leaf(-1.1, -0.5);
  leaf(1.2, 0.2);
  leaf(-1.2, 0.2);
  leaf(0.3, -0.9);
  g.ellipse(16, 13, 3, 2, '#8a5a3b');
  g.outline(O);
});
def('bench', 32, 16, { fw: 2 }, (g) => {
  g.rect(0, 0, 32, 3, '#a86e3c');
  g.rect(0, 4, 32, 3, '#a86e3c');
  g.hline(0, 0, 32, '#c88a52');
  g.rect(0, 8, 32, 4, '#c88a52');
  g.hline(0, 11, 32, '#8a5a3b');
  g.rect(2, 12, 2, 4, '#3a3a48');
  g.rect(28, 12, 2, 4, '#3a3a48');
  g.rect(2, 0, 2, 12, '#3a3a48');
  g.rect(28, 0, 2, 12, '#3a3a48');
  g.outline(O);
});
def('benchHCJ', 32, 18, { fw: 2 }, (g) => {
  OBJECTS.bench.draw(g);
  // Placa discreta "HCJ"
  g.rect(11, 4, 11, 5, '#d8b04a');
  g.frame(11, 4, 11, 5, '#a8842a');
  g.px([[12, 5], [12, 6], [12, 7], [13, 6], [14, 5], [14, 6], [14, 7]], '#6b4a1a');
  g.px([[16, 5], [17, 5], [16, 6], [16, 7], [17, 7]], '#6b4a1a');
  g.px([[20, 5], [20, 6], [20, 7], [19, 7]], '#6b4a1a');
});
def('lamp', 10, 34, { fw: 1 }, (g) => {
  g.rect(4, 8, 2, 24, '#3a3a48');
  g.rect(2, 31, 6, 3, '#3a3a48');
  g.rrect(1, 1, 8, 8, 2, '#3a3a48');
  g.rect(2, 3, 6, 5, '#ffe9a0');
  g.outline(O);
});
def('flowers', 16, 12, { flat: false, solid: true }, (g) => {
  g.rrect(0, 4, 16, 8, 2, '#8a5a3b');
  g.rect(1, 3, 14, 3, '#3f9a3e');
  const cols = ['#ff8fb1', '#ffd166', '#ffffff', '#e8505b', '#a77be0'];
  for (let i = 0; i < 6; i++) {
    const x = 2 + i * 2.4;
    const c = cols[i % cols.length];
    g.px([[x, 1], [x - 1, 2], [x + 1, 2], [x, 3]], c);
    g.set(x, 2, '#ffe066');
  }
  g.outline(O);
});
def('fountain', 48, 36, { fw: 3, fh: 2 }, (g) => {
  g.ellipse(24, 26, 23, 9, '#c8c0b4', '#a8a094');
  g.ellipse(24, 25, 19, 6.5, '#4fb2e8', null, '#9fdcff');
  g.rect(21, 8, 6, 18, '#d8d0c2');
  g.ellipse(24, 9, 8, 3, '#c8c0b4');
  g.ellipse(24, 8.5, 6, 2, '#4fb2e8');
  // Chorro de agua
  g.vline(24, 0, 8, '#9fdcff');
  g.px([[22, 2], [26, 2], [21, 4], [27, 4], [20, 6], [28, 6]], '#9fdcff');
  g.outline(O);
});
def('cart', 32, 30, { fw: 2 }, (g) => {
  // Carrito de raspadilla
  g.rect(2, 0, 28, 3, '#e8505b');
  for (let x = 2; x < 30; x += 6) g.rect(x, 0, 3, 3, '#fff8ec');
  g.rect(4, 3, 1, 10, '#9aa0b4');
  g.rect(27, 3, 1, 10, '#9aa0b4');
  g.rect(1, 13, 30, 11, '#5fb2ea');
  g.hline(1, 13, 30, '#9fdcff');
  g.rect(4, 16, 24, 5, '#fff8ec');
  g.px([[6, 18], [8, 18], [10, 18]], '#e8505b');
  g.px([[13, 18], [15, 18]], '#ffd166');
  g.px([[18, 18], [20, 18], [22, 18], [24, 18]], '#6cc251');
  g.ellipse(7, 26, 3.5, 3.5, '#3a3a48');
  g.ellipse(25, 26, 3.5, 3.5, '#3a3a48');
  // Vasitos de colores
  g.rect(8, 10, 3, 3, '#e8505b');
  g.rect(13, 10, 3, 3, '#ffd166');
  g.rect(18, 10, 3, 3, '#6cc251');
  g.outline(O);
});
def('bin', 12, 16, { fw: 1 }, (g) => {
  g.rect(1, 3, 10, 13, '#3f9a3e');
  g.rect(0, 1, 12, 3, '#2a6e35');
  g.vline(4, 5, 9, '#2a6e35');
  g.vline(8, 5, 9, '#2a6e35');
  g.outline(O);
});
def('sign', 20, 22, { fw: 1 }, (g) => {
  g.rect(9, 10, 3, 12, '#8a5a3b');
  g.rect(0, 0, 20, 11, '#a86e3c');
  g.rect(1, 1, 18, 9, '#c88a52');
  g.hline(3, 4, 14, '#6b4430');
  g.hline(3, 7, 10, '#6b4430');
  g.outline(O);
});

// ---------------------------------------------------------------- Iglesia
def('altar', 48, 24, { fw: 3 }, (g) => {
  g.rect(0, 6, 48, 18, '#fbf7ee');
  g.rect(0, 4, 48, 4, '#d8b04a');
  g.hline(0, 4, 48, '#ffe08a');
  g.rect(18, 10, 12, 10, '#d8b04a');
  g.rect(22, 12, 4, 6, '#fbf7ee');
  g.rect(23, 11, 2, 8, '#d8b04a');
  g.rect(20, 14, 8, 2, '#d8b04a');
  g.rect(4, 0, 4, 4, '#fff8ec');
  g.rect(40, 0, 4, 4, '#fff8ec');
  g.outline(O);
});
def('pew', 48, 14, { fw: 3 }, (g) => {
  g.rect(0, 0, 48, 4, '#8a5a3b');
  g.hline(0, 0, 48, '#a86e3c');
  g.rect(0, 5, 48, 5, '#a86e3c');
  g.hline(0, 9, 48, '#6b4430');
  g.rect(1, 10, 3, 4, '#6b4430');
  g.rect(44, 10, 3, 4, '#6b4430');
  g.outline(O);
});
def('candle', 10, 26, { fw: 1, frames: 2 }, (g, f) => {
  g.rect(3, 20, 4, 6, '#d8b04a');
  g.rect(1, 24, 8, 2, '#d8b04a');
  g.rect(4, 8, 2, 12, '#d8b04a');
  g.rect(0, 8, 10, 2, '#d8b04a');
  g.rect(0, 4, 2, 4, '#fff8ec');
  g.rect(8, 4, 2, 4, '#fff8ec');
  g.rect(4, 3, 2, 5, '#fff8ec');
  const fl = f ? 1 : 0;
  g.px([[0 + fl, 2], [1, 1 + fl], [8, 2 - fl], [9 - fl, 1], [4 + fl, 1], [5, 0]], '#ffd166');
  g.px([[1, 3], [8, 3], [5, 2]], '#f07b3f');
  g.outline(O);
});
def('bigCross', 16, 26, { flat: true, solid: false }, (g) => {
  g.rect(6, 0, 4, 26, '#d8b04a');
  g.rect(0, 6, 16, 4, '#d8b04a');
  g.vline(7, 0, 26, '#ffe08a');
  g.outline(O);
});
def('organ', 40, 34, { fw: 3 }, (g) => {
  // Piano/órgano de la iglesia
  for (let i = 0; i < 7; i++) {
    const h = 12 + Math.abs(3 - i) * -2 + 6;
    g.rect(3 + i * 5, 12 - h + 6, 3, h + 2, '#d8b04a');
    g.vline(3 + i * 5, 12 - h + 6, h + 2, '#ffe08a');
  }
  g.rect(0, 14, 40, 20, '#6b4430');
  g.rect(2, 16, 36, 4, '#8a5a3b');
  g.rect(2, 21, 36, 5, '#fff8ec');
  for (let x = 3; x < 38; x += 3) g.vline(x, 21, 5, '#c8c0b4');
  for (let x = 4; x < 36; x += 6) g.rect(x, 21, 2, 3, O);
  g.outline(O);
});
def('churchFacade', 112, 96, { fw: 7, fh: 2 }, (g) => {
  // Fachada blanca con torre
  const W = '#fbf7ee';
  const Ws = '#e3dccf';
  g.rect(8, 40, 96, 56, W);
  g.rect(8, 40, 96, 3, Ws);
  // Frontón
  for (let i = 0; i < 20; i++) g.hline(20 + i * 1.2, 40 - i, 72 - i * 2.4, W);
  g.line(20, 40, 56, 20, Ws);
  g.line(92, 40, 56, 20, Ws);
  // Torre del campanario
  g.rect(44, 4, 24, 36, W);
  g.rect(44, 4, 24, 2, Ws);
  g.rect(50, 10, 12, 12, '#6b4a3a');
  g.ellipse(56, 17, 4, 4, '#d8b04a');
  g.rect(55, 21, 2, 1, '#d8b04a');
  g.rect(52, 0, 8, 5, '#d8b04a');
  g.rect(55, -2, 2, 6, '#d8b04a');
  // Cruz arriba
  g.rect(55, 0, 2, 4, '#d8b04a');
  // Puerta
  g.rect(44, 62, 24, 34, '#7a4a2e');
  g.ellipse(56, 62, 12, 8, '#7a4a2e');
  g.rect(46, 64, 20, 32, '#9a623c');
  g.vline(56, 58, 38, '#7a4a2e');
  // Ventanas / vitrales
  const win = (x) => {
    g.rect(x, 54, 12, 20, '#6b5a3a');
    g.ellipse(x + 6, 54, 6, 5, '#6b5a3a');
    g.rect(x + 2, 55, 8, 17, '#3fb5e8');
    g.rect(x + 2, 58, 4, 5, '#ffd166');
    g.rect(x + 6, 64, 4, 5, '#e8505b');
  };
  win(18);
  win(82);
  // Pilastras
  for (const x of [10, 36, 72, 98]) g.rect(x, 44, 4, 52, Ws);
  g.rect(4, 92, 104, 4, '#c9b48a');
  g.outline(O);
});
def('hedgeObj', 16, 16, { fw: 1 }, (g) => {
  g.ellipse(8, 9, 8, 7, '#3f9a3e', '#2a6e35', '#6cc251');
  g.outline(O);
});

// ---------------------------------------------------------------- Salón del Sabor
def('discoBall', 16, 28, { flat: false, solid: false, frames: 4 }, (g, f) => {
  g.vline(8, 0, 12, '#9aa0b4');
  g.ellipse(8, 19, 7.5, 7.5, '#c8ccd6');
  for (let y = 12; y < 27; y += 2) for (let x = 1; x < 16; x += 2) if (g.get(x, y)) g.set(x + ((y / 2 + f) % 2), y, '#ffffff');
  const sparkles = [[3, 16], [12, 21], [6, 24], [11, 14]];
  const [sx, sy] = sparkles[f % 4];
  g.px([[sx, sy], [sx - 1, sy], [sx + 1, sy], [sx, sy - 1], [sx, sy + 1]], '#fffbe0');
  g.outline(O);
});
def('speaker', 16, 26, { fw: 1 }, (g) => {
  g.rect(0, 0, 16, 26, '#2a2a36');
  g.ellipse(8, 8, 5, 5, '#4a4a5a');
  g.ellipse(8, 8, 2.5, 2.5, '#1a1a22');
  g.ellipse(8, 19, 6, 6, '#4a4a5a');
  g.ellipse(8, 19, 3, 3, '#1a1a22');
  g.outline(O);
});
def('stage', 64, 20, { fw: 4, fh: 1 }, (g) => {
  g.rect(0, 0, 64, 14, '#8a3a6a');
  g.hline(0, 0, 64, '#c05a94');
  g.rect(0, 14, 64, 6, '#5a2a48');
  for (let x = 4; x < 64; x += 8) g.set(x, 17, '#ffd166');
  g.outline(O);
});
def('mirror', 32, 22, { flat: true, solid: false, fw: 2 }, (g) => {
  g.rect(0, 0, 32, 22, '#d8b04a');
  g.rect(2, 2, 28, 18, '#bfe4fa');
  g.line(6, 16, 14, 4, '#ffffff');
  g.line(10, 17, 18, 5, '#ffffff');
});
def('barCounter', 48, 22, { fw: 3 }, (g) => {
  g.rect(0, 4, 48, 18, '#6b2a4a');
  g.rect(0, 2, 48, 4, '#c05a94');
  g.hline(0, 2, 48, '#ff8fc8');
  for (let x = 4; x < 44; x += 9) {
    g.rect(x, 0, 3, 3, '#6ff0ff');
  }
  g.outline(O);
});
def('neonSign', 64, 16, { flat: true, solid: false }, (g) => {
  g.rrect(0, 0, 64, 16, 3, '#2a1034');
  g.frame(1, 1, 62, 14, '#ff5fa0');
  // "SABOR" en neón (bloques)
  const L = {
    S: ['XXX', 'X..', 'XXX', '..X', 'XXX'],
    A: ['XXX', 'X.X', 'XXX', 'X.X', 'X.X'],
    B: ['XX.', 'X.X', 'XX.', 'X.X', 'XX.'],
    O: ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'],
    R: ['XX.', 'X.X', 'XX.', 'X.X', 'X.X'],
  };
  let x = 18;
  for (const ch of 'SABOR') {
    g.pattern(x, 5, L[ch], { X: '#6ff0ff' });
    x += 6;
  }
  g.px([[8, 7], [9, 6], [10, 7], [9, 8]], '#ffd166');
  g.px([[54, 7], [55, 6], [56, 7], [55, 8]], '#ffd166');
});
def('lightBeam', 24, 48, { flat: true, solid: false }, (g) => {
  for (let y = 0; y < 48; y++) {
    const w = 2 + y * 0.4;
    for (let x = 12 - w; x < 12 + w; x++) if ((x + y) % 2 === 0) g.set(x, y, 'rgba(255,255,255,0.35)');
  }
});

// ---------------------------------------------------------------- Cueva del Código
def('crystal', 16, 20, { fw: 1, frames: 2 }, (g, f) => {
  const c = f ? '#6ff0a8' : PAL.code;
  g.px([[7, 2], [8, 2]], c);
  for (let y = 3; y < 18; y++) g.hline(8 - Math.min(4, y / 2), y, Math.min(8, y), y < 10 ? c : PAL.code2);
  g.vline(8, 3, 15, '#c8ffe0');
  g.rect(2, 17, 12, 3, '#243a38');
  g.outline(O);
});
def('terminal', 24, 28, { fw: 2, frames: 2 }, (g, f) => {
  g.rect(0, 16, 24, 12, '#3a3a48');
  g.hline(0, 16, 24, '#5a5a6a');
  g.rect(2, 0, 20, 16, '#2a2a36');
  g.rect(3, 1, 18, 13, '#0a1a14');
  for (let i = 0; i < 5; i++) g.hline(4, 3 + i * 2, 4 + ((i * 7 + f * 3) % 12), i % 2 ? PAL.code2 : PAL.code);
  if (f) g.rect(16, 11, 2, 2, PAL.code);
  g.rect(4, 19, 16, 4, '#2a2a36');
  for (let x = 5; x < 19; x += 2) g.set(x, 20, '#9aa0b4');
  g.outline(O);
});
def('server', 16, 30, { fw: 1, frames: 2 }, (g, f) => {
  g.rect(0, 0, 16, 30, '#2a2a36');
  for (let y = 2; y < 28; y += 5) {
    g.rect(2, y, 12, 3, '#3a3a48');
    g.set(3, y + 1, (y + f * 5) % 10 < 5 ? PAL.code : '#1c5a3a');
    g.set(5, y + 1, (y + f * 5) % 15 < 5 ? '#ffd166' : '#5a4a1a');
  }
  g.outline(O);
});
def('bug', 16, 14, { flat: false, solid: true, frames: 2 }, (g, f) => {
  // El bug que congela el portal
  g.ellipse(8, 8, 6, 5, '#e8505b', '#a83040', '#ff8a8a');
  g.vline(8, 4, 9, '#6a1a2a');
  g.ellipse(8, 3, 3.5, 2.5, '#3a1a2a');
  g.set(6, 3, '#ffffff');
  g.set(10, 3, '#ffffff');
  const l = f ? 1 : 0;
  g.line(2, 6 + l, 0, 4 + l, '#3a1a2a');
  g.line(14, 6 + l, 16, 4 + l, '#3a1a2a');
  g.line(2, 10 - l, 0, 12 - l, '#3a1a2a');
  g.line(14, 10 - l, 16, 12 - l, '#3a1a2a');
  g.px([[5, 7], [11, 9]], '#3a1a2a');
  g.outline(O);
});
def('portal', 32, 40, { fw: 2, frames: 4, solid: false }, (g, f) => {
  const cols = ['#a77be0', '#ff8fb1', '#6ff0ff', '#ffd166'];
  for (let i = 0; i < 4; i++) {
    const c = cols[(i + f) % 4];
    g.ellipse(16, 20, 15 - i * 3.3, 19 - i * 4, c);
  }
  g.ellipse(16, 20, 3, 5, '#ffffff');
  const r = rng(f + 3);
  for (let i = 0; i < 6; i++) g.set(4 + Math.floor(r() * 24), 4 + Math.floor(r() * 32), '#ffffff');
});
def('portalFrozen', 32, 40, { fw: 2, solid: true }, (g) => {
  g.ellipse(16, 20, 15, 19, '#6b7089');
  g.ellipse(16, 20, 12, 15.5, '#9aa0b4');
  g.ellipse(16, 20, 9, 12, '#c8d2e0');
  for (let i = 0; i < 6; i++) g.line(16, 20, 16 + Math.cos(i) * 12, 20 + Math.sin(i) * 16, '#ffffff');
  g.rect(8, 16, 16, 8, '#e8505b');
  g.hline(9, 19, 14, '#ffffff');
  g.hline(9, 21, 10, '#ffffff');
  g.outline(O);
});
def('cable', 32, 8, { flat: true, solid: false, fw: 2 }, (g) => {
  for (let x = 0; x < 32; x++) g.set(x, 4 + Math.round(Math.sin(x * 0.4) * 2), '#3a3a48');
  for (let x = 0; x < 32; x++) g.set(x, 5 + Math.round(Math.sin(x * 0.3 + 1) * 2), '#1c5a3a');
});

// ---------------------------------------------------------------- Torre
def('elevator', 32, 32, { fw: 2, fh: 1, frames: 1 }, (g) => {
  g.rect(0, 0, 32, 32, '#6b7089');
  g.rect(2, 4, 28, 28, '#c8ccd6');
  g.vline(16, 4, 28, '#8a90a4');
  g.px([[6, 10], [7, 10], [24, 10], [25, 10]], '#ffffff');
  g.rect(12, 0, 8, 3, '#1a1a22');
  g.px([[14, 1], [15, 1], [16, 1], [17, 1]], '#ff6060');
  g.outline(O);
});
def('officeDesk', 32, 22, { fw: 2 }, (g) => {
  g.rect(0, 8, 32, 4, '#8a90a4');
  g.rect(1, 12, 3, 10, '#6b7089');
  g.rect(28, 12, 3, 10, '#6b7089');
  g.rect(8, 0, 14, 9, '#3a3a48');
  g.rect(9, 1, 12, 6, '#5a6078');
  g.outline(O);
});
def('pillar', 16, 32, { fw: 1 }, (g) => {
  g.rect(2, 0, 12, 32, '#aab0c2');
  g.vline(12, 0, 32, '#8a90a4');
  g.vline(3, 0, 32, '#c8ccd6');
  g.rect(0, 0, 16, 3, '#8a90a4');
  g.rect(0, 29, 16, 3, '#8a90a4');
  g.outline(O);
});
def('fogBox', 16, 16, { fw: 1 }, (g) => {
  g.rect(1, 3, 14, 12, '#8a90a4');
  g.rect(1, 3, 14, 3, '#aab0c2');
  g.vline(8, 3, 12, '#6b7089');
  g.outline(O);
});
def('silentJukebox', 20, 28, { fw: 1, frames: 1 }, (g) => {
  g.rrect(0, 0, 20, 28, 8, '#6b7089');
  g.rrect(2, 2, 16, 12, 6, '#9aa0b4');
  g.rect(4, 16, 12, 8, '#454a60');
  for (let x = 5; x < 16; x += 2) g.vline(x, 17, 6, '#5a6078');
  g.outline(O);
});

// ---------------------------------------------------------------- Fiesta
def('partyTable', 64, 30, { fw: 4, fh: 1 }, (g) => {
  g.rrect(0, 4, 64, 18, 3, '#fff8ec');
  for (let x = 0; x < 64; x += 8) g.rect(x, 18, 4, 4, '#ff8fb1');
  g.rect(0, 22, 64, 2, '#e3d6bd');
  g.rect(4, 24, 3, 6, '#8a5a3b');
  g.rect(57, 24, 3, 6, '#8a5a3b');
  // Plato gigante de tallarines
  g.ellipse(18, 10, 13, 6, '#ffffff', '#e3dcd0');
  g.ellipse(18, 9, 10, 4, '#e8505b');
  for (let i = 0; i < 12; i++) g.line(10 + i * 1.4, 7 + (i % 3), 12 + i * 1.3, 11 - (i % 2), i % 2 ? '#c4404a' : '#f07b3f');
  g.ellipse(15, 7, 2, 1.5, '#8a3a2a');
  g.ellipse(21, 8, 2, 1.5, '#8a3a2a');
  // Torta
  g.rect(38, 2, 18, 12, '#ffb3c6');
  g.rect(38, 2, 18, 3, '#fff8ec');
  g.px([[40, 5], [44, 6], [48, 5], [52, 6]], '#fff8ec');
  g.rect(36, 13, 22, 2, '#d8d0c2');
  // Velas 3 y 6
  g.pattern(41, -6 + 0, ['XXX', '..X', 'XXX', '..X', 'XXX'], { X: '#ffd166' });
  g.pattern(49, -6 + 0, ['XXX', 'X..', 'XXX', 'X.X', 'XXX'], { X: '#ffd166' });
  g.px([[42, 0], [50, 0]], '#f07b3f');
  // Celular con videollamada
  g.rect(58, 6, 6, 10, '#1a1a22');
  g.rect(59, 7, 4, 8, '#8fd3ff');
  g.outline(O);
});
def('balloons', 20, 36, { fw: 1, solid: false, flat: false }, (g) => {
  g.line(10, 36, 5, 14, '#fff8ec');
  g.line(10, 36, 15, 12, '#fff8ec');
  g.line(10, 36, 10, 16, '#fff8ec');
  g.ellipse(5, 9, 4.5, 6, '#e8505b', '#c4404a', '#ff9a9a');
  g.ellipse(15, 7, 4.5, 6, '#ffd166', '#f4a93b', '#fff0b0');
  g.ellipse(10, 12, 4.5, 6, '#5fb2ea', '#3a8ac8', '#bfe4fa');
  g.outline(O);
});
def('banner', 96, 16, { flat: true, solid: false }, (g) => {
  const cols = ['#e8505b', '#ffd166', '#6cc251', '#5fb2ea', '#a77be0', '#ff8fb1'];
  for (let i = 0; i < 12; i++) {
    const x = i * 8;
    const y = Math.round(Math.sin((i / 11) * Math.PI) * 5);
    for (let j = 0; j < 7; j++) g.hline(x + j / 2, y + j, 7 - j, cols[i % cols.length]);
  }
  for (let x = 0; x < 96; x++) g.set(x, Math.round(Math.sin((x / 95) * Math.PI) * 5), '#fff8ec');
});

// ---------------------------------------------------------------- Íconos (no son del mapa)
export function buildIcons(scene) {
  const icon = (key, w, h, fn, outline = true) => {
    const g = new Grid(w, h);
    fn(g);
    if (outline) g.outline(O);
    addTexture(scene, key, g);
  };
  icon('ball', 8, 8, (g) => {
    g.ellipse(4, 4, 3.5, 3.5, '#d9ee4b', '#a8c13a', '#f4ff9a');
    g.line(1, 3, 6, 6, '#ffffff');
  });
  icon('tallarines', 14, 12, (g) => {
    g.rect(1, 4, 12, 7, '#f4f1e8');
    g.rect(0, 2, 14, 3, '#5fb2ea');
    g.hline(1, 2, 12, '#9fdcff');
    for (let i = 0; i < 5; i++) g.line(3 + i * 2, 6, 4 + i * 2, 9, i % 2 ? '#e8505b' : '#f07b3f');
  });
  icon('bendicion', 14, 14, (g) => {
    g.ellipse(7, 7, 6, 6, '#ffe9a0', null, '#ffffff');
    g.ellipse(7, 7, 3.5, 3.5, '#ffd166');
    g.rect(6, 3, 2, 8, '#fff8ec');
    g.rect(4, 5, 6, 2, '#fff8ec');
  });
  icon('bufanda', 16, 12, (g) => {
    for (let i = 0; i < 8; i++) g.rect(i * 2, 3 + (i % 2), 2, 5, i % 2 ? '#004d98' : '#a50044');
    g.rect(12, 7, 3, 5, '#a50044');
    g.px([[12, 11], [14, 11]], '#ffd166');
  });
  icon('mapa', 14, 12, (g) => {
    g.rect(0, 1, 14, 10, '#f2d49b');
    g.vline(4, 1, 10, '#dcb676');
    g.vline(9, 1, 10, '#dcb676');
    g.line(2, 8, 11, 3, '#e8505b');
    g.px([[11, 3], [10, 3], [11, 4]], '#e8505b');
  });
  icon('carta', 14, 10, (g) => {
    g.rect(0, 0, 14, 10, '#fff8ec');
    g.line(0, 0, 7, 5, '#c8c0b4');
    g.line(13, 0, 7, 5, '#c8c0b4');
    g.ellipse(7, 6, 2, 2, '#7b4fa8');
  });
  icon('llavero', 12, 12, (g) => {
    g.ellipse(4, 4, 3, 3, '#d8b04a');
    g.ellipse(4, 4, 1.5, 1.5, null);
    g.rect(6, 6, 5, 5, '#e8505b');
    g.px([[7, 8], [8, 7], [9, 8]], '#ffffff');
  });
  icon('postit', 12, 12, (g) => {
    g.rect(0, 0, 12, 12, '#ffe066');
    g.hline(2, 3, 8, '#8a6a1a');
    g.hline(2, 6, 6, '#8a6a1a');
    g.hline(2, 9, 7, '#8a6a1a');
  });
  icon('heart', 9, 8, (g) => {
    g.pattern(0, 0, ['.XX.XX..', 'XXXXXXX.', 'XXXXXXX.', '.XXXXX..', '..XXX...', '...X....'], { X: '#ff5f8a' });
    g.set(1, 1, '#ffb3c6');
  });
  icon('noteS', 7, 9, (g) => {
    g.pattern(0, 0, ['..XXX', '..X.X', '..X.X', '..X..', '..X..', 'XXX..', 'XXX..'], { X: '#ffd166' });
  });
  icon('noteS2', 9, 9, (g) => {
    g.pattern(0, 0, ['..XXXXX', '..X...X', '..X...X', '..X...X', 'XXX.XXX', 'XXX.XXX'], { X: '#8fd3ff' });
  });
  icon('sparkle', 7, 7, (g) => {
    g.px([[3, 0], [3, 1], [3, 2], [3, 4], [3, 5], [3, 6], [0, 3], [1, 3], [2, 3], [4, 3], [5, 3], [6, 3]], '#fffbe0');
    g.set(3, 3, '#ffffff');
  }, false);
  icon('star', 5, 5, (g) => {
    g.px([[2, 0], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [2, 4], [2, 1], [2, 3]], '#fff8ec');
  }, false);
  icon('px', 2, 2, (g) => g.rect(0, 0, 2, 2, '#ffffff'), false);
  icon('confetti', 3, 2, (g) => g.rect(0, 0, 3, 2, '#ffffff'), false);
  icon('shadow', 14, 5, (g) => g.ellipse(7, 2.5, 7, 2.5, 'rgba(20,10,40,0.28)'), false);
  icon('emote_!', 10, 12, (g) => {
    g.rrect(0, 0, 10, 10, 3, '#fff8ec');
    g.px([[4, 11], [5, 10]], '#fff8ec');
    g.rect(4, 2, 2, 4, '#e8505b');
    g.rect(4, 7, 2, 2, '#e8505b');
  });
  icon('emote_?', 10, 12, (g) => {
    g.rrect(0, 0, 10, 10, 3, '#fff8ec');
    g.px([[4, 11], [5, 10]], '#fff8ec');
    g.pattern(2, 1, ['.XXX.', 'X...X', '...X.', '..X..', '.....', '..X..'], { X: '#3a6fd8' });
  });
  icon('emote_zzz', 12, 11, (g) => {
    g.pattern(0, 0, ['.......XXX', '.........X', '....XXX.X.', '......XXXX', 'XXXX..X...', '...X.XXX..', '..X.......', '.X........', 'XXXX......'], { X: '#bfe4fa' });
  });
  icon('emote_heart', 10, 12, (g) => {
    g.rrect(0, 0, 10, 10, 3, '#fff8ec');
    g.px([[4, 11], [5, 10]], '#fff8ec');
    g.pattern(1, 2, ['.XX.XX.', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'], { X: '#ff5f8a' });
  });
  icon('emote_note', 10, 12, (g) => {
    g.rrect(0, 0, 10, 10, 3, '#fff8ec');
    g.px([[4, 11], [5, 10]], '#fff8ec');
    g.pattern(2, 1, ['..XXX', '..X.X', '..X..', 'XXX..', 'XXX..'], { X: '#7b4fa8' });
  });
  icon('emote_dots', 12, 12, (g) => {
    g.rrect(0, 0, 12, 10, 3, '#fff8ec');
    g.px([[4, 11], [5, 10]], '#fff8ec');
    g.px([[3, 5], [6, 5], [9, 5]], '#454a60');
  });
  icon('emote_sweat', 6, 8, (g) => {
    g.pattern(0, 0, ['..X.', '.XX.', 'XXXX', 'XXXX', '.XX.'], { X: '#8fd3ff' });
  });
  icon('cursor', 7, 9, (g) => {
    g.pattern(0, 0, ['X....', 'XX...', 'XXX..', 'XXXX.', 'XXX..', 'XX...', 'X....'], { X: '#ffd166' });
  });
  icon('arrowIcon', 11, 11, (g) => {
    g.pattern(0, 0, ['....X......', '...XX......', '..XXX......', '.XXXXXXXXXX', 'XXXXXXXXXXX', 'XXXXXXXXXXX', '.XXXXXXXXXX', '..XXX......', '...XX......', '....X......'], { X: '#ffffff' });
  });
  icon('iconMenu', 10, 9, (g) => {
    g.rect(0, 0, 10, 2, '#fff1d0');
    g.rect(0, 3, 10, 2, '#fff1d0');
    g.rect(0, 6, 10, 2, '#fff1d0');
  }, false);
  icon('arrowDown', 7, 5, (g) => {
    g.pattern(0, 0, ['XXXXX', '.XXX.', '..X..'], { X: '#ffd166' });
  });

  // Notas Legendarias (grandes, 20x20)
  const legend = (key, col, col2) => {
    icon(key, 20, 22, (g) => {
      g.ellipse(10, 11, 9.5, 10.5, col2);
      g.ellipse(10, 11, 8, 9, col, shade(col, -0.25), shade(col, 0.4));
      g.pattern(5, 4, ['....XXX', '....XXX', '....X..', '....X..', '....X..', '.XXXX..', 'XXXXX..', 'XXXX...', '.XX....'], { X: '#fff8ec' });
      g.set(4, 6, '#ffffff');
    });
  };
  legend('nota_hogar', '#f4a93b', '#ffd166');
  legend('nota_fe', '#e8e0ff', '#ffffff');
  legend('nota_sabor', '#e8505b', '#ff8fb1');
  legend('nota_amistad', '#3fb57a', '#b6e36a');
  icon('nota_vacia', 20, 22, (g) => {
    g.ellipse(10, 11, 8, 9, '#3a2f4a', null, '#4a3e5c');
    g.pattern(5, 4, ['....XXX', '....XXX', '....X..', '....X..', '....X..', '.XXXX..', 'XXXXX..', 'XXXX...', '.XX....'], { X: '#5a4e6c' });
  });
}

// Registra texturas de todos los objetos (con cuadros si son animados)
export function buildObjects(scene) {
  for (const o of Object.values(OBJECTS)) {
    if (o.frames > 1) {
      const frames = [];
      for (let f = 0; f < o.frames; f++) {
        const g = new Grid(o.w, o.h);
        o.draw(g, f);
        frames.push(g);
      }
      addSheet(scene, `obj_${o.key}`, frames);
      const ak = `obj_${o.key}_anim`;
      if (!scene.anims.exists(ak)) {
        scene.anims.create({ key: ak, frames: frames.map((_, i) => ({ key: `obj_${o.key}`, frame: i })), frameRate: o.key === 'portal' ? 8 : 4, repeat: -1 });
      }
    } else {
      const g = new Grid(o.w, o.h);
      o.draw(g, 0);
      addTexture(scene, `obj_${o.key}`, g);
    }
  }
  buildIcons(scene);
}
