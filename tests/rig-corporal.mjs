// Rest pose, pesos, deformação, catálogo inteiro e coreografia compartilhada.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildHead} from '../src/head.js';
import {buildBody,headScale} from '../src/body.js';
import {buildBodyRig,BODY_BONES} from '../src/body-rig.js';
import {MOTIONS} from '../src/motions.js';
import {buildClothes,OUTFITS} from '../src/clothes.js';
import {defaultLook,headOpts,buildLook,attachLook} from '../src/look.js';
import {PRESETS,PRESET_ORDER} from '../src/presets.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const reference=new Map(),reports=[];
for(const id of PRESET_ORDER){
 const look=defaultLook(id),h=buildHead(id,{}, {quality:.35,...headOpts(look,PRESETS[id])});h.root=new THREE.Group();h.root.add(h.group);
 let visual,clothes,rig;
 try{
  const s=headScale(id),b=buildBody(h.fit,id,{cell:.07,headScale:s,mermaid:!!OUTFITS[look.outfit]?.mermaid});
  if(b){const p=b.pivot;h.group.scale.setScalar(s);h.group.position.copy(p).multiplyScalar(1-s);h.body={...b,mesh:new THREE.Mesh(b.geo,h.group.getObjectByName('Head_Skin')?.material||new THREE.MeshBasicMaterial())};h.body.mesh.name='Body';h.root.add(h.body.mesh)}
  visual=buildLook(h.fit,look,b?.sdfHead);attachLook(h,visual);clothes=buildClothes(h.body,look);h.root.add(clothes.group);h.root.updateMatrixWorld(true);
  const originals=[];const sources=[];if(h.body)sources.push(h.body.mesh);if(h.fit?.companion)h.fit.bodyGroup.traverse(m=>{if(m.isMesh)sources.push(m)});clothes.group.traverse(m=>{if(m.isMesh)sources.push(m)});if(h.fit?.companion){const rider=visual.group.getObjectByName('Cowboy_Montado');visual.group.traverse(m=>{let mounted=false;for(let p=m;p&&p!==visual.group;p=p.parent)if(p===rider)mounted=true;if(m.isMesh&&!m.isSkinnedMesh&&!mounted)sources.push(m)})}
  for(const m of sources){const points=[];for(let k=0;k<m.geometry.attributes.position.count;k+=Math.max(1,Math.floor(m.geometry.attributes.position.count/12)))points.push({i:k,p:new THREE.Vector3().fromBufferAttribute(m.geometry.attributes.position,k).applyMatrix4(m.matrixWorld)});originals.push({mesh:m,points})}
  const headMatrix=h.group.matrixWorld.clone();rig=buildBodyRig(h,clothes);assert.equal(rig.skeleton.bones.length,BODY_BONES.length);h.root.updateMatrixWorld(true);rig.skeleton.update();
  for(let k=0;k<rig.meshes.length;k++){
   const m=rig.meshes[k],g=m.geometry,w=g.attributes.skinWeight,ix=g.attributes.skinIndex;
   assert.equal(w.count,g.attributes.position.count);for(let i=0;i<w.count;i++){assert(Math.abs(w.getX(i)+w.getY(i)+w.getZ(i)+w.getW(i)-1)<1e-5);assert(ix.getX(i)<BODY_BONES.length&&ix.getY(i)<BODY_BONES.length)}
   for(const {i,p}of originals[k].points)assert(m.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(m.matrixWorld).distanceTo(p)<2e-5,id+'/'+m.name+': mudou a pose A');
  }
  if(h.body?.joints.wrist){const m=rig.meshes[0],p=m.geometry.attributes.position,target=h.body.joints.wrist;let best=Infinity,index=0;for(let i=0;i<p.count;i++){const d=(p.getX(i)-target.x)**2+(p.getY(i)-target.y)**2+(p.getZ(i)-target.z)**2;if(d<best){best=d;index=i}}const w=m.geometry.attributes.skinWeight,ix=m.geometry.attributes.skinIndex,bone=rig.skeleton.bones[w.getX(index)>=w.getY(index)?ix.getX(index):ix.getY(index)].name;assert(bone.includes('Arm_L')||bone==='Rig_Hand_L',id+': punho vinculado fora do braço: '+bone)}
  assert(h.group.matrixWorld.elements.every((v,i)=>Math.abs(v-headMatrix.elements[i])<1e-7),id+': cabeça se deslocou na vinculação');
  let moved=0;
  for(const motion of Object.keys(MOTIONS)){
   rig.play(motion);rig.seek(MOTIONS[motion].duration*.37);h.root.updateMatrixWorld(true);rig.skeleton.update();
   for(let k=0;k<rig.meshes.length;k++){const m=rig.meshes[k];for(const {i,p}of originals[k].points){const v=m.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(m.matrixWorld);assert(v.toArray().every(Number.isFinite),id+': vértice inválido');assert(v.distanceTo(p)<rig.height*2,id+': deformação explodiu');if(v.distanceTo(p)>.005)moved++}}
  }
  if(rig.meshes.length)assert(moved>0,id+': corpo não se move');
  rig.play('dance_floss');rig.update(4.25);assert.equal(rig.state().time,.25,id+': ciclo não reiniciou');rig.play('defeat');rig.update(10);assert.equal(rig.state().playing,false);assert.equal(rig.state().time,3.6);
  const clips=rig.makeClips();assert.equal(clips.length,5);
  for(const clip of clips){assert(clip.tracks.length>=BODY_BONES.length);assert(clip.tracks.every(t=>Array.from(t.values).every(Number.isFinite)));const signature=JSON.stringify(clip.tracks.filter(t=>t.name.endsWith('.quaternion')).map(t=>[t.name,Array.from(t.values)]));const key=rig.profile+clip.name;if(reference.has(key))assert.equal(signature,reference.get(key),id+': coreografia divergente');else reference.set(key,signature)}
  rig.stop();h.root.updateMatrixWorld(true);rig.skeleton.update();for(let k=0;k<rig.meshes.length;k++)for(const {i,p}of originals[k].points)assert(rig.meshes[k].getVertexPosition(i,new THREE.Vector3()).applyMatrix4(rig.meshes[k].matrixWorld).distanceTo(p)<2e-5,id+': parar não restaurou');
  const profile=rig.profile,meshes=rig.meshes.length;rig.dispose();rig=null;assert.equal(h.root.getObjectByName('Esqueleto_Corporal'),undefined);for(const {mesh}of originals)assert(mesh.parent,id+': malha não restaurada');reports.push({id,profile,meshes,moved});console.log('OK',id,profile,meshes);
 }finally{rig?.dispose();clothes?.dispose();visual?.dispose();h.body?.geo.dispose();h.dispose()}
}
console.log(JSON.stringify({personagens:reports.length,ossos:BODY_BONES.length,clipes:Object.keys(MOTIONS),perfis:[...new Set(reports.map(r=>r.profile))]}));
