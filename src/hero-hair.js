// Escultura de cabelo: massas contínuas, guias com fluxo e mechas em hierarquia.
// As cores e UVs permanecem editáveis/exportáveis; nenhuma imagem substitui a malha.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {smoothHairNormals} from './hair-normals.js';
import {groomedLock,groomMaterial,groomColor,groomCuff} from './groom.js';
import {heroSurface} from './hero-material.js';
const PI=Math.PI,V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),clamp=THREE.MathUtils.clamp;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
function random(seed){let n=seed;return()=>{n=Math.imul(n^n>>>15,1|n)+0x6D2B79F5|0;return((n^n>>>14)>>>0)/4294967296}}

export function buildHeroHair(fit,style,color){
 const started=performance.now(),{P,sdf,top,cz,cy,browY:brow}=fit,kind=style.hero,rand=random(701+style.id.length*53),parts=[],ornaments=[],masses=[];
 const earY=fit.ears.length?Math.max(...fit.ears.map(e=>e.top.y)):brow-.4,lobe=fit.ears.length?Math.min(...fit.ears.map(e=>e.lobe.y)):brow-.9;
 const gradient=p=>{const e=.005;return V(sdf(p.x+e,p.y,p.z)-sdf(p.x-e,p.y,p.z),sdf(p.x,p.y+e,p.z)-sdf(p.x,p.y-e,p.z),sdf(p.x,p.y,p.z+e)-sdf(p.x,p.y,p.z-e)).normalize()};
 function outside(p,offset=.04){for(let i=0;i<3;i++){const d=sdf(p.x,p.y,p.z);if(d>=offset-.001)break;p.addScaledVector(gradient(p),offset-d)}return p}
 const surfaceCache=new Map();
 function scalp(theta,phi,lift=.06){
  const key=theta.toFixed(5)+':'+phi.toFixed(5);let p=surfaceCache.get(key);
  if(!p){const dir=V(Math.sin(theta)*Math.sin(phi),Math.cos(theta),Math.sin(theta)*Math.cos(phi)),c=V(0,cy,cz);let r=1.6;
   for(let k=0;k<55;k++){const d=sdf(dir.x*r,cy+dir.y*r,cz+dir.z*r);if(Math.abs(d)<.00025)break;r-=clamp(d*.9,-.1,.15)}p=c.addScaledVector(dir,r);surfaceCache.set(key,p)}
  return p.clone().addScaledVector(gradient(p),lift);
 }
 function lock(points,width,depth,{rope=false,phase=0,tone=1,tip=.60,detail=false,normal=null,root=.025}={}){
  if(points.length<3||points.some(p=>!Number.isFinite(p.lengthSq())))return;
  points=points.map(p=>p.clone());
  // As raízes entram na cobertura: a tampa da mecha não aparece como um corte.
  if(!rope){const p=points[0],d=sdf(p.x,p.y,p.z);if(Math.abs(d)<.25)p.addScaledVector(gradient(p),.006-d)}
  const curve=new THREE.CatmullRomCurve3(points,false,'centripetal');
  const geometry=groomedLock(points,width,depth,{rows:clamp(Math.ceil(curve.getLength()*36),28,100),segments:24,detailFibers:false,sculpted:false,grooveStrength:rope?.13:.065,grooves:3,phase,twist:rope?8:0,tone:tone*(.98+rand()*.04),
   normal:normal||((t,p)=>V(p.x,Math.max(.18,p.y-cy)*.65,p.z-cz)),
   profile:t=>{const taper=Math.pow(1-smooth(tip,1,t),.80)*(1-.28*smooth(.28,.86,t)),rise=root+(1-root)*smooth(0,.20,t);return[Math.max(.0004,width*rise*taper),Math.max(.0003,(rope?depth:Math.max(depth,width*.38))*rise*Math.pow(taper,.86))]}});
  parts.push(geometry);return curve;
 }
 function ellipsoid(center,radii,tone=.92,rumple=0){
  const g=new THREE.SphereGeometry(1,48,32),p=g.attributes.position;
  for(let i=0;i<p.count;i++){
   const q=V().fromBufferAttribute(p,i),theta=Math.acos(clamp(q.y,-1,1)),phi=Math.atan2(q.x,q.z),r=1+rumple*(Math.sin(phi*5+Math.sin(theta*3))*.62+Math.cos(theta*7+phi*2)*.38)*Math.sin(theta);
   p.setXYZ(i,center.x+q.x*radii.x*r,center.y+q.y*radii.y*r,center.z+q.z*radii.z*r);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(p.count*3).fill(tone),3));g.computeVertexNormals();smoothHairNormals(g);g.computeTangents();masses.push(g);
 }
 function curlMass(center,radii,count=42,coil=.10){
  // Volume preenchido e irregular, coberto por grupos de cachos sobrepostos.
  // As curvas seguem a própria massa; não são argolas coladas em planos tangentes.
  ellipsoid(center,radii.clone().multiplyScalar(.93),.96,.095);
  const total=Math.round(count*2.0);
  const surface=(p,lift=0)=>{
   const q=p.clone().sub(center),len=Math.hypot(q.x/radii.x,q.y/radii.y,q.z/radii.z)||1;
   q.multiplyScalar(1/len);const theta=Math.acos(clamp(q.y/radii.y,-1,1)),phi=Math.atan2(q.x/radii.x,q.z/radii.z),bump=.028*Math.sin(phi*5+theta*3)+.016*Math.cos(theta*7-phi*2);
   const n=V(q.x/(radii.x*radii.x),q.y/(radii.y*radii.y),q.z/(radii.z*radii.z)).normalize();
   return q.add(center).addScaledVector(n,lift+bump);
  };
  for(let j=0;j<total;j++){
   const y=1-2*(j+.5)/total,a=j*2.399963,n=V(Math.cos(a)*Math.sqrt(1-y*y),y,Math.sin(a)*Math.sqrt(1-y*y)),u=V(0,1,0).cross(n).normalize(),v=n.clone().cross(u).normalize(),c=center.clone().add(V(n.x*radii.x,n.y*radii.y,n.z*radii.z));
   const r=coil*(.45+rand()*.62),roll=(rand()-.5)*PI,uu=u.clone().multiplyScalar(Math.cos(roll)).addScaledVector(v,Math.sin(roll)),vv=v.clone().multiplyScalar(Math.cos(roll)).addScaledVector(u,-Math.sin(roll)),phase=rand()*PI,hook=j%3===0,turns=.8+rand()*.7,patchLift=(rand()-.35)*.025,pts=[];
   for(let k=0;k<=30;k++){
    const t=k/30,angle=phase+t*PI*turns;
    const du=hook?Math.cos(angle)*r:(t-.5)*r*2.8,dv=hook?Math.sin(angle)*r*.72:Math.sin(t*PI*2.3+phase)*r*.60;
    pts.push(surface(c.clone().addScaledVector(uu,du).addScaledVector(vv,dv),-.008+.041*Math.sin(PI*t)+patchLift));
   }
   const flowNormal=(t,p)=>V((p.x-center.x)/(radii.x*radii.x),(p.y-center.y)/(radii.y*radii.y),(p.z-center.z)/(radii.z*radii.z)).normalize();
   lock(pts,r*.44,r*.16,{phase:a,tip:.82,normal:flowNormal,root:.025});
   if(j%3===0){
    const paired=pts.map((p,k)=>surface(p.clone().addScaledVector(vv,r*.24),.030+.006*Math.sin(k/30*PI)));
    lock(paired,r*.18,r*.075,{phase:a+.4,tip:.73,normal:flowNormal,root:.025});
   }
  }
 }
 // A cobertura recebe volume suave no alto. A linha do cabelo encontra a pele sem dentes repetidos.
 const line=q=>{const a=Math.abs(Math.atan2(q.x,q.z-cz)),front=style.id==='hero_tousled'?.31:kind==='pixie'?.28:.25;const forehead=brow+front-.07*Math.sin(Math.min(a,.9)*2),temple=THREE.MathUtils.lerp(forehead,earY+.045,smooth(.65,1.75,a));return THREE.MathUtils.lerp(temple,lobe-.18,smooth(1.75,2.3,a))};
 const src=fit.skinGeo,sp=src.attributes.position,sn=src.attributes.normal,N=fit.skinN,remap=new Map(),cp=[],cc=[],cu=[],ci=[];
 // Cada aresta cruza a linha do cabelo por interpolação, sem degraus de triângulos descartados.
 const capAxis=V(kind==='curlup'?-.08:.16,top+.20-cy,kind==='curlup'?-.18:-.10).normalize(),capFront=V(0,0,1).addScaledVector(capAxis,-capAxis.z).normalize(),capRight=capAxis.clone().cross(capFront).normalize();
 const scalpUV=p=>{const d=p.clone().sub(V(0,cy,cz)).normalize();return[Math.atan2(d.dot(capRight),d.dot(capFront))/(PI*2)+.5,Math.acos(clamp(d.dot(capAxis),-1,1))/PI]};
 const capVertex=(q,unwrap=false)=>{
  const uv=scalpUV(q.p);if(unwrap&&uv[0]<.5)uv[0]+=1;const key=q.p.toArray().map(v=>Math.round(v*1e7)).join(':')+':'+(uv[0]>=1?1:0);if(remap.has(key))return remap.get(key);
  const edge=smooth(0,.14,q.d),height=smooth(brow+.12,top,q.p.y),p=q.p.clone().addScaledVector(q.n,-.002+(.012+.030*height)*edge),index=cp.length/3;
  cp.push(...p.toArray());cc.push(.95,.95,.95);cu.push(...uv);remap.set(key,index);return index;
 };
 if(kind!=='clown')for(let i=0;i<src.index.count;i+=3){
  const ids=[src.index.getX(i),src.index.getX(i+1),src.index.getX(i+2)];if(ids.some(k=>k>=N))continue;
  const triangle=ids.map(k=>{const p=V().fromBufferAttribute(sp,k);return{p,n:V().fromBufferAttribute(sn,k),d:p.y-line(p)}}),polygon=[];
  for(let k=0;k<3;k++){
   const a=triangle[k],b=triangle[(k+1)%3];if(a.d>=0)polygon.push(a);
   if((a.d>=0)!==(b.d>=0)){const t=a.d/(a.d-b.d);polygon.push({p:a.p.clone().lerp(b.p,t),n:a.n.clone().lerp(b.n,t).normalize(),d:0})}
  }
  const us=polygon.map(q=>scalpUV(q.p)[0]),unwrap=Math.max(...us)-Math.min(...us)>.5;
  for(let k=1;k<polygon.length-1;k++)ci.push(capVertex(polygon[0],unwrap),capVertex(polygon[k],unwrap),capVertex(polygon[k+1],unwrap));
 }
 const cap=new THREE.BufferGeometry();cap.setAttribute('position',new THREE.Float32BufferAttribute(cp,3));cap.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));cap.setAttribute('uv',new THREE.Float32BufferAttribute(cu,2));cap.setIndex(ci);cap.computeVertexNormals();smoothHairNormals(cap);cap.computeTangents();
 function coherentClump(points,width,depth,phase,{amp=.035,cycles=1.35,sub=true,tip=.65}={}){
  const curve=new THREE.CatmullRomCurve3(points,false,'centripetal'),pts=[],frames=[];
  for(let k=0;k<=32;k++){
   const t=k/32,p=curve.getPoint(t),tangent=curve.getTangent(t),n=gradient(p),side=tangent.clone().cross(n).normalize(),env=Math.sin(PI*t),wave=t*PI*2*cycles+phase;
   p.addScaledVector(side,amp*Math.sin(wave)*env).addScaledVector(n,amp*.80*Math.cos(wave)*env);outside(p,.035);
   pts.push(p);frames.push({n,side});
  }
  lock(pts,width,depth,{phase,tip,normal:(t,p)=>gradient(p),root:.025});
  // Submechas seguem a curva-mãe; compartilham início e ponta e não são fios aleatórios.
  if(sub)for(const sign of [-1,1]){
   const child=pts.map((p,k)=>{const env=Math.sin(k/32*PI)**.65;return p.clone().addScaledVector(frames[k].side,sign*width*.38*env).addScaledVector(frames[k].n,Math.max(depth,width*.38)*.78*env)});
   lock(child,width*.26,depth*.44,{phase:phase+sign*.3,tip:tip+.08,normal:(t,p)=>gradient(p),root:.025});
  }
 }
 function crownFlow({short=false,neat=false,pixie=false}={}){
  const n=pixie?19:short?18:20;
  for(let layer=0;layer<2;layer++)for(let j=0;j<n;j++){
   const phi=.52+j*(2*PI-1.04)/(n-1)+(layer?.12:0),front=Math.cos(phi)>.30,a=scalp(.26+layer*.36,phi-.26,.012),b=scalp(.66+layer*.24,phi-.08,.11+(neat?0:.035*Math.sin(j*1.9))),endTheta=front?1.10:(pixie?1.76:1.82)+layer*.11,c=scalp(endTheta,phi+.17,.075),d=c.clone().add(V(Math.sin(phi)*.035,pixie?-.025:-.075,Math.cos(phi)*.025));
   lock([a,b,c,d],(pixie?.095:short?.115:.10)*(1+.18*Math.sin(j*2.7)),neat?.023:pixie?.026:.034,{tip:.53,phase:j});
  }
 }
 function inventorCurls(){
  // Curto cacheado do Nico: curvas em S e grupos secundários, sem franja em lâminas.
  for(let row=0;row<2;row++)for(let j=0;j<17;j++){
   const phi=.46+j*(2*PI-.92)/16+row*.13,a=scalp(.25+row*.34,phi-.20,.02),b=scalp(.63+row*.22,phi-.10,.11+.035*Math.sin(j*1.7)),c=scalp(1.12+row*.27+.10*Math.sin(j*1.3),phi+.30,.085),d=c.clone().add(V(Math.sin(phi)*.055,-.065,Math.cos(phi)*.035));
   coherentClump([a,b,c,d],.050+rand()*.018,.024,j*.83,{amp:.035+rand()*.018,cycles:1.35+rand()*.45,sub:j%2===0,tip:.73});
  }
  for(let j=0;j<10;j++){
   const phi=-1.12+j*.242,a=scalp(.30+.08*Math.sin(j),.38+j*.035,.02),b=scalp(.67,phi*.45,.17+.040*Math.sin(j*1.6)),c=scalp(1.00,phi*.87,.115),d=scalp(1.22+.10*Math.sin(j*1.47),phi+.10,.055);
   coherentClump([a,b,c,d],.050+rand()*.018,.024,j*.91,{amp:.043,cycles:1.25+rand()*.45,sub:true,tip:.72});
  }
 }
 function heroForelock(){
  crownFlow({short:true,neat:true});
  // Topete mais alto, com risca à esquerda e uma curva longa para o lado oposto.
  for(let j=0;j<8;j++){
   const t=j/7,a=outside(V(-.43+j*.034,top-.22+j*.010,cz+.15),.025),b=outside(V(-.35+j*.047,top+.075+.018*Math.sin(j),cz+.44),.095),c=outside(V(.08+j*.051,top-.055-j*.010,cz+.60),.11),d=outside(V(.51+j*.031,brow+.35+.065*Math.sin(j*.6),cz+.71),.07),end=outside(V(.64+j*.014,brow+.20+j*.023,cz+.55),.04);
   coherentClump([a,b,c,d,end],.094+.018*Math.sin(j*.7),.029,j*.55,{amp:.014,cycles:.85,sub:j%2===0,tip:.62});
  }
  for(let j=0;j<3;j++){
   const a=scalp(.68,-.68-j*.15,.045),b=scalp(.95,-.82-j*.15,.075),end=scalp(1.25,-.92-j*.13,.055);coherentClump([a,b,end],.043,.018,j,{amp:.016,cycles:.8,sub:false,tip:.60});
  }
 }
 function pixieSweep(){
  crownFlow({short:true,pixie:true});
  // Corte mais curto, franja diagonal e uma trança exposta no lado oposto da risca.
  for(let j=0;j<6;j++){
   const a=outside(V(.24+j*.019,top-.19+j*.010,cz+.12),.025),b=outside(V(.12+j*.018,top+.015,cz+.40),.065),c=outside(V(-.32-j*.035,brow+.34+.045*Math.sin(j),cz+.72),.070),end=outside(V(-.59-j*.027,brow+.12+j*.027,cz+.52),.04);
   coherentClump([a,b,c,end],.073+.014*Math.sin(j),.038,j*.8,{amp:.023,cycles:1.05,sub:j%2===0,tip:.67});
  }
  for(let strand=0;strand<3;strand++){
   const pts=[];for(let k=0;k<=56;k++){
    const t=k/56,q=scalp(.55+t*1.03,1.08+.32*t,.155),normal=gradient(q),tangent=scalp(.55+t*1.03+.003,1.08+.32*t,.155).sub(q).normalize(),side=tangent.clone().cross(normal).normalize(),angle=t*PI*9+strand*2*PI/3;
    q.addScaledVector(side,Math.sin(angle)*.022).addScaledVector(normal,Math.cos(angle)*.018);pts.push(q);
   }
   lock(pts,.021,.018,{rope:true,tip:.92,root:.65});
  }
 }
 function fringe({neat=false,pixie=false,curly=false,veteran=false}={}){
  // Une risca e franja por arcos longos: cada mecha tem ombro, torção e uma ponta livre.
  const n=neat?8:9;
  for(let j=0;j<n;j++){
   const t=j/(n-1),phi=-1.05+t*2.12,root=scalp(.36+.10*t,.52+.25*t,.025),a=scalp(.62+.06*t,.30+.36*phi,.16+(neat?0:.055*Math.sin(j*.83))),b=scalp(.94+.10*Math.sin(j*.9),phi*.86,.12),c=scalp(1.13+.16*Math.sin(j*1.37),phi,.065),end=c.clone().add(V(-.075+(pixie?-.05:0),neat?-.015:-.06-.045*Math.sin(j),.015));
   if(curly){a.y+=.045*Math.sin(j);b.x+=.05*Math.sin(j*1.4);b.y+=.055*Math.sin(j*1.8)}
   if(veteran){a.y-=.08;b.y-=.025;end.y+=.04}
   lock([root,a,b,c,end],(neat?.112:.121)*(.78+.23*Math.sin(j*1.1+1)),neat?.025:.035,{tip:neat?.58:.49,phase:j,detail:j%2===0});
  }
  if(!neat)for(let j=0;j<6;j++){
   const phi=-1.15+j*.43,a=scalp(.62,phi,.06),b=scalp(.86,phi+.13,.21),c=scalp(1.18,phi+.30,.095),end=c.clone().add(V(Math.sin(phi)*.065,-.06,Math.cos(phi)*.035));lock([a,b,c,end],.032,.013,{tip:.58,phase:j,root:.6});
  }
 }
 function waves({curly=false,braids=false,halfup=false,royal=false,swept=false}={}){
  const bottom=royal?lobe-.43:swept?lobe-.27:curly?-2.35:kind==='halfup'?-3.12:kind==='long'?-2.20:-3.38,n=royal||swept?17:18;
  for(let layer=0;layer<2;layer++)for(let j=0;j<n;j++){
   const phi=.72+j*(2*PI-1.44)/(n-1),side=Math.sin(phi),rear=Math.cos(phi),a=scalp(.19+layer*.35,phi-.08,.018),b=scalp(.86,phi+.06,.10+layer*.045),c=scalp(1.56,phi+.09,.13+layer*.055),pts=[a,b,c],end=bottom+.15*Math.sin(j*.87)+layer*.14;
   for(let k=1;k<=10;k++){
    const t=k/10,phase=t*PI*(curly?7:royal?1.5:3.5)+Math.floor(j/3)*.74+(j%3)*.10+layer*.22,amp=(curly?.115:royal?.07:.160)*smooth(0,.18,t),rad=.87+.08*t+.065*Math.sin(phase);
    const q=V(c.x+side*(.11*t+amp*Math.sin(phase)),THREE.MathUtils.lerp(c.y,end,t),cz+Math.min(rear,-.10)*rad+amp*.48*Math.cos(phase));outside(q,.09+layer*.045);pts.push(q);
   }
   lock(pts,(royal||swept?.105:curly?.077:layer===0?.148:.103)*(1+.17*Math.sin(j*2.3)),royal?.024:curly?.033:layer===0?.032:.023,{tip:royal?.68:.70,phase:j,rope:curly,detail:layer===1&&j%4===0});
  }
  if(!royal&&!swept)for(const sg of [-1,1])for(let j=0;j<3;j++){
   const pts=[scalp(.35+j*.11,sg*(.40+j*.12),.035),outside(V(sg*(.52+j*.065),brow+.18,cz+.70),.08),outside(V(sg*(.73+j*.055),-.37,cz+.61),.10),outside(V(sg*(.67+j*.07),-1.05,cz+.46),.11),outside(V(sg*(.77+j*.075),-1.62-j*.18,cz+.29),.11),V(sg*(.70+j*.1),-2.0-j*.20,cz+.10)];
   lock(pts,.121-j*.020,.030-j*.005,{tip:.66,phase:j,detail:true});
  }
  if(halfup)curlMass(V(.04,top+.13,cz-.36),V(.32,.29,.29),29,.078);
  if(braids)for(const sg of [-1,1]){
   const base=outside(V(sg*.71,brow-.07,cz+.28),.10),path=[];
   for(let k=0;k<=40;k++){const t=k/40;path.push(outside(base.clone().add(V(sg*(.06*Math.sin(t*PI)),t*-1.20,-.02*t)),.08))}
   const curve=new THREE.CatmullRomCurve3(path);for(let strand=0;strand<3;strand++){
    const pts=[];for(let k=0;k<=60;k++){const t=k/60,q=curve.getPoint(t),a=t*PI*11+strand*2*PI/3;q.x+=Math.sin(a)*.026;q.z+=Math.cos(a)*.026;pts.push(q)}lock(pts,.024,.021,{rope:true,tip:.91,root:.9})}
  }
 }
 if(kind==='tousled'){
  if(style.id==='short_curls')inventorCurls();else heroForelock();
 }else if(kind==='pixie'){
  pixieSweep();
 }else if(kind==='veteran'||kind==='short'){
  crownFlow({short:true,neat:true});fringe({neat:kind==='short',veteran:kind==='veteran'});
 }else if(['waves','long','halfup','curly','braids','royal','swept'].includes(kind)){
  waves({curly:kind==='curly',braids:kind==='braids',halfup:kind==='halfup',royal:kind==='royal',swept:kind==='swept'});
  // Franja lateral curta cobre as raízes da risca sem virar uma cortina diante dos olhos.
  for(let j=0;j<6;j++){
   const sg=j<4?-1:1,t=(j%4)/3,a=scalp(.25+t*.13,.30,.02),b=scalp(.70,sg*(.28+t*.30),.13),c=scalp(1.13,sg*(.65+t*.17),.12),d=scalp(1.42,sg*(.85+t*.15),.08);
   lock([a,b,c,d],.14,.028,{tip:.58,detail:j<2});
  }
 }else if(kind==='locks'){
  for(let layer=0;layer<2;layer++)for(let j=0;j<17;j++){
   const phi=.68+j*(2*PI-1.36)/16+(layer?.08:0),sg=Math.sin(phi),a=scalp(.25+layer*.37,phi-.10,.022),b=scalp(.90,phi+.08,.13),c=scalp(1.63,phi+.11,.14),pts=[a,b,c],end=-1.62-rand()*.48-layer*.12;
   for(let k=1;k<=7;k++){const t=k/7;pts.push(outside(V(c.x+sg*(.06*t+.025*Math.sin(t*PI*2.6+j)),THREE.MathUtils.lerp(c.y,end,t),Math.min(c.z,cz+.14)-t*.10+.025*Math.cos(t*PI*2.6+j)),.09))}
   const r=.043+rand()*.014,curve=lock(pts,r,r*.86,{rope:true,phase:j,tip:.91});
   if((j+layer)%5===0){const g=groomCuff(r+.008,.075),p=curve.getPoint(.68);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0,1,0),curve.getTangent(.68)));g.translate(...p.toArray());ornaments.push(g)}
  }
  for(let j=0;j<5;j++){
   const phi=-.62+j*.29;lock([scalp(.30,.45,.025),scalp(.75,phi*.65,.15),scalp(1.20,phi,.10),scalp(1.43,phi+.1,.07)],.054,.048,{rope:true,phase:j,tip:.90});
  }
 }else if(kind==='curlup'||kind==='bun'||kind==='topknot'){
  const curly=kind==='curlup',center=V(curly?-.08:0,top+(curly?.29:.12),cz-(kind==='topknot'?.38:.18)),radius=curly?V(.45,.44,.39):V(.24,.23,.23);
  // Recolhimento tangente à cabeça, sem retas radiais que desenhavam um cone sobre a testa.
  for(let j=0;j<25;j++){
   const phi=j/25*2*PI,theta=Math.cos(phi)>.4?1.20:1.82,a=scalp(theta,phi,-.018),b=scalp(theta*.80,phi-.05,.045),c=scalp(.37,phi-.16,.052),d=center.clone().add(V(Math.sin(phi)*radius.x*.60,-radius.y*.40,Math.cos(phi)*radius.z*.45));
   lock([a,scalp(theta*.94,phi-.02,.018),b,scalp(theta*.56,phi-.11,.052),c,d],curly?.069:.056,curly?.012:.014,{tip:.90,phase:j,detail:j%5===0,root:.10});
  }
  if(curly)curlMass(center,radius,64,.098);
  else{
   ellipsoid(center,radius,.90);
   for(let j=0;j<17;j++){
    const phi=j/17*2*PI,pts=[];for(let k=0;k<=40;k++){const t=k/40,theta=.18+t*(PI-.30),angle=phi+t*1.15;pts.push(center.clone().add(V(Math.sin(theta)*Math.cos(angle)*radius.x,Math.cos(theta)*radius.y,Math.sin(theta)*Math.sin(angle)*radius.z).multiplyScalar(1.005)))}
    lock(pts,.040,.020,{tip:.93,phase:j,normal:(t,p)=>p.clone().sub(center)});
   }
  }
  if(kind==='topknot')for(let j=0;j<14;j++){
   const a=center.clone().add(V((rand()-.5)*.20,-.12,-.09)),b=a.clone().add(V(.12*Math.sin(j),-.32,-.30)),c=outside(V(.13*Math.sin(j),-.75,cz-.77),.07),end=outside(V(.14*Math.sin(j*.8),-1.48+(rand()-.5)*.15,cz-.61),.07);lock([a,b,c,end],.055,.033,{tip:.75});
  }
  for(const sg of [-1,1])for(let j=0;j<(curly?3:1);j++){
   const a=scalp(1.20,sg*(.88+j*.12),.05),pts=[];for(let k=0;k<=35;k++){const t=k/35,q=a.clone().add(V(sg*(.055*Math.sin(t*PI*(curly?4:1))),-.62*t,.04*Math.cos(t*PI*(curly?4:1))));pts.push(outside(q,.04))}lock(pts,.020,.017,{rope:curly,tip:.85});
  }
 }else if(kind==='clown'){
  for(const sg of [-1,1])curlMass(V(sg*.79,brow+.01,cz-.05),V(.235,.30,.23),28,.065);
 }
 const material=groomMaterial(color),baseMaterial=material.clone();baseMaterial.name='Hair_Base';baseMaterial.normalScale.set(.22,.22);baseMaterial.anisotropy=.40;baseMaterial.roughness=.52;
 const group=new THREE.Group();group.name='Hair_'+style.id;
 if(cp.length){const capMesh=new THREE.Mesh(cap,baseMaterial);capMesh.name='Hair_Cap';group.add(capMesh)}else cap.dispose();
 if(masses.length){const geo=mergeGeometries(masses,false);masses.forEach(g=>g.dispose());const m=new THREE.Mesh(geo,material);m.name='Hair_Mass';group.add(m)}
 if(parts.length){const geo=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());const m=new THREE.Mesh(geo,material);m.name='Hair_Locks';group.add(m)}
 let metal=null;if(ornaments.length){metal=new THREE.MeshPhysicalMaterial({name:'Hair_Ring',color:'#b98d3f',metalness:.85,roughness:.32});const geo=mergeGeometries(ornaments,false);ornaments.forEach(g=>g.dispose());heroSurface(geo,metal,'metal');const m=new THREE.Mesh(geo,metal);m.name='Hair_Rings';group.add(m)}
 group.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});group.userData.timing=Math.round(performance.now()-started);group.userData.sculpture={version:4,style:style.id,locks:parts.length,filledMasses:masses.length};
 return {group,material,meshes:group.children.filter(m=>m.isMesh),setColor(c){for(const m of [material,baseMaterial])groomColor(m,c)},dispose(){group.traverse(m=>{if(m.isMesh)m.geometry.dispose()});material.dispose();baseMaterial.dispose();metal?.dispose()}};
}

// Sardas discretas, posicionadas na superfície do rosto dos novos personagens.
export function buildHeroFreckles(fit){
  if(!fit.P.heroFreckles)return null;const rand=random(1939),geos=[];
  for(const side of [-1,1])for(let i=0;i<19;i++){
    const x=side*(.17+rand()*.43),y=-.20-rand()*.15,z=fit.surfZ(x,y),r=.006+rand()*.006,g=new THREE.SphereGeometry(r,7,5);g.scale(1,.72,.24);g.translate(x,y,z+.003);geos.push(g);
  }
  const geo=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());const material=new THREE.MeshStandardMaterial({name:'Face_Freckles',color:'#87503b',roughness:.9}),mesh=new THREE.Mesh(geo,material);mesh.name='Face_Freckles';return {mesh,dispose(){geo.dispose();material.dispose()}};
}
