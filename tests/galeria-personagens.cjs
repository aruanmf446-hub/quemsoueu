const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const manifest=JSON.parse(fs.readFileSync('revisao/personagens/manifest.json','utf8'));
(async()=>{
 const base='http://localhost:8000/revisao/personagens/';
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const asset of manifest.assets){const r=await page.request.get(base+asset);assert.equal(r.status(),200,asset);assert((await r.body()).length>1000,asset)}
  for(const width of [1280,390]){
   await page.setViewportSize({width,height:900});await page.goto(base);
   assert.equal(await page.locator('section').count(),4);
   for(const view of Object.keys(manifest.views)){
    await page.locator(`[data-view="${view}"]`).click();
    await page.locator('img').evaluateAll(async images=>{images.forEach(im=>im.loading='eager');await Promise.race([Promise.all(images.map(im=>im.decode())),new Promise((_,reject)=>setTimeout(()=>reject(Error('Imagem não carregou')),15000))])});
    assert.equal(await page.locator('img').evaluateAll(images=>images.every(im=>im.naturalWidth===900&&im.naturalHeight===806)),true);
    assert.equal(await page.locator('img').evaluateAll((images,v)=>images.every(im=>im.src.endsWith('-'+v+'.webp')),view),true);
   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Comparação transbordou no celular');
  }
  assert.deepEqual(errors,[]);console.log(`OK: ${manifest.assets.length} imagens, quatro vistas, desktop e celular.`);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
