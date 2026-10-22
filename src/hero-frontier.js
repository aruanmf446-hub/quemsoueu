// Direção da referência: peças de couro, placas sobrepostas, tecido solto e ferragens reais.
import * as THREE from 'three';
import {clothSurface,handPatch} from './fabric.js';
import {badge,panel,buckleGeo,gear} from './detail.js';
import {shapePlate,stitchLine,strap,fastener,tassel,fringe,filigree,shieldOutline,curvedPlate} from './hero-kit.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),PI=Math.PI;
export function buildHeroFrontier(C){
  const {style,body,B,W,Y,Lb,z0,yN,S,E,Wr,H,K,A,ySole,garment,trousers,boots,beltOn,cape,rim,edgeTube,sleeveCuffs,surfAt,frontZ,backZ,limbR,limbWrap,addGeoS,tubeG,sph,orient,clamp,lerp}=C;
  if(!['frontier_cowboy','cactus_guard','flame_guardian'].includes(style))return false;
  const cowboy=style==='frontier_cowboy',soldier=style==='cactus_guard',human=style==='flame_guardian';
  const waist=Y(.345),hem=Y(soldier?.43:.44);
  let g,shirt;
  if(soldier){
    // A frente fica aberta: o tronco verde e as nervuras fazem parte da silhueta do cacto.
    g=garment('Corselete_aberto_do_deserto','leather','upper',{top:yN+.015,bottom:hem,t:.05*W,open:.72,openTaper:.75,hollow:true,shoulderPad:.12,env:{ease:.035*W,hang:.45,cinch:waist,cinchK:.82,flareFrom:waist,flare:.12}});
    edgeTube(g,'open','trim','upper',.018*W);edgeTube(g,'arm','trim','upper',.018*W);
  }else{
    shirt=garment(human?'Camisa_negra_da_chama':'Camisa_de_linho','secondary','upper',{top:yN+(human?.045:-.045)*W,bottom:hem,t:.045*W,sleeve:human?'forearm':'short',short:.72,puff:.045*W,sleeveEase:.035*W,vneck:human?.03:.12,env:{ease:.033*W,hang:.55,cinch:waist,cinchK:.86,flareFrom:waist,flare:.10,folds:.018*W}});
    sleeveCuffs(shirt,'upper',human?'accent':'secondary',.11*W);
    g=garment(human?'Casaca_negra_com_abas_rubi':'Colete_de_couro_recortado',human?'secondary':'fabric','upper',{top:yN+.04,bottom:Y(human?.415:.43),t:.065*W,sleeve:null,open:human?.33:.26,openTaper:human?.62:.72,hollow:true,over:shirt.solid,overGap:.035*W,shoulderPad:.08,env:{ease:.065*W,hang:.5,cinch:waist,cinchK:human?.68:.93,flareFrom:waist,flare:.12},hemCurve:human?.12*W:.045*W});
    edgeTube(g,'open','trim','upper',.012*W);edgeTube(g,'arm','leather','upper',.02*W);
    for(const side of [-1,1]){
      stitchLine(C,'upper',g.solid,Array.from({length:12},(_,i)=>[Y(.07+i*.027),side*(.34+i*.012)]),{channel:'trim',r:.0035*W});
      const coords=[[Y(.08),side*.56],[Y(.22),-side*.14],[Y(.32),-side*.57]];
      strap(C,'upper','leather',g.solid,coords,human?.135:.085,human?.11:.07);fastener(C,'upper',g.solid,Y(.20),-side*.06,.11,.14,.11);
    }
    if(human){
      // Gola alta em duas abas, com parede grossa e ponta arredondada.
      for(const side of [-1,1]){
        const point=(t,u)=>{const a=side*(.26+u*1.7),p=surfAt(g.solid,yN-.035*W,a,.025*W);p.y+=t*.29*W*(.86+.14*Math.cos(u*PI));p.addScaledVector(V(Math.sin(a),0,Math.cos(a)),t*.065*W);return p};
        addGeoS('upper','leather',clothSurface(20,48,point,{thickness:.025*W}));addGeoS('upper','trim',tubeG(Array.from({length:49},(_,i)=>point(1,i/48)),.012*W,6));
      }
    }
  }
  const base=(x,y,z)=>Math.min(g.env(x,y,z),shirt?shirt.env(x,y,z)-.035*W:1000);
  if(human){
    // Casaca negra: vistas rubi estreitas e abas independentes deixam o centro preto legível.
    for(const side of [-1,1]){
      const panelPoint=(t,u)=>{const a=side*(.66+(u-.5)*.30),yy=lerp(Y(.075),Y(.405),t);return surfAt(g.solid,yy,a,.075*W)};
      addGeoS('upper','fabric',clothSurface(54,22,panelPoint,{thickness:.025*W}));
      for(const u of [0,1])addGeoS('upper','trim',tubeG(Array.from({length:45},(_,i)=>panelPoint(i/44,u)),.009*W,6));
      const tail=(t,u)=>{const a=side*(.91+(u-.5)*.58),yy=lerp(Y(.34),Y(side>0?.60:.65),t)-.07*W*Math.sin(PI*u)*t**4,p=surfAt(g.env,yy,a,.10*W);p.addScaledVector(V(Math.sin(a),0,Math.cos(a)),t*.13*W);return p};
      addGeoS('lower','fabric',clothSurface(48,30,tail,{thickness:.03*W}));
      for(const u of [0,1])addGeoS('lower','trim',tubeG(Array.from({length:41},(_,i)=>tail(i/40,u)),.012*W,6));
      fringe(C,'lower',u=>tail(1,u),15,.08);
    }
    // Duas pregas diagonais apoiadas nos ombros, com borda livre e sem aro rígido.
    const upperCurve=new THREE.CatmullRomCurve3([
      V(-S.x*.96,S.y+.17*W,S.z+.33*W),
      surfAt(shirt.solid,yN-.10*W,-.56,.17*W),
      surfAt(shirt.solid,yN-.21*W,.37,.17*W),
      V(S.x*.87,S.y+.15*W,S.z+.29*W)
    ]);
    for(let layer=0;layer<2;layer++){
      const drape=(t,u)=>{const p=upperCurve.getPoint(u),drop=(.22+.11*Math.sin(PI*u)+.08*(1-u))*W;p.y-=t*drop+layer*.065*W;p.z=Math.max(p.z,frontZ(p.x,p.y)+.18*W)+.045*W*Math.sin(PI*t)+.016*W*Math.sin(u*PI*5)*t;return p};
      addGeoS('extras','accent',clothSurface(32,96,drape,{thickness:.024*W}));
      if(layer===1)addGeoS('extras','trim',tubeG(Array.from({length:73},(_,i)=>drape(1,i/72)),.007*W,6));
    }
    curvedPlate(C,'upper',g.solid,Y(.075),-1.06,.42,.48,'fabric',{off:.08*W});
    shapePlate(C,'upper','trim',badge('flame',.105*W,.018*W).parameters.shapes,Y(.075),-1.06,g.solid,{off:.155*W,depth:.016*W});
  }
  if(!soldier)trousers(human?'Pantalona_da_chama':'Calca_de_viagem','pants',{top:.35,ease:.055*W,cuff:human?.11:.17,puff:human?.055*W:.045*W,knee:.02*W,under:{fn:base,y:Y(.43)+.01}});
  else{
    // Saiote de combate: uma base curta e onze placas independentes com barras douradas.
    const skirt=garment('Saiote_curto_do_deserto','fabric','lower',{top:Y(.34),bottom:Y(.61),t:.04*W,env:{ease:.07*W,hang:.35,flareFrom:Y(.36),flare:.30,folds:.025*W,foldN:12}});
    for(let j=0;j<11;j++){
      const a=(j+.5)/11*2*PI,width=.39;
      const point=(t,u)=>{const yy=lerp(Y(.36),Y(.60),t)+.075*W*Math.sin(PI*u)*t**5,phi=a+(u-.5)*width,p=surfAt(skirt.env,yy,phi,.02*W);p.addScaledVector(V(Math.sin(phi),0,Math.cos(phi)),.04*W*t);return p};
      addGeoS('lower','enamel',clothSurface(42,22,point,{thickness:.035*W}));
      for(const u of [0,1])addGeoS('lower','trim',tubeG(Array.from({length:35},(_,i)=>point(i/34,u)),.012*W,6));
      addGeoS('lower','trim',tubeG(Array.from({length:25},(_,i)=>point(1,i/24)),.012*W,6));
      for(const t of [.12,.22]){const q=point(t,.5);addGeoS('lower','trim',sph(q,.019*W,1,1,.45,14,10))}
    }
    const tab=(t,u)=>{const yy=lerp(Y(.37),Y(.65),t)+.08*W*(1-Math.abs(u-.5)*2)*t**7,phi=(u-.5)*.72;return surfAt(skirt.env,yy,phi,.11*W)};
    addGeoS('lower','accent',clothSurface(54,32,tab,{thickness:.035*W}));
    for(const u of [0,1])addGeoS('lower','trim',tubeG(Array.from({length:41},(_,i)=>tab(i/40,u)),.018*W,6));
    addGeoS('lower','trim',tubeG(Array.from({length:33},(_,i)=>tab(1,i/32)),.018*W,6));
    const flame=badge('flame',.17*W,.025*W);shapePlate(C,'lower','trim',new THREE.Shape(flame.parameters.shapes.getPoints(40)),Y(.51),0,skirt.env,{off:.15*W});flame.dispose();
  }
  // Cinto largo com contorno medido e fivela vazada. O escudo central tem dois relevos.
  beltOn('Cinturao_de_couro','leather',base,waist,(human?.26:.16)*W,.055*W);
  beltOn('Cinturao_borda_superior','trim',base,waist+(human?.125:.075)*W,.013*W,.065*W);
  beltOn('Cinturao_borda_inferior','trim',base,waist-(human?.125:.075)*W,.013*W,.065*W);
  const central=shieldOutline((human?.44:.34)*W,(human?.34:.29)*W);shapePlate(C,'belt','trim',central,waist,0,base,{off:.10*W,depth:.04*W});shapePlate(C,'belt','leather',central,waist,0,base,{off:.145*W,scale:.82,depth:.015*W});
  const crestShape=badge(soldier||human?'flame':'star',.10*W,.015*W).parameters.shapes;
  shapePlate(C,'belt','trim',crestShape,waist,0,base,{off:.18*W,depth:.018*W});
  for(const side of [-1,1]){
    fastener(C,'belt',base,waist,side*.75,.13,.14,.11);
    for(let j=0;j<5;j++){const a=side*(.98+j*.19);addGeoS('belt','trim',sph(surfAt(base,waist,a,.11*W),.016*W,1,1,.5,12,8))}
    if(!soldier){
      const q=surfAt(base,waist-.20*W,side*1.12,.16*W),n=V(Math.sin(side*1.12),0,Math.cos(side*1.12));
      addGeoS('belt','leather',orient(panel((human?.34:.25)*W,(human?.46:.36)*W,.12*W),q,n));
      addGeoS('belt','lining',orient(panel((human?.36:.26)*W,(human?.16:.13)*W,.05*W),q.clone().add(V(0,(human?.18:.14)*W,0)).addScaledVector(n,.075*W),n));
      fastener(C,'belt',base,waist-.16*W,side*1.12,.11,.12,.26);
    }
  }
  // Leitura de capa e estola: pregas amplas, barras e franjas visíveis.
  const c=cape(cowboy?'Poncho_rasgado':'Capa_da_chama','accent',{top:.025,yBottom:Y(cowboy?.80:.94),span:cowboy?4.05:3.5,flare:cowboy?.33:.44,pleats:13,ragged:cowboy?.075*W:0,over:base,trim:'trim',refined:true,sway:human?-.30*W:0});
  if(c){
    const emblem=badge(cowboy?'star':'flame',(cowboy?.28:.43)*W,.02*W);C.capeEmblem(c,emblem,.45,.5);
    for(const u of [.04,.96]){
      addGeoS('cape','trim',tubeG(Array.from({length:65},(_,i)=>c.at(i/64,u)),.012*W,6));
      for(let j=0;j<10;j++){
        const t=.10+j*.078,pts=[];for(let k=0;k<=20;k++){const a=k/20*PI*2;pts.push(c.at(t+Math.sin(a)*.017,u+Math.cos(a)*.023).add(V(0,0,-.018*W)))}addGeoS('cape','trim',tubeG(pts,.0055*W,5));
      }
    }
    fringe(C,'cape',u=>c.at(.99,u),cowboy?54:64,cowboy?.12:.10);
    if(cowboy)for(let i=0;i<12;i++){
      const u=(i+.5)/12,t=.84+.03*Math.sin(i*1.7),st=badge('star',.034*W,.009*W);C.capeEmblem(c,st,t,u);
    }
  }
  // Lenço com três voltas de pano; a borda fica abaixo da boca nos cactos.
  {
    const top=B.cactus?body.pivot.y+body.hs*(-.59-body.pivot.y):yN+.04*W;
    const bottom=B.cactus?Y(.12):Y(.13),headRadius=(B.cactus?.77*body.hs:0);
    for(let j=0;j<(B.cactus?1:3);j++){
      const pt=(t,u)=>{const a=-PI+2*PI*u,yy=lerp(top-j*.075*W,bottom-j*.025*W,t)-.055*W*Math.cos(a),p=surfAt(base,yy,a,.075*W);if(B.cactus){const r=Math.max(Math.hypot(p.x,p.z-z0),headRadius*(1-t)+.02*W);p.set(Math.sin(a)*r,yy,z0+Math.cos(a)*r)}p.addScaledVector(V(Math.sin(a),0,Math.cos(a)),Math.sin(PI*t)*.065*W);return p};
      if(!B.cactus&&!human)addGeoS('extras','accent',clothSurface(24,120,pt,{closed:true,thickness:.025*W}));
      else if(B.cactus){
        const collar=(t,u)=>{const a=-PI+2*PI*u,yy=top-.03*W-t*.15*W-.022*W*Math.cos(a),p=surfAt(base,yy,a,.055*W),r=Math.max(Math.hypot(p.x,p.z-z0),headRadius+.02*W)+.018*W*Math.sin(PI*t);return V(Math.sin(a)*r,yy,z0+Math.cos(a)*r)};
        addGeoS('extras','accent',clothSurface(20,112,collar,{closed:true,thickness:.022*W}));
        const bandana=(t,u)=>{const a=(u-.5)*2.35*(1-.88*t),yy=lerp(top-.12*W,Y(.235),t)+.025*W*Math.sin(u*PI*6)*Math.sin(t*PI);return surfAt(base,yy,a,.065*W+.025*W*Math.sin(PI*t))};
        addGeoS('extras','accent',clothSurface(44,64,bandana,{thickness:.024*W}));
        for(const u of [0,1])addGeoS('extras','trim',tubeG(Array.from({length:41},(_,i)=>bandana(i/40,u)),.006*W,6));
      }
    }
    if(human){const p=surfAt(base,Y(.08),-.9,.18*W);addGeoS('extras','trim',sph(p,.125*W,1,1,.35,32,20));tassel(C,'extras',p.clone().add(V(0,-.13*W,0)),.24)}
  }
  // Ombreiras sobrepostas, braçadeiras e luvas com placas esculpidas.
  if(soldier||human)for(const side of [-1,1]){
    const d=E.clone().sub(S).normalize(),front=V(0,0,1),up=V(-d.y,d.x,0),R=limbR(S.clone().lerp(E,.22),d)+.095*W;
    for(let layer=0;layer<3;layer++){
      const a0=layer*.11,a1=a0+.24,point=(t,u)=>{
        const s=lerp(a0,a1,t),q=S.clone().lerp(E,s),angle=lerp(-.3*PI,1.3*PI,u),r=R*(1.15-layer*.05)+.022*W*Math.sin(PI*t),p=q.addScaledVector(front,Math.cos(angle)*r).addScaledVector(up,Math.sin(angle)*r);p.x*=side;return p;
      };
      addGeoS('upper',human?'leather':'enamel',clothSurface(24,80,point,{thickness:.045*W}));
      addGeoS('upper','trim',tubeG(Array.from({length:81},(_,i)=>point(1,i/80)),.02*W,8));
      for(const u of [.05,.95])addGeoS('upper','trim',sph(point(.75,u),.027*W,1,1,1,16,12));
      if(soldier)for(const u of [.25,.5,.75]){
        const p=point(.40,u),n=p.clone().sub(V(side*S.x,S.y,S.z)).normalize(),sp=new THREE.ConeGeometry(.06*W,.27*W,24);sp.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0,1,0),n));sp.translate(...p.clone().addScaledVector(n,.10*W).toArray());addGeoS('upper','trim',sp);
      }
    }
    const mid=E.clone().lerp(Wr,.60);mid.x*=side;const r=limbR(E.clone().lerp(Wr,.6),Wr.clone().sub(E).normalize())+.07*W;
    const outline=shieldOutline((human?.45:.38)*W,(human?.85:.59)*W),pl=new THREE.ExtrudeGeometry(outline,{depth:.05*W,bevelEnabled:true,bevelSize:.015*W,bevelThickness:.012*W,bevelSegments:3});pl.translate(mid.x,mid.y,mid.z+r);addGeoS('extras','trim',pl);
    const inset=new THREE.ExtrudeGeometry(outline,{depth:.055*W,bevelEnabled:true,bevelSize:.01*W,bevelThickness:.01*W,bevelSegments:3});inset.scale(.83,.86,1);inset.translate(mid.x,mid.y,mid.z+r+.04*W);addGeoS('extras',soldier?'enamel':'leather',inset);
    const emblem=badge('flame',.12*W,.02*W);emblem.translate(mid.x,mid.y,mid.z+r+.105*W);addGeoS('extras','trim',emblem);
  }
  if(!cowboy){limbWrap('Manopla_couro','leather',E,Wr,.28,.94,.045*W);addGeoS('extras','leather',handPatch(body,0,.018*W));}
  if(cowboy){
    addGeoS('extras','leather',handPatch(body,0,.018*W));limbWrap('Punho_das_luvas','leather',E,Wr,.80,.97,.04*W);
    // Cartucheira, coldre e arma possuem silhueta e mecanismos próprios.
    for(let j=-5;j<=5;j++){
      const a=j*.13,p=surfAt(base,waist-.12*W,a,.14*W),cyl=new THREE.CylinderGeometry(.024*W,.022*W,.14*W,12);cyl.translate(...p.toArray());addGeoS('belt','trim',cyl);
      addGeoS('belt','leather',orient(panel(.05*W,.05*W,.025*W),p.clone().add(V(0,-.035*W,.025*W)),V(Math.sin(a),0,Math.cos(a))));
    }
    const p=V(Wr.x-.1*W,Wr.y-.10*W,Wr.z+.13*W),gun=new THREE.CylinderGeometry(.035*W,.035*W,.47*W,24);gun.rotateX(PI/2);gun.translate(p.x,p.y,p.z+.18*W);addGeoS('extras','trim',gun);
    const drum=new THREE.CylinderGeometry(.073*W,.073*W,.13*W,24);drum.rotateX(PI/2);drum.translate(p.x,p.y,p.z-.025*W);addGeoS('extras','leather',drum);
    addGeoS('extras','leather',sph(p.clone().add(V(0,-.10*W,-.12*W)),.08*W,.66,1.6,.75,24,18));
    const ring=new THREE.TorusGeometry(.055*W,.009*W,8,24);ring.rotateY(PI/2);ring.translate(p.x,p.y-.055*W,p.z+.055*W);addGeoS('extras','trim',ring);
    strap(C,'belt','leather',base,[[waist-.3*W,.95],[Y(.55),1.0]],.18,.18);
    for(const side of [-1,1])filigree(C,'upper',g.solid,Y(.18),side*.81,.14,.09);
  }
  // Botas com sola, salto, biqueira e cano estruturado, presas às pernas.
  const bootHeight=soldier?.18:human?.23:.24;
  boots('Botas_de_couro_hero','leather',{h:bootHeight,t:.06*W,cuffT:.035*W,toe:.07});
  if(!B.cactus)C.bootFinish(bootHeight);
  else for(const side of [-1,1]){
    // A sola acompanha o comprimento real do pé compacto, em vez de multiplicar a largura do corpo.
    const L=.105*Lb*(B.foot||1)*(.9+.1*W),w=.19*L+.075*W,heel=A.z-.27*L-.065*W,toe=A.z+.95*L+.09*W,shape=new THREE.Shape();
    shape.moveTo(-w*.72,heel);shape.bezierCurveTo(-w,heel,-w*1.02,toe-.20*L,-w*.82,toe-.025*W);shape.quadraticCurveTo(0,toe+.025*W,w*.82,toe-.025*W);shape.bezierCurveTo(w*1.02,toe-.20*L,w,heel,w*.72,heel);shape.quadraticCurveTo(0,heel-.02*W,-w*.72,heel);
    const sole=new THREE.ExtrudeGeometry(shape,{depth:.085*W,bevelEnabled:true,bevelSize:.014*W,bevelThickness:.012*W,bevelSegments:3,curveSegments:24});sole.rotateX(PI/2);sole.translate(side*A.x,ySole+.018*W,0);addGeoS('feet','sole',sole);
  }
  for(const side of [-1,1]){
    const x=side*A.x,yTop=A.y+bootHeight*Lb,rz=frontZ(x,(A.y+yTop)/2)+.11*W;
    const sh=shieldOutline(.30*W,(yTop-A.y)*.93),pg=new THREE.ExtrudeGeometry(sh,{depth:.035*W,bevelEnabled:true,bevelSize:.012*W,bevelThickness:.01*W,bevelSegments:3});pg.translate(x,(A.y+yTop)/2,rz);addGeoS('feet','trim',pg);
    const inset=new THREE.ExtrudeGeometry(sh,{depth:.035*W,bevelEnabled:true,bevelSize:.008*W,bevelThickness:.008*W,bevelSegments:3});inset.scale(.80,.87,1);inset.translate(x,(A.y+yTop)/2,rz+.035*W);addGeoS('feet',soldier?'enamel':'leather',inset);
    if(soldier||human){const f=badge('flame',.10*W,.02*W);f.translate(x,(A.y+yTop)/2+.03*W,rz+.08*W);addGeoS('feet','trim',f)}
    for(let j=0;j<3;j++){
      const yy=A.y+.08*W+j*.18*W,points=[];
      for(let k=0;k<=32;k++){const a=k/32*2*PI;points.push(V(x+Math.sin(a)*(.26*W),yy,A.z+Math.cos(a)*.25*W))}addGeoS('feet','leather',tubeG(points,.026*W,8));
      const b=buckleGeo(.09*W,.085*W,.012*W);b.translate(x+side*.19*W,yy,A.z+.21*W);addGeoS('feet','trim',b);
    }
    const heel=panel(.33*W,.16*W,.28*W);heel.translate(x,ySole-.015*W,A.z-.12*W);addGeoS('feet','sole',heel);
    if(cowboy){const sp=gear(.09*W,.018*W);sp.rotateY(PI/2);sp.translate(x+side*.19*W,A.y-.10*W,A.z-.28*W);addGeoS('feet','trim',sp)}
  }
  if(soldier){
    const shieldP=V(-Wr.x-.025*W,Wr.y+.15*W,Wr.z+.50*W),r=.53*W,shape=shieldOutline(1.14*W,1.68*W);
    for(const [ch,scale,dz]of [['trim',1,0],['enamel',.91,.05*W],['accent',.78,.075*W]]){
      const gg=new THREE.ExtrudeGeometry(shape,{depth:.07*W,bevelEnabled:true,bevelSize:.025*W,bevelThickness:.018*W,bevelSegments:4,curveSegments:24});gg.scale(scale,scale,1);gg.translate(shieldP.x,shieldP.y,shieldP.z+dz);addGeoS('extras',ch,gg);
    }
    const f=badge('flame',r*.57,.028*W);f.translate(shieldP.x,shieldP.y,shieldP.z+.17*W);addGeoS('extras','trim',f);
    for(const side of [-1,1])for(let j=0;j<5;j++)addGeoS('extras','trim',sph(shieldP.clone().add(V(side*(.46-.018*j)*W,(.48-j*.19)*W,.14*W)),.022*W,1,1,.5,14,10));
    const x=Wr.x+.07*W,top=yN+1.77*W,p0=V(x,ySole+.045*W,Wr.z),p1=V(x,top,Wr.z);
    addGeoS('extras','leather',tubeG([p0,p0.clone().lerp(p1,.5),p1],.028*W,12));
    for(let j=0;j<9;j++){const q=p0.clone().lerp(p1,.13+j*.085),g=new THREE.TorusGeometry(.032*W,.009*W,8,20);g.rotateX(PI/2);g.translate(...q.toArray());addGeoS('extras','trim',g)}
    const spear=new THREE.Shape();spear.moveTo(0,.48*W);spear.quadraticCurveTo(.10*W,.20*W,.15*W,0);spear.lineTo(0,-.13*W);spear.lineTo(-.15*W,0);spear.quadraticCurveTo(-.10*W,.20*W,0,.48*W);
    for(const [ch,s,dz]of [['trim',1,0],['enamel',.65,.034*W]]){const gg=new THREE.ExtrudeGeometry(spear,{depth:.045*W,bevelEnabled:true,bevelSize:.009*W,bevelThickness:.009*W,bevelSegments:3});gg.scale(s,s,1);gg.translate(x,top,Wr.z+dz);addGeoS('extras',ch,gg)}
    tassel(C,'extras',V(x-.10*W,top-.1*W,Wr.z),.28);
  }
  return true;
}
