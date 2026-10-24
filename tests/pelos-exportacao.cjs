// Exporta os 34 visuais padrão; fibras, rugosidade, UVs, tangentes e rig ficam no GLB.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=process.env.ATELIE_RENDERS||path.join(root,'renders/pelos/exportacao');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});try{
 const context=await browser.newContext({viewport:{width:1000,height:900}}),page=await context.newPage(),errors=[],reports=[];page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text())});
 const three=path.resolve(path.dirname(require.resolve('three')),'..');await context.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',r=>r.fulfill({path:three+'/'+r.request().url().split('three@0.180.0/')[1],contentType:'application/javascript'}));
 await page.route('http://localhost:8000/',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(root+'/index.html','utf8').replace('mapSize.set(4096,4096)','mapSize.set(1024,1024)').replace('(function frame(){requestAnimationFrame(frame);','window.__render=function(){').replace('renderer.render(scene,camera)})();','renderer.render(scene,camera)};')}));
 await page.goto('http://localhost:8000/');await page.waitForFunction(()=>window.__atelie?.editor);await page.evaluate(()=>{window.__atelie.stopAuto();window.__atelie.editor.previews.pause()});
 const ids=process.env.ATELIE_PERSONAGENS?.split(',')||await page.evaluate(async()=>(await import('/src/presets.js')).PRESET_ORDER);
 for(const id of ids){
  assert.equal(await page.evaluate(id=>window.__atelie.setPreset(id),id),true);
  const report=await page.evaluate(async id=>{
   const a=window.__atelie,expected=new Set();a.group().traverse(m=>{if(m.isMesh&&m.material.normalMap?.name==='Hair_Fiber_Normal')expected.add(m.material.name)});
   const data=await a.exportGLB(),v=new DataView(data);if(v.getUint32(0,true)!==0x46546c67)throw Error('GLB inválido');const json=JSON.parse(new TextDecoder().decode(new Uint8Array(data,20,v.getUint32(12,true))));
   if((json.animations?.length||0)!==(id==='robot_ball'?0:12))throw Error('Clipes perdidos: '+id);
   const groom=new Set();for(let i=0;i<(json.materials?.length||0);i++){
    const m=json.materials[i];if(!expected.has(m.name)||!m.normalTexture||(m.normalTexture.texCoord||0)!==0)continue;
    if(!m.normalTexture||!m.pbrMetallicRoughness.baseColorTexture||!m.pbrMetallicRoughness.metallicRoughnessTexture||!m.extensions?.KHR_materials_anisotropy)throw Error('Fibra incompleta no GLB: '+id+'/'+m.name+' '+JSON.stringify(m));groom.add(i);
   }
   for(const name of expected)if(![...groom].some(i=>json.materials[i].name===name))throw Error('Material de pelos ausente: '+name);
   {
    const fabrics=new Set();
    for(let i=0;i<(json.materials?.length||0);i++){
     const mat=json.materials[i];if(!/^(Roupa_(fabric|secondary|pants|leather|lining|accent)|Acc_(Fabric|Band|Lining|Mask|Couro(_escuro)?))$/.test(mat.name))continue;
     for(const texture of [mat.normalTexture,mat.pbrMetallicRoughness?.baseColorTexture,mat.pbrMetallicRoughness?.metallicRoughnessTexture])if(!texture||texture.texCoord!==1)throw Error('Tecido perdeu mapa ou UV de detalhe: '+id+'/'+mat.name);
     fabrics.add(i);
    }
    if(['nana_explorer','nico_inventor','bread_baker','bread_vigilante'].includes(id)&&!fabrics.size)throw Error('Figurino sem materiais de tecido: '+id);
    for(const mesh of json.meshes||[])for(const p of mesh.primitives)if(fabrics.has(p.material)&&p.attributes.TEXCOORD_1===undefined)throw Error('Tecido exportado sem UV1: '+id+'/'+mesh.name);
   }
   let primitives=0;for(const mesh of json.meshes||[])for(const p of mesh.primitives)if(groom.has(p.material)){
    if(p.attributes.TEXCOORD_0===undefined||p.attributes.TANGENT===undefined)throw Error('Fluxo sem UV/tangente: '+mesh.name);
    if(json.accessors[p.attributes.TANGENT].count!==json.accessors[p.attributes.POSITION].count)throw Error('Tangentes incompletas');primitives++;
   }
   for(const name of ['feliz','surpreso','beijo'])a.setExpression(name);a.setExpression('neutro');
   return{id,MB:+(data.byteLength/1048576).toFixed(2),clips:json.animations?.length||0,groomMaterials:groom.size,primitives,images:json.images?.length||0};
  },id);reports.push(report);console.log(JSON.stringify(report));assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'relatorio.json'),JSON.stringify({reports,errors},null,2));
 }
 // A barba sombreada também acompanha a cor aplicada pelo controle real.
 await page.evaluate(()=>window.__atelie.setPreset('masculine_soft'));
 await page.evaluate(()=>window.__atelie.editor.select('appearance','hair'));
 await page.locator('#hairColors button[title="Ruivo"]').click();await page.waitForFunction(()=>!document.getElementById('status').textContent.includes('…'));
 assert.deepEqual(await page.evaluate(()=>({hair:window.__atelie.lookObj().hair.material.color.getHexString(),beard:window.__atelie.group().getObjectByName('Beard_Locks').material.color.getHexString()})),{hair:'b4441c',beard:'b4441c'});
 // Quatro caminhos distintos e o penteado mais denso no Worker real.
 for(const id of process.env.ATELIE_WORKER?.split(',')||['nico_inventor','nana_explorer','old_king','feminine_bold','cactus_soldier','cowboy_on_fennec']){
  await page.evaluate(id=>window.__atelie.setPreset(id),id);
  await page.evaluate(()=>{const e=window.__atelie.editor;e.previews.paused=false;e.select('expressions','ready')});
  await page.locator('#exprs [data-expr="feliz"] [data-ready="true"] img').waitFor();await page.locator('#exprs [data-expr="feliz"] img').evaluate(img=>img.decode());
  assert.equal(await page.evaluate(()=>window.__atelie.editor.previews.stats().failed),false);await page.evaluate(()=>window.__atelie.editor.previews.pause());console.log('Worker',id);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'relatorio.json'),JSON.stringify({reports,worker:process.env.ATELIE_WORKER?.split(',')||['nico_inventor','nana_explorer','old_king','feminine_bold','cactus_soldier','cowboy_on_fennec'],errors},null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
