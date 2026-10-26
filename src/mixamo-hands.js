// Folga da mão inteira, medida na malha do modelo. Só resolve braços/punhos;
// as trilhas já aprovadas de pernas, quadril, tronco e cabeça ficam intactas.
import * as THREE from 'three';
import {ConvexHull} from 'three/addons/math/ConvexHull.js';
import {solveMixamoLeg} from './mixamo-leg-ik.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),Q=()=>new THREE.Quaternion();
const SIDES=['Left','Right'];

function hull(points){
  const result=new ConvexHull().setFromPoints(points),vertices=new Set();
  for(const face of result.faces){let e=face.edge;do{vertices.add(e.head().point);e=e.next}while(e!==face.edge)}
  return {points:[...vertices],planes:result.faces.map(f=>({n:f.normal.clone(),c:-f.constant}))};
}

export function createHandClearance(actor,nodes,position,meshes){
  const restInverse=actor.matrixWorld.clone().invert(),points=[];
  for(const mesh of meshes.filter(m=>m.isSkinnedMesh)){
    const I=mesh.geometry.attributes.skinIndex,W=mesh.geometry.attributes.skinWeight;
    for(let i=0;i<I.count;i++){
      const weights={};for(let k=0;k<4;k++){const name=mesh.skeleton.bones[I.getComponent(i,k)].name.replace(/^mixamorig[:_]?/i,'');weights[name]=(weights[name]||0)+W.getComponent(i,k)}
      const p=mesh.getVertexPosition(i,V()).applyMatrix4(mesh.matrixWorld).applyMatrix4(restInverse);points.push({p,weights});
    }
  }
  const localMatrix=bone=>bone.matrixWorld.clone().invert().multiply(actor.matrixWorld);
  const hands=SIDES.map(side=>{
    const bone=nodes[side+'Hand'],into=localMatrix(bone),surface=points.filter(p=>(p.weights[side+'Hand']||0)>.85).map(p=>p.p.clone().applyMatrix4(into));
    if(surface.length<12)throw Error('Malha insuficiente para medir a mão: '+side);
    return {side,bone,points:hull(surface).points};
  });
  const obstacles=[];let margin=.008;
  function obstacle(name,bone,selected){
    if(selected.length<4)return;const into=localMatrix(bone),shape=hull(selected.map(p=>p.p.clone().applyMatrix4(into)));
    obstacles.push({name,bone,planes:shape.planes});
  }
  const torso=p=>['Hips','Spine','Spine1','Spine2'].reduce((sum,n)=>sum+(p.weights[n]||0),0);
  obstacle('pelvis',nodes.Hips,points.filter(p=>torso(p)>.5&&p.p.y<position(nodes.Spine1).y));
  obstacle('chest',nodes.Spine1,points.filter(p=>torso(p)>.5&&p.p.y>position(nodes.Spine).y));
  for(const side of SIDES)for(const part of ['UpLeg','Leg'])obstacle(side+part,nodes[side+part],points.filter(p=>(p.weights[side+part]||0)>.4));
  // O cabelo volumoso não define o contorno da face. A região facial medida
  // recebe também um corredor frontal para que afastar a palma não esconda os olhos.
  const head=position(nodes.Head),face=points.filter(p=>(p.weights.Head||0)>.85&&Math.abs(p.p.x-head.x)<.068&&p.p.y<head.y+.105&&p.p.z>head.z-.04);
  obstacle('head',nodes.Head,face);
  const hipRest=actor.getWorldQuaternion(Q()).invert().multiply(nodes.Hips.getWorldQuaternion(Q()));
  const headRest=actor.getWorldQuaternion(Q()).invert().multiply(nodes.Head.getWorldQuaternion(Q()));
  const eyeGuard=[];
  for(const x of [-.086,.086])for(const y of [.005,.115])for(const z of [.005,.40])eyeGuard.push({p:head.clone().add(V(x,y,z))});
  obstacle('eyes',nodes.Head,eyeGuard);

  function rootQuaternion(bone){return actor.getWorldQuaternion(Q()).invert().multiply(bone.getWorldQuaternion(Q()))}
  function surface(hand){const m=actor.matrixWorld.clone().invert().multiply(hand.bone.matrixWorld);return hand.points.map(p=>p.clone().applyMatrix4(m))}
  function anatomical(bone,rest,v){return v.applyQuaternion(rootQuaternion(bone).multiply(rest.clone().invert()))}
  // Support planes test a whole convex hand, including fingertips and thumb.
  // A positive separating plane proves clearance. Smooth normals at adjacent
  // faces avoid a changing nearest triangle snapping the elbow from side to side.
  function displacement(surface,body,preferred){
    const padding=/(UpLeg|Leg)$/.test(body.name)?margin*2.25:margin,into=localMatrix(body.bone),local=surface.map(p=>p.clone().applyMatrix4(into)),rows=[];let separation=-Infinity;
    for(const plane of body.planes){let d=Infinity;for(const p of local)d=Math.min(d,plane.n.dot(p)+plane.c);rows.push({n:plane.n,d});separation=Math.max(separation,d)}
    if(separation>=padding)return V();
    // Face visibility is an intentional gesture edit: move to the corresponding
    // temple, not merely towards the camera. All other contacts use surface normals.
    if(body.name==='eyes'||/(UpLeg|Leg)$/.test(body.name)){
      const direction=preferred.clone().transformDirection(into);let travel=Infinity;
      for(const {n,d}of rows){const dot=n.dot(direction);if(dot>.1)travel=Math.min(travel,(padding-d)/dot)}
      if(Number.isFinite(travel))return preferred.clone().multiplyScalar(Math.max(0,travel));
    }
    const normal=V(),soft=.004;
    for(const {n,d}of rows)normal.addScaledVector(n,Math.exp((d-separation)/soft));
    if(normal.lengthSq()<1e-10)normal.copy(preferred).transformDirection(into);
    normal.normalize();let travel=Infinity;
    for(const {n,d}of rows){const dot=n.dot(normal);if(dot>.05)travel=Math.min(travel,(padding-d)/dot)}
    return normal.transformDirection(actor.matrixWorld.clone().invert().multiply(body.bone.matrixWorld)).multiplyScalar(Math.max(0,travel));
  }
  function move(hand,offset){
    if(offset.lengthSq()<1e-12)return;
    const side=hand.side,upper=nodes[side+'Arm'],lower=nodes[side+'ForeArm'],wrist=hand.bone,end=position(wrist);
    solveMixamoLeg(upper,lower,wrist,end.add(offset),actor,hand.pole,hand.authored);
    const orientation=hand.orientation;
    wrist.quaternion.copy(wrist.parent.getWorldQuaternion(Q()).invert().multiply(orientation));wrist.updateWorldMatrix(false,true);
  }
  function align(hand){
    const side=hand.side,forearm=position(hand.bone).sub(position(nodes[side+'ForeArm'])).normalize(),index=position(nodes[side+'HandIndex1']).sub(position(hand.bone)).normalize(),angle=forearm.angleTo(index),limit=THREE.MathUtils.degToRad(35);
    if(angle<=limit)return;
    const correction=Q().setFromUnitVectors(index,forearm),weight=(angle-limit)/angle,desired=Q().slerp(correction,weight).multiply(rootQuaternion(hand.bone));
    hand.bone.quaternion.copy(rootQuaternion(hand.bone.parent).invert().multiply(desired));hand.bone.updateWorldMatrix(false,true);
  }
  function pair(left,right){
    const l=hull(left),r=hull(right);let separation=-Infinity,normal=V();
    for(const [a,b,sign]of [[l,right,1],[r,left,-1]])for(const plane of a.planes){let d=Infinity;for(const p of b)d=Math.min(d,plane.n.dot(p)+plane.c);if(d>separation){separation=d;normal.copy(plane.n).multiplyScalar(-sign)}}
    const handMargin=margin*2;
    if(separation>=handMargin)return V();
    return normal.multiplyScalar((handMargin-separation)*.55);
  }
  return function apply({iterations=7,clearance=.008}={}){
    margin=clearance;const faceContacts=new Set();
    for(const hand of hands){
      const upper=nodes[hand.side+'Arm'],lower=nodes[hand.side+'ForeArm'],shoulder=position(upper),elbow=position(lower),axis=position(hand.bone).sub(shoulder).normalize(),pole=elbow.sub(shoulder);
      pole.addScaledVector(axis,-pole.dot(axis));if(pole.lengthSq()<1e-10)pole.set(hand.side==='Left'?1:-1,-1,0);
      hand.pole=pole.normalize();hand.authored={upper:upper.quaternion.clone(),lower:lower.quaternion.clone()};hand.orientation=hand.bone.getWorldQuaternion(Q());
    }
    for(let iteration=0;iteration<iterations;iteration++){
      let changed=false;
      for(const hand of hands){
        align(hand);let shape=surface(hand);
        for(const body of obstacles){
          const leg=/(UpLeg|Leg)$/.test(body.name),lateral=anatomical(leg?nodes.Hips:nodes.Head,leg?hipRest:headRest,V(hand.side==='Left'?1:-1,0,0)),offset=displacement(shape,body,lateral);
          if(offset.lengthSq()>1e-10){if(body.name==='eyes')faceContacts.add(hand.side);move(hand,offset);align(hand);shape=surface(hand);changed=true}
        }
      }
      const offset=pair(surface(hands[0]),surface(hands[1]));
      if(offset.lengthSq()>1e-10){faceContacts.pair=true;move(hands[0],offset);move(hands[1],offset.clone().negate());changed=true}
      if(!changed)break;
    }
    actor.updateMatrixWorld(true);return faceContacts;
  };
}
