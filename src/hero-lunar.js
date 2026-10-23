// Figurinos lunares: construção por peças, com silhueta e camadas próprias.
// Os campos do corpo são consultados somente para apoiar o tecido e evitar interseções.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {badge, buckleGeo, panel, ribbon, gear, tuft} from './detail.js';
import {crescent} from './lunar.js';
import {handPatch,shellCloth} from './fabric.js';
import {buildHeroBread} from './hero-bread.js';

export function buildHeroLunar(c) {
  if (buildHeroBread(c)) return true;
  if (!['lunar_explorer', 'lunar_inventor', 'lunar_guardian', 'lunar_ruby'].includes(c.style)) return false;
  const {style,body,B,J,W,Y,Lb,z0,yN,S,E,Wr,H,K,A,ySole,bf,onlySlot,garment,envelope,trousers,boots,beltOn,cape,rim,edgeTube,sleeveCuffs,surfAt,frontZ,backZ,limbR,limbWrap,button,addGeoS,add,clothSurface,tubeG,sph,orient,chainG,mirror,capeEmblem,clamp,sstep,lerp,V,PI}=c;
  const nico=style==='lunar_inventor',magic=style==='lunar_guardian'||style==='lunar_ruby',ruby=style==='lunar_ruby';
  const put=(slot,ch,g)=>addGeoS(slot,ch,g);
  const moved=(g,p)=>g.translate(p.x,p.y,p.z);
  const normalAt=p=>V(p.x,0,p.z-z0).normalize();
  const frontPanel=(fn,x,y,lift=.04*W)=>{
    let z=J.bounds.z1+W;
    for(let i=0;i<140;i++){const d=fn(x,y,z);if(d<.0005)break;z-=Math.max(.002*W,d*.85);if(z<z0-W)break}
    return V(x,y,z+lift);
  };
  const line=(slot,ch,points,r=.012*W)=>put(slot,ch,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),(points.length===2?1:points.length<=4?8:Math.max(12,Math.min(80,Math.ceil(points.length*1.25)))),r,6,false));
  function facetGem(slot,p,r=.09*W,ch='gem',axis=V(0,0,1)) {
    const seat=new THREE.TorusGeometry(r*.95,r*.12,10,32);put(slot,'trim',orient(seat,p,axis));
    const gem=new THREE.IcosahedronGeometry(r,0);gem.scale(.82,1.22,.43);put(slot,ch,orient(gem,p.clone().addScaledVector(axis,r*.08),axis));
    for(let i=0;i<4;i++){const a=(i+.5)*PI/2,q=p.clone().add(V(Math.cos(a)*r*.72,Math.sin(a)*r*.95,0));put(slot,'trim',sph(q,r*.12,1,1,1,12,8));}
  }
  function fittedPanel(slot,ch,fn,f0,f1,a0,a1,off=.105*W,tail=0) {
    const point=(t,u)=>{
      const a=lerp(a0,a1,u),y=Y(lerp(f0,f1,t))-tail*Math.sin(PI*u)*t**5;
      return surfAt(fn,y,a,off+.009*W*(.5+.5*Math.sin(u*PI*6))*Math.sin(PI*t));
    };
    put(slot,ch,clothSurface(40,24,point,{thickness:.024*W}));return point;
  }
  function edgeLines(slot,point,ch='trim',r=.012*W,all=true) {
    for(const u of [0,1])line(slot,ch,Array.from({length:49},(_,i)=>point(i/48,u)),r);
    if(all)for(const t of [0,1])line(slot,ch,Array.from({length:33},(_,i)=>point(t,i/32)),r);
  }
  function stitch(slot,point,t,columns=19,ch='trim') {
    for(let i=0;i<columns;i++){
      const u=(i+.5)/columns,p0=point(t,u-.006),p1=point(t,u+.006);line(slot,ch,[p0,p0.clone().lerp(p1,.5),p1],.0038*W);
    }
  }
  function surfaceStrap(slot,ch,fn,f0,f1,phi0,phi1,width=.13,off=.05*W) {
    const point=(t,u)=>surfAt(fn,Y(lerp(f0,f1,t)),lerp(phi0,phi1,t)+(u-.5)*width,off);
    put(slot,ch,clothSurface(56,8,point,{thickness:.027*W}));
    for(const u of [.08,.92])line(slot,'trim',Array.from({length:49},(_,i)=>point(i/48,u)),.004*W);
    return point;
  }
  function disc(slot,ch,p,r=.05*W,normal=V(0,0,1),depth=.025*W) {
    const g=new THREE.CylinderGeometry(r,r,depth,32);g.rotateX(PI/2);put(slot,ch,orient(g,p,normal));return p;
  }
  function toolBelt(fn,f=.34) {
    beltOn('Cinturao_lunar_estruturado','leather',fn,Y(f),.17*W,.055*W);
    const p=surfAt(fn,Y(f),0,.115*W),g=buckleGeo(.25*W,.19*W,.03*W);put('belt','trim',moved(g,p));
    line('belt','trim',[p.clone().add(V(-.09*W,0,.01*W)),p.clone(),p.clone().add(V(.085*W,0,.01*W))],.013*W);
    for(const side of [-1,1])for(let i=0;i<3;i++){
      const q=surfAt(fn,Y(f),side*(.42+i*.22),.095*W);put('belt','trim',orient(new THREE.TorusGeometry(.022*W,.005*W,7,14),q,normalAt(q)));
    }
  }
  function shoeSole(side,top,depth,ch) {
    const footLength=.105*Lb*(B.foot||1)*(.9+.1*W),x=side*A.x,heel=A.z-.27*footLength-.065*W,toe=A.z+.95*footLength+.09*W,ww=(nico?.19:.22)*footLength+(nico?.085:.095)*W,length=toe-heel;
    const s=new THREE.Shape();s.moveTo(-ww*.7,heel);s.bezierCurveTo(-ww,heel-.04*W,-ww*1.05,heel+length*.35,-ww*.92,toe-.12*W);s.bezierCurveTo(-ww*.85,toe+.03*W,ww*.85,toe+.03*W,ww*.92,toe-.12*W);s.bezierCurveTo(ww*1.05,heel+length*.35,ww,heel-.04*W,ww*.7,heel);s.quadraticCurveTo(0,heel-.08*W,-ww*.7,heel);
    const geo=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:3,bevelSize:(nico?.025:.045)*W,bevelThickness:(nico?.012:.018)*W,curveSegments:24});geo.rotateX(PI/2);geo.translate(x,top,0);put('feet',ch,geo);
    return {x,toe,heel,ww,length};
  }
  function expeditionShoes() {
    if(!nico){nanaSneakers();return}
    boots('Tenis_tecnico_cabedal','leather',{t:.08*W,h:nico?.10:.075,cuffT:.07*W,toe:.08});
    for(const side of [-1,1]) {
      const foot=shoeSole(side,ySole+.08*W,.09*W,'sole');shoeSole(side,ySole+.17*W,.085*W,nico?'secondary':'pearl');
      const {x,toe,heel,ww}=foot;
      // Taloneira, biqueira e língua possuem relevo separado da sola.
      const cap=panel(ww*1.62,.13*W,.14*W);cap.rotateX(-.35);cap.translate(x,ySole+.23*W,toe-.09*W);put('feet',nico?'fabric':'secondary',cap);
      const tongue=panel(.23*W,.40*W,.05*W);tongue.rotateX(-.12);tongue.translate(x,A.y+.16*W,frontZ(x,A.y+.16*W)+.08*W);put('feet',nico?'fabric':'secondary',tongue);
      for(let i=0;i<4;i++) {
        const y=A.y+.08*W+i*.075*W,z=frontZ(x,y)+.115*W;
        for(const s of [-1,1])put('feet','trim',moved(new THREE.TorusGeometry(.021*W,.006*W,8,14),V(x+s*.10*W,y,z)));
        line('feet',nico?'secondary':'pearl',[V(x-.10*W,y,z),V(x,y+.025*W,z+.012*W),V(x+.10*W,y+.06*W,z)],.0085*W);
      }
      for(const s of [-1,1]) {
        const q=V(x+s*ww*.98,ySole+.18*W,lerp(heel,toe,.4));put('feet','gem',sph(q,.055*W,.65,.55,1.8,20,12));
        const heelTab=panel(.06*W,.19*W,.04*W);heelTab.translate(x+s*.08*W,A.y+.18*W,heel+.04*W);put('feet','trim',heelTab);
      }
      for(let j=0;j<6;j++){const yy=ySole+.015*W,zz=lerp(heel,toe,(j+.5)/6);line('feet','sole',[V(x-ww*.8,yy,zz),V(x,yy-.01*W,zz),V(x+ww*.8,yy,zz)],.013*W);}
    }
  }
  function nanaSneakers(){
    for(const side of [-1,1]){
      const foot=shoeSole(side,ySole+.075*W,.080*W,'sole');
      shoeSole(side,ySole+.19*W,.105*W,'pearl');
      const {x,heel,toe,ww}=foot;
      // Cabedal fechado com volume próprio, sem o cano de bota da versão anterior.
      const upper=new THREE.SphereGeometry(1,64,40),pos=upper.attributes.position;
      const point=(t,angle,lift=0)=>{
        const z=lerp(heel+.01*W,toe-.02*W,t),r=Math.sqrt(Math.max(0,1-(2*t-1)**8)),width=ww*.97*(.94+.06*Math.sin(PI*t));
        return V(x+Math.cos(angle)*(width+lift)*r,ySole+.185*W+(.30-.14*t)*W*r+Math.sin(angle)*((.30-.14*t)*W+lift)*r,z);
      };
      for(let i=0;i<pos.count;i++){
        const t=(pos.getZ(i)+1)/2,angle=Math.atan2(pos.getY(i),pos.getX(i)),p=point(t,angle);
        pos.setXYZ(i,p.x,p.y,p.z);
      }
      upper.computeVertexNormals();put('feet','leather',upper);
      const heelCounter=new RoundedBoxGeometry(.46*W,.46*W,.26*W,4,.065*W);heelCounter.translate(x,ySole+.39*W,heel+.11*W);put('feet','leather',heelCounter);
      const toeGuard=(t,u)=>point(lerp(.72,.97,t),u*PI,.014*W);
      put('feet','leather',clothSurface(20,40,toeGuard,{thickness:.018*W}));
      line('feet','leather',Array.from({length:41},(_,i)=>toeGuard(.04,i/40)),.012*W);
      // Língua e atacadores acompanham o peito do pé em vez de subir pela canela.
      const tongue=(t,u)=>{const p=point(lerp(.38,.77,t),PI/2,.020*W);p.x+=(u-.5)*.24*W;p.y+=.02*W*Math.sin(PI*u);return p};
      put('feet','leather',clothSurface(20,12,tongue,{thickness:.022*W}));
      for(let j=0;j<5;j++){
        const t=.46+j*.065,p=point(t,PI/2,.047*W),span=.13*W;
        for(const s of [-1,1]){
          const ring=new THREE.TorusGeometry(.018*W,.0045*W,8,20);ring.rotateX(-PI/2);ring.translate(p.x+s*span,p.y-.025*W,p.z);put('feet','trim',ring);
        }
        line('feet','secondary',[p.clone().add(V(-span,0,-.018*W)),p.clone().add(V(0,.025*W,.012*W)),p.clone().add(V(span,0,.026*W))],.009*W);
      }
      for(const flank of [-1,1]){
        const ph=flank<0?PI:.0,outline=Array.from({length:25},(_,i)=>point(.18+i/24*.57,ph,.015*W));
        line('feet','secondary',outline,.014*W);
        const blue=point(.28,ph,.035*W);put('feet','gem',sph(blue,.048*W,.7,.55,1.6,20,12));
      }
      const heelLoop=[point(.10,PI/2,.008*W),point(.12,PI/2,.09*W),point(.19,PI/2,.10*W),point(.24,PI/2,.012*W)];line('feet','secondary',heelLoop,.018*W);
      for(let j=0;j<8;j++){
        const z=lerp(heel,toe,(j+.5)/8),r=Math.sqrt(Math.max(0,1-((j+.5)/8*2-1)**2));
        line('feet','sole',[V(x-ww*.85*r,ySole+.008*W,z),V(x,ySole-.004*W,z),V(x+ww*.85*r,ySole+.008*W,z)],.012*W);
      }
    }
  }
  function armSleeve(side,ch,t0=.35,t1=.88,bell=.16*W) {
    const a=S.clone().lerp(E,t0),b=E.clone().lerp(Wr,t1),dir=b.clone().sub(a).normalize(),basis=V(0,0,1),other=dir.clone().cross(basis).normalize();
    const r0=limbR(a,dir)+.055*W,r1=limbR(b,dir)+bell;
    const point=(t,u)=>{
      const center=a.clone().lerp(b,t),ph=u*2*PI,r=lerp(r0,r1,t)+.026*W*Math.sin(ph*9+t*1.8)*Math.sin(PI*t);
      center.addScaledVector(basis,Math.cos(ph)*r).addScaledVector(other,Math.sin(ph)*r);center.x*=side;return center;
    };
    put('upper',ch,clothSurface(36,64,point,{closed:true,thickness:.025*W}));
    for(const t of [0,1])line('upper','trim',Array.from({length:97},(_,i)=>point(t,i/96)),.022*W);
    return point;
  }
  function backpack(fn,nico=false) {
    const yy=Y(nico?.18:.17),base=V(0,yy,backZ(0,yy)-.31*W),w=.97*W,h=1.13*W,d=.46*W;
    put('extras','leather',moved(new RoundedBoxGeometry(w,h,d,5,.105*W),base));
    const flap=clothSurface(28,36,(t,u)=>{
      const x=(u-.5)*w*1.05,y=base.y+h*.51-t*h*.40-.045*W*Math.sin(PI*u),z=base.z-d*.52-.045*W*Math.sin(PI*t);
      return V(x,y,z);
    },{thickness:.038*W});put('extras','fabric',flap);
    const loop=[base.clone().add(V(-.20*W,h*.46,0)),base.clone().add(V(-.16*W,h*.69,0)),base.clone().add(V(.16*W,h*.69,0)),base.clone().add(V(.20*W,h*.46,0))];line('extras','leather',loop,.043*W);
    const bagFront=base.z-d*.55;
    for(const side of [-1,1]) {
      const xp=side*.24*W;
      line('extras','leather',[V(xp,base.y+h*.42,bagFront-.045*W),V(xp,base.y,bagFront-.05*W),V(xp,base.y-h*.49,bagFront)],.034*W);
      const buckle=buckleGeo(.115*W,.13*W,.02*W);buckle.rotateY(PI);buckle.translate(xp,base.y+.075*W,bagFront-.06*W);put('extras','trim',buckle);
      for(let i=0;i<7;i++)put('extras','trim',sph(V(xp,base.y-.07*W-i*.047*W,bagFront-.08*W),.009*W,1,1,.4,10,6));
      surfaceStrap('extras','leather',fn,.025,nico?.315:.235,side*.47,side*.6,.15,.055*W);
      // Bolsos laterais, aba, duas costuras e tampas, sem caixas soltas.
      const p=base.clone().add(V(side*.55*W,-.14*W,.015*W)),po=panel(.29*W,.48*W,.26*W);po.translate(...p.toArray());put('extras','leather',po);
      const lid=panel(.31*W,.17*W,.075*W);lid.translate(p.x,p.y+.15*W,p.z-.145*W);put('extras','fabric',lid);
      const rivet=sph(p.clone().add(V(0,.10*W,-.20*W)),.027*W,1,1,.45);put('extras','trim',rivet);
    }
    const moon=crescent(.18*W,.025*W);moon.rotateY(PI);moon.translate(base.x,base.y+.25*W,bagFront-.095*W);put('extras','trim',moon);
    // Ferramentas presas no quadro: cilindros, engrenagens, fita e frasco luminoso.
    const cylinder=new THREE.CylinderGeometry(.105*W,.105*W,.80*W,32);cylinder.translate(-.62*W,base.y+.17*W,base.z);put('extras','trim',cylinder);
    const core=new THREE.CylinderGeometry(.085*W,.085*W,.52*W,28);core.translate(-.62*W,base.y+.17*W,base.z-.025*W);put('extras','gem',core);
    for(const dy of [-.38,.38])put('extras','leather',moved(new THREE.TorusGeometry(.115*W,.025*W,10,24).rotateX(PI/2),V(-.62*W,base.y+.17*W+dy*W,base.z)));
    const roll=new THREE.CylinderGeometry(.11*W,.11*W,.79*W,32);roll.translate(.62*W,base.y+.27*W,base.z);put('extras','secondary',roll);
    for(let i=0;i<3;i++)line('extras','leather',[V(.51*W,base.y+.04*W+i*.18*W,base.z),V(.62*W,base.y+.04*W+i*.18*W,base.z-.13*W),V(.73*W,base.y+.04*W+i*.18*W,base.z)],.019*W);
    for(const side of [-1,1]){
      const cog=gear(.10*W,.035*W);cog.rotateY(PI);cog.translate(side*.33*W,base.y-.37*W,bagFront-.03*W);put('extras','trim',cog);
      const seam=[];for(let i=0;i<=14;i++)seam.push(V(side*.445*W,base.y-h*.39+i/14*h*.63,bagFront+.01*W));line('extras','trim',seam,.005*W);
    }
    return base;
  }
  function cargoPockets(legs,nico=false) {
    for(const side of [-1,1]) {
      const f=nico?.49:.50,yy=Y(f),cx=side*lerp(H.x,K.x,clamp((f-.43)/(.70-.43),0,1)),p=surfAt(legs,yy,side*.70,.11*W,cx),width=(nico?.37:.56)*W,height=(nico?.45:.67)*W;
      const normal=V(side*.22,0,1).normalize();
      put('lower',nico?'fabric':'leather',orient(panel(width,height,.11*W),p,normal));
      put('lower',nico?'leather':'fabric',orient(panel(width*1.08,height*.31,.045*W),p.clone().add(V(0,height*.33,0)).addScaledVector(normal,.07*W),normal));
      for(const s of [-1,1])disc('lower','trim',p.clone().add(V(s*width*.29,height*.28,.105*W)),.021*W);
      for(const offset of [-.35,.35])line('lower','trim',[p.clone().add(V(offset*width,-height*.35,.065*W)),p.clone().add(V(offset*width,0,.065*W)),p.clone().add(V(offset*width,height*.30,.065*W))],.0045*W);
    }
  }
  if (!magic) {
    const shirt=garment(nico?'Camisa_inventor_manga_dobrada':'Top_curto_lunar',nico?'secondary':'fabric','upper',{
      top:nico?yN+.035:Y(.065),bottom:Y(nico?.345:.24),t:.045*W,sleeve:nico?'short':null,short:.86,sleeveEase:(nico?.040:.075)*W,puff:nico?.050*W:0,vneck:nico?.13*W:0,cell:.020*clamp(W,1,1.3),
      env:{ease:.055*W,hang:.5,cinch:Y(.30),cinchK:.9,folds:.012*W,foldN:10}
    });
    let coat=shirt;
    if(!nico) {
      coat=garment('Jaqueta_curta_lunar_recortada','leather','upper',{
        top:yN-.04*W,bottom:Y(.245),t:.065*W,sleeve:'forearm',sleeveEase:.10*W,puff:.14*W,open:.34,openTaper:1.1,hollow:true,over:shirt.solid,overGap:.055*W,
        env:{ease:.095*W,hang:.5,cinch:Y(.245),cinchK:.88,folds:.022*W,foldN:9},cell:.020*clamp(W,1,1.3)
      });
      edgeTube(coat,'open','trim','upper',.017*W);sleeveCuffs(coat,'upper','leather',.12*W);
      // Gola alta aberta e lapelas: painéis largos dobrados, não um tubo dourado.
      for(const side of [-1,1]) {
        const collar=(t,u)=>{const ph=side*lerp(.43,PI,u),p=surfAt(coat.env,yN-.25*W+t*.52*W,ph,.115*W);p.y+=.035*W*Math.sin(PI*u);return p;};
        put('upper','leather',clothSurface(24,40,collar,{thickness:.035*W}));edgeLines('upper',collar,'leather',.011*W);
        const lapel=(t,u)=>surfAt(coat.solid,Y(.055+t*.12),side*(.29+u*(.25-.16*t)),.055*W+.055*W*Math.sin(PI*u));
        put('upper','leather',clothSurface(24,16,lapel,{thickness:.025*W}));edgeLines('upper',lapel,'leather',.008*W,false);
        const bottom=fittedPanel('upper','leather',coat.env,.225,.245,side*.35,side*1.4,.05*W);stitch('upper',bottom,.8,19,'trim');
        const pk=surfAt(coat.solid,Y(.22),side*.75,.07*W);put('upper','leather',orient(panel(.28*W,.19*W,.045*W),pk,normalAt(pk)));disc('upper','trim',pk.clone().add(V(0,.035*W,.035*W)),.022*W);
      }
      const moon=crescent(.15*W,.022*W),mp=surfAt(shirt.env,Y(.16),0,.055*W);moon.translate(...mp.toArray());put('upper','trim',moon);
      // Relógio, luvas e pequenas placas de punho.
      if(!onlySlot||onlySlot==='extras')add('Luvas_de_exploracao',handPatch(body,0,.028*W),'leather','extras');
      for(const side of [-1,1]) {
        const p=Wr.clone().lerp(E,.18);p.x*=side;p.z+=limbR(Wr.clone().lerp(E,.18),Wr.clone().sub(E).normalize())+.08*W;
        put('extras','trim',moved(panel(.23*W,.24*W,.075*W),p));put('extras','gem',moved(panel(.16*W,.17*W,.025*W),p.clone().add(V(0,0,.055*W))));
        for(let i=0;i<3;i++)line('extras','trim',[p.clone().add(V(-.055*W,-.04*W+i*.035*W,.075*W)),p.clone().add(V(.055*W,-.04*W+i*.035*W,.075*W))],.004*W);
      }
    } else {
      sleeveCuffs(shirt,'upper','secondary',.12*W);
      if(!onlySlot||onlySlot==='extras'){
        const source=handPatch(body,0,.026*W),dir=Wr.clone().sub(E).normalize(),length=.095*Lb*B.hand*(.85+.15*W);
        // O corte termina na base dos dedos: a luva cobre a palma, sem esconder as pontas.
        const glove=shellCloth(source,(x,y,z)=>(Math.abs(x)-Wr.x)*dir.x+(y-Wr.y)*dir.y+(z-Wr.z)*dir.z-length*.55,.012*W);
        source.dispose();put('extras','leather',glove);
      }
      // O peitoral é uma superfície contínua curvada e não uma placa plana sobre a camisa.
      const bib=(t,u)=>{const yy=Y(lerp(.085,.35,t)),xx=(u-.5)*W*(.90+.18*t),p=frontPanel(shirt.env,xx,yy,.065*W);p.y-=.025*W*Math.sin(PI*u)*(1-t);return p;};
      put('upper','fabric',clothSurface(48,40,bib,{thickness:.032*W}));edgeLines('upper',bib,'fabric',.012*W);stitch('upper',bib,.045,23,'trim');
      for(const side of [-1,1]) {
        const strap=surfaceStrap('upper','fabric',shirt.env,.012,.125,side*.48,side*.52,.28,.095*W);disc('upper','trim',strap(.94,.5).add(V(0,0,.012*W)),.045*W);
        surfaceStrap('upper','fabric',shirt.env,.012,.34,side*(PI-.42),side*(PI-.70),.28,.065*W);
        const shape=new THREE.Shape();shape.moveTo(side*.06*W,-.02*W);shape.lineTo(side*.32*W,-.04*W);shape.lineTo(side*.22*W,-.30*W);shape.closePath();const collar=new THREE.ExtrudeGeometry(shape,{depth:.015*W,bevelEnabled:true,bevelSize:.005*W,bevelThickness:.005*W,bevelSegments:2});const cp=collar.attributes.position;for(let i=0;i<cp.count;i++){const q=frontPanel(shirt.env,cp.getX(i),yN+cp.getY(i),.035*W+cp.getZ(i));cp.setXYZ(i,q.x,q.y,q.z)}collar.computeVertexNormals();put('upper','secondary',collar);
      }
      const pocket=fittedPanel('upper','fabric',shirt.env,.205,.29,-.34,.34,.085*W);edgeLines('upper',pocket,'secondary',.007*W);stitch('upper',pocket,.05,13,'trim');
      for(let i=0;i<3;i++) {
        const pp=pocket(.2,.25+i*.24);line('upper',i===1?'accent':'trim',[pp.clone().add(V(0,-.03*W,.01*W)),pp.clone().add(V(0,.12*W,.01*W)),pp.clone().add(V(.015*W,.15*W,.01*W))],.011*W);
      }
    }
    const legs=trousers(nico?'Jardineira_calcas_com_folga':'Cargo_bombacha_com_pregas','pants',{
      top:nico?.33:.32,ease:(nico?.075:.16)*W,cuff:nico?.065:.045,puff:(nico?.065:.18)*W,flareLeg:(nico?.025:.055)*W,folds:(nico?.025:.040)*W,t:.05*W,cell:.023*clamp(W,1,1.3),
      under:nico?{fn:shirt.solid,y:Y(.345)+.03*W}:undefined
    });
    cargoPockets(legs,nico);expeditionShoes();
    for(const side of [-1,1]){
      const cy=A.y+(nico?.067:.047)*Lb,dir=K.clone().sub(A).normalize(),r=limbR(A.clone().lerp(K,.15),dir)+(nico?.12:.16)*W,center=V(side*A.x,cy,A.z);
      const cuff=(t,u)=>V(center.x+Math.sin(2*PI*u)*(r+.012*W*Math.sin(PI*t)),cy+(t-.5)*.14*W,center.z+Math.cos(2*PI*u)*(r+.012*W*Math.sin(PI*t)));
      put('lower',nico?'secondary':'pants',clothSurface(10,64,cuff,{closed:true,thickness:.035*W}));
      line('lower',nico?'fabric':'lining',Array.from({length:65},(_,i)=>cuff(.12,i/64)),.012*W);
    }
    const beltFn=(x,y,z)=>Math.min(y>=Y(.345)?shirt.env(x,y,z):legs(x,y,z),bf(x,y,z)-.045*W);toolBelt(beltFn);
    const pack=backpack(coat.env,nico);
    for(const side of [-1,1]) {
      const p=surfAt(legs,Y(.39),side*.62,.09*W,side*H.x),po=panel(.24*W,.35*W,.15*W);po.translate(...p.toArray());put('belt','leather',po);
      const flap=panel(.26*W,.10*W,.04*W);flap.translate(p.x,p.y+.12*W,p.z+.09*W);put('belt','leather',flap);disc('belt','trim',p.clone().add(V(0,.10*W,.12*W)),.025*W);
      if(nico)for(let i=0;i<3;i++) {
        const q=p.clone().add(V((i-1)*.07*W,.10*W,.13*W));line('belt','trim',[q.clone().add(V(0,-.15*W,0)),q,q.clone().add(V(0,.22*W,.015*W))],.015*W);put('belt',i===1?'accent':'leather',sph(q.clone().add(V(0,.24*W,.015*W)),.033*W,.75,1.8,.75));
      }
    }
    if(nico){
      // Chave inglesa aberta e rolo de projeto na mochila.
      const p=pack.clone().add(V(.53*W,-.28*W,-.31*W));line('extras','trim',[p.clone().add(V(0,-.35*W,0)),p.clone().add(V(0,.15*W,0))],.035*W);
      const wrench=new THREE.TorusGeometry(.105*W,.035*W,8,24,PI*1.55);wrench.rotateZ(-.28);wrench.translate(p.x,p.y+.21*W,p.z);put('extras','trim',wrench);
    }
    return true;
  }

  // Corpetes com decote coração e ombro descoberto, sustentados pela envoltória do busto.
  const top=Y(.10),waist=Y(.345),hem=ySole+.07*W;
  const bodice=garment(ruby?'Corpete_rubi_decote_coracao':'Corpete_lua_decote_coracao','fabric','upper',{
    top,bottom:waist,t:.05*W,sleeve:null,cell:.026*clamp(W,1,1.3),
    edge:(ax,y,z)=>(.105*W*Math.exp(-(((ax/W-.33)/.22)**2))-.075*W*Math.exp(-((ax/(.14*W))**2)))*sstep(z0,z0+.22*W,z),
    env:{ease:.055*W,hang:.65,cinch:Y(.32),cinchK:.95,folds:.01*W,foldN:12}
  });
  const skirt=garment(ruby?'Saia_rubi_caimento_longo':'Saia_guardia_caimento_longo','fabric','lower',{
    top:Y(.333),bottom:hem,t:.05*W,cell:.035*clamp(W,1,1.3),
    env:{ease:.065*W,hang:.06,flareFrom:Y(.42),flare:.34,folds:.075*W,foldN:15,foldTwist:1.2,back:.045,smooth:14}
  });
  const support=(x,y,z)=>y>Y(.335)?bodice.env(x,y,z):skirt.env(x,y,z);
  const cloakSupport=(x,y,z)=>support(x,y,z)-(y>Y(.335)?.12:.26)*W;
  // O decote segue explicitamente os dois arcos do coração e suas costas.
  const neckline=[];
  for(let i=0;i<=128;i++) {
    const a=-PI+2*PI*i/128,ax=Math.abs(Math.sin(a)*.70*W),yy=top+(.105*W*Math.exp(-(((ax/W-.33)/.22)**2))-.075*W*Math.exp(-((ax/(.14*W))**2)))*Math.max(0,Math.cos(a))**2;
    neckline.push(surfAt(bodice.env,yy,a,.035*W));
  }
  line('upper','trim',neckline,.020*W);
  for(const side of [-1,1]) {
    for(const ph of [side*.39,side*.84]){
      const seam=[];for(let i=0;i<=45;i++){const t=i/45;seam.push(surfAt(bodice.env,lerp(top-.04*W,waist,t),ph*(1-.28*Math.sin(PI*t)),.042*W));}line('upper','trim',seam,.009*W);
    }
    const panelPoint=fittedPanel('upper','secondary',bodice.outer,.12,.335,side*.54,side*.93,.095*W);edgeLines('upper',panelPoint,'trim',.009*W,false);
    armSleeve(side,ruby?'accent':'fabric',.28,.86,.21*W);
    const q=E.clone().lerp(Wr,.79);q.x*=side;q.z+=limbR(E.clone().lerp(Wr,.79),Wr.clone().sub(E).normalize())+.07*W;
    put('upper','trim',moved(panel(.24*W,.37*W,.045*W),q));facetGem('upper',q.clone().add(V(0,.01*W,.05*W)),.06*W);
    // Ombreira em medalhão e duas fitas que assentam no início da capa.
    const shoulder=V(side*S.x*.73,S.y+.10*W,S.z+.11*W);disc('cape','trim',shoulder,.115*W,V(side*.18,.15,1).normalize(),.045*W);facetGem('cape',shoulder.clone().add(V(0,0,.035*W)),.064*W);
  }
  // Saias com painéis abertos, bordas duplas e sobreposição visível entre cores.
  for(const side of [-1,1])for(const [a,b,fEnd,channel] of [[.31,.97,.965,'accent'],[.95,1.65,.91,'secondary'],[1.63,2.40,.965,'accent']]) {
    const p=fittedPanel('lower',channel,skirt.env,.347,fEnd,side*a,side*b,.105*W+.065*W*a,.12*W);
    edgeLines('lower',p,'trim',.013*W);stitch('lower',p,.96,21,'trim');
    for(let i=0;i<4;i++) {
      const t=.25+i*.17,u=.5,pt=p(t,u),g=crescent((i%2?.045:.065)*W,.015*W);g.rotateZ(side*.5);put('lower','trim',orient(g,pt.clone().addScaledVector(normalAt(pt),.02*W),normalAt(pt)));
    }
  }
  rim('lower','trim',skirt.env,hem+.015*W,.024*W);
  beltOn('Cinto_crescente_corselet','trim',bodice.env,Y(.334),.10*W,.045*W);
  const waistPoint=(t,u)=>surfAt(support,Y(.31+.06*t),lerp(-.89,.89,u),.08*W+.015*W*Math.sin(PI*t));
  put('belt','leather',clothSurface(18,64,waistPoint,{thickness:.035*W}));
  for(const t of [0,1])line('belt','trim',Array.from({length:65},(_,i)=>waistPoint(t,i/64)),.018*W);
  const moonP=surfAt(support,Y(.336),0,.145*W),moon=crescent(.17*W,.028*W);moon.rotateZ(-PI/2);moon.translate(...moonP.toArray());put('belt','trim',moon);facetGem('belt',moonP.clone().add(V(0,-.005*W,.025*W)),.075*W);
  for(const side of [-1,1]) {
    const chain=[];for(let i=0;i<=16;i++){const t=i/16;chain.push(surfAt(support,Y(.34+.045*Math.sin(PI*t)),side*(.18+t*1.3),.11*W));}put('belt','trim',chainG(chain,.018*W));
  }
  const cloak=cape(ruby?'Capa_manto_rubi_em_camadas':'Capa_manto_azul_em_camadas','accent',{
    top:.075,yBottom:hem-.02*W,span:4.65,flare:.56,pleats:13,over:cloakSupport,trim:'trim',refined:true,sway:ruby?.06*W:0
  });
  if(cloak) {
    const sideBand=(side)=>{const point=(t,u)=>{const edge=side<0?u*.045:1-u*.045,p=cloak.at(t,edge);return p.addScaledVector(normalAt(p),.065*W);};put('cape','secondary',clothSurface(64,12,point,{thickness:.018*W}));edgeLines('cape',point,'trim',.012*W);return point;};
    for(const side of [-1,1]) {
      const border=sideBand(side);
      for(let i=0;i<11;i++){const t=.12+i*.073,p=border(t,.5),g=crescent(.055*W,.014*W);g.rotateZ(side*(i%2?.6:-.6));put('cape','trim',orient(g,p.clone().addScaledVector(normalAt(p),.025*W),normalAt(p)));}
    }
    // Bordado central e constelação realmente projetados na superfície da capa.
    capeEmblem(cloak,crescent(.40*W,.025*W),.67,.5);
    capeEmblem(cloak,crescent(.20*W,.023*W),.20,.5);
    for(let row=0;row<5;row++)for(let col=0;col<7;col++){
      const t=.35+row*.115,u=.14+col*.12;if(Math.abs(u-.5)<.16&&Math.abs(t-.67)<.15)continue;
      capeEmblem(cloak,badge('star',(.020+.014*((row+col)%3))*W,.010*W),t+.01*Math.sin(col*7+row),u);
    }
    // Renda geométrica e franjas junto à barra, mantendo contorno fechado.
    for(let i=0;i<44;i++) {
      const u=(i+.5)/44,p=cloak.at(.996,u),q=p.clone().add(V(.012*W*Math.sin(i),-.075*W,0));line('cape','trim',[p,p.clone().lerp(q,.5).add(V(0,0,-.01*W)),q],.0065*W);
      if(i%4===0)put('cape','trim',sph(q,.015*W,1,1.6,1,12,8));
    }
  }
  // Véus dos braços: deixam os ombros livres e caem abaixo dos antebraços.
  for(const side of [-1,1]) {
    const p0=S.clone().lerp(E,.30),p1=E.clone().lerp(Wr,.76);
    const veil=(t,u)=>{const p=p0.clone().lerp(p1,u);p.y-=Math.sin(PI*u)*(.65*W*t+.42*W*t*t)+t*.16*W;p.z-=.16*W*Math.sin(PI*t)+.04*W*Math.sin(u*PI*9)*t;p.x*=side;return p;};
    put('cape','veil',clothSurface(40,64,veil,{thickness:.009*W}));
    for(const t of [0,1])line('cape','trim',Array.from({length:65},(_,i)=>veil(t,i/64)),.011*W);
    for(const u of [0,1])line('cape','trim',Array.from({length:41},(_,i)=>veil(i/40,u)),.009*W);
  }
  // Colar assentado no pescoço, com corrente verdadeira, pingente e gemas engastadas.
  const necklace=[];for(let i=0;i<=26;i++){const a=-1.25+2.5*i/26,y=Y(.043)-.09*W*Math.cos(a);necklace.push(surfAt(bf,y,a,.035*W));}put('extras','trim',chainG(necklace,.013*W));
  facetGem('extras',necklace[13].clone().add(V(0,-.09*W,.025*W)),.066*W);
  boots('Souliers_lunaires','leather',{t:.045*W,h:.055,toe:.04*W});
  for(const side of [-1,1]){shoeSole(side,ySole+.055*W,.06*W,'sole');const p=V(side*A.x,ySole+.20*W,frontZ(side*A.x,ySole+.20*W)+.04*W);put('feet','trim',moved(buckleGeo(.13*W,.09*W,.016*W),p));}
  // Cajado de crescente vazado e orbe, com entrelaços dourados e anéis engastados.
  const staffX=Wr.x+.27*W,staffZ=Wr.z+.20*W,staffTop=yN+.67*W,staffBottom=ySole+.03*W;
  line('extras','leather',[V(staffX,staffBottom,staffZ),V(staffX-.025*W,Y(.45),staffZ),V(staffX,staffTop,staffZ)],.043*W);
  for(let i=0;i<7;i++){
    const y=lerp(staffBottom+.15*W,staffTop-.13*W,i/6),g=new THREE.TorusGeometry(.049*W,.014*W,8,24);g.rotateX(PI/2);g.translate(staffX,y,staffZ);put('extras','trim',g);
  }
  const moonR=.42*W,moonG=crescent(moonR,.05*W);moonG.rotateZ(-.18);moonG.translate(staffX,staffTop+.25*W,staffZ);put('extras','trim',moonG);
  const orbPos=V(staffX+.085*W,staffTop+.26*W,staffZ+.02*W);put('extras','gem',sph(orbPos,.205*W,1,1,1,40,24));
  for(const tilt of [-.55,.55]){
    const ring=new THREE.TorusGeometry(.245*W,.009*W,8,64);ring.rotateX(tilt);ring.translate(...orbPos.toArray());put('extras','trim',ring);
  }
  for(let i=0;i<5;i++){
    const a=i*2*PI/5,p=orbPos.clone().add(V(Math.cos(a)*.235*W,Math.sin(a)*.235*W,.04*W));put('extras','trim',sph(p,.018*W,1,1,1,12,8));
  }
  return true;
}
