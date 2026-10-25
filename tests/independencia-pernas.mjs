// Uma perna se move; pele, calça e calçado da outra precisam ficar no lugar.
// Confere também a topologia real da calça, independentemente dos pesos.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildHead} from '../src/head.js';
import {buildBody,headScale} from '../src/body.js';
import {buildBodyRig} from '../src/body-rig.js';
import {legClearance} from '../src/leg-clearance.js';
import {buildClothes,OUTFITS} from '../src/clothes.js';
import {defaultLook,headOpts} from '../src/look.js';
import {PRESETS,PRESET_ORDER} from '../src/presets.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const V=()=>new THREE.Vector3(),reports=[];
for(const id of process.env.LEG_IDS?.split(',')||PRESET_ORDER){
 const look=defaultLook(id);if(PRESETS[id].kind==='robot'||PRESETS[id].kind==='companion'||OUTFITS[look.outfit]?.mermaid)continue;
 const h=buildHead(id,{}, {quality:.3,...headOpts(look,PRESETS[id])});h.root=new THREE.Group();h.root.add(h.group);let clothes,rig;
 try{
  const scale=headScale(id),build=process.env.LEG_BUILD?JSON.parse(process.env.LEG_BUILD):undefined,b=buildBody(h.fit,id,{cell:.07,headScale:scale,build}),j=b.joints,positions=b.geo.attributes.position.array.slice();
  h.group.scale.setScalar(scale);h.group.position.copy(b.pivot).multiplyScalar(1-scale);h.body={...b,mesh:new THREE.Mesh(b.geo,h.group.getObjectByName('Head_Skin')?.material||new THREE.MeshBasicMaterial())};h.root.add(h.body.mesh);
  clothes=buildClothes(h.body,look);h.root.add(clothes.group);h.root.updateMatrixWorld(true);rig=buildBodyRig(h,clothes);
  const seam=legClearance(h.body),meshes=rig.meshes.filter(m=>!m.userData.slot||m.userData.skinningMode==='legs'||m.userData.slot==='feet'),samples=[];let trousers=0;
  const skin=b.geo.attributes.position;
  for(let i=0;i<skin.count;i++)if(skin.getY(i)<seam.crotch)assert(seam.field(skin.getX(i),skin.getY(i),skin.getZ(i))<j.W*.01,id+': abertura da calça alcançou a pele');
  for(const mesh of meshes){
   const g=mesh.geometry,p=g.attributes.position,ix=g.index;
   if(mesh.userData.skinningMode==='legs'){
    trousers++;let below=0;
    for(let i=0;i<ix.count;i+=3){
     const ids=[ix.getX(i),ix.getX(i+1),ix.getX(i+2)];if(ids.some(k=>p.getY(k)>seam.top-seam.radius*2))continue;
     below++;
     // Coxas em contato ainda podem compartilhar tecido. O que não pode
     // existir é uma face costurando o vão livre, longe da própria pele.
     for(let edge=0;edge<3;edge++){
      const a=ids[edge],b=ids[(edge+1)%3],x=p.getX(a),other=p.getX(b);if(x*other>=0)continue;
      const t=x/(x-other),y=p.getY(a)+(p.getY(b)-p.getY(a))*t,z=p.getZ(a)+(p.getZ(b)-p.getZ(a))*t;
      // A borda arredondada ocupa células da malha; verificar a parte aberta
      // do vão evita exigir precisão abaixo de uma célula nessa costura.
      assert(seam.field(0,y,z)<seam.radius*.75,id+'/'+mesh.name+': tecido unindo as pernas através do vão livre');
     }
    }
    assert(below>20,id+': teste não alcançou as pernas da calça');
   }
   for(let i=0;i<p.count;i++){
    const point=V().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
    // A borda interna de um aro de bota pode ultrapassar o plano central;
    // esse arco continua pertencendo ao pé em que o aro está assentado.
    const sideMargin=mesh.userData.slot==='feet'?Math.abs(j.ankle.x)*.5:j.W*.03;
    if(point.y>seam.crotch-j.W*.4||Math.abs(point.x)<sideMargin)continue;
    samples.push({mesh,index:i,side:point.x>0?'L':'R',rest:mesh.getVertexPosition(i,V())});
   }
  }
  assert(samples.length>100,id+': região inferior sem amostras');let maxOther=0,maxOwn=0;
  for(const side of ['L','R'])for(const [hip,knee,abduction]of [[-.8,.9,0],[.2,-.6,0],[-.2,.3,.45]]){
   rig.stop();rig.bones['UpperLeg_'+side].rotation.set(hip,0,abduction*(side==='L'?1:-1));rig.bones['LowerLeg_'+side].rotation.x=knee;rig.bones['Foot_'+side].rotation.x=.2;h.root.updateMatrixWorld(true);rig.skeleton.update();
   for(const s of samples){const distance=s.mesh.getVertexPosition(s.index,V()).distanceTo(s.rest);if(s.side===side)maxOwn=Math.max(maxOwn,distance);else{maxOther=Math.max(maxOther,distance);assert(distance<j.W*1e-5,id+'/'+s.mesh.name+': perna parada arrastada '+distance)}}
  }
  assert(maxOwn>j.W*.1,id+': a perna ativa não foi exercitada');rig.stop();
  for(const s of samples)assert(s.mesh.getVertexPosition(s.index,V()).distanceTo(s.rest)<j.W*1e-5,id+': parar não restaurou a pose A');
  assert.deepEqual(b.geo.attributes.position.array,positions,id+': a correção alterou a escultura do corpo');
  reports.push({id,trousers,vertices:samples.length,maxOther,maxOwn});console.log('OK',id,'calças',trousers,'vértices',samples.length,'arrasto',maxOther.toExponential(2));
 }finally{rig?.dispose();clothes?.dispose();h.body?.geo.dispose();h.dispose()}
}
console.log(JSON.stringify({personagens:reports.length,calcas:reports.reduce((n,r)=>n+r.trousers,0),maxOther:Math.max(...reports.map(r=>r.maxOther))}));
