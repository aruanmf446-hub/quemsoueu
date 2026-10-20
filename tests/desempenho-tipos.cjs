// Medição exclusiva, sem capturas concorrentes: geração completa e volta ao cache no Chromium.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),three=path.resolve(path.dirname(require.resolve('three')),'..');
const output=process.env.ATELIE_RENDERS||path.join(root,'renders','tipos-fisicos');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const reports=[],errors=[];
 try{
  const p=await browser.newPage();p.setDefaultTimeout(120000);p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text())});
  await p.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',r=>r.fulfill({path:three+'/'+r.request().url().split('three@0.180.0/')[1],contentType:'application/javascript'}));
  await p.route('http://localhost:8000/',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(root+'/index.html','utf8').replace('mapSize.set(4096,4096)','mapSize.set(1024,1024)').replace('(function frame(){requestAnimationFrame(frame);','window.__render=function(){').replace('renderer.render(scene,camera)})();','renderer.render(scene,camera)};')}));
  await p.goto('http://localhost:8000');await p.waitForFunction(()=>window.__atelie);
  const ids=process.env.ATELIE_PERSONAGENS?.split(',')||await p.evaluate(async()=>Object.keys((await import('/src/body.js')).BODIES));
  for(const id of ids){
   await p.evaluate(id=>window.__atelie.setPreset(id),id);await p.waitForFunction(()=>!document.getElementById('status').textContent.includes('…'));
   for(const [name,build]of Object.entries({magro:{weight:-1,muscle:0},gordo:{weight:1,muscle:0},musculoso:{weight:0,muscle:1},padrao:{weight:0,muscle:0}})){
    const measure=()=>p.evaluate(async build=>{const start=performance.now(),generation=await window.__atelie.setBuild(build);return {total:performance.now()-start,generation}},build);
    const cold=await measure(),warm=await measure();
    const report={id,name,ms:+cold.total.toFixed(1),geracaoMs:+cold.generation.toFixed(1),cacheMs:+warm.total.toFixed(1)};reports.push(report);console.log(report);
   }
  }
  await p.evaluate(async()=>{const a=window.__atelie,head=a.group(),look=a.lookObj();const snapshot=JSON.parse(JSON.stringify(a.getLook()));snapshot.build={weight:-1,muscle:0};await a.setLook(snapshot);if(a.group()!==head||a.lookObj()!==look)throw Error('setLook completo remontou o visual sem necessidade')});
  fs.mkdirSync(output,{recursive:true});fs.writeFileSync(output+'/desempenho.json',JSON.stringify({navegador:browser.version(),reports,errors,maxMs:Math.max(...reports.map(r=>r.ms)),maxCacheMs:Math.max(...reports.map(r=>r.cacheMs))},null,2));
  assert.deepEqual(errors,[]);assert(reports.every(r=>r.cacheMs<500),'Troca em cache acima de 500 ms');
  assert(reports.every(r=>r.ms<3000),'Reconstrução acima de 3 s: '+reports.filter(r=>r.ms>=3000).map(r=>`${r.id}/${r.name}: ${r.ms} ms`).join(', '));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
