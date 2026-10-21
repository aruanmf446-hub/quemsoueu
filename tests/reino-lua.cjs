// Integração dos novos personagens: catálogo real, peças, cores, expressões, Worker e GLB.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=process.env.ATELIE_RENDERS||path.join(root,'renders','reino-lua'),three=path.resolve(path.dirname(require.resolve('three')),'..');fs.mkdirSync(out,{recursive:true});
const labels={paysandu_wolf:'Paysandu',nana_explorer:'Nana exploradora',moon_guardian:'Guardiã da Lua',nico_inventor:'Nico inventor',ruby_sorceress:'Feiticeira rubi',ruby_raven:'Corvo rubi'};
const ids=['paysandu_wolf','nana_explorer','moon_guardian','nico_inventor','ruby_sorceress','ruby_raven'];
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});try{
const context=await browser.newContext({viewport:{width:1280,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[],reports=[];page.setDefaultTimeout(120000);
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text())});
await context.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',r=>r.fulfill({path:three+'/'+r.request().url().split('three@0.180.0/')[1],contentType:'application/javascript'}));
await page.route('http://localhost:8000/',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'index.html'),'utf8').replace('mapSize.set(4096,4096)','mapSize.set(1024,1024)').replace('(function frame(){requestAnimationFrame(frame);','window.__render=function(){').replace('renderer.render(scene,camera)})();','renderer.render(scene,camera)};')}));
await page.goto('http://localhost:8000/');await page.waitForFunction(()=>window.__atelie?.editor);await page.evaluate(()=>{window.__atelie.stopAuto();window.__atelie.editor.previews.pause()});
const ready=()=>page.waitForFunction(()=>!document.getElementById('status').textContent.includes('…'));
for(const id of (process.env.ATELIE_PERSONAGENS?.split(',')||ids)){
  await page.evaluate(id=>window.__atelie.setPreset(id),id);await ready();
  const look=await page.evaluate(()=>structuredClone(window.__atelie.getLook()));
  for(const view of ['front','three','back','face']){
    await page.locator(view==='face'?'#faceView':'#bodyView').click();await ready();
    await page.evaluate(view=>{const a=window.__atelie;if(view==='back')a.aim(0,-.05,-7.4);else if(view!=='face')a.aim(...a.VIEWS[view]);window.__render()},view);
    await page.locator('#stage canvas').screenshot({path:path.join(out,id+'-'+view+'.png')});
  }
  await page.evaluate(()=>{const a=window.__atelie;a.setLook({hair:'none',acc:{},outfit:'none',pieces:{}})});await ready();
  await page.locator('#bodyView').click();await page.evaluate(()=>{window.__atelie.aim(...window.__atelie.VIEWS.three);window.__render()});
  await page.locator('#stage canvas').screenshot({path:path.join(out,id+'-malha.png')});
  await page.evaluate(look=>window.__atelie.setLook(look),look);await ready();
  const report=await page.evaluate(async id=>{
    const a=window.__atelie,companion=!a.body(),g=a.group();
    for(const name of ['feliz','triste','bravo','surpreso','piscadela'])a.setExpression(name);
    g.traverse(m=>{if(m.isMesh){if(!m.geometry.attributes.position.array.every(Number.isFinite))throw Error('Vértice inválido');if(!m.geometry.attributes.normal.array.every(Number.isFinite))throw Error('Normal inválida')}});
    if(['frontier_cowboy','cactus_soldier','cactus_soldier_large'].includes(id)){
      // Um lenço no pescoço não pode subir até os olhos quando aumenta o porte do corpo.
      const THREE=await import('three'),P=(await import('/src/presets.js')).PRESETS[id],b=a.body(),pv=b.pivot,hs=b.hs;
      const y=pv.y+hs*(P.eyeY-pv.y),z=pv.z+hs*(P.lathe.cz+P.lathe.r[2]*P.lathe.zs-pv.z);
      a.clothes().group.updateMatrixWorld(true);
      for(const side of [-1,1]){const ray=new THREE.Raycaster(new THREE.Vector3(side*P.eyeX*hs,y,z+3),new THREE.Vector3(0,0,-1),0,3);if(ray.intersectObject(a.clothes().group,true).length)throw Error('Roupa cobrindo o olho do cacto: '+id)}
    }
    if(id.startsWith('forest_guard_')){
      // A madeira do escudo precisa ficar à frente de toda a mão esquerda, inclusive dos dedos.
      const THREE=await import('three'),b=a.body(),J=b.joints,p=b.geo.attributes.position,wood=[];
      a.clothes().group.updateMatrixWorld(true);a.clothes().group.getObjectByName('RoupaSlot_extras').traverse(m=>{if(m.isMesh&&m.userData.channel==='leather')wood.push(m)});
      const ray=new THREE.Raycaster(),dir=new THREE.Vector3(0,0,1);let checked=0;
      for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i)+J.wrist.x)<.4*J.W&&Math.abs(p.getY(i)-J.wrist.y)<.5*J.W){
        ray.set(new THREE.Vector3(p.getX(i),p.getY(i),p.getZ(i)),dir);const hit=ray.intersectObjects(wood,false).find(h=>h.point.z>J.wrist.z+.4*J.W);
        if(!hit||hit.distance<=.001)throw Error('A mão atravessa o escudo: '+JSON.stringify({id,x:p.getX(i),y:p.getY(i),z:p.getZ(i),wrist:J.wrist,W:J.W,hit:hit?.distance,wood:wood.length}));checked++;
      }
      if(!checked)throw Error('A mão não foi amostrada no teste do escudo');
    }
    a.setExpression('neutro');
    if(!companion){const head=g,body=a.body(),times=[];for(const slot of ['upper','lower','feet','cape','belt','extras']){const initial=a.clothes().selection[slot];a.setPiece(slot,'none');const t=performance.now();a.setPiece(slot,initial);times.push(performance.now()-t);a.setPieceColors(slot,{trim:'#d4a640'});}if(a.group()!==head||a.body()!==body)throw Error('Troca de peça alterou a base');if(Math.max(...times)>500)throw Error('Cache acima de 500 ms');}
    const buffer=await a.exportGLB(),v=new DataView(buffer);if(v.getUint32(0,true)!==0x46546c67)throw Error('GLB inválido');const json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,v.getUint32(12,true))));
    if(!json.nodes.some(n=>n.name==='Personagem_'+id)||!json.nodes.some(n=>n.name==='Body')||!json.nodes.some(n=>n.name==='Bone_Head'))throw Error('Estrutura incompleta');
    if(id==='cowboy_on_fennec'&&(!json.nodes.some(n=>n.name==='Cowboy_Montado')||!json.animations.some(c=>c.channels.some(ch=>json.nodes[ch.target.node]?.name==='Cavaleiro_Bone_Jaw'))))throw Error('Montaria sem cavaleiro ou animação facial');
    if(json.animations.length!==12)throw Error('Clipes incompletos');if(!companion&&!json.meshes.some(m=>m.primitives.some(p=>p.targets?.length===11)))throw Error('Blendshapes não preservados');
    return{id,label:document.querySelector('.brand h1').textContent,MB:+(buffer.byteLength/1048576).toFixed(2),clips:json.animations.length,companion};
  },id);reports.push(report);console.log(report);
  // Exercita uma miniatura nova no Worker verdadeiro, com o visual padrão salvo.
  await page.evaluate(()=>{const a=window.__atelie;a.editor.previews.paused=false;a.editor.select('expressions','ready')});
  await page.locator('#exprs [data-expr="feliz"] [data-ready="true"]').waitFor();
  await page.evaluate(()=>window.__atelie.editor.previews.pause());
}
assert.deepEqual(errors,[]);
// Uma repetição filtrada atualiza só os personagens afetados, preservando as outras capturas verificadas.
if(process.env.ATELIE_PERSONAGENS&&fs.existsSync(path.join(out,'relatorio.json'))){const previous=JSON.parse(fs.readFileSync(path.join(out,'relatorio.json'),'utf8'));for(const old of previous.reports)if(!reports.some(r=>r.id===old.id))reports.push(old);reports.sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id))}
fs.writeFileSync(path.join(out,'relatorio.json'),JSON.stringify({reports,errors},null,2));
fs.writeFileSync(path.join(out,'index.html'),'<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ateliê — personagens procedurais</title><style>body{background:#101e2c;color:#eaf2f8;font:16px system-ui;margin:24px}section{margin:40px 0}.views{display:flex;flex-wrap:wrap;gap:12px}figure{margin:0;width:260px}img{width:100%;border-radius:12px}a{color:#35d6d4}</style><h1>'+(process.env.ATELIE_TITULO||'Reino da Lua')+' — versões procedurais</h1><p>Malha, rosto, corpo e acessórios separados. Capturas do próprio Ateliê.</p>'+reports.map(r=>'<section><h2>'+(labels[r.id]||r.label||r.id)+'</h2><div class="views">'+[['front','Frente'],['three','3/4'],['back','Costas'],['face','Rosto'],['malha','Base sem roupa e acessórios']].map(([key,label])=>'<figure><a href="'+r.id+'-'+key+'.png"><img loading="lazy" src="'+r.id+'-'+key+'.png"></a><figcaption>'+label+'</figcaption></figure>').join('')+'</div></section>').join(''));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
