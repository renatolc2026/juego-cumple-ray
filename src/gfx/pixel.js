// Utilidades de pixel art: una grilla de colores que se dibuja píxel por píxel
// y luego se convierte en textura de Phaser. Todo el arte del juego sale de aquí,
// así que después se puede reemplazar por imágenes sin tocar la lógica.

const colorCache = new Map();

export function parseColor(c) {
  if (c == null) return null;
  let v = colorCache.get(c);
  if (v) return v;
  if (c.startsWith('rgba')) {
    const m = c.match(/[\d.]+/g).map(Number);
    v = [m[0], m[1], m[2], Math.round(m[3] * 255)];
    colorCache.set(c, v);
    return v;
  }
  let s = c.replace('#', '');
  if (s.length === 3) s = s.split('').map((ch) => ch + ch).join('');
  const r = parseInt(s.slice(0, 2), 16);
  const g = parseInt(s.slice(2, 4), 16);
  const b = parseInt(s.slice(4, 6), 16);
  const a = s.length >= 8 ? parseInt(s.slice(6, 8), 16) : 255;
  v = [r, g, b, a];
  colorCache.set(c, v);
  return v;
}

export function toHex(r, g, b) {
  const h = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function shade(c, amt) {
  const [r, g, b] = parseColor(c);
  if (amt < 0) return toHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
  return toHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
}

export function mix(c1, c2, t) {
  const a = parseColor(c1);
  const b = parseColor(c2);
  return toHex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
}

// Generador pseudoaleatorio con semilla (para que los tiles sean siempre iguales)
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

export class Grid {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.d = new Array(w * h).fill(null);
  }

  set(x, y, c) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this;
    this.d[y * this.w + x] = c;
    return this;
  }

  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.d[y * this.w + x];
  }

  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
    return this;
  }

  // Rectángulo solo con borde
  frame(x, y, w, h, c) {
    for (let i = 0; i < w; i++) {
      this.set(x + i, y, c);
      this.set(x + i, y + h - 1, c);
    }
    for (let j = 0; j < h; j++) {
      this.set(x, y + j, c);
      this.set(x + w - 1, y + j, c);
    }
    return this;
  }

  hline(x, y, w, c) {
    return this.rect(x, y, w, 1, c);
  }

  vline(x, y, h, c) {
    return this.rect(x, y, 1, h, c);
  }

  px(list, c) {
    for (const [x, y] of list) this.set(x, y, c);
    return this;
  }

  // Elipse rellena. Si se pasa `sh` (sombra) y `hi` (luz), se sombrea con luz arriba-izquierda.
  ellipse(cx, cy, rx, ry, c, sh = null, hi = null, shT = 0.55) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) {
          let col = c;
          if (sh && dx * 0.55 + dy * 0.85 > shT) col = sh;
          else if (hi && dx * 0.6 + dy * 0.8 < -0.62) col = hi;
          this.set(x, y, col);
        }
      }
    }
    return this;
  }

  // Rectángulo con esquinas redondeadas (radio pequeño, estilo pixel)
  rrect(x, y, w, h, r, c) {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        let inside = true;
        const cx = i < r ? r - i - 0.5 : i >= w - r ? i - (w - r) + 0.5 : 0;
        const cy = j < r ? r - j - 0.5 : j >= h - r ? j - (h - r) + 0.5 : 0;
        if (cx > 0 && cy > 0 && cx * cx + cy * cy > r * r) inside = false;
        if (inside) this.set(x + i, y + j, c);
      }
    }
    return this;
  }

  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
    return this;
  }

  // Dibuja un sprite a partir de filas de texto y una paleta { char: color }
  pattern(x, y, rows, pal) {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '.' || ch === ' ') continue;
        const c = pal[ch];
        if (c) this.set(x + i, y + j, c);
      }
    });
    return this;
  }

  // Reemplaza un color por otro
  replace(from, to) {
    for (let i = 0; i < this.d.length; i++) if (this.d[i] === from) this.d[i] = to;
    return this;
  }

  // Contorno de 1 px alrededor de todo lo pintado
  outline(c = '#1b1226', diagonal = false) {
    const add = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y)) continue;
        const n =
          this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1) ||
          (diagonal && (this.get(x - 1, y - 1) || this.get(x + 1, y - 1) || this.get(x - 1, y + 1) || this.get(x + 1, y + 1)));
        if (n) add.push([x, y]);
      }
    }
    for (const [x, y] of add) this.set(x, y, c);
    return this;
  }

  blit(src, dx, dy, flip = false) {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const c = src.get(flip ? src.w - 1 - x : x, y);
        if (c) this.set(dx + x, dy + y, c);
      }
    }
    return this;
  }

  flipped() {
    const g = new Grid(this.w, this.h);
    g.blit(this, 0, 0, true);
    return g;
  }

  clone() {
    const g = new Grid(this.w, this.h);
    g.d = this.d.slice();
    return g;
  }

  // Desplaza todo el contenido
  shifted(dx, dy) {
    const g = new Grid(this.w, this.h);
    g.blit(this, dx, dy);
    return g;
  }

  mapColors(fn) {
    for (let i = 0; i < this.d.length; i++) if (this.d[i]) this.d[i] = fn(this.d[i]);
    return this;
  }

  toCanvas(scale = 1) {
    const cv = document.createElement('canvas');
    cv.width = this.w * scale;
    cv.height = this.h * scale;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(this.w, this.h);
    for (let i = 0; i < this.d.length; i++) {
      const c = this.d[i];
      if (!c) continue;
      const [r, g, b, a] = parseColor(c);
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = a;
    }
    if (scale === 1) {
      ctx.putImageData(img, 0, 0);
    } else {
      const tmp = document.createElement('canvas');
      tmp.width = this.w;
      tmp.height = this.h;
      tmp.getContext('2d').putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, cv.width, cv.height);
    }
    return cv;
  }
}

// Registra una textura simple
export function addTexture(scene, key, grid) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, grid.toCanvas());
}

// Registra una hoja de sprites a partir de una lista de grillas del mismo tamaño.
// Los cuadros quedan numerados 0..n-1.
export function addSheet(scene, key, frames) {
  const fw = frames[0].w;
  const fh = frames[0].h;
  const sheet = new Grid(fw * frames.length, fh);
  frames.forEach((f, i) => sheet.blit(f, i * fw, 0));
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.addCanvas(key, sheet.toCanvas());
  frames.forEach((_, i) => tex.add(i, 0, i * fw, 0, fw, fh));
  return tex;
}
