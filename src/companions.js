// Companheiros esculpidos: volumes contínuos, pelagem em mechas e equipamento independente.
import * as THREE from 'three';
import {buildAccessories} from './accessories.js';
import {PRESETS} from './presets.js';
import {sdfMesh} from './body.js';
import {clothSurface,smoothCloth} from './fabric.js';
import {EXPRESSIONS,talkPose} from './rig.js';
import {V,orb,tube,crescent,disposeGroup} from './lunar.js';
import {tuft,ribbon,badge,panel,buckleGeo,finishMaterial} from './detail.js';
import {quill,mergeVolumes,grain,petalPlate,eyeDisc,smoothRingSeams} from './companion-detail.js';
import {heroSurface} from './hero-material.js';
import {groomSurface} from './groom.js';
const groomMaterials=new WeakMap();
const clamp=THREE.MathUtils.clamp,step=THREE.MathUtils.smoothstep,PI=Math.PI;
const union=(a,b,k=.18)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25};
const ellipse=(p,r)=>(x,y,z)=>(Math.hypot((x-p.x)/r.x,(y-p.y)/r.y,(z-p.z)/r.z)-1)*Math.min(r.x,r.y,r.z);
// Projeta folículos na superfície esculpida, em vez de estimar um cilindro.
// O primeiro anel fica enterrado: tampas planas não aparecem entre os tufos.
function surfacePoint(point,field,pad=0,outward=null){
 const p=point.clone(),n=V(),h=.002;
 for(let i=0;i<36;i++){
  const d=field(p.x,p.y,p.z);n.set(field(p.x+h,p.y,p.z)-field(p.x-h,p.y,p.z),field(p.x,p.y+h,p.z)-field(p.x,p.y-h,p.z),field(p.x,p.y,p.z+h)-field(p.x,p.y,p.z-h));
  if(n.lengthSq()<1e-12)break;n.normalize();if(Math.abs(d)<.0001)break;p.addScaledVector(n,-d*.9);
 }
 return p.addScaledVector(outward?.clone().normalize()||n,pad);
}
function attachedQuill(field,start,end,width,depth,bend,feather,outward,projectTip=true){
 const n=outward.clone().normalize(),a=surfacePoint(start,field,-Math.max(.027,depth*1.3),n),b=projectTip?surfacePoint(end,field,.012,n):end,h=.002;
 const gradient=V(field(a.x+h,a.y,a.z)-field(a.x-h,a.y,a.z),field(a.x,a.y+h,a.z)-field(a.x,a.y-h,a.z),field(a.x,a.y,a.z+h)-field(a.x,a.y,a.z-h)).normalize();
 let g,max;
 for(let attempt=0;attempt<6;attempt++){
  g=quill(a,b,width,depth,bend,feather,n);const p=g.attributes.position;max=-Infinity;
  for(let i=0;i<=20;i++)max=Math.max(max,field(p.getX(i),p.getY(i),p.getZ(i)));
  if(max<-.010)break;if(attempt<5)g.dispose();a.addScaledVector(gradient,-(max+.014)*1.35);
 }
 g.userData.rootSurfaceMax=max;return g;
}
function material(name,color,metal=0){const m=new THREE.MeshPhysicalMaterial({name,color});m.userData.surfaceKind=metal?'metal':/(^|_)gem2?($|_)/i.test(name)?'gem':/couro|leather/i.test(name)?'leather':/fur|pelagem|plum|feather|pena/i.test(name)?'fur':/fabric|cloth|tecido|calca/i.test(name)?'fabric':'polymer';return finishMaterial(m,metal?'metal':'fabric')}
function mesh(parent,name,geo,mat){
 if(/eye|iris|pupil|cornea|olho|palpebra/i.test(name+' '+mat.name)){mat=mat.clone();mat.normalMap=null;mat.roughnessMap=null}
 else if(geo.userData.groom&&/pelagem|plum|pena|mecha|pelage|fourrure|criniere/i.test(mat.name+' '+name)){let groom=groomMaterials.get(mat);if(!groom){groom=groomSurface(mat.clone(),{roughness:mat.roughness,anisotropy:.35});groomMaterials.set(mat,groom)}mat=groom;if(geo.index&&!geo.attributes.tangent)geo.computeTangents()}
 else heroSurface(geo,mat,mat.userData.surfaceKind||'fur',1,{detail:['fabric','leather'].includes(mat.userData.surfaceKind)});
 const m=new THREE.Mesh(geo,mat);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function ear(parent,side,mat,inner,fennec,pale){
 const h=fennec?1.30:.91,outer=(t,u)=>{const x=1-2*u,w=Math.max(.004,((fennec?.32:.25)+.13*Math.sin(PI*t))*(1-t)**.68);return V(side*(.48+(fennec?.46:.24)*t)+x*w,.52+h*t+.045*(1-x*x)*(1-t),.015-.08*Math.sin(PI*t)+.075*x*x+.04*Math.sin(PI*t)*x*x-.07*t)};
 mesh(parent,'Orelha_'+side,clothSurface(56,44,outer,{thickness:.055}),mat);
 const innerGeo=clothSurface(44,36,(t,u)=>{const p=outer(.08+t*.81,.16+u*.68);p.z+=.034;return p},{thickness:.008}),ip=innerGeo.attributes.position,colors=new Float32Array(ip.count*3);for(let i=0;i<ip.count;i++){const y=ip.getY(i),t=(y-.52)/h,xc=side*(.48+(fennec?.46:.24)*t),f=Math.max(0,1-Math.abs(ip.getX(i)-xc)/.24)*Math.sin(PI*t),c=inner.color.clone().lerp(new THREE.Color('#f3ceb1'),f*.52).multiplyScalar(.94+.035*Math.sin(y*91+ip.getX(i)*47));c.toArray(colors,i*3)}innerGeo.setAttribute('color',new THREE.BufferAttribute(colors,3));const im=inner.clone();im.vertexColors=true;im.color.set('#ffffff');mesh(parent,'Interior_orelha_'+side,innerGeo,im);
 const border=[];for(let i=0;i<=32;i++)border.push(outer(i/32,0));for(let i=32;i>=0;i--)border.push(outer(i/32,1));border.push(border[0]);mesh(parent,'Borda_orelha',tube(border,.019),mat);
 for(const edge of [.19,.81])for(let i=0;i<16;i++){const t=.04+i*.029,p=outer(t,edge);p.z+=.046;mesh(parent,'Pelo_orelha',quill(p,p.clone().add(V(-side*.035,.17+.03*Math.sin(i),.018)),.020,.008,.018),pale||mat)}
}
function paint(g,base,light,kind){
 const p=g.attributes.position,col=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),noise=.97+.025*Math.sin(x*39+y*23)*Math.cos(z*31-y*11);let mix=0;
 if(kind==='face')mix=(1-step(y,-.09,.24))*step(z,.23,.67)*.98;
 if(kind==='body')mix=step(z,-.2,.35)*(1-step(Math.abs(x),.30,.65))*.95;
 const c=base.clone().lerp(light,mix).multiplyScalar(noise);c.toArray(col,i*3)}g.setAttribute('color',new THREE.BufferAttribute(col,3));return g;
}
export function buildCompanion(P,opts={}){
 const fennec=P.species==='fennec',wolf=P.species==='wolf'||fennec,group=new THREE.Group();group.name='Head_V2_'+P.id;
 const eyeX=fennec?.300:wolf?.345:.320,eyeY=fennec?.260:wolf?.215:.245,eyeR=fennec?.225:wolf?.205:.217;
 const body=new THREE.Group();body.name='Body';group.add(body);const head=new THREE.Bone();head.name='Bone_Head';group.add(head);const face=new THREE.Group();face.name='Rosto';head.add(face);const mask=new THREE.Group();mask.name='Acessorio_Mascara';if(!wolf)face.add(mask);
 const fur=material('Pelagem',opts.skin||P.skin),light=material('Pelagem_clara',fennec?'#f3dfbb':wolf?'#ded7cc':'#eee1c8'),black=material('Nariz_bico','#181723'),pink=material('Interior_orelha',fennec?'#ce957b':'#9d787b'),white=material('Olho_branco','#faf2de'),iris=material('Iris',wolf?'#bb6c26':'#a53b35'),pupil=material('Pupila','#100e17');black.roughness=.28;black.clearcoat=.52;iris.roughness=.19;iris.clearcoat=.75;fur.roughness=.64;fur.sheen=.65;fur.sheenRoughness=.46;light.roughness=.72;light.sheen=.5;
 const coated=fur.clone();coated.name='Pelagem_esculpida';coated.color.set('#ffffff');coated.vertexColors=true;const strands=fur.clone();strands.name='Pelagem_mechas';strands.vertexColors=true;const paleStrands=light.clone();paleStrands.name='Pelagem_clara_mechas';paleStrands.vertexColors=true;
 if(wolf){
  // Feneco: testa cheia e focinho compacto. Lobo: arcadas e maçãs largas, focinho firme.
  const skull=ellipse(V(0,fennec?.31:.245,-.075),V(fennec?.705:.815,fennec?.715:.66,fennec?.65:.68)),muzzle=ellipse(V(0,fennec?-.105:-.16,fennec?.465:.545),V(fennec?.315:.435,fennec?.235:.285,fennec?.385:.565));
  const cheeks=[-1,1].map(s=>ellipse(V(s*(fennec?.405:.475),fennec?-.055:-.115,.315),V(fennec?.315:.385,fennec?.315:.33,.35))),browMass=[-1,1].map(s=>ellipse(V(s*eyeX,eyeY+.185,.415),V(fennec?.27:.315,fennec?.145:.165,.235))),whiskerPads=[-1,1].map(s=>ellipse(V(s*(fennec?.125:.17),-.16,fennec?.665:.79),V(fennec?.19:.245,.15,fennec?.19:.245)));
  const sockets=[-1,1].map(s=>ellipse(V(s*eyeX,eyeY,.57),V(eyeR*1.06,eyeR*.98,.24)));
  const sdf=(x,y,z)=>{let d=union(skull(x,y,z),muzzle(x,y,z),.20);for(const f of cheeks)d=union(d,f(x,y,z),.19);for(const f of browMass)d=union(d,f(x,y,z),.13);for(const f of whiskerPads)d=union(d,f(x,y,z),.16);for(const f of sockets)d=-union(-d,f(x,y,z),.045);return d};
  const frontAt=(x,y)=>{let z=1.6;for(let i=0;i<90;i++){const d=sdf(x,y,z);if(d<.0001)break;z-=Math.max(.0001,d*.85)}return z};
  const onFace=(points,pad=.005)=>points.map(p=>V(p.x,p.y,frontAt(p.x,p.y)+pad));
  mesh(face,'Malha_rosto',paint(smoothCloth(sdfMesh(sdf,{x:1.1,y0:-.65,y1:1.03,z0:-.77,z1:1.30},.021),2),fur.color,light.color,'face'),coated);
  for(const side of [-1,1]){
   ear(face,side,fur,pink,fennec,light);const cheekFur=[];
   for(let row=0;row<3;row++)for(let i=0;i<6;i++){
    const t=(i+.25*(row%2))/6,p=V(side*(.40+.080*row),.13-t*.35,.35-row*.07),variation=.93+.10*Math.sin(i*2.41+row*1.7),end=p.clone().add(V(side*(.08+.020*row)*variation,-(.08+.045*t)*variation,-.075));
    cheekFur.push(attachedQuill(sdf,p,end,.047+.004*Math.sin(i),.018,.018,false,V(side*.78,.10,.62)));
   }
   mesh(face,'Fourrure_bocheches',mergeVolumes(cheekFur),paleStrands);
   // A sobrancelha animada já define esta região. Removidos os tufos e a
   // antiga barra clara sobrepostos, cujas pontas atravessavam a testa.
  }
  // Cartilagem arredondada: o focinho recebe um nariz esculpido contínuo,
  // sem a tampa triangular plana do antigo extrudado.
  const noseWidth=fennec?.119:.175,noseHeight=fennec?.095:.112;
  const ng=new THREE.SphereGeometry(1,48,32),np=ng.attributes.position;
  for(let i=0;i<np.count;i++){
   const x=np.getX(i),y=np.getY(i),z=np.getZ(i),pinch=.78+.22*THREE.MathUtils.smoothstep(y,-.8,.4),xx=x*noseWidth*pinch,yy=-.112+y*noseHeight,front=frontAt(xx,yy);
   np.setXYZ(i,xx,yy,front+.025+z*.068+.018*Math.max(0,y));
  }
  ng.computeVertexNormals();mesh(face,'Nariz',ng,black);
  for(const side of [-1,1]){const x=side*(fennec?.073:.106);mesh(face,'Narina_focinho',orb(V(x,-.08,frontAt(x,-.08)+.075),.023,V(1,.55,.35)),pupil)}
  mesh(face,'Sulco_focinho',tube(onFace([V(0,-.22),V(0,-.27),V(0,-.31)]),.008),black);
  for(const side of [-1,1]){const smile=[];for(let i=0;i<=32;i++){const t=i/32;smile.push(V(side*.34*t,-.31-.035*Math.sin(PI*t)+(fennec?.055:.015)*t))}mesh(face,'Sorriso',tube(onFace(smile),.008),black);for(let i=0;i<6;i++){const x=side*(.13+.045*(i%3)),y=-.21-.042*Math.floor(i/3);mesh(face,'Ponto_bigode',orb(V(x,y,frontAt(x,y)+.004),.006),black)}for(let i=0;i<3;i++){const x=side*.28,y=-.22-i*.035,z=frontAt(x,y);mesh(face,'Bigode_fino',tube([V(x,y,z),V(side*.50,y+.02,z+.04),V(side*.69,y-.02,z+.01)],.002),light)}}
  const locks=[];for(let layer=0;layer<2;layer++)for(let i=-4;i<=4;i++)locks.push(quill(V(i*.09,.63+layer*.035,.0-layer*.16),V(i*.11+.06,.97+.10*(1-Math.abs(i)/5),-.13-layer*.18),.075,.036,.085));mesh(face,'Topete_pelagem',mergeVolumes(locks),strands);
 }else{
  const skull=ellipse(V(0,.23,-.03),V(.76,.79,.69)),cheek=ellipse(V(0,-.26,.25),V(.62,.36,.47)),faceField=(x,y,z)=>union(skull(x,y,z),cheek(x,y,z),.20);
  mesh(face,'Cranio',smoothCloth(sdfMesh(faceField,{x:1.05,y0:-.79,y1:1.04,z0:-.8,z1:.87},.024),2),fur);
  // Máscara de osso esculpida, com órbitas vazadas e bordas arredondadas verdadeiras.
  const bone=ellipse(V(0,.36,.505),V(.75,.60,.225)),sculpt=[ellipse(V(0,.22,.655),V(.135,.40,.175)),...[-1,1].flatMap(side=>[ellipse(V(side*.23,.55,.615),V(.24,.12,.15)),ellipse(V(side*.47,.545,.565),V(.22,.12,.13)),ellipse(V(side*.60,.13,.50),V(.155,.305,.17))])],cuts=[...[-1,1].map(s=>ellipse(V(s*.32,.23,.67),V(.255,.275,.39))),ellipse(V(0,-.14,.67),V(.24,.31,.40))];
  const relief=(x,y,z)=>sculpt.reduce((d,f)=>union(d,f(x,y,z),.055),bone(x,y,z));const plate=(x,y,z)=>cuts.reduce((d,f)=>-union(-d,f(x,y,z),.024),relief(x,y,z));
  const boneFront=(x,y)=>{let z=1.15;for(let i=0;i<70;i++){const d=relief(x,y,z);if(d<.0002)break;z-=Math.max(.002,d*.8);if(z<.2)return .45}return z};
  const boneMat=light.clone();boneMat.name='Osso_mascara';boneMat.userData.surfaceKind='polymer';boneMat.vertexColors=true;boneMat.roughness=.49;boneMat.clearcoat=.06;
  const boneGeo=grain(smoothCloth(sdfMesh(plate,{x:.86,y0:-.43,y1:1.04,z0:.23,z1:.96},.009),4),.055),bp=boneGeo.attributes.position,bn=boneGeo.attributes.normal,bc=boneGeo.attributes.color;
  for(let i=0;i<bp.count;i++){const x=bp.getX(i),y=bp.getY(i),z=bp.getZ(i),orbit=Math.hypot((Math.abs(x)-.32)/.255,(y-.23)/.275),cavity=Math.exp(-(((orbit-1.03)/.12)**2))*.085,underBrow=Math.exp(-(((Math.abs(x)-.31)/.31)**2)-((y-.43)/.10)**2)*.055,edge=.94+.06*Math.max(0,bn.getZ(i)),hi=.025*Math.exp(-((x/.12)**2)-((y-.38)/.38)**2),factor=edge-cavity-underBrow+hi;for(let k=0;k<3;k++)bc.array[i*3+k]*=factor}
  mesh(mask,'Mascara_osso',boneGeo,boneMat);
  for(const side of [-1,1]){
   const rim=[];for(let i=0;i<=72;i++){const a=i/72*2*PI;rim.push(V(side*.32+Math.cos(a)*.258,.23+Math.sin(a)*.272,.67-.025*Math.cos(a)*side+.018*Math.sin(a)))}mesh(mask,'Orbita_entalhada',tube(rim,.022),light);
   const ledge=[];for(let i=0;i<=30;i++){const t=i/30;ledge.push(V(side*(.07+.55*t),.54+.065*Math.sin(PI*t)-.055*t,.66+.028*Math.sin(PI*t)))}mesh(mask,'Crista_fina_sobrolho',tube(ledge.map(p=>V(p.x,p.y,boneFront(p.x,p.y)+.006)),.013),light);
   const cracks=[[V(side*.64,.62,.59),V(side*.58,.69,.61),V(side*.62,.77,.57)],[V(side*.53,-.04,.69),V(side*.59,-.11,.64),V(side*.58,-.20,.59)],[V(side*.14,.79,.62),V(side*.20,.73,.66),V(side*.18,.67,.69)]];
   const ink=material('Fissuras_osso','#8b705d');for(const line of cracks){const projected=line.map(p=>V(p.x,p.y,boneFront(p.x,p.y)+.004)).filter(p=>relief(p.x,p.y,p.z)<.018);if(projected.length>1)mesh(mask,'Fissura_mascara',tube(projected,.0032),ink);}
  }
  const beak=clothSurface(64,56,(t,u)=>{const a=u*2*PI,r=Math.max(.002,.238*Math.sin(PI*(.13+.87*t))*(1-.78*t));return V(Math.cos(a)*r,-.045-.48*t*t+Math.sin(a)*r*.72,.62+.75*t)},{closed:true,thickness:.025});mesh(face,'Bico_superior',grain(beak,.045),black);
  for(const side of [-1,1]){mesh(face,'Narina',orb(V(side*.122,-.035,.88),.029,V(1,.44,.3)),pupil);mesh(face,'Borda_bico',tube([V(side*.21,-.13,.68),V(side*.15,-.18,.91),V(side*.045,-.32,1.12)],.009),black)}
  const cheekFeathers=[],crest=[],scalp=[];
  for(const side of [-1,1])for(let row=0;row<4;row++)for(let i=0;i<6;i++){const p=V(side*(.47+row*.036),.08-i*.078,.17-row*.085);cheekFeathers.push(quill(p,p.clone().add(V(side*.21,-.21-.055*row,-.07)),.10,.025,.04,true))}
  mesh(face,'Plumagem_face',mergeVolumes(cheekFeathers),strands);
  const down=[];for(let layer=0;layer<2;layer++)for(let row=0;row<3;row++)for(let i=0;i<35;i++){const a=(i+.33*(row%2))/35*2*PI,r=.65+layer*.027,p=V(Math.sin(a)*r,-.29-row*.067-layer*.025,-.04+Math.cos(a)*r),end=p.clone().add(V(Math.sin(a)*(.040+layer*.012),-.19-.027*Math.sin(i*2.1+row),Math.cos(a)*.052));down.push(attachedQuill(faceField,p,end,.027,.009,.014,false,V(Math.sin(a),.04,Math.cos(a)),false))}mesh(face,'Rufo_macío_queixo',mergeVolumes(down),strands);
  for(let row=0;row<3;row++)for(let i=-4;i<=4;i++){const p=V(i*.09,.73-row*.025,-.03-row*.16),w=Math.sin(i*7.1+row*13);crest.push(quill(p,V(i*.11+.08*w,1.04+.11*Math.sin(i*2.1+row),-.19-row*.19),.09,.032,.11,true))}mesh(face,'Crista',mergeVolumes(crest),strands);
  for(let row=0;row<8;row++)for(let i=0;i<22;i++){const y=.78-row*.137,a=1.01+(i/21)*(2*PI-2.02),r=Math.sqrt(Math.max(.03,1-((y-.16)/.81)**2)),p=V(Math.sin(a)*.823*r,y,-.03+Math.cos(a)*.68*r),end=p.clone().add(V(Math.sin(a)*.09,-.19,Math.cos(a)*.09));scalp.push(attachedQuill(faceField,p,end,.067,.018,.022,true,V(Math.sin(a),.05,Math.cos(a))))}mesh(face,'Plumagem_cabeca',mergeVolumes(scalp),strands);
  const moon=crescent(.15,.018);moon.rotateZ(-.24);moon.translate(0,.70,0);const mp=moon.attributes.position;for(let i=0;i<mp.count;i++){const x=mp.getX(i),y=mp.getY(i);mp.setZ(i,boneFront(x,y)+.005+mp.getZ(i)*.55)}moon.computeVertexNormals();mesh(mask,'Lua_mascara',moon,material('Tinta_rubi','#9c263b'));
 }

 const jaw=new THREE.Bone();jaw.name='Bone_Jaw';jaw.position.set(0,-.38,.25);head.add(jaw);mesh(jaw,'Mandibula',orb(V(0,-.005,fennec?.20:wolf?.36:.56),fennec?.25:wolf?.32:.19,V(1.15,.3,fennec?.8:wolf?1:.65)),wolf?light:black);
 mesh(jaw,'Lingua',orb(V(0,.030,fennec?.18:wolf?.35:.44),.14,V(.7,.12,1)),material('Lingua','#ba6d76'));
 const eyes=[],brows=[],lidNodes=[];
 for(const side of [-1,1]){
  const eye=new THREE.Group();eye.name='Olho_'+(side<0?'L':'R');eye.position.set(side*eyeX,eyeY,.57);face.add(eye);eyes.push(eye);
  mesh(eye,'Esclera',orb(V(),eyeR,V(1,.91,.66)),white);
  // Capas esféricas giram dentro da escala elíptica do globo. A piscada
  // cobre o olho com pele; não comprime a esclera numa faixa horizontal.
  const lidFrame=new THREE.Group();lidFrame.name='Escala_palpebras_'+side;lidFrame.scale.set(eyeR,eyeR*.91,eyeR*.66);eye.add(lidFrame);
  const lids=[];
  for(const upper of [true,false]){
   const sign=upper?1:-1,angle=upper?(fennec?.70:wolf?.59:.82):(fennec?.72:wolf?.68:.76),pivot=new THREE.Group();
   pivot.name='Palpebra_'+(upper?'U_':'L_')+(side<0?'L':'R');lidFrame.add(pivot);lids.push(pivot);lidNodes.push(pivot);pivot.userData.closeAngle=sign*(angle+.018);
   const radius=1.085,point=(u,v)=>V(radius*Math.sin(u),radius*Math.cos(u)*Math.sin(v),radius*Math.cos(u)*Math.cos(v));
   const nr=28,nc=64,positions=[],indices=[];
   // Faixa aberta atrás da pele, sem faces duplicadas nem polos degenerados.
   for(let i=0;i<=nr;i++)for(let j=0;j<=nc;j++)positions.push(...point((j/nc-.5)*(PI-.04),sign*(angle+(PI/2+.18-angle)*i/nr)).toArray());
   for(let i=0;i<nr;i++)for(let j=0;j<nc;j++){const a=i*(nc+1)+j,b=a+1,c=a+nc+1,d=c+1;if(upper)indices.push(a,b,c,b,d,c);else indices.push(a,c,b,b,c,d)}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
   mesh(pivot,'Pele_palpebra',g,fur);
   const edge=[];for(let j=0;j<=64;j++)edge.push(point((j/64-.5)*PI,sign*angle));
   mesh(pivot,'Borda_palpebra',tube(edge,upper?.034:.027),fur);
  }
  eye.userData.lids=lids;
  const gaze=new THREE.Group();gaze.name='Olhar_'+side;eye.add(gaze);eye.userData.gaze=gaze;
  const rx=eyeR,ry=rx*.91,dep=rx*.66+.002,irisR=rx*(fennec?.71:wolf?.65:.69);
  mesh(gaze,'Anel_iris',eyeDisc(irisR+.010,rx,ry,dep,.003).translate(side*.008,-.006,0),black);
  const ig=eyeDisc(irisR,rx,ry,dep,.005),ic=new Float32Array(ig.attributes.position.count*3);for(let k=0;k<ig.attributes.position.count;k++){const x=ig.attributes.position.getX(k),y=ig.attributes.position.getY(k),a=Math.atan2(y,x),r=Math.hypot(x,y),q=.72+.25*Math.sin(a*71+Math.sin(a*17)*3)**2+.08*Math.sin(r*149);const c=iris.color.clone().multiplyScalar(q);c.toArray(ic,k*3)}ig.setAttribute('color',new THREE.BufferAttribute(ic,3));const im=iris.clone();im.color.set('#ffffff');im.vertexColors=true;mesh(gaze,'Iris',ig.translate(side*.008,-.006,0),im);
  mesh(gaze,'Pupila',eyeDisc(irisR*(fennec?.58:.55),rx,ry,dep,.008).translate(side*.008,-.006,0),pupil);
  mesh(gaze,'Brilho_olho',orb(V(-.039,.052,dep+.006),.024,V(1,1,.3)),white);mesh(gaze,'Brilho_menor',orb(V(.045,-.046,dep+.003),.008,V(1,1,.3)),white);

  const brow=new THREE.Group();brow.name='Sobrancelha_'+side;brow.position.set(side*eyeX,eyeY+.25,.58);face.add(brow);brows.push(brow);mesh(brow,'Sobrancelha',tuft(V(-side*.21,.03,0),V(side*.22,-.02,-.03),fennec?.047:.068,.03,.025),fur);
 }
 const sole=fennec?-2.67:wolf?-3.27:-2.28,paws=[];
 if(wolf){
  const leg=fennec?.82:1,fields=[ellipse(V(0,-1.26,-.98),V(fennec?.51:.61,fennec?.54:.65,1.16)),ellipse(V(0,-.83,-.10),V(fennec?.51:.61,.77,.57)),ellipse(V(0,-1.32,-1.71),V(fennec?.53:.62,.62,.48))];
  for(const side of [-1,1])for(const rear of [false,true]){const z=rear?-1.66:.16,hip=V(side*(rear?.43:.41),-1.42,z),knee=V(side*.46,-1.99*leg,rear?z+.12:z-.05),ankle=V(side*.47,sole+.42,rear?z-.07:z+.08),paw=V(side*.48,sole+.15,z+.21);paws.push({side,hip,knee,ankle,paw});fields.push(ellipse(hip,V(rear?.34:.25,.58*leg,.33)),ellipse(knee,V(.19,.45*leg,.22)),ellipse(ankle,V(.135,.34,.16)),ellipse(paw,V(.23,.145,.29)))}
  const sdf=(x,y,z)=>fields.reduce((d,f)=>union(d,f(x,y,z),.17),20);mesh(body,'Malha_corpo',paint(smoothCloth(sdfMesh(sdf,{x:1.05,y0:sole-.05,y1:.13,z0:-2.5,z1:.8},.028),2),fur.color,light.color,'body'),coated);
  for(const {side,paw}of paws){
   const toeParts=[];for(let i=-1;i<=2;i++){const p=paw.clone().add(V((i-.5)*.088,-.015,.14));toeParts.push(new THREE.SphereGeometry(.088,16,12).scale(1,.85,1.45).translate(...p.toArray()));mesh(body,'Unha',quill(p.clone().add(V(0,-.015,.095)),p.clone().add(V(0,-.045,.20)),.026,.024,-.025),black)}
   mesh(body,'Dedos_pata',mergeVolumes(toeParts),paleStrands);
   for(let i=0;i<6;i++){const p=paw.clone().add(V((i%3-1)*.09,.08,-.05+Math.floor(i/3)*.12));mesh(body,'Pelo_pata',quill(p,p.clone().add(V(side*.014,-.045,.16)),.045,.015,.01),paleStrands)}
  }
  const tail=fennec?[V(0,-1.10,-1.96),V(.11,-1.35,-2.47),V(.42,-1.66,-2.91),V(.72,-1.91,-3.20)]:[V(0,-1.10,-1.96),V(.11,-1.23,-2.47),V(.42,-1.12,-2.97),V(.72,-.69,-3.39)],curve=new THREE.CatmullRomCurve3(tail),nr=96,nc=48,frames=curve.computeFrenetFrames(nr,false),tp=[],tc=[],ti=[];
  for(let i=0;i<=nr;i++){const t=i/nr,c=curve.getPointAt(t),color=fur.color.clone().lerp(fennec?black.color:light.color,step(t,.64,.86)),r=.42*Math.sin(PI*(.14+.86*t))**.63+.006;
   for(let j=0;j<=nc;j++){const a=j/nc*PI*2,q=c.clone().addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r*.94);tp.push(...q.toArray());color.clone().multiplyScalar(.96+.035*Math.sin(a*17+t*71)).toArray(tc,tc.length);if(i<nr&&j<nc){const k=i*(nc+1)+j;ti.push(k,k+1,k+nc+1,k+1,k+nc+2,k+nc+1)}}
  }
  const root=tp.length/3;tp.push(...tail[0].toArray(),...tail[3].toArray());fur.color.toArray(tc,tc.length);(fennec?black.color:light.color).toArray(tc,tc.length);for(let j=0;j<nc;j++)ti.push(root,j+1,j,root+1,nr*(nc+1)+j,nr*(nc+1)+j+1);
  const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.Float32BufferAttribute(tp,3));tg.setAttribute('color',new THREE.Float32BufferAttribute(tc,3));tg.setIndex(ti);tg.computeVertexNormals();smoothRingSeams(tg,nr+1,nc);const tm=fur.clone();tm.color.set('#ffffff');tm.vertexColors=true;mesh(body,'Cauda',tg,tm);
  const mane=[],paleMane=[],flanks=[],tailFur=[],tailTip=[];
  for(let row=0;row<5;row++)for(let i=0;i<23;i++){const a=(i+.43*(row%2)+.11*Math.sin(i*2.1+row))/23*2*PI,r=.46+row*.028,c=V(Math.sin(a)*r,-.39-row*.145+.017*Math.sin(i*3.1),Math.cos(a)*r-.08),variation=.91+.15*Math.sin(i*1.7+row*2.6),end=c.clone().add(V(Math.sin(a)*(.105+.014*row),-(.29+.055*Math.sin(i*1.3))*variation,Math.cos(a)*.09));(Math.cos(a)>.1?paleMane:mane).push(attachedQuill(sdf,c,end,.066+.008*Math.sin(i*2.2),.020,.020,false,V(Math.sin(a),.10,Math.cos(a))))}
  for(const side of [-1,1])for(let row=0;row<4;row++)for(let i=0;i<18;i++){const t=(i+.35*(row%2))/18,zz=-.30-t*1.65,c=V(side*(.48+.07*Math.sin(t*PI)),-.98-row*.15+.016*Math.sin(i*2.3),zz);flanks.push(attachedQuill(sdf,c,c.clone().add(V(side*.035,-.18-.025*Math.sin(i*1.7),-.15)),.057,.016,.015,false,V(side,.05,0)))}
  for(let row=1;row<17;row++)for(let i=0;i<17;i++){const t=row/18,k=Math.round(t*nr),a=(i+.4*(row%2))/17*PI*2,c=curve.getPointAt(t),rr=.42*Math.sin(PI*(.14+.86*t))**.63;c.addScaledVector(frames.normals[k],Math.cos(a)*rr*.97).addScaledVector(frames.binormals[k],Math.sin(a)*rr*.91);const end=curve.getPointAt(Math.min(.999,t+.055)).addScaledVector(frames.normals[k],Math.cos(a)*(rr+.014)).addScaledVector(frames.binormals[k],Math.sin(a)*(rr*.94+.014));(t>.64?tailTip:tailFur).push(quill(c,end,.030,.014,.012))}

  mesh(body,'Criniere',mergeVolumes(mane),strands);mesh(body,'Criniere_claire',mergeVolumes(paleMane),paleStrands);mesh(body,'Pelage_flancs',mergeVolumes(flanks),strands);mesh(body,'Pelage_cauda',mergeVolumes(tailFur),strands);const tipMat=(fennec?black:light).clone();tipMat.vertexColors=true;tipMat.roughness=.86;tipMat.clearcoat=0;mesh(body,'Pelage_ponta_cauda',mergeVolumes(tailTip),tipMat);
 }else{
  const claw=black.clone();claw.name='Garras';claw.roughness=.62;claw.clearcoat=.1;
  const breast=ellipse(V(0,-1.03,-.13),V(.71,.86,.63)),shoulder=ellipse(V(0,-.62,-.23),V(.70,.56,.54)),bodyField=(x,y,z)=>union(breast(x,y,z),shoulder(x,y,z),.20);mesh(body,'Malha_corpo',smoothCloth(sdfMesh(bodyField,{x:.97,y0:-2.01,y1:.06,z0:-.98,z1:.71},.028),2),fur);
  const chestFeathers=[],backFeathers=[],wingFeathers=[],tailFeathers=[];
  for(let row=0;row<12;row++)for(let i=0;i<26;i++){const a=(i+.5*(row%2))/26*PI*2,y=-.43-row*.114,r=.61*Math.sqrt(Math.max(.1,1-((y+1.05)/.95)**2)),p=V(Math.sin(a)*r,y,-.13+Math.cos(a)*r*.91),end=p.clone().add(V(Math.sin(a)*.075,-.215,Math.cos(a)*.073));(Math.cos(a)>.1?chestFeathers:backFeathers).push(attachedQuill(bodyField,p,end,.068+row*.0015,.020,.025,true,V(Math.sin(a),.07,Math.cos(a)),false))}
  for(const side of [-1,1]){
   mesh(body,'Base_asa',orb(V(side*.56,-1.03,-.16),.53,V(.38,1.14,.83)),fur);
   for(let layer=0;layer<4;layer++)for(let j=0;j<8;j++){const p=V(side*(.54+layer*.032),-.52-j*.085,.25-layer*.10),end=V(side*(.78+layer*.065),-1.03-j*.11-layer*.10,-.05-layer*.12);wingFeathers.push(quill(p,end,.11+layer*.012,.027,.05,true))}
   mesh(body,'Perna',tube([V(side*.27,-1.74,-.015),V(side*.31,-2.08,.07)],.072),black);
   for(let k=0;k<5;k++){const g=new THREE.TorusGeometry(.071,.009,8,24);g.rotateX(PI/2);g.translate(side*.31,-1.87-k*.039,.07);mesh(body,'Ecaille_tarse',g,black)}
   for(let j=-1;j<=1;j++){mesh(body,'Doigt',tube([V(side*.31,-2.07,.07),V(side*.31+j*.12,-2.20,.25),V(side*.31+j*.15,-2.22,.40)],.057),claw);mesh(body,'Griffe',quill(V(side*.31+j*.15,-2.21,.35),V(side*.31+j*.16,-2.24,.52),.050,.041,-.025),claw)}
   mesh(body,'Doigt_arriere',tube([V(side*.31,-2.09,.07),V(side*.31,-2.19,-.15),V(side*.33,-2.21,-.22)],.036),black);
  }
  for(let layer=0;layer<2;layer++)for(let i=-4;i<=4;i++)tailFeathers.push(quill(V(i*.055,-1.40,-.42-layer*.06),V(i*.13,-1.98-layer*.13,-1.09-layer*.14),.10,.025,.075,true));
  mesh(body,'Plumage_poitrine',mergeVolumes(chestFeathers),strands);mesh(body,'Plumage_dos',mergeVolumes(backFeathers),strands);mesh(body,'Remiges_ailes',mergeVolumes(wingFeathers),strands);mesh(body,'Plumes_cauda',mergeVolumes(tailFeathers),strands);
 }

  const animated=[jaw,...eyes,...eyes.map(e=>e.userData.gaze),...brows,...lidNodes];
  const apply=(pose={})=>{
   const p={jaw:0,lookX:0,lookY:0,blinkL:0,blinkR:0,wide:0,smile:0,browRaise:0,browAngry:0,...pose};
   jaw.rotation.x=clamp(p.jaw,0,1)*.65;
   eyes.forEach((eye,i)=>{
    const blink=clamp(i?p.blinkR:p.blinkL,0,1);
    // A surpresa abre as capas; uma piscada completa domina qualquer abertura.
    const close=clamp(blink+(1-blink)*((p.squint||0)*.25-p.wide*.24),-.22,1);
    eye.scale.y=1+p.wide*.10;
    eye.userData.gaze.position.set(p.lookX*.05,p.lookY*.05,-.025*blink);
    for(const lid of eye.userData.lids)lid.rotation.x=lid.userData.closeAngle*close;
   });
   brows.forEach((b,i)=>{b.rotation.z=(i?1:-1)*(p.browAngry*.32-p.smile*.1);b.position.y=eyeY+.25+p.browRaise*.08});
  };
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
  if(wolf){const medal=fennec?badge('star',.18,.035):crescent(.195,.036);medal.translate(0,yc-.27,zc+.16);add(fennec?'Medalhao_estrela':'Medalhao_lunar',medal,metal)}
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
   add('Lenco_enrolado',clothSurface(30,96,(t,u)=>{const a=u*PI*2,r=.58-.045*t+.018*Math.sin(a*4+t*PI*3);return V(Math.sin(a)*r,yc+.12-t*.18+.045*Math.cos(a),Math.cos(a)*r-.04)},{closed:true,thickness:.027}),fabric);
   for(const side of [-1,1]){
    const disc=new THREE.CylinderGeometry(.145,.145,.035,64);disc.rotateX(PI/2);disc.translate(side*.51,-.69,.38);add('Medalhao_ombro',disc,metal);const inset=new THREE.CylinderGeometry(.116,.116,.041,64);inset.rotateX(PI/2);inset.translate(side*.51,-.69,.405);add('Esmalte_medalhao',inset,fabric);const symbol=fennec?badge('star',.081,.02):crescent(.082,.02);symbol.translate(side*.51,-.69,.43);add('Brasao_ombro',symbol,metal);
    const bridle=[V(side*.40,-.24,.82),V(side*.62,-.08,.53),V(side*.61,.19,.15),V(side*.53,.30,-.22)];add('Cabresto',ribbon(bridle,.038,.018),leather);for(let i=0;i<3;i++){const p=bridle[Math.min(i,bridle.length-1)],g=new THREE.TorusGeometry(.042,.009,8,32);g.translate(...p.toArray());add('Argola_cabresto',g,metal)}
   }
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
     const rider=fit.buildRider(),r=new THREE.Group();r.name='Cowboy_Montado';r.scale.setScalar(.48);r.position.set(0,.43,-1.05);acc.add(r);r.add(rider.group);rider.group.position.y=2.6;
     const kit=buildAccessories(rider.fit,{head:'frontier_hat'},{metal:lk.colors.metal||'#c29b50',fabric:'#69432b'});rider.group.add(kit.group);
     const green=material('Pele_cowboy',PRESETS.frontier_cowboy.skin),pants=finishMaterial(material('Calca_cowboy','#302b29'),'fabric');
     mesh(r,'Colete_sentado',orb(V(0,-.225,0),.55,V(1.3,3.41,1.1)),leather);
     for(const side of [-1,1]){mesh(r,'Braco_sentado',tube([V(side*.60,1.38,0),V(side*1.05,-.30,.25),V(side*.65,-1.4,.65)],.16),green);mesh(r,'Calca_sentada',tube([V(side*.3,-2.1,0),V(side*1.55,-2.42,.18),V(side*1.55,-3.40,.25)],.23),pants);mesh(r,'Bota_sentada',orb(V(side*1.55,-3.43,.36),.25,V(1,.85,1.45)),leather);const seam=buckleGeo(.12,.11,.018);seam.translate(side*.52,-1.8,.35);mesh(r,'Fivela_colete',seam,metal)}
     mesh(r,'Poncho_cavaleiro',clothSurface(40,64,(t,u)=>{const a=u*PI*2,rr=.86-.04*t+.018*Math.sin(a*8)*t;return V(Math.sin(a)*rr,1.98-t*(2.45+.12*Math.cos(a)),Math.cos(a)*rr)},{closed:true,thickness:.035}),leather);
     mesh(r,'Lenco_cowboy',clothSurface(30,40,(t,u)=>{const a=(u-.5)*2.5;return V(Math.sin(a)*(.84-.45*t),1.95-.70*t,Math.cos(a)*(.84-.45*t)+.08)},{thickness:.035}),fabric);
     for(const side of [-1,1])add('Redea',ribbon([V(side*.4,-.12,.65),V(side*.5,-.33,.20),V(side*.31,-.20,-.66)],.025,.012),dark);
     rider.group.traverse(o=>{if(o.name)o.name='Cavaleiro_'+o.name});acc.userData.riderRig=rider.rig;
    }
   }
  }else{
   const gem=material('Acc_Gem',lk.colors.gem||'#c0182a');gem.roughness=.15;gem.clearcoat=.7;gem.transmission=.06;gem.thickness=.1;
   // Lenço enrolado em camadas, com pontas que acompanham a plumagem das costas.
   for(let row=0;row<3;row++)add('Dobra_lenco',clothSurface(22,100,(t,u)=>{const a=u*2*PI,r=.64-.075*t+.028*Math.sin(a*3+row);return V(Math.sin(a)*r,-.49-row*.09-t*.12+.065*Math.sin(a+.5),Math.cos(a)*r*.87-.045)},{closed:true,thickness:.022}),fabric);
   for(const side of [-1,1]){
    const tail=(t,u)=>{const x=side*(.43+.21*t)+(u-.5)*(.32-.12*t),rag=.07*(.5+.5*Math.sin(u*31)*Math.sin(u*13))*t**8;return V(x,-.52-t*(.89+.06*Math.cos(u*PI))-rag,-.32-t*.43-.045*Math.sin(PI*t*3+u*4))};
    add('Ponta_lenco_desfiada',clothSurface(50,40,tail,{thickness:.018}),fabric);
    const border=[];for(let i=0;i<=40;i++)border.push(tail(.87,i/40).add(V(0,0,-.013)));add('Bordado_lenco',tube(border,.008),metal);
    for(let i=0;i<5;i++){const g=crescent(.034,.008);g.rotateZ(side*.35);const p=tail(.30+i*.11,.48);g.translate(p.x,p.y,p.z-.015);add('Luas_bordadas',g,metal)}
    // Brinco com argolas e rubi em corte facetado.
    for(let i=0;i<2;i++){const ring=new THREE.TorusGeometry(.09+i*.021,.012,10,48);ring.translate(side*(.75+i*.015),.08-i*.085,.35+i*.02);add('Argola_mascara',ring,metal)}
    const earGem=new THREE.OctahedronGeometry(.074,0);earGem.scale(.7,1.3,.5);earGem.translate(side*.77,-.18,.40);add('Rubi_brinco',earGem,gem);
    const ankle=new THREE.CylinderGeometry(.092,.088,.13,40,1,true);ankle.translate(side*.31,-2.04,.07);add('Anilha_couro',ankle,leather);for(const yy of [-2.10,-1.98]){const ring=new THREE.TorusGeometry(.091,.013,8,40);ring.rotateX(PI/2);ring.translate(side*.31,yy,.07);add('Anilha_dourada',ring,metal)}
    const footGem=new THREE.OctahedronGeometry(.052);footGem.scale(.8,1.2,.5);footGem.translate(side*.31,-2.03,.16);add('Rubi_anilha',footGem,gem);
   }
   const chain=(pts,r=.034)=>{const curve=new THREE.CatmullRomCurve3(pts),n=Math.ceil(curve.getLength()/(r*1.5));for(let i=0;i<=n;i++){const t=i/n,p=curve.getPoint(t),g=new THREE.TorusGeometry(r,.0085,8,24);g.scale(1,.74,1);if(i%2)g.rotateY(PI*.43);g.translate(...p.toArray());add('Elo_corrente',g,metal)}};
   chain([V(-.52,-.56,.49),V(-.34,-.83,.64),V(0,-.93,.70),V(.34,-.83,.64),V(.52,-.56,.49)]);
   chain([V(-.47,-.59,.47),V(-.28,-.70,.62),V(.03,-.71,.71),V(.32,-.65,.60),V(.51,-.53,.44)],.027);
   const moon=crescent(.205,.036);moon.rotateZ(-.12);moon.translate(0,-1.10,.72);add('Pendente_lua_grande',moon,metal);
   for(const [y,r]of [[-.86,.105],[-1.39,.077]]){const bezel=petalPlate(r*1.55,r*2.6,.026);bezel.translate(0,y,.74);add('Cravacao_rubi',bezel,metal);const g=new THREE.OctahedronGeometry(r,0);g.scale(.65,1.2,.4);g.translate(0,y,.79);add('Rubi_pendente',g,gem)}
  }
 }
 rebuildAcc(look);
 const baseApply=fit.rig.apply,baseClips=fit.rig.makeClips;
 fit.rig.apply=pose=>{baseApply(pose);acc?.userData.riderRig?.apply(pose)};
 fit.rig.makeClips=()=>{const clips=baseClips(),rider=acc?.userData.riderRig?.makeClips();if(rider)for(let i=0;i<clips.length;i++){clips[i].tracks.push(...rider[i].tracks);clips[i].resetDuration()}return clips};
 return{group,get acc(){return{group:acc}},rebuildAcc,setColors(cols){acc.traverse(m=>{if(m.isMesh){const key=m.material.name==='Acc_Metal'?'metal':m.material.name==='Acc_Fabric'?'fabric':m.material.name==='Acc_Gem'?'gem':null;if(key&&cols[key])m.material.color.set(cols[key])}})},setHairColor(){},dispose(){fit.rig.apply=baseApply;fit.rig.makeClips=baseClips;disposeGroup(group)}};
}
