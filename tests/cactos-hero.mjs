// Encaixe dos novos cactos: coluna compacta, corpo fora do rosto e chapelaria sem tapar os olhos.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildHead} from '../src/head.js';
import {buildBody,headScale} from '../src/body.js';
import {buildAccessories} from '../src/accessories.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
for(const id of ['frontier_cowboy','cactus_soldier','cactus_soldier_large']){
  const head=buildHead(id,{}, {quality:.35}),P=head.fit.P,body=buildBody(head.fit,id,{cell:.06,headScale:headScale(id)}),J=body.joints;
  assert(body.sdf(0,P.mouthY,head.fit.surfZ(0,P.mouthY))>.025,'O pescoço do corpo atravessou a boca: '+id);
  assert(head.group.getObjectByName('Mouth_Line'),'O traço da boca sumiu: '+id);
  assert((head.fit.top-body.ySole)/(2*J.shoulder.x)<3,'O cacto voltou à silhueta humana alta: '+id);
  const hat=id==='frontier_cowboy'?'frontier_hat':'guard_helmet';
  const accessory=buildAccessories(head.fit,{head:hat},{metal:'#c89c43',fabric:'#a52320',gem:'#b82025'});accessory.group.updateMatrixWorld(true);
  for(const eye of head.fit.eyes){const z=eye.z+eye.R,ray=new THREE.Raycaster(new THREE.Vector3(eye.x,eye.y,z+2),new THREE.Vector3(0,0,-1),0,2);assert.equal(ray.intersectObject(accessory.group,true).length,0,'Chapelaria tapou o olho: '+id)}
  accessory.group.traverse(m=>{if(m.isMesh)for(const k of ['position','normal'])assert(m.geometry.attributes[k].array.every(Number.isFinite),id+': '+k+' inválida')});
  const box=new THREE.Box3().setFromObject(accessory.group);
  if(hat==='frontier_hat')assert(box.max.x-box.min.x>2.8,'A aba larga encolheu');
  else assert(box.max.y>head.fit.top+.85,'O penacho perdeu seu volume');
  accessory.setColors({fabric:'#263c68',metal:'#c9ccd1'});
  accessory.group.traverse(m=>{if(m.isMesh&&m.material.name==='Acc_Fabric')assert.equal(m.material.color.getHexString(),'263c68')});
  console.log(id+': silhueta compacta, boca livre, olhos livres, geometria e cores válidas');
  accessory.dispose();body.geo.dispose();head.dispose();
}
