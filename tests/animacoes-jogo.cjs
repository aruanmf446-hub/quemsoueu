const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=process.env.ANIMATION_OUT||path.join(root,'renders/animacoes');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[],reports=[];page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text())});
 const three=path.resolve(path.dirname(require.resolve('three')),'..');await context.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',r=>r.fulfill({path:three+'/'+r.request().url().split('three@0.180.0/')[1],contentType:'application/javascript'}));
 await page.route('http://localhost:8000/',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(root+'/index.html','utf8').replace('mapSize.set(4096,4096)','mapSize.set(1024,1024)').replace('(function frame(){requestAnimationFrame(frame);','window.__render=function(){').replace('renderer.render(scene,camera)})();','renderer.render(scene,camera)};')}));
 await page.goto('http://localhost:8000/');await page.waitForFunction(()=>window.__atelie?.editor);await page.evaluate(()=>{window.__atelie.editor.previews.pause();window.__atelie.stopAuto();window.__atelie.editor.select('motions','shared')});
 await page.locator('[data-motion="dance_floss"]').click();assert.equal(await page.evaluate(()=>window.__atelie.bodyRig().state().active),'dance_floss');
 await page.locator('#motionPause').click();assert.equal(await page.evaluate(()=>window.__atelie.bodyRig().state().playing),false);
 await page.locator('#motionTime').fill('1.1');await page.locator('#motionTime').dispatchEvent('input');assert.equal(await page.evaluate(()=>window.__atelie.bodyRig().state().time),1.1);
 await page.locator('#motionSkeleton').check();await page.evaluate(()=>window.__render());await page.screenshot({path:path.join(out,'esqueleto-desktop.png')});
 await page.locator('#motionSkeleton').uncheck();
 for(const id of process.env.ANIMATION_IDS?.split(',')||['nico_inventor','nana_explorer','pepper_king','paysandu_wolf','ruby_raven','robot_ball','feminine_soft']){
  assert(await page.evaluate(id=>window.__atelie.setPreset(id),id));
  const report=await page.evaluate(async id=>{
   const a=window.__atelie,THREE=await import('three'),{GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
   await a.playMotion('dance_shuffle');a.bodyRig().pause();a.bodyRig().seek(.8);a.setPose({});window.__render();
   const state=a.bodyRig().state(),profiles=a.bodyRig().profile,liveTime=state.time;
   const data=await a.exportGLB(),view=new DataView(data),json=JSON.parse(new TextDecoder().decode(new Uint8Array(data,20,view.getUint32(12,true))));
   const names=(json.animations||[]).map(c=>c.name);for(const name of Object.keys(a.motions))if(!names.includes('Body_'+name))throw Error(id+': clipe ausente '+name);
   if(names.length!==(id==='robot_ball'?5:17))throw Error(id+': expressões perdidas');
   if(!json.nodes.some(n=>n.name==='Rig_Root'))throw Error(id+': raiz ausente');
   const bodies=json.meshes?.filter(m=>m.primitives.some(p=>p.attributes.JOINTS_0!==undefined))||[];if(id!=='robot_ball'&&!bodies.length)throw Error(id+': sem pesos no GLB');
   const loaded=await new GLTFLoader().parseAsync(data,'');loaded.scene.updateMatrixWorld(true);
   const samples=[];loaded.scene.traverse(m=>{if(m.isSkinnedMesh){m.skeleton.update();const i=Math.floor(m.geometry.attributes.position.count*.5);samples.push({m,i,p:m.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(m.matrixWorld)})}});
   const mixer=new THREE.AnimationMixer(loaded.scene),clip=loaded.animations.find(c=>c.name==='Body_dance_shuffle');mixer.clipAction(clip).play();mixer.setTime(.8);loaded.scene.updateMatrixWorld(true);let moved=0;for(const {m,i,p}of samples){m.skeleton.update();const v=m.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(m.matrixWorld);if(!v.toArray().every(Number.isFinite))throw Error(id+': deformação inválida após importar');if(v.distanceTo(p)>.002)moved++}if(id!=='robot_ball'&&!moved)throw Error(id+': GLB sem movimento');
   const node=loaded.scene.getObjectByName('Rig_Chest');if(!node||Math.abs(node.quaternion.x)<.00001)throw Error(id+': animação não aplicada ao importar');
   mixer.stopAllAction();mixer.uncacheRoot(loaded.scene);const geos=new Set(),materials=new Set(),textures=new Set();loaded.scene.traverse(m=>{if(m.isMesh){geos.add(m.geometry);for(const mat of Array.isArray(m.material)?m.material:[m.material])materials.add(mat)}});for(const m of materials){for(const v of Object.values(m))if(v?.isTexture)textures.add(v);m.dispose()}for(const g of geos)g.dispose();for(const t of textures)t.dispose();
   if(a.bodyRig().state().time!==liveTime)throw Error(id+': exportar alterou o player');return{id,profile:profiles,clips:names.length,skinnedMeshes:bodies.length,moved,MB:+(data.byteLength/1048576).toFixed(2)};
  },id);reports.push(report);console.log(JSON.stringify(report));assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'exportacao.json'),JSON.stringify({reports,errors},null,2));
  await page.locator('#stage canvas').screenshot({path:path.join(out,id+'-shuffle.png')});
 }
 // Edições durante a dança substituem o rig e não deixam malhas antigas no cenário.
 await page.evaluate(()=>window.__atelie.setPreset('nico_inventor'));await page.evaluate(()=>window.__atelie.playMotion('dance_floss'));
 await page.evaluate(()=>window.__atelie.setBuild({weight:-.5,muscle:.1}));
 await page.evaluate(()=>window.__atelie.setOutfit('lunar_inventor'));await page.evaluate(()=>window.__atelie.setPieceColors('upper',{fabric:'#324c78'}));
 assert.equal(await page.evaluate(()=>window.__atelie.root().getObjectsByProperty('name','Esqueleto_Corporal').length),1);
 await page.locator('#motionStop').click();assert.equal(await page.evaluate(()=>window.__atelie.bodyRig().state().active),null);
 await page.setViewportSize({width:390,height:900});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));await page.locator('[data-motion="victory"]').click();await page.locator('#motionPause').click();await page.evaluate(()=>{window.__atelie.bodyRig().seek(1.3);window.__atelie.setPose({});window.__render()});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(out,'celular.png'),fullPage:true});assert.deepEqual(errors,[]);
 console.log('OK: UI desktop/celular, pausa, tempo, esqueleto, edição e GLB reimportado.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
