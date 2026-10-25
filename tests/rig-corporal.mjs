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
const strainCache=new WeakMap();
function bodyStrain(mesh,originalIndex=null){
 const g=mesh.geometry,p=g.attributes.position;let cache=strainCache.get(g);
 if(!cache){const edges=[],ix=originalIndex||g.index;for(let i=0;i<ix.count;i+=3)for(let j=0;j<3;j++){const a=ix.getX(i+j),b=ix.getX(i+(j+1)%3),d=Math.hypot(p.getX(a)-p.getX(b),p.getY(a)-p.getY(b),p.getZ(a)-p.getZ(b));if(d>=.002)edges.push(a,b,d)}cache={edges,posed:new Float32Array(p.count*3)};strainCache.set(g,cache)}
 const v=new THREE.Vector3(),posed=cache.posed;for(let i=0;i<p.count;i++)mesh.getVertexPosition(i,v).toArray(posed,i*3);let max=0;
 for(let i=0;i<cache.edges.length;i+=3){const a=cache.edges[i]*3,b=cache.edges[i+1]*3;max=Math.max(max,Math.hypot(posed[a]-posed[b],posed[a+1]-posed[b+1],posed[a+2]-posed[b+2])/cache.edges[i+2])}return max;
}
const reference=new Map(),reports=[],strainFailures=[];
for(const id of process.env.RIG_IDS?.split(',')||PRESET_ORDER){
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
   assert.equal(w.count,g.attributes.position.count);for(let i=0;i<w.count;i++){assert(Math.abs(w.getX(i)+w.getY(i)+w.getZ(i)+w.getW(i)-1)<1e-5);assert(ix.getX(i)<BODY_BONES.length&&ix.getY(i)<BODY_BONES.length);if(['lower','belt','feet'].includes(m.userData.slot))for(let k=0;k<4;k++)if(w.array[i*4+k]>1e-6)assert(!/Arm|Hand/.test(BODY_BONES[ix.array[i*4+k]]),id+'/'+m.name+': roupa inferior seguindo braço')}
   if(m.userData.slot==='feet'&&h.body&&!h.body.joints.mermaid){
    const p=g.attributes.position,j=h.body.joints,halfGap=Math.abs(j.ankle.x)*.5;
    for(let i=0;i<p.count;i++){
     const point=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);if(Math.abs(point.x)<halfGap)continue;
     const expected='Foot_'+(point.x>=0?'L':'R');let ownFoot=0;
     for(let slot=0;slot<4;slot++){
      const name=BODY_BONES[ix.array[i*4+slot]],weight=w.array[i*4+slot];if(name===expected)ownFoot+=weight;
      if(weight>1e-6&&/_(L|R)$/.test(name))assert(name.endsWith(expected.slice(-2)),id+'/'+m.name+': calçado seguindo a perna oposta');
     }
     if(point.y<j.ankle.y-j.W*.02)assert(ownFoot>1-1e-5,id+'/'+m.name+': sola do calçado não acompanha o pé');
    }
   }
   if(k===0&&h.body?.joints.shoulder){
    const p=g.attributes.position,j=h.body.joints;let soleVertices=0;
    for(let i=0;i<p.count;i++){
     const sole=!j.mermaid&&p.getY(i)<j.ankle.y-j.W*.02,outer=Math.abs(p.getX(i))>Math.abs(j.shoulder.x)*.85,expected='Foot_'+(p.getX(i)>=0?'L':'R');
     let footWeight=0;for(let slot=0;slot<4;slot++){const weight=w.array[i*4+slot],name=BODY_BONES[ix.array[i*4+slot]];if(outer&&weight>1e-6)assert(!['Head','Neck'].includes(name),id+': ombro seguindo cabeça/pescoço');if(name===expected)footWeight+=weight}
     if(sole){assert(footWeight>1-1e-5,id+': sola da pele não acompanha o osso do calçado');soleVertices++}
    }
    if(!j.mermaid)assert(soleVertices>5,id+': sola não exercitada');
   }
   for(const {i,p}of originals[k].points)assert(m.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(m.matrixWorld).distanceTo(p)<2e-5,id+'/'+m.name+': mudou a pose A');
  }
  if(id==='sad_clown')for(const m of rig.meshes){const collar=/^Roupa_Gola/.test(m.name),bib=m.name==='Roupa_Macacao'&&m.userData.slot==='upper';if(collar||bib){const g=m.geometry;for(let i=0;i<g.attributes.skinWeight.count;i++)for(let k=0;k<4;k++)if(g.attributes.skinWeight.array[i*4+k]>1e-6){const name=BODY_BONES[g.attributes.skinIndex.array[i*4+k]];if(collar)assert.equal(name,'Neck','Gola puxada por membro');else assert(!/Arm|Hand/.test(name),'Macacão puxado por braço')}}}
  if(h.body?.joints.wrist){const m=rig.meshes[0],p=m.geometry.attributes.position,target=h.body.joints.wrist;let best=Infinity,index=0;for(let i=0;i<p.count;i++){const d=(p.getX(i)-target.x)**2+(p.getY(i)-target.y)**2+(p.getZ(i)-target.z)**2;if(d<best){best=d;index=i}}const w=m.geometry.attributes.skinWeight,ix=m.geometry.attributes.skinIndex,bone=rig.skeleton.bones[w.getX(index)>=w.getY(index)?ix.getX(index):ix.getY(index)].name;assert(bone.includes('Arm_L')||bone==='Rig_Hand_L',id+': punho vinculado fora do braço: '+bone)}
  assert(h.group.matrixWorld.elements.every((v,i)=>Math.abs(v-headMatrix.elements[i])<1e-7),id+': cabeça se deslocou na vinculação');
  if(id==='nico_inventor'){
   const before=rig.bones.UpperArm_L.quaternion.clone();rig.play('victory');assert(rig.bones.UpperArm_L.quaternion.angleTo(before)<1e-8,'Início da animação saltou');rig.update(.01);assert(rig.bones.UpperArm_L.quaternion.angleTo(before)<.05,'Transição brusca');rig.pause();const paused=rig.bones.UpperArm_L.quaternion.clone(),position=rig.bones.Root.position.clone();rig.update(.1);assert(rig.bones.UpperArm_L.quaternion.angleTo(paused)<1e-6,'Pausa não congelou a transição');rig.makeClips();assert(rig.bones.UpperArm_L.quaternion.angleTo(paused)<1e-6&&rig.bones.Root.position.distanceTo(position)<1e-7,'Gerar clipes alterou o player');rig.stop();
  }
  let moved=0,maxBodyStrain=0;
  for(const motion of Object.keys(MOTIONS)){
   rig.play(motion);rig.seek(MOTIONS[motion].duration*.37);h.root.updateMatrixWorld(true);rig.skeleton.update();
   const strainTimes=process.env.RIG_DENSE==='1'?Array.from({length:Math.round(MOTIONS[motion].duration*8)+1},(_,i)=>i/8):[MOTIONS[motion].duration*.37,.25,.75,...(motion==='victory'?[.85,1.65,4.15]:[])];
   if(h.body||h.fit?.companion)for(const time of strainTimes){rig.seek(time);const strain=bodyStrain(rig.meshes[0],h.body?.geo.index);maxBodyStrain=Math.max(maxBodyStrain,strain);if(strain>=6)strainFailures.push({id,motion,time,strain})}

   for(let k=0;k<rig.meshes.length;k++){const m=rig.meshes[k];for(const {i,p}of originals[k].points){const v=m.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(m.matrixWorld);assert(v.toArray().every(Number.isFinite),id+': vértice inválido');assert(v.distanceTo(p)<rig.height*2,id+': deformação explodiu');if(v.distanceTo(p)>.005)moved++}}
  }
  if(rig.meshes.length)assert(moved>0,id+': corpo não se move');
  rig.play('dance_floss');rig.update(MOTIONS.dance_floss.duration+.25);assert(Math.abs(rig.state().time-.25)<1e-8,id+': ciclo não reiniciou');rig.play('defeat');rig.update(10);assert.equal(rig.state().playing,false);assert.equal(rig.state().time,MOTIONS.defeat.duration);
  const clips=rig.makeClips();assert.equal(clips.length,5);
  // Braços/pernas adaptam medidas, e barras resolvem contato com cada roupa.
  // A captura compartilhada do tronco e da cabeça continua idêntica.
  for(const clip of clips){assert(clip.tracks.length>=BODY_BONES.length);assert(clip.tracks.every(t=>Array.from(t.values).every(Number.isFinite)));const signature=JSON.stringify(clip.tracks.filter(t=>t.name.endsWith('.quaternion')&&!/Rig_(UpperArm|LowerArm|Hand|UpperLeg|LowerLeg|Foot|Toe|Drape)_/.test(t.name)).map(t=>[t.name,Array.from(t.values)]));const key=rig.profile+clip.name;if(reference.has(key))assert.equal(signature,reference.get(key),id+': coreografia divergente');else reference.set(key,signature)}
  rig.stop();h.root.updateMatrixWorld(true);rig.skeleton.update();for(let k=0;k<rig.meshes.length;k++)for(const {i,p}of originals[k].points)assert(rig.meshes[k].getVertexPosition(i,new THREE.Vector3()).applyMatrix4(rig.meshes[k].matrixWorld).distanceTo(p)<2e-5,id+': parar não restaurou');
  const profile=rig.profile,meshes=rig.meshes.length;rig.dispose();rig=null;assert.equal(h.root.getObjectByName('Esqueleto_Corporal'),undefined);for(const {mesh}of originals)assert(mesh.parent,id+': malha não restaurada');reports.push({id,profile,meshes,moved,maxBodyStrain});console.log('OK',id,profile,meshes,'estiramento',maxBodyStrain.toFixed(3));
 }finally{rig?.dispose();clothes?.dispose();visual?.dispose();h.body?.geo.dispose();h.dispose()}
}
console.log(JSON.stringify({personagens:reports.length,ossos:BODY_BONES.length,clipes:Object.keys(MOTIONS),perfis:[...new Set(reports.map(r=>r.profile))]}));

assert.deepEqual(strainFailures,[],'Estiramento excessivo no catálogo: '+JSON.stringify(strainFailures));
