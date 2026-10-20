// Navegação real e prévias locais: nenhuma opção é aplicada só para gerar sua miniatura.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=process.env.ATELIE_RENDERS||path.join(root,'renders','menu');
const threeRoot=path.resolve(path.dirname(require.resolve('three')),'..');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 try{
  const context=await browser.newContext({viewport:{width:1500,height:1000}}),page=await context.newPage(),errors=[],warnings=[],reports=[];
  page.setDefaultTimeout(120000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text());if(m.type()==='warning'&&/prévia/i.test(m.text()))warnings.push(m.text())});
  await context.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',r=>r.fulfill({path:threeRoot+'/'+r.request().url().split('three@0.180.0/')[1],contentType:'application/javascript'}));
  await page.route('http://localhost:8000/',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'index.html'),'utf8').replace('mapSize.set(4096,4096)','mapSize.set(1024,1024)').replace('(function frame(){requestAnimationFrame(frame);','window.__render=function(){').replace('renderer.render(scene,camera)})();','renderer.render(scene,camera)};')}));
  await page.goto('http://localhost:8000/');await page.waitForFunction(()=>window.__atelie?.editor);
  const ready=()=>page.waitForFunction(()=>!document.getElementById('status').textContent.includes('…'));
  const select=async(cat,sub)=>{assert(await page.evaluate(([cat,sub])=>window.__atelie.editor.select(cat,sub),[cat,sub]));await page.evaluate(()=>window.__render())};
  const snapshot=()=>page.evaluate(()=>{const a=window.__atelie;window.__preserved={head:a.group(),body:a.body(),look:a.lookObj(),clothes:a.clothes(),rig:a.group().getObjectByName('Bone_Head')};return JSON.stringify(a.getLook())});
  const checkPreserved=async saved=>{assert.equal(await page.evaluate(()=>{const a=window.__atelie,p=window.__preserved;if(p.head!==a.group()||p.body!==a.body()||p.look!==a.lookObj()||p.clothes!==a.clothes()||p.rig!==a.group().getObjectByName('Bone_Head'))throw Error('Prévia mudou a cena principal');return JSON.stringify(a.getLook())}),saved)};
  const fillCards=async()=>{
   const cards=page.locator('.sidebar button[data-preview]:visible');const count=await cards.count();
   for(let i=0;i<count;i++){
    const card=cards.nth(i);await card.scrollIntoViewIfNeeded();
    await card.locator('.preview-frame[data-ready="true"] img').waitFor({state:'visible'});
    await card.locator('img').evaluate(img=>img.decode());
   }
   await page.locator('.sidebar').evaluate(n=>n.scrollTop=0);return count;
  };
  const save=async name=>{await page.evaluate(()=>window.__render());await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,name+'.png'),fullPage:(await page.viewportSize()).width<760})};
  const sections=await page.evaluate(()=>window.__atelie.editor.sections());
  for(const [cat,subs]of Object.entries(sections))for(const sub of subs){
   await select(cat,sub);const before=await snapshot();const count=await fillCards();await checkPreserved(before);
   const name=cat+'-'+sub.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]/g,'-').toLowerCase();
   await save(name);reports.push({category:cat,sub,previews:count,image:name+'.png'});console.log('Prévia',cat,sub,count);
  }
  // Quatro opções simultâneas e sem hover; selecionar uma não invalida as demais miniaturas.
  await select('body','type');await fillCards();
  const urls=await page.locator('#bodyBuilds img').evaluateAll(imgs=>imgs.map(i=>i.src));
  for(const label of ['Magro','Padrão','Gordo','Musculoso']){
   await page.locator('#bodyBuilds button').filter({hasText:label}).click();await ready();await fillCards();
   assert.deepEqual(await page.locator('#bodyBuilds img').evaluateAll(imgs=>imgs.map(i=>i.src)),urls);
   assert.equal(await page.locator('#bodyBuilds button[aria-pressed="true"]').count(),1);
  }
  await select('body','fine');await page.locator('#bodyWeight').evaluate(n=>{n.value='.4';n.dispatchEvent(new Event('input',{bubbles:true}))});await page.waitForFunction(()=>window.__atelie.body().build.weight===.4);await ready();
  // A cor permanece ao vivo, dentro da peça, sem reconstruir a cabeça nem o corpo.
  await select('clothes','upper');await page.locator('.piece-colors summary').click();
  const beforeColor=await snapshot();await page.locator('#clothColors .sws').first().locator('button').nth(3).click();
  assert.equal(await page.evaluate(()=>window.__atelie.body()===window.__preserved.body&&window.__atelie.group()===window.__preserved.head),true);assert.notEqual(await page.evaluate(()=>JSON.stringify(window.__atelie.getLook())),beforeColor);
  await select('expressions','eyes');await page.locator('#p_lookX').evaluate(n=>{n.value='.5';n.dispatchEvent(new Event('input',{bubbles:true}))});assert.equal(await page.locator('#p_lookX-value').textContent(),'0.50');
  await select('expressions','ready');await page.locator('[data-expr="feliz"]').click();assert.equal(await page.locator('[data-expr="feliz"]').getAttribute('aria-pressed'),'true');
  // Trocar personagem atualiza todas as prévias de opções; miniaturas não trocam a skin sozinhas.
  await page.evaluate(()=>window.__atelie.setPreset('masculine_soft'));await ready();await select('body','type');await fillCards();await save('corpo-masculino');
  for(const id of ['cute_round','orc_warrior','cactus_cowboy']){await page.evaluate(id=>window.__atelie.setPreset(id),id);await ready();await select('body','type');await fillCards();await save('corpo-'+id)}
  await page.evaluate(()=>window.__atelie.setPreset('robot_ball'));await ready();await select('body','type');assert(await page.locator('.catalog-unavailable').isVisible());await select('expressions','ready');await fillCards();await save('robo-expressoes');
  // Persistência do cache: a volta à mesma seleção deve exibir imagens sem novo worker.
  await page.evaluate(()=>window.__atelie.setPreset('feminine_soft'));await ready();await select('appearance','hair');await fillCards();
  await page.reload();await page.waitForFunction(()=>window.__atelie?.editor);await select('appearance','hair');await fillCards();
  assert.equal(await page.evaluate(()=>window.__atelie.editor.previews.stats().failed),false);
  const cached=await page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('atelie-previas',1);r.onsuccess=()=>{const count=r.result.transaction('imagens').objectStore('imagens').count();count.onsuccess=()=>resolve(count.result)}}));assert(cached>50);
  // Mobile: mantém as categorias e não cria rolagem horizontal da página.
  await page.setViewportSize({width:390,height:844});await select('body','type');await fillCards();await save('mobile-corpo');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  // GLB com a interface nova: mesmos nós e 12 clipes faciais.
  const glb=await page.evaluate(async()=>{const data=await window.__atelie.exportGLB(),v=new DataView(data);if(v.getUint32(0,true)!==0x46546c67)throw Error('GLB inválido');const json=JSON.parse(new TextDecoder().decode(new Uint8Array(data,20,v.getUint32(12,true))));return {MB:data.byteLength/1048576,animations:json.animations?.length,nodes:json.nodes.map(n=>n.name)}});
  assert.equal(glb.animations,12);assert(glb.nodes.includes('Body'));assert(glb.nodes.includes('Bone_Head'));
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[]);
  fs.writeFileSync(path.join(out,'relatorio.json'),JSON.stringify({reports,errors,warnings,cached,glb},null,2));
  const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  fs.writeFileSync(path.join(out,'index.html'),'<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Menu do Ateliê</title><style>body{background:#0c1a28;color:#e8f0f7;font:16px system-ui;margin:24px}img{max-width:100%;border-radius:12px}section{margin:40px 0}a{color:#39e4df}</style><h1>Ateliê — categorias e prévias reais</h1><p>Cada imagem mostra a tela com as opções visíveis antes de aplicar.</p>'+reports.map(r=>'<section><h2>'+escape(r.category+' / '+r.sub)+'</h2><a href="'+escape(r.image)+'"><img loading="lazy" src="'+escape(r.image)+'"></a></section>').join('')+'</html>');
  console.log('OK:',reports.length,'telas;',reports.reduce((n,r)=>n+r.previews,0),'prévias;',cached,'imagens em cache; GLB',glb.animations,'clipes');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
