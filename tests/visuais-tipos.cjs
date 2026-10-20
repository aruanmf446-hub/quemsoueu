// Frente/perfil, quatro tipos físicos, com/sem roupa; valida identidade do rosto e GLB de cada tipo.
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),output=process.env.ATELIE_RENDERS||path.join(root,'renders','tipos-fisicos');
const threeRoot=path.resolve(path.dirname(require.resolve('three')),'..');
const builds={magro:{weight:-1,muscle:0},padrao:{weight:0,muscle:0},gordo:{weight:1,muscle:0},musculoso:{weight:0,muscle:1}};
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const previous=path.join(output,'relatorio.json');
 const reports=process.env.ATELIE_CONTINUAR==='1'&&fs.existsSync(previous)?JSON.parse(fs.readFileSync(previous)).reports:[],errors=[];
 try{
 const page=await browser.newPage({viewport:{width:1100,height:900}});page.setDefaultTimeout(120000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text())});
 await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',r=>r.fulfill({path:threeRoot+'/'+r.request().url().split('three@0.180.0/')[1],contentType:'application/javascript'}));
 await page.route('http://localhost:8000/',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'index.html'),'utf8').replace('mapSize.set(4096,4096)','mapSize.set(1024,1024)').replace('(function frame(){requestAnimationFrame(frame);','window.__render=function(){').replace('renderer.render(scene,camera)})();','renderer.render(scene,camera)};')}));
 await page.goto('http://localhost:8000');await page.waitForFunction(()=>window.__atelie);await page.addStyleTag({content:'.brand,.help,.status{visibility:hidden}'});
 const ready=()=>page.waitForFunction(()=>!document.getElementById('status').textContent.includes('…'));
 const ids=process.env.ATELIE_PERSONAGENS?.split(',')||await page.evaluate(async()=>Object.keys((await import('/src/presets.js')).PRESETS));
 for(const id of ids){
  await page.evaluate(id=>window.__atelie.setPreset(id),id);await ready();
  await page.evaluate(()=>{const a=window.__atelie;a.stopAuto();a.setPose({});window.__identity={head:a.group(),look:a.lookObj(),rig:a.group().getObjectByName('Bone_Head'),skin:a.group().getObjectByName('Head_Skin')?.geometry}});
  for(const [name,build]of Object.entries(builds).filter(([name])=>!process.env.ATELIE_TIPOS||process.env.ATELIE_TIPOS.split(',').includes(name))){
   if(process.env.ATELIE_PULAR_EXISTENTES==='1'&&reports.some(r=>r.id===id&&r.name===name)&&['com','sem'].every(c=>['front','side'].every(v=>fs.existsSync(path.join(output,`${id}-${name}-${c}-${v}.png`)))))continue;
   const report=await page.evaluate(async({id,name,build})=>{
    const a=window.__atelie,timing=await a.setLook({build}),b=a.body(),before=window.__identity;
    if(a.group()!==before.head||a.lookObj()!==before.look||a.group().getObjectByName('Bone_Head')!==before.rig||a.group().getObjectByName('Head_Skin')?.geometry!==before.skin)throw Error('Troca de build remontou cabeça, cabelo, acessórios ou rig');
    if(b&&JSON.stringify(b.build)!==JSON.stringify(build))throw Error('Build não aplicado');
    return {id,name,build,ms:+timing.toFixed(1),bodyMs:b?.timing||0,clothMs:a.clothes().timing};
   },{id,name,build});
   if(process.env.ATELIE_CAPTURAR!=='0')for(const dressed of [true,false]){
    await page.evaluate(dressed=>{window.__atelie.clothes().group.visible=dressed},dressed);
    for(const view of ['front','side']){
     await page.evaluate(view=>{const a=window.__atelie;a.aim(...a.VIEWS[view]);window.__render()},view);
     await page.locator('#stage canvas').screenshot({path:path.join(output,`${id}-${name}-${dressed?'com':'sem'}-${view}.png`)});
    }
   }
   await page.evaluate(()=>window.__atelie.clothes().group.visible=true);
   if(process.env.ATELIE_EXPORTAR!=='0')report.glb=await page.evaluate(async({id,build})=>{
    const a=window.__atelie,data=await a.exportGLB(),header=new DataView(data);
    if(header.getUint32(0,true)!==0x46546c67)throw Error('GLB inválido');
    const json=JSON.parse(new TextDecoder().decode(new Uint8Array(data,20,header.getUint32(12,true)))),nodes=json.nodes||[],body=nodes.find(n=>n.name==='Body');
    if(!nodes.some(n=>n.name==='Personagem_'+id))throw Error('Raiz ausente');
    if(id!=='robot_ball'){
     if(!body||JSON.stringify(body.extras?.build)!==JSON.stringify(build))throw Error('GLB exportou outro tipo físico');
     if(json.animations?.length!==12||!json.skins?.length||!nodes.some(n=>n.name==='Bone_Head'))throw Error('Rig ou clipes ausentes');
     if(!json.meshes.some(m=>m.primitives.some(p=>p.targets?.length===11)))throw Error('Blendshapes ausentes');
     const h=nodes.find(n=>n.name==='Head_V2_'+id);if(!(h.scale||[1,1,1]).every(s=>Math.abs(s-a.body().hs)<1e-6))throw Error('Proporção da cabeça alterada');
     const primitive=json.meshes[body.mesh].primitives[0],accessor=json.accessors[primitive.attributes.POSITION],p=a.body().geo.attributes.position;if(!p.array.every(Number.isFinite))throw Error('Coordenadas inválidas');
     // A densidade muda no GLB. A tampa do pescoço fica escondida dentro da cabeça; sua última linha de células pode variar mais que as extremidades visíveis.
     const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<p.count;i++)for(let k=0;k<3;k++){const v=p.array[i*3+k];min[k]=Math.min(min[k],v);max[k]=Math.max(max[k],v)}
     if(!accessor.min.every((v,k)=>Math.abs(v-min[k])<.08)||!accessor.max.every((v,k)=>Math.abs(v-max[k])<(k===1?.14:.08)))throw Error('Volume do GLB difere do visualizador: '+JSON.stringify({min,max,exportMin:accessor.min,exportMax:accessor.max}));
    }
    return {MB:+(data.byteLength/1048576).toFixed(2),animacoes:json.animations?.length||0};
   },{id,build});
   const oldIndex=reports.findIndex(r=>r.id===id&&r.name===name);if(oldIndex>=0)reports.splice(oldIndex,1);reports.push(report);fs.writeFileSync(path.join(output,'relatorio.json'),JSON.stringify({reports,errors},null,2));console.log(JSON.stringify(report));
  }
  if(id!=='robot_ball'){
   const warm=await page.evaluate(async()=>{const a=window.__atelie;await a.setBuild({weight:1,muscle:0});return a.setBuild({weight:1,muscle:0})});assert(warm<500,`${id}: cache de corpo/roupa lento (${warm})`);
  }
 }
 // Controles reais: botões, sliders, persistência por personagem e cores por slot.
 if(process.env.ATELIE_TESTAR_UI!=='0'){
 await page.evaluate(()=>window.__atelie.setPreset('cute_round'));await ready();
 for(const label of ['Magro','Padrão','Gordo','Musculoso']){await page.locator('#bodyBuilds button',{hasText:label}).click();await ready()}
 await page.locator('#bodyWeight').evaluate(input=>{input.value='.5';input.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.waitForFunction(()=>window.__atelie.body()?.build.weight===.5);await ready();
 await page.evaluate(()=>{const a=window.__atelie,body=a.body(),head=a.group();a.setPieceColors('upper',{fabric:'#246366'});if(a.body()!==body||a.group()!==head)throw Error('Cor reconstruiu o corpo')});
 const saved=await page.evaluate(()=>JSON.stringify(window.__atelie.getLook().build));
 await page.evaluate(()=>window.__atelie.setPreset('old_king'));await ready();await page.evaluate(()=>window.__atelie.setPreset('cute_round'));await ready();
 assert.equal(await page.evaluate(()=>JSON.stringify(window.__atelie.getLook().build)),saved);
 }
 assert.deepEqual(errors,[],'Erros no console');
 const cold=reports.filter(r=>r.id!=='robot_ball'&&r.name!=='padrao');
 const max=Math.max(0,...cold.map(r=>r.ms));console.log('Maior tempo de reconstrução:',max,'ms');
 fs.writeFileSync(path.join(output,'relatorio.json'),JSON.stringify({reports,errors,maxMs:max,tipoMedicao:process.env.ATELIE_COBRAR_TEMPO==='0'?'captura concorrente; consulte desempenho.json':'medição exclusiva'},null,2));
 if(process.env.ATELIE_COBRAR_TEMPO!=='0')assert(max<3000,`Reconstrução acima de 3 s: ${max} ms`);
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
