// Teste de navegador: servidor local na porta 8000, Chromium e dependências three/playwright.
// Sombras de 1024 px e renderização sob demanda apenas para os testes via SwiftShader.
const {chromium}=require('playwright');
const fs=require('fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),output=process.env.ATELIE_RENDERS||path.join(root,'renders');
const threeRoot=path.resolve(path.dirname(require.resolve('three')),'..');
fs.mkdirSync(output,{recursive:true});
(async()=>{
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
try{
const page=await browser.newPage({viewport:{width:1000,height:760}}),errors=[],reports=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text())});
await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',async route=>route.fulfill({path:threeRoot+'/'+route.request().url().split('three@0.180.0/')[1],contentType:'application/javascript'}));
await page.route('http://localhost:8000/',route=>{let source=fs.readFileSync(path.join(root,'index.html'),'utf8');source=source.replace('mapSize.set(4096,4096)','mapSize.set(1024,1024)').replace('(function frame(){requestAnimationFrame(frame);','window.__render=function(){').replace('renderer.render(scene,camera)})();','renderer.render(scene,camera)};');route.fulfill({body:source,contentType:'text/html'})});
await page.goto('http://localhost:8000');await page.waitForFunction(()=>window.__atelie);await page.evaluate(()=>window.__atelie.stopAuto());await page.addStyleTag({content:'.brand,.help{visibility:hidden}'});console.log('Inicialização concluída');
const ids=process.env.ATELIE_PERSONAGENS?.split(',')||await page.evaluate(async()=>Object.keys((await import('/src/presets.js')).PRESETS));
for(const id of ids){
 await page.evaluate(id=>window.__atelie.setPreset(id),id);
 await page.waitForFunction(id=>window.__atelie.group().name==='Head_V2_'+id||id==='robot_ball'&&!document.getElementById('status').textContent.includes('…'),id,{timeout:120000});
 await page.waitForFunction(()=>!document.getElementById('status').textContent.includes('…'));
 await page.evaluate(()=>window.__atelie.setPose({}));
 for(const view of ['front','three']){
  await page.evaluate(view=>{window.__atelie.aim(...window.__atelie.VIEWS[view]);window.__render()},view);
  await page.screenshot({path:output+'/'+id+'-'+view+'.png',timeout:120000});
 }
 console.log('Renders',id);
 const report=await page.evaluate(async id=>{
  const a=window.__atelie,b=a.body(),expectedScale=b?b.hs:1;
  const data=await a.exportGLB(),header=new DataView(data);if(header.getUint32(0,true)!==0x46546c67)throw Error('Cabeçalho GLB inválido');
  const json=JSON.parse(new TextDecoder().decode(new Uint8Array(data,20,header.getUint32(12,true)))),nodes=json.nodes||[],has=n=>nodes.some(x=>x.name===n),head=nodes.find(x=>x.name==='Head_V2_'+id);
  if(!has('Personagem_'+id))throw Error('Raiz ausente');
  if(id!=='robot_ball'){
   if(!has('Body')||!has('Figurino')||!has('Bone_Head'))throw Error('Nó ausente');
   if((json.animations||[]).length!==12)throw Error('Clipes alterados');
   if(!head||!(head.scale||[1,1,1]).every(x=>Math.abs(x-expectedScale)<1e-6))throw Error('Escala da cabeça alterada');
   if(!json.skins?.length||!json.meshes.some(m=>m.primitives.some(p=>p.targets?.length===11)))throw Error('Rig ou blendshapes ausentes');
  }
  return {id,MB:+(data.byteLength/1048576).toFixed(2),animations:json.animations?.length||0,clothes:nodes.filter(x=>x.name?.startsWith('Roupa_')).length};
 },id);reports.push(report);console.log('GLB',JSON.stringify(report));
 if(id!=='robot_ball'){
  await page.evaluate(()=>{const a=window.__atelie,group=a.group(),body=a.body();a.setClothColors({fabric:'#246366'});if(a.group()!==group||a.body()!==body)throw Error('Cor remontou o personagem');a.setOutfit('none');if(a.clothes().group.children.length)throw Error('Roupa não removida');a.setExpression('feliz')});
  await page.evaluate(()=>{document.getElementById('reset').click()});await page.waitForFunction(()=>!document.getElementById('status').textContent.includes('…'));
 }
}
// Exercita o catálogo real, incluindo as reconstruções de cabelo, pele e barba.
await page.evaluate(()=>window.__atelie.setPreset('masculine_soft'));
await page.waitForFunction(()=>window.__atelie.group().name==='Head_V2_masculine_soft'&&!document.getElementById('status').textContent.includes('…'));
const ready=()=>page.waitForFunction(()=>!document.getElementById('status').textContent.includes('…'));
for(let i=0;i<await page.locator('#hairs button').count();i++){await page.locator('#hairs button').nth(i).click();await ready()}
await page.locator('#hairColors button').nth(2).click();await ready();
await page.locator('#skins button').nth(3).click();await ready();
await page.locator('#beards button').nth(1).click();await ready();
await page.locator('#accs .chips').first().locator('button').nth(2).click();await ready();
await page.locator('#accColors .sws').first().locator('button').nth(2).click();await ready();
for(let i=0;i<await page.locator('#outfits button').count();i++){await page.locator('#outfits button').nth(i).click();await ready()}
await page.locator('#clothColors .sws').first().locator('button').nth(3).click();await ready();
const saved=await page.evaluate(()=>JSON.stringify(window.__atelie.getLook()));
await page.evaluate(()=>window.__atelie.setPreset('cute_round'));await ready();
await page.evaluate(()=>window.__atelie.setPreset('masculine_soft'));await ready();
assert.equal(await page.evaluate(()=>JSON.stringify(window.__atelie.getLook())),saved);
await page.locator('#showBody').uncheck();await ready();
assert.equal(await page.evaluate(()=>window.__atelie.clothes().group.children.length),0);
await page.evaluate(async()=>{const buffer=await window.__atelie.exportGLB(),v=new DataView(buffer),j=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,v.getUint32(12,true))));if(j.nodes.some(n=>n.name==='Body'||n.name?.startsWith('Roupa_')))throw Error('Corpo oculto entrou no GLB')});
await page.locator('#showBody').check();await ready();
assert((await page.evaluate(()=>window.__atelie.clothes().group.children.length))>0);
console.log('Catálogo, cores, memória de visual e ocultar corpo: OK');
assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'reports.json'),JSON.stringify({errors,reports},null,2));console.log('OK: personagens, renders, rig, GLB e cores');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
