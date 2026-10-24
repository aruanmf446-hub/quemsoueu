// Apoio real nos rigs: trajetória do tornozelo no mundo do ator, não apenas
// continuidade dos canais de coreografia ou a matemática isolada do solver.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildHead} from '../src/head.js';
import {buildBody,headScale} from '../src/body.js';
import {buildBodyRig} from '../src/body-rig.js';
import {motionPose,MOTIONS} from '../src/motions.js';
import {defaultLook,headOpts} from '../src/look.js';
import {PRESETS} from '../src/presets.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),reports=[];
for(const id of ['nico_inventor','nana_explorer','alchemist_villain']){
 const look=defaultLook(id),h=buildHead(id,{}, {quality:.3,...headOpts(look,PRESETS[id])});h.root=new THREE.Group();h.root.add(h.group);let rig;
 try{
  const scale=headScale(id),b=buildBody(h.fit,id,{cell:.09,headScale:scale}),pivot=b.pivot;
  h.group.scale.setScalar(scale);h.group.position.copy(pivot).multiplyScalar(1-scale);const mesh=new THREE.Mesh(b.geo,h.group.getObjectByName('Head_Skin').material);mesh.name='Body';h.body={...b,mesh};h.root.add(mesh);
  // A mesma trajetória deve funcionar com o ator colocado e girado no cenário.
  if(id==='nana_explorer'){h.root.position.set(2,.8,-3);h.root.rotation.set(.08,.45,-.04);h.root.scale.setScalar(1.2)}
  rig=buildBodyRig(h);const width=b.joints.W;
  // Mover um ator já vinculado não deve fazer a correção de apoio afundá-lo.
  if(id==='nico_inventor'){h.root.position.set(-3,1.4,2);h.root.rotation.set(.06,-.35,.04);h.root.scale.setScalar(.9);h.root.updateMatrixWorld(true)}
  const rootPosition=bone=>bone.getWorldPosition(V()).applyMatrix4(h.root.matrixWorld.clone().invert());
  const rest=Object.fromEntries(['L','R'].map(side=>[side,rootPosition(rig.bones['Foot_'+side])]));
  let maxPlantedXZ=0,maxTargetXZ=0,stanceSamples=0,liftSamples=0;
  for(const motion of ['dance_floss','dance_shuffle']){
   rig.play(motion);rig.pause();
   for(let i=0;i<=MOTIONS[motion].duration*30;i++){
    const t=i/30,pose=motionPose(motion,t);rig.seek(t);h.root.updateMatrixWorld(true);
    for(const side of ['L','R']){
     const actual=rootPosition(rig.bones['Foot_'+side]),target=rest[side].clone().addScaledVector(V(...pose.feet[side]),width),error=Math.hypot(actual.x-target.x,actual.z-target.z)/width;
     maxTargetXZ=Math.max(maxTargetXZ,error);assert(error<1e-4,id+'/'+motion+'/'+side+': tornozelo não segue o alvo XZ: '+error);
     const lift=pose.feet[side][1];
     if(lift<1e-7){const drift=Math.hypot(actual.x-rest[side].x,actual.z-rest[side].z)/width;maxPlantedXZ=Math.max(maxPlantedXZ,drift);assert(drift<1e-4,id+'/'+motion+'/'+side+': pé de apoio escorregou '+drift);assert(Math.abs(actual.y-rest[side].y)<width*.025,id+'/'+motion+'/'+side+': apoio afundou ou flutuou');stanceSamples++}
     if(lift>.025){assert(actual.y-rest[side].y>width*.015,id+'/'+motion+'/'+side+': pé marcado como elevado continua no chão');liftSamples++}
    }
   }
  }
  assert(stanceSamples>120,id+': faltam fases de apoio');assert(liftSamples>20,id+': nenhum passo elevado exercitado');
  reports.push({id,stanceSamples,liftSamples,maxPlantedXZ:+maxPlantedXZ.toExponential(3),maxTargetXZ:+maxTargetXZ.toExponential(3)});
 }finally{rig?.dispose();h.body?.geo.dispose();h.dispose()}
}
console.log(JSON.stringify({footSupport:reports},null,2));
