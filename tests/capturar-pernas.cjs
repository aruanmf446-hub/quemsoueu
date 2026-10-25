// Pose de diagnóstico: comparação da mesma câmera, com materiais neutros.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.LEG_BASE||root,out=process.env.LEG_OUT||root+'/renders/pernas/depois',size=600;
const ids=(process.env.LEG_IDS||'nico_inventor,nana_explorer,bread_vigilante,alchemist_villain').split(',');
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});try{
 const context=await browser.newContext({viewport:{width:size,height:size}}),page=await context.newPage();page.setDefaultTimeout(180000);page.on('pageerror',e=>{throw e});
 await context.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',r=>r.fulfill({path:root+'/node_modules/three/'+r.request().url().split('three@0.180.0/')[1],contentType:'application/javascript'}));
 await page.route('http://localhost:8000/',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(base+'/index.html','utf8').replace('renderer.shadowMap.enabled=true','renderer.shadowMap.enabled=false').replace('(function frame(){requestAnimationFrame(frame);','window.__render=function(){').replace('renderer.render(scene,camera)})();','renderer.render(scene,camera)};')}));
 await context.route('http://localhost:8000/src/**',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(base,new URL(r.request().url()).pathname))}));
 await page.goto('http://localhost:8000/');await page.waitForFunction(()=>window.__atelie?.editor);
 await page.addStyleTag({content:`#stage{position:fixed!important;inset:0!important;width:${size}px!important;height:${size}px!important;z-index:100}.brand,.help,.status,.stage-controls{display:none!important}`});
 await page.evaluate(()=>{const a=window.__atelie;a.stopAuto();a.editor.previews.pause();a.orbit.enableDamping=false;window.dispatchEvent(new Event('resize'))});
 const metadata={};
 for(const id of ids){await page.evaluate(id=>window.__atelie.setPreset(id),id);await page.evaluate(()=>window.__atelie.playMotion('victory'));
  const meta=await page.evaluate(async()=>{const T=await import('three'),a=window.__atelie,r=a.bodyRig();r.stop();const j=a.body().joints,leg=j.hip.distanceTo(j.knee)+j.knee.distanceTo(j.ankle),scene=a.root().parent;
   if(!scene.getObjectByName('Luz_Pernas')){const light=new T.HemisphereLight(0xffffff,0xbac7d9,2);light.name='Luz_Pernas';scene.add(light)}
   window.__originalMaterials=new Map();for(const m of r.meshes){window.__originalMaterials.set(m,m.material);m.material=new T.MeshLambertMaterial({color:'#caa88d',side:T.DoubleSide})}
   window.__legView={leg,hip:j.hip.toArray(),knee:j.knee.toArray(),ankle:j.ankle.toArray(),width:j.W};return window.__legView;
  });metadata[id]=meta;
  for(const pose of (process.env.LEG_POSES||'rest,lift,victory,defeat').split(','))for(const view of ['front','side'])for(const mode of ['clothes','body']){
   const png=await page.evaluate(async({pose,view,mode})=>{const T=await import('three'),a=window.__atelie,r=a.bodyRig(),v=window.__legView;r.stop();if(pose==='lift'){r.bones.UpperLeg_L.rotation.x=-.9;r.bones.LowerLeg_L.rotation.x=.9}else if(pose!=='rest'){r.play(pose);r.pause();r.seek(pose==='victory'?1.5:4.5)}a.root().updateMatrixWorld(true);r.skeleton.update();
    for(const m of r.meshes){m.visible=mode==='clothes'||!m.userData.slot;if(mode==='body')m.material=new T.MeshLambertMaterial({color:'#caa88d',side:T.DoubleSide})}
    const target=new T.Vector3(0,v.hip[1]-.38*v.leg,v.hip[2]),direction=new T.Vector3(view==='side'?1:.05,.03,view==='side'?.05:1).normalize(),distance=v.leg*1.25/Math.tan(T.MathUtils.degToRad(a.camera.fov/2));a.camera.position.copy(target).addScaledVector(direction,distance);a.orbit.target.copy(target);a.orbit.update();window.__render();return document.querySelector('#stage canvas').toDataURL('image/png').split(',')[1];
   },{pose,view,mode});fs.writeFileSync(path.join(out,`${id}-${pose}-${view}-${mode}.png`),Buffer.from(png,'base64'));
  }
  console.log('Capturado',id);
 }fs.writeFileSync(out+'/medidas.json',JSON.stringify(metadata,null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
