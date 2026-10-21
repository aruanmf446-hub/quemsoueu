// Companheiros cartoon do Reino da Lua: malha, rosto, corpo e equipamento separados.
// O rig dos humanos permanece intacto. Aqui bastam mandíbula, olhos e sobrancelhas animados.
import * as THREE from 'three';
import {buildAccessories} from './accessories.js';
import {PRESETS} from './presets.js';
import {sdfMesh} from './body.js';
import {EXPRESSIONS,talkPose} from './rig.js';
import {V,orb,feather,tube,crescent,disposeGroup} from './lunar.js';
const clamp=THREE.MathUtils.clamp;
const union=(a,b,k=.18)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25};
const ellipse=(p,r)=>(x,y,z)=>(Math.hypot((x-p.x)/r.x,(y-p.y)/r.y,(z-p.z)/r.z)-1)*Math.min(r.x,r.y,r.z);
function material(name,color,metal=0){return new THREE.MeshPhysicalMaterial({name,color,roughness:metal?.36:.78,metalness:metal,sheen:metal?0:.4,sheenColor:new THREE.Color('#8c9bb8')})}
function mesh(parent,name,geo,mat){const m=new THREE.Mesh(geo,mat);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function ear(parent,side,mat,inner,fennec=false){
  const shape=new THREE.Shape();shape.moveTo(-.23,0);shape.quadraticCurveTo(-.24,.28,-.08,.59);shape.quadraticCurveTo(-.04,.65,.23,.09);shape.quadraticCurveTo(.26,-.04,-.23,0);
  const g=new THREE.ExtrudeGeometry(shape,{depth:.15,bevelEnabled:true,bevelSize:.04,bevelThickness:.045,bevelSegments:4,curveSegments:20});g.rotateZ(-side*.22);g.translate(side*.55,.57,-.06);if(fennec){const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)*1.2,.57+(p.getY(i)-.57)*2,p.getZ(i));g.computeVertexNormals()}mesh(parent,'Orelha_'+side,g,mat);
  const ins=orb(V(side*(fennec?.68:.57),fennec?1.18:.88,.13),.17,V(fennec?.8:.55,fennec?2.7:1.3,.22));ins.rotateZ(0);mesh(parent,'MioloOrelha_'+side,ins,inner);
}
export function buildCompanion(P,opts={}){
  const fennec=P.species==='fennec',wolf=P.species==='wolf'||fennec,group=new THREE.Group();group.name='Head_V2_'+P.id;
  const body=new THREE.Group();body.name='Body';group.add(body);
  const head=new THREE.Bone();head.name='Bone_Head';group.add(head);
  const face=new THREE.Group();face.name='Rosto';head.add(face);
  const mask=new THREE.Group();mask.name='Acessorio_Mascara';if(!wolf)face.add(mask);
  const fur=material('Pelagem',opts.skin||P.skin),light=material('Pelagem_clara',wolf?'#ded2c2':'#ece0c6'),black=material('Nariz_bico','#12131d'),pink=material('Interior_orelha','#a87578'),white=material('Olho_branco','#fbf4e3'),iris=material('Iris',wolf?'#cb8535':'#bd323e'),pupil=material('Pupila','#090d18');
  mesh(face,'Cranio',orb(V(0,.12,0),1,V(wolf?.75:.78,wolf?.7:.79,.66)),fur);
  if(wolf){
    for(const side of [-1,1]){
      ear(face,side,fur,pink,fennec);
      mesh(face,'Bochecha_'+side,orb(V(side*.4,-.15,.39),.34,V(1,.9,.73)),light);
      for(let j=0;j<4;j++)mesh(face,'Tufo_face',feather(V(side*.55,-.1-j*.12,.04),V(side*(.91-j*.03),-.28-j*.17,.09),.16),fur);
    }
    mesh(face,'Focinho',orb(V(0,-.24,.67),.44,V(1.12,.57,1.06)),light);
    mesh(face,'Nariz',orb(V(0,-.13,1.06),.19,V(1,.7,.75)),black);
  }else{
    // Máscara vazada: anéis separados deixam as duas órbitas livres.
    for(const side of [-1,1]){const ring=new THREE.TorusGeometry(.31,.075,10,48);ring.scale(1,1.1,.7);ring.translate(side*.35,.08,.62);mesh(mask,'Mascara_orbita',ring,light)}
    mesh(mask,'Mascara_testa',orb(V(0,.53,.5),.29,V(1.9,.7,.37)),light);
    const bill=new THREE.ConeGeometry(.23,.78,32,4);bill.rotateX(Math.PI/2);bill.translate(0,-.15,.94);mesh(face,'Bico_superior',bill,black);
    for(let i=0;i<6;i++)mesh(face,'Topete',feather(V(-.32+i*.1,.6,-.08),V(-.5+i*.18,1.02+(i%2)*.09,-.35),.13),fur);
    const moon=crescent(.105,.015);moon.translate(.02,.52,.62);mesh(mask,'Lua_mascara',moon,material('Tinta_rubi','#9c263b'));
  }
  const jaw=new THREE.Bone();jaw.name='Bone_Jaw';jaw.position.set(0,-.38,.25);head.add(jaw);
  mesh(jaw,'Mandibula',orb(V(0,-.005,wolf?.43:.51),wolf?.34:.21,V(1.2,.37,wolf?1:.9)),wolf?light:black);
  mesh(jaw,'Lingua',orb(V(0,.07,wolf?.52:.55),.18,V(.7,.16,1)),material('Lingua','#bb6370'));
  const eyes=[],brows=[];
  for(const side of [-1,1]){
    const eye=new THREE.Group();eye.name='Olho_'+(side<0?'L':'R');eye.position.set(side*.34,.18,.52);face.add(eye);eyes.push(eye);
    mesh(eye,'Esclera',orb(V(),wolf?.215:.26,V(1,wolf?.96:1.1,.6)),white);
    const gaze=new THREE.Group();gaze.name='Olhar_'+side;eye.add(gaze);eye.userData.gaze=gaze;
    mesh(gaze,'Iris',orb(V(side*.02,-.005,.135),.148,V(1,1.08,.3)),iris);
    mesh(gaze,'Pupila',orb(V(side*.02,-.005,.177),.079,V(.8,1.12,.27)),pupil);
    mesh(gaze,'Brilho_olho',orb(V(-.035,.05,.203),.034),white);
    const brow=new THREE.Group();brow.name='Sobrancelha_'+side;brow.position.set(side*.36,.48,.58);face.add(brow);brows.push(brow);
    mesh(brow,'Volume_sobrancelha',orb(V(),.24,V(1.1,.22,.36)),fur);
  }
  if(wolf){
    const fields=[ellipse(V(0,-1.45,-.85),V(.64,.73,1.27)),ellipse(V(0,-.85,-.13),V(.6,.82,.58))];
    for(const side of [-1,1])for(const zz of [-1.55,.12]){fields.push(ellipse(V(side*.48,-2.02,zz),V(.26,.71,.3)));fields.push(ellipse(V(side*.49,-2.71,zz+.04),V(.17,.53,.2)));fields.push(ellipse(V(side*.49,-3.08,zz+.17),V(.27,.17,.36)))}
    const sdf=(x,y,z)=>fields.reduce((d,f)=>union(d,f(x,y,z)),20);
    mesh(body,'Malha_corpo',sdfMesh(sdf,{x:1.05,y0:-3.35,y1:.1,z0:-3,z1:.8},.045),fur);
    mesh(body,'Peito_claro',orb(V(0,-1.03,.27),.5,V(.85,1.48,.55)),light);
    const tail=[V(0,-1.14,-1.95),V(.12,-1.1,-2.65),V(.5,-.7,-3.05),V(.75,-.2,-3.04)];const tg=tube(tail,.3),tp=tg.attributes.position,tc=new Float32Array(tp.count*3),curve=new THREE.CatmullRomCurve3(tail),rows=tg.parameters.tubularSegments,cols=tg.parameters.radialSegments;
    for(let i=0;i<=rows;i++){const t=i/rows,c=curve.getPointAt(t),col=fur.color.clone().lerp(light.color,THREE.MathUtils.smoothstep(t,.7,.9)),scale=1-.86*t*t;for(let j=0;j<=cols;j++){const k=i*(cols+1)+j;tp.setXYZ(k,c.x+(tp.getX(k)-c.x)*scale,c.y+(tp.getY(k)-c.y)*scale,c.z+(tp.getZ(k)-c.z)*scale);col.toArray(tc,k*3)}}tg.setAttribute('color',new THREE.BufferAttribute(tc,3));tg.computeVertexNormals();const tm=material('Pelagem_cauda','#ffffff');tm.vertexColors=true;mesh(body,'Cauda',tg,tm);mesh(body,'Ponta_cauda',orb(tail[3],.045),light);
    for(const side of [-1,1])for(const zz of [-1.55,.12]){
      mesh(body,'Pata_clara',orb(V(side*.49,-3.07,zz+.17),.27,V(1,.61,1.35)),light);
      for(let i=-1;i<=1;i++)mesh(body,'Unha',orb(V(side*.49+i*.1,-3.13,zz+.47),.055,V(.7,.65,1.3)),black);
    }
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2;mesh(body,'Juba',feather(V(Math.sin(a)*.4,-.65,Math.cos(a)*.32-.1),V(Math.sin(a)*.72,-1.28,Math.cos(a)*.57-.2),.17),i%3?fur:light)}
  }else{
    mesh(body,'Malha_corpo',orb(V(0,-1.13,-.05),.82,V(.82,1.12,.75)),fur);
    for(const side of [-1,1]){
      mesh(body,'Asa',orb(V(side*.61,-1.15,-.02),.56,V(.36,1.12,.8)),fur);
      for(let j=0;j<6;j++)mesh(body,'Pena_asa',feather(V(side*.56,-.78-j*.1,-.02),V(side*(.85+j*.018),-1.48-j*.1,-.3),.13),fur);
      mesh(body,'Perna',tube([V(side*.28,-1.75,0),V(side*.32,-2.12,.06)],.065),black);
      for(let j=-1;j<=1;j++)mesh(body,'Garra',tube([V(side*.32,-2.1,.06),V(side*.32+j*.12,-2.23,.33),V(side*.32+j*.15,-2.21,.45)],.045),black);
    }
    for(let i=-2;i<=2;i++)mesh(body,'Pena_cauda',feather(V(i*.08,-1.5,-.38),V(i*.17,-2,-1.03),.15),fur);
  }
  const animated=[jaw,...eyes,...eyes.map(e=>e.userData.gaze),...brows];
  const apply=(pose={})=>{const p={jaw:0,lookX:0,lookY:0,blinkL:0,blinkR:0,wide:0,smile:0,browRaise:0,browAngry:0,...pose};jaw.rotation.x=clamp(p.jaw,0,1)*.65;eyes.forEach((eye,i)=>{eye.scale.y=Math.max(.045,1-clamp(i?p.blinkR:p.blinkL,0,1)+p.wide*.16);eye.userData.gaze.position.set(p.lookX*.05,p.lookY*.05,0)});brows.forEach((b,i)=>{b.rotation.z=(i?1:-1)*(p.browAngry*.32-p.smile*.1);b.position.y=.48+p.browRaise*.08})};
  const mk=(name,fn,dur)=>{const times=[],values=animated.map(()=>({q:[],p:[],s:[]}));for(let i=0;i<=24;i++){const t=i/24*dur;times.push(t);apply(fn(t));animated.forEach((o,k)=>{values[k].q.push(...o.quaternion.toArray());values[k].p.push(...o.position.toArray());values[k].s.push(...o.scale.toArray())})}apply();return new THREE.AnimationClip(name,dur,animated.flatMap((o,k)=>[new THREE.QuaternionKeyframeTrack(o.name+'.quaternion',times,values[k].q),new THREE.VectorKeyframeTrack(o.name+'.position',times,values[k].p),new THREE.VectorKeyframeTrack(o.name+'.scale',times,values[k].s)]))};
  const rig={kind:'companion',apply,makeClips:()=>[mk('Blink',t=>({blinkL:Math.sin(t/.3*Math.PI),blinkR:Math.sin(t/.3*Math.PI)}),.3),mk('Wink_R',t=>({blinkR:Math.sin(t/.6*Math.PI)}),.6),mk('Talk',talkPose,2.4),mk('LookAround',t=>({lookX:Math.sin(t*2),lookY:Math.sin(t)}),3),...Object.entries(EXPRESSIONS).filter(([k])=>k!=='neutro').map(([name,pose])=>mk('Expr_'+name,t=>Object.fromEntries(Object.entries(pose).map(([k,v])=>[k,v*Math.sin(t/1.2*Math.PI)])),1.2))]};
  const fit={companion:true,maskGroup:wolf?null:mask,P,rig,buildRider:opts.buildRider,headBone:head,bodyGroup:body,top:fennec?2.1:wolf?1.65:1.2};
  return{group,params:P,fit,rig,dispose:()=>disposeGroup(group)};
}
export function buildCompanionLook(fit,look){
  const group=new THREE.Group();group.name='Look';let acc;
  function rebuildAcc(lk){if(acc){acc.removeFromParent();disposeGroup(acc)}acc=new THREE.Group();acc.name='Accessories';group.add(acc);if(fit.maskGroup)fit.maskGroup.visible=!!lk.acc?.head;if(!lk.acc?.head)return;
    const fennec=fit.P.species==='fennec',wolf=fit.P.species==='wolf'||fennec,metal=material('Acc_Metal',lk.colors.metal||'#d4a640',.85),fabric=material('Acc_Fabric',lk.colors.fabric||'#253f74'),leather=material('Acc_Couro','#593d32'),gem=material('Acc_Gem',lk.colors.gem||'#4788d9');
    const y=wolf?-.9:-.6,z=wolf?.46:.65;
    const scarf=new THREE.Shape();scarf.moveTo(-.58,0);scarf.quadraticCurveTo(0,-.2,.58,0);scarf.lineTo(.36,-.4);scarf.lineTo(0,-.65);scarf.lineTo(-.36,-.4);scarf.closePath();const g=new THREE.ExtrudeGeometry(scarf,{depth:.04,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,bevelSegments:3});g.translate(0,y,z);mesh(acc,'Lenco',g,fabric);
    const moon=fennec?new THREE.CircleGeometry(.18,5):crescent(.18,.035);moon.translate(0,y-.3,z+.07);mesh(acc,fennec?'Medalhao_estrela':'Medalhao_lunar',moon,metal);
    for(const side of [-1,1]){const pts=[V(side*.5,y+.1,z-.09),V(side*.65,y-.15,.04),V(side*.49,y-.4,-.45)];mesh(acc,'Correia',tube(pts,.035),leather);const brooch=new THREE.TorusGeometry(.12,.025,8,32);brooch.translate(side*.45,y-.1,z+.015);mesh(acc,'Broche',brooch,metal)}
    if(wolf){
      for(const side of [-1,1]){const pack=orb(V(side*.62,-1.35,-.91),.4,V(.46,1,.8));mesh(acc,'Bolsa_viagem',pack,leather);mesh(acc,'Fivela_bolsa',orb(V(side*.81,-1.3,-.81),.09,V(.4,1,1)),metal)}
      if(fennec){
        mesh(acc,'Sela',orb(V(0,-.65,-.98),.5,V(1.2,.22,1.2)),leather);
        const roll=new THREE.CylinderGeometry(.17,.17,.9,32);roll.rotateZ(Math.PI/2);roll.translate(0,-.55,-1.56);mesh(acc,'Manta_enrolada',roll,fabric);
        for(const side of [-1,1])mesh(acc,'Estribo',tube([V(side*.62,-.72,-.8),V(side*.79,-1.48,-.6),V(side*.61,-1.48,-.6),V(side*.62,-.72,-.8)],.025),metal);
        if(lk.acc.head==='fennec_rider'){
          // A combinação reutiliza o rosto real do cowboy; o corpo sentado é uma base própria de montaria.
          const rider=fit.buildRider(),riderRoot=new THREE.Group();riderRoot.name='Cowboy_Montado';riderRoot.scale.setScalar(.55);riderRoot.position.set(0,.62,-1);acc.add(riderRoot);riderRoot.add(rider.group);rider.group.position.y=2.2;
          const kit=buildAccessories(rider.fit,{head:'cowboy'},{metal:'#c29b50',fabric:'#69432b'});rider.group.add(kit.group);
          const green=material('Pele_cowboy',PRESETS.frontier_cowboy.skin),coat=material('Colete_cowboy','#68432b'),pants=material('Calca_cowboy','#302b29');
          mesh(riderRoot,'Tronco_sentado',orb(V(0,-.55,0),.55,V(1,3.4,.75)),coat);
          for(const side of [-1,1]){
            mesh(riderRoot,'Braco_sentado',tube([V(side*.48,.8,0),V(side*.95,-.3,.25),V(side*.65,-1.2,.65)],.16),green);
            mesh(riderRoot,'Calca_sentada',tube([V(side*.3,-2.1,0),V(side*1.35,-2.38,.18),V(side*1.42,-3.08,.25)],.23),pants);
            mesh(riderRoot,'Bota_sentada',orb(V(side*1.42,-3.19,.35),.25,V(1,.8,1.45)),leather);
          }
          const scarf=new THREE.TorusGeometry(.4,.11,10,40);scarf.rotateX(Math.PI/2);scarf.translate(0,1.02,.05);mesh(riderRoot,'Lenco_cowboy',scarf,fabric);
          // Nomes únicos no GLB: o rosto do cavaleiro não disputa as trilhas do feneco.
          rider.group.traverse(o=>{if(o.name)o.name='Cavaleiro_'+o.name});
          acc.userData.riderRig=rider.rig;
        }
      }
      for(const side of [-1,1]){const cuff=new THREE.CylinderGeometry(.28,.25,.23,48,1,true);cuff.translate(side*.49,-2.65,.16);mesh(acc,'Bracelete',cuff,metal)}
    }else{
      for(const side of [-1,1]){const ring=new THREE.TorusGeometry(.075,.018,8,32);ring.translate(side*.32,-2.05,.08);ring.rotateX(0);mesh(acc,'Anilha',ring,metal)}
      mesh(acc,'Joia_rubi',orb(V(0,y-.65,z+.05),.09,V(.75,1.3,.7)),gem);
    }
  }
  rebuildAcc(look);
  const baseApply=fit.rig.apply,baseClips=fit.rig.makeClips;
  fit.rig.apply=pose=>{baseApply(pose);acc?.userData.riderRig?.apply(pose)};
  fit.rig.makeClips=()=>{const clips=baseClips(),rider=acc?.userData.riderRig?.makeClips();if(rider)for(let i=0;i<clips.length;i++){clips[i].tracks.push(...rider[i].tracks);clips[i].resetDuration()}return clips};
  return{group,get acc(){return{group:acc}},rebuildAcc,setColors(cols){acc.traverse(m=>{if(m.isMesh){const key=m.material.name==='Acc_Metal'?'metal':m.material.name==='Acc_Fabric'?'fabric':m.material.name==='Acc_Gem'?'gem':null;if(key&&cols[key])m.material.color.set(cols[key])}})},setHairColor(){},dispose(){fit.rig.apply=baseApply;fit.rig.makeClips=baseClips;disposeGroup(group)}};
}
