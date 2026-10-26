// Alguns GLBs de rig omitem o TRS dos nós. Reconstrói o repouso a partir
// das matrizes inversas, inclusive quando há nós intermediários sem peso.
import * as THREE from 'three';
export function restoreImportedBindPose(scene,{rotationY=0}={}){
  const bindings=new Map();scene.updateMatrixWorld(true);
  // Correção explícita do referencial do rig quando difere do da geometria.
  // As duas matrizes mudam juntas: o skin continua identidade no repouso.
  if(rotationY){const inverse=new THREE.Matrix4().makeRotationY(-rotationY);scene.traverse(mesh=>{if(mesh.isSkinnedMesh)mesh.skeleton.boneInverses=mesh.skeleton.boneInverses.map(m=>m.clone().multiply(inverse))})}
  scene.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;mesh.skeleton.bones.forEach((bone,i)=>{
    const matrix=mesh.skeleton.boneInverses[i]?.clone().invert();if(!matrix||!matrix.elements.every(Number.isFinite))throw Error('Matriz de vínculo inválida: '+bone.name);
    if(bindings.has(bone)&&!bindings.get(bone).elements.every((v,k)=>Math.abs(v-matrix.elements[k])<1e-5))throw Error('Vínculos conflitantes: '+bone.name);
    bindings.set(bone,matrix);
  })});
  scene.traverse(node=>{const bind=bindings.get(node);if(bind){const local=bind.clone();if(node.parent)local.premultiply(node.parent.matrixWorld.clone().invert());local.decompose(node.position,node.quaternion,node.scale)}node.updateWorldMatrix(false,false)});
  scene.updateMatrixWorld(true);scene.traverse(mesh=>{if(mesh.isSkinnedMesh)mesh.skeleton.update()});
}
