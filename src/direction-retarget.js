// Retarget de segmentos por direções anatômicas no espaço do personagem.
// O eixo local de um osso não precisa coincidir com a direção de repouso.
import * as THREE from 'three';

function direction(value,label){
 const length=value?.isVector3?Math.hypot(value.x,value.y,value.z):0;
 if(!Number.isFinite(length)||length<1e-8)throw new Error('Direção inválida de '+label);
 return value.clone().multiplyScalar(1/length);
}

export function orientChain(upper,lower,end,upperDirectionRoot,lowerDirectionRoot,actorRoot){
 if(!upper?.parent||lower?.parent!==upper||end?.parent!==lower)throw new Error('Retarget exige uma cadeia direta de três ossos');
 const upperTarget=direction(upperDirectionRoot,'braço/coxa'),lowerTarget=direction(lowerDirectionRoot,'antebraço/perna');
 // A escala própria precede a rotação no TRS. Os deslocamentos de autoria
 // permanecem intactos, inclusive na pose A com segmentos diagonais.
 const upperRest=direction(lower.position.clone().multiply(upper.scale),'segmento superior'),lowerRest=direction(end.position.clone().multiply(lower.scale),'segmento inferior');
 actorRoot.updateWorldMatrix(true,false);upper.parent.updateWorldMatrix(true,false);
 const rootToParent=upper.parent.matrixWorld.clone().invert().multiply(actorRoot.matrixWorld);
 upper.quaternion.setFromUnitVectors(upperRest,upperTarget.transformDirection(rootToParent));
 upper.updateWorldMatrix(false,false);
 const rootToUpper=upper.matrixWorld.clone().invert().multiply(actorRoot.matrixWorld);
 lower.quaternion.setFromUnitVectors(lowerRest,lowerTarget.transformDirection(rootToUpper));
 lower.updateWorldMatrix(false,true);
 // O punho/pé não recebe uma orientação implícita. O chamador pode orientar
 // palma, sola e torção separadamente depois de posicionar os segmentos.
 const intoRoot=actorRoot.matrixWorld.clone().invert(),p=new THREE.Vector3().setFromMatrixPosition(upper.matrixWorld),q=new THREE.Vector3().setFromMatrixPosition(lower.matrixWorld),r=new THREE.Vector3().setFromMatrixPosition(end.matrixWorld);
 return {upperDirection:q.clone().sub(p).transformDirection(intoRoot),lowerDirection:r.sub(q).transformDirection(intoRoot)};
}
