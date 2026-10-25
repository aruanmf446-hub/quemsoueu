// Converte apenas movimentos CMU/cgspeed; nenhuma geometria externa é usada.
// Uso: node scripts/importar-mocap.mjs /diretorio/com/cmu-*.bvh
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {BVHLoader} from 'three/addons/loaders/BVHLoader.js';

const repository=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const directory=path.resolve(process.argv[2]||'/tmp');
const FPS=30,V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),Q=()=>new THREE.Quaternion();
const clips={
 lobby:{file:'111_28',label:'Espera',start:9.333,end:13.333,duration:6,loop:true,blend:.35},
 defeat:{file:'79_71',label:'Derrota',start:.100,end:4.600,duration:4.5,loop:false},
 victory:{file:'79_69',label:'Comemoração',start:.633,end:6.633,loop:false},
 dance_floss:{file:'143_35',label:'Macarena',start:.300,end:4.300,loop:true,blend:.35},
 dance_shuffle:{file:'15_04',label:'Dança retrô',start:117.133,end:122.067,duration:5,loop:true,blend:.35}
};
const round=value=>Number(value.toFixed(5));
const numbers=value=>value.toArray().map(round);
const sourceURL=file=>'https://raw.githubusercontent.com/una-dinosauria/cmu-mocap/09a07f54f3bbb58797325f009282d0b2048a2871/data/'+file.split('_')[0].padStart(3,'0')+'/'+file+'.bvh';
const smooth=x=>x*x*(3-2*x);

function converter(config){
 const input=path.join(directory,'cmu-'+config.file+'.bvh');
 const sourceText=fs.readFileSync(input,'utf8'),sourceSHA256=createHash('sha256').update(sourceText).digest('hex');
 const {skeleton,clip}=new BVHLoader().parse(sourceText);
 const root=skeleton.bones[0],bones=Object.fromEntries(skeleton.bones.filter(b=>b.name!=='ENDSITE').map(b=>[b.name,b]));
 const mixer=new THREE.AnimationMixer(root),action=mixer.clipAction(clip);action.play();action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;
 const sample=time=>{mixer.setTime(time);root.updateMatrixWorld(true)};
 const point=name=>{const bone=typeof name==='string'?bones[name]:name;if(!bone)throw Error(config.file+': osso ausente '+name);return bone.getWorldPosition(V())};
 const orientation=name=>bones[name].getWorldQuaternion(Q());
 sample(0);
 const restPositions=Object.fromEntries(Object.entries(bones).map(([name])=>[name,point(name)]));
 const restQuaternions=Object.fromEntries(Object.keys(bones).map(name=>[name,orientation(name)]));
 const legLength=['Left','Right'].reduce((sum,side)=>sum+restPositions[side+'UpLeg'].distanceTo(restPositions[side+'Leg'])+restPositions[side+'Leg'].distanceTo(restPositions[side+'Foot']),0)/2;
 const restHip=restPositions.LeftUpLeg.clone().add(restPositions.RightUpLeg).multiplyScalar(.5);
 const hipOffset=restHip.clone().sub(restPositions.Hips).divideScalar(legLength);
 const restFoot=Object.fromEntries([['L','Left'],['R','Right']].map(([side,name])=>[side,numbers(restPositions[name+'Foot'].clone().sub(restHip).divideScalar(legLength))]));
 const restDirections={};
 for(const [side,name]of [['L','Left'],['R','Right']]){
  restDirections['UpperArm_'+side]=numbers(restPositions[name+'ForeArm'].clone().sub(restPositions[name+'Arm']).normalize());
  restDirections['LowerArm_'+side]=numbers(restPositions[name+'Hand'].clone().sub(restPositions[name+'ForeArm']).normalize());
 }
 const blend=config.loop?config.blend:0,windowDuration=config.end-config.start,duration=round(config.duration||windowDuration),sourceDuration=windowDuration-blend;
 const firstTime=config.start+blend;
 if(config.start<=0||config.end>clip.duration)throw Error(config.file+': intervalo fora da captura '+clip.duration);
 sample(firstTime);
 const across=point('LeftUpLeg').sub(point('RightUpLeg'));across.y=0;across.normalize();
 const yaw=Math.atan2(-across.z,across.x),alignment=Q().setFromAxisAngle(V(0,1,0),-yaw);
 const origin=point('LeftUpLeg').add(point('RightUpLeg')).multiplyScalar(.5).applyQuaternion(alignment);origin.y=0;
 const floorValues=[],toeFloorValues=[];
 const toeEnd=name=>bones[name+'ToeBase'].children.find(b=>b.isBone);
 for(let i=0;i<=Math.ceil(duration*FPS);i++){
  sample(config.start+(config.end-config.start)*i/Math.ceil(duration*FPS));
  floorValues.push(point('LeftFoot').y,point('RightFoot').y);
  for(const name of ['Left','Right'])toeFloorValues.push(point(name+'ToeBase').y,point(toeEnd(name)).y);
 }
 floorValues.sort((a,b)=>a-b);
 const ankleFloor=floorValues[Math.floor(floorValues.length*.03)];
 toeFloorValues.sort((a,b)=>a-b);const toeFloor=toeFloorValues[Math.floor(toeFloorValues.length*.01)];
 const heelOffsets=Object.fromEntries([['L','Left'],['R','Right']].map(([side,name])=>[side,V(0,-Math.max(0,ankleFloor-toeFloor),-.12*restPositions[name+'Foot'].distanceTo(restPositions[name+'ToeBase'].clone().add(toeEnd(name).position.clone().applyQuaternion(restQuaternions[name+'ToeBase']))))]));
 const alignedPoint=name=>point(name).applyQuaternion(alignment);
 const position=name=>alignedPoint(name).sub(origin).sub(V(0,ankleFloor,0)).divideScalar(legLength);
 const difference=(from,to)=>alignedPoint(to).sub(alignedPoint(from)).normalize();
 const worldDelta=name=>alignment.clone().multiply(orientation(name)).multiply(restQuaternions[name].clone().invert()).normalize();
 // Dedos e polegares CMU não foram capturados. Eles definem somente a base
 // anatômica no quadro de repouso; a animação da palma usa apenas o punho.
 const handBasis=(side,name)=>{
  const wrist=point(name+'Hand'),finger=point(name+'HandIndex1');
  const thumb=bones[side==='L'?'LThumb':'RThumb'];
  const thumbEnd=thumb.children.find(b=>b.isBone);
  const u=finger.sub(wrist).normalize(),w=point(thumbEnd).sub(wrist);w.addScaledVector(u,-w.dot(u)).normalize();
  if(u.lengthSq()<.9||w.lengthSq()<.9)throw Error(config.file+': base de mão degenerada');
  const v=w.clone().cross(u).normalize();
  return Q().setFromRotationMatrix(new THREE.Matrix4().makeBasis(u,v,w)).normalize();
 };
 sample(0);
 const restHandFrames={L:handBasis('L','Left'),R:handBasis('R','Right')};
 function extract(time){
  sample(time);
  const directions={},feet={},handFrames={},footFrames={},clearance={},footForward={};
  for(const [side,name]of [['L','Left'],['R','Right']]){
   directions['UpperArm_'+side]=difference(name+'Arm',name+'ForeArm');
   directions['LowerArm_'+side]=difference(name+'ForeArm',name+'Hand');
   directions['UpperLeg_'+side]=difference(name+'UpLeg',name+'Leg');
   directions['LowerLeg_'+side]=difference(name+'Leg',name+'Foot');
   feet[side]=position(name+'Foot');handFrames[side]=worldDelta(name+'Hand').multiply(restHandFrames[side]).normalize();footFrames[side]=worldDelta(name+'Foot');
   const heel=heelOffsets[side].clone().applyQuaternion(orientation(name+'Foot').multiply(restQuaternions[name+'Foot'].clone().invert())).add(point(name+'Foot'));
   clearance[side]=Math.max(0,(Math.min(point(name+'ToeBase').y,point(toeEnd(name)).y,heel.y)-toeFloor)/legLength);
   footForward[side]=difference(name+'Foot',toeEnd(name));
  }
  const hipCenter=position('LeftUpLeg').add(position('RightUpLeg')).multiplyScalar(.5);
  const orientations={Hips:worldDelta('Hips'),Spine:worldDelta('Spine'),Chest:worldDelta('Spine1'),Neck:worldDelta('Neck1'),Head:worldDelta('Head')};
  for(const [side,name]of [['L','Left'],['R','Right']]){
   orientations['UpperArm_'+side]=worldDelta(name+'Arm');
   orientations['LowerArm_'+side]=worldDelta(name+'ForeArm');
  }
  return {root:hipCenter.clone(),hipCenter,orientations,directions,feet,handFrames,footFrames,clearance,footForward};
 }
 function mix(a,b,w){
  a.root.lerp(b.root,w);
  a.hipCenter.lerp(b.hipCenter,w);
  for(const key of Object.keys(a.directions))a.directions[key].lerp(b.directions[key],w).normalize();
  for(const side of ['L','R']){a.feet[side].lerp(b.feet[side],w);a.footForward[side].lerp(b.footForward[side],w).normalize();a.clearance[side]=THREE.MathUtils.lerp(a.clearance[side],b.clearance[side],w)}
  for(const group of ['orientations','handFrames','footFrames'])for(const key of Object.keys(a[group]))a[group][key].slerp(b[group][key],w).normalize();
  return a;
 }
 const frameCount=Math.round(duration*FPS),frames=[];
 for(let i=0;i<=frameCount;i++){
  const time=duration*i/frameCount,sourceTime=time/duration*sourceDuration;
  let pose;
  if(config.loop){
   pose=extract(firstTime+sourceTime);
   if(sourceTime>sourceDuration-blend){const phase=sourceTime-(sourceDuration-blend);pose=mix(pose,extract(config.start+phase),smooth(phase/blend))}
  }else{
   const settle=.28,sourceEnd=config.end,sourceNow=config.start+time/duration*windowDuration;
   let t=sourceNow;
   if(t>sourceEnd-settle){const u=Math.min(1,(t-(sourceEnd-settle))/settle);t=sourceEnd-settle+settle*(u+u*u-u*u*u)}
   pose=extract(t);
  }
  frames.push({root:numbers(pose.root),hipCenter:numbers(pose.hipCenter),clearance:Object.fromEntries(Object.entries(pose.clearance).map(([side,value])=>[side,round(value)])),...Object.fromEntries(['orientations','directions','feet','handFrames','footFrames','footForward'].map(group=>[group,Object.fromEntries(Object.entries(pose[group]).map(([key,value])=>[key,numbers(value)]))]))});
 }
 // Marcadores distais da captura têm ruído de torção. Filtro simétrico curto
 // evita tremor de punhos/solas sem atrasar o gesto nem mover seus contatos.
 const unfiltered=structuredClone(frames),period=frames.length-1;
 const frameIndex=index=>config.loop?(index%period+period)%period:THREE.MathUtils.clamp(index,0,frames.length-1);
 for(let i=0;i<frames.length;i++)for(const [group,names,weights]of [['handFrames',['L','R'],[1,6,15,20,15,6,1]],['footFrames',['L','R'],[1,6,15,20,15,6,1]],['orientations',['Head'],[1,4,6,4,1]],['orientations',['UpperArm_L','LowerArm_L','UpperArm_R','LowerArm_R'],[1,1,1,1,1,1,1,1,1]]]){
  for(const name of names){
   const center=new THREE.Quaternion(...unfiltered[frameIndex(i)][group][name]),sum=[0,0,0,0],radius=(weights.length-1)/2;
   for(let j=0;j<weights.length;j++){
    const q=new THREE.Quaternion(...unfiltered[frameIndex(i+j-radius)][group][name]),sign=q.dot(center)<0?-1:1;
    q.toArray().forEach((value,k)=>sum[k]+=value*weights[j]*sign);
   }
   frames[i][group][name]=numbers(new THREE.Quaternion(...sum).normalize());
  }
 }
 // Perto do cotovelo reto a reconstrução CMU pode girar o eixo longitudinal
 // sem mudar o gesto. Suavizar a orientação remove essa torção instável;
 // a projeção seguinte conserva a direção capturada do segmento em cada chave.
 for(const frame of frames)for(const name of Object.keys(restDirections)){
  const q=new THREE.Quaternion(...frame.orientations[name]).normalize(),rest=V(...restDirections[name]).normalize(),wanted=V(...frame.directions[name]).normalize();
  const correction=Q().setFromUnitVectors(rest.applyQuaternion(q).normalize(),wanted);
  frame.orientations[name]=numbers(correction.multiply(q).normalize());
 }
 // Mesmo quadro nos extremos; a mescla também acompanha a velocidade do início.
 if(config.loop)frames[frames.length-1]=structuredClone(frames[0]);
 mixer.stopAllAction();mixer.uncacheRoot(root);
 return {label:config.label,duration,loop:config.loop,fps:FPS,source:config.file,sourceURL:sourceURL(config.file),sourceSHA256,sourceRange:[config.start,config.end],loopBlend:blend,orientationFilter:{distal:[1,6,15,20,15,6,1],head:[1,4,6,4,1],arms:[1,1,1,1,1,1,1,1,1],armDirectionProjection:true},heelOffsets:Object.fromEntries(Object.entries(heelOffsets).map(([side,value])=>[side,numbers(value)])),legLength:round(legLength),ankleFloor:round(ankleFloor),toeFloor:round(toeFloor),hipOffset:numbers(hipOffset),restFoot,restDirections,frames};
}

const result={};
for(const [id,config]of Object.entries(clips)){result[id]=converter(config);console.log(id,result[id].duration,result[id].frames.length,'quadros')}
const header='// Movimento humano capturado: CMU Graphics Lab, conversão BVH de Bruce Hahne/cgspeed.\n// Dados: mocap.cs.cmu.edu; financiamento NSF EIA-0196217. Termos em assets/motions/CMU-USAGE.txt.\n// Gerado por scripts/importar-mocap.mjs. Posições em comprimentos de perna; direções no espaço do ator.\n';
const output=header+'export const MOCAP={\n'+Object.entries(result).map(([id,value])=>JSON.stringify(id)+':'+JSON.stringify(value)).join(',\n')+'\n};\n';
fs.writeFileSync(path.join(repository,'src/mocap-data.js'),output);
console.log('Gravado src/mocap-data.js:',Buffer.byteLength(output),'bytes');
