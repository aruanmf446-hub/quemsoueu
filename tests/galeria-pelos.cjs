const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const manifest=JSON.parse(fs.readFileSync('revisao/pelos/manifest.json','utf8')),base='http://localhost:8000/revisao/pelos/';
 assert.equal(manifest.characters.length,34);assert.equal(manifest.assets.length,228);
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const asset of manifest.assets){const response=await page.request.get(base+asset);assert.equal(response.status(),200,asset);assert((await response.body()).length>1000,asset)}
  console.log('Arquivos conferidos:',manifest.assets.length);
  for(const width of [1280,390]){
   await page.setViewportSize({width,height:900});await page.goto(base);assert.equal(await page.locator('section').count(),34);
   for(const view of ['front','three','back']){
    await page.locator(`[data-choice="${view}"]`).click();assert.equal(await page.locator('.pair[data-view]:not([hidden])').count(),34);
    await page.locator('.pair[data-view]:not([hidden]) img').evaluateAll(async images=>{images.forEach(im=>im.loading='eager');await Promise.race([Promise.all(images.map(im=>im.decode())),new Promise((_,reject)=>setTimeout(()=>reject(Error('Tempo excedido ao decodificar imagens')),30000))])});
    assert(await page.locator('.pair[data-view]:not([hidden]) img').evaluateAll(images=>images.every(im=>im.naturalWidth===900)));console.log(width,view);
   }
   await page.locator('#search').fill('Nico');assert.equal(await page.locator('section:not([hidden])').count(),1);
   await page.locator('#search').fill('');assert.equal(await page.locator('section:not([hidden])').count(),34);
   await page.locator('summary').first().click();
   await page.locator('details[open] img').evaluateAll(async images=>{images.forEach(im=>im.loading='eager');await Promise.race([Promise.all(images.map(im=>im.decode())),new Promise((_,reject)=>setTimeout(()=>reject(Error('Tempo excedido ao decodificar imagens')),30000))])});
   assert.equal(await page.locator('details[open] img').count(),3);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Página transbordando');
  }
  assert.deepEqual(errors,[]);console.log('OK: 34 personagens, 228 imagens, três vistas, busca e celular.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
