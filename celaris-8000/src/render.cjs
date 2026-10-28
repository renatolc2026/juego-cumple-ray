// Uso: node render.js <html> <outdir> <fps> [t1,t2,...]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [html, out, fpsArg, only] = process.argv.slice(2);
  const fps = +fpsArg;
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto('file://' + path.resolve(html) + '#render');
  await page.evaluate(() => document.fonts.ready);
  const dur = await page.evaluate(() => window.DURATION);
  const times = only ? only.split(',').map(Number) : [...Array(Math.round(dur * fps)).keys()].map(i => i / fps);
  for (let i = 0; i < times.length; i++) {
    await page.evaluate(t => window.render(t), times[i]);
    const name = only ? `t${times[i].toFixed(2)}.png` : `f${String(i).padStart(4, '0')}.png`;
    await page.screenshot({ path: path.join(out, name) });
  }
  await browser.close();
  console.log('frames', times.length);
})();
