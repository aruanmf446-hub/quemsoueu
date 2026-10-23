// Retratos comparáveis: mesma câmera antes/depois, rosto sem figurino e malha sem cores.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.ATELIE_SOURCE_ROOT||path.resolve(__dirname,'..'),base=process.env.ATELIE_BASE_URL||'http://localhost:8000/',out=process.env.ATELIE_RENDERS||path.join(root,'renders/identidades');
const fixed=process.env.ATELIE_CAMERAS?JSON.parse(fs.readFileSync(process.env.ATELIE_CAMERAS,'utf8')):{};
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 try{
  const context=await browser.newContext({viewport:{width:900,height:900}}),page=await context.newPage(),errors=[],cameras={};page.setDefaultTimeout(120000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text())});
  const three=path.resolve(path.dirname(require.resolve('three')),'..');
  await context.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',r=>r.fulfill({path:three+'/'+r.request().url().split('three@0.180.0/')[1],contentType:'application/javascript'}));
  await page.route(base,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(root+'/index.html','utf8').replace('mapSize.set(4096,4096)','mapSize.set(2048,2048)').replace('(function frame(){requestAnimationFrame(frame);','window.__render=function(){').replace('renderer.render(scene,camera)})();','renderer.render(scene,camera)};')}));
  await page.goto(base);await page.waitForFunction(()=>window.__atelie?.editor);
  await page.evaluate(()=>{const a=window.__atelie;a.stopAuto();a.editor.previews.pause();a.orbit.enableDamping=false});
  await page.addStyleTag({content:'#stage{position:fixed!important;inset:0!important;width:900px!important;height:900px!important;z-index:100}.brand,.help{display:none!important}'});
  await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
  const ids=process.env.ATELIE_PERSONAGENS?.split(',')||await page.evaluate(async()=>(await import('/src/presets.js')).PRESET_ORDER);
  for(const id of ids){
   await page.evaluate(id=>window.__atelie.setPreset(id),id);await page.waitForFunction(()=>!document.getElementById('status').textContent.includes('…'));
   await page.evaluate(()=>{const a=window.__atelie;a.setPose({});a.clothes().group.visible=false;if(a.body()?.mesh)a.body().mesh.visible=false;if(a.lookObj()?.group)a.lookObj().group.visible=false});
   const onlyPoses=process.env.ATELIE_SOMENTE_POSES==='1';
   if(onlyPoses)assert(fixed[id]?.three,'Captura de expressões requer câmera de referência');
   cameras[id]=onlyPoses?fixed[id]:{};
   const views=process.env.ATELIE_VIEWS?.split(',')||['front','three','side'];
   assert(views.includes('three'),'A comparação da escultura requer a vista three');
   assert(views.every(view=>['front','three','side'].includes(view)),'Vista de rosto desconhecida');
   for(const view of onlyPoses?[]:views){
    cameras[id][view]=await page.evaluate(async({id,view,saved})=>{
     const a=window.__atelie,THREE=await import('three'),{PRESETS}=await import('/src/presets.js'),p=PRESETS[id],head=a.group();head.updateWorldMatrix(true,true);
     let center,height;
     if(p.kind==='companion'){
      const box=new THREE.Box3().setFromObject(head.getObjectByName('Rosto'));center=box.getCenter(new THREE.Vector3());height=Math.max(box.max.y-box.min.y,box.max.x-box.min.x);
     }else{const bottom=p.kind==='robot'?-1:p.lathe?p.lathe.y[0]:p.loft.y[0],top=p.kind==='robot'?1:p.cran[0]+p.cran[3];center=head.localToWorld(new THREE.Vector3(0,(top+bottom)/2,p.cran?.[1]||0));height=(top-bottom)*head.scale.y}
     const distance=height/(2*Math.tan(THREE.MathUtils.degToRad(15)))*1.18+.7*head.scale.y,direction=view==='front'?new THREE.Vector3(0,0,1):view==='side'?new THREE.Vector3(1,0,0):new THREE.Vector3(.55,.08,1).normalize();
     a.orbit.target.copy(center);a.camera.position.copy(center).addScaledVector(direction,distance);
     if(saved){a.camera.position.fromArray(saved.position);a.orbit.target.fromArray(saved.target)}a.orbit.update();window.__render();return{position:a.camera.position.toArray(),target:a.orbit.target.toArray()};
    },{id,view,saved:fixed[id]?.[view]});
    await page.locator('#stage canvas').screenshot({path:path.join(out,id+'-'+view+'.png')});
   }
   await page.evaluate(camera=>{
    const a=window.__atelie;a.group().traverse(m=>{if(!m.isMesh)return;const materials=[m.material].flat().map(mat=>{if(/iris|cornea|sclera|olho|screen/i.test(mat.name))return mat;const copy=mat.clone();copy.color?.set('#b8b4af');copy.emissive?.set(0);copy.vertexColors=false;copy.map=null;copy.normalMap=null;copy.roughnessMap=null;copy.roughness=.7;copy.metalness=0;copy.clearcoat=0;copy.sheen=0;return copy});m.material=Array.isArray(m.material)?materials:materials[0]});
    a.camera.position.fromArray(camera.position);a.orbit.target.fromArray(camera.target);a.orbit.update();window.__render();
   },cameras[id].three);
   if(!onlyPoses)await page.locator('#stage canvas').screenshot({path:path.join(out,id+'-malha.png')});console.log(onlyPoses?'Expressões':'Retratos',id);
   for(const pose of process.env.ATELIE_POSES?.split(',').filter(Boolean)||[]){
    await page.evaluate(name=>{window.__atelie.setExpression(name);window.__render()},pose);
    await page.locator('#stage canvas').screenshot({path:path.join(out,id+'-pose-'+pose+'.png')});
   }
  }
  assert.deepEqual(errors,[]);const file=path.join(out,'cameras.json'),previous=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};fs.writeFileSync(file,JSON.stringify({...previous,...cameras},null,2));
  fs.writeFileSync(path.join(out,'relatorio.json'),JSON.stringify({ids:Object.keys({...previous,...cameras}),errors},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
