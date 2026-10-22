// Contrato dos materiais sem WebGL. A compilação e a imagem final também precisam do teste de navegador.
// Opcional: node tests/qualidade-pele.mjs /caminho/da/referencia para comparar a geometria com outro src.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import * as THREE from 'three';
import {buildHead} from '../src/head.js';

// A textura de íris não participa da verificação de atributos e uniformes.
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const baseline=process.argv[2]?await import(pathToFileURL(resolve(process.argv[2],'src/head.js')).href):null;
const compile=material=>{
  const shader={uniforms:THREE.UniformsUtils.clone(THREE.ShaderLib.physical.uniforms),vertexShader:THREE.ShaderLib.physical.vertexShader,fragmentShader:THREE.ShaderLib.physical.fragmentShader};
  material.onBeforeCompile(shader);
  return shader;
};
function geometryHash(head){
  const hash=createHash('sha256');
  const data=a=>hash.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));
  head.group.traverse(mesh=>{
    hash.update(mesh.name);hash.update(JSON.stringify([mesh.position.toArray(),mesh.quaternion.toArray(),mesh.scale.toArray()]));
    if(!mesh.isMesh)return;
    for(const [name,attr]of Object.entries(mesh.geometry.attributes).sort()){
      assert(attr.array.every(Number.isFinite),mesh.name+'/'+name+': atributo inválido');hash.update(name);data(attr.array);
    }
    if(mesh.geometry.index)data(mesh.geometry.index.array);
    for(const [name,attrs]of Object.entries(mesh.geometry.morphAttributes).sort())for(const attr of attrs){hash.update(name);data(attr.array)}
  });
  return hash.digest('hex');
}

const uniforms=[],programs=[];
for(const id of ['feminine_soft','nana_explorer','cactus_cowboy','pepper_king']){
  const head=buildHead(id,{}, {quality:.35});
  try{
    const material=head.group.getObjectByName('Head_Skin').material,first=compile(material),again=compile(material);
    const expected=head.fit.P.sss||[.5,.22,.14];
    assert.deepEqual(first.uniforms.uSSS.value.toArray(),expected,id+': espalhamento de outra pele');
    assert.equal(first.uniforms.uSSS,again.uniforms.uSSS,id+': recompilar perdeu o uniforme do material');
    assert(!uniforms.includes(first.uniforms.uSSS),id+': duas peles compartilham um uniforme mutável');
    uniforms.push(first.uniforms.uSSS);programs.push([material.customProgramCacheKey(),first.vertexShader,first.fragmentShader]);
    const current=geometryHash(head);
    if(baseline){const previous=baseline.buildHead(id,{}, {quality:.35});try{assert.equal(current,geometryHash(previous),id+': o acabamento alterou malha, cores, rig ou morphs')}finally{previous.dispose()}}
    console.log(id+': uniforme independente e recompilável'+(baseline?', geometria preservada':''));
  }finally{head.dispose()}
}
// Valores distintos usam o mesmo programa, mas nunca o mesmo estado de material.
for(const program of programs)assert.deepEqual(program,programs[0],'SSS por uniforme deve permitir compartilhar o programa');
const otherValues=uniforms.slice(1).map(u=>u.value.toArray());uniforms[0].value.set(.1,.2,.3);
assert.deepEqual(uniforms.slice(1).map(u=>u.value.toArray()),otherValues,'Atualizar uma pele alterou outra');
console.log('OK: quatro peles independentes; recompilação e compartilhamento de programa preservam seus valores.');
