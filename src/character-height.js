// Altura do personagem completo: a mesma escala nos três eixos, com apoio no chão.
import * as THREE from 'three';
const origins=new WeakMap();
export const CHARACTER_SCALES={frontier_cowboy:.85,cactus_soldier:.85,cactus_soldier_large:.88};
export function normalizeHeight(value=1){const n=Number(value);return Number.isFinite(n)&&n>0?THREE.MathUtils.clamp(n,.6,1.4):1}
export function localCharacterBounds(root){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),box=new THREE.Box3();
 root.traverse(mesh=>{if(!mesh.isMesh||!mesh.visible)return;const geometry=mesh.geometry;if(!geometry.boundingBox)geometry.computeBoundingBox();box.union(geometry.boundingBox.clone().applyMatrix4(inverse.clone().multiply(mesh.matrixWorld)))});
 return box;
}
export function applyCharacterHeight(root,id,value,sole){
 let origin=origins.get(root);if(!origin){origin={position:root.position.clone(),scale:root.scale.clone()};origins.set(root,origin)}
 const height=normalizeHeight(value),factor=height*(CHARACTER_SCALES[id]||1),pivot=new THREE.Vector3(0,sole,0).multiply(origin.scale).applyQuaternion(root.quaternion);
 root.scale.copy(origin.scale).multiplyScalar(factor);root.position.copy(origin.position).addScaledVector(pivot,1-factor);
 root.userData.height=height;root.userData.heightScale=factor;root.updateMatrixWorld(true);return factor;
}
