// Teste rápido de fluidez: a fila de miniaturas não disputa novas tarefas com o gesto 3D.
// Nenhum detalhe do render ou dos modelos é alterado para passar este teste.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const threeRoot=path.resolve(path.dirname(require.resolve('three')),'..');
(async()=>{
  const browser=await chromium.launch({
    executablePath:'/usr/bin/chromium',headless:true,
    args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
  });
  try{
    const page=await browser.newPage({viewport:{width:1500,height:950}});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text())});
    await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',route=>route.fulfill({
      path:threeRoot+'/'+route.request().url().split('three@0.180.0/')[1],
      contentType:'application/javascript'
    }));
    // Mesmo alívio de GPU aplicado nos testes antigos; o código publicado permanece integral.
    await page.route('http://localhost:8000/',route=>route.fulfill({
      contentType:'text/html',
      body:fs.readFileSync(path.join(root,'index.html'),'utf8').replace('mapSize.set(4096,4096)','mapSize.set(1024,1024)')
    }));
    await page.goto('http://localhost:8000/');
    await page.waitForFunction(()=>window.__atelie?.editor?.previews && window.__atelie.group());
    await page.evaluate(()=>window.__atelie.stopAuto());
    const original=await page.evaluate(()=>JSON.stringify(window.__atelie.getLook()));
    const canvas=page.locator('#stage canvas');

    await canvas.dispatchEvent('pointerdown',{pointerId:10,pointerType:'mouse',button:0});
    assert.equal(await page.evaluate(()=>window.__atelie.editor.previews.stats().waitingForInteraction),true,'Arrastar não segurou a fila');

    // Trocar de categoria não pode ignorar a interação em andamento.
    assert(await page.evaluate(()=>window.__atelie.editor.select('body','type')));
    assert.equal(await page.evaluate(()=>window.__atelie.editor.previews.stats().waitingForInteraction),true,'Fila reiniciou durante o giro');

    await canvas.dispatchEvent('pointerup',{pointerId:10,pointerType:'mouse',button:0});
    assert.equal(await page.evaluate(()=>window.__atelie.editor.previews.stats().waitingForInteraction),false,'Fila não retomou após soltar');

    await canvas.dispatchEvent('wheel',{deltaY:100,deltaMode:0});
    assert.equal(await page.evaluate(()=>window.__atelie.editor.previews.stats().waitingForInteraction),true,'Zoom não segurou a fila');
    await page.waitForFunction(()=>!window.__atelie.editor.previews.stats().waitingForInteraction,{timeout:4000});

    await canvas.dispatchEvent('pointerdown',{pointerId:11,pointerType:'mouse',button:0});
    await canvas.dispatchEvent('pointercancel',{pointerId:11,pointerType:'mouse'});
    assert.equal(await page.evaluate(()=>window.__atelie.editor.previews.stats().waitingForInteraction),false,'Pointer cancel não liberou a fila');

    const navigation=await page.evaluate(()=>{
      const e=window.__atelie.editor,now=performance.now();
      for(const [cat,sub] of [['appearance','hair'],['clothes','sets'],['accessories','head'],['body','type']])e.select(cat,sub);
      return performance.now()-now;
    });
    assert(navigation<3000,'Navegação demorou demais: '+navigation.toFixed(1)+' ms');

    const cards=page.locator('#bodyBuilds .preview-frame img');
    await page.waitForFunction(()=>[...document.querySelectorAll('#bodyBuilds .preview-frame')].length===4 &&
      [...document.querySelectorAll('#bodyBuilds .preview-frame')].every(f=>f.dataset.ready==='true'),null,{timeout:240000});
    assert.equal(await cards.count(),4);
    await cards.first().evaluate(img=>img.decode());

    assert.equal(await page.evaluate(()=>JSON.stringify(window.__atelie.getLook())),original,'Interação com a interface mudou a skin');
    assert.deepEqual(errors,[],'Erros de navegador');
    console.log('OK: giro, zoom, cancelamento, retomada de fila, quatro prévias em qualidade original e visual preservado.');
    console.log('Tempo de navegação por quatro subcategorias: '+navigation.toFixed(1)+' ms');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
