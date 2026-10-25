// Direções anatômicas reais, espelhamento e preservação da cadeia de autoria.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {orientChain} from '../src/direction-retarget.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),cases=[];
function fixture(side=1){
 const scene=new THREE.Group(),actor=new THREE.Group(),chest=new THREE.Bone(),upper=new THREE.Bone(),lower=new THREE.Bone(),end=new THREE.Bone();scene.add(actor);actor.add(chest);chest.add(upper);upper.add(lower);lower.add(end);
 chest.position.set(0,2,.1);upper.position.set(side*.8,.15,0);lower.position.set(side*.7,-.8,.02);end.position.set(side*.5,-.7,.16);end.rotation.set(.12,-.18,.2);return {scene,actor,chest,upper,lower,end};
}
for(const side of [1,-1])for(const transformed of [false,true]){
 const f=fixture(side),{scene,actor,chest,upper,lower,end}=f;
 if(transformed){scene.position.set(4,-2,3);scene.rotation.set(.2,-.3,.15);scene.scale.set(1.2,.8,1.1);actor.position.set(-3,.7,2);actor.rotation.set(-.12,.6,-.3);actor.scale.set(1.3,.9,1.1)}
 chest.rotation.set(.15,-.22,.12);
 const positions=[upper,lower,end].map(b=>b.position.clone()),scales=[upper,lower,end].map(b=>b.scale.clone()),endQuaternion=end.quaternion.clone(),l1=lower.position.length(),l2=end.position.length();
 const poses=[[V(side*.1,-1,.1),V(side*.2,-.4,1)],[V(side*.9,.4,.2),V(side*.2,1,-.1)],[V(-side*.7,-.2,1),V(side*.8,-.3,.5)],[V(side*.4,.6,-.3),V(-side*.2,-.7,-.3)],[lower.position.clone().negate(),end.position.clone().negate()]];
 for(let i=0;i<80;i++)poses.push([V(Math.sin(i*.61+side),Math.cos(i*.31),Math.sin(i*.27+.3)),V(Math.cos(i*.51),Math.sin(i*.73+side),Math.cos(i*.41))]);
 for(let i=0;i<poses.length;i++){
  if(i===2){actor.position.add(V(2,-.8,.3));actor.rotation.y+=.4}
  const [a,b]=poses[i],a0=a.clone(),b0=b.clone(),result=orientChain(upper,lower,end,a,b,actor);
  assert(result.upperDirection.distanceTo(a.clone().normalize())<1e-7,'Direção superior não corresponde ao alvo');assert(result.lowerDirection.distanceTo(b.clone().normalize())<1e-7,'Direção inferior não corresponde ao alvo');assert(a.equals(a0)&&b.equals(b0),'Retarget modificou os alvos');
  for(const [j,bone]of [upper,lower,end].entries()){assert(bone.position.equals(positions[j]),'Posição local modificada');assert(bone.scale.equals(scales[j]),'Escala local modificada')}
  assert(end.quaternion.equals(endQuaternion),'Orientação do punho/pé foi sobrescrita');
  const intoActor=actor.matrixWorld.clone().invert(),points=[upper,lower,end].map(bone=>V().setFromMatrixPosition(bone.matrixWorld).applyMatrix4(intoActor));assert(Math.abs(points[0].distanceTo(points[1])-l1)<1e-7,'Comprimento superior mudou');assert(Math.abs(points[1].distanceTo(points[2])-l2)<1e-7,'Comprimento inferior mudou');
  const quaternions=[upper,lower].map(bone=>bone.quaternion.clone());orientChain(upper,lower,end,a,b,actor);for(const [j,bone]of [upper,lower].entries())assert(bone.quaternion.angleTo(quaternions[j])<1e-6,'Aplicação repetida acumulou rotação');
 }
 cases.push({side,transformed,poses:poses.length});
}
const f=fixture();assert.throws(()=>orientChain(f.upper,f.lower,f.end,V(),V(0,1,0),f.actor),/Direção inválida/);assert.throws(()=>orientChain(f.upper,f.lower,f.end,V(NaN,1,0),V(0,1,0),f.actor),/Direção inválida/);assert.throws(()=>orientChain(f.upper,f.end,f.lower,V(1,0,0),V(0,1,0),f.actor),/cadeia direta/);
console.log(JSON.stringify({directionRetarget:cases,totalPoses:cases.reduce((n,c)=>n+c.poses,0),invalidInputs:3},null,2));
