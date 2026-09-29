// Prueba en "celular": pantalla táctil, horizontal
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const [,, url, out, script] = process.argv;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('pageerror:', e.message));
p.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text()); });
await p.goto(url);
const box = () => p.evaluate(() => { const c = document.querySelector('canvas').getBoundingClientRect(); return { x: c.x, y: c.y, s: c.width / 480 }; });
for (const step of script.split(',')) {
  const [cmd, a, c] = step.split(':');
  if (cmd === 'wait') await p.waitForTimeout(+a);
  else if (cmd === 'shot') await p.screenshot({ path: `${out}/${a}.png` });
  else if (cmd === 'tap') { const bx = await box(); await p.touchscreen.tap(bx.x + (+a) * bx.s, bx.y + (+c) * bx.s); }
}
await b.close();
