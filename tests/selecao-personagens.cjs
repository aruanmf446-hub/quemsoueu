// Exercita os cartões reais com o Worker ativo, incluindo trocas rápidas e falha de montagem.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),three=path.resolve(path.dirname(require.resolve('three')),'..');
const out=process.env.ATELIE_RENDERS||path.join(root,'renders','selecao-personagens');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 try{
  const context=await browser.newContext({viewport:{width:1450,height:1000},deviceScaleFactor:Number(process.env.ATELIE_PREVIEW_DPR)||1}),page=await context.newPage(),errors=[],warnings=[],reports=[];page.setDefaultTimeout(120000);
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon')&&!m.text().includes('falha controlada de montagem'))errors.push(m.text());if(m.type()==='warning'&&m.text().startsWith('Prévia'))warnings.push(m.text())});
  await context.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',r=>r.fulfill({path:three+'/'+r.request().url().split('three@0.180.0/')[1],contentType:'application/javascript'}));
  let html=fs.readFileSync(process.env.ATELIE_HTML||path.join(root,'index.html'),'utf8')
   .replace('mapSize.set(4096,4096)','mapSize.set(1024,1024)')
   .replace('(function frame(){requestAnimationFrame(frame);','window.__render=function(){')
   .replace('renderer.render(scene,camera)})();','renderer.render(scene,camera)};')
   .replace("import {buildHead,BEARD_STYLES} from './src/head.js';",`import {buildHead as buildHeadOriginal,BEARD_STYLES} from './src/head.js';
function buildHead(...args){window.__headBuildCount=(window.__headBuildCount||0)+1;if(window.__failBuild)throw Error('falha controlada de montagem');return buildHeadOriginal(...args)}`);
  await page.route('http://localhost:8000/',r=>r.fulfill({contentType:'text/html',body:html}));
  await page.goto('http://localhost:8000/');await page.waitForFunction(()=>window.__atelie?.editor);await page.evaluate(()=>window.__atelie.stopAuto());
  const ready=()=>page.waitForFunction(()=>!document.getElementById('status').textContent.includes('…'));
  const preserveScene=()=>page.evaluate(()=>{const a=window.__atelie;window.__previewScene={head:a.group(),body:a.body(),look:a.lookObj(),clothes:a.clothes(),saved:JSON.stringify(a.getLook())}});
  const fidelity=async button=>{
   const result=await button.evaluate(button=>{
    const a=window.__atelie,p=window.__previewScene,request=button._preview.request,img=button.querySelector('img'),box=button.querySelector('.preview-frame').getBoundingClientRect();
    if(p&&(p.head!==a.group()||p.body!==a.body()||p.look!==a.lookObj()||p.clothes!==a.clothes()||p.saved!==JSON.stringify(a.getLook())))throw Error('Prévia mudou a cena principal');
    return{request:request.look,saved:a.savedLook(button.dataset.preset),width:img.naturalWidth,height:img.naturalHeight,size:request.imageSize,aspect:box.width/box.height};
   });
   assert.deepEqual(result.request,result.saved,'Cartão herdou o visual do personagem ativo');
   assert.equal(result.width,result.size.width);assert.equal(result.height,result.size.height);
   assert(result.width>=320,'Raster fixo de 240 px ainda perde detalhes em cartões grandes');
   assert(Math.abs(result.width/result.height-result.aspect)<.005,'Imagem e cartão têm proporções diferentes');
   return{width:result.width,height:result.height};
  };
  // Quatro cliques no mesmo quadro devem montar somente a última escolha.
  const rapid=await page.evaluate(async()=>{
   const count=window.__headBuildCount;
   for(const id of ['feminine_soft','masculine_soft','old_king','cute_round'])document.querySelector(`[data-preset="${id}"]`).click();
   const held=window.__atelie.editor.previews.holds.has('montagem');
   await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
   return{builds:window.__headBuildCount-count,held,active:document.querySelector('[data-preset].active')?.dataset.preset};
  });
  console.log('Troca rápida:',rapid);assert.equal(rapid.active,'cute_round');assert.equal(rapid.builds,1,'Cliques antigos ainda montam personagens desnecessários');assert(rapid.held,'Montagem não segurou as novas prévias');
  if(process.env.ATELIE_SOMENTE_TROCAS_RAPIDAS)return;
  // A falha é injetada apenas no HTML do teste, sem controles artificiais na aplicação.
  await page.evaluate(()=>{const a=window.__atelie;window.__previousHead=a.group();window.__previousLook=a.lookObj();window.__previousDisposed=false;a.group().getObjectByName('Head_Skin').geometry.addEventListener('dispose',()=>window.__previousDisposed=true);window.__failBuild=true;document.querySelector('[data-preset="old_king"]').click()});
  await ready();
  assert.deepEqual(await page.evaluate(()=>({head:window.__atelie.group()===window.__previousHead,look:window.__atelie.lookObj()===window.__previousLook,disposed:window.__previousDisposed,active:document.querySelector('[data-preset].active')?.dataset.preset,busy:document.getElementById('stage').getAttribute('aria-busy')})),{head:true,look:true,disposed:false,active:'cute_round',busy:'false'});
  await page.evaluate(()=>{window.__failBuild=false;document.querySelector('[data-preset="old_king"]').click()});await ready();assert.equal(await page.locator('[data-preset].active').getAttribute('data-preset'),'old_king');
  const ids=await page.evaluate(()=>[...document.querySelectorAll('[data-preset]')].map(b=>({id:b.dataset.preset,family:b.dataset.family})));
  for(const {id,family}of ids){
   const start=Date.now();
   await page.locator('[data-category="character"]').click();await page.locator(`[data-section="${family}"]`).click();
   const button=page.locator(`[data-preset="${id}"]`);await button.scrollIntoViewIfNeeded();
   await preserveScene();
   // Uma prévia ausente não pode passar como personagem funcional.
   await button.locator('[data-ready="true"] img').waitFor();
   await button.locator('img').evaluate(img=>img.decode());
   const preview=await fidelity(button);
   await button.click();await ready();
   const report=await page.evaluate(id=>{
    const a=window.__atelie,g=a.group();window.__render();let meshes=0;
    g.traverse(m=>{if(m.isMesh){meshes++;if(!m.geometry.attributes.position.array.every(Number.isFinite))throw Error('Malha inválida: '+id)}});
    return{id,active:document.querySelector('[data-preset].active')?.dataset.preset,name:g.name,kind:a.assetKind(),meshes,previews:a.editor.previews.stats()};
   },id);
   assert.equal(report.active,id);assert.equal(report.kind,['forest_archer_f','nana_explorer'].includes(id)?'glb':'procedural');assert.equal(report.name,report.kind==='glb'?'Modelo_Importado':'Head_V2_'+id);assert(report.meshes>0);assert.equal(report.previews.failed,false);
   report.ms=Date.now()-start;report.preview=preview;reports.push(report);console.log('OK',id,report.ms+'ms',JSON.stringify(preview));
   fs.writeFileSync(path.join(out,'parcial.json'),JSON.stringify({reports,rapid,errors,warnings},null,2));
  }
  assert.equal(reports.length,34);assert.deepEqual(errors,[]);assert.deepEqual(warnings,[]);
  // Em tela estreita também se alcançam as quatro famílias pelos controles visíveis.
  await page.setViewportSize({width:390,height:844});const mobilePreviews=[];
  for(const family of [...new Set(ids.map(p=>p.family))]){
   await page.locator('[data-category="character"]').click();await page.locator(`[data-section="${family}"]`).click();
   const id=ids.find(p=>p.family===family).id,button=page.locator(`[data-preset="${id}"]`);await button.scrollIntoViewIfNeeded();await preserveScene();await button.locator('[data-ready="true"] img').waitFor();await button.locator('img').evaluate(img=>img.decode());
   const preview=await fidelity(button);assert.equal(preview.width,preview.height,'Cartão quadrado do celular foi renderizado em 5:6');mobilePreviews.push({id,...preview});
   await button.click();await ready();assert.equal(await page.locator('[data-preset].active').getAttribute('data-preset'),id);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[]);
  await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});
  fs.writeFileSync(path.join(out,'relatorio.json'),JSON.stringify({reports,rapid,recovery:true,mobileFamilies:4,mobilePreviews,errors,warnings},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
