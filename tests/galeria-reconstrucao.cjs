// A comparação publicada precisa abrir, alternar a escultura e funcionar no celular.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out=process.env.ATELIE_RENDERS||'renders/reconstrucao';fs.mkdirSync(out,{recursive:true});
const expected=JSON.parse(fs.readFileSync('revisao/manifesto.json','utf8')),count=expected.ids.length;
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 const context=await browser.newContext({viewport:{width:1366,height:900}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:8000/revisao/');assert.equal(await page.locator('section').count(),count);
 const assets=await page.locator('img').evaluateAll(xs=>xs.flatMap(x=>[x.dataset.full,x.dataset.clay,x.dataset.profile].filter(Boolean)));assert.equal(new Set(assets).size,expected.images);
 for(let i=0;i<assets.length;i+=8)await Promise.all(assets.slice(i,i+8).map(async src=>assert((await context.request.get('http://localhost:8000/revisao/'+src)).ok(),src)));
 await page.locator('#search').fill('Nico');assert.equal(await page.locator('section:visible').count(),1);await page.locator('section:visible img').first().scrollIntoViewIfNeeded();
 await page.locator('section:visible img').evaluateAll(async xs=>{await Promise.all(xs.map(x=>x.decode()));if(xs.some(x=>x.naturalWidth!==900||x.naturalHeight!==Number(x.getAttribute('height'))))throw Error('Imagem ou proporção incorreta')});
 await page.locator('[data-mode="clay"]').click();await page.locator('section:visible img').evaluateAll(async xs=>{await Promise.all(xs.map(x=>x.decode()));if(xs.some(x=>!x.src.includes('-escultura.webp')))throw Error('Aba não mudou a captura')});
 if(expected.profiles){await page.locator('[data-mode="profile"]').click();await page.locator('section:visible img').evaluateAll(async xs=>{await Promise.all(xs.map(x=>x.decode()));if(xs.some(x=>!x.src.includes('-perfil.webp')))throw Error('Perfil não mudou a captura')})}
 await page.locator('#search').fill('guardia da lua');assert.equal(await page.locator('section:visible').count(),1);
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Galeria transborda no celular');
 await page.locator('#search').fill('');assert.equal(await page.locator('section:visible').count(),count);assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/galeria-verificacao.json',JSON.stringify({personagens:count,imagens:expected.images,abas:true,perfil:expected.profiles,busca:true,celular:true,errors},null,2));console.log(`Galeria: ${count} personagens, ${expected.images} imagens, abas, busca e celular válidos.`);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
