import { Grid, addTexture } from '../gfx/pixel.js';

export const FONT = '"Press Start 2P", monospace';

// Texto pixelado con la fuente del juego
export function txt(scene, x, y, str, o = {}) {
  const style = {
    fontFamily: FONT,
    fontSize: `${o.size || 8}px`,
    color: o.color || '#fff8ec',
    align: o.align || 'left',
    lineSpacing: o.lineSpacing ?? 5,
  };
  if (o.wrap) style.wordWrap = { width: o.wrap, useAdvancedWrap: true };
  if (o.stroke) {
    style.stroke = o.stroke;
    style.strokeThickness = o.strokeThickness || 4;
  }
  if (o.shadow) style.shadow = { offsetX: 0, offsetY: o.shadowY ?? 2, color: o.shadow, fill: true, stroke: !!o.stroke };
  const t = scene.add.text(x, y, str, style);
  if (o.origin != null) t.setOrigin(...(Array.isArray(o.origin) ? o.origin : [o.origin, o.origin]));
  if (o.depth != null) t.setDepth(o.depth);
  if (o.fixed) t.setScrollFactor(0);
  return t;
}

// Texturas de paneles (nine-slice)
export function buildUiTextures(scene) {
  const panel = (key, fill, border, inner, shine) => {
    const g = new Grid(24, 24);
    g.rect(2, 0, 20, 24, border);
    g.rect(0, 2, 24, 20, border);
    g.rect(1, 1, 22, 22, border);
    g.rect(2, 2, 20, 20, inner);
    g.rect(3, 3, 18, 18, fill);
    if (shine) g.hline(4, 3, 16, shine);
    addTexture(scene, key, g);
  };
  panel('panel', '#1d1533', '#fff1d0', '#7b4fa8', '#2a2046');
  panel('panelGold', '#241a3c', '#ffd166', '#b8863a', '#2e2450');
  panel('panelLight', '#fff8ec', '#43281d', '#f2d49b', '#ffffff');
  panel('panelDark', '#0d0917', '#5a4e6c', '#2a2040', null);
  panel('panelCode', '#0a1a14', '#46f08a', '#1c5a3a', '#10261c');

  // Botón redondo táctil
  const circle = (key, r, fill, ring) => {
    const g = new Grid(r * 2 + 2, r * 2 + 2);
    g.ellipse(r + 1, r + 1, r, r, ring);
    g.ellipse(r + 1, r + 1, r - 2, r - 2, fill);
    addTexture(scene, key, g);
  };
  circle('btnCircle', 15, 'rgba(29,21,51,0.55)', 'rgba(255,241,208,0.75)');
  circle('btnCircleOn', 15, 'rgba(255,209,102,0.6)', 'rgba(255,241,208,0.95)');
  circle('btnSmall', 9, 'rgba(29,21,51,0.55)', 'rgba(255,241,208,0.75)');

  // Cruceta
  const dpad = (key, on) => {
    const g = new Grid(62, 62);
    const f = 'rgba(29,21,51,0.55)';
    const b = 'rgba(255,241,208,0.75)';
    g.rrect(20, 0, 22, 62, 4, b);
    g.rrect(0, 20, 62, 22, 4, b);
    g.rrect(22, 2, 18, 58, 3, f);
    g.rrect(2, 22, 58, 18, 3, f);
    g.rect(22, 22, 18, 18, f);
    const arrow = 'rgba(255,241,208,0.9)';
    g.pattern(26, 7, ['...XX...', '..XXXX..', '.XXXXXX.'], { X: arrow });
    g.pattern(26, 49, ['.XXXXXX.', '..XXXX..', '...XX...'], { X: arrow });
    g.pattern(7, 26, ['..X', '.XX', 'XXX', 'XXX', '.XX', '..X'], { X: arrow });
    g.pattern(52, 26, ['X..', 'XX.', 'XXX', 'XXX', 'XX.', 'X..'], { X: arrow });
    if (on) {
      const hl = 'rgba(255,209,102,0.55)';
      if (on === 'up') g.rect(22, 2, 18, 18, hl);
      if (on === 'down') g.rect(22, 42, 18, 18, hl);
      if (on === 'left') g.rect(2, 22, 18, 18, hl);
      if (on === 'right') g.rect(42, 22, 18, 18, hl);
    }
    addTexture(scene, key, g);
  };
  dpad('dpad', null);
  for (const d of ['up', 'down', 'left', 'right']) dpad(`dpad_${d}`, d);

  // Luz radial para escenas oscuras
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 128;
  const ctx = cv.getContext('2d');
  const grd = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,220,160,1)');
  grd.addColorStop(0.5, 'rgba(255,190,120,0.45)');
  grd.addColorStop(1, 'rgba(255,190,120,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 128, 128);
  if (scene.textures.exists('light')) scene.textures.remove('light');
  scene.textures.addCanvas('light', cv);

  // Gradiente vertical genérico (para cielos)
  const sky = document.createElement('canvas');
  sky.width = 4;
  sky.height = 270;
  const sctx = sky.getContext('2d');
  const sg = sctx.createLinearGradient(0, 0, 0, 270);
  sg.addColorStop(0, '#2a1850');
  sg.addColorStop(0.45, '#c0508a');
  sg.addColorStop(0.75, '#ff9a5a');
  sg.addColorStop(1, '#ffd08a');
  sctx.fillStyle = sg;
  sctx.fillRect(0, 0, 4, 270);
  if (scene.textures.exists('skyGrad')) scene.textures.remove('skyGrad');
  scene.textures.addCanvas('skyGrad', sky);
}

export function panel(scene, x, y, w, h, key = 'panel') {
  const p = scene.add.nineslice(x, y, key, undefined, w, h, 4, 4, 4, 4);
  p.setOrigin(0, 0);
  return p;
}
