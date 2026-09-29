// Uso: node dev/play.mjs "<url>" "<outdir>" "wait:2000,shot:a,key:Space,hold:ArrowDown:600,..."
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const [,, url, out, script = 'wait:2000,shot:a', w = 960, h = 540] = process.argv;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning' || m.text().startsWith('LOG')) console.log('console:', m.type(), m.text()); });
p.on('pageerror', (e) => console.log('pageerror:', e.message, e.stack?.split('\n').slice(0,3).join(' | ')));
await p.goto(url);
for (const step of script.split(',')) {
  const [cmd, a, c] = step.split(':');
  if (cmd === 'wait') await p.waitForTimeout(+a);
  else if (cmd === 'shot') await p.screenshot({ path: `${out}/${a}.png` });
  else if (cmd === 'key') await p.keyboard.press(a);
  else if (cmd === 'hold') { await p.keyboard.down(a); await p.waitForTimeout(+c); await p.keyboard.up(a); }
  else if (cmd === 'spam') { for (let i = 0; i < +c; i++) { await p.keyboard.press(a); await p.waitForTimeout(250); } }
  else if (cmd === 'eval') console.log('eval:', JSON.stringify(await p.evaluate(decodeURIComponent(a))));
  else if (cmd === 'click') await p.mouse.click(+a, +c);
}
await b.close();
