const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const manifest=JSON.parse(fs.readFileSync('revisao/acabamentos/manifest.json','utf8')),base='http://localhost:8000/revisao/acabamentos/';
 assert.equal(manifest.assets.length,102);assert.equal(manifest.characters.length,34);assert.equal(manifest.bodyCharacters.length,8);
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const asset of manifest.assets){const r=await page.request.get(base+asset);assert.equal(r.status(),200,asset);assert((await r.body()).length>1000,asset)}
  console.log('102 arquivos conferidos.');
  for(const width of [1280,390]){
   await page.setViewportSize({width,height:900});await page.goto(base);assert.equal(await page.locator('section').count(),34);
   await page.locator('summary').first().click();assert.equal(await page.locator('details[open] img').count(),6);
   await page.locator('details[open] img').evaluateAll(async images=>{images.forEach(im=>im.loading='eager');await Promise.race([Promise.all(images.map(im=>im.decode())),new Promise((_,reject)=>setTimeout(()=>reject(Error('Imagem não carregou')),20000))])});
   await page.locator('#search').fill('nico');assert.equal(await page.locator('section:not([hidden])').count(),1);
   await page.locator('#search').fill('arqueira');assert.equal(await page.locator('section:not([hidden])').count(),1);
   await page.locator('#search').fill('');assert.equal(await page.locator('section:not([hidden])').count(),34);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Transbordou no celular');
  }
  assert.deepEqual(errors,[]);console.log('OK: galeria completa, figurinos, busca, desktop e celular.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
