'use strict';
// ANCESTRAL — Showreel de lanzamiento en Utah.
// 20 s a 60 fps, 1920x1080. Todo se dibuja con Canvas 2D y renderFrame(t) es
// determinista: el mismo t produce siempre el mismo cuadro.
// La línea de tiempo está anclada a 96 BPM (negra = 0,625 s; 8 compases = 20 s),
// el mismo tempo que usa music.py.

const W = 1920, H = 1080, FPS = 60;
const BEAT = 60 / 96;

// Paleta de marca: los únicos cinco colores permitidos.
const NIGHT = [21, 18, 43];     // Noche Andina
const COCH = [140, 29, 59];     // Cochinilla (un solo acento: el hilo teñido)
const GOLD = [200, 162, 76];    // Oro Inca (solo líneas finas y detalles)
const CRUDO = [238, 229, 214];  // Alpaca Crudo
const VIOLET = [74, 47, 107];   // Violeta Crepúsculo

const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ---------------------------------------------------------------- utilidades
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const smooth = t => t * t * (3 - 2 * t);
const ei2 = t => t * t;
const eo3 = t => 1 - Math.pow(1 - t, 3);
const eio = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eoExpo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const eoBack = (t, s = 1.4) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
const TAU = Math.PI * 2;

// Interpolación por fotogramas clave: [[t, v], ...]
function kf(t, k, ease = eio) {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) {
      const [t0, v0] = k[i - 1], [t1, v1] = k[i];
      return lerp(v0, v1, ease((t - t0) / (t1 - t0)));
    }
  }
  return k[k.length - 1][1];
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Ruido de gradiente 2D (Perlin clásico), salida aprox. en [-1, 1].
function makeNoise(seed) {
  const r = mulberry32(seed);
  const perm = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  const p = new Uint8Array(512);
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const g = (h, x, y) => {
    switch (h & 7) {
      case 0: return x + y; case 1: return -x + y; case 2: return x - y; case 3: return -x - y;
      case 4: return x; case 5: return -x; case 6: return y; default: return -y;
    }
  };
  const f = t => t * t * t * (t * (t * 6 - 15) + 10);
  return (x, y) => {
    const xf = Math.floor(x), yf = Math.floor(y);
    const X = xf & 255, Y = yf & 255;
    x -= xf; y -= yf;
    const u = f(x), v = f(y);
    const a = p[X] + Y, b = p[X + 1] + Y;
    return lerp(lerp(g(p[a], x, y), g(p[b], x - 1, y), u), lerp(g(p[a + 1], x, y - 1), g(p[b + 1], x - 1, y - 1), u), v);
  };
}
const N1 = makeNoise(1), N2 = makeNoise(2), N3 = makeNoise(3);

function mk(w = W, h = H) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// Trazo suave por una lista de puntos [x0, y0, x1, y1, ...].
function smoothPath(ctx, pts) {
  const n = pts.length / 2;
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 1; i < n - 1; i++) {
    const mx = (pts[i * 2] + pts[i * 2 + 2]) / 2, my = (pts[i * 2 + 1] + pts[i * 2 + 3]) / 2;
    ctx.quadraticCurveTo(pts[i * 2], pts[i * 2 + 1], mx, my);
  }
  ctx.lineTo(pts[(n - 1) * 2], pts[(n - 1) * 2 + 1]);
}

// ---------------------------------------------------------------- tipografía
function setFont(ctx, size, { it = false, w = 400, fam = 'Cormorant', ls = 0 } = {}) {
  ctx.font = `${it ? 'italic ' : ''}${w} ${size}px ${fam}`;
  ctx.letterSpacing = `${ls}px`;
}

// Revela palabra por palabra: entra con desenfoque y sube; sale con desenfoque.
// ws = [[texto, cursiva], ...]. La palabra mágica (cursiva) va en Oro Inca sobre
// fondo oscuro, como en la jerarquía tipográfica del manual (3.2).
function words(ctx, ws, x, y, o) {
  const { size = 60, align = 'left', color = CRUDO, itColor = GOLD, alpha = 1, tIn, tOut, t, stagger = 0.07, dur = 0.6, w = 400, rise = 18, blur = 10 } = o;
  setFont(ctx, size, { w });
  const sp = ctx.measureText(' ').width;
  const widths = ws.map(([s, it]) => { setFont(ctx, size, { it, w }); return ctx.measureText(s).width; });
  const total = widths.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  let cx = align === 'center' ? x - total / 2 : x;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ws.forEach(([s, it], i) => {
    const pi = eo3(prog(t, tIn + i * stagger, tIn + i * stagger + dur));
    const po = ei2(prog(t, tOut - 0.35 + i * 0.025, tOut + i * 0.025));
    const a = alpha * pi * (1 - po);
    if (a > 0.003) {
      setFont(ctx, size, { it, w });
      const b = (1 - pi) * blur + po * blur;
      ctx.save();
      ctx.filter = b > 0.3 ? `blur(${b.toFixed(2)}px)` : 'none';
      ctx.fillStyle = rgba(it ? itColor : color, a);
      ctx.fillText(s, cx, y + (1 - pi) * rise - po * rise * 0.6);
      ctx.restore();
    }
    cx += widths[i] + sp;
  });
}

// ---------------------------------------------------------------- fondo
function background(ctx, t) {
  // "Cielo andino" del manual (3.4): lineal vertical, Noche arriba y Violeta abajo.
  const k = kf(t, [[0, 0.15], [1.6, 0.9], [2.6, 0.8], [5, 0.75], [10, 0.68], [15.3, 0.75], [16.6, 1], [20, 1]]);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, rgba(NIGHT));
  g.addColorStop(1, rgba(mixc(NIGHT, VIOLET, k)));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

const STARS = (() => {
  const r = mulberry32(7), a = [];
  for (let i = 0; i < 360; i++) {
    a.push({ x: r() * W, y: r() * H * 0.92, s: 0.35 + Math.pow(r(), 4) * 2.1, ph: r() * TAU, f: 0.6 + r() * 2.4, d: 0.2 + r() * 0.8 });
  }
  return a;
})();

function stars(ctx, t) {
  const A = kf(t, [[0, 0], [0.9, 0.8], [2.4, 0.8], [3.0, 0.4], [7.4, 0.32], [8, 0.22], [10.2, 0.12], [15.3, 0.12], [16.3, 0.85], [20, 0.85]]);
  if (A < 0.01) return;
  const drift = t * 7;
  for (const s of STARS) {
    let x = (s.x - drift * s.d) % W;
    if (x < 0) x += W;
    const tw = 0.55 + 0.45 * Math.sin(t * s.f + s.ph);
    ctx.fillStyle = rgba(CRUDO, A * tw * (0.25 + 0.75 * Math.min(1, s.s / 1.6)));
    ctx.beginPath();
    ctx.arc(x, s.y, s.s, 0, TAU);
    ctx.fill();
  }
}

// ============================================================ 0 · INTRO
// Un hilo de oro se dibuja de izquierda a derecha; la cámara entra en él.
const introY = x => 548 + 20 * Math.sin(x * 0.0037 + 0.6) * Math.sin(x * 0.0013 + 0.9);

function sIntro(ctx, t) {
  const z = 1 + 7 * Math.pow(prog(t, 2.12, 2.66), 3);
  const cy = introY(960);
  ctx.translate(960, cy);
  ctx.scale(z, z);
  ctx.translate(-960, -cy);

  const tip = lerp(-40, 1980, eio(prog(t, 0.15, 2.05)));
  if (tip > -40) {
    ctx.lineCap = 'round';
    // dos cabos torcidos
    for (let k = 0; k < 2; k++) {
      ctx.strokeStyle = rgba(k ? GOLD : mixc(GOLD, CRUDO, 0.35), 0.95);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (let x = -40; x <= tip; x += 2) {
        const y = introY(x) + 1.5 * Math.sin(x * 0.34 + k * Math.PI);
        x === -40 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // la punta del hilo: un punto de Crudo, sin resplandor
    const sa = 1 - smooth(prog(t, 1.95, 2.3));
    if (sa > 0) {
      ctx.fillStyle = rgba(CRUDO, sa);
      ctx.beginPath();
      ctx.arc(tip, introY(tip), 2.6, 0, TAU);
      ctx.fill();
    }
  }
  words(ctx, [['Some', 0], ['threads', 0], ['carry', 1], ['centuries.', 1]], 960, 470, {
    size: 72, align: 'center', tIn: 0.55, tOut: 2.2, t, stagger: 0.13, dur: 0.75, rise: 22, blur: 12,
  });
}

// ============================================================ 1-2 · FIBRA E HILADO
// La fibra de alpaca flota como una nube; luego se estira y se tuerce
// hacia la pushka (huso andino), que gira y acumula el hilo.
const DRAFT = [960, 330];   // punto donde la fibra se tuerce
const COP_TOP = 600;        // donde el hilo entra al huso

const FIBERS = (() => {
  const r = mulberry32(11), a = [];
  const gauss = () => { const u = Math.max(1e-6, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
  for (let i = 0; i < 360; i++) {
    a.push({
      qx: 960 + gauss() * 330, qy: 520 + gauss() * 115,
      L: 110 + r() * 250, th: (r() - 0.5) * 0.9,
      a: 0.10 + r() * 0.36, w: 0.55 + r() * 1.1, gold: r() < 0.07,
      bx: r() * 2400 - 240, by: (r() - 0.5) * 120,
      stream: r() < 0.72, d: 4.45 + r() * 3.0,
      ph: r() * TAU, seed: r() * 200, lag: r() * 0.35,
    });
  }
  return a;
})();

function spindleSway(t) { return 5 * Math.sin(t * 1.7); }

// Giro del hilado al teñido: ambas escenas comparten el ángulo visible del hilo
// (90° = vertical en el huso, 0° = horizontal en el teñido) y la escala, así el
// fundido entre ellas coincide cuadro a cuadro.
function turnAngle(t) { return (Math.PI / 2) * (1 - eio(prog(t, 7.0, 8.2))); }
function turnScale(t) { return 1 + 0.5 * Math.sin(Math.PI * eio(prog(t, 7.0, 8.2))); }

function yarnX(y, t, phase = 0, r = 3) {
  const k = clamp((y - DRAFT[1]) / (COP_TOP - DRAFT[1]));
  return 960 + spindleSway(t) * k + r * Math.sin(y * 0.11 + phase - t * 17);
}

function fiberPoints(f, t, out) {
  const n = 14;
  const mb = eo3(prog(t, 2.42 + f.lag, 3.5 + f.lag));      // haz -> nube
  const rise = eio(prog(t, 4.3 + f.lag * 0.5, 5.5 + f.lag * 0.5)); // la nube sube
  const cx = lerp(f.qx, 960 + (f.qx - 960) * 0.88, rise) + 34 * N1(f.seed, t * 0.16);
  const cy = lerp(f.qy, 150 + (f.qy - 520) * 0.42, rise) + 26 * N1(f.seed + 50, t * 0.16);
  const th = f.th + 0.75 * N2(f.seed + 9, t * 0.13);
  const ct = Math.cos(th), st = Math.sin(th);
  const sp = f.stream ? (t - f.d) * 0.75 : -1;
  for (let k = 0; k < n; k++) {
    const s = k / (n - 1) - 0.5;
    const wob = 24 * N3(f.seed + k * 0.13, t * 0.33);
    let x = cx + ct * s * f.L - st * wob;
    let y = cy + st * s * f.L + ct * wob;
    if (mb < 1) {
      const bx = f.bx + s * f.L * 1.9, by = 548 + f.by + s * f.L * 0.2;
      x = lerp(bx, x, mb); y = lerp(by, y, mb);
    }
    if (sp > 0) {
      const sk = sp - 0.45 * (k / (n - 1));
      if (sk > 0) {
        let px, py;
        const s2 = Math.min(sk, 2);
        if (s2 <= 1) {
          const p1x = lerp(cx, 960, 0.35), p1y = Math.max(cy, 150) + 120;
          const iu = 1 - s2;
          px = iu * iu * cx + 2 * iu * s2 * p1x + s2 * s2 * DRAFT[0];
          py = iu * iu * cy + 2 * iu * s2 * p1y + s2 * s2 * DRAFT[1];
        } else {
          py = DRAFT[1] + (s2 - 1) * (COP_TOP - DRAFT[1]);
          px = yarnX(py, t, f.ph, 5.5 * (1 - 0.45 * (s2 - 1)));
        }
        const m = smooth(clamp(sk * 3));
        x = lerp(x, px, m); y = lerp(y, py, m);
      }
    }
    out[k * 2] = x; out[k * 2 + 1] = y;
  }
  let a = f.a;
  if (sp > 0) a *= 1 - smooth(prog(sp - 0.45, 1.55, 1.95));
  return a;
}

function spindle(ctx, t) {
  if (t < 4.85) return;
  const X = 960 + spindleSway(t);
  const rot = t * 11;
  // eje
  const shaftP = eo3(prog(t, 4.85, 5.35));
  ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(GOLD, 0.95);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(X, 1010);
  ctx.lineTo(X, lerp(1010, 585, shaftP));
  ctx.stroke();
  // ovillo de hilo (copo)
  const grow = eo3(prog(t, 5.0, 5.7)) * (0.72 + 0.28 * prog(t, 5.7, 7.6));
  if (grow > 0.01) {
    const top = 604, bot = 830, mw = 50 * grow;
    const wAt = y => { const u = (y - top) / (bot - top); return mw * Math.sin(Math.PI * Math.pow(u, 0.75)); };
    ctx.beginPath();
    ctx.moveTo(X, top);
    for (let y = top; y <= bot; y += 4) ctx.lineTo(X + wAt(y), y);
    for (let y = bot; y >= top; y -= 4) ctx.lineTo(X - wAt(y), y);
    ctx.closePath();
    const g = ctx.createLinearGradient(X - mw, 0, X + mw, 0);
    g.addColorStop(0, rgba(mixc(CRUDO, VIOLET, 0.65)));
    g.addColorStop(0.42, rgba(CRUDO));
    g.addColorStop(1, rgba(mixc(CRUDO, NIGHT, 0.6)));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = rgba(VIOLET, 0.42);
    ctx.lineWidth = 1;
    for (let k = 0; k < 40; k++) {
      const y = top + (((k * 7 + rot * 9) % 280) + 280) % 280 - 20;
      ctx.beginPath();
      ctx.moveTo(X - mw, y);
      ctx.lineTo(X + mw, y + 9);
      ctx.stroke();
    }
    ctx.restore();
  }
  // tortero (piruro) con grosor y marcas girando
  const ws = eoBack(prog(t, 5.05, 5.55), 1.6);
  if (ws > 0.01) {
    const wy = 860, rx = 96 * ws, ry = 20 * ws, th = 9 * ws;
    ctx.fillStyle = rgba(mixc(NIGHT, VIOLET, 0.55));
    ctx.beginPath();
    ctx.ellipse(X, wy + th, rx, ry, 0, 0, Math.PI);
    ctx.lineTo(X - rx, wy);
    ctx.ellipse(X, wy, rx, ry, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.9);
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(X, wy + th, rx, ry, 0, 0, Math.PI); ctx.stroke();
    ctx.fillStyle = rgba(NIGHT);
    ctx.beginPath(); ctx.ellipse(X, wy, rx, ry, 0, 0, TAU); ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(X, wy, rx * 0.62, ry * 0.62, 0, 0, TAU); ctx.stroke();
    for (let j = 0; j < 16; j++) {
      const a = (j / 16) * TAU + rot;
      const depth = (Math.sin(a) + 1) / 2;
      ctx.fillStyle = rgba(j % 4 === 0 ? CRUDO : GOLD, 0.25 + 0.75 * depth);
      ctx.beginPath();
      ctx.arc(X + Math.cos(a) * rx * 0.81, wy + Math.sin(a) * ry * 0.81, 1.5 + depth * 1.6, 0, TAU);
      ctx.fill();
    }
    // eje delante del tortero
    ctx.strokeStyle = rgba(GOLD, 0.95);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(X, wy - 2); ctx.lineTo(X, 1010); ctx.stroke();
  }
}

const _pts = new Float32Array(28);
function sFiber(ctx, t) {
  const zIn = lerp(1.9, 1, eoExpo(prog(t, 2.36, 3.3)));
  const ts = turnScale(t);
  ctx.translate(960, 540);
  ctx.rotate(turnAngle(t) - Math.PI / 2);
  ctx.scale(zIn * ts, zIn * ts);
  ctx.translate(-960, -540);

  const ya = smooth(prog(t, 4.75, 5.35));

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const f of FIBERS) {
    const a = fiberPoints(f, t, _pts);
    if (a < 0.004) continue;
    ctx.strokeStyle = rgba(f.gold ? GOLD : CRUDO, a);
    ctx.lineWidth = f.w;
    smoothPath(ctx, _pts);
    ctx.stroke();
  }

  // el hilo ya torcido, de la nube al huso
  if (ya > 0) {
    const yTop = DRAFT[1], yBot = lerp(DRAFT[1], COP_TOP + 6, eo3(prog(t, 4.75, 5.4)));
    ctx.strokeStyle = rgba(CRUDO, 0.22 * ya);
    ctx.lineWidth = 7;
    ctx.beginPath();
    for (let y = yTop; y <= yBot; y += 4) y === yTop ? ctx.moveTo(yarnX(y, t, 0, 0), y) : ctx.lineTo(yarnX(y, t, 0, 0), y);
    ctx.stroke();
    for (let k = 0; k < 2; k++) {
      ctx.strokeStyle = rgba(k ? CRUDO : mixc(CRUDO, GOLD, 0.5), 0.95 * ya);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let y = yTop; y <= yBot; y += 2) {
        const x = yarnX(y, t, k * Math.PI, 2.2);
        y === yTop ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  spindle(ctx, t);
}

// ============================================================ 3 · TEÑIDO
// Una gota de cochinilla cae sobre el hilo crudo; el rojo corre por el hilo.
const T_DROP = 8.125; // tiempo 13 (pulso fuerte del compás 4)

const SPLASH = (() => {
  const r = mulberry32(21), a = [];
  for (let i = 0; i < 14; i++) {
    const ang = Math.PI * (0.12 + 0.76 * r());
    const v = 260 + r() * 520;
    a.push({ vx: Math.cos(ang) * v, vy: -Math.sin(ang) * v, rad: 1.6 + r() * 3.4 });
  }
  return a;
})();

const FUZZ = (() => {
  const r = mulberry32(31), a = [];
  for (let i = 0; i < 520; i++) a.push({ x: -700 + r() * 3320, ang: (r() - 0.5) * 2.6, len: 3 + r() * 9, side: r() < 0.5 ? -1 : 1 });
  return a;
})();

function dyeWave(x, tau) {
  if (tau < 0) return 0;
  const dx = Math.abs(x - 960);
  return 32 * Math.exp(-3.0 * tau) * Math.sin(15 * tau) * Math.exp(-(dx * dx) / (2 * 170 * 170)) +
    15 * Math.exp(-1.5 * tau) * Math.exp(-Math.pow((dx - 950 * tau) / 120, 2)) * Math.sin(dx * 0.012 - tau * 9);
}

function sDye(ctx, t) {
  const sc = turnScale(t) * (1 + 0.035 * prog(t, 8.2, 10));
  ctx.translate(960, 540);
  ctx.rotate(turnAngle(t));
  ctx.scale(sc, sc);
  ctx.translate(-960, -540);

  const tau = t - T_DROP;
  const whip = eio(prog(t, 9.7, 10.25));
  const yOff = x => -980 * whip * (1 - 0.25 * Math.pow((x - 960) / 1100, 2));
  const yT = x => 540 + dyeWave(x, tau) + yOff(x);

  // frente de tinte
  const F = tau > 0 ? 1450 * (1 - Math.exp(-1.15 * tau)) : 0;
  let stroke = rgba(CRUDO, 0.95), strokeHi = rgba(mixc(CRUDO, GOLD, 0.45), 0.95);
  if (F > 1) {
    const x0 = 960 - F - 150, x1 = 960 + F + 150, L = x1 - x0;
    const mk2 = (c1, c2) => {
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, rgba(c1, 0.95));
      g.addColorStop(150 / L, rgba(c2, 0.98));
      g.addColorStop(1 - 150 / L, rgba(c2, 0.98));
      g.addColorStop(1, rgba(c1, 0.95));
      return g;
    };
    stroke = mk2(CRUDO, COCH);
    strokeHi = mk2(mixc(CRUDO, GOLD, 0.45), mixc(COCH, CRUDO, 0.22));
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // cuerpo del hilo
  ctx.strokeStyle = stroke;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 9;
  ctx.beginPath();
  for (let x = -700; x <= 2620; x += 8) x === -700 ? ctx.moveTo(x, yT(x)) : ctx.lineTo(x, yT(x));
  ctx.stroke();
  ctx.globalAlpha = 1;
  // dos cabos
  for (let k = 0; k < 2; k++) {
    ctx.strokeStyle = k ? stroke : strokeHi;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let x = -700; x <= 2620; x += 2.5) {
      const y = yT(x) + 2.6 * Math.sin(x * 0.2 + k * Math.PI);
      x === -700 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // pelusa de fibra: la textura de la alpaca siempre se ve
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = F > 1 ? stroke : rgba(CRUDO, 0.6);
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  for (const h of FUZZ) {
    const y = yT(h.x) + h.side * 3;
    ctx.moveTo(h.x, y);
    ctx.lineTo(h.x + Math.cos(h.ang) * h.len * 0.6, y + h.side * Math.abs(Math.sin(h.ang)) * h.len);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  // gota que cae
  if (t >= 7.7 && tau < 0) {
    const p = prog(t, 7.7, T_DROP);
    const r = 13;
    const y = lerp(-80, 540 - r - 3, ei2(p));
    const stretch = 1 + 0.55 * p;
    ctx.save();
    ctx.translate(960, y);
    ctx.scale(1 / Math.sqrt(stretch), stretch);
    ctx.beginPath();
    ctx.moveTo(0, -r * 2.5);
    ctx.quadraticCurveTo(r * 1.1, -r * 0.7, r, 0);
    ctx.arc(0, 0, r, 0, Math.PI);
    ctx.quadraticCurveTo(-r * 1.1, -r * 0.7, 0, -r * 2.5);
    ctx.fillStyle = rgba(COCH);
    ctx.fill();
    ctx.fillStyle = rgba(CRUDO, 0.55);
    ctx.beginPath();
    ctx.ellipse(-r * 0.38, -r * 0.25, r * 0.18, r * 0.32, 0.3, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  if (tau >= 0 && tau < 1.0) {
    // anillos de impacto
    for (let k = 0; k < 2; k++) {
      const p = prog(tau, k * 0.12, 0.95 + k * 0.12);
      if (p <= 0 || p >= 1) continue;
      const rr = 560 * eo3(p);
      ctx.strokeStyle = rgba(GOLD, 0.7 * (1 - p));
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.ellipse(960, 540, rr, rr * 0.2, 0, 0, TAU);
      ctx.stroke();
    }
    // salpicadura
    for (const s of SPLASH) {
      const a = 1 - prog(tau, 0, 0.75);
      if (a <= 0) continue;
      const x = 960 + s.vx * tau, y = 530 + s.vy * tau + 0.5 * 2600 * tau * tau;
      ctx.fillStyle = rgba(COCH, a);
      ctx.beginPath();
      ctx.arc(x, y, s.rad * (1 - 0.4 * tau), 0, TAU);
      ctx.fill();
    }
  }
}

// ============================================================ 4-5 · URDIMBRE Y TEJIDO
const NC = 48, NR = 52, CW = 15, RH = 15;
const X0 = 600, X1 = X0 + NC * CW;           // 600 .. 1320
const YB = 930, YT = YB - NR * RH;           // 930 .. 150
const WARP_TOP = 136, WARP_BOT = 944;
const IDX = [VIOLET, CRUDO, GOLD, COCH, NIGHT];

function tri(c, p = 10) { const m = ((c % p) + p) % p; return Math.abs(m - p / 2); }

// Diseño del textil (fila 0 = abajo). Franjas, río (mayu), montañas (apus)
// y en el centro un rombo escalonado en cochinilla. La Chakana no se usa como
// motivo: es el sello de la casa y aparece una sola vez, en el cierre.
function cellColor(r, c) {
  const V = 0, K = 1, G = 2, R = 3, N = 4;
  if (c === 0 || c === NC - 1) return N;
  if (r <= 1 || r >= NR - 2) return K;
  if (r === 2 || r === NR - 3) return G;
  if (r === 3 || r === NR - 4) return N;
  if (r >= 4 && r <= 9) { const v = tri(c + 5); return r - 4 === v ? K : N; }          // mayu (río)
  if (r === 10 || r === 41) return N;
  if (r === 11 || r === 40) return G;
  if (r >= 42 && r <= 47) { const v = tri(c + 5), rr = r - 42; return rr === v ? K : rr < v ? V : N; } // apus
  // campo central
  if (c === 1 || c === NC - 2) return G;
  const dx = Math.abs(c - 23.5), dy = Math.abs(r - 25.5), d = dx + dy;
  if (d <= 6) return d <= 1 ? K : R;
  if (d === 11) return K;
  if (d === 9) return G;
  for (const sx of [6.5, 40.5]) {
    const ds = Math.abs(c - sx) + dy;
    if (ds === 5) return K;
    if (ds === 3) return G;
    if (ds <= 1) return K;
  }
  if (d > 12 && c % 4 === 1 && r % 4 === 1) return G;
  return V;
}

// Textil pre-renderizado a 3x: cada celda es una puntada con brillo y fibras.
const TS = 3;
const TEX = (() => {
  const s = CW * TS, cv = mk(NC * s, NR * s), x = cv.getContext('2d');
  const r = mulberry32(41);
  for (let row = 0; row < NR; row++) {
    for (let c = 0; c < NC; c++) {
      const idx = cellColor(row, c);
      const col = idx === 4 ? mixc(NIGHT, VIOLET, 0.28) : IDX[idx];
      const X = c * s, Y = (NR - 1 - row) * s;
      // fondo de la celda casi del mismo tono: el tejido es continuo, sin huecos
      x.fillStyle = rgba(mixc(col, NIGHT, 0.32));
      x.fillRect(X, Y, s, s);
      x.save();
      x.beginPath(); x.rect(X, Y, s, s); x.clip();
      // dos flotes inclinados en "V", como el tejido de faz de urdimbre andino
      for (const side of [-1, 1]) {
        const cx = X + s / 2 + side * s * 0.215, cy = Y + s / 2;
        const g = x.createLinearGradient(cx - s * 0.25, Y, cx + s * 0.25, Y + s);
        g.addColorStop(0, rgba(mixc(col, CRUDO, idx === 1 ? 0.0 : 0.2)));
        g.addColorStop(0.5, rgba(col));
        g.addColorStop(1, rgba(mixc(col, NIGHT, 0.28)));
        x.fillStyle = g;
        x.beginPath();
        x.ellipse(cx, cy, s * 0.24, s * 0.56, side * 0.32, 0, TAU);
        x.fill();
        x.strokeStyle = rgba(mixc(col, CRUDO, 0.45), 0.32);
        x.lineWidth = 1;
        for (let k = 0; k < 3; k++) {
          const o = (k - 1) * s * 0.08 + (r() - 0.5) * 2;
          x.beginPath();
          x.moveTo(cx + o + side * s * 0.16, Y - s * 0.02);
          x.lineTo(cx + o - side * s * 0.16, Y + s * 1.02);
          x.stroke();
        }
      }
      // surco entre filas
      x.fillStyle = rgba(NIGHT, 0.22);
      x.fillRect(X, Y + s - 2, s, 2);
      x.restore();
    }
  }
  return cv;
})();

function rowsDone(t) {
  const u = prog(t, 12.6, 15.2);
  return NR * (0.08 * u + 0.92 * Math.pow(u, 2.5));
}

function warpX(j) { return X0 + (j + 0.5) * CW; }

function sLoom(ctx, t) {
  // cámara: plano general -> acercamiento al inicio del tejido -> se aleja
  const s = kf(t, [[10.0, 1.0], [12.15, 1.045], [12.75, 2.5], [13.35, 2.5], [15.3, 1.0]]) * lerp(1, 0.93, ei2(prog(t, 15.45, 16.05)));
  const fy = kf(t, [[12.15, 540], [12.75, 880], [13.35, 845], [15.3, 540]]) + 30 * ei2(prog(t, 15.45, 16.05));
  ctx.translate(960, 540);
  ctx.scale(s, s);
  const fx = kf(t, [[10.0, 830], [12.15, 830], [12.75, 960]]);
  ctx.translate(-fx, -fy);

  // vigas del telar
  const bp = eo3(prog(t, 9.9, 10.35));
  ctx.fillStyle = rgba(mixc(NIGHT, VIOLET, 0.6));
  ctx.strokeStyle = rgba(GOLD, 0.9);
  ctx.lineWidth = 1.2;
  for (const by of [WARP_TOP - 10, WARP_BOT + 2]) {
    const hw = 400 * bp;
    ctx.fillRect(960 - hw, by, hw * 2, 8);
    ctx.strokeRect(960 - hw, by, hw * 2, 8);
  }

  // urdimbre: cae en cascada desde el centro
  const r = rowsDone(t);
  const shed = t > 10.9 && t < 12.7 ? Math.floor((t - 10.9) / (BEAT / 2)) % 2 : 0;
  const shedE = t > 10.9 && t < 12.7 ? smooth(clamp(((t - 10.9) % (BEAT / 2)) / 0.08)) : 0;
  ctx.lineCap = 'butt';
  for (let j = 0; j < NC; j++) {
    const o = Math.abs(j - 23.5) - 0.5;
    const ts = 10.02 + o * 0.016;
    const p = prog(t, ts, ts + 0.38);
    if (p <= 0) continue;
    const yEnd = Math.min(WARP_BOT + 14, WARP_TOP + (WARP_BOT - WARP_TOP) * eoBack(p, 1.1));
    let x = warpX(j);
    const odd = j % 2 === 1;
    const lift = odd === (shed === 1);
    if (t > 10.9 && t < 12.7) x += (lift ? 1 : -1) * 1.6 * shedE;
    const gold = j % 6 === 2;
    ctx.strokeStyle = rgba(gold ? GOLD : CRUDO, gold ? 0.9 : (t > 10.9 && t < 12.7 ? (lift ? 0.95 : 0.55) : 0.8));
    ctx.lineWidth = gold ? 1.3 : 1.7;
    const tau = t - (ts + 0.38);
    if (tau > 0 && tau < 0.8) {
      ctx.beginPath();
      for (let k = 0; k <= 12; k++) {
        const y = lerp(WARP_TOP, yEnd, k / 12);
        const vx = 3.2 * Math.exp(-6 * tau) * Math.sin(55 * tau) * Math.sin(Math.PI * k / 12);
        k === 0 ? ctx.moveTo(x + vx, y) : ctx.lineTo(x + vx, y);
      }
      ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(x, WARP_TOP); ctx.lineTo(x, yEnd); ctx.stroke();
    }
    if (p < 1) {
      ctx.fillStyle = rgba(GOLD, 1 - p);
      ctx.beginPath(); ctx.arc(x, yEnd, 2.2, 0, TAU); ctx.fill();
    }
  }

  // vara de lizos: levanta los hilos alternos a cada corchea
  const hr = eo3(prog(t, 10.85, 11.25)) * (1 - smooth(prog(t, 13.0, 13.5)));
  if (hr > 0) {
    const hy = 470 - (shed ? 6 : 0) * shedE;
    ctx.strokeStyle = rgba(GOLD, 0.85 * hr);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(960 - 400 * hr, hy); ctx.lineTo(960 + 400 * hr, hy); ctx.stroke();
    ctx.fillStyle = rgba(CRUDO, 0.8 * hr);
    for (let j = shed; j < NC; j += 2) { ctx.beginPath(); ctx.arc(warpX(j), hy, 2, 0, TAU); ctx.fill(); }
  }

  // tejido
  if (r > 0) {
    const k = Math.floor(r), fr = r - k, sTex = CW * TS;
    ctx.imageSmoothingQuality = 'high';
    if (k > 0) {
      const kk = Math.min(k, NR);
      ctx.drawImage(TEX, 0, (NR - kk) * sTex, NC * sTex, kk * sTex, X0, YB - kk * RH, NC * CW, kk * RH);
    }
    const rate = (rowsDone(t + 0.01) - rowsDone(t - 0.01)) / 0.02;
    if (k < NR) {
      const dir = k % 2 === 0 ? 1 : -1;
      const shx = dir > 0 ? lerp(X0 - 40, X1 + 40, fr) : lerp(X1 + 40, X0 - 40, fr);
      const ry = YB - (k + 1) * RH;
      // celdas reveladas de la fila en curso
      let c0, c1;
      if (dir > 0) { c0 = 0; c1 = clamp(Math.floor((shx - X0) / CW + 0.5), 0, NC); }
      else { c0 = clamp(Math.ceil((shx - X0) / CW - 0.5), 0, NC); c1 = NC; }
      if (c1 > c0) ctx.drawImage(TEX, c0 * sTex, (NR - 1 - k) * sTex, (c1 - c0) * sTex, sTex, X0 + c0 * CW, ry, (c1 - c0) * CW, RH);
      // trama que se tiende y lanzadera
      const sa = 1 - smooth(prog(rate, 5, 13));
      if (sa > 0.01) {
        const yy = ry + RH / 2;
        ctx.strokeStyle = rgba(CRUDO, 0.85 * sa);
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(dir > 0 ? X0 - 40 : X1 + 40, yy); ctx.lineTo(shx, yy); ctx.stroke();
        ctx.fillStyle = rgba(GOLD, sa);
        ctx.beginPath(); ctx.ellipse(shx, yy, 22, 3.6, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba(CRUDO, sa);
        ctx.beginPath(); ctx.ellipse(shx + dir * 4, yy - 0.8, 8, 1.2, 0, 0, TAU); ctx.fill();
      }
    }
    // el golpe del wichuña: una línea de oro que asienta cada pasada
    if (r < NR + 2) {
      const by = YB - Math.min(r, NR) * RH;
      ctx.strokeStyle = rgba(GOLD, 0.9 * (1 - smooth(prog(t, 15.15, 15.5))));
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X0 - 20, by); ctx.lineTo(X1 + 20, by); ctx.stroke();
    }
  }
}

function win(t, a, b, c, d) { return Math.min(smooth(prog(t, a, b)), 1 - smooth(prog(t, c, d))); }

// ============================================================ 6 · APUS
// La franja de montañas del textil se desprende como línea de oro y se vuelve la
// cordillera. Delante sube la silueta en Noche Andina: el mismo paisaje de la
// portada del manual, que se queda como base de la firma final.
const RIDGE_N = 320;
const RIDGE_SRC = [], RIDGE_TGT = [], NEAR = [];

// Cordillera de tramos rectos, como las del manual. Más baja en el centro para
// dejar la zona de cielo libre al logotipo.
function angularRange(seed, n, base, hMin, hMax, spires) {
  const r = mulberry32(seed), v = [];
  for (let i = 0; i <= n; i++) {
    const x = -40 + i * (W + 80) / n + (i > 0 && i < n ? (r() - 0.5) * 50 : 0);
    const dip = 1 - 0.6 * Math.exp(-Math.pow((x - 960) / 420, 2));
    v.push([x, base - (hMin + r() * (hMax - hMin)) * dip]);
  }
  for (const [i, h] of spires) v[i][1] = base - h;
  return x => {
    for (let i = 1; i < v.length; i++) {
      if (x <= v[i][0]) { const [x0, y0] = v[i - 1], [x1, y1] = v[i]; return lerp(y0, y1, (x - x0) / (x1 - x0)); }
    }
    return v[v.length - 1][1];
  };
}
(() => {
  const far = angularRange(5, 26, 800, 50, 200, [[3, 300], [22, 350], [23, 240]]);
  const near = angularRange(13, 18, 1010, 60, 130, []);
  for (let i = 0; i < RIDGE_N; i++) {
    const u = i / (RIDGE_N - 1);
    const sx = lerp(X0 + 7.5, X1 - 7.5, u);
    const cc = (sx - X0) / CW - 0.5;
    RIDGE_SRC.push([sx, YB - (42 + tri(cc + 5) + 0.5) * RH]);
    const tx = lerp(-40, W + 40, u);
    RIDGE_TGT.push([tx, far(tx)]);
    NEAR.push([tx, near(tx)]);
  }
})();

// La cámara sube al cielo para la firma: la cordillera baja hacia el borde.
function apusSink(t) { return eio(prog(t, 17.2, 18.4)); }

function sApus(ctx, t) {
  const sink = apusSink(t);
  const rise = 1 - eio(prog(t, 15.9, 16.8));

  // línea de oro: nace exactamente sobre la franja de montañas del textil
  const lA = smooth(prog(t, 15.28, 15.45));
  if (lA > 0) {
    ctx.lineJoin = 'miter';
    ctx.strokeStyle = rgba(GOLD, 0.95 * lA);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < RIDGE_N; i++) {
      const u = i / (RIDGE_N - 1), d = Math.abs(u - 0.5);
      const m = eio(prog(t, 15.45 + 0.3 * d, 16.25 + 0.3 * d));
      const x = lerp(RIDGE_SRC[i][0], RIDGE_TGT[i][0], m);
      const y = lerp(RIDGE_SRC[i][1], RIDGE_TGT[i][1], m) + 150 * sink;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  // silueta cercana en Noche Andina, sólida
  if (rise < 1) {
    ctx.beginPath();
    ctx.moveTo(-40, H + 10);
    for (const [x, y] of NEAR) ctx.lineTo(x, y + 280 * rise + 40 * sink);
    ctx.lineTo(W + 40, H + 10);
    ctx.closePath();
    ctx.fillStyle = rgba(NIGHT);
    ctx.fill();
  }
  words(ctx, [['From', 0], ['the', 0], ['Andes', 0], ['to', 0], ['Utah.', 1]], 960, 330, {
    size: 76, align: 'center', tIn: 15.95, tOut: 17.4, t, stagger: 0.1, dur: 0.7, rise: 20, blur: 12,
  });
}

// ============================================================ 7 · FIRMA
// Firma vertical con descriptor (manual 2.2): Chakana de doble contorno sobre la
// retícula de 9×9 módulos, nombre en versalitas (Cormorant 500, tracking +420),
// el hilo con rombo central y el descriptor en cursiva. Sin sombras ni efectos
// (2.6): todo entra por trazo o por fundido y termina quieto.
const LOGO_C = [960, 292], MOD = 20;  // centro de la Chakana y módulo de la retícula
const CHAK = [[-1, -4], [1, -4], [1, -3], [2, -3], [2, -2], [3, -2], [3, -1], [4, -1], [4, 1], [3, 1], [3, 2], [2, 2],
  [2, 3], [1, 3], [1, 4], [-1, 4], [-1, 3], [-2, 3], [-2, 2], [-3, 2], [-3, 1], [-4, 1], [-4, -1], [-3, -1], [-3, -2],
  [-2, -2], [-2, -3], [-1, -3]];
const CHAK_LEN = 32 * MOD;   // perímetro del contorno exterior: 32 módulos
const INNER = 0.6;          // el contorno interior es el exterior a escala 0,6

function chakanaPath(ctx, sc) {
  ctx.beginPath();
  CHAK.forEach(([x, y], i) => {
    const px = LOGO_C[0] + x * MOD * sc, py = LOGO_C[1] + y * MOD * sc;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  });
  ctx.closePath();
}

// Constelaciones en Oro Inca (manual 3.5): la Cruz del Sur con sus punteros,
// arriba a la izquierda, y las Pléyades (Qollqa) arriba a la derecha, siempre
// fuera del área de reserva del logotipo.
const CRUX = {
  stars: [[420, 140, 3.4], [436, 300, 4.0], [370, 232, 3.6], [482, 200, 2.8], [455, 262, 2.2], [285, 262, 3.4], [212, 284, 4.0]],
  lines: [[0, 1], [2, 3], [5, 6]],
};
const QOLLQA = {
  stars: [[1560, 196, 2.6], [1598, 172, 3.0], [1630, 186, 2.4], [1662, 160, 2.8], [1612, 214, 2.2], [1650, 222, 2.6]],
  lines: [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5]],
};

function constellation(ctx, c, t, t0) {
  c.stars.forEach(([x, y, r], i) => {
    const a = smooth(prog(t, t0 + i * 0.07, t0 + i * 0.07 + 0.35));
    if (a <= 0) return;
    ctx.fillStyle = rgba(GOLD, a);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  });
  const lp = eio(prog(t, t0 + 0.3, t0 + 0.9));
  if (lp <= 0) return;
  ctx.strokeStyle = rgba(GOLD, 0.7);
  ctx.lineWidth = 1;
  for (const [a, b] of c.lines) {
    const [ax, ay] = c.stars[a], [bx, by] = c.stars[b];
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(lerp(ax, bx, lp), lerp(ay, by, lp)); ctx.stroke();
  }
}

function sLogo(ctx, t) {
  const z = 1 + 0.02 * eo3(prog(t, 17.4, 20));
  ctx.translate(960, 540);
  ctx.scale(z, z);
  ctx.translate(-960, -540);

  constellation(ctx, CRUX, t, 17.45);
  constellation(ctx, QOLLQA, t, 17.85);

  // Chakana: hilos de oro que se dibujan y la cierran completa
  ctx.save();
  ctx.lineJoin = 'miter';
  ctx.lineCap = 'butt';
  ctx.strokeStyle = rgba(GOLD);
  ctx.lineWidth = 2.4;
  const p1 = eio(prog(t, 17.6, 18.35)), p2 = eio(prog(t, 17.75, 18.45));
  if (p1 > 0) {
    ctx.setLineDash([CHAK_LEN * p1, CHAK_LEN]);
    chakanaPath(ctx, 1);
    ctx.stroke();
  }
  if (p2 > 0) {
    ctx.setLineDash([CHAK_LEN * INNER * p2, CHAK_LEN]);
    chakanaPath(ctx, INNER);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  const p3 = eio(prog(t, 18.1, 18.5));
  if (p3 > 0) {
    ctx.beginPath();
    ctx.arc(LOGO_C[0], LOGO_C[1], MOD * 0.8, -Math.PI / 2, -Math.PI / 2 + TAU * p3);
    ctx.stroke();
  }
  const pd = smooth(prog(t, 18.4, 18.6));
  if (pd > 0) {
    ctx.fillStyle = rgba(GOLD, pd);
    ctx.beginPath(); ctx.arc(LOGO_C[0], LOGO_C[1], MOD * 0.18, 0, TAU); ctx.fill();
  }
  ctx.restore();

  // A N C E S T R A L: Cormorant 500, tracking +420 fijo; entra por fundido
  const word = 'ANCESTRAL', size = 100, track = size * 0.42, base = 532;
  setFont(ctx, size, { w: 500 });
  const cw = [...word].map(ch => ctx.measureText(ch).width);
  const nameW = cw.reduce((a, b) => a + b, 0) + track * (word.length - 1);
  let x = 960 - nameW / 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  [...word].forEach((ch, i) => {
    const o = Math.abs(i - 4);
    const p = smooth(prog(t, 17.95 + o * 0.05, 18.5 + o * 0.05));
    if (p > 0.003) {
      ctx.fillStyle = rgba(CRUDO, p);
      ctx.fillText(ch, x, base);
    }
    x += cw[i] + track;
  });

  // el hilo: línea fina con rombo central que une el símbolo con el nombre
  const hy = 604, hw = nameW * 0.31, dh = 9;
  const hp = eio(prog(t, 18.45, 18.95));
  const dA = smooth(prog(t, 18.4, 18.6));
  ctx.strokeStyle = rgba(GOLD);
  ctx.lineWidth = 1.5;
  if (dA > 0) {
    ctx.globalAlpha = dA;
    ctx.beginPath();
    ctx.moveTo(960, hy - dh); ctx.lineTo(960 + dh, hy); ctx.lineTo(960, hy + dh); ctx.lineTo(960 - dh, hy); ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (hp > 0) {
    const g0 = dh + 10, g1 = lerp(g0, hw, hp);
    ctx.beginPath();
    ctx.moveTo(960 - g0, hy); ctx.lineTo(960 - g1, hy);
    ctx.moveTo(960 + g0, hy); ctx.lineTo(960 + g1, hy);
    ctx.stroke();
  }

  // descriptor en cursiva, en Crudo (como en la portada del manual)
  words(ctx, [['Legacy', 1], ['and', 1], ['mystique,', 1], ['woven', 1], ['by', 1], ['the', 1], ['Andes.', 1]], 960, 712, {
    size: 46, align: 'center', itColor: CRUDO, tIn: 18.7, tOut: 99, t, stagger: 0.05, dur: 0.6, rise: 8, blur: 0,
  });

  // NOW IN UTAH: etiqueta Jost 400 con tracking +300, al pie y fuera del área
  // de reserva de la firma (2x el brazo de la Chakana)
  const np = smooth(prog(t, 19.0, 19.45));
  if (np > 0) {
    setFont(ctx, 18, { fam: 'Jost', w: 400, ls: 18 * 0.3 });
    const label = 'NOW IN UTAH';
    const lw = ctx.measureText(label).width - 18 * 0.3;
    ctx.fillStyle = rgba(GOLD, np);
    ctx.fillText(label, 960 - lw / 2, 1018);
  }
}

// ============================================================ rótulos de capítulo
// Etiqueta en Jost 400 mayúsculas con tracking +300 en Oro Inca sobre el titular
// (como "CAPÍTULO 01" en el manual) y titular en Cormorant 400 con una sola
// palabra mágica en cursiva.
const LABELS = [
  { a: 2.8, b: 4.85, n: '01', cap: 'FIBER', ws: [['Sacred', 1], ['alpaca', 0], ['fiber', 0]] },
  { a: 5.15, b: 7.0, n: '02', cap: 'SPIN', ws: [['Spun', 0], ['by', 0], ['hand,', 0], ['twist', 1], ['by', 1], ['twist', 1]] },
  { a: 8.3, b: 9.7, n: '03', cap: 'DYE', ws: [['Cochineal,', 1], ['the', 0], ['red', 0], ['of', 0], ['the', 0], ['Inca', 0]] },
  { y: 270, a: 10.4, b: 12.25, n: '04', cap: 'WARP', ws: [['Strung', 0], ['on', 0], ['the', 0], ['backstrap', 1], ['loom', 1]] },
  { y: 270, a: 12.85, b: 15.0, n: '05', cap: 'WEAVE', ws: [['Woven', 0], ['in', 0], ['Cusco,', 0], ['closer', 0], ['to', 0], ['the', 0], ['sky', 1]] },
];

function labels(ctx, t) {
  for (const L of LABELS) {
    if (t < L.a - 0.15 || t > L.b + 0.45) continue;
    const x = 150, y = L.y || 900;
    // velo de legibilidad en Noche Andina (manual 3.4)
    const sh = win(t, L.a - 0.15, L.a + 0.4, L.b - 0.1, L.b + 0.4);
    if (sh > 0) {
      ctx.save();
      ctx.translate(x + 280, y - 30);
      ctx.scale(1, 0.42);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 560);
      g.addColorStop(0, rgba(NIGHT, 0.72 * sh));
      g.addColorStop(1, rgba(NIGHT, 0));
      ctx.fillStyle = g;
      ctx.fillRect(-560, -560, 1120, 1120);
      ctx.restore();
    }
    const a = smooth(prog(t, L.a, L.a + 0.45)) * (1 - smooth(prog(t, L.b - 0.3, L.b)));
    if (a > 0) {
      setFont(ctx, 20, { fam: 'Jost', w: 400, ls: 20 * 0.3 });
      ctx.textAlign = 'left';
      ctx.fillStyle = rgba(GOLD, a);
      ctx.fillText(`${L.n}  ·  ${L.cap}`, x, y - 74);
    }
    words(ctx, L.ws, x, y, { size: 64, tIn: L.a + 0.15, tOut: L.b, t, stagger: 0.075 });
  }
}

// ============================================================ composición
const SCENES = [
  { a: 0, b: 2.7, draw: sIntro, alpha: t => 1 - smooth(prog(t, 2.36, 2.62)), blur: t => 10 * ei2(prog(t, 2.18, 2.62)) },
  { a: 2.34, b: 7.8, draw: sFiber, alpha: t => smooth(prog(t, 2.36, 2.6)) * (1 - smooth(prog(t, 7.45, 7.75))), blur: t => 10 * (1 - eo3(prog(t, 2.36, 2.95))) },
  { a: 7.44, b: 10.3, draw: sDye, alpha: t => smooth(prog(t, 7.45, 7.75)) * (1 - smooth(prog(t, 10.05, 10.25))) },
  { a: 9.88, b: 16.1, draw: sLoom, alpha: t => smooth(prog(t, 9.88, 10.0)) * (1 - smooth(prog(t, 15.5, 16.05))), blur: t => 7 * ei2(prog(t, 15.5, 16.05)) },
  { a: 15.25, b: 20.5, draw: sApus, alpha: () => 1 },
  { a: 17.38, b: 20.5, draw: sLogo, alpha: () => 1 },
];

const main = document.getElementById('c');
const mctx = main.getContext('2d');
const layer = mk(), lctx = layer.getContext('2d');
const comp = mk(), cctx = comp.getContext('2d');
const acc = mk(), actx = acc.getContext('2d');

const VIG = (() => {
  const c = mk(), x = c.getContext('2d');
  const g = x.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 1.02);
  g.addColorStop(0, rgba(NIGHT, 0));
  g.addColorStop(1, rgba(NIGHT, 0.5));
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  return c;
})();

const GRAIN = (() => {
  const r = mulberry32(99), out = [];
  for (let k = 0; k < 6; k++) {
    const c = mk(384, 384), x = c.getContext('2d');
    const id = x.createImageData(384, 384);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = 128 + (r() + r() + r() - 1.5) * 110;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
      id.data[i + 3] = 255;
    }
    x.putImageData(id, 0, 0);
    out.push(c);
  }
  return out;
})();

// El grano cambia cada 2 cuadros (30 Hz), como el de una película.
function grain(ctx, f) {
  const g = f >> 1;
  const r = mulberry32(g * 7919 + 13);
  const p = ctx.createPattern(GRAIN[g % GRAIN.length], 'repeat');
  p.setTransform(new DOMMatrix().translate(Math.floor(r() * 384), Math.floor(r() * 384)));
  ctx.save();
  // ≈3,3 % de grano (convención "Añadir ruido"), dentro del 3–5 % del manual (3.4)
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = p;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function compose(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  background(ctx, t);
  stars(ctx, t);
  for (const s of SCENES) {
    if (t < s.a || t > s.b) continue;
    const al = s.alpha(t);
    if (al <= 0.002) continue;
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    lctx.globalAlpha = 1;
    lctx.filter = 'none';
    lctx.clearRect(0, 0, W, H);
    lctx.save();
    s.draw(lctx, t);
    lctx.restore();
    const bl = s.blur ? s.blur(t) : 0;
    ctx.save();
    ctx.globalAlpha = al;
    ctx.filter = bl > 0.25 ? `blur(${bl.toFixed(2)}px)` : 'none';
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
  }
  labels(ctx, t);
  ctx.drawImage(VIG, 0, 0);
}

// Desenfoque de movimiento por sub-cuadros en los tramos rápidos.
const MB = [[2.12, 2.7, 6], [7.0, 8.2, 4], [9.7, 10.3, 6], [12.15, 12.8, 4], [14.2, 15.3, 3]];
function mbSamples(t) {
  for (const [a, b, n] of MB) if (t >= a && t <= b) return n;
  return 1;
}

window.renderFrame = (t, opts = {}) => {
  const f = Math.round(t * FPS);
  const n = opts.noMB ? 1 : mbSamples(t);
  if (n <= 1) {
    compose(mctx, t);
  } else {
    const shutter = 1 / FPS; // obturador de 360° en los tramos rápidos
    for (let i = 0; i < n; i++) {
      compose(cctx, t + shutter * (i / (n - 1) - 0.5));
      actx.globalAlpha = 1 / (i + 1);
      actx.drawImage(comp, 0, 0);
    }
    actx.globalAlpha = 1;
    mctx.setTransform(1, 0, 0, 1, 0, 0);
    mctx.globalAlpha = 1;
    mctx.filter = 'none';
    mctx.drawImage(acc, 0, 0);
  }
  grain(mctx, f);
  return true;
};

window.ready = Promise.all([
  document.fonts.load('400 40px Cormorant'),
  document.fonts.load('italic 400 40px Cormorant'),
  document.fonts.load('500 40px Cormorant'),
  document.fonts.load('300 20px Jost'),
  document.fonts.load('400 20px Jost'),
]).then(() => true);
