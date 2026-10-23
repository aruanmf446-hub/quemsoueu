// Mesma câmera e luz antes/depois; visual salvo, cabelos, barbas e acessórios reais.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.ATELIE_SOURCE_ROOT||path.resolve(__dirname,'..'),base=process.env.ATELIE_BASE_URL||'http://localhost:8000/',out=process.env.ATELIE_RENDERS||path.resolve(__dirname,'../renders/pelos/depois'),fixed=process.env.ATELIE_CAMERAS?JSON.parse(fs.readFileSync(process.env.ATELIE_CAMERAS,'utf8')):{};
const shadowSize=Number(process.env.ATELIE_SHADOWS||1024);assert([1024,2048,4096].includes(shadowSize),'Resolução de sombra inválida');
fs.mkdirSync(out,{recursive:true});const previous=fs.existsSync(path.join(out,'cameras.json'))?JSON.parse(fs.readFileSync(path.join(out,'cameras.json'),'utf8')):{};
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});try{
 const context=await browser.newContext({viewport:{width:900,height:900}}),page=await context.newPage(),errors=[],cameras={...previous};page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text())});
 const three=path.resolve(path.dirname(require.resolve('three')),'..');await context.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',r=>r.fulfill({path:three+'/'+r.request().url().split('three@0.180.0/')[1],contentType:'application/javascript'}));
 await page.route(base,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(root+'/index.html','utf8').replace('mapSize.set(4096,4096)',`mapSize.set(${shadowSize},${shadowSize})`).replace('(function frame(){requestAnimationFrame(frame);','window.__render=function(){').replace('renderer.render(scene,camera)})();','renderer.render(scene,camera)};')}));
 await page.goto(base);await page.waitForFunction(()=>window.__atelie?.editor);await page.evaluate(()=>{const a=window.__atelie;a.stopAuto();a.editor.previews.pause();a.orbit.enableDamping=false});
 await page.addStyleTag({content:'#stage{position:fixed!important;inset:0!important;width:900px!important;height:900px!important;z-index:100}.brand,.help{display:none!important}'});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
 const ids=process.env.ATELIE_PERSONAGENS?.split(',')||await page.evaluate(async()=>(await import('/src/presets.js')).PRESET_ORDER);
 for(const id of ids){
  assert.equal(await page.evaluate(id=>window.__atelie.setPreset(id),id),true);cameras[id]={...(previous[id]||{})};
  const views=process.env.ATELIE_VIEWS?.split(',')||['front','three','back'];if(process.env.ATELIE_COMPRIMENTO&&await page.evaluate(()=>['long_wavy','long_braids','long_curly','court_waves','hero_halfup','forest_locks'].includes(window.__atelie.getLook().hair)))views.push('full');
  for(const view of views){
   cameras[id][view]=await page.evaluate(async({view,saved})=>{
    const a=window.__atelie,THREE=await import('three'),head=a.group(),scale=head.scale.x,center=head.localToWorld(new THREE.Vector3(0,.1,0)),dir=new THREE.Vector3(...(view==='front'?[0,.025,1]:view==='back'?[.10,.06,-1]:[.55,.065,1])).normalize();
    a.setPose({});if(view==='full')a.aim(0,-.05,-7.4);else{a.orbit.target.copy(center);a.camera.position.copy(center).addScaledVector(dir,7.8*scale)}
    if(saved){a.camera.position.fromArray(saved.position);a.orbit.target.fromArray(saved.target)}a.orbit.update();window.__render();
    head.traverse(m=>{if(m.isMesh)for(const key of ['position','normal'])if(!m.geometry.attributes[key].array.every(Number.isFinite))throw Error('Malha inválida: '+m.name)});
    return{position:a.camera.position.toArray(),target:a.orbit.target.toArray()};
   },{view,saved:fixed[id]?.[view]});
   await page.locator('#stage canvas').screenshot({path:path.join(out,id+'-'+view+'.png')});
  }
  for(const pose of (!process.env.ATELIE_POSERS||process.env.ATELIE_POSERS.split(',').includes(id))?(process.env.ATELIE_POSES?.split(',').filter(Boolean)||[]):[]){await page.evaluate(({pose,camera})=>{const a=window.__atelie;a.camera.position.fromArray(camera.position);a.orbit.target.fromArray(camera.target);a.orbit.update();a.setExpression(pose);window.__render()},{pose,camera:cameras[id].three});await page.locator('#stage canvas').screenshot({path:path.join(out,id+'-pose-'+pose+'.png')})}
  console.log('Capturado',id);assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'cameras.json'),JSON.stringify(cameras,null,2));fs.writeFileSync(path.join(out,'relatorio.json'),JSON.stringify({ids:Object.keys(cameras),errors},null,2));
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
