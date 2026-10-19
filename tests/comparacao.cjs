// Sirva o checkout caa45f5 em 8001 e a versão corrigida em 8000.
// Primeiro: ATELIE_REFERENCIA=1 node tests/comparacao.cjs; depois: node tests/comparacao.cjs.
const { chromium } = require('playwright');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const reference = process.env.ATELIE_REFERENCIA === '1';
const current = path.resolve(__dirname, '..');
const root = reference ? process.env.ATELIE_BASELINE || path.resolve(current, '../quemsoueu-baseline') : current;
const base = 'http://localhost:' + (reference ? 8001 : 8000);
const output = process.env.ATELIE_COMPARACOES || path.join(current, 'renders/comparacao');
const folder = path.join(output, reference ? 'caa45f5' : 'nova');
const three = path.resolve(path.dirname(require.resolve('three')), '..');
fs.mkdirSync(folder, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 960 } });
    const cameraFile=path.join(output,'caa45f5/cameras.json');
    const errors=[],cameras=fs.existsSync(cameraFile)?JSON.parse(fs.readFileSync(cameraFile)):{};
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text()) });
    await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**', route => route.fulfill({ path: path.join(three, route.request().url().split('three@0.180.0/')[1]), contentType: 'application/javascript' }));
    await page.route(base + '/', route => {
      const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
        .replace('mapSize.set(4096,4096)', 'mapSize.set(1024,1024)')
        .replace('(function frame(){requestAnimationFrame(frame);', 'window.__render=function(){')
        .replace('renderer.render(scene,camera)})();', 'renderer.render(scene,camera)};');
      return route.fulfill({ contentType: 'text/html', body: source });
    });
    await page.goto(base);
    await page.waitForFunction(() => window.__atelie, null, { timeout: 120000 });
    await page.evaluate(() => window.__atelie.stopAuto());
    await page.addStyleTag({ content: '.brand,.help{visibility:hidden}' });
    const ids = process.env.ATELIE_PERSONAGENS?.split(',') || await page.evaluate(async () => Object.keys((await import('/src/presets.js')).PRESETS));
    for (const id of ids) {
      await page.evaluate(id => window.__atelie.setPreset(id), id);
      await page.waitForFunction(id => window.__atelie.group().name === 'Head_V2_' + id || id === 'robot_ball', id, { timeout: 120000 });
      await page.waitForFunction(() => !document.getElementById('status').textContent.includes('…'), null, { timeout: 120000 });
      await page.locator('#bodyView').click();
      await page.evaluate(() => { window.__atelie.stopAuto(); window.__atelie.setPose({}) });
      for (const view of ['front', 'three']) {
        if (reference) {
          await page.evaluate(view => window.__atelie.aim(...window.__atelie.VIEWS[view]), view);
          // A câmera antiga cortava a nadadeira: afasta as duas versões igualmente.
          if(['feminine_soft','feminine_bold'].includes(id))await page.evaluate(()=>{const a=window.__atelie;a.camera.position.sub(a.orbit.target).multiplyScalar(1.15).add(a.orbit.target);a.orbit.update()});
          cameras[id + view] = await page.evaluate(() => ({ position: window.__atelie.camera.position.toArray(), target: window.__atelie.orbit.target.toArray() }));
        } else await page.evaluate(frame => {
          const a = window.__atelie;
          a.camera.position.fromArray(frame.position); a.orbit.target.fromArray(frame.target); a.orbit.update();
        }, cameras[id + view]);
        await page.evaluate(() => window.__render());
        await page.screenshot({ path: path.join(folder, id + '-' + view + '.png'), clip: { x: 0, y: 0, width: 764, height: 960 }, timeout: 120000 });
      }
      console.log(id);
      if (reference) fs.writeFileSync(path.join(folder, 'cameras.json'), JSON.stringify(cameras, null, 2));
    }
    fs.writeFileSync(path.join(folder, 'errors.json'), JSON.stringify(errors, null, 2));
    assert.deepEqual(errors, []);
  } finally { await browser.close() }
})().catch(e => { console.error(e); process.exit(1) });
