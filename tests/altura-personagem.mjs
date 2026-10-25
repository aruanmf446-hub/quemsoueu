// A estatura não altera proporções, pesos nem a solução das articulações.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildHead} from '../src/head.js';
import {buildBody,headScale} from '../src/body.js';
import {buildBodyRig,BODY_BONES} from '../src/body-rig.js';
import {normalizeHeight,applyCharacterHeight,CHARACTER_SCALES} from '../src/character-height.js';
import {defaultLook,headOpts} from '../src/look.js';
import {PRESETS} from '../src/presets.js';
import {buildClothes} from '../src/clothes.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
for(const [value,want]of [[undefined,1],[NaN,1],[Infinity,1],[-1,1],[.1,.6],[2,1.4],['1.2',1.2]])assert.equal(normalizeHeight(value),want);
const V=()=>new THREE.Vector3();
for(const id of ['masculine_soft','old_king','nico_inventor','cactus_soldier','cactus_soldier_large','alchemist_villain']){
 const look=defaultLook(id),h=buildHead(id,{}, {quality:.3,...headOpts(look,PRESETS[id])});h.root=new THREE.Group();h.root.add(h.group);let rig,clothes;
 try{
  const scale=headScale(id),body=buildBody(h.fit,id,{cell:.08,headScale:scale}),positions=body.geo.attributes.position.array.slice();h.group.scale.setScalar(scale);h.group.position.copy(body.pivot).multiplyScalar(1-scale);h.body={...body,mesh:new THREE.Mesh(body.geo,h.group.getObjectByName('Head_Skin').material)};h.root.add(h.body.mesh);
  clothes=buildClothes(h.body,look);h.root.add(clothes.group);
  const reference={},sole=new THREE.Vector3(0,body.ySole,0),points=Array.from({length:20},(_,i)=>Math.floor(i*(positions.length/3-1)/19));
  for(const height of [1,.6,1.4,1]){
   applyCharacterHeight(h.root,id,height,body.ySole);rig=buildBodyRig(h,clothes);const factor=height*(CHARACTER_SCALES[id]||1);
   assert.equal(h.root.scale.x,h.root.scale.y);assert.equal(h.root.scale.y,h.root.scale.z);assert(sole.clone().applyMatrix4(h.root.matrixWorld).distanceTo(sole)<1e-7,id+': apoio saiu do lugar');
   for(const motion of ['lobby','victory','dance_shuffle']){
    rig.play(motion);rig.seek(1.2);const angles=BODY_BONES.map(n=>rig.bones[n].quaternion.clone()),local=points.map(i=>rig.meshes[0].getVertexPosition(i,V()));
    if(!reference[motion])reference[motion]={angles,local,height:rig.height};
    else{assert(Math.abs(rig.height-reference[motion].height)<1e-7,id+': medidas do rig mudaram com a estatura');for(let i=0;i<angles.length;i++)assert(angles[i].angleTo(reference[motion].angles[i])<1e-6,id+'/'+motion+': altura mudou a pose de '+BODY_BONES[i]);for(let i=0;i<local.length;i++)assert(local[i].distanceTo(reference[motion].local[i])<1e-6,id+': altura deformou a malha local')}
    for(const side of ['L','R'])assert.equal(rig.bones['UpperLeg_'+side].scale.y,1,id+': perna comprimida');
   }
   rig.dispose();rig=null;assert.deepEqual(body.geo.attributes.position.array,positions,id+': escultura foi esticada');assert(Math.abs(h.root.scale.x-factor)<1e-9);
  }
  console.log('OK',id,'três movimentos, quatro alturas, proporções e apoio preservados');
 }finally{rig?.dispose();clothes?.dispose();h.body?.geo.dispose();h.dispose()}
}
