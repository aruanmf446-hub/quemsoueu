// IK analítica de dois segmentos. O alvo e a direção do joelho estão no espaço
// do personagem; os deslocamentos locais dos ossos nunca são modificados.
import * as THREE from 'three';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);

export function solveLeg(upper,lower,foot,targetRoot,actorRoot,poleRoot=V(0,0,1)){
 if(lower.parent!==upper||foot.parent!==lower)throw new Error('IK exige uma cadeia direta de três ossos');
 actorRoot.updateMatrixWorld(true);
 const parent=upper.parent,parentWorld=parent.matrixWorld,intoParent=parentWorld.clone().invert().multiply(actorRoot.matrixWorld);
 const hip=upper.position.clone(),target=targetRoot.clone().applyMatrix4(intoParent),direction=target.clone().sub(hip);
 // O rig de autoria usa escala uniforme nos ossos. A escala/rotação do ator e
 // de seus pais é removida antes da solução, sem supor que o mundo seja neutro.
 const upperScale=Math.abs(upper.scale.x),lowerScale=Math.abs(lower.scale.x),upperRest=lower.position.clone(),lowerRest=foot.position.clone();
 const l1=upperRest.length()*upperScale,l2=lowerRest.length()*upperScale*lowerScale;
 if(l1<1e-9||l2<1e-9)throw new Error('IK exige segmentos de comprimento positivo');
 const rawDistance=direction.length(),epsilon=(l1+l2)*1e-7,minReach=Math.abs(l1-l2),maxReach=l1+l2;
 if(rawDistance>epsilon)direction.multiplyScalar(1/rawDistance);
 else{
  direction.copy(upperRest).add(lowerRest).normalize();
  if(direction.lengthSq()<.5)direction.set(0,-1,0);
 }
 const distance=THREE.MathUtils.clamp(rawDistance,minReach+epsilon,maxReach-epsilon),effectiveTarget=hip.clone().addScaledVector(direction,distance);
 const pole=poleRoot.clone().transformDirection(intoParent);pole.addScaledVector(direction,-pole.dot(direction));
 if(pole.lengthSq()<1e-12){pole.copy(Math.abs(direction.x)<.8?V(1,0,0):V(0,1,0)).addScaledVector(direction,-pole.dot(direction))}
 pole.normalize();
 const along=(l1*l1-l2*l2+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along));
 const knee=hip.clone().addScaledVector(direction,along).addScaledVector(pole,height);
 upper.quaternion.setFromUnitVectors(upperRest.normalize(),knee.clone().sub(hip).normalize());
 const lowerDirection=effectiveTarget.clone().sub(knee).applyQuaternion(upper.quaternion.clone().invert()).normalize();
 lower.quaternion.setFromUnitVectors(lowerRest.normalize(),lowerDirection);
 actorRoot.updateMatrixWorld(true);
 const intoRoot=actorRoot.matrixWorld.clone().invert(),actual=foot.getWorldPosition(V()).applyMatrix4(intoRoot);
 const parentToRoot=intoRoot.multiply(parentWorld);
 return {reachable:rawDistance>=minReach-epsilon&&rawDistance<=maxReach+epsilon,error:actual.distanceTo(targetRoot),target:effectiveTarget.applyMatrix4(parentToRoot),knee:knee.applyMatrix4(parentToRoot)};
}
