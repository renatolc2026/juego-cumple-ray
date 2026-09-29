import { Grid, rng, shade, mix } from './pixel.js';
import { PAL } from './palette.js';

// Tiles de 16x16 para el suelo y las paredes. Se juntan en un solo tileset.
// El orden de esta lista define el índice de cada tile.
export const TILE_NAMES = [
  'void',
  'grass', 'grass2', 'grass3', 'path', 'sand', 'sidewalk',
  'wood', 'tile', 'rugRed', 'stone', 'carpet',
  'dance', 'dance2', 'cave', 'cave2', 'tower', 'tower2',
  'wallTop', 'wallHome', 'wallHomeWin',
  'wallChurchTop', 'wallChurch', 'wallChurchWin',
  'wallSalsaTop', 'wallSalsa', 'wallSalsaNeon',
  'caveTop', 'caveWall', 'caveWallGlyph',
  'towerTop', 'towerWall', 'towerWallWin',
  'hedge', 'water', 'fenceTop', 'dirt', 'stoneOut', 'woodDark', 'roofTop', 'wallHouseOut', 'wallHouseOutWin', 'doorOut',
];

export const TILE = Object.fromEntries(TILE_NAMES.map((n, i) => [n, i]));

function noise(g, base, cols, density, seed) {
  const r = rng(seed);
  g.rect(0, 0, 16, 16, base);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (r() < density) g.set(x, y, cols[Math.floor(r() * cols.length)]);
}

const T = {};

T.void = (g) => g.rect(0, 0, 16, 16, PAL.night);

T.grass = (g) => {
  noise(g, '#6cc251', ['#5fb247', '#7fd05f', '#58a843'], 0.18, 11);
  g.px([[3, 4], [3, 3], [10, 11], [10, 10], [12, 5]], '#4f9d3c');
};
T.grass2 = (g) => {
  T.grass(g);
  const r = rng(22);
  for (let i = 0; i < 4; i++) {
    const x = Math.floor(r() * 14) + 1;
    const y = Math.floor(r() * 12) + 3;
    g.set(x, y, '#3f8f36');
    g.set(x - 1, y - 1, '#3f8f36');
    g.set(x + 1, y - 1, '#3f8f36');
  }
};
T.grass3 = (g) => {
  T.grass(g);
  const flower = (x, y, c) => {
    g.px([[x, y - 1], [x - 1, y], [x + 1, y], [x, y + 1]], c);
    g.set(x, y, '#ffe066');
  };
  flower(4, 4, '#ff8fb1');
  flower(11, 9, '#ffffff');
  flower(6, 12, '#a77be0');
};
T.path = (g) => {
  noise(g, '#e8c88a', ['#dcb676', '#f2d49b', '#d4ab6a'], 0.22, 33);
  g.px([[4, 5], [11, 12], [8, 2]], '#c49a5e');
};
T.sand = (g) => {
  noise(g, '#f2d49b', ['#e8c88a', '#f8e2b4', '#e2bf82'], 0.2, 44);
};
T.dirt = (g) => {
  noise(g, '#c89a64', ['#b98c55', '#d4a870', '#a87a48'], 0.25, 45);
};
T.sidewalk = (g) => {
  g.rect(0, 0, 16, 16, '#d9d4cc');
  g.hline(0, 15, 16, '#b8b1a6');
  g.vline(15, 0, 16, '#b8b1a6');
  g.hline(0, 7, 16, '#c6c0b6');
  g.px([[3, 3], [11, 11], [6, 12]], '#c6c0b6');
};
T.stoneOut = (g) => {
  g.rect(0, 0, 16, 16, '#e3dccf');
  g.frame(0, 0, 8, 8, '#cfc6b6');
  g.frame(8, 8, 8, 8, '#cfc6b6');
  g.frame(8, 0, 8, 8, '#d8d0c2');
  g.frame(0, 8, 8, 8, '#d8d0c2');
};
T.wood = (g) => {
  g.rect(0, 0, 16, 16, '#c88a52');
  for (let y = 0; y < 16; y += 4) {
    g.hline(0, y + 3, 16, '#a86e3c');
    g.hline(0, y, 16, '#d49a62');
  }
  g.vline(5, 0, 4, '#a86e3c');
  g.vline(12, 4, 4, '#a86e3c');
  g.vline(3, 8, 4, '#a86e3c');
  g.vline(9, 12, 4, '#a86e3c');
  g.px([[8, 1], [2, 6], [13, 10], [6, 14]], '#b87a44');
};
T.woodDark = (g) => {
  T.wood(g);
  g.mapColors((c) => shade(c, -0.25));
};
T.tile = (g) => {
  g.rect(0, 0, 16, 16, '#f4ecdc');
  g.rect(0, 0, 8, 8, '#e3d6bd');
  g.rect(8, 8, 8, 8, '#e3d6bd');
  g.hline(0, 15, 16, '#cbbd9f');
  g.vline(15, 0, 16, '#cbbd9f');
};
T.rugRed = (g) => {
  g.rect(0, 0, 16, 16, '#c4485a');
  g.hline(0, 2, 16, '#e8b04a');
  g.hline(0, 13, 16, '#e8b04a');
  g.px([[4, 7], [5, 8], [11, 7], [12, 8]], '#e8b04a');
};
T.stone = (g) => {
  g.rect(0, 0, 16, 16, '#e9e1d0');
  g.hline(0, 7, 16, '#d6ccb6');
  g.hline(0, 15, 16, '#d6ccb6');
  g.vline(7, 0, 8, '#d6ccb6');
  g.vline(15, 8, 8, '#d6ccb6');
  g.px([[3, 3], [11, 11]], '#f4eee2');
};
T.carpet = (g) => {
  g.rect(0, 0, 16, 16, '#a3263a');
  g.vline(1, 0, 16, '#e8b04a');
  g.vline(14, 0, 16, '#e8b04a');
  g.px([[7, 4], [8, 4], [7, 12], [8, 12]], '#c8404f');
};
T.dance = (g) => {
  g.rect(0, 0, 16, 16, '#1e1236');
  g.rect(1, 1, 14, 14, '#4a2f7a');
  g.hline(1, 1, 14, '#6a4a9a');
  g.vline(1, 1, 14, '#6a4a9a');
  g.px([[3, 3], [4, 3], [3, 4]], '#8a6ac0');
};
T.dance2 = (g) => {
  g.rect(0, 0, 16, 16, '#1e1236');
  g.rect(1, 1, 14, 14, '#2e1d52');
  g.hline(1, 1, 14, '#3e2a6a');
  g.vline(1, 1, 14, '#3e2a6a');
};
T.cave = (g) => {
  noise(g, '#22363a', ['#284044', '#1c2e30', '#26393c'], 0.3, 55);
  g.px([[5, 5], [12, 11]], '#2c4442');
};
T.cave2 = (g) => {
  T.cave(g);
  g.hline(0, 8, 16, '#1c5a3a');
  g.px([[4, 8], [11, 8]], PAL.code);
};
T.tower = (g) => {
  g.rect(0, 0, 16, 16, '#b8bcc8');
  g.hline(0, 15, 16, '#9aa0b0');
  g.vline(15, 0, 16, '#9aa0b0');
  g.px([[4, 4], [10, 9], [6, 12]], '#c8ccd6');
};
T.tower2 = (g) => {
  g.rect(0, 0, 16, 16, '#8e94a8');
  g.frame(0, 0, 16, 16, '#7a8096');
  g.px([[3, 3], [12, 12]], '#a2a8ba');
};

// Paredes: "Top" es el borde visto desde arriba, las otras son la cara frontal
const wallTop = (g, c) => {
  g.rect(0, 0, 16, 16, c);
  g.hline(0, 15, 16, shade(c, -0.3));
  g.px([[3, 4], [11, 9]], shade(c, 0.12));
};
const wallFace = (g, base, trim, pattern) => {
  g.rect(0, 0, 16, 16, base);
  g.hline(0, 0, 16, shade(base, 0.15));
  if (pattern === 'bricks') {
    for (let y = 4; y < 13; y += 4) g.hline(0, y, 16, shade(base, -0.08));
    g.vline(5, 1, 3, shade(base, -0.08));
    g.vline(12, 5, 3, shade(base, -0.08));
    g.vline(3, 9, 3, shade(base, -0.08));
  }
  g.rect(0, 13, 16, 3, trim);
  g.hline(0, 13, 16, shade(trim, 0.2));
};
const windowOn = (g, frameC, glass) => {
  g.rect(3, 2, 10, 9, frameC);
  g.rect(4, 3, 8, 7, glass);
  g.vline(8, 3, 7, frameC);
  g.hline(4, 6, 8, frameC);
  g.px([[5, 4], [6, 4], [5, 5]], '#ffffff');
  g.hline(2, 11, 12, shade(frameC, -0.2));
};

T.wallTop = (g) => wallTop(g, '#7a5a48');
T.wallHome = (g) => {
  wallFace(g, '#f6e3c0', '#a86e3c');
  g.px([[4, 5], [11, 8]], '#efd6ac');
};
T.wallHomeWin = (g) => {
  T.wallHome(g);
  windowOn(g, '#8a5a3b', '#9fdcff');
};
T.wallChurchTop = (g) => wallTop(g, '#b3a58e');
T.wallChurch = (g) => wallFace(g, '#fbf7ee', '#c9b48a', 'bricks');
T.wallChurchWin = (g) => {
  T.wallChurch(g);
  // Vitral
  g.rect(5, 1, 6, 11, '#6b5a3a');
  g.rect(6, 3, 4, 8, '#3fb5e8');
  g.rect(6, 2, 4, 1, '#6b5a3a');
  g.px([[7, 2], [8, 2]], '#e8505b');
  g.rect(6, 5, 2, 2, '#ffd166');
  g.rect(8, 7, 2, 2, '#e8505b');
  g.rect(6, 9, 2, 2, '#6cc251');
};
T.wallSalsaTop = (g) => wallTop(g, '#2a1840');
T.wallSalsa = (g) => {
  wallFace(g, '#5a2a78', '#2a1840');
  g.px([[3, 4], [12, 7], [7, 10]], '#ffd166');
};
T.wallSalsaNeon = (g) => {
  wallFace(g, '#5a2a78', '#2a1840');
  g.rect(2, 3, 12, 7, '#3a1a50');
  g.frame(2, 3, 12, 7, '#ff5fa0');
  g.hline(4, 6, 8, '#6ff0ff');
};
T.caveTop = (g) => wallTop(g, '#0e1818');
T.caveWall = (g) => {
  noise(g, '#243a38', ['#1e3230', '#2c4644'], 0.3, 66);
  g.rect(0, 13, 16, 3, '#142222');
};
T.caveWallGlyph = (g) => {
  T.caveWall(g);
  // Código brillando en verde
  g.hline(2, 3, 5, PAL.code);
  g.hline(8, 3, 3, PAL.code2);
  g.hline(4, 6, 7, PAL.code2);
  g.hline(2, 9, 3, PAL.code);
  g.hline(6, 9, 6, PAL.code);
  g.set(1, 6, PAL.code);
};
T.towerTop = (g) => wallTop(g, '#4a5066');
T.towerWall = (g) => {
  wallFace(g, '#9aa0b4', '#5a6078');
  g.vline(7, 0, 13, '#8a90a4');
};
T.towerWallWin = (g) => {
  wallFace(g, '#9aa0b4', '#5a6078');
  g.rect(2, 1, 12, 11, '#5a6078');
  g.rect(3, 2, 10, 9, '#c8d2e0');
  g.rect(3, 7, 10, 4, '#aab4c6');
  g.px([[4, 3], [5, 3], [4, 4]], '#ffffff');
};
T.hedge = (g) => {
  g.rect(0, 0, 16, 16, '#3f9a3e');
  const r = rng(77);
  for (let i = 0; i < 26; i++) g.set(Math.floor(r() * 16), Math.floor(r() * 16), r() < 0.5 ? '#2f7f33' : '#5fb247');
  g.hline(0, 15, 16, '#256a2c');
};
T.water = (g) => {
  g.rect(0, 0, 16, 16, '#4fb2e8');
  g.hline(2, 4, 4, '#9fdcff');
  g.hline(9, 10, 5, '#9fdcff');
  g.hline(5, 13, 3, '#7ccaf2');
};
T.fenceTop = (g) => {
  T.grass(g);
  g.hline(0, 6, 16, '#8a5a3b');
  g.hline(0, 10, 16, '#8a5a3b');
  g.vline(3, 3, 11, '#a86e3c');
  g.vline(11, 3, 11, '#a86e3c');
};
T.roofTop = (g) => {
  g.rect(0, 0, 16, 16, '#c4583c');
  for (let y = 0; y < 16; y += 4) g.hline(0, y + 3, 16, '#a4452e');
  for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < 16; x += 8) g.vline(x, y, 3, '#a4452e');
};
T.wallHouseOut = (g) => {
  wallFace(g, '#f2c46b', '#b98c55');
  g.px([[4, 4], [12, 9]], '#e8b85e');
};
T.wallHouseOutWin = (g) => {
  T.wallHouseOut(g);
  windowOn(g, '#ffffff', '#8fd3ff');
  g.rect(1, 2, 2, 9, '#3fa08a');
  g.rect(13, 2, 2, 9, '#3fa08a');
};
T.doorOut = (g) => {
  T.wallHouseOut(g);
  g.rect(3, 1, 10, 15, '#7a4a2e');
  g.rect(4, 2, 8, 14, '#9a623c');
  g.vline(8, 2, 14, '#7a4a2e');
  g.set(10, 9, '#ffd166');
};

export const SOLID_TILES = new Set([
  'void', 'wallTop', 'wallHome', 'wallHomeWin', 'wallChurchTop', 'wallChurch', 'wallChurchWin',
  'wallSalsaTop', 'wallSalsa', 'wallSalsaNeon', 'caveTop', 'caveWall', 'caveWallGlyph',
  'towerTop', 'towerWall', 'towerWallWin', 'hedge', 'water', 'fenceTop', 'roofTop', 'wallHouseOut', 'wallHouseOutWin',
]);

export function buildTileset(scene) {
  const sheet = new Grid(16 * TILE_NAMES.length, 16);
  TILE_NAMES.forEach((name, i) => {
    const g = new Grid(16, 16);
    (T[name] || T.void)(g);
    sheet.blit(g, i * 16, 0);
  });
  if (scene.textures.exists('tileset')) scene.textures.remove('tileset');
  scene.textures.addCanvas('tileset', sheet.toCanvas());
}

export { mix };
