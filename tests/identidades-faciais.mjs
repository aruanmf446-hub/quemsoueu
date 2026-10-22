// Verifica a malha real e as relações entre identidades; não depende de roupa, cabelo ou cor.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {buildHead} from '../src/head.js';
import {PRESETS,PRESET_ORDER} from '../src/presets.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const baseline=process.argv[2]?await import(pathToFileURL(resolve(process.argv[2],'src/head.js')).href):null;
const hashes=new Map(),metrics=new Map(),changes=[];
function face(head){return head.group.getObjectByName('Head_Skin')||head.group.getObjectByName('Rosto')||head.group.getObjectByName('Head_Shell')}
function hashGeometry(root){const hash=createHash('sha256');root.traverse(m=>{if(m.isMesh)hash.update(Buffer.from(m.geometry.attributes.position.array.buffer))});return hash.digest('hex')}
for(const id of PRESET_ORDER){
 const head=buildHead(id,{}, {quality:.35,export:true});
 try{
  assert(PRESETS[id].faceIdentity,id+': identidade ausente');const root=face(head);assert(root,id+': malha do rosto ausente');
  root.traverse(m=>{if(!m.isMesh)return;const g=m.geometry;for(const [name,a]of Object.entries(g.attributes))assert(a.array.every(Number.isFinite),id+'/'+name+': atributo inválido');if(g.index)assert(g.index.array.every(i=>i<g.attributes.position.count),id+': índice fora da malha')});
  const hash=hashGeometry(root);hashes.set(id,hash);
  if(!['robot','companion'].includes(PRESETS[id].kind)){
   assert.equal(root.geometry.morphAttributes.position.length,11,id+': blendshapes perdidos');const p=root.geometry.attributes.position;
   const width=y=>{let w=0;for(let i=0;i<head.fit.skinN;i++)if(Math.abs(p.getY(i)-y)<.035&&p.getZ(i)>.05)w=Math.max(w,Math.abs(p.getX(i)));return w};
   metrics.set(id,{jaw:width(-.72),cheek:width(-.24),nose:head.fit.surfZ(0,head.params.noseTipY)});
  }
  if(id!=='robot_ball')assert.equal(head.rig.makeClips().length,12,id+': clipes faciais perdidos');
  if(baseline){const old=baseline.buildHead(id,{}, {quality:.35,export:true});try{assert.notEqual(hash,hashGeometry(face(old)),id+': rosto não foi refinado');changes.push(id)}finally{old.dispose()}}
  console.log('OK',id);
 }finally{head.dispose()}
}
// Mesmo personagem em skins diferentes conserva sua anatomia.
assert.equal(hashes.get('bread_baker'),hashes.get('bread_vigilante'));
assert.equal(hashes.get('desert_fennec'),hashes.get('cowboy_on_fennec'));
// Identidades anteriormente próximas precisam se distinguir também na superfície sem acessórios.
for(const [a,b]of [['forest_archer_f','forest_guard_f'],['forest_princess','nana_explorer'],['forest_guard_m','forest_guard_veteran'],['forest_archer_m','forest_artificer']]){
 const x=metrics.get(a),y=metrics.get(b),distance=Math.hypot(x.jaw-y.jaw,x.cheek-y.cheek,x.nose-y.nose);assert(distance>.035,a+' / '+b+': anatomia ainda excessivamente próxima');console.log('Distância anatômica',a,b,distance.toFixed(3));
}
assert.notEqual(hashes.get('frontier_cowboy'),hashes.get('cactus_soldier'));assert.notEqual(hashes.get('cactus_soldier'),hashes.get('cactus_soldier_large'));
console.log(JSON.stringify({personagens:hashes.size,rostosAlteradosContraReferencia:changes.length,skinsCompartilhadasPreservadas:true}));
