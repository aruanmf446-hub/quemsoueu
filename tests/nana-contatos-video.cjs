// Captura os cinco clipes completos em WebGL, com comparação no mesmo arquivo.
// Fontes imutáveis e hashes permitem distinguir antes/depois de capturas antigas.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawn}=require('node:child_process'),{once}=require('node:events');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const base=process.env.NANA_CONTACT_BASE||'/tmp/nana-contatos-base-8c44e5b';
const out=process.env.ATELIE_RENDERS||path.join(root,'renders/nana-contatos');
const phases=(process.env.NANA_CONTACT_PHASE||'antes,depois').split(',');
const width=400,height=560,fps=24,ids=['lobby','defeat','victory','dance_floss','dance_shuffle'];
const camera=[1.8,-1.5,17.4],target=[0,-1.7,0];
const keys={lobby:1.0666666666666667,defeat:2.966666666666667,victory:5.066666666666666,dance_floss:3,dance_shuffle:4.833333333333333};
const files=['src/mixamo-motions.js','src/mixamo-hands.js','src/mixamo-leg-ik.js','assets/characters/nana-explorer.glb'];
const hashes=folder=>Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(folder,file))).digest('hex')]));
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 try{
  for(const phase of phases){
   assert(['antes','depois'].includes(phase));
   const folder=phase==='antes'?base:root,port=phase==='antes'?8004:8000,sourceHashes=hashes(folder);
   const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],rows=[];
   page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',route=>route.fulfill({path:root+'/node_modules/three/'+route.request().url().split('three@0.180.0/')[1],contentType:'application/javascript'}));
   const url=`http://localhost:${port}/?personagem=nana_explorer`;
   await page.route(url,route=>route.fulfill({contentType:'text/html',body:fs.readFileSync(folder+'/index.html','utf8').replace('renderer.shadowMap.enabled=true','renderer.shadowMap.enabled=false').replace('const pmrem=','window.__filmRenderer=renderer;const pmrem=').replace('(function frame(){requestAnimationFrame(frame);','window.__render=function(){').replace('renderer.render(scene,camera)})();','renderer.render(scene,camera)};')}));
   await page.goto(url);await page.waitForFunction(()=>window.__atelie?.editor);
   await page.evaluate(({width,height})=>{const a=__atelie;a.editor.previews.pause();a.orbit.enableDamping=false;__filmRenderer.setSize(width,height,false);a.camera.aspect=width/height;a.camera.updateProjectionMatrix()},{width,height});
   for(const id of ids){
    const info=await page.evaluate(async({id,camera,target})=>{const a=__atelie;await a.playMotion(id);a.pauseMotion();a.orbit.target.set(...target);a.camera.position.set(...camera);a.orbit.update();return{duration:a.motions[id].duration,camera:a.camera.position.toArray(),target:a.orbit.target.toArray()}},{id,camera,target});
    for(const key of ['camera','target'])assert(info[key].every((v,i)=>Math.abs(v-({camera,target}[key][i]))<1e-8),'Câmera divergente');
    const frames=Math.round(info.duration*fps),file=path.join(out,`${phase}-${id}.mp4`);
    const ffmpeg=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-i','pipe:0','-an','-c:v','libx264','-pix_fmt','yuv420p','-crf','21','-preset','fast','-movflags','+faststart',file]);
    let log='';ffmpeg.stderr.on('data',b=>log+=b);const ended=once(ffmpeg,'exit');
    for(let i=0;i<frames;i++){
     const data=await page.evaluate(t=>{__atelie.seekMotion(t);__render();return __filmRenderer.domElement.toDataURL('image/png').split(',')[1]},i/fps);
     if(!ffmpeg.stdin.write(Buffer.from(data,'base64')))await once(ffmpeg.stdin,'drain');
    }
    ffmpeg.stdin.end();const[code]=await ended;assert.equal(code,0,log);
    // Close real no instante auditado; muda apenas a câmera, nunca a pose ou luz.
    const close=await page.evaluate(({t})=>{const a=__atelie;a.orbit.target.set(0,.1,.25);a.camera.position.set(2,.4,7.7);a.orbit.update();a.seekMotion(t);__render();return __filmRenderer.domElement.toDataURL('image/png').split(',')[1]},{t:keys[id]});
    fs.writeFileSync(path.join(out,`${phase}-${id}-close.png`),Buffer.from(close,'base64'));
    rows.push({phase,id,frames,width,height,fps,duration:info.duration,camera:info.camera,target:info.target,file:path.basename(file),closeTime:keys[id]});
    console.log('Capturado',phase,id,frames);
   }
   assert.deepEqual(errors,[]);assert.deepEqual(hashes(folder),sourceHashes,'Fontes mudaram durante a captura');
   fs.writeFileSync(path.join(out,`videos-${phase}.json`),JSON.stringify({baseline:phase==='antes'?'8c44e5b':null,rows,sourceHashes,errors,shadows:false},null,2));
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
