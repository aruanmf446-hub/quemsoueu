// Pequenos afastamentos entre palmas; preserva a orientação capturada dos punhos.
import * as THREE from 'three';
import {solveMixamoLeg} from './mixamo-leg-ik.js';
export function createHandClearance(actor,nodes,position){
  const sides=['Left','Right'],lengths=sides.map(s=>position(nodes[s+'HandIndex1']).distanceTo(position(nodes[s+'Hand']))),spacing=(lengths[0]+lengths[1])*.38;
  const restChest=actor.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(nodes.Spine2.getWorldQuaternion(new THREE.Quaternion()));
  const palm=s=>position(nodes[s+'Hand']).lerp(position(nodes[s+'HandIndex1']),.65);
  return function apply(){
    const palms=sides.map(palm),delta=palms[0].clone().sub(palms[1]),distance=delta.length();if(distance>=spacing)return;
    const chestQ=nodes.Spine2.getWorldQuaternion(new THREE.Quaternion()),rootQ=actor.getWorldQuaternion(new THREE.Quaternion()),normal=new THREE.Vector3(0,.45,1).normalize();
    // O afastamento em profundidade evita trocar as mãos de lado no encontro.
    normal.applyQuaternion(rootQ.clone().invert().multiply(chestQ).multiply(restChest.clone().invert()));
    const biased=delta.clone().addScaledVector(normal,2*spacing*(1-distance/spacing)**2);
    if(biased.lengthSq()<1e-12)biased.copy(normal);biased.normalize().multiplyScalar(spacing);
    const offset=biased.sub(delta).multiplyScalar(.5);
    for(let i=0;i<2;i++){
      const side=sides[i],upper=nodes[side+'Arm'],lower=nodes[side+'ForeArm'],hand=nodes[side+'Hand'],shoulder=position(upper),elbow=position(lower),wrist=position(hand),target=wrist.clone().addScaledVector(offset,i===0?1:-1),axis=wrist.clone().sub(shoulder).normalize(),pole=elbow.clone().sub(shoulder);
      pole.addScaledVector(axis,-pole.dot(axis));if(pole.lengthSq()<1e-10)pole.set(i===0?1:-1,-1,0);pole.normalize();
      const orientation=hand.getWorldQuaternion(new THREE.Quaternion());
      solveMixamoLeg(upper,lower,hand,target,actor,pole,{upper:upper.quaternion.clone(),lower:lower.quaternion.clone()});
      hand.quaternion.copy(hand.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(orientation));hand.updateWorldMatrix(false,true);
    }
    actor.updateMatrixWorld(true);
  };
}
