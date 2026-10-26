// Adapta a captura compartilhada aos eixos e à pose de vínculo do GLB.
// Não recalcula pesos nem modifica vértices, comprimentos ou escalas dos ossos.
import * as THREE from 'three';
import {MOTIONS,motionPose} from './motions.js?v=mocap-1';
import {solveMixamoLeg} from './mixamo-leg-ik.js';
import {createHandClearance} from './mixamo-hands.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),Q=()=>new THREE.Quaternion();
export function bakeMixamoMotions(actor,meshes,{fps=30}={}){
  const nodes={};actor.traverse(o=>{const name=o.name.replace(/^mixamorig[:_]?/i,'');if(name!==o.name)nodes[name]=o});
  const required=['Hips','Spine','Spine1','Spine2','Neck','Head',...['Left','Right'].flatMap(s=>['Arm','ForeArm','Hand','UpLeg','Leg','Foot','ToeBase'].map(n=>s+n))];
  for(const n of required)if(!nodes[n])throw Error('Rig Mixamo incompleto: '+n);
  const saved=required.map(n=>({o:nodes[n],p:nodes[n].position.clone(),q:nodes[n].quaternion.clone(),s:nodes[n].scale.clone()}));
  const skinned=meshes.filter(m=>m.isSkinnedMesh),skeletons=[...new Set(skinned.map(m=>m.skeleton))];
  const refresh=()=>{actor.updateWorldMatrix(true,true);for(const s of skeletons)s.update()};refresh();
  const intoActor=actor.matrixWorld.clone().invert(),actorRotation=actor.getWorldQuaternion(Q()),actorInverse=actorRotation.clone().invert();
  const position=o=>o.getWorldPosition(V()).applyMatrix4(actor.matrixWorld.clone().invert());
  const rest=Object.fromEntries(required.map(n=>[n,{p:position(nodes[n]),localQ:nodes[n].quaternion.clone(),q:actorInverse.clone().multiply(nodes[n].getWorldQuaternion(Q()))}]));
  const legLength=['Left','Right'].reduce((sum,s)=>sum+rest[s+'UpLeg'].p.distanceTo(rest[s+'Leg'].p)+rest[s+'Leg'].p.distanceTo(rest[s+'Foot'].p),0)/2;
  const ankleY=(rest.LeftFoot.p.y+rest.RightFoot.p.y)/2,hipY=(rest.LeftUpLeg.p.y+rest.RightUpLeg.p.y)/2,hipOffset=rest.Hips.p.y-hipY;
  const floorSamples=[];let floor=Infinity;
  for(const m of skinned){const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++){const v=m.getVertexPosition(i,V()).applyMatrix4(m.matrixWorld).applyMatrix4(intoActor);floor=Math.min(floor,v.y);floorSamples.push({m,i,y:v.y})}}
  const soles=floorSamples.filter(p=>p.y<floor+.065),handFrames={};
  for(const side of ['Left','Right']){
    const wrist=rest[side+'Hand'].p,index=nodes[side+'HandIndex1'],thumb=nodes[side+'HandThumb2']||nodes[side+'HandThumb1'];
    if(!index||!thumb)throw Error('Referências da palma ausentes: '+side);
    const along=position(index).sub(wrist).normalize(),towardThumb=position(thumb).sub(wrist);towardThumb.addScaledVector(along,-towardThumb.dot(along)).normalize();
    if(along.lengthSq()<.9||towardThumb.lengthSq()<.9)throw Error('Referências da palma degeneradas: '+side);
    handFrames[side]=Q().setFromRotationMatrix(new THREE.Matrix4().makeBasis(along,towardThumb.clone().cross(along).normalize(),towardThumb));
  }
  function restore(){for(const {o,p,q,s}of saved){o.position.copy(p);o.quaternion.copy(q);o.scale.copy(s)}refresh()}
  function orient(name,q){const bone=nodes[name];bone.parent.updateWorldMatrix(true,false);bone.quaternion.copy(bone.parent.getWorldQuaternion(Q()).invert().multiply(actorRotation.clone().multiply(q)));bone.updateWorldMatrix(false,true)}
  function moveHip(delta){const desired=rest.Hips.p.clone().add(delta).applyMatrix4(actor.matrixWorld).applyMatrix4(nodes.Hips.parent.matrixWorld.clone().invert());nodes.Hips.position.copy(desired);refresh()}
  const correctHands=createHandClearance(actor,nodes,position);
  function sample(id,t){
    restore();const pose=motionPose(id,t),c=pose.capture;
    moveHip(V(c.root[0]*legLength,ankleY+c.root[1]*legLength+hipOffset-rest.Hips.p.y,c.root[2]*legLength));
    for(const [target,source]of [['Hips','Hips'],['Spine','Spine'],['Spine1','Spine'],['Spine2','Chest'],['Neck','Neck'],['Head','Head']])orient(target,Q().fromArray(c.orientations[source]).normalize().multiply(rest[target].q));
    for(const [s,side]of [['L','Left'],['R','Right']]){
      for(const [target,child,source]of [['Arm','ForeArm','UpperArm'],['ForeArm','Hand','LowerArm']]){
        const name=side+target,key=source+'_'+s,direction=rest[side+child].p.clone().sub(rest[name].p).normalize(),correction=Q().setFromUnitVectors(direction,V(...pose.restDirections[key]).normalize());
        orient(name,Q().fromArray(c.orientations[key]).normalize().multiply(correction).multiply(rest[name].q));
      }
      orient(side+'Hand',Q().fromArray(c.handFrames[s]).normalize().multiply(handFrames[side].clone().invert()).multiply(rest[side+'Hand'].q));
    }
    refresh();const targets={};let lowerHip=0;
    for(const [s,side]of [['L','Left'],['R','Right']]){
      const source=c.feet[s],reference=pose.restFeet[s],target=rest[side+'Foot'].p.clone().add(V(source[0]-reference[0],source[1],source[2]-reference[2]).multiplyScalar(legLength));targets[side]=target;
      const hip=position(nodes[side+'UpLeg']),reach=(rest[side+'UpLeg'].p.distanceTo(rest[side+'Leg'].p)+rest[side+'Leg'].p.distanceTo(rest[side+'Foot'].p))*.999,horizontal=(hip.x-target.x)**2+(hip.z-target.z)**2;
      if(horizontal<reach*reach)lowerHip=Math.max(lowerHip,hip.y-target.y-Math.sqrt(reach*reach-horizontal));
    }
    if(lowerHip>0){const delta=position(nodes.Hips).sub(rest.Hips.p);delta.y-=lowerHip;moveHip(delta)}
    for(const [s,side]of [['L','Left'],['R','Right']]){
      const upper=V(...c.directions['UpperLeg_'+s]),lower=V(...c.directions['LowerLeg_'+s]),normal=upper.clone().cross(lower),bend=normal.length(),direction=targets[side].clone().sub(position(nodes[side+'UpLeg'])).normalize(),pole=V(...c.footForward[s]);pole.addScaledVector(direction,-pole.dot(direction)).normalize();
      if(bend>1e-6)pole.lerp(direction.clone().cross(normal).normalize(),THREE.MathUtils.smoothstep(bend,.035,.12));
      solveMixamoLeg(nodes[side+'UpLeg'],nodes[side+'Leg'],nodes[side+'Foot'],targets[side],actor,pole.normalize(),{upper:rest[side+'UpLeg'].localQ,lower:rest[side+'Leg'].localQ});orient(side+'Foot',Q().fromArray(c.footFrames[s]).normalize().multiply(rest[side+'Foot'].q));
    }
    refresh();let low=Infinity;
    for(const {m,i}of soles)low=Math.min(low,m.getVertexPosition(i,V()).applyMatrix4(m.matrixWorld).applyMatrix4(intoActor).y);
    const lift=Math.max(0,Math.min(c.clearance.L,c.clearance.R)-.01)*legLength,delta=position(nodes.Hips).sub(rest.Hips.p);delta.y+=floor-low+lift;moveHip(delta);
    correctHands();
  }
  const animated=required.filter(n=>!n.endsWith('ToeBase')),clips=[];
  try{
    for(const [id,def]of Object.entries(MOTIONS)){
      const times=[],rotations=Object.fromEntries(animated.map(n=>[n,[]])),positions=[],steps=Math.ceil(def.duration*fps);
      for(let i=0;i<=steps;i++){const t=i/steps*def.duration;sample(id,t);times.push(t);for(const n of animated){const q=nodes[n].quaternion.clone().normalize(),values=rotations[n];if(values.length&&q.dot(Q().fromArray(values,values.length-4))<0)q.set(-q.x,-q.y,-q.z,-q.w);values.push(...q.toArray())}positions.push(...nodes.Hips.position.toArray())}
      clips.push(new THREE.AnimationClip('Body_'+id,def.duration,[...animated.map(n=>new THREE.QuaternionKeyframeTrack(nodes[n].name+'.quaternion',times,rotations[n])),new THREE.VectorKeyframeTrack(nodes.Hips.name+'.position',times,positions)]));
    }
  }finally{restore()}
  return clips;
}
