import assert from 'node:assert/strict';
import * as THREE from 'three';
import {solveLeg} from '../src/leg-ik.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
function chain(scale=1,unequal=false){
 const actor=new THREE.Group(),parent=new THREE.Bone(),upper=new THREE.Bone(),lower=new THREE.Bone(),foot=new THREE.Bone();
 actor.add(parent);parent.add(upper);upper.add(lower);lower.add(foot);
 parent.position.set(.05,1.9*scale,-.03);parent.rotation.set(.05,.10,-.06);
 upper.position.set(.28*scale,0,0);lower.position.set(-.025*scale,-.88*scale,.045*scale);foot.position.set(-.02*scale,-(unequal?.59:.82)*scale,-.025*scale);
 return {actor,parent,upper,lower,foot};
}
let checks=0;
for(const size of [.4,1,2.4])for(const transformed of [false,true]){
 const c=chain(size);if(transformed){c.actor.position.set(2,-.7,4);c.actor.rotation.set(.23,-.55,.09);c.actor.scale.setScalar(1.7)}
 const local=[c.upper.position.clone(),c.lower.position.clone(),c.foot.position.clone()];
 const targets=[V(.30*size,.37*size,.08*size),V(.20*size,.45*size,.28*size),V(.40*size,.32*size,-.11*size)];
 for(const target of targets){const result=solveLeg(c.upper,c.lower,c.foot,target,c.actor);assert(result.reachable);assert(result.error<size*1e-6,`Alvo não atingido: ${result.error}`);assert(result.target.distanceTo(target)<size*1e-6);assert(c.upper.position.equals(local[0])&&c.lower.position.equals(local[1])&&c.foot.position.equals(local[2]));
  c.actor.updateMatrixWorld(true);const rootInverse=c.actor.matrixWorld.clone().invert(),hip=c.upper.getWorldPosition(V()).applyMatrix4(rootInverse),knee=c.lower.getWorldPosition(V()).applyMatrix4(rootInverse),ankle=c.foot.getWorldPosition(V()).applyMatrix4(rootInverse);assert(Math.abs(hip.distanceTo(knee)-local[1].length())<size*1e-6);assert(Math.abs(knee.distanceTo(ankle)-local[2].length())<size*1e-6);checks++;
 }
 const far=solveLeg(c.upper,c.lower,c.foot,V(.3*size,-4*size,0),c.actor);assert(!far.reachable);assert(Number.isFinite(far.error));checks++;
}
const c=chain(1,true);c.actor.updateMatrixWorld(true);const intoRoot=c.actor.matrixWorld.clone().invert(),hip=c.upper.getWorldPosition(V()).applyMatrix4(intoRoot);
for(const target of [hip.clone(),hip.clone().add(V(0,0,4)),hip.clone().add(V(0,0,-4))]){const r=solveLeg(c.upper,c.lower,c.foot,target,c.actor,V(0,0,1));assert(Number.isFinite(r.error));assert(c.upper.quaternion.toArray().every(Number.isFinite));assert(c.lower.quaternion.toArray().every(Number.isFinite));checks++}
console.log(`OK: IK de dois ossos, ${checks} alvos/limites, proporções, transformação do ator e posições locais preservadas.`);
