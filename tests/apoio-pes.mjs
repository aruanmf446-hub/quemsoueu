// Trajetórias capturadas nos rigs reais: passos e pivôs não são âncoras fixas.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildHead} from '../src/head.js';
import {buildBody,headScale} from '../src/body.js';
import {buildBodyRig} from '../src/body-rig.js';
import {motionPose,MOTIONS} from '../src/motions.js';
import {defaultLook,headOpts} from '../src/look.js';
import {PRESETS} from '../src/presets.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),reports=[],failures=[];
for(const id of process.env.FOOT_IDS?.split(',')||['nico_inventor','nana_explorer','alchemist_villain']){
 const look=defaultLook(id),head=buildHead(id,{}, {quality:.3,...headOpts(look,PRESETS[id])});head.root=new THREE.Group();head.root.add(head.group);let rig;
 try{
  const scale=headScale(id),body=buildBody(head.fit,id,{cell:.09,headScale:scale}),pivot=body.pivot;
  head.group.scale.setScalar(scale);head.group.position.copy(pivot).multiplyScalar(1-scale);const mesh=new THREE.Mesh(body.geo,head.group.getObjectByName('Head_Skin').material);mesh.name='Body';head.body={...body,mesh};head.root.add(mesh);
  if(id==='nana_explorer'){head.root.position.set(2,.8,-3);head.root.rotation.set(.08,.45,-.04);head.root.scale.setScalar(1.2)}
  rig=buildBodyRig(head);const legLength=body.joints.hip.distanceTo(body.joints.knee)+body.joints.knee.distanceTo(body.joints.ankle);
  // Também exercitar transformação feita depois da vinculação.
  if(id==='nico_inventor'){head.root.position.set(-3,1.4,2);head.root.rotation.set(.06,-.35,.04);head.root.scale.setScalar(.9);head.root.updateMatrixWorld(true)}
  const rootPosition=bone=>bone.getWorldPosition(V()).applyMatrix4(head.root.matrixWorld.clone().invert());
  const rest=Object.fromEntries(['L','R'].map(side=>[side,rootPosition(rig.bones['Foot_'+side])]));
  const positionAttribute=rig.meshes[0].geometry.attributes.position,footVertices={L:[],R:[]};
  for(let i=0;i<positionAttribute.count;i++){
   const point=V().fromBufferAttribute(positionAttribute,i),side=point.x>=0?'L':'R';
   if(point.y<rest[side].y-legLength*.025)footVertices[side].push(i);
  }
  // Amostrar a sola da malha, independentemente dos pontos usados pelo solver.
  for(const side of ['L','R']){const all=footVertices[side];footVertices[side]=all.filter((_,i)=>i%Math.max(1,Math.floor(all.length/24))===0);assert(all.length>5,id+': sola ausente')}
  let maxTargetXZ=0,maxSolePenetration=0,maxArmDirectionError=0,groundedSamples=0,liftSamples=0,totalSamples=0,worstTarget=null;const motions={};
  for(const motion of Object.keys(MOTIONS)){
   const stats=motions[motion]={maxTargetXZ:0,maxArmDirectionError:0,maxSolePenetration:0,failures:0};
   rig.play(motion);rig.pause();
   const count=Math.ceil(MOTIONS[motion].duration*30);
   for(let i=0;i<=count;i++){
    const t=i/count*MOTIONS[motion].duration,pose=motionPose(motion,t),capture=pose.capture;rig.seek(t);head.root.updateMatrixWorld(true);rig.skeleton.update();
    const soles={};
    for(const side of ['L','R']){
     const source=capture.feet[side],reference=pose.restFeet[side],target=rest[side].clone().addScaledVector(V(source[0]-reference[0],source[1],source[2]-reference[2]),legLength),actual=rootPosition(rig.bones['Foot_'+side]);
     assert(actual.toArray().every(Number.isFinite),id+'/'+motion+': tornozelo inválido');
     const error=Math.hypot(actual.x-target.x,actual.z-target.z)/legLength;
     stats.maxTargetXZ=Math.max(stats.maxTargetXZ,error);
     if(error>maxTargetXZ){maxTargetXZ=error;worstTarget={motion,time:t,side,error}}
     if(error>.01){failures.push({id,motion,time:t,side,kind:'targetXZ',error});stats.failures++}
     // Conferir direções efetivas, não igualdade de quaternions entre poses A
     // diferentes. A medição usa articulações reais após aplicar toda a pose.
     const shoulder=rootPosition(rig.bones['UpperArm_'+side]),elbow=rootPosition(rig.bones['LowerArm_'+side]),wrist=rootPosition(rig.bones['Hand_'+side]);
     for(const [name,from,to]of [['UpperArm_',shoulder,elbow],['LowerArm_',elbow,wrist]]){
      const angle=to.clone().sub(from).normalize().angleTo(V(...capture.directions[name+side]));
      maxArmDirectionError=Math.max(maxArmDirectionError,angle);stats.maxArmDirectionError=Math.max(stats.maxArmDirectionError,angle);
      assert(angle<1e-5,id+'/'+motion+'/'+name+side+': direção anatômica divergente '+angle+' rad');
     }
     const upper=rig.bones['UpperLeg_'+side],lower=rig.bones['LowerLeg_'+side],foot=rig.bones['Foot_'+side];
     const thigh=rootPosition(lower).distanceTo(rootPosition(upper)),shin=rootPosition(foot).distanceTo(rootPosition(lower));
     assert(Math.abs(thigh-body.joints.hip.distanceTo(body.joints.knee))<legLength*1e-6,id+': coxa mudou de comprimento');
     assert(Math.abs(shin-body.joints.knee.distanceTo(body.joints.ankle))<legLength*1e-6,id+': canela mudou de comprimento');
     const intoRoot=head.root.matrixWorld.clone().invert();let low=Infinity;
     for(const index of footVertices[side])low=Math.min(low,rig.meshes[0].getVertexPosition(index,V()).applyMatrix4(rig.meshes[0].matrixWorld).applyMatrix4(intoRoot).y);
     soles[side]=(low-body.ySole)/legLength;maxSolePenetration=Math.max(maxSolePenetration,-soles[side]);
     stats.maxSolePenetration=Math.max(stats.maxSolePenetration,-soles[side]);
     if(soles[side]<-.06)failures.push({id,motion,time:t,side,kind:'solePenetration',depth:-soles[side]});
     if(capture.clearance[side]<.025)groundedSamples++;
     if(capture.clearance[side]>.08&&source[1]>.05){liftSamples++;if(actual.y-rest[side].y<legLength*.015)failures.push({id,motion,time:t,side,kind:'liftLost',height:(actual.y-rest[side].y)/legLength})}
     totalSamples++;
    }
   }
  }
  assert(groundedSamples>120,id+': nenhuma fase de contato exercitada');assert(liftSamples>0,id+': nenhum passo elevado exercitado');
  rig.stop();head.root.updateMatrixWorld(true);for(const side of ['L','R'])assert(rootPosition(rig.bones['Foot_'+side]).distanceTo(rest[side])<legLength*1e-6,id+': parar não restaura os pés');
  reports.push({id,totalSamples,groundedSamples,liftSamples,maxTargetXZ:+maxTargetXZ.toFixed(6),maxSolePenetration:+maxSolePenetration.toFixed(6),maxArmDirectionError:+maxArmDirectionError.toExponential(3),worstTarget,motions});
 }finally{rig?.dispose();head.body?.geo.dispose();head.dispose()}
}
console.log(JSON.stringify({footTrajectories:reports,failures:failures.length,firstFailures:failures.slice(0,12)},null,2));
assert.equal(failures.length,0,'Trajetória/contato dos pés falhou: '+JSON.stringify(failures.slice(0,12)));
