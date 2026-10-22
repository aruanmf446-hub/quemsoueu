// Figurinos da floresta: cortes assimétricos, camadas de tecido e equipamento construído em volume.
// O corpo serve de medida para garment/envelope; não é deformado para fazer a roupa caber.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {leafGeo,treeGeo,shieldGeo} from './forest.js';
import {panel,buckleGeo,gear,tuft} from './detail.js';
import {handPatch} from './fabric.js';

export function buildHeroForest(c){
  const {style,body,B,J,W,Y,Lb,z0,yN,S,E,Wr,H,K,A,ySole,bf,garment,envelope,trousers,boots,beltOn,cape,rim,edgeTube,sleeveCuffs,surfAt,frontZ,backZ,limbR,limbWrap,button,addGeoS,clothSurface,tubeG,sph,orient,chainG,mirror,memoField,clamp,sstep,lerp,V,PI}=c;
  if(!['forest_archer','forest_guard','forest_artificer','forest_princess'].includes(style))return false;
  const princess=style==='forest_princess',guard=style==='forest_guard',artificer=style==='forest_artificer',archer=style==='forest_archer',female=(B.breasts||0)>.2;
  const emit=(slot,ch,g)=>addGeoS(slot,ch,g),P=(fn,f,a=0,off=.025*W)=>surfAt(fn,Y(f),a,off);
  const line=(slot,ch,pts,r=.009*W)=>{const curve=new THREE.CatmullRomCurve3(pts),length=curve.getLength(),segments=Math.max(6,Math.min(160,Math.ceil(length/(.065*W))));emit(slot,ch,new THREE.TubeGeometry(curve,segments,r,r>.03*W?10:6,false));};
  const ball=(slot,ch,p,r=.018*W,sx=1,sy=1,sz=1)=>emit(slot,ch,sph(p,r,sx,sy,sz,16,10));
  function glyph(slot,fn,f,a,r,kind='leaf',off=.055*W){
    const g=kind==='tree'?treeGeo(r):leafGeo(r,.014*W),p=P(fn,f,a,off),n=V(Math.sin(a),0,Math.cos(a));
    emit(slot,'trim',orient(g,p,n));return p;
  }
  function stitched(slot,points,r=.006*W,ch='trim'){
    const curve=new THREE.CatmullRomCurve3(points),n=Math.max(4,Math.min(64,Math.round(curve.getLength()/(.045*W))));
    for(let i=0;i<n;i+=2)line(slot,ch,[curve.getPoint(i/n),curve.getPoint((i+.7)/n)],r);
  }
  // Bandeira com contorno de corte próprio: o painel mede toda a altura na envoltória, inclusive sob a cintura.
  function hanging(slot,ch,fn,f0,f1,a,width,{tip=.08,rag=.012,flare=.08,taper=.88,fold=.025,slant=0,hem=true,lift=.055}={}){
    const yt=Y(f0),yb=Y(f1),pt=(t,u)=>{
      const a2=a+(u-.5)*width*lerp(1,taper,t),y=lerp(yt,yb,t)+W*(tip*(Math.abs(2*u-1)-.45)+rag*(Math.sin(u*49)+.4*Math.sin(u*113))+slant*(u-.5))*t**7;
      const q=surfAt(fn,y,a2,lift*W+flare*W*t*t+fold*W*Math.sin(u*PI*8+1.8*t)*Math.sin(PI*t));return q;
    };
    emit(slot,ch,clothSurface(42,28,pt,{thickness:.022*W}));
    if(hem){for(const edge of [0,1])line(slot,'leather',Array.from({length:33},(_,i)=>pt(i/32,edge)),.012*W);line(slot,'trim',Array.from({length:43},(_,i)=>pt(1,i/42)),.012*W);}
    return pt;
  }
  // Brasão projetado sobre um painel curvo; as folhas ficam assentadas no próprio tecido.
  function embroidery(slot,pt,r=.18*W,t=.55,u=.5,kind='tree'){
    const g=kind==='tree'?treeGeo(r):leafGeo(r,.012*W),pa=g.attributes.position,dy=pt(clamp(t-.01,0,1),u).distanceTo(pt(clamp(t+.01,0,1),u))/.02,dx=pt(t,clamp(u-.01,0,1)).distanceTo(pt(t,clamp(u+.01,0,1)))/.02;
    for(let i=0;i<pa.count;i++){
      const q=pt(clamp(t-pa.getY(i)/Math.max(.1,dy),.01,.99),clamp(u+pa.getX(i)/Math.max(.1,dx),.01,.99)),n=V(q.x,0,q.z-z0).normalize();q.addScaledVector(n,.018*W+pa.getZ(i));pa.setXYZ(i,...q.toArray());
    }g.computeVertexNormals();emit(slot,'trim',g);
  }
  function strap(slot,fn,f0,a0,f1,a1,width=.075*W,ch='leather',lift=.06*W){
    const pt=(t,u)=>{const y=Y(lerp(f0,f1,t)),a=lerp(a0,a1,t),q=surfAt(fn,y,a,lift),rho=Math.max(.25*W,Math.hypot(q.x,q.z-z0));return surfAt(fn,y,a+(u-.5)*width/rho,lift+.006*W*Math.sin(PI*u));};
    emit(slot,ch,clothSurface(32,6,pt,{thickness:.018*W}));
    for(const edge of [.13,.87])stitched(slot,Array.from({length:31},(_,i)=>pt(i/30,edge)),.0045*W);
    return pt;
  }
  function fastening(slot,fn,f,a,w=.15*W,h=.12*W){const p=P(fn,f,a,.095*W),n=V(Math.sin(a),0,Math.cos(a));emit(slot,'trim',orient(buckleGeo(w,h,.018*W),p,n));line(slot,'trim',[p.clone().add(V(-w*.1,0,.01*W)),p.clone().add(V(w*.42,0,.01*W))],.009*W);}
  function pouch(slot,fn,f,a,w=.25*W,h=.31*W){
    const p=P(fn,f,a,.12*W),n=V(Math.sin(a),0,Math.cos(a)),tr=g=>orient(g,p,n);
    emit(slot,'leather',tr(new RoundedBoxGeometry(w,h,.17*W,5,.04*W)));
    const flap=panel(w*1.09,h*.37,.035*W);flap.translate(0,h*.3,.105*W);emit(slot,'lining',tr(flap));
    const strap=panel(w*.14,h*.64,.025*W);strap.translate(0,h*.01,.13*W);emit(slot,'leather',tr(strap));
    const bg=buckleGeo(w*.33,h*.23,.014*W);bg.translate(0,-h*.02,.15*W);emit(slot,'trim',tr(bg));
    for(const s of [-1,1]){const pts=[V(s*w*.40,-h*.36,.095*W),V(s*w*.41,0,.10*W),V(s*w*.4,h*.36,.11*W)].map(q=>q.applyMatrix4(new THREE.Matrix4().makeBasis(V(n.z,0,-n.x),V(0,1,0),n).setPosition(p)));stitched(slot,pts,.0045*W);}
  }
  function plateGeometry(w,h,bulge=.04*W,scallop=false){
    const shape=new THREE.Shape();shape.moveTo(0,h*.52);shape.bezierCurveTo(w*.16,h*.39,w*.5,h*.43,w*.48,h*.21);shape.lineTo(w*.42,-h*.30);shape.quadraticCurveTo(w*.20,-h*.42,0,-h*.56);shape.quadraticCurveTo(-w*.20,-h*.42,-w*.42,-h*.30);shape.lineTo(-w*.48,h*.21);shape.bezierCurveTo(-w*.5,h*.43,-w*.16,h*.39,0,h*.52);
    const g=new THREE.ExtrudeGeometry(shape,{depth:.033*W,bevelEnabled:true,bevelSegments:3,bevelSize:.014*W,bevelThickness:.012*W,curveSegments:20}),pa=g.attributes.position;
    for(let i=0;i<pa.count;i++){const x=pa.getX(i);pa.setZ(i,pa.getZ(i)+bulge*(1-(2*x/w)**2));}g.computeVertexNormals();return {g,shape};
  }
  function plate(slot,p,w,h,ch='leather',axis=V(0,1,0),crest=true){
    const yy=axis.clone().normalize(),zz=V(0,0,1).addScaledVector(yy,-yy.z).normalize(),xx=yy.clone().cross(zz).normalize(),mat=new THREE.Matrix4().makeBasis(xx,yy,zz).setPosition(p),{g,shape}=plateGeometry(w,h,.055*W);
    emit(slot,ch,g.applyMatrix4(mat));
    const pts=shape.getPoints(60).map(q=>V(q.x,q.y,.045*W+.055*W*(1-(2*q.x/w)**2)).applyMatrix4(mat));line(slot,'trim',pts,.014*W);
    for(const s of [-1,1])ball(slot,'trim',V(s*w*.31,h*.24,.07*W).applyMatrix4(mat),.017*W);
    if(crest){const l=leafGeo(Math.min(w*.24,h*.23),.014*W);l.translate(0,0,.11*W);emit(slot,'trim',l.applyMatrix4(mat));}
  }
  function armoredShoulders(){
    for(const side of [-1,1])for(let layer=0;layer<3;layer++){
      const center=S.clone().lerp(E,.025+layer*.075);center.x*=side;
      const r=limbR(S.clone().lerp(E,.18),E.clone().sub(S).normalize())+(.12-layer*.025)*W;
      const pt=(t,u)=>{const ph=u*PI*2,th=.04+t*1.66;return center.clone().add(V(Math.sin(th)*Math.sin(ph)*r*1.18,Math.cos(th)*r*.77+r*.32,Math.sin(th)*Math.cos(ph)*r*1.12));};
      emit('upper','leather',clothSurface(18,56,pt,{closed:true,thickness:.035*W}));
      line('upper','trim',Array.from({length:73},(_,i)=>pt(1,i/72)),.022*W);
      for(let j=0;j<10;j++)ball('upper','trim',pt(.94,j/10),.018*W);
      if(layer===0){const p=center.clone().add(V(0,r*.77,r*.66));plate('upper',p,r*1.0,r*.7,'leather',V(side*.2,1,0),true);}
    }
  }
  function bootwork(tall=true){
    boots('Botas_esculpidas_floresta','leather',{t:.075*W,h:tall?.28:.075,cuffT:.08*W,toe:.055*W});
    for(const side of [-1,1]){
      const x=side*A.x,sole=new RoundedBoxGeometry(.53*W*(B.foot||1),.12*W,1.08*W*(B.foot||1),5,.055*W);sole.translate(x,ySole+.015*W,A.z+.19*W);emit('feet','sole',sole);
      const heel=new RoundedBoxGeometry(.43*W*(B.foot||1),.16*W,.35*W,3,.025*W);heel.translate(x,ySole+.08*W,A.z-.16*W);emit('feet','sole',heel);
      const top=A.y+(tall?.24:.045)*Lb;
      for(let row=0;row<(tall?3:1);row++){
        const y=lerp(A.y+.19*W,top,row/(tall?2:1)),q=V(x,y,frontZ(x,y)+.11*W),w=.24*W;
        emit('feet','leather',orient(panel(w*1.45,.075*W,.035*W),q,V(0,0,1)));emit('feet','trim',orient(buckleGeo(.13*W,.09*W,.016*W),q.clone().add(V(side*.08*W,0,.03*W)),V(0,0,1)));
      }
      for(let i=0;i<6;i++){
        const y=A.y+.04*W+i*.067*W,z=frontZ(x,y)+.10*W;
        line('feet','trim',[V(x-.13*W,y,z),V(x+.13*W,y+.055*W,z+.004*W)],.006*W);
        for(const s of [-1,1]){const ring=new THREE.TorusGeometry(.014*W,.004*W,6,12);ring.translate(x+s*.14*W,y,z);emit('feet','trim',ring);}
      }
      if(tall){const p=K.clone().lerp(A,.45);p.x*=side;p.z=frontZ(p.x,p.y)+.14*W;plate('feet',p,.39*W,.86*W,'leather');const knee=V(side*K.x,K.y,frontZ(side*K.x,K.y)+.11*W);plate('feet',knee,.35*W,.35*W,'leather',V(side*.08,1,0));}
    }
  }
  function bracers(){
    limbWrap('Bracadeiras_estruturadas','leather',E,Wr,.23,.90,.065*W,{flare:.018*W});
    for(const side of [-1,1]){
      const d=Wr.clone().sub(E).normalize(),p=E.clone().lerp(Wr,.56);p.x*=side;p.z+=limbR(E.clone().lerp(Wr,.56),d)+.07*W;
      plate('extras',p,.33*W,E.distanceTo(Wr)*.62,'leather',V(-side*d.x,-d.y,-d.z));
      for(const t of [.31,.78]){const q=E.clone().lerp(Wr,t);q.x*=side;q.z+=limbR(E.clone().lerp(Wr,t),d)+.12*W;emit('extras','trim',orient(buckleGeo(.12*W,.09*W,.015*W),q,V(0,0,1)));}
    }
    emit('extras','leather',handPatch(body,0,.023*W));
  }
  function leafBelt(fn,princess=false){
    const f=.335;beltOn('Cintura_em_camadas','leather',fn,Y(f),princess?.14*W:.17*W,.05*W,{tilt:princess?-.035:0});
    const p=P(fn,f,0,.12*W);plate('belt',p,.31*W,.24*W,'trim',V(0,1,0),false);const l=leafGeo(.10*W,.02*W);l.translate(p.x,p.y,p.z+.09*W);emit('belt','gem',l);
    for(let i=0;i<12;i++){const a=-1.35+2.7*i/11;ball('belt','trim',P(fn,f,a,.10*W),.015*W);}
    if(princess){for(let i=0;i<12;i++)glyph('belt',fn,f+.015*Math.sin(i),i*PI*2/12,.08*W);}
    else{for(const s of [-1,1]){fastening('belt',fn,f,s*.68);pouch('belt',fn,.39,s*.88,.24*W,.31*W);}strap('belt',fn,.33,-1.4,.41,1.1,.10*W,'leather',.10*W);}
  }
  function mantle(fn,ragged=true){
    const o={top:princess?.075:.018,yBottom:Y(princess?.985:artificer?.83:.80),span:princess?4.65:3.85,turn:archer?-.13:0,flare:princess?.55:.26,pleats:princess?13:11,ragged:ragged?.065*W:0,over:fn,trim:'trim',refined:true},cp=cape('Capa_com_pregas_floresta','accent',o);
    if(cp){
      // Barra dupla, bordado de árvore e ramos acompanham a deformação real da capa.
      const boundary=t=>Array.from({length:73},(_,i)=>cp.at(t,i/72));line('cape','trim',boundary(.965),.013*W);
      for(const side of [0,1]){const pts=Array.from({length:49},(_,i)=>cp.at(i/48,side));stitched('cape',pts,.006*W);}
      embroidery('cape',cp.at,.30*W,.49,.5,'tree');
      for(let i=0;i<7;i++)embroidery('cape',cp.at,.055*W,.84+.025*Math.sin(i),.18+i*.105,'leaf');
      if(ragged){for(let i=0;i<24;i++){const u=(i+.5)/24,p=cp.at(.995,u),q=p.clone().add(V(.015*W*Math.sin(i*3),-(.07+.05*(.5+.5*Math.sin(i*7)))*W,-.015*W));line('cape','secondary',[p,q],.008*W);}}
    }
    return cp;
  }
  function shoulderDrape(fn){
    const ytop=yN+.10*W,point=(t,u)=>{
      const a=-PI+u*PI*2,y=ytop-t*(.25+.14*Math.abs(Math.sin(a)))*W+.04*W*Math.sin(a*3)*t;
      const q=surfAt(fn,y,a,.08*W+.045*W*Math.sin(t*PI*3+u*PI*9));return q;
    };
    emit('cape','accent',clothSurface(24,144,point,{closed:true,thickness:.025*W}));
    for(let i=0;i<3;i++)line('cape','accent',Array.from({length:97},(_,j)=>point(.25+i*.26,j/96)),.035*W);
    for(const s of [-1,1]){const p=surfAt(fn,yN-.05*W,s*.85,.15*W),g=new THREE.CylinderGeometry(.09*W,.09*W,.025*W,40);g.rotateX(PI/2);g.translate(...p.toArray());emit('cape','trim',g);const l=leafGeo(.055*W,.015*W);l.rotateZ(-s*.4);l.translate(p.x,p.y,p.z+.03*W);emit('cape','fabric',l);}
  }

  if(princess){
    // O corpete tem decote coração, painéis laterais e cintura independente da saia.
    const heart=(x,z)=>(.115*W*Math.exp(-(((x/W-.32)/.22)**2))-.070*W*Math.exp(-((x/(.14*W))**2)))*sstep(z0,z0+.22*W,z)+.075*W*sstep(z0,z0-.25*W,z),bodiceTop=Y(.105);
    const g=garment('Corpete_coracao_folhagem','fabric','upper',{top:bodiceTop,bottom:Y(.355),t:.055*W,sleeve:null,cell:.026*clamp(W,1,1.3),edge:(x,y,z)=>heart(x,z),env:{ease:.05*W,hang:.65,cinch:Y(.325),cinchK:.97,cinchW:.16*W}});
    const neckline=a=>{let y=bodiceTop,p;for(let k=0;k<4;k++){p=surfAt(g.solid,y,a,.022*W);y=bodiceTop+heart(Math.abs(p.x),p.z);}return surfAt(g.solid,y,a,.025*W);};
    line('upper','trim',Array.from({length:145},(_,i)=>neckline(-PI+i/144*2*PI)),.017*W);
    // Mangas de véu começam nos braços: os ombros e as clavículas ficam descobertos.
    for(const side of [-1,1]){
      const axis=E.clone().sub(S).normalize(),up=V(0,0,1),cross=up.clone().cross(axis).normalize(),R=limbR(S.clone().lerp(E,.42),axis)+.045*W;
      const drape=(t,u)=>{const a=u*2*PI,center=S.clone().lerp(E,.27+.52*t),r=R+(.17*W*t)+.035*W*Math.sin(a*7+t*2)*t,q=center.clone().addScaledVector(cross,Math.cos(a)*r).addScaledVector(up,Math.sin(a)*r);q.y-=.26*W*t*t;q.x*=side;return q;};
      emit('cape','veil',clothSurface(34,80,drape,{closed:true,thickness:.012*W}));
      for(const t of [0,1])line('cape','trim',Array.from({length:81},(_,i)=>drape(t,i/80)),t===0?.023*W:.012*W);
      const p=drape(.02,.25);ball('cape','gem',p,.055*W,.8,1.1,.6);
    }
    const skirt=garment('Saia_inferior_princesa','secondary','lower',{top:Y(.33),bottom:ySole+.075*W,t:.06*W,sleeve:null,env:{ease:.075*W,hang:.25,flareFrom:Y(.36),flare:.40,folds:.065*W,foldN:17,foldTwist:.35,smooth:14}});
    const surface=skirt.env;
    for(const s of [-1,1]){
      const cp=hanging('upper','accent',g.env,.115,.342,s*.60,.47,{tip:0,flare:0,rag:0,fold:0,taper:.78});
      for(const e of [0,1])line('upper','trim',Array.from({length:41},(_,i)=>cp(i/40,e)),.012*W);
      for(let i=0;i<3;i++)glyph('upper',g.env,.18+i*.05,s*(.55+.03*i),.06*W);
    }
    // Pétalas de tecido com três comprimentos criam a saia em cascata.
    for(let layer=0;layer<3;layer++)for(let i=0;i<9;i++){
      const a=-PI+2*PI*(i+.5*(layer%2))/9,width=.74,pt=hanging('lower',layer%2?'secondary':'accent',surface,.335+layer*.025,.96-layer*.15,a,width,{tip:.15,rag:.004,flare:.04+.035*layer,taper:.77,fold:.022,hem:true,lift:.10+.10*layer});
      if(layer===0&&i%2===0)embroidery('lower',pt,.105*W,.68,.5,'leaf');
    }
    for(const side of [-1,1]){
      for(let i=0;i<3;i++){
        const pt=hanging('cape',i%2?'veil':'secondary',surface,.14+i*.10,.88-i*.07,side*(1.35+.18*i),.68,{tip:.22,flare:.12+.06*i,taper:.5,fold:.045,lift:.40+.065*i});
        embroidery('cape',pt,.11*W,.65,.5,'leaf');
      }
    }
    leafBelt(g.solid,true);mantle((x,y,z)=>Math.min(g.env(x,y,z),surface(x,y,z)-.09*W),false);
    for(const side of [-1,1]){
      const points=[];for(let j=0;j<=48;j++){const t=j/48;points.push(P(surface,.38+.26*t,side*(.17+.75*t),.11*W));}emit('belt','trim',chainG(points,.018*W));
      for(let i=0;i<6;i++){const t=i/5,p=P(surface,.385+.26*t,side*(.18+.75*t),.12*W);ball('belt','pearl',p,.023*W);}
      for(let i=0;i<6;i++)glyph('cape',surface,.45+i*.07,side*(1.35+.15*Math.sin(i)),.06*W);
    }
    const neckEnv=envelope(Y(.015),Y(.135),{ease:.008*W,hang:.8,drape:0,smooth:8}),necklace=[];for(let i=0;i<=64;i++){const a=lerp(-1.05,1.05,i/64),f=.055+.035*(1-Math.abs(a)/1.05);necklace.push(P(neckEnv,f,a,.04*W));}emit('extras','trim',chainG(necklace,.014*W));
    for(let i=0;i<7;i++)glyph('extras',neckEnv,.06+.025*(1-Math.abs(i-3)/3),(i-3)*.21,.055*W);
    const gem=P(neckEnv,.10,0,.065*W),stone=new THREE.OctahedronGeometry(.09*W,1);stone.scale(.75,1.35,.45);stone.translate(...gem.toArray());emit('extras','gem',stone);
    bootwork(false);return true;
  }

  const hem=archer?.39:artificer?.43:.49;
  // Camisa clara dos arqueiros possui folga nos braços e franzidos próprios.
  const shirt=garment(archer?'Blusa_linho_arqueiro':artificer?'Camisa_artifice':'Tunica_guarda_ajustada',archer?'secondary':'fabric','upper',{top:archer?Y(.10):yN+.045*W,bottom:Y(hem),t:.052*W,sleeve:archer?null:artificer?'forearm':'short',short:guard?.68:.77,sleeveEase:(archer?.095:.065)*W,puff:(archer?.060:.045)*W,vneck:archer?.14*W:.06*W,env:{ease:.052*W,hang:.55,cinch:Y(.33),cinchK:.9,flareFrom:Y(.35),flare:archer?.07:.14,folds:.018*W,foldN:13,smooth:12}});
  sleeveCuffs(shirt,'upper',archer?'leather':'trim',archer?.07*W:.055*W);
  if(archer){
    // A manga tem abertura no bíceps, ombro livre e punho enrolado; não é uma extensão quadrada da camisa.
    const curve=new THREE.CatmullRomCurve3([S.clone().lerp(E,.26),S.clone().lerp(E,.62),E.clone(),E.clone().lerp(Wr,.43)]),nr=40,frames=curve.computeFrenetFrames(nr,false),radii=[];
    for(let row=0;row<=nr;row++){
      const t=row/nr,center=curve.getPoint(t),u=frames.normals[row],v=frames.binormals[row];let radius=.02*W;
      for(let j=0;j<12;j++){const a=j/12*2*PI,dir=u.clone().multiplyScalar(Math.cos(a)).addScaledVector(v,Math.sin(a));let r=.01*W;for(let k=0;k<72;k++){const q=center.clone().addScaledVector(dir,r);if(bf(q.x,q.y,q.z)>0)break;r+=.012*W;}radius=Math.max(radius,r);}
      radii.push(radius+.055*W+.085*W*Math.sin(PI*t));
    }
    for(const side of [-1,1]){
      const point=(t,u)=>{const row=Math.min(nr-1,Math.floor(t*nr)),frac=t*nr-row,a=u*2*PI,center=curve.getPoint(t),rr=lerp(radii[row],radii[row+1],frac)+.008*W*Math.sin(a*11+t*3)*Math.sin(PI*t),normal=frames.normals[row].clone().lerp(frames.normals[row+1],frac).normalize(),binormal=frames.binormals[row].clone().lerp(frames.binormals[row+1],frac).normalize(),q=center.addScaledVector(normal,Math.cos(a)*rr).addScaledVector(binormal,Math.sin(a)*rr);q.x*=side;return q;};
      emit('upper','secondary',clothSurface(nr,80,point,{closed:true,thickness:.025*W}));
      for(const t of [0,.94,.975,1])line('upper',t===0?'leather':'secondary',Array.from({length:81},(_,i)=>point(t,i/80)),t===0?.028*W:.025*W);
      const p=point(.04,.25),buckle=buckleGeo(.13*W,.095*W,.016*W);buckle.translate(...p.toArray());emit('upper','trim',buckle);
    }
  }
  rim('upper',archer?'secondary':'trim',shirt.outer,Y(hem)+.015*W,.018*W);
  let over=shirt.env,outer=shirt;
  if(archer||artificer){
    const vest=garment(artificer?'Casaca_couro_artifice':'Corselet_aberto_arqueiro','leather','upper',{top:yN-.02*W,bottom:Y(artificer?.46:.365),sleeve:null,cell:.034*clamp(W,1,1.3),open:artificer?.24:.18,openTaper:artificer?1.35:.6,hollow:true,mesh:false,t:.065*W,over:shirt.solid,overGap:.065*W,shoulderPad:.015,hemCurve:artificer?.18*W:.035*W,env:{ease:.09*W,hang:.45,cinch:Y(.32),cinchK:.94,flareFrom:Y(.34),flare:artificer?.10:0,folds:.012*W,foldN:10}});
    // O loft tem cava e abertura definidas por curvas, sem bordas recortadas em células SDF.
    const vestEnv=(x,y,z)=>Math.min(shirt.env(x,y,z)-.065*W,vest.env(x,y,z)-.025*W),a0=artificer?.24:.18;
    const vestPoint=(t,u)=>{const a=lerp(a0,2*PI-a0,u),side=Math.abs(Math.sin(a)),front=Math.max(0,Math.cos(a)),ft=.015+.185*side**7+.045*front**6,yTop=Y(ft),yBot=Y(artificer?.46:.365)-.035*W*(1-Math.cos(a));return surfAt(vestEnv,lerp(yTop,yBot,t),a,.018*W);};
    emit('upper','leather',clothSurface(56,144,vestPoint,{thickness:.030*W}));
    for(const t of [0,1]){const pts=Array.from({length:145},(_,i)=>vestPoint(t,i/144));line('upper','leather',pts,.020*W);stitched('upper',pts,.005*W);}
    for(const u of [0,1])line('upper','trim',Array.from({length:57},(_,i)=>vestPoint(i/56,u)),.013*W);
    vest.solid=vestEnv;vest.outer=vestEnv;outer=vest;
    over=(x,y,z)=>Math.min(shirt.env(x,y,z),vestEnv(x,y,z)-.020*W);
    for(const side of [-1,1]){
      strap('upper',vest.solid,.10,side*.75,.31,-side*.30,.11*W,'leather',.055*W);fastening('upper',vest.solid,.21,side*.27,.12*W,.10*W);
      const pts=[];for(let i=0;i<=36;i++)pts.push(P(vest.solid,.12+i/36*.20,side*(.60-.06*Math.sin(PI*i/36)),.05*W));stitched('upper',pts,.005*W);
      if(artificer)pouch('upper',vest.solid,.27,side*.75,.22*W,.22*W);
    }
    for(let i=0;i<5;i++){
      const f=.19+i*.029,a=.21-i*.012;for(const s of [-1,1])ball('upper','trim',P(shirt.solid,f,s*a,.09*W),.015*W);
      const p0=P(shirt.solid,f,-a,.10*W),p1=P(shirt.solid,f+.015,a,.10*W);line('upper','lining',[p0,p0.clone().lerp(p1,.5).add(V(0,.012*W,.015*W)),p1],.008*W);
    }
  }
  trousers('Calca_ajustada_floresta','pants',{top:.34,ease:.045*W,cuff:.065,puff:.055*W,under:{fn:shirt.solid,y:Y(hem)+.03*W}});
  const skirtEnv=envelope(Y(.32),Y(.70),{ease:.10*W,hang:.35,flareFrom:Y(.35),flare:.16,folds:.028*W,foldN:13,smooth:12});
  if(archer){
    // Abas desencontradas mostram a construção da roupa e deixam a silhueta das pernas legível.
    for(const side of [-1,1]){
      const back=hanging('lower','secondary',skirtEnv,.34,side>0?.64:.60,side*.78,1.12,{tip:.12,rag:.018,flare:.055,taper:.8,slant:side*.08,lift:.075});
      const green=hanging('lower','fabric',skirtEnv,.34,side>0?.70:.62,side*.57,.65,{tip:.14,rag:.014,flare:.085,taper:.70,slant:-side*.07,lift:.18});
      embroidery('lower',green,.18*W,.58,.48,'tree');
      for(let i=0;i<5;i++)embroidery('lower',green,.047*W,.25+i*.12,.75,'leaf');
    }
    hanging('lower','secondary',skirtEnv,.34,.57,PI,1.9,{tip:.10,rag:.022,flare:.055,taper:1.02});
  }else{
    const central=hanging('upper',artificer?'accent':'fabric',shirt.env,.08,.49,0,.76,{tip:.055,rag:0,flare:.015,taper:.84,fold:.008});embroidery('upper',central,.24*W,.35,.5,'tree');
    for(const side of [-1,1]){
      const pt=hanging('lower','fabric',skirtEnv,.34,artificer?.69:.67,side*.62,.74,{tip:.12,rag:artificer?.018:.005,flare:.07,taper:.75,lift:.16});embroidery('lower',pt,.17*W,.52,.50,'tree');
      hanging('lower','secondary',skirtEnv,.35,.60,side*1.23,.45,{tip:.08,rag:.01,flare:.10,taper:.9,lift:.065});
    }
    armoredShoulders();
  }
  const neckSupport=envelope(yN+.16*W,Y(.17),{ease:.025*W,hang:.65,drape:.008*W,smooth:10});
  const capeSupport=(x,y,z)=>lerp(neckSupport(x,y,z),over(x,y,z),sstep(Y(.045),Y(.14),y));
  leafBelt(outer.solid,false);mantle(capeSupport,true);shoulderDrape(neckSupport);bracers();bootwork(true);
  // Alça da aljava/mochila separada dos cintos do gibão e seguindo toda a curvatura da roupa.
  if(archer||artificer){strap('extras',over,.025,-.87,.34,.92,.12*W,'leather',.10*W);fastening('extras',over,.20,.15,.15*W,.12*W);}

  if(guard){
    const p=V(-Wr.x-.055*W,Wr.y+.30*W,Wr.z+.61*W),r=.215*Lb;
    const frame=shieldGeo(r);frame.translate(...p.toArray());emit('extras','trim',frame);
    const wood=shieldGeo(r*.91);wood.translate(p.x,p.y,p.z+.095*W);emit('extras','leather',wood);
    const shape=shieldGeo(r*.86);shape.translate(p.x,p.y,p.z+.14*W);emit('extras','leather',shape);
    const tree=treeGeo(.42*r);tree.translate(p.x,p.y+.02*W,p.z+.22*W);emit('extras','trim',tree);
    // Juntas da madeira e rebites seguem a curvatura do escudo, deixando o brasão legível.
    for(const side of [-1,1])for(let i=0;i<5;i++){const yy=p.y+r*(.53-i*.23),xx=p.x+side*r*(.40-.04*i);ball('extras','trim',V(xx,yy,p.z+.15*W),.026*W);}
    for(const side of [-1,1])line('extras','leather',[V(p.x+side*r*.21,p.y+r*.53,p.z+.17*W),V(p.x+side*r*.22,p.y-r*.15,p.z+.17*W),V(p.x+side*r*.10,p.y-r*.54,p.z+.17*W)],.012*W);
    const x=Wr.x+.15*W,top=yN+1.85*W,bottom=ySole+.015*W;
    line('extras','leather',[V(x,bottom,.12*W),V(x,(bottom+top)/2,.12*W),V(x,top,.12*W)],.036*W);
    for(let i=0;i<6;i++){const band=new THREE.TorusGeometry(.040*W,.012*W,8,24);band.rotateX(PI/2);band.translate(x,top-.35*W-i*.07*W,.12*W);emit('extras','trim',band);}
    const blade=new THREE.Shape();blade.moveTo(0,.62*W);blade.lineTo(.14*W,.16*W);blade.lineTo(.055*W,-.13*W);blade.lineTo(-.055*W,-.13*W);blade.lineTo(-.14*W,.16*W);blade.closePath();
    const spear=new THREE.ExtrudeGeometry(blade,{depth:.045*W,bevelEnabled:true,bevelSize:.015*W,bevelThickness:.02*W,bevelSegments:2});spear.translate(x,top,.10*W);emit('extras','trim',spear);
    const inlay=leafGeo(.16*W,.018*W);inlay.translate(x,top+.15*W,.15*W);emit('extras','fabric',inlay);
  }
  if(archer){
    const x=Wr.x-.22*W,y=Wr.y+.10*W,z=Wr.z+.22*W,h=.21*Lb;
    const pts=[V(x+.12*W,y-h,z),V(x-.10*W,y-h*.79,z+.07*W),V(x+.23*W,y-h*.42,z+.07*W),V(x+.33*W,y,z),V(x+.23*W,y+h*.42,z+.07*W),V(x-.1*W,y+h*.79,z+.07*W),V(x+.12*W,y+h,z)];
    line('extras','leather',pts,.055*W);line('extras','trim',pts.map(p=>p.clone().add(V(.018*W,0,.035*W))),.012*W);
    const grip=panel(.13*W,.30*W,.12*W);grip.translate(x+.30*W,y,z);emit('extras','leather',grip);
    line('extras','secondary',[pts[0],V(x-.08*W,y,z),pts[6]],.008*W);
    for(const side of [-1,1]){
      const p=V(x+.03*W,y+side*h*.74,z+.10*W),cog=gear(.11*W,.028*W);cog.translate(...p.toArray());emit('extras','trim',cog);
      const leaf=leafGeo(.14*W,.018*W);leaf.rotateZ(side*.4);leaf.translate(x+.14*W,y+side*h*.42,z+.12*W);emit('extras','accent',leaf);
    }
    // Aljava inclinada com boca espessa, bolsas laterais e flechas com três empenagens.
    const center=V(.47*W,Y(.18),backZ(.47*W,Y(.18))-.34*W),axis=V(-.22,.97,-.04).normalize(),len=.28*Lb;
    const cylinder=new THREE.CylinderGeometry(.19*W,.14*W,len,40);cylinder.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0,1,0),axis));cylinder.translate(...center.toArray());emit('extras','leather',cylinder);
    for(const t of [-.46,.44]){const q=center.clone().addScaledVector(axis,len*t),ring=new THREE.TorusGeometry((t<0?.15:.19)*W,.035*W,10,48);emit('extras','trim',orient(ring,q,axis));}
    const rear=center.clone().add(V(0,0,-.19*W));emit('extras','trim',orient(treeGeo(.16*W),rear,V(0,0,-1)));
    for(let i=0;i<7;i++){
      const a=i*PI*2/7,q=center.clone().add(V(Math.cos(a)*.115*W,0,Math.sin(a)*.115*W)).addScaledVector(axis,-len*.18),end=q.clone().addScaledVector(axis,len*.92+(i%3)*.06*W);
      line('extras','leather',[q,end],.013*W);
      for(let k=0;k<3;k++){const f=tuft(end.clone().addScaledVector(axis,-.19*W).add(V(Math.cos(k*PI*2/3)*.025*W,0,Math.sin(k*PI*2/3)*.025*W)),end.clone().add(V(Math.cos(k*PI*2/3)*.09*W,0,Math.sin(k*PI*2/3)*.09*W)),.055*W,.01*W,.01*W);emit('extras',k%2?'accent':'fabric',f);}
    }
    // Cintas presas ao dorso sustentam a aljava sobre o manto.
    for(const t of [-.25,.22]){const q=center.clone().addScaledVector(axis,len*t);const ring=new THREE.TorusGeometry(.19*W,.018*W,8,40);emit('extras','fabric',orient(ring,q,axis));}
  }
  if(artificer){
    const p=V(0,Y(.18),backZ(0,Y(.18))-.38*W);
    const main=new RoundedBoxGeometry(.96*W,1.22*W,.43*W,5,.09*W);main.translate(...p.toArray());emit('extras','leather',main);
    const back=panel(.72*W,.77*W,.045*W);back.translate(p.x,p.y-.08*W,p.z-.25*W);emit('extras','fabric',back);
    for(const side of [-1,1]){
      const tankp=p.clone().add(V(side*.52*W,.02*W,-.04*W)),tank=new THREE.CylinderGeometry(.14*W,.14*W,.91*W,36);tank.translate(...tankp.toArray());emit('extras','trim',tank);
      const core=new THREE.CylinderGeometry(.116*W,.116*W,.49*W,28);core.translate(...tankp.toArray());emit('extras','gem',core);
      for(const y of [-.39,0,.39]){const ring=new THREE.TorusGeometry(.15*W,.027*W,8,32);ring.rotateX(PI/2);ring.translate(tankp.x,tankp.y+y*W,tankp.z);emit('extras','leather',ring);}
      for(const y of [-.28,.26]){const cog=gear(.14*W,.045*W);cog.rotateY(PI);cog.translate(p.x+side*.29*W,p.y+y*W,p.z-.28*W);emit('extras','trim',cog);}
      const band=panel(.052*W,.99*W,.035*W);band.translate(p.x+side*.28*W,p.y,p.z-.29*W);emit('extras','leather',band);
      const bg=buckleGeo(.12*W,.14*W,.018*W);bg.rotateY(PI);bg.translate(p.x+side*.28*W,p.y-.12*W,p.z-.32*W);emit('extras','trim',bg);
      line('extras','trim',[tankp.clone().add(V(0,-.41*W,0)),p.clone().add(V(side*.30*W,-.60*W,0)),p.clone().add(V(side*.18*W,-.28*W,-.33*W))],.023*W);
    }
    const cog=gear(.24*W,.055*W);cog.rotateY(PI);cog.translate(p.x,p.y+.41*W,p.z-.28*W);emit('extras','trim',cog);ball('extras','gem',p.clone().add(V(0,.41*W,-.31*W)),.09*W);
    for(let i=0;i<3;i++){const q=P(outer.solid,.41,.62+i*.24,.12*W),vial=new THREE.CylinderGeometry(.058*W,.058*W,.25*W,24);vial.translate(...q.toArray());emit('belt','glass',vial);const liquid=new THREE.CylinderGeometry(.043*W,.043*W,.15*W,20);liquid.translate(q.x,q.y-.035*W,q.z);emit('belt','gem',liquid);const cap=new THREE.CylinderGeometry(.063*W,.063*W,.05*W,20);cap.translate(q.x,q.y+.15*W,q.z);emit('belt','trim',cap);}
    const hand=V(Wr.x+.14*W,Wr.y+.50*W,Wr.z+.12*W),orb=new THREE.IcosahedronGeometry(.14*W,1);orb.translate(...hand.toArray());emit('extras','gem',orb);
    for(let k=0;k<3;k++){const ring=new THREE.TorusGeometry(.25*W,.025*W,10,56);ring.rotateX(k*PI/3);ring.rotateY(k*PI/3);ring.translate(...hand.toArray());emit('extras','trim',ring);}
  }
  return true;
}
