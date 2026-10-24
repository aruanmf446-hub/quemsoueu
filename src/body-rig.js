// Rig corporal comum: mesmas articulações e coreografias, medidas de cada personagem.
import * as THREE from 'three';
import {MOTIONS,motionPose} from './motions.js?v=batidas-ik-1';
import {solveLeg} from './leg-ik.js';
import {componentBindings} from './skin-components.js';
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
 // Envelopes contínuos: a transição entre tronco e membros não escolhe
 // um único segmento vencedor. Essa escolha rasgava as axilas ao erguer braços.
 const width=J?.W??Math.max(.6,Math.abs(L.shoulder.x)*1.8),acc=new Float64Array(BODY_BONES.length);
 segments.push({a:positions.Neck,b:positions.Head,name:'Neck',next:'Head',type:'torso'});
 const envelopes=segments.map(seg=>{const d=seg.b.clone().sub(seg.a);return {...seg,dx:d.x,dy:d.y,dz:d.z,lengthSq:d.lengthSq()||1,sigma2:(width*(seg.type==='arm'?.32:seg.type==='leg'?.36:.52))**2,side:Math.sign(seg.a.x)}});
 const scores=new Float64Array(envelopes.length),parameters=new Float64Array(envelopes.length);
 function weights(p,mode=null){
  let lowest=Infinity;const torso=J?.torsoAt?.(p.y);
  for(let i=0;i<envelopes.length;i++){
   const e=envelopes[i],t=clamp(((p.x-e.a.x)*e.dx+(p.y-e.a.y)*e.dy+(p.z-e.a.z)*e.dz)/e.lengthSq,0,1),dx=p.x-e.a.x-e.dx*t,dy=p.y-e.a.y-e.dy*t,dz=p.z-e.a.z-e.dz*t;
   let mask=1;
   if(e.type==='arm'){const start=Math.max(Math.abs(L.shoulder.x)*(companion?.10:.50),(torso?.rx||0)*.90),end=Math.max(Math.abs(L.shoulder.x)*(companion?.75:1.05),start+width*(companion?.30:.65));mask=THREE.MathUtils.smoothstep(Math.abs(p.x),start,end)*THREE.MathUtils.smoothstep(p.x*e.side,-width*.18,width*.18)}
   if(e.type==='arm'&&['lower','skirt','belt','feet','torso'].includes(mode))mask=0;
   if(e.type==='leg'){const band=width*(.22+.22*THREE.MathUtils.smoothstep(p.y,L.knee.y-width*.30,L.knee.y+width*.30));mask=(1-THREE.MathUtils.smoothstep(p.y,L.hip.y-width*.45,L.hip.y+width*.25))*THREE.MathUtils.smoothstep(p.x*e.side,-band,band)}
   if(e.type==='leg'&&mode==='torso')mask=0;
   if(e.type==='torso')mask=THREE.MathUtils.smoothstep(p.y,L.hip.y-width*.80,L.hip.y+width*.15);
   const distance=e.type==='torso'&&torso?1.4*((p.x/torso.rx)**2+((p.z-torso.z)/torso.rz)**2)+dy*dy/e.sigma2:(dx*dx+dy*dy+dz*dz)/e.sigma2;
   const score=mask>1e-12?distance-2*Math.log(mask):Infinity;scores[i]=score;parameters[i]=t;lowest=Math.min(lowest,score);
  }
  acc.fill(0);
  for(let i=0;i<envelopes.length;i++){
   if(scores[i]-lowest>24)continue;
   const e=envelopes[i],w=Math.exp(-(scores[i]-lowest)),t=parameters[i];
   if(e.type==='leg'&&(mode==='cape'||mode==='skirt'))acc[indices.Hips]+=w;
   else if(mermaid&&e.type==='leg'){const u=THREE.MathUtils.smoothstep((L.center.y-p.y)/Math.max(.1,L.center.y-floor),.25,.85);acc[indices.Tail]+=w*(1-u);acc[indices.TailTip]+=w*u}
   else{const u=THREE.MathUtils.smoothstep(t,e.type==='torso'?0:.62,1);acc[indices[e.name]]+=w*(1-u);acc[indices[e.next]]+=w*u}
  }
  const ids=[0,0,0,0,0],values=[0,0,0,0,0];
  for(let i=0;i<acc.length;i++)for(let j=0;j<5;j++)if(acc[i]>values[j]){for(let k=4;k>j;k--){values[k]=values[k-1];ids[k]=ids[k-1]}values[j]=acc[i];ids[j]=i;break}
  // Remover simplesmente a quinta influência criava outra descontinuidade.
  // O limiar zera a quarta/quinta na troca de ordem, mantendo quatro pesos contínuos.
  const trimmed=values.slice(0,4).map(v=>Math.max(0,v-values[4])),sum=trimmed.reduce((a,b)=>a+b,0);if(!sum)return {ids:[indices.Hips,0,0,0],values:[1,0,0,0]};
  return {ids:ids.slice(0,4),values:trimmed.map(v=>v/sum)};
 }

 function skin(mesh){
  const geometry=mesh.geometry.clone(),p=geometry.attributes.position,skinIndex=new Uint16Array(p.count*4),skinWeight=new Float32Array(p.count*4),matrix=toRoot.clone().multiply(mesh.matrixWorld);
  const {slot,style}=mesh.userData,collar=/^Roupa_(Gola\d*|Colar|Echarpe|Lenco|Lenço)(_|$)/.test(mesh.name),torsoOnly=slot==='upper'&&/(Macacao|Corpete|Colete|Jardineira|_Abas)/.test(mesh.name),mode=torsoOnly?'torso':slot==='lower'&&/^(dress|royal|lunar_guardian|lunar_ruby|forest_princess)$/.test(style)?'skirt':slot||null;
  const metal=mesh.material.metalness>.5,parts=metal||slot==='extras'||slot==='feet'?componentBindings(geometry,matrix,g=>{
   const {center:c,size}=g;let anchor=null;
   if(slot==='feet'&&!mermaid)anchor='Foot_'+(c.x>=0?'L':'R');
   else if(slot==='extras'&&Math.abs(c.x)>Math.abs(L.wrist.x)*.85)anchor='Hand_'+(c.x>=0?'L':'R');
   else if(slot==='extras'&&c.z<z-width*.35&&Math.abs(c.x)<Math.abs(L.shoulder.x)*.85&&c.y>L.hip.y-width*.05)anchor='Chest';
   else if(metal)anchor=BODY_BONES[weights(c,mode).ids[0]];
   return anchor?{ids:[indices[anchor],0,0,0],values:[1,0,0,0]}:null;
  }):null;
  for(let i=0;i<p.count;i++){world.fromBufferAttribute(p,i).applyMatrix4(matrix);const w=collar?{ids:[indices.Neck,0,0,0],values:[1,0,0,0]}:parts?.(i)||weights(world,mode);skinIndex.set(w.ids,i*4);skinWeight.set(w.values,i*4)}
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
 let active=null,time=0,playing=false,speed=1,helper=null,transition=null,lastLift=0;
 function rest(){lastLift=0;for(const name of BODY_BONES){bones[name].quaternion.identity();bones[name].position.copy(positions[name]).sub(name==='Root'?V():positions[parentName(name)])}root.updateMatrixWorld(true);skeleton.update()}
 function parentName(name){return bones[name].parent.isBone?bones[name].parent.name.slice(prefix.length):null}
 function support(lift=0){
  lastLift=Math.max(0,lift);
  root.updateMatrixWorld(true);
  const currentToRoot=root.matrixWorld.clone().invert();
  if(!robot){let low=Infinity;for(const p of footSamples)low=Math.min(low,inverseRoot.copy(p.local).applyMatrix4(p.bone.matrixWorld).applyMatrix4(currentToRoot).y);bones.Root.position.y+=floor-low+Math.max(0,lift)}
  root.updateMatrixWorld(true);skeleton.update();
 }
 function sample(id,t){
  const pose=motionPose(id,t);for(const name of BODY_BONES)bones[name].quaternion.identity();
  for(const [name,value]of Object.entries(pose))if(bones[name])bones[name].quaternion.setFromEuler(euler.set(...value.map(v=>v*motionScale)));
  if(mermaid){bones.Tail.quaternion.setFromEuler(euler.set(((pose.UpperLeg_L?.[0]||0)+(pose.UpperLeg_R?.[0]||0))*.3,0,(pose.Hips?.[2]||0)*.6));bones.TailTip.quaternion.setFromEuler(euler.set(((pose.LowerLeg_L?.[0]||0)+(pose.LowerLeg_R?.[0]||0))*.25,0,0))}
  if(pose.root)bones.Root.position.fromArray(pose.root).multiplyScalar(width*motionScale);else bones.Root.position.set(pose.offset[0]*height,pose.offset[1]*height,pose.offset[2]*height);
  root.updateMatrixWorld(true);
  if(body&&!mermaid&&!companion&&pose.feet){
   const actorRotation=root.getWorldQuaternion(new THREE.Quaternion());
   for(const side of ['L','R']){
    const target=positions['Foot_'+side].clone().add(V(...pose.feet[side]).multiplyScalar(width));
    solveLeg(bones['UpperLeg_'+side],bones['LowerLeg_'+side],bones['Foot_'+side],target,root);
    const foot=bones['Foot_'+side],desired=actorRotation.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...pose.footAngles[side])));
    foot.quaternion.copy(foot.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(desired));
    root.updateMatrixWorld(true);
   }
  }
  support(pose.offset[1]*height);return pose.face;
 }
 function blend(alpha){
  for(let i=0;i<BODY_BONES.length;i++){const q=bones[BODY_BONES[i]].quaternion;q.slerpQuaternions(transition.q[i],q.clone(),alpha)}
  bones.Root.position.lerpVectors(transition.position,bones.Root.position.clone(),alpha);
  support(THREE.MathUtils.lerp(transition.lift,motionPose(active,time).offset[1]*height,alpha));
 }

 function makeClips(){const saved={q:BODY_BONES.map(n=>bones[n].quaternion.clone()),position:bones.Root.position.clone(),lift:lastLift},clips=[];for(const [id,def]of Object.entries(MOTIONS)){const times=[],q=BODY_BONES.map(()=>[]),pos=[];const steps=Math.ceil(def.duration*30);for(let i=0;i<=steps;i++){const t=i/steps*def.duration;times.push(t);sample(id,t);BODY_BONES.forEach((n,k)=>q[k].push(...bones[n].quaternion.toArray()));pos.push(...bones.Root.position.toArray())}clips.push(new THREE.AnimationClip('Body_'+id,def.duration,[...BODY_BONES.map((n,k)=>new THREE.QuaternionKeyframeTrack(prefix+n+'.quaternion',times,q[k])),new THREE.VectorKeyframeTrack(prefix+'Root.position',times,pos)]))}BODY_BONES.forEach((n,i)=>bones[n].quaternion.copy(saved.q[i]));bones.Root.position.copy(saved.position);lastLift=saved.lift;root.updateMatrixWorld(true);skeleton.update();return clips}
 function play(id){if(!Object.hasOwn(MOTIONS,id))return false;transition={q:BODY_BONES.map(n=>bones[n].quaternion.clone()),position:bones.Root.position.clone(),lift:lastLift,elapsed:0};active=id;time=0;playing=true;sample(active,0);blend(0);return true}
 function update(dt){if(!active)return null;const advancing=playing;if(playing){time+=Math.max(0,dt)*speed;if(MOTIONS[active].loop)time%=MOTIONS[active].duration;if(!MOTIONS[active].loop&&time>=MOTIONS[active].duration){time=MOTIONS[active].duration;playing=false}}const face=sample(active,time);if(transition){if(advancing)transition.elapsed+=Math.max(0,dt);const alpha=THREE.MathUtils.smoothstep(transition.elapsed,0,.22);blend(alpha);if(alpha===1)transition=null}return face}
 function seek(t){if(!active)return false;transition=null;time=clamp(t,0,MOTIONS[active].duration);return sample(active,time)}
 function stop(){transition=null;active=null;playing=false;time=0;rest()}
 function dispose(){stop();helper?.removeFromParent();helper?.dispose();for(const a of attachments){a.parent.add(a.object);a.object.position.copy(a.position);a.object.quaternion.copy(a.quaternion);a.object.scale.copy(a.scale)}for(const r of replacements){r.skinned.removeFromParent();r.parent.add(r.original);r.skinned.geometry.dispose()}armature.removeFromParent();skeleton.dispose()}
 function showSkeleton(on){if(!helper){helper=new THREE.SkeletonHelper(bones.Root);helper.material.depthTest=false;helper.renderOrder=1000;root.add(helper)}helper.visible=on}
 rest();
 return {bones,skeleton,group:armature,meshes:replacements.map(r=>r.skinned),profile:quad?'quadruped':companion?'bird':robot?'floating':mermaid?'mermaid':'biped',height,floor,play,update,seek,stop,makeClips,dispose,showSkeleton,pause:()=>playing=false,resume:()=>{if(active)playing=true},setSpeed:v=>speed=clamp(v,.25,2),state:()=>({active,time,playing,speed,duration:active?MOTIONS[active].duration:0})};
}
