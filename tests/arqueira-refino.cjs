// Integração da arqueira: slots, cache, cores, animações e GLB no mesmo editor.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=process.env.ATELIE_RENDERS||path.join(root,'renders/arqueira/validacao');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});try{
 const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[],three=path.resolve(path.dirname(require.resolve('three')),'..');page.setDefaultTimeout(180000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text())});
 await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',r=>r.fulfill({path:three+'/'+r.request().url().split('three@0.180.0/')[1],contentType:'application/javascript'}));
 await page.route('http://localhost:8000/',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(root+'/index.html','utf8').replace('mapSize.set(4096,4096)','mapSize.set(1024,1024)').replace('(function frame(){requestAnimationFrame(frame);','window.__render=function(){').replace('renderer.render(scene,camera)})();','renderer.render(scene,camera)};')}));
 await page.goto('http://localhost:8000/');await page.waitForFunction(()=>window.__atelie?.editor);await page.evaluate(async()=>{const a=window.__atelie;a.editor.previews.pause();a.stopAuto();await a.setPreset('forest_archer_f');a.stopMotion();a.orbit.enableDamping=false});
 await page.waitForFunction(()=>!document.getElementById('status').textContent.includes('…'));
 const report=await page.evaluate(async()=>{
  const a=window.__atelie,T=await import('three'),head=a.group(),body=a.body(),look=structuredClone(a.getLook()),times=[];
  if(look.outfit!=='forest_huntress'||look.hair!=='archer_braid')throw Error('Visual próprio não aplicado');
  for(const slot of ['upper','lower','feet','cape','belt','extras']){
   const initial=a.clothes().selection[slot];a.setPiece(slot,'none');const start=performance.now();a.setPiece(slot,initial);times.push(performance.now()-start);
   a.setPieceColors(slot,{trim:'#a58d5c'});if(a.group()!==head||a.body()!==body)throw Error('A peça remontou a identidade');
  }
  if(Math.max(...times)>500)throw Error('Troca em cache acima de 500 ms: '+JSON.stringify(times));await a.setLook(look);
  let vertices=0;a.clothes().group.traverse(m=>{if(m.isMesh){const g=m.geometry;for(const name of ['position','normal'])if(!g.attributes[name].array.every(Number.isFinite))throw Error('Geometria inválida: '+m.name);vertices+=g.attributes.position.count}});
  const motions=[];for(const id of Object.keys(a.motions)){await a.playMotion(id);a.pauseMotion();for(const t of [.5,1.5,2.5]){a.seekMotion(t);a.root().updateMatrixWorld(true);a.root().traverse(m=>{if(!m.isSkinnedMesh)return;m.skeleton.update();const count=m.geometry.attributes.position.count;for(let i=0;i<count;i+=Math.max(1,Math.floor(count/128))){const p=m.getVertexPosition(i,new T.Vector3());if(!p.toArray().every(Number.isFinite))throw Error('Pose inválida: '+id+'/'+m.name)}})}motions.push(id)}a.stopMotion();
  const buffer=await a.exportGLB(),v=new DataView(buffer);if(v.getUint32(0,true)!==0x46546c67)throw Error('GLB inválido');const json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,v.getUint32(12,true))));
  if(json.animations.length!==17)throw Error('Clipes faciais/corporais perdidos');if(json.animations.filter(c=>c.name.startsWith('Body_')).length!==5)throw Error('Movimentos corporais ausentes');
  if(!json.meshes.some(m=>m.primitives.some(p=>p.targets?.length===11)))throw Error('Blendshapes perdidos');
  for(const m of json.meshes)for(const p of m.primitives){const material=json.materials[p.material];if(material?.normalTexture?.texCoord===1&&p.attributes.TEXCOORD_1===undefined)throw Error('UV1 perdido')}
  return{id:'forest_archer_f',vertices,swapMaxMs:Math.max(...times),motions,MB:+(buffer.byteLength/1048576).toFixed(2),clips:json.animations.length};
 });
 // O Worker precisa carregar também os dois novos geradores, usando o visual salvo.
 await page.evaluate(()=>{const a=window.__atelie;a.editor.previews.paused=false;a.editor.select('expressions','ready')});
 await page.locator('#exprs [data-expr="feliz"] [data-ready="true"]').waitFor();await page.evaluate(()=>window.__atelie.editor.previews.pause());
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/relatorio.json',JSON.stringify({...report,worker:true,errors},null,2));console.log(JSON.stringify({...report,worker:true,errors}));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
