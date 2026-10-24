// O figurino padrão deve manter pele, slots, cores e mapas utilizáveis em todo o catálogo.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildHead} from '../src/head.js';
import {buildBody,headScale} from '../src/body.js';
import {buildClothes} from '../src/clothes.js';
import {PRESETS,PRESET_ORDER} from '../src/presets.js';
import {defaultLook,headOpts,buildLook} from '../src/look.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
let dressed=0,pieces=0;
for(const id of PRESET_ORDER){
 const look=defaultLook(id),h=buildHead(id,{}, {quality:.35,...headOpts(look,PRESETS[id])});
 let b,c,v;
 try{
  if(PRESETS[id].kind==='robot')continue;
  if(PRESETS[id].kind==='companion'){v=buildLook(h.fit,look);v.group.traverse(m=>{if(m.isMesh)for(const a of Object.values(m.geometry.attributes))assert(a.array.every(Number.isFinite),id+'/'+m.name)});continue}
  b=buildBody(h.fit,id,{cell:.06,headScale:headScale(id)});const skin=b.geo.attributes.position.array.slice();c=buildClothes(b,look);
  c.group.traverse(m=>{
   if(!m.isMesh)return;pieces++;const g=m.geometry,p=g.attributes.position;assert(p?.count,id+'/'+m.name+': peça vazia');
   for(const a of Object.values(g.attributes))assert(a.array.every(Number.isFinite),id+'/'+m.name+': atributo inválido');
   if(g.index)assert(g.index.array.every(i=>i<p.count),id+'/'+m.name+': índice fora da malha');
   if(m.material.normalMap)assert(g.getAttribute(m.material.normalMap.channel?'uv1':'uv'),id+'/'+m.name+': mapa sem coordenadas');
   if(['fabric','secondary','pants','leather','lining','accent'].includes(m.userData.channel)&&!m.material.transparent){
    assert(m.material.map&&m.material.normalMap&&m.material.roughnessMap,id+'/'+m.name+': superfície sem mapas completos');
   }
  });
  if(id==='nana_explorer'){c.group.updateMatrixWorld(true);const belt=new THREE.Box3().setFromObject(c.group.getObjectByName('RoupaSlot_belt'));assert(belt.max.x<1.5*b.joints.W&&belt.min.x> -1.5*b.joints.W,'Costura do cinto da Nana alcançou os braços')}
  c.setColors({fabric:'#246366'});
  c.group.traverse(m=>{if(m.isMesh&&m.material.name==='Roupa_fabric')assert.equal(m.material.color.getHexString(),'246366',id+': tingimento perdido')});
  const feet=c.group.getObjectByName('RoupaSlot_feet');if(feet){c.setPieceColors('belt',{leather:'#553a29'});assert.equal(c.group.getObjectByName('RoupaSlot_feet'),feet,id+': cor do cinto substituiu o calçado')}
  assert.deepEqual(b.geo.attributes.position.array,skin,id+': roupa alterou a pele');dressed++;console.log('Figurino',id);
 }finally{c?.dispose();b?.geo.dispose();v?.dispose();h.dispose()}
}
console.log(JSON.stringify({catalogo:PRESET_ORDER.length,corposVestidos:dressed,pecas:pieces,pelePreservada:true}));
