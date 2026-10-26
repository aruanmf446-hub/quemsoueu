// Conserva o roll de autoria dos ossos Mixamo. Alinhar o eixo local +Y
// diretamente à perna descendente perde esse roll e pode dar meia-volta.
import * as THREE from 'three';
import {solveLeg} from './leg-ik.js';
export function solveMixamoLeg(upper,lower,foot,target,actor,pole,rest){
  const result=solveLeg(upper,lower,foot,target,actor,pole);
  const knee=lower.getWorldPosition(new THREE.Vector3()),end=foot.getWorldPosition(new THREE.Vector3());
  function aim(bone,child,point,quaternion){
    const desired=point.clone().applyMatrix4(bone.parent.matrixWorld.clone().invert()).sub(bone.position).normalize();
    const authored=child.position.clone().multiply(bone.scale).applyQuaternion(quaternion).normalize();
    bone.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(authored,desired).multiply(quaternion));
    bone.updateWorldMatrix(false,true);
  }
  aim(upper,lower,knee,rest.upper);aim(lower,foot,end,rest.lower);actor.updateMatrixWorld(true);
  return result;
}
