// Complemento das sereias: mostra também a variante humana de buildBody (mermaid:false), sem remontar o visual.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),three=path.resolve(path.dirname(require.resolve('three')),'..'),output=process.env.ATELIE_RENDERS||path.join(root,'renders','tipos-fisicos');
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 try{
 const page=await browser.newPage({viewport:{width:1100,height:900}});page.setDefaultTimeout(120000);page.on('pageerror',e=>{throw e});
 await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',r=>r.fulfill({path:three+'/'+r.request().url().split('three@0.180.0/')[1],contentType:'application/javascript'}));
 await page.route('http://localhost:8000/',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(root+'/index.html','utf8').replace('mapSize.set(4096,4096)','mapSize.set(1024,1024)').replace('(function frame(){requestAnimationFrame(frame);','window.__render=function(){').replace('renderer.render(scene,camera)})();','renderer.render(scene,camera)};').replace('window.__atelie={','window.__atelie={fit:()=>current.fit,')}));
 await page.goto('http://localhost:8000');await page.waitForFunction(()=>window.__atelie);await page.addStyleTag({content:'.brand,.help,.status{visibility:hidden}'});
 for(const id of ['feminine_soft','feminine_bold']){
  await page.evaluate(id=>window.__atelie.setPreset(id),id);await page.waitForFunction(()=>!document.getElementById('status').textContent.includes('…'));
  await page.evaluate(()=>{window.__atelie.stopAuto();window.__atelie.setPose({})});
  for(const [name,build]of Object.entries({magro:{weight:-1,muscle:0},padrao:{weight:0,muscle:0},gordo:{weight:1,muscle:0},musculoso:{weight:0,muscle:1}})){
   await page.evaluate(async({id,build})=>{
    const a=window.__atelie;await a.setBuild(build);const {buildBody}=await import('/src/body.js'),body=a.body();
    window.__fullBody=buildBody(a.fit(),id,{headScale:body.hs,cell:.032,mermaid:false,build});
    window.__oldGeometry=body.mesh.geometry;body.mesh.geometry=window.__fullBody.geo;a.clothes().group.visible=false;
   },{id,build});
   for(const view of ['front','side']){await page.evaluate(view=>{window.__atelie.aim(...window.__atelie.VIEWS[view]);window.__render()},view);await page.locator('#stage canvas').screenshot({path:path.join(output,`${id}-${name}-sem-completo-${view}.png`)})}
   await page.evaluate(()=>{window.__atelie.body().mesh.geometry=window.__oldGeometry;window.__fullBody.geo.dispose()});console.log(id,name,'corpo completo');
  }
 }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
