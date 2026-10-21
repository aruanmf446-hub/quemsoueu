// Companheiros esculpidos: volumes contínuos, pelagem em mechas e equipamento independente.
import * as THREE from 'three';
import {buildAccessories} from './accessories.js';
import {PRESETS} from './presets.js';
import {sdfMesh} from './body.js';
import {clothSurface} from './fabric.js';
import {EXPRESSIONS,talkPose} from './rig.js';
import {V,orb,tube,crescent,disposeGroup} from './lunar.js';
import {tuft,ribbon,badge,panel,buckleGeo,finishMaterial} from './detail.js';
const clamp=THREE.MathUtils.clamp,step=THREE.MathUtils.smoothstep,PI=Math.PI;
const union=(a,b,k=.18)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25};
const ellipse=(p,r)=>(x,y,z)=>(Math.hypot((x-p.x)/r.x,(y-p.y)/r.y,(z-p.z)/r.z)-1)*Math.min(r.x,r.y,r.z);
function material(name,color,metal=0){const m=new THREE.MeshPhysicalMaterial({name,color});return finishMaterial(m,metal?'metal':'fabric')}
function mesh(parent,name,geo,mat){const m=new THREE.Mesh(geo,mat);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function ear(parent,side,mat,inner,fennec){
 const h=fennec?1.36:.8,outer=(t,u)=>{const x=1-2*u,w=Math.max(.006,(.24+.14*Math.sin(PI*t))*(1-t)**.62);return V(side*(.48+.27*t)+x*w,.54+h*t+.035*(1-x*x)*(1-t),.025+.13*Math.sin(PI*t)-.1*x*x-.02*t)};
 mesh(parent,'Orelha_'+side,clothSurface(40,32,outer,{thickness:.075}),mat);
 mesh(parent,'Interior_orelha_'+side,clothSurface(32,24,(t,u)=>{const p=outer(.1+t*.78,.21+u*.58);p.z+=.024;return p},{thickness:.008}),inner);
 const border=[];for(let i=0;i<=32;i++)border.push(outer(i/32,0));for(let i=32;i>=0;i--)border.push(outer(i/32,1));border.push(border[0]);mesh(parent,'Borda_orelha',tube(border,.019),mat);
 for(let i=0;i<3;i++)mesh(parent,'Pelo_orelha',tuft(V(side*.5,.58+i*.09,.10),V(side*(.53+i*.02),.88+i*.1,.15),.035,.018,.015),mat);
}
function paint(g,base,light,kind){
 const p=g.attributes.position,col=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),noise=.97+.025*Math.sin(x*39+y*23)*Math.cos(z*31-y*11);let mix=0;
 if(kind==='face')mix=(1-step(y,-.09,.24))*step(z,.23,.67)*.98;
 if(kind==='body')mix=step(z,-.2,.35)*(1-step(Math.abs(x),.30,.65))*.95;
 const c=base.clone().lerp(light,mix).multiplyScalar(noise);c.toArray(col,i*3)}g.setAttribute('color',new THREE.BufferAttribute(col,3));return g;
}
export function buildCompanion(P,opts={}){
 const fennec=P.species==='fennec',wolf=P.species==='wolf'||fennec,group=new THREE.Group();group.name='Head_V2_'+P.id;
 const body=new THREE.Group();body.name='Body';group.add(body);const head=new THREE.Bone();head.name='Bone_Head';group.add(head);const face=new THREE.Group();face.name='Rosto';head.add(face);const mask=new THREE.Group();mask.name='Acessorio_Mascara';if(!wolf)face.add(mask);
 const fur=material('Pelagem',opts.skin||P.skin),light=material('Pelagem_clara',fennec?'#f3dfbb':wolf?'#ded7cc':'#eee1c8'),black=material('Nariz_bico','#181723'),pink=material('Interior_orelha',fennec?'#ce957b':'#9d787b'),white=material('Olho_branco','#faf2de'),iris=material('Iris',wolf?'#bb6c26':'#a53b35'),pupil=material('Pupila','#100e17');black.roughness=.35;black.clearcoat=.35;iris.roughness=.25;iris.clearcoat=.55;
 const coated=fur.clone();coated.name='Pelagem_esculpida';coated.color.set('#ffffff');coated.vertexColors=true;
 if(wolf){
  const skull=ellipse(V(0,.23,-.02),V(.72,.64,.60)),muzzle=ellipse(V(0,-.16,.51),V(.44,.32,.47)),cheeks=[-1,1].map(s=>ellipse(V(s*.46,-.10,.25),V(.34,.37,.39)));
  const sockets=[-1,1].map(s=>ellipse(V(s*.32,.23,.57),V(.235,.205,.22)));
  const sdf=(x,y,z)=>{let d=union(skull(x,y,z),muzzle(x,y,z),.19);for(const f of cheeks)d=union(d,f(x,y,z),.17);for(const f of sockets)d=Math.max(d,-f(x,y,z));return d};
  mesh(face,'Malha_rosto',paint(sdfMesh(sdf,{x:1.1,y0:-.65,y1:.98,z0:-.75,z1:1.1},.026),fur.color,light.color,'face'),coated);
  for(const side of [-1,1]){ear(face,side,fur,pink,fennec);for(let i=0;i<7;i++)mesh(face,'Mecha_bochecha',tuft(V(side*.49,.08-i*.055,.25),V(side*(.84+.04*Math.sin(i)),.02-i*.09,.28),.13,.052,.04),i>1?light:fur)}
  const nose=new THREE.Shape();nose.moveTo(-.16,.045);nose.quadraticCurveTo(0,.115,.16,.045);nose.quadraticCurveTo(.16,-.025,.03,-.13);nose.quadraticCurveTo(0,-.16,-.03,-.13);nose.quadraticCurveTo(-.16,-.025,-.16,.045);const ng=new THREE.ExtrudeGeometry(nose,{depth:.10,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:4,curveSegments:24});ng.translate(0,-.09,.91);mesh(face,'Nariz',ng,black);
  mesh(face,'Sulco_focinho',tube([V(0,-.22,1.0),V(0,-.30,.96),V(0,-.34,.87)],.011),black);
  for(const side of [-1,1]){mesh(face,'Sorriso',tube([V(0,-.34,.89),V(side*.2,-.37,.88),V(side*.36,-.31,.74)],.012),black);for(let i=0;i<3;i++)mesh(face,'Ponto_bigode',orb(V(side*(.19+.055*i),-.21-.04*(i%2),.93-.035*i),.012),black)}
  for(let i=-2;i<=2;i++)mesh(face,'Topete',tuft(V(i*.13,.63,.02),V(i*.17,.94+(.04*(2-Math.abs(i))),-.09),.11,.055,.09),fur);
 }else{
  mesh(face,'Cranio',orb(V(0,.14,-.02),.76,V(1,1.04,.85)),fur);
  for(const side of [-1,1]){const ring=new THREE.TorusGeometry(.275,.045,12,64);ring.scale(1,1.12,.65);ring.translate(side*.32,.23,.61);mesh(mask,'Mascara_orbita',ring,light);for(let i=0;i<4;i++)mesh(face,'Mecha_face',tuft(V(side*.54,-.05-i*.09,.19),V(side*.79,-.20-i*.13,.13),.13,.035,.04),fur)}
  const beak=clothSurface(40,40,(t,u)=>{const a=u*2*PI,r=Math.max(.005,.23*Math.sin(PI*(.18+.82*t))*(1-.65*t));return V(Math.cos(a)*r,-.02-.36*t*t+Math.sin(a)*r*.55,.6+.69*t)},{closed:true,thickness:.022});mesh(face,'Bico_superior',beak,black);
  for(const side of [-1,1])mesh(face,'Narina',orb(V(side*.105,-.02,.88),.028,V(1,.5,.35)),pupil);
  for(let i=-2;i<=2;i++)mesh(face,'Crista',tuft(V(i*.12,.65,-.10),V(i*.15,.97+.04*(2-Math.abs(i)),-.29),.1,.035,.07),fur);
  const moon=crescent(.11,.018);moon.translate(0,.54,.63);mesh(mask,'Lua_mascara',moon,material('Tinta_rubi','#9c263b'));
 }
 const jaw=new THREE.Bone();jaw.name='Bone_Jaw';jaw.position.set(0,-.38,.25);head.add(jaw);mesh(jaw,'Mandibula',orb(V(0,-.005,wolf?.47:.56),wolf?.3:.19,V(1.15,.3,wolf?1:.65)),wolf?light:black);
 mesh(jaw,'Lingua',orb(V(0,.048,wolf?.53:.56),.14,V(.7,.12,1)),material('Lingua','#ba6d76'));
 const eyes=[],brows=[];
 for(const side of [-1,1]){
  const eye=new THREE.Group();eye.name='Olho_'+(side<0?'L':'R');eye.position.set(side*.32,.23,.57);face.add(eye);eyes.push(eye);
  mesh(eye,'Esclera',orb(V(),wolf?.225:.245,V(1,.86,.59)),white);
  for(const upper of [-1,1]){const pts=[];for(let j=0;j<=24;j++){const a=j/24*PI;pts.push(V(Math.cos(a)*.224,upper*Math.sin(a)*.174,.04+.065*Math.sin(a)))}mesh(eye,'Palpebra',tube(pts,upper>0?.023:.014),fur)}
  const gaze=new THREE.Group();gaze.name='Olhar_'+side;eye.add(gaze);eye.userData.gaze=gaze;
  mesh(gaze,'Anel_iris',orb(V(side*.017,-.01,.127),.15,V(1,1.08,.15)),black);
  mesh(gaze,'Iris',orb(V(side*.017,-.01,.14),.136,V(1,1.08,.16)),iris);
  mesh(gaze,'Pupila',orb(V(side*.017,-.008,.16),.086,V(.9,1.12,.17)),pupil);
  mesh(gaze,'Brilho_olho',orb(V(-.036,.051,.177),.028,V(1,1,.5)),white);mesh(gaze,'Brilho_menor',orb(V(.052,-.049,.177),.011,V(1,1,.5)),white);
  const brow=new THREE.Group();brow.name='Sobrancelha_'+side;brow.position.set(side*.32,.48,.58);face.add(brow);brows.push(brow);mesh(brow,'Sobrancelha',tuft(V(-side*.21,.03,0),V(side*.22,-.02,-.03),.058,.03,.025),fur);
 }
 const sole=fennec?-2.67:wolf?-3.27:-2.28,paws=[];
 if(wolf){
  const leg=fennec?.82:1,fields=[ellipse(V(0,-1.27,-.92),V(.59,.58,1.2)),ellipse(V(0,-.82,-.03),V(.56,.72,.52)),ellipse(V(0,-1.33,-1.72),V(.60,.62,.48))];
  for(const side of [-1,1])for(const rear of [false,true]){const z=rear?-1.66:.16,hip=V(side*.43,-1.42,z),knee=V(side*.48,-1.99*leg,rear?z+.15:z-.04),ankle=V(side*.47,sole+.42,rear?z-.07:z+.08),paw=V(side*.48,sole+.16,z+.21);paws.push({side,hip,knee,ankle,paw});fields.push(ellipse(hip,V(rear?.36:.27,.60*leg,.34)),ellipse(knee,V(.20,.47*leg,.23)),ellipse(ankle,V(.145,.35,.17)),ellipse(paw,V(.25,.16,.31)))}
  const sdf=(x,y,z)=>fields.reduce((d,f)=>union(d,f(x,y,z),.18),20);mesh(body,'Malha_corpo',paint(sdfMesh(sdf,{x:1.05,y0:sole-.05,y1:.1,z0:-2.5,z1:.8},.038),fur.color,light.color,'body'),coated);
  for(const {side,paw}of paws){mesh(body,'Pata_clara',orb(paw,.24,V(1,.56,1.2)),light);for(let i=-1;i<=1;i++)mesh(body,'Unha',orb(paw.clone().add(V(i*.09,-.045,.26)),.043,V(.7,.65,1.25)),black)}
  const tail=[V(0,-1.08,-1.96),V(.12,-1.17,-2.49),V(.47,-.93,-3.03),V(.73,-.46,-3.35)],tg=tube(tail,.43),tp=tg.attributes.position,tc=new Float32Array(tp.count*3),curve=new THREE.CatmullRomCurve3(tail),nr=tg.parameters.tubularSegments,nc=tg.parameters.radialSegments;
  for(let i=0;i<=nr;i++){const t=i/nr,c=curve.getPointAt(t),color=fur.color.clone().lerp(fennec?black.color:light.color,step(t,.70,.94)),scale=.72+.40*Math.sin(PI*t)-.68*t**5;for(let j=0;j<=nc;j++){const k=i*(nc+1)+j;tp.setXYZ(k,c.x+(tp.getX(k)-c.x)*scale,c.y+(tp.getY(k)-c.y)*scale,c.z+(tp.getZ(k)-c.z)*scale);color.toArray(tc,k*3)}}tg.setAttribute('color',new THREE.BufferAttribute(tc,3));tg.computeVertexNormals();const tm=fur.clone();tm.color.set('#ffffff');tm.vertexColors=true;mesh(body,'Cauda',tg,tm);
  for(let i=0;i<28;i++){const a=i*2.399,y=-.55-(i%7)*.095,r=.43+(i%7)*.03,c=V(Math.sin(a)*r,y,Math.cos(a)*r-.05),end=c.clone().add(V(Math.sin(a)*.19,-.36,Math.cos(a)*.15));mesh(body,'Pelagem_gola',tuft(c,end,.13,.045,.045),Math.cos(a)>.15?light:fur)}
  for(const side of [-1,1])for(let i=0;i<9;i++)mesh(body,'Pelagem_flanco',tuft(V(side*.54,-1.0-(i%3)*.17,-.75-Math.floor(i/3)*.35),V(side*.64,-1.3-(i%3)*.17,-.92-Math.floor(i/3)*.35),.11,.04,.03),fur);
 }else{
  mesh(body,'Malha_corpo',orb(V(0,-1.12,-.13),.81,V(.8,1.08,.81)),fur);
  for(const side of [-1,1]){
   mesh(body,'Base_asa',orb(V(side*.55,-1.1,-.06),.5,V(.38,1.14,.8)),fur);
   for(let layer=0;layer<3;layer++)for(let j=0;j<6;j++)mesh(body,'Pena_asa',tuft(V(side*(.49+layer*.05),-.69-j*.09,-.10-layer*.07),V(side*(.70+layer*.07),-1.14-j*.11-layer*.13,-.23-layer*.1),.12,.026,.04),fur);
   mesh(body,'Perna',tube([V(side*.27,-1.75,0),V(side*.31,-2.1,.07)],.06),black);
   for(let j=-1;j<=1;j++)mesh(body,'Garra',tube([V(side*.31,-2.1,.07),V(side*.31+j*.12,-2.23,.31),V(side*.31+j*.15,-2.20,.44)],.037),black);
  }
  for(let i=-3;i<=3;i++)mesh(body,'Pena_cauda',tuft(V(i*.07,-1.45,-.39),V(i*.14,-2.02,-1.09),.11,.025,.07),fur);
 }
  const animated=[jaw,...eyes,...eyes.map(e=>e.userData.gaze),...brows];
  const apply=(pose={})=>{const p={jaw:0,lookX:0,lookY:0,blinkL:0,blinkR:0,wide:0,smile:0,browRaise:0,browAngry:0,...pose};jaw.rotation.x=clamp(p.jaw,0,1)*.65;eyes.forEach((eye,i)=>{eye.scale.y=Math.max(.045,1-clamp(i?p.blinkR:p.blinkL,0,1)+p.wide*.16);eye.userData.gaze.position.set(p.lookX*.05,p.lookY*.05,0)});brows.forEach((b,i)=>{b.rotation.z=(i?1:-1)*(p.browAngry*.32-p.smile*.1);b.position.y=.48+p.browRaise*.08})};
  const mk=(name,fn,dur)=>{const times=[],values=animated.map(()=>({q:[],p:[],s:[]}));for(let i=0;i<=24;i++){const t=i/24*dur;times.push(t);apply(fn(t));animated.forEach((o,k)=>{values[k].q.push(...o.quaternion.toArray());values[k].p.push(...o.position.toArray());values[k].s.push(...o.scale.toArray())})}apply();return new THREE.AnimationClip(name,dur,animated.flatMap((o,k)=>[new THREE.QuaternionKeyframeTrack(o.name+'.quaternion',times,values[k].q),new THREE.VectorKeyframeTrack(o.name+'.position',times,values[k].p),new THREE.VectorKeyframeTrack(o.name+'.scale',times,values[k].s)]))};
  const rig={kind:'companion',apply,makeClips:()=>[mk('Blink',t=>({blinkL:Math.sin(t/.3*Math.PI),blinkR:Math.sin(t/.3*Math.PI)}),.3),mk('Wink_R',t=>({blinkR:Math.sin(t/.6*Math.PI)}),.6),mk('Talk',talkPose,2.4),mk('LookAround',t=>({lookX:Math.sin(t*2),lookY:Math.sin(t)}),3),...Object.entries(EXPRESSIONS).filter(([k])=>k!=='neutro').map(([name,pose])=>mk('Expr_'+name,t=>Object.fromEntries(Object.entries(pose).map(([k,v])=>[k,v*Math.sin(t/1.2*Math.PI)])),1.2))]};
  const fit={companion:true,maskGroup:wolf?null:mask,P,rig,buildRider:opts.buildRider,headBone:head,bodyGroup:body,top:fennec?2.1:wolf?1.65:1.2,ySole:sole,paws};
  return{group,params:P,fit,rig,dispose:()=>disposeGroup(group)};
}
export function buildCompanionLook(fit,look){
 const group=new THREE.Group();group.name='Look';let acc;
 function rebuildAcc(lk){
  if(acc){acc.removeFromParent();disposeGroup(acc)}acc=new THREE.Group();acc.name='Accessories';group.add(acc);if(fit.maskGroup)fit.maskGroup.visible=!!lk.acc?.head;if(!lk.acc?.head)return;
  const fennec=fit.P.species==='fennec',wolf=fennec||fit.P.species==='wolf',metal=material('Acc_Metal',lk.colors.metal||'#c29b50',.8),fabric=material('Acc_Fabric',lk.colors.fabric||'#253f74'),leather=finishMaterial(material('Acc_Couro','#55392a'),'leather'),dark=finishMaterial(material('Acc_Couro_escuro','#34231e'),'leather');
  const add=(name,g,m)=>mesh(acc,name,g,m),yc=wolf?-.66:-.60,zc=wolf?.54:.64;
  const scarf=(t,u)=>{const a=(u-.5)*2.45,r=(wolf?.58:.50)*(1-.57*t)+.022*Math.sin(PI*4*t+u*5);return V(Math.sin(a)*r,yc-t*(wolf?.55:.48)+.06*Math.cos(a),Math.cos(a)*r+zc-.44+.12*Math.sin(PI*t))};
  add('Lenco_drapeado',clothSurface(40,64,scarf,{thickness:.032}),fabric);
  add('Bainha_lenco',tube(Array.from({length:65},(_,i)=>scarf(.98,i/64).add(V(0,0,.008))),.012),metal);
  const medal=fennec?badge('star',.14,.027):crescent(.14,.027);medal.translate(0,yc-.27,zc+.045);add(fennec?'Medalhao_estrela':'Medalhao_lunar',medal,metal);
  for(const side of [-1,1]){const points=[V(side*.43,yc+.02,zc-.08),V(side*.57,yc-.22,.08),V(side*.45,yc-.55,-.45)];add('Peitoral_couro',ribbon(points,.10,.022),leather);const ring=new THREE.TorusGeometry(.075,.015,10,40);ring.translate(side*.40,yc-.08,zc-.04);add('Argola_peitoral',ring,metal)}
  function bag(parent,x,y,z,side){
   const b=new THREE.Group();b.name='Alforje';b.position.set(x,y,z);b.rotation.y=side*PI/2;parent.add(b);
   mesh(b,'Bolsa_couro',panel(.53,.63,.19),leather);
   const flap=clothSurface(24,24,(t,u)=>V((u-.5)*.53,.31-.29*t+.025*Math.cos(u*PI*2),.11+.05*Math.sin(PI*t)),{thickness:.025});mesh(b,'Aba_bolsa',flap,dark);
   mesh(b,'Costura',tube([V(-.23,-.26,.11),V(-.24,.18,.12),V(0,.27,.13),V(.24,.18,.12),V(.23,-.26,.11)],.008),fabric);
   const bg=buckleGeo(.13,.115,.02);bg.translate(0,.035,.17);mesh(b,'Fivela',bg,metal);mesh(b,'Tira_fivela',panel(.045,.27,.025).translate(0,-.03,.15),leather);
   for(const sg of [-1,1])for(const yy of [-.25,.24])mesh(b,'Rebite',orb(V(sg*.21,yy,.12),.018,V(1,1,.5)),metal);
  }
  if(wolf){
   for(const side of [-1,1])bag(acc,side*.66,-1.22,-1.04,side);
   for(const paw of fit.paws){const y=paw.ankle.y+.025,z=paw.ankle.z,cuff=new THREE.CylinderGeometry(.185,.17,.16,40,1,true);cuff.translate(paw.ankle.x,y,z);add('Polaina_couro',cuff,leather);for(const dy of [-.075,.075]){const ring=new THREE.TorusGeometry(.18,.015,8,40);ring.rotateX(PI/2);ring.translate(paw.ankle.x,y+dy,z);add('Borda_polaina',ring,metal)}const b=buckleGeo(.085,.075,.013);b.rotateY(paw.side*PI/2);b.translate(paw.ankle.x+paw.side*.19,y,z);add('Fivela_polaina',b,metal)}
   if(fennec){
    add('Manta_sela',clothSurface(36,48,(t,u)=>{const a=(u-.5)*PI*.95;return V(Math.sin(a)*.68,-.64-.49*(1-Math.cos(a))+.025*Math.sin(t*PI*5),-1.55+1.12*t)},{thickness:.045}),fabric);
    add('Sela',clothSurface(40,40,(t,u)=>V((u-.5)*1.08,-.59+.15*(2*u-1)**2+.1*Math.cos(t*2*PI),-1.39+.83*t),{thickness:.09}),leather);
    for(const z of [-1.37,-.58])add('Borda_sela',tube([V(-.5,-.36,z),V(0,-.47,z),V(.5,-.36,z)],.045),dark);
    add('Pomo_sela',tube([V(0,-.44,-.59),V(0,-.24,-.53),V(0,-.21,-.43)],.055),leather);
    const roll=new THREE.CylinderGeometry(.16,.16,1,40);roll.rotateZ(PI/2);roll.translate(0,-.54,-1.64);add('Manta_enrolada',roll,fabric);
    for(const side of [-1,1]){const loop=[V(side*.41,-.38,-1.64),V(side*.41,-.53,-1.82),V(side*.41,-.71,-1.64),V(side*.41,-.53,-1.47),V(side*.41,-.38,-1.64)];add('Correia_manta',ribbon(loop,.045,.018),leather);add('Estribo',tube([V(side*.63,-.67,-.81),V(side*.77,-1.30,-.65),V(side*.55,-1.30,-.65),V(side*.63,-.67,-.81)],.022),metal)}
    if(lk.acc.head==='fennec_rider'){
     const rider=fit.buildRider(),r=new THREE.Group();r.name='Cowboy_Montado';r.scale.setScalar(.48);r.position.set(0,.43,-1.05);acc.add(r);r.add(rider.group);rider.group.position.y=.6;
     const kit=buildAccessories(rider.fit,{head:'frontier_hat'},{metal:lk.colors.metal||'#c29b50',fabric:'#69432b'});rider.group.add(kit.group);
     const green=material('Pele_cowboy',PRESETS.frontier_cowboy.skin),pants=finishMaterial(material('Calca_cowboy','#302b29'),'fabric');
     mesh(r,'Colete_sentado',orb(V(0,-.9,0),.55,V(1,1.9,.75)),leather);
     for(const side of [-1,1]){mesh(r,'Braco_sentado',tube([V(side*.48,-.2,0),V(side*.91,-.8,.25),V(side*.65,-1.4,.65)],.16),green);mesh(r,'Calca_sentada',tube([V(side*.3,-2.1,0),V(side*1.55,-2.42,.18),V(side*1.55,-3.40,.25)],.23),pants);mesh(r,'Bota_sentada',orb(V(side*1.55,-3.43,.36),.25,V(1,.85,1.45)),leather);const seam=buckleGeo(.12,.11,.018);seam.translate(side*.52,-1.8,.35);mesh(r,'Fivela_colete',seam,metal)}
     mesh(r,'Lenco_cowboy',clothSurface(30,40,(t,u)=>{const a=(u-.5)*2.5;return V(Math.sin(a)*(.64-.38*t),.30-.50*t,Math.cos(a)*(.64-.38*t)+.08)},{thickness:.035}),fabric);
     for(const side of [-1,1])add('Redea',ribbon([V(side*.4,-.12,.65),V(side*.5,-.33,.20),V(side*.31,-.20,-.66)],.025,.012),dark);
     rider.group.traverse(o=>{if(o.name)o.name='Cavaleiro_'+o.name});acc.userData.riderRig=rider.rig;
    }
   }
  }else{
   for(const side of [-1,1]){const pts=[];for(let i=0;i<=8;i++)pts.push(V(side*(.10+i*.055),-.9-.03*Math.sin(i/8*PI),.52-i*.06));add('Corrente',tube(pts,.016),metal);const ring=new THREE.TorusGeometry(.075,.016,8,32);ring.translate(side*.31,-2.07,.08);add('Anilha',ring,metal)}
   add('Joia_rubi',orb(V(0,yc-.40,zc+.05),.09,V(.75,1.3,.55)),material('Acc_Gem',lk.colors.gem||'#c0182a'));
  }
 }
 rebuildAcc(look);
 const baseApply=fit.rig.apply,baseClips=fit.rig.makeClips;
 fit.rig.apply=pose=>{baseApply(pose);acc?.userData.riderRig?.apply(pose)};
 fit.rig.makeClips=()=>{const clips=baseClips(),rider=acc?.userData.riderRig?.makeClips();if(rider)for(let i=0;i<clips.length;i++){clips[i].tracks.push(...rider[i].tracks);clips[i].resetDuration()}return clips};
 return{group,get acc(){return{group:acc}},rebuildAcc,setColors(cols){acc.traverse(m=>{if(m.isMesh){const key=m.material.name==='Acc_Metal'?'metal':m.material.name==='Acc_Fabric'?'fabric':m.material.name==='Acc_Gem'?'gem':null;if(key&&cols[key])m.material.color.set(cols[key])}})},setHairColor(){},dispose(){fit.rig.apply=baseApply;fit.rig.makeClips=baseClips;disposeGroup(group)}};
}
