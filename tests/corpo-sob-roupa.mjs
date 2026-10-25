// A roupa opaca oculta somente a pele coberta; a escultura completa volta ao removê-la.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildHead} from '../src/head.js';
import {buildBody,headScale} from '../src/body.js';
import {buildBodyRig} from '../src/body-rig.js';
import {buildClothes} from '../src/clothes.js';
import {defaultLook,headOpts} from '../src/look.js';
import {PRESETS} from '../src/presets.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
for(const id of ['old_king','masculine_soft','nico_inventor','nana_explorer','cactus_soldier']){
 const look=defaultLook(id),h=buildHead(id,{}, {quality:.3,...headOpts(look,PRESETS[id])});h.root=new THREE.Group();h.root.add(h.group);let clothes,rig;
 try{
  const scale=headScale(id),body=buildBody(h.fit,id,{cell:.07,headScale:scale}),positions=body.geo.attributes.position.array.slice(),indices=body.geo.index.array.slice();h.group.scale.setScalar(scale);h.group.position.copy(body.pivot).multiplyScalar(1-scale);h.body={...body,mesh:new THREE.Mesh(body.geo,h.group.getObjectByName('Head_Skin').material)};h.root.add(h.body.mesh);clothes=buildClothes(h.body,look);h.root.add(clothes.group);rig=buildBodyRig(h,clothes);
  const visible=rig.meshes[0].geometry.index.array.slice(),hidden=rig.meshes[0].geometry.userData.coveredBodyTriangles;assert(hidden>0,id+': roupa opaca não ocultou a pele interna');assert(visible.length<indices.length);
  for(const motion of ['lobby','defeat','victory','dance_floss','dance_shuffle']){rig.play(motion);rig.seek(1.2);assert.deepEqual(rig.meshes[0].geometry.index.array,visible,id+': máscara mudou durante o movimento')}
  rig.dispose();rig=null;assert.deepEqual(body.geo.attributes.position.array,positions,id+': escultura alterada');assert.deepEqual(body.geo.index.array,indices,id+': máscara alterou o corpo original');
  clothes.group.removeFromParent();clothes.dispose();clothes=buildClothes(h.body,{...look,outfit:'none',pieces:{}});h.root.add(clothes.group);rig=buildBodyRig(h,clothes);assert.deepEqual(rig.meshes[0].geometry.index.array,indices,id+': tirar roupa deixou buracos na pele');
  console.log('OK',id,hidden,'triângulos internos ocultos; corpo completo restaurado');
 }finally{rig?.dispose();clothes?.dispose();h.body?.geo.dispose();h.dispose()}
}
