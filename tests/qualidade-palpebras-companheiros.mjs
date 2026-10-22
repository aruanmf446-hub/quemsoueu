// Regressão: os companheiros fecham pálpebras sobre o globo sem achatar o olho.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildHead} from '../src/head.js';
for(const id of ['paysandu_wolf','ruby_raven','desert_fennec','cowboy_on_fennec']){
 const head=buildHead(id,{}, {quality:.35});
 try{
  const edge=(side,upper)=>{
   const eye=head.group.getObjectByName('Olho_'+side),pivot=eye.userData.lids[upper?0:1],m=pivot.getObjectByName('Pele_palpebra'),p=m.geometry.attributes.position;
   const v=new THREE.Vector3().fromBufferAttribute(p,32);m.localToWorld(v);return eye.worldToLocal(v);
  };
  head.rig.apply({});head.group.updateMatrixWorld(true);
  for(const side of ['L','R']){
   assert(edge(side,true).y>0&&edge(side,false).y<0,id+': abertura neutra perdida');
   const eye=head.group.getObjectByName('Olho_'+side);
   for(const pivot of eye.userData.lids){
    const g=pivot.getObjectByName('Pele_palpebra').geometry,p=g.attributes.position,ix=g.index.array;
    for(let i=0;i<ix.length;i+=3){
     const a=new THREE.Vector3().fromBufferAttribute(p,ix[i]),b=new THREE.Vector3().fromBufferAttribute(p,ix[i+1]),c=new THREE.Vector3().fromBufferAttribute(p,ix[i+2]);
     const cross=b.clone().sub(a).cross(c.clone().sub(a));assert(cross.length()>1e-9,id+': triângulo degenerado na pálpebra');assert(cross.dot(a)>0,id+': face da pálpebra invertida');
    }
   }
  }
  head.rig.apply({blinkL:1,blinkR:1});head.group.updateMatrixWorld(true);
  for(const side of ['L','R']){
   const eye=head.group.getObjectByName('Olho_'+side),upper=edge(side,true),lower=edge(side,false);
   assert.equal(eye.scale.y,1,id+': piscada achatou o globo');
   assert(upper.y<0&&lower.y>0,id+': piscada deixa o centro aberto');
   const globe=eye.getObjectByName('Esclera');globe.geometry.computeBoundingBox();
   assert(upper.z>globe.geometry.boundingBox.max.z&&lower.z>globe.geometry.boundingBox.max.z,id+': pálpebra atravessou o globo');
  }
  head.rig.apply({});head.group.updateMatrixWorld(true);const neutralUpper=edge('L',true).y;
  head.rig.apply({wide:1});head.group.updateMatrixWorld(true);
  assert(edge('L',true).y>neutralUpper,id+': surpresa não abre a pálpebra');
  head.rig.apply({wide:1,blinkL:1,blinkR:1});head.group.updateMatrixWorld(true);
  for(const side of ['L','R'])assert(edge(side,true).y<0&&edge(side,false).y>0,id+': piscar deve dominar olhos arregalados');
  head.rig.apply({blinkR:1});head.group.updateMatrixWorld(true);
  assert(edge('L',true).y>0&&edge('R',true).y<0,id+': piscadela alterou o outro olho');
  const clips=head.rig.makeClips();assert.equal(clips.length,12);
  for(const side of ['L','R'])for(const lid of ['U_','L_'])assert(clips[0].tracks.some(t=>t.name==='Palpebra_'+lid+side+'.quaternion'),id+': movimento da pálpebra ausente do GLB');
  console.log(id+': malha válida, piscada sem achatamento e pálpebras animadas');
 }finally{head.dispose()}
}
