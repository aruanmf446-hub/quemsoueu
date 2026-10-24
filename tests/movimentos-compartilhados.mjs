// Continuidade temporal da coreografia e dos clipes; não mede aprovação artística.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {MOTIONS,motionPose} from '../src/motions.js';
import {BODY_BONES,buildBodyRig} from '../src/body-rig.js';
import {buildHead} from '../src/head.js';
import {buildBody,headScale} from '../src/body.js';
import {defaultLook,headOpts} from '../src/look.js';
import {PRESETS} from '../src/presets.js';

const PI=Math.PI,bones=new Set(BODY_BONES),reports=[];
const rotation=key=>bones.has(key.split('.')[0])||/yaw|angles/i.test(key);
const delta=(key,a,b)=>rotation(key)?Math.atan2(Math.sin(b-a),Math.cos(b-a)):b-a;
function channels(p){
 const result={};
 function walk(value,path){
  // Sinais de contato/fase podem ser discretos; não são transformações.
  if(/(?:^|\.)(?:contact|contacts|support|phase|beat|bpm)(?:\.|$)/i.test(path))return;
  if(typeof value==='number'){assert(Number.isFinite(value),'Canal inválido: '+path);result[path]=value}
  else if(value&&typeof value==='object')for(const [key,child]of Object.entries(value))walk(child,path?path+'.'+key:key);
 }
 walk(p,'');return result;
}
function same(a,b,label,tolerance=1e-7){
 for(const key of new Set([...Object.keys(a),...Object.keys(b)]))assert(Math.abs(delta(key,a[key]||0,b[key]||0))<tolerance,label+'/'+key);
}
const rateLimit=key=>rotation(key)?1.2:key.startsWith('offset.')?.15:key.startsWith('face.')?1:1;
const frameLimit=key=>rotation(key)?.5:key.startsWith('offset.')?.025:key.startsWith('face.')?.3:.15;
for(const [id,def]of Object.entries(MOTIONS)){
 assert(def.duration>0&&Number.isFinite(def.duration),id+': duração inválida');
 const zero=channels(motionPose(id,0)),end=channels(motionPose(id,def.duration));
 let maxFrameChange=0,maxVelocityChange=0;
 // Nenhum membro deve saltar dezenas de graus entre quadros de 60 Hz.
 for(let t=0;t<def.duration;t+=1/60){const a=channels(motionPose(id,t)),b=channels(motionPose(id,Math.min(def.duration,t+1/60)));for(const key of new Set([...Object.keys(a),...Object.keys(b)])){const change=Math.abs(delta(key,a[key]||0,b[key]||0));maxFrameChange=Math.max(maxFrameChange,change);assert(change<frameLimit(key),id+'/'+key+': salto entre quadros '+change)}}
 // Uma inversão instantânea de velocidade não desaparece com renderização rápida.
 // O intervalo pequeno admite aceleração de emote, mas rejeita degraus e clamps.
 const count=Math.ceil(def.duration*240),dt=def.duration/count;
 for(let i=1;i<count;i++){
  const t=i*dt,a=channels(motionPose(id,t-dt)),b=channels(motionPose(id,t)),c=channels(motionPose(id,t+dt));
  for(const key of new Set([...Object.keys(a),...Object.keys(b),...Object.keys(c)])){const change=Math.abs((delta(key,b[key]||0,c[key]||0)-delta(key,a[key]||0,b[key]||0))/dt);maxVelocityChange=Math.max(maxVelocityChange,change);assert(change<rateLimit(key),id+'/'+key+': mudança brusca de velocidade em '+t+' s: '+change)}
 }
 const h=Math.min(1e-4,def.duration/10000);
 if(def.loop){
  same(zero,end,id+': ciclo não fecha');
  same(channels(motionPose(id,-.13)),channels(motionPose(id,def.duration-.13)),id+': tempo negativo não preserva fase');
  const before=channels(motionPose(id,def.duration-h)),after=channels(motionPose(id,h));
  for(const key of new Set([...Object.keys(zero),...Object.keys(before),...Object.keys(after)])){
   const left=delta(key,before[key]||0,zero[key]||0)/h,right=delta(key,zero[key]||0,after[key]||0)/h,limit=rotation(key)?.15:key.startsWith('offset.')?.02:.15;
   assert(Math.abs(right-left)<limit,id+'/'+key+': emenda muda a velocidade '+Math.abs(right-left));
  }
 }else{
  same(zero,channels(motionPose(id,-1)),id+': antecipação anterior ao início');
  same(end,channels(motionPose(id,def.duration+10)),id+': pose final não é mantida');
  const before=channels(motionPose(id,def.duration-h));
  for(const key of new Set([...Object.keys(end),...Object.keys(before)]))assert(Math.abs(delta(key,before[key]||0,end[key]||0)/h)<(rotation(key)?.25:.15),id+'/'+key+': reação termina abruptamente');
 }
 reports.push({id,loop:def.loop,maxFrameChange:+maxFrameChange.toFixed(4),maxVelocityChange:+maxVelocityChange.toFixed(4)});
}

// Regressão do caminho exportável: ciclo de poses contínuo também fecha no GLB.
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const id='nico_inventor',look=defaultLook(id),h=buildHead(id,{}, {quality:.3,...headOpts(look,PRESETS[id])});h.root=new THREE.Group();h.root.add(h.group);let rig;
try{
 const scale=headScale(id),body=buildBody(h.fit,id,{cell:.09,headScale:scale}),pivot=body.pivot;
 h.group.scale.setScalar(scale);h.group.position.copy(pivot).multiplyScalar(1-scale);const mesh=new THREE.Mesh(body.geo,h.group.getObjectByName('Head_Skin').material);mesh.name='Body';h.body={...body,mesh};h.root.add(mesh);
 rig=buildBodyRig(h);const clips=rig.makeClips();assert.equal(clips.length,Object.keys(MOTIONS).length);
 for(const clip of clips){
  const key=clip.name.replace(/^Body_/,''),def=MOTIONS[key];assert(def,'Clipe sem movimento compartilhado: '+clip.name);assert(Math.abs(clip.duration-def.duration)<1e-5);
  for(const track of clip.tracks){
   assert(Array.from(track.values).every(Number.isFinite),clip.name+'/'+track.name+': chave inválida');
   for(let i=1;i<track.times.length;i++)assert(track.times[i]>track.times[i-1],clip.name+': tempos fora de ordem');
   if(track.name.endsWith('.quaternion')){
    const a=new THREE.Quaternion(),b=new THREE.Quaternion();
    for(let i=0;i<track.times.length;i++){a.fromArray(track.values,i*4);assert(Math.abs(a.length()-1)<1e-3,clip.name+'/'+track.name+': quaternion não unitário')}
    for(let i=1;i<track.times.length;i++){a.fromArray(track.values,(i-1)*4).normalize();b.fromArray(track.values,i*4).normalize();assert(a.angleTo(b)<.65,clip.name+'/'+track.name+': salto na exportação')}
    if(def.loop){a.fromArray(track.values,0).normalize();b.fromArray(track.values,track.values.length-4).normalize();assert(a.angleTo(b)<1e-5,clip.name+'/'+track.name+': emenda exportada aberta')}
   }else if(track.name==='Rig_Root.position'){
    const a=new THREE.Vector3(),b=new THREE.Vector3(),width=body.joints.W;
    for(let i=1;i<track.times.length;i++){a.fromArray(track.values,(i-1)*3);b.fromArray(track.values,i*3);assert(a.distanceTo(b)<width*.18,clip.name+': raiz teletransportou na exportação')}
    if(def.loop){a.fromArray(track.values,0);b.fromArray(track.values,track.values.length-3);assert(a.distanceTo(b)<width*1e-5,clip.name+': raiz não fecha o ciclo exportado')}
   }
  }
 }
 console.log(JSON.stringify({motionContinuity:reports,exportedClips:clips.map(c=>c.name)},null,2));
}finally{rig?.dispose();h.body?.geo.dispose();h.dispose()}
