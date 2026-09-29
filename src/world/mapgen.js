import { rng } from '../gfx/pixel.js';

// Pequeño editor de mapas por código: empieza con un relleno y se "pintan" zonas.
export class MapBuilder {
  constructor(w, h, fill = 'g') {
    this.w = w;
    this.h = h;
    this.rows = Array.from({ length: h }, () => Array(w).fill(fill));
  }

  set(x, y, c) {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.rows[y][x] = c;
    return this;
  }

  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
    return this;
  }

  border(c, t = 1) {
    this.rect(0, 0, this.w, t, c);
    this.rect(0, this.h - t, this.w, t, c);
    this.rect(0, 0, t, this.h, c);
    this.rect(this.w - t, 0, t, this.h, c);
    return this;
  }

  // Salpica variantes sobre un carácter base
  sprinkle(base, variants, chance, seed = 1) {
    const r = rng(seed);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.rows[y][x] === base && r() < chance) this.rows[y][x] = variants[Math.floor(r() * variants.length)];
      }
    }
    return this;
  }

  // Patrón de ajedrez entre dos caracteres dentro de un rectángulo
  checker(x, y, w, h, a, b) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, (i + j) % 2 ? b : a);
    return this;
  }

  build() {
    return this.rows.map((r) => r.join(''));
  }
}
