// Rig corporal comum: mesmas articulações e coreografias, medidas de cada personagem.
import * as THREE from 'three';
import {MOTIONS,motionPose} from './motions.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),clamp=THREE.MathUtils.clamp;
export const BODY_BONES=['Root','Hips','Spine','Chest','Neck','Head','Tail','TailTip',...['L','R'].flatMap(s=>['UpperArm','LowerArm','Hand','UpperLeg','LowerLeg','Foot','Toe'].map(n=>n+'_'+s))];
const prefix='Rig_',world=new THREE.Vector3(),euler=new THREE.Euler();
export function buildBodyRig(character,clothing=null){
 const root=character.root,body=character.body,fit=character.fit,mermaid=!!body?.joints.mermaid,companion=!!fit?.companion,quad=companion&&fit.paws?.length>0,robot=!fit;
 root.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(root),size=box.getSize(V()),J=body?.joints,
 floor=body?.ySole??fit?.ySole??box.min.y,height=Math.max(.5,size.y),z=J?.zCenter??0;
 let landmarks;
 if(J?.shoulder){landmarks={hip:J.hip,knee:J.knee,ankle:J.ankle,shoulder:J.shoulder,elbow:J.elbow,wrist:J.wrist,neck:body.pivot.clone(),center:V(0,J.hip.y,z),chest:V(0,J.shoulder.y,z)}}
 else if(quad){const front=fit.paws.find(p=>p.side>0&&p.hip.z>-.5),rear=fit.paws.find(p=>p.side>0&&p.hip.z<-.5);landmarks={hip:rear.hip,knee:rear.knee,ankle:rear.ankle,shoulder:front.hip,elbow:front.knee,wrist:front.ankle,neck:V(0,-.25,0),center:V(0,-1.22,-1.40),chest:V(0,-.90,-.05)}}
 else if(J?.limb){landmarks={hip:J.hip,knee:J.knee,ankle:J.ankle,shoulder:J.shoulder,elbow:J.elbow,wrist:J.wrist,neck:V(0,fit.P.neck[3],fit.P.neck[4]),center:V(0,J.hip.y,fit.P.lathe.cz),chest:V(0,J.shoulder.y,fit.P.lathe.cz)}}
 else{const unit=companion?1:height/2.4;landmarks={hip:V(.27*unit,floor+.55*unit,0),knee:V(.31*unit,floor+.3*unit,.04),ankle:V(.31*unit,floor+.12*unit,.08),shoulder:V(.56*unit,floor+1.58*unit,-.16),elbow:V(.7*unit,floor+1.10*unit,-.16),wrist:V(.8*unit,floor+.78*unit,-.10),neck:V(0,companion?-.12:0,0),center:V(0,floor+.7*unit,-.13),chest:V(0,floor+1.3*unit,-.13)}}
 const L=landmarks,bones={},positions={},armature=new THREE.Group();armature.name='Esqueleto_Corporal';root.add(armature);
 function bone(name,parent,p){const b=new THREE.Bone();b.name=prefix+name;positions[name]=p.clone();b.position.copy(p).sub(parent?positions[parent]:V());(parent?bones[parent]:armature).add(b);bones[name]=b;return b}
 bone('Root',null,V());bone('Hips','Root',L.center);bone('Spine','Hips',L.center.clone().lerp(L.chest,.5));bone('Chest','Spine',L.chest);bone('Neck','Chest',L.neck);bone('Head','Neck',L.neck.clone().add(V(0,height*.035,0)));
 bone('Tail','Hips',L.center);bone('TailTip','Tail',V(0,floor+height*.15,L.center.z));
 const segments=[];
 for(const [suffix,sign]of [['L',1],['R',-1]]){
  const mirror=p=>V(sign*Math.abs(p.x),p.y,p.z),arm=['UpperArm_'+suffix,'LowerArm_'+suffix,'Hand_'+suffix],leg=['UpperLeg_'+suffix,'LowerLeg_'+suffix,'Foot_'+suffix,'Toe_'+suffix];
  const sh=mirror(L.shoulder),el=mirror(L.elbow),wr=mirror(L.wrist),hp=mirror(L.hip),kn=mirror(L.knee),an=mirror(L.ankle),toe=an.clone().add(V(0,-Math.max(.04,(an.y-floor)*.65),Math.max(.12,height*.025)));
  bone(arm[0],'Chest',sh);bone(arm[1],arm[0],el);bone(arm[2],arm[1],wr);
  bone(leg[0],'Hips',hp);bone(leg[1],leg[0],kn);bone(leg[2],leg[1],an);bone(leg[3],leg[2],toe);
  segments.push({a:sh,b:el,name:arm[0],next:arm[1],type:'arm'},{a:el,b:wr,name:arm[1],next:arm[2],type:'arm'}, {a:wr,b:wr.clone().add(wr.clone().sub(el).normalize().multiplyScalar(height*.05)),name:arm[2],next:arm[2],type:'arm'}, {a:hp,b:kn,name:leg[0],next:leg[1],type:'leg'},{a:kn,b:an,name:leg[1],next:leg[2],type:'leg'},{a:an,b:toe.clone().add(V(0,0,height*.02)),name:leg[2],next:leg[2],type:'leg'});
 }
 segments.push({a:L.center,b:positions.Spine,name:'Hips',next:'Spine',type:'torso'},{a:positions.Spine,b:L.chest,name:'Spine',next:'Chest',type:'torso'},{a:L.chest,b:L.neck,name:'Chest',next:'Neck',type:'torso'});
 root.updateMatrixWorld(true);const skeleton=new THREE.Skeleton(BODY_BONES.map(n=>bones[n]));skeleton.calculateInverses();
 const indices=Object.fromEntries(BODY_BONES.map((n,i)=>[n,i])),replacements=[],attachments=[];
 const toRoot=root.matrixWorld.clone().invert();
 function weights(p){
  if(companion&&p.y>-.75&&(quad||Math.abs(p.x)<.45||p.y>0)){const t=THREE.MathUtils.smoothstep(p.y,-.75,-.15);return [indices.Chest,indices.Head,1-t,t]}
  if(mermaid&&p.y<L.center.y&&(Math.abs(p.x)<Math.abs(L.hip.x)+height*.04||p.y<L.knee.y)){const t=THREE.MathUtils.smoothstep((L.center.y-p.y)/Math.max(.1,L.center.y-floor),.25,.85);return [indices.Tail,indices.TailTip,1-t,t]}
  // Pontos da roupa e da pele consultam os mesmos envelopes, sem depender da tesselação.
  let best=null;const d=V();
  for(const seg of segments){d.subVectors(seg.b,seg.a);const t=clamp(p.clone().sub(seg.a).dot(d)/(d.lengthSq()||1),0,1),q=seg.a.clone().addScaledVector(d,t);let distance=p.distanceToSquared(q);
   if(!quad&&seg.type==='arm'&&Math.abs(p.x)<Math.abs(L.shoulder.x)*.72)distance+=height*height;
   if(!quad&&seg.type==='leg'&&p.y>L.hip.y+height*.04)distance+=height*height;
   if(!quad&&seg.type==='torso'&&p.y<L.hip.y-height*.07)distance+=height*height;
   if(!best||distance<best.distance)best={seg,t,distance};
  }
  const {seg,t}=best,u=THREE.MathUtils.smoothstep(t,.32,.90);
  return [indices[seg.name],indices[seg.next],1-u,u];
 }
 function skin(mesh){
  const geometry=mesh.geometry.clone(),p=geometry.attributes.position,skinIndex=new Uint16Array(p.count*4),skinWeight=new Float32Array(p.count*4),matrix=toRoot.clone().multiply(mesh.matrixWorld);
  geometry.computeBoundingBox();const bounds=geometry.boundingBox,smallMetal=mesh.material.metalness>.5&&bounds.getSize(V()).length()<height*.18,rigid=smallMetal?weights(bounds.getCenter(V()).applyMatrix4(matrix)):null;
  if(rigid){const bone=rigid[2]>=rigid[3]?rigid[0]:rigid[1];rigid.splice(0,4,bone,bone,1,0)}
  for(let i=0;i<p.count;i++){world.fromBufferAttribute(p,i).applyMatrix4(matrix);const [a,b,wa,wb]=rigid||weights(world);skinIndex.set([a,b,0,0],i*4);skinWeight.set([wa,wb,0,0],i*4)}
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndex,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeight,4));
  const skinned=new THREE.SkinnedMesh(geometry,mesh.material);skinned.name=mesh.name;skinned.position.copy(mesh.position);skinned.quaternion.copy(mesh.quaternion);skinned.scale.copy(mesh.scale);skinned.visible=mesh.visible;skinned.castShadow=mesh.castShadow;skinned.receiveShadow=mesh.receiveShadow;skinned.userData={...mesh.userData,bodyRig:true};skinned.frustumCulled=false;
  const parent=mesh.parent,order=parent.children.indexOf(mesh);parent.remove(mesh);parent.add(skinned);parent.children.splice(parent.children.indexOf(skinned),1);parent.children.splice(order,0,skinned);root.updateMatrixWorld(true);skinned.bind(skeleton,mesh.matrixWorld);replacements.push({original:mesh,skinned,parent,order});
 }
 const bodyMeshes=[];if(body)bodyMeshes.push(body.mesh);if(companion)fit.bodyGroup.traverse(m=>{if(m.isMesh&&!m.isSkinnedMesh)bodyMeshes.push(m)});clothing?.group.traverse(m=>{if(m.isMesh&&!m.isSkinnedMesh)bodyMeshes.push(m)});const visual=companion?character.group.getObjectByName('Look'):null,rider=visual?.getObjectByName('Cowboy_Montado');
 if(visual)visual.traverse(m=>{let mounted=false;for(let p=m;p&&p!==visual;p=p.parent)if(p===rider)mounted=true;if(m.isMesh&&!m.isSkinnedMesh&&!mounted)bodyMeshes.push(m)});for(const m of bodyMeshes)skin(m);
 function attach(object,target){if(!object)return;attachments.push({object,parent:object.parent,position:object.position.clone(),quaternion:object.quaternion.clone(),scale:object.scale.clone()});bones[target].attach(object)}
 if(companion){attach(fit.headBone,'Head');attach(rider,'Chest')}
 else attach(character.group,'Head');
 const footSamples=['L','R'].flatMap(s=>{const p=positions['Foot_'+s];return [V(p.x,floor,p.z),V(p.x,floor,p.z+height*.035)].map(point=>({bone:bones['Foot_'+s],local:point.applyMatrix4(bones['Foot_'+s].matrixWorld.clone().invert().multiply(root.matrixWorld))}))});
 if(quad)for(const side of ['L','R']){const b=bones['Hand_'+side],p=positions['Hand_'+side];footSamples.push({bone:b,local:V(p.x,floor,p.z+height*.025).applyMatrix4(b.matrixWorld.clone().invert().multiply(root.matrixWorld))})}
 if(mermaid){footSamples.length=0;footSamples.push({bone:bones.TailTip,local:V(0,floor,L.center.z).applyMatrix4(bones.TailTip.matrixWorld.clone().invert().multiply(root.matrixWorld))})}
 const inverseRoot=V(),motionScale=quad?.40:companion?.55:robot?.6:1;
 let active=null,time=0,playing=false,speed=1,helper=null;
 function rest(){for(const name of BODY_BONES){bones[name].quaternion.identity();bones[name].position.copy(positions[name]).sub(name==='Root'?V():positions[parentName(name)])}root.updateMatrixWorld(true);skeleton.update()}
 function parentName(name){return bones[name].parent.isBone?bones[name].parent.name.slice(prefix.length):null}
 function sample(id,t){
  const pose=motionPose(id,t);for(const name of BODY_BONES)bones[name].quaternion.identity();
  for(const [name,value]of Object.entries(pose))if(bones[name])bones[name].quaternion.setFromEuler(euler.set(...value.map(v=>v*motionScale)));
  if(mermaid){bones.Tail.quaternion.setFromEuler(euler.set(((pose.UpperLeg_L?.[0]||0)+(pose.UpperLeg_R?.[0]||0))*.3,0,(pose.Hips?.[2]||0)*.6));bones.TailTip.quaternion.setFromEuler(euler.set(((pose.LowerLeg_L?.[0]||0)+(pose.LowerLeg_R?.[0]||0))*.25,0,0))}
  bones.Root.position.set(pose.offset[0]*height,pose.offset[1]*height,pose.offset[2]*height);root.updateMatrixWorld(true);
  // Ajuste vertical por proporção: pés não atravessam o plano de apoio.
  if(!robot){let low=Infinity;for(const p of footSamples)low=Math.min(low,inverseRoot.copy(p.local).applyMatrix4(p.bone.matrixWorld).applyMatrix4(toRoot).y);bones.Root.position.y+=floor-low+Math.max(0,pose.offset[1]*height)}
  root.updateMatrixWorld(true);skeleton.update();return pose.face;
 }
 function makeClips(){const saved={active,time,playing},clips=[];for(const [id,def]of Object.entries(MOTIONS)){const times=[],q=BODY_BONES.map(()=>[]),pos=[];const steps=Math.ceil(def.duration*30);for(let i=0;i<=steps;i++){const t=i/steps*def.duration;times.push(t);sample(id,t);BODY_BONES.forEach((n,k)=>q[k].push(...bones[n].quaternion.toArray()));pos.push(...bones.Root.position.toArray())}clips.push(new THREE.AnimationClip('Body_'+id,def.duration,[...BODY_BONES.map((n,k)=>new THREE.QuaternionKeyframeTrack(prefix+n+'.quaternion',times,q[k])),new THREE.VectorKeyframeTrack(prefix+'Root.position',times,pos)]))}if(saved.active)sample(saved.active,saved.time);else rest();return clips}
 function play(id){if(!Object.hasOwn(MOTIONS,id))return false;active=id;time=0;playing=true;sample(active,0);return true}
 function update(dt){if(!active)return null;if(playing){time+=Math.max(0,dt)*speed;if(MOTIONS[active].loop)time%=MOTIONS[active].duration;if(!MOTIONS[active].loop&&time>=MOTIONS[active].duration){time=MOTIONS[active].duration;playing=false}}return sample(active,time)}
 function seek(t){if(!active)return false;time=clamp(t,0,MOTIONS[active].duration);return sample(active,time)}
 function stop(){active=null;playing=false;time=0;rest()}
 function dispose(){stop();helper?.removeFromParent();helper?.dispose();for(const a of attachments){a.parent.add(a.object);a.object.position.copy(a.position);a.object.quaternion.copy(a.quaternion);a.object.scale.copy(a.scale)}for(const r of replacements){r.skinned.removeFromParent();r.parent.add(r.original);r.skinned.geometry.dispose()}armature.removeFromParent();skeleton.dispose()}
 function showSkeleton(on){if(!helper){helper=new THREE.SkeletonHelper(bones.Root);helper.material.depthTest=false;helper.renderOrder=1000;root.add(helper)}helper.visible=on}
 rest();
 return {bones,skeleton,group:armature,meshes:replacements.map(r=>r.skinned),profile:quad?'quadruped':companion?'bird':robot?'floating':mermaid?'mermaid':'biped',height,floor,play,update,seek,stop,makeClips,dispose,showSkeleton,pause:()=>playing=false,resume:()=>{if(active)playing=true},setSpeed:v=>speed=clamp(v,.25,2),state:()=>({active,time,playing,speed,duration:active?MOTIONS[active].duration:0})};
}
