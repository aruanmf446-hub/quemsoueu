// Punhos no braço, tecido com articulação própria e equipamento rígido.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildHead} from '../src/head.js';
import {buildBody,headScale} from '../src/body.js';
import {buildBodyRig} from '../src/body-rig.js';
import {buildClothes} from '../src/clothes.js';
import {componentBindings} from '../src/skin-components.js';
import {defaultLook,headOpts} from '../src/look.js';
import {PRESETS} from '../src/presets.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const V=()=>new THREE.Vector3();
for(const id of ['old_king','masculine_soft','cactus_soldier','cactus_soldier_large']){
 const look=defaultLook(id),h=buildHead(id,{}, {quality:.3,...headOpts(look,PRESETS[id])});h.root=new THREE.Group();h.root.add(h.group);let clothes,rig;
 try{
  const scale=headScale(id),body=buildBody(h.fit,id,{cell:.07,headScale:scale}),j=body.joints;h.group.scale.setScalar(scale);h.group.position.copy(body.pivot).multiplyScalar(1-scale);h.body={...body,mesh:new THREE.Mesh(body.geo,h.group.getObjectByName('Head_Skin').material)};h.root.add(h.body.mesh);clothes=buildClothes(h.body,look);h.root.add(clothes.group);rig=buildBodyRig(h,clothes);
  const rigid=[];
  for(const m of rig.meshes){
   const g=m.geometry,p=g.attributes.position;
   if(m.userData.slot==='lower'&&m.userData.style==='royal'&&!/Detalhes/.test(m.name))for(let i=0;i<p.count;i++)assert(!(Math.abs(p.getX(i))>j.shoulder.x+j.W*.2&&p.getY(i)>j.wrist.y-j.W*.2&&p.getY(i)<j.elbow.y+j.W*.2),id+': parte da manga foi colocada na saia');
   if(m.userData.slot!=='extras'||m.material.metalness<=.5)continue;
   const groups=[],membership=componentBindings(g,m.matrixWorld,c=>{if(c.size.y>j.W*.8&&Math.abs(c.center.x)>j.W*.5&&c.center.y<j.shoulder.y-j.W*.2){const group={mesh:m,ids:[]};groups.push(group);return group}return null});
   for(let i=0;i<p.count;i++){const group=membership(i);if(group)group.ids.push(i)}
   for(const group of groups){const indices=[group.ids[0],group.ids[Math.floor(group.ids.length/2)],group.ids.at(-1)],points=indices.map(i=>m.getVertexPosition(i,V()));rigid.push({mesh:m,indices,distances:[points[0].distanceTo(points[1]),points[1].distanceTo(points[2]),points[0].distanceTo(points[2])]})}
  }
  if(id.startsWith('cactus_soldier'))assert(rigid.length>0,id+': escudo não foi exercitado');
  for(const motion of ['lobby','defeat','victory','dance_floss','dance_shuffle']){
   rig.play(motion);for(const time of [.5,1.5,2.5]){rig.seek(time);for(const r of rigid){const p=r.indices.map(i=>r.mesh.getVertexPosition(i,V())),distances=[p[0].distanceTo(p[1]),p[1].distanceTo(p[2]),p[0].distanceTo(p[2])];for(let i=0;i<3;i++)assert(Math.abs(distances[i]-r.distances[i])<j.W*1e-5,id+': equipamento foi amassado durante '+motion)}}
  }
  const clips=rig.makeClips();let maxStep=0,active=0;
  for(const clip of clips)for(const track of clip.tracks.filter(t=>t.name.startsWith('Rig_Drape_'))){
   const a=new THREE.Quaternion(),b=new THREE.Quaternion();for(let i=1;i<track.times.length;i++){a.fromArray(track.values,(i-1)*4).normalize();b.fromArray(track.values,i*4).normalize();const step=a.angleTo(b);maxStep=Math.max(maxStep,step);assert(step<.35,id+'/'+track.name+': barra saltou '+step+' rad/quadro');if(b.angleTo(new THREE.Quaternion())>.02)active++}
  }
  assert(active>0,id+': barras não acompanham os passos');console.log('OK',id,'peças rígidas',rigid.length,'passo angular máximo',maxStep.toFixed(4));
 }finally{rig?.dispose();clothes?.dispose();h.body?.geo.dispose();h.dispose()}
}
