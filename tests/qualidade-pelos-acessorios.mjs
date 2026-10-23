// Qualidade dos pelos/acessórios e preservação das identidades. Referência opcional como argumento.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {buildHead} from '../src/head.js';
import {buildHair,HAIR_STYLES} from '../src/hair.js';
import {buildAccessories,ACCESSORIES} from '../src/accessories.js';
import {defaultLook,headOpts} from '../src/look.js';
import {PRESET_ORDER,PRESETS} from '../src/presets.js';
import {groomedLock,groomMaterial} from '../src/groom.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const old=process.argv[2]?{head:await import(pathToFileURL(resolve(process.argv[2],'src/head.js'))),hair:await import(pathToFileURL(resolve(process.argv[2],'src/hair.js'))),look:await import(pathToFileURL(resolve(process.argv[2],'src/look.js')))}:null;
function fingerprint(root,surface=false){
 root.updateWorldMatrix(true,true);const h=createHash('sha256');root.traverse(m=>{if(!m.isMesh)return;h.update(m.name);h.update(JSON.stringify(m.matrixWorld.toArray()));const g=surface?(m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone()):m.geometry;
 for(const [key,a]of Object.entries(g.attributes)){if(surface&&['uv','uv1','tangent'].includes(key))continue;h.update(key);h.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength))}
 if(g.index)h.update(Buffer.from(g.index.array.buffer));for(const [key,attrs]of Object.entries(g.morphAttributes))for(const a of attrs){h.update(key);h.update(Buffer.from(a.array.buffer))}if(surface)g.dispose();
 });return h.digest('hex');
}

function valid(g,label){
 const p=g.attributes.position;assert(p?.count,label+': vazia');for(const [name,a]of Object.entries(g.attributes))assert(a.array.every(Number.isFinite),label+'/'+name+': inválido');if(g.index)assert(g.index.array.every(i=>i<p.count),label+': índices inválidos');else assert.equal(p.count%3,0,label+': triângulos incompletos');
 const n=g.attributes.normal;for(let i=0;i<n.count;i++)assert(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<1e-4,label+': normal não unitária');
}
function closed(g){
 const p=g.attributes.position,keys=[],edges=new Map();for(let i=0;i<p.count;i++)keys.push([p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e6)).join(':'));
 for(let i=0;i<g.index.count;i+=3)for(let j=0;j<3;j++){const a=keys[g.index.getX(i+j)],b=keys[g.index.getX(i+(j+1)%3)],key=a<b?a+'|'+b:b+'|'+a;assert.notEqual(a,b,'Aresta colapsada');edges.set(key,(edges.get(key)||0)+1)}
 for(const n of edges.values())assert.equal(n,2,'Volume com borda aberta ou face duplicada');
}
for(const opts of [{},{detailFibers:true},{closed:true,profile:()=>[.04,.04]}]){
 const pts=opts.closed?Array.from({length:25},(_,i)=>new THREE.Vector3(Math.cos(i/24*2*Math.PI),Math.sin(i/24*2*Math.PI),0)):[new THREE.Vector3(0,0,0),new THREE.Vector3(.1,.5,.08),new THREE.Vector3(0,1,0)];
 const g=groomedLock(pts,.08,.035,opts);valid(g,'Mecha fechada');closed(g);g.dispose();
}
const material=groomMaterial('#59311e');assert(material.normalMap&&material.roughnessMap&&material.map);assert.equal(material.map.colorSpace,THREE.SRGBColorSpace);assert.equal(material.normalMap.colorSpace,THREE.NoColorSpace);material.dispose();
let faces=0,styles=0,accessories=0,beards=0;
for(const id of PRESET_ORDER){
 const look=defaultLook(id),opts={quality:.35,export:true,...headOpts(look,PRESETS[id])},head=buildHead(id,{},opts),before=old?.head.buildHead(id,{},opts);
 try{
  const protectedNames=PRESETS[id].kind==='companion'?['Malha_rosto','Cranio','Bico_superior','Nariz','Olho_L','Olho_R','Mandibula']:PRESETS[id].kind==='robot'?['Head_Shell','Screen']:['Head_Skin','Eye_L','Eye_R'];
  let checked=0;for(const name of protectedNames){const m=head.group.getObjectByName(name);if(!m)continue;checked++;if(before){assert.equal(fingerprint(m,PRESETS[id].kind==='companion'),fingerprint(before.group.getObjectByName(name),PRESETS[id].kind==='companion'),id+'/'+name+': rosto alterado');faces++}}
  assert(checked>0,id+': rosto não exercitado');if(old)assert.deepEqual(look,old.look.defaultLook(id),id+': identidade do visual alterada');
  head.group.traverse(m=>{if(m.isMesh)valid(m.geometry,id+'/'+m.name)});
  if(id!=='robot_ball')assert.equal(head.rig.makeClips().length,12,id+': clipes perdidos');
 }finally{head.dispose();before?.dispose()}
 console.log('Rosto/rig',id);
}
const head=buildHead('feminine_soft',{}, {quality:.35});
try{
 if(old)assert.deepEqual(HAIR_STYLES,old.hair.HAIR_STYLES,'Catálogo ou penteados foram redesenhados');
 for(const id of Object.keys(HAIR_STYLES)){
  const hair=buildHair(head.fit,id),before=old?.hair.buildHair(head.fit,id);if(!hair)continue;
  try{
   hair.group.traverse(m=>{if(m.isMesh)valid(m.geometry,'Cabelo/'+id+'/'+m.name)});
   const locks=hair.group.getObjectByName('Hair_Locks');assert(locks.geometry.attributes.uv&&locks.geometry.attributes.tangent,id+': fluxo de fibras ausente');assert(locks.material.normalMap&&locks.material.roughnessMap&&locks.material.map,id+': texturas ausentes');
   if(before){const a=new THREE.Box3().setFromObject(hair.group),b=new THREE.Box3().setFromObject(before.group);for(const axis of ['x','y','z']){assert(Math.abs(a.min[axis]-b.min[axis])<.12,id+': contorno mínimo mudou');assert(Math.abs(a.max[axis]-b.max[axis])<.12,id+': contorno máximo mudou')}}
   hair.setColor('#8e3b1e');assert.equal(hair.material.color.getHexString(),'8e3b1e');styles++;
  }finally{hair.dispose();before?.dispose()}
 }
 for(const [id,option]of Object.entries(ACCESSORIES)){
  if(option.companion)continue;const acc=buildAccessories(head.fit,{[option.slot]:id});
  try{
   assert(acc.group.children.length,id+': acessório não montou');acc.group.traverse(m=>{if(m.isMesh){valid(m.geometry,'Acessório/'+id+'/'+m.name);if(m.material.normalMap)assert(m.geometry.getAttribute(m.material.normalMap.channel?'uv1':'uv'),id+': mapa sem UV')}});
   acc.setColors({metal:'#a8723e',gem:'#16935a',gem2:'#2453c4',fabric:'#3e2a1e'});accessories++;
  }finally{acc.dispose()}
 }
}finally{head.dispose()}
for(const beard of ['none','shadow','full','stache','goatee']){
 const h=buildHead('masculine_soft',{}, {quality:.6,export:true,beard,hairColor:'#59311e'});
 try{
  const expected=beard==='shadow'||beard==='full'?'Beard_Locks':beard==='stache'||beard==='goatee'?'Mustache_L':null;
  if(expected){const m=h.group.getObjectByName(expected);assert(m,beard+': pelos ausentes');assert(m.geometry.attributes.uv&&m.material.normalMap,beard+': fibras ausentes');assert(m.geometry.morphAttributes.position.length>0,beard+': expressão perdida')}
  for(const pose of [{smile:1},{jaw:.7},{pucker:1}]){
   h.rig.apply(pose);h.group.updateMatrixWorld(true);const locks=h.group.getObjectByName('Beard_Locks'),skin=h.group.getObjectByName('Head_Skin');
   if(locks?.geometry.userData.faceSources){
    const sources=locks.geometry.userData.faceSources;for(let i=0;i<sources.length;i+=Math.max(1,Math.floor(sources.length/100))){
     const a=locks.getVertexPosition(i,new THREE.Vector3()),b=skin.getVertexPosition(sources[i],new THREE.Vector3());assert(a.distanceTo(b)<(locks.geometry.userData.beardSurface ? .006 : .022),beard+': pelos se soltaram da pele animada');
    }
   }
  }h.group.traverse(m=>{if(m.isMesh)valid(m.geometry,'Barba/'+beard+'/'+m.name)});beards++;
 }finally{h.dispose()}
}
console.log(JSON.stringify({personagens:PRESET_ORDER.length,rostosComparados:faces,estilos:styles,acessorios:accessories,barbas:beards,referencia:!!old}));
