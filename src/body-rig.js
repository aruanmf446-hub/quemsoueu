// Rig corporal comum: mesmas articulações e coreografias, medidas de cada personagem.
import * as THREE from 'three';
import {MOTIONS,motionPose} from './motions.js?v=mocap-1';
import {solveLeg} from './leg-ik.js';
import {orientChain} from './direction-retarget.js';
import {componentBindings} from './skin-components.js';
import {legClearance} from './leg-clearance.js';
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
 const legGap=body&&!mermaid&&!companion?legClearance(body):null;
 segments.push({a:positions.Neck,b:positions.Head,name:'Neck',next:'Head',type:'torso'});
 const envelopes=segments.map(seg=>{const d=seg.b.clone().sub(seg.a);return {...seg,dx:d.x,dy:d.y,dz:d.z,lengthSq:d.lengthSq()||1,sigma2:(width*(seg.type==='arm'?.32:seg.type==='leg'?.36:.52))**2,side:Math.sign(seg.a.x)}});
 const scores=new Float64Array(envelopes.length),parameters=new Float64Array(envelopes.length);
 function weights(p,mode=null){
  // A seção de autoria afunila na virilha; usá-la nos glúteos fazia os pesos
  // saltarem para uma coxa. A região abaixo do quadril mantém seu envelope.
  let lowest=Infinity;const torso=J?.torsoAt?.(Math.max(p.y,L.hip.y));
  for(let i=0;i<envelopes.length;i++){
   const e=envelopes[i],t=clamp(((p.x-e.a.x)*e.dx+(p.y-e.a.y)*e.dy+(p.z-e.a.z)*e.dz)/e.lengthSq,0,1),dx=p.x-e.a.x-e.dx*t,dy=p.y-e.a.y-e.dy*t,dz=p.z-e.a.z-e.dz*t;
   let mask=1;
   if(e.type==='arm'){const start=Math.max(Math.abs(L.shoulder.x)*(companion?.10:.50),(torso?.rx||0)*.90),end=Math.max(Math.abs(L.shoulder.x)*(companion?.75:1.05),start+width*(companion?.30:.65));mask=THREE.MathUtils.smoothstep(Math.abs(p.x),start,end)*THREE.MathUtils.smoothstep(p.x*e.side,-width*.18,width*.18)}
   if(e.type==='arm'&&['lower','skirt','belt','feet','torso'].includes(mode))mask=0;
   if(e.type==='leg'){const band=legGap?width*(.025+.415*THREE.MathUtils.smoothstep(p.y,legGap.crotch-width*.25,legGap.crotch+width*.25)):width*(.22+.22*THREE.MathUtils.smoothstep(p.y,L.knee.y-width*.30,L.knee.y+width*.30));mask=(1-THREE.MathUtils.smoothstep(p.y,L.hip.y-width*.45,L.hip.y+width*.25))*THREE.MathUtils.smoothstep(p.x*e.side,-band,band)}
   if(e.type==='leg'&&mode==='torso')mask=0;
   if(e.type==='leg'&&mode==='feet'&&p.x*e.side<0)mask=0;
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
  // Envelopes largos do pescoço não devem puxar os ombros ao virar a cabeça.
  // Fora da coluna central, essa influência pertence ao peito.
  const neckMask=1-THREE.MathUtils.smoothstep(Math.abs(p.x),width*.28,width*.60);
  for(const name of ['Neck','Head']){const transfer=acc[indices[name]]*(1-neckMask);acc[indices[name]]-=transfer;acc[indices.Chest]+=transfer}
  if(body&&!mermaid&&!companion){
   // A união central acompanha a pelve até a costura real do corpo. Abaixo
   // dela, o peso passa gradualmente à própria coxa, sem prender o joelho.
   const medial=1-THREE.MathUtils.smoothstep(Math.abs(p.x),width*.03,Math.abs(L.hip.x)*1.3),fade=Math.max(width*.40,(L.hip.y-L.knee.y)*.30),pelvic=medial*THREE.MathUtils.smoothstep(p.y,legGap.crotch-fade,legGap.crotch);
   for(const side of ['L','R']){const transfer=acc[indices['UpperLeg_'+side]]*pelvic;acc[indices['UpperLeg_'+side]]-=transfer;acc[indices.Hips]+=transfer}
   if(mode===null||mode==='feet'){
    // A sola e os dedos acompanham o mesmo osso rígido do calçado; a transição
    // no tornozelo evita que o pé de pele saia da bota ao dobrar a perna.
    const blend=1-THREE.MathUtils.smoothstep(p.y,L.ankle.y+width*.08,L.ankle.y+width*.25),index=indices['Foot_'+(p.x>=0?'L':'R')];
    if(blend>0){let transfer=0;for(let i=0;i<acc.length;i++)if(i!==index){const w=acc[i]*blend;acc[i]-=w;transfer+=w}acc[index]+=transfer}
   }
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
   if(slot==='feet'&&!mermaid){
    // Algumas botas são uma única superfície SDF contendo os dois pés. O
    // centro desse componente fica no meio e não identifica um pé individual.
    // Nesses casos, cada lado recebe seu próprio Foot no laço de vértices.
    const halfGap=Math.abs(L.ankle.x)*.5;
    if(g.min.x<-halfGap&&g.max.x>halfGap)return null;
    // O cano flexível acompanha a canela; somente sola e peças pequenas
    // permanecem rígidas. Assim o tornozelo dobra sem expor a perna na bota.
    const ankleJoint=L.ankle.y+width*.08;
    if(g.min.y<ankleJoint&&g.max.y>ankleJoint)return null;
    if(!metal&&size.y>width*.25)return null;
    anchor=BODY_BONES[weights(c,'feet').ids[0]];
   }
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
 const legLength=L.hip.distanceTo(L.knee)+L.knee.distanceTo(L.ankle),handRest={};
 for(const side of ['L','R']){
  const along=positions['Hand_'+side].clone().sub(positions['LowerArm_'+side]).normalize(),thumb=V(0,0,1);thumb.addScaledVector(along,-thumb.dot(along)).normalize();
  handRest[side]=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(along,thumb.clone().cross(along).normalize(),thumb));
 }
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
  const capture=pose.capture,actorRotation=root.getWorldQuaternion(new THREE.Quaternion());
  const setOrientation=(bone,q)=>{root.updateMatrixWorld(true);bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(actorRotation.clone().multiply(q)));root.updateMatrixWorld(true)};
  if(body){
   bones.Root.position.set(capture.root[0]*legLength,L.ankle.y+capture.root[1]*legLength-L.center.y,capture.root[2]*legLength);
   for(const name of ['Hips','Spine','Chest','Neck','Head'])setOrientation(bones[name],new THREE.Quaternion().fromArray(capture.orientations[name]).normalize());
   for(const side of ['L','R']){
    if(pose.restDirections){
     for(const [name,next]of [['UpperArm','LowerArm'],['LowerArm','Hand']]){
      const key=name+'_'+side,rest=positions[next+'_'+side].clone().sub(positions[key]).normalize(),correction=new THREE.Quaternion().setFromUnitVectors(rest,V(...pose.restDirections[key]).normalize());
      setOrientation(bones[key],new THREE.Quaternion().fromArray(capture.orientations[key]).normalize().multiply(correction));
     }
    }else orientChain(bones['UpperArm_'+side],bones['LowerArm_'+side],bones['Hand_'+side],V(...capture.directions['UpperArm_'+side]),V(...capture.directions['LowerArm_'+side]),root);
    setOrientation(bones['Hand_'+side],new THREE.Quaternion().fromArray(capture.handFrames[side]).normalize().multiply(handRest[side].clone().invert()));
   }
  }else{
   // As demais anatomias acompanham o ritmo sem receber a pose humana inteira.
   bones.Root.position.set(capture.root[0]*width*.25,0,capture.root[2]*width*.25);
   for(const name of ['Hips','Spine','Chest','Neck','Head']){const q=new THREE.Quaternion().fromArray(capture.orientations[name]).normalize();setOrientation(bones[name],new THREE.Quaternion().slerp(q,motionScale))}
   if(quad||companion)for(const side of ['L','R']){const lift=Math.max(0,capture.feet[side][1]);bones['UpperLeg_'+side].rotation.x=-lift*.7;bones['LowerLeg_'+side].rotation.x=lift*1.2}
  }
  if(mermaid){bones.Root.position.multiplyScalar(.45);bones.Tail.rotation.z=-new THREE.Euler().setFromQuaternion(bones.Hips.quaternion).z*.3;bones.TailTip.rotation.x=(capture.feet.L[1]+capture.feet.R[1])*.2}
  root.updateMatrixWorld(true);
  if(body&&!mermaid&&!companion){
   const targets={};let lowerPelvis=0;
   for(const side of ['L','R']){
    const source=capture.feet[side],rest=pose.restFeet[side];targets[side]=positions['Foot_'+side].clone().add(V(source[0]-rest[0],source[1],source[2]-rest[2]).multiplyScalar(legLength));
    const hip=bones['UpperLeg_'+side].getWorldPosition(V()).applyMatrix4(root.matrixWorld.clone().invert()),target=targets[side],reach=(bones['LowerLeg_'+side].position.length()+bones['Foot_'+side].position.length())*.999;
    const horizontal=(hip.x-target.x)**2+(hip.z-target.z)**2;
    if(horizontal<reach*reach)lowerPelvis=Math.max(lowerPelvis,hip.y-target.y-Math.sqrt(reach*reach-horizontal));
   }
   // A captura humana não tem a mesma largura de quadril do avatar. Adaptar
   // a altura da pelve conserva o apoio sem esticar a perna até perder o alvo.
   if(lowerPelvis>0){bones.Root.position.y-=lowerPelvis;root.updateMatrixWorld(true)}
   for(const side of ['L','R']){
    const target=targets[side];
    const upper=V(...capture.directions['UpperLeg_'+side]),lower=V(...capture.directions['LowerLeg_'+side]),direction=target.clone().sub(bones['UpperLeg_'+side].getWorldPosition(V()).applyMatrix4(root.matrixWorld.clone().invert())).normalize(),normal=upper.clone().cross(lower),bend=normal.length(),pole=V(...capture.footForward[side]);
    // Preservar o plano de flexão, inclusive nos quadris largos. Perto da
    // extensão completa, a frente do pé evita inverter o joelho por ruído.
    pole.addScaledVector(direction,-pole.dot(direction)).normalize();
    if(bend>1e-6)pole.lerp(direction.clone().cross(normal).normalize(),THREE.MathUtils.smoothstep(bend,.035,.12));
    solveLeg(bones['UpperLeg_'+side],bones['LowerLeg_'+side],bones['Foot_'+side],target,root,pole.normalize());
    const foot=bones['Foot_'+side];setOrientation(foot,new THREE.Quaternion().fromArray(capture.footFrames[side]).normalize());
    root.updateMatrixWorld(true);
   }
  }
  const lift=body&&!mermaid?Math.max(0,Math.min(capture.clearance.L,capture.clearance.R)-.01)*legLength:0;
  support(lift);return pose.face;
 }
 function blend(alpha){
  const targetLift=lastLift;
  for(let i=0;i<BODY_BONES.length;i++){const q=bones[BODY_BONES[i]].quaternion;q.slerpQuaternions(transition.q[i],q.clone(),alpha)}
  bones.Root.position.lerpVectors(transition.position,bones.Root.position.clone(),alpha);
  support(THREE.MathUtils.lerp(transition.lift,targetLift,alpha));
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
