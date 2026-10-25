// Continuidade da captura e dos clipes; testes técnicos não aprovam a estética.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {MOTIONS,motionPose} from '../src/motions.js';
import {MOCAP} from '../src/mocap-data.js';
import {BODY_BONES,buildBodyRig} from '../src/body-rig.js';
import {buildHead} from '../src/head.js';
import {buildBody,headScale} from '../src/body.js';
import {defaultLook,headOpts} from '../src/look.js';
import {PRESETS} from '../src/presets.js';
const V=a=>new THREE.Vector3(...a),Q=a=>new THREE.Quaternion(...a).normalize(),reports=[],selected=process.env.MOTION_IDS?.split(',')||Object.keys(MOTIONS);
function channels(pose){
 const c=pose.capture,result={};
 for(const name of ['root'])result[name]={type:'position',value:c[name]};
 for(const group of ['directions','feet','orientations','handFrames','footFrames'])for(const [name,value]of Object.entries(c[group]))result[group+'.'+name]={type:value.length===4?'orientation':group==='directions'?'direction':'position',value};
 return result;
}
function distance(a,b){return a.type==='orientation'?Q(a.value).angleTo(Q(b.value)):a.type==='direction'?V(a.value).angleTo(V(b.value)):V(a.value).distanceTo(V(b.value))}
function velocity(a,b,dt){
 if(a.type==='orientation'){
  const q=Q(a.value).invert().multiply(Q(b.value));if(q.w<0)q.set(-q.x,-q.y,-q.z,-q.w);
  const length=Math.hypot(q.x,q.y,q.z),angle=2*Math.atan2(length,q.w);
  return length<1e-10?new THREE.Vector3():new THREE.Vector3(q.x,q.y,q.z).multiplyScalar(angle/length/dt);
 }
 return V(b.value).sub(V(a.value)).divideScalar(dt);
}
for(const id of selected){
 const def=MOTIONS[id];assert(def,'Movimento desconhecido no filtro: '+id);
 const clip=MOCAP[id];assert(clip&&clip.frames.length>=2,id+': captura ausente');assert.equal(def.duration,clip.duration);assert.equal(def.loop,clip.loop);
 assert(def.duration>0&&Number.isFinite(def.duration));
 let maxPositionStep=0,maxDirectionStep=0,maxOrientationStep=0,maxKnotVelocityChange=0;
 const sample=t=>channels(motionPose(id,t));
 const zero=sample(0),end=sample(def.duration);
 for(let i=0;i<=Math.ceil(def.duration*60);i++){
  const t=Math.min(def.duration,i/60),a=sample(t),b=sample(Math.min(def.duration,t+1/60));
  for(const [name,channel]of Object.entries(a)){
   assert(channel.value.every(Number.isFinite),id+'/'+name+': valor inválido');
   if(channel.type==='orientation')assert(Math.abs(new THREE.Quaternion(...channel.value).length()-1)<1e-5,id+'/'+name+': quaternion não unitário');
   if(channel.type==='direction')assert(Math.abs(V(channel.value).length()-1)<1e-5,id+'/'+name+': direção não unitária');
   const step=distance(channel,b[name]);
   if(channel.type==='position'){maxPositionStep=Math.max(maxPositionStep,step);assert(step<.10,id+'/'+name+': translação saltou '+step+' comprimentos de perna/quadro em '+t+' s')}
   else if(channel.type==='direction'){maxDirectionStep=Math.max(maxDirectionStep,step);assert(step<.50,id+'/'+name+': segmento saltou '+step+' rad/quadro')}
   else{maxOrientationStep=Math.max(maxOrientationStep,step);assert(step<.60,id+'/'+name+': orientação saltou '+step+' rad/quadro')}
  }
 }
 // A interpolação precisa unir as velocidades nas chaves da captura, inclusive
 // na emenda do ciclo. Medir quaternion evita falsos saltos entre q e -q.
 const h=1e-5,count=clip.frames.length-1;
 for(let i=def.loop?0:1;i<count;i++){
  const t=i/count*def.duration,a=sample(t-h),b=sample(t),c=sample(t+h);
  for(const [name,channel]of Object.entries(b)){
   const change=velocity(a[name],channel,h).distanceTo(velocity(channel,c[name],h));
   maxKnotVelocityChange=Math.max(maxKnotVelocityChange,change);
   assert(change<(channel.type==='position'?.05:.25),id+'/'+name+': velocidade descontínua em '+t+' s: '+change);
  }
 }
 if(def.loop){
  for(const name of Object.keys(zero))assert(distance(zero[name],end[name])<1e-6,id+'/'+name+': ciclo não fecha');
  const a=sample(-.13),b=sample(def.duration-.13);for(const name of Object.keys(a))assert(distance(a[name],b[name])<1e-6,id+': fase negativa difere');
 }else{
  const before=sample(def.duration-h),after=sample(def.duration+1),earlier=sample(-1);
  for(const [name,channel]of Object.entries(end)){
   assert(distance(channel,after[name])<1e-6,id+'/'+name+': pose final não se mantém');
   assert(velocity(before[name],channel,h).length()<(channel.type==='position'?.015:.05),id+'/'+name+': final interrompe o movimento');
   assert(distance(zero[name],earlier[name])<1e-6,id+'/'+name+': tempo anterior altera a primeira pose');
  }
 }
 reports.push({id,loop:def.loop,maxPositionStep:+maxPositionStep.toFixed(5),maxDirectionStep:+maxDirectionStep.toFixed(5),maxOrientationStep:+maxOrientationStep.toFixed(5),maxKnotVelocityChange:+maxKnotVelocityChange.toFixed(5)});
}

// Os clipes devem conservar a continuidade ao gravar a solução no GLB.
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const id='nico_inventor',look=defaultLook(id),head=buildHead(id,{}, {quality:.3,...headOpts(look,PRESETS[id])});head.root=new THREE.Group();head.root.add(head.group);let rig;
try{
 const scale=headScale(id),body=buildBody(head.fit,id,{cell:.09,headScale:scale}),pivot=body.pivot;
 head.group.scale.setScalar(scale);head.group.position.copy(pivot).multiplyScalar(1-scale);const mesh=new THREE.Mesh(body.geo,head.group.getObjectByName('Head_Skin').material);mesh.name='Body';head.body={...body,mesh};head.root.add(mesh);
 rig=buildBodyRig(head);const clips=rig.makeClips();assert.equal(clips.length,Object.keys(MOTIONS).length);
 for(const clip of clips){
  const key=clip.name.replace(/^Body_/,''),def=MOTIONS[key];assert(def);assert(Math.abs(clip.duration-def.duration)<1e-5);
  if(!selected.includes(key))continue;
  for(const track of clip.tracks){
   assert(Array.from(track.values).every(Number.isFinite),clip.name+'/'+track.name+': chave inválida');
   for(let i=1;i<track.times.length;i++)assert(track.times[i]>track.times[i-1]);
   if(track.name.endsWith('.quaternion')){
    const a=new THREE.Quaternion(),b=new THREE.Quaternion();
    for(let i=0;i<track.times.length;i++){a.fromArray(track.values,i*4);assert(Math.abs(a.length()-1)<1e-3)}
    for(let i=1;i<track.times.length;i++){a.fromArray(track.values,(i-1)*4).normalize();b.fromArray(track.values,i*4).normalize();assert(a.angleTo(b)<.65,clip.name+'/'+track.name+': salto na exportação '+a.angleTo(b)+' rad entre '+track.times[i-1]+' e '+track.times[i]+' s')}
    if(def.loop){a.fromArray(track.values,0).normalize();b.fromArray(track.values,track.values.length-4).normalize();assert(a.angleTo(b)<1e-5,clip.name+'/'+track.name+': ciclo exportado aberto')}
   }else if(track.name==='Rig_Root.position'){
    const a=new THREE.Vector3(),b=new THREE.Vector3(),legLength=body.joints.hip.distanceTo(body.joints.knee)+body.joints.knee.distanceTo(body.joints.ankle);
    for(let i=1;i<track.times.length;i++){a.fromArray(track.values,(i-1)*3);b.fromArray(track.values,i*3);assert(a.distanceTo(b)<legLength*.12,clip.name+': raiz teletransportou na exportação')}
    if(def.loop){a.fromArray(track.values,0);b.fromArray(track.values,track.values.length-3);assert(a.distanceTo(b)<legLength*1e-5)}
   }
  }
 }
 console.log(JSON.stringify({captureContinuity:reports,exportedClips:clips.map(c=>c.name),bones:BODY_BONES.length},null,2));
}finally{rig?.dispose();head.body?.geo.dispose();head.dispose()}
