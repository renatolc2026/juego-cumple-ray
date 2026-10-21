// Renderiza los cuadros de scene.html con Chromium headless.
// Uso:
//   node render.cjs <dir_salida> [--workers 4] [--from 0] [--to 1200]
//   node render.cjs <dir_salida> --times 1.2,5.5,8.3   (fotogramas sueltos para revisar)
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');

const FPS = 60, TOTAL = 20 * FPS;
const args = process.argv.slice(2);
const outDir = path.resolve(args[0] || 'frames');
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const workers = +opt('--workers', 4);
const from = +opt('--from', 0), to = +opt('--to', TOTAL);
const times = opt('--times', null);

async function worker(frames, id) {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('console', m => console.log(`[w${id}]`, m.text()));
  page.on('pageerror', e => { console.error(`[w${id}] ERROR`, e.message); process.exitCode = 1; });
  await page.goto('file://' + path.join(__dirname, 'scene.html'));
  await page.evaluate(() => window.ready);
  const canvas = await page.$('#c');
  for (const { t, name } of frames) {
    await page.evaluate(tt => window.renderFrame(tt), t);
    await canvas.screenshot({ path: path.join(outDir, name), type: 'png' });
  }
  await browser.close();
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  let list;
  if (times) list = times.split(',').map(s => ({ t: +s, name: `t_${(+s).toFixed(3)}.png` }));
  else {
    list = [];
    for (let f = from; f < to; f++) list.push({ t: f / FPS, name: `f_${String(f).padStart(5, '0')}.png` });
  }
  const t0 = Date.now();
  // reparto intercalado para que todos los procesos terminen a la vez
  const chunks = Array.from({ length: workers }, (_, i) => list.filter((_, k) => k % workers === i));
  await Promise.all(chunks.map((c, i) => worker(c, i)));
  console.log(`${list.length} cuadros en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
})();
