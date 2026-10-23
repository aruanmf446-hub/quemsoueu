// Padeiro e vigilante: peças sobrepostas com modelagem própria, pregas e bordados geométricos.
// Só consulta o corpo. Os canais e slots continuam independentes e exportáveis.
import * as THREE from 'three';
import {panel,buckleGeo,tuft,badge} from './detail.js';
import {handPatch} from './fabric.js';

export function buildHeroBread(c){
  const {style,body,B,J,W,Y,Lb,z0,yN,S,E,Wr,H,K,A,ySole,bf,garment,envelope,trousers,boots,beltOn,cape,rim,edgeTube,sleeveCuffs,surfAt,frontZ,backZ,limbR,limbWrap,button,addGeoS,clothSurface,tubeG,sph,orient,chainG,V,PI,clamp,sstep,lerp}=c;
  const baker=style==='bread_baker',watch=style==='bread_vigilante';
  if(!baker&&!watch)return false;
  const emit=(slot,ch,g)=>addGeoS(slot,ch,g),dF=Wr.clone().sub(E).normalize();
  const column=(fn,x,y,lift=.03*W)=>{
    let z=J.bounds.z1+W;
    for(let i=0;i<140;i++){const d=fn(x,y,z);if(d<.001)break;z-=Math.max(.003*W,d*.83);if(z<z0-W)break}
    return V(x,y,z+lift);
  };
  // Os frisos são pequenos na tela: tangentes cúbicas mantêm a curva sem quadruplicar cada amostra.
  const line=(slot,ch,points,r=.009*W)=>emit(slot,ch,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),points.length===2?1:Math.max(points.length<5?4:16,Math.ceil(points.length*1.25)),r,r<.005*W?4:6,false));
  const strap=(points,width)=>{
    const curve=new THREE.CatmullRomCurve3(points),frames=curve.computeFrenetFrames(40,false);
    return clothSurface(40,4,(t,u)=>curve.getPoint(t).addScaledVector(frames.normals[Math.round(t*40)],(u-.5)*width),{thickness:.022*W});
  };
  function ring(slot,ch,a,b,t,width,offset=.055*W){
    const axis=b.clone().sub(a).normalize(),center=a.clone().lerp(b,t),u=V(0,0,1).cross(axis).normalize(),v=axis.clone().cross(u),r=limbR(center,axis)+offset;
    const point=(q,s)=>center.clone().addScaledVector(axis,(q-.5)*width).addScaledVector(u,Math.cos(s*2*PI)*r).addScaledVector(v,Math.sin(s*2*PI)*r);
    for(const side of [-1,1])emit(slot,ch,clothSurface(5,40,(q,s)=>{const p=point(q,s);p.x*=side;return p},{closed:true,thickness:.018*W}));
    return {center,axis,r};
  }
  function placard(slot,ch,fn,f0,f1,ph,width,rag=.025*W,lift=.06*W){
    const point=(t,u)=>{
      const a=ph+(u-.5)*width*(1+.13*t),y=lerp(Y(f0),Y(f1),t)+rag*(.5+.5*Math.cos(u*PI*9))*t**7;
      const p=surfAt(fn,y,a,lift+.022*W*Math.sin(u*PI*8+.8*t)*Math.sin(PI*t));return p;
    };
    emit(slot,ch,clothSurface(36,24,point,{thickness:.024*W}));
    for(const u of [0,1])line(slot,baker?'accent':'trim',Array.from({length:37},(_,i)=>point(i/36,u)),.010*W);
    line(slot,baker?'accent':'trim',Array.from({length:43},(_,i)=>point(.985,i/42)),.012*W);
    return point;
  }
  function stitchedPanel(slot,ch,fn,f0,f1,ph,width,lift=.12*W){
    const p=placard(slot,ch,fn,f0,f1,ph,width,0,lift);
    for(const u of [.065,.935])for(let i=0;i<20;i++){const t=.04+i*.045;line(slot,'trim',[p(t,u),p(t+.018,u)],.0038*W)}return p;
  }
  function wheat(slot,point,size=.18*W){
    const center=point(.5,.5),up=point(.2,.5).sub(point(.8,.5)).normalize(),right=point(.5,.8).sub(point(.5,.2)).normalize(),normal=right.clone().cross(up).normalize();
    if(normal.z<0)normal.negate();const at=(x,y)=>center.clone().addScaledVector(right,x).addScaledVector(up,y).addScaledVector(normal,.018*W);
    line(slot,'accent',[at(0,-size),at(0,size)],.009*W);
    for(let i=0;i<4;i++)for(const side of [-1,1]){
      const a=at(0,size*(-.55+i*.38)),b=at(side*size*.30,size*(-.25+i*.38));emit(slot,'accent',tuft(a,b,size*.12,size*.045,0));
    }
  }
  function leatherPouch(fn,f,phi,width=.24*W,height=.28*W,slot='belt'){
    const p=surfAt(fn,Y(f),phi,.12*W),n=V(Math.sin(phi),0,Math.cos(phi));
    emit(slot,'leather',orient(panel(width,height,.13*W),p,n));
    emit(slot,watch?'secondary':'leather',orient(panel(width*1.03,height*.37,.045*W),p.clone().add(V(0,height*.25,0)).addScaledVector(n,.085*W),n));
    emit(slot,'trim',orient(buckleGeo(width*.35,height*.24,.015*W),p.clone().addScaledVector(n,.12*W),n));
    for(const side of [-1,1]){
      const pts=[];for(let i=0;i<=12;i++)pts.push(p.clone().add(V(side*width*.42,lerp(-height*.4,height*.35,i/12),0)).addScaledVector(n,.085*W));line(slot,baker?'secondary':'trim',pts,.004*W);
    }
  }
  // A camisa termina dentro da faixa; as mangas têm volume no bíceps e punho dobrado próprio.
  // No vigilante, a gola interna sobe até o ombro e fecha a fresta sob a sobrecasaca aberta,
  // inclusive no corpo magro; acompanha a mesma subida no acabamento, sem mudar o padeiro.
  const shirt=garment(baker?'Camisa_padeiro_pregueada':'Camisa_vigilante','fabric','upper',{
    top:yN+(watch?.11*W:.045),bottom:Y(.395),t:.045*W,cell:.022*clamp(W,1,1.25),sleeve:'short',short:1,sleeveEase:.07*W,puff:(baker?.14:.08)*W,bell:.006*W,vneck:baker?.065:.10,
    env:{ease:.045*W,hang:.42,cinch:Y(.33),cinchK:.92,flareFrom:Y(.34),flare:.055,folds:.018*W,foldN:17}
  });
  sleeveCuffs(shirt,'upper',baker?'secondary':'accent',.095*W);
  // Três voltas irregulares deixam a dobra da manga ter leitura de tecido enrolado.
  if(baker)for(let i=0;i<3;i++)ring('upper',i%2?'fabric':'secondary',S,E,.92+i*.028,.040*W,.075*W+i*.004*W);
  rim('upper',baker?'secondary':'trim',shirt.outer,a=>yN+(watch?.09*W:.025)-.065*Math.max(0,Math.cos(a))**6,.018*W);
  if(baker){
    for(const side of [-1,1]){
      const point=(t,u)=>{const x=side*(.055+.26*u)*W,y=lerp(yN+.03,Y(.095),t)+.11*W*u*(1-t);const p=column(shirt.solid,x,y,.045*W);p.z+=.035*W*Math.sin(PI*t);return p};
      emit('upper','secondary',clothSurface(22,18,point,{thickness:.025*W}));
      line('upper','trim',Array.from({length:23},(_,i)=>point(i/22,.92)),.006*W);
      for(let i=0;i<5;i++)button('upper','trim',shirt.solid,side*.115*W,Y(.10+i*.044),.027*W);
    }
  }
  // Bombacha: pernas largas apoiadas no quadril, reunidas no cano da bota; cada vinco tem largura e sombra próprias.
  const legField=trousers(baker?'Bombacha_do_forno':'Calca_de_vigia','pants',{
    top:.33,ease:.10*W,puff:(baker?.21:.14)*W,cuff:.13,knee:.04*W,t:.05*W,cell:.025*clamp(W,1,1.25),under:{fn:shirt.solid,y:Y(.395)+.025*W}
  });
  for(const side of [-1,1]){
    // Bainhas/pregas pequenas são projetadas na própria superfície da perna, acima da bota.
    const start=H.clone().lerp(K,.10),end=K.clone().lerp(A,.77),dir=end.clone().sub(start).normalize(),u=V(0,0,1).cross(dir).normalize(),v=dir.clone().cross(u);
    for(let j=0;j<7;j++){
      const a=(j/7)*2*PI,pts=[];
      for(let i=0;i<=24;i++){
        const t=i/24,p=start.clone().lerp(end,t),axisPoint=p.clone(),normal=u.clone().multiplyScalar(Math.cos(a)).addScaledVector(v,Math.sin(a));
        let r=limbR(p,dir)+.17*W+(baker?.07:.025)*W*Math.sin(PI*t);
        for(let q=0;q<70;q++){const z=axisPoint.clone().addScaledVector(normal,r),d=legField(z.x,z.y,z.z);if(d<.002)break;r-=Math.max(d*.8,.002*W);if(r<.02)break}
        p.addScaledVector(normal,r+.009*W+.006*W*Math.sin(t*PI*6+j));p.x*=side;pts.push(p);
      }
      // Poucos vincos suaves; nada de listras grossas ou tubos flutuando.
      line('lower',j%2?'pants':baker?'secondary':'lining',pts,.006*W);
    }
  }
  boots('Botas_couro_costurado','leather',{t:.075*W,h:.21,cuffT:.06*W,toe:.025*W,cell:.037*clamp(W,1,1.25)});
  for(const side of [-1,1]){
    const x=side*A.x,yTop=A.y+.21*Lb;
    const footLength=.105*Lb*(B.foot||1)*(.9+.1*W),sole=new THREE.CylinderGeometry(1,1,.095*W,64);sole.scale(.19*footLength+.08*W,1,.61*footLength+.09*W);sole.translate(x,ySole+.015*W,A.z+.34*footLength+.01*W);emit('feet','sole',sole);
    for(const t of [.16,.48,.79]){
      const y=lerp(A.y+.10*W,yTop-.07*W,t),r=limbR(V(A.x,y,A.z),V(0,1,0))+.095*W;
      const p=V(x,y,Math.max(frontZ(x,y),A.z+r)+.025*W),g=buckleGeo(.13*W,.10*W,.016*W);g.translate(...p.toArray());emit('feet','trim',g);
      const band=clothSurface(4,40,(v,u)=>{const a=u*2*PI;return V(x+Math.sin(a)*r,y+(v-.5)*.060*W,A.z+Math.cos(a)*r)},{closed:true,thickness:.018*W});emit('feet','leather',band);
    }
    for(let i=0;i<5;i++){
      const y=A.y+.035*W+i*.055*W,z=frontZ(x,y)+.10*W;
      line('feet',baker?'secondary':'trim',[V(x-.085*W,y,z),V(x,y-.026*W,z+.008*W),V(x+.085*W,y,z)],.007*W);
    }
  }
  const waistEnv=envelope(Y(.31),Y(.73),{ease:.09*W,hang:.32,cinch:Y(.33),cinchK:.8,flareFrom:Y(.37),flare:.035,folds:.02*W,foldN:15});
  const waistBase=(x,y,z)=>Math.min(shirt.solid(x,y,z),waistEnv(x,y,z));
  // A bombacha tem mais volume que o contorno do quadril: o avental apoia sobre ambas as camadas.
  // Abaixo da camisa não se usa seu campo irrestrito, que também contém braços e mãos.
  const apronSupport=(x,y,z)=>Math.min(waistEnv(x,y,z),legField(x,y,z)-.035*W,y>=Y(.395)?shirt.outer(x,y,z)-.035*W:1000);
  beltOn(baker?'Faixa_laranja_sobreposta':'Cinturao_de_vigia',baker?'accent':'leather',waistBase,Y(.338),baker?.22*W:.15*W,.04*W,{tilt:baker?.025:0});
  // Pontas da faixa com largura real, nó volumoso e pequenas franjas.
  const knot=surfAt(waistBase,Y(.34),baker?-.56:.42,(baker?.27:.30)*W);emit('belt',baker?'accent':'leather',sph(knot,.105*W,1.20,.82,.7));
  for(let j=0;j<2;j++){
    const point=(t,u)=>{const y=knot.y-t*(j?.68:.89)*W,x=knot.x+(u-.5)*(.16-.04*t)*W+(j?-.13:.08)*W*t,z=column(apronSupport,x,y,(baker?.28:.34)*W).z+.025*W*Math.sin(t*PI*3);return V(x,y+.025*W*Math.sin(PI*u)*t**5,z)};
    emit('belt',baker?'accent':'lining',clothSurface(28,10,point,{thickness:.025*W}));
    for(let i=0;i<9;i++){const p=point(1,(i+.5)/9);line('belt','trim',[p,p.clone().add(V(.006*W,-.055*W,0))],.004*W)}
  }
  if(baker){
    // A referência tem avental preso à cintura; o peito deixa a camisa de botões visível.
    const front=placard('cape','secondary',apronSupport,.34,.71,0,1.40,.018*W,.19*W);
    const side=placard('cape','fabric',apronSupport,.345,.76,-.81,.43,.02*W,.12*W);
    wheat('cape',front,.24*W);wheat('cape',side,.13*W);
    // Bordado de losangos e dupla barra da referência.
    for(let i=0;i<11;i++){
      const u=.08+i*.082,a=front(.91,u),b=front(.94,u+.028),d=front(.97,u),e=front(.94,u-.028);line('cape','accent',[a,b,d,e,a],.007*W);
    }
    for(const t of [.86,.985])line('cape','accent',Array.from({length:45},(_,i)=>front(t,i/44)),.008*W);
    // Suspensórios planos: frente e cruzamento nas costas.
    for(const side of [-1,1]){
      const points=[];for(let i=0;i<=30;i++){
        const t=i/30,y=lerp(Y(.02),Y(.34),t),x=side*lerp(.43,.31,t)*W;points.push(column(shirt.solid,x,y,.16*W));
      }
      emit('upper','leather',strap(points,.055*W));
      const clasp=buckleGeo(.09*W,.13*W,.014*W);clasp.translate(...points[20].clone().add(V(0,0,.018*W)).toArray());emit('upper','trim',clasp);
      const back=[];for(let i=0;i<=30;i++){const t=i/30,y=lerp(Y(.015),Y(.34),t),p=surfAt(shirt.env,y,PI+side*(.53-1.06*t),.075*W);back.push(p)}emit('upper','leather',strap(back,.052*W));
    }
    leatherPouch(waistBase,.42,-.87,.27*W,.38*W);
    const toolBase=surfAt(waistBase,Y(.43),-.9,.18*W);
    for(let j=0;j<3;j++){
      const q=toolBase.clone().add(V((j-1)*.075*W,.23*W,.015*W));
      emit('extras','leather',sph(q,.027*W,1,4,1));
      if(j<2){const blade=panel(.045*W,.21*W,.015*W);blade.translate(q.x,q.y+.14*W,q.z);emit('extras','trim',blade)}
      else emit('extras','trim',sph(q.clone().add(V(0,.16*W,0)),.065*W,.55,1,.16));
    }
    // Pão modelado por lóbulos largos, cortes curvos e farinha clara nas cristas.
    const p=V(-Wr.x-.14*W,Wr.y-.14*W,Wr.z+.30*W);
    emit('extras','accent',sph(p,.31*W,1.24,.90,1,40,26));
    for(let j=-2;j<=2;j++){
      const x=j*.105*W,points=[];
      for(let i=0;i<=16;i++){const t=i/16,a=lerp(-.86,.86,t);points.push(p.clone().add(V(x+.05*W*Math.sin(a),Math.sin(a)*.22*W,Math.cos(a)*Math.sqrt(Math.max(.01,.30*.30-(x/W*.82)**2))*W+.012*W)))}
      line('extras','secondary',points,.016*W);
    }
    for(let i=0;i<20;i++){const a=i*2.3999,r=Math.sqrt((i+.5)/20)*.24*W;emit('extras','secondary',sph(p.clone().add(V(Math.cos(a)*r,Math.sin(a)*r*.68,.26*W)),.007*W,1,1,.45,8,6))}
  }else{
    // Sobrecasaca com frente aberta e cavas próprias sobre a camisa escura.
    const coat=garment('Sobrecasaca_assimetrica_vigilante','secondary','upper',{
      top:yN+.10,bottom:Y(.57),t:.07*W,cell:.023*clamp(W,1,1.25),sleeve:'short',short:.46,sleeveEase:.105*W,puff:.035*W,open:.22,openTaper:1.8,hollow:true,over:shirt.outer,overGap:.09*W,shoulderPad:.11,
      env:{ease:.075*W,hang:.35,cinch:Y(.33),cinchK:.92,flareFrom:Y(.37),flare:.20,folds:.025*W,foldN:13},hemCurve:.10*W
    });
    edgeTube(coat,'open','leather','upper',.014*W);sleeveCuffs(coat,'upper','leather',.06*W);
    const skirtSupport=(x,y,z)=>Math.min(waistEnv(x,y,z),legField(x,y,z)-.035*W,y>=Y(.57)-.03*W?coat.outer(x,y,z)-.035*W:1000);
    for(const side of [-1,1]){
      // As correias largas têm ferragens localizadas; não contornam o peito com tubos dourados.
      const tail=placard('lower','fabric',skirtSupport,.345,.68,side*.63,.57,.13*W,.14*W);stitchedPanel('lower','lining',skirtSupport,.35,.60,side*.88,.18,.21*W);
      for(let i=0;i<7;i++){
        const u=.10+i*.13,p=tail(.81,u),q=tail(.9,u+.05),r=tail(.96,u);line('lower','trim',[p,q,r],.006*W);
      }
      leatherPouch(waistBase,.40,side*.88,.22*W,.28*W);
      const p=surfAt(coat.solid,Y(.13),side*.77,.08*W);emit('upper','trim',orient(buckleGeo(.12*W,.15*W,.016*W),p,V(Math.sin(side*.77),0,Math.cos(side*.77))));
    }
    // Cachecol em camadas liga a máscara ao capuz e cobre a costura da gola.
    for(let layer=0;layer<3;layer++){
      const scarf=(t,u)=>{const ph=-PI+u*2*PI,y=yN+(.61-layer*.15)*W-t*.22*W-.07*W*Math.cos(ph),p=surfAt(shirt.env,y,ph,(.10+layer*.018)*W);p.z+=.025*W*Math.sin(ph*3+t*PI);return p};
      emit('upper','fabric',clothSurface(12,96,scarf,{closed:true,thickness:.025*W}));
    }
    // Painel central com ponta e dois recortes; o laranja aparece nas camadas de baixo.
    placard('lower','accent',skirtSupport,.34,.66,-.16,.33,.10*W,.085*W);
    const mantle=cape('Capa_manto_vigilante_desfiado','fabric',{top:.075,yBottom:Y(.89),span:3.85,flare:.24,pleats:13,ragged:.14*W,over:(x,y,z)=>Math.min(coat.env(x,y,z),shirt.env(x,y,z)-.15*W),trim:'trim',refined:true});
    if(mantle){
      for(const side of [-1,1]){
        const edge=[];for(let i=0;i<=40;i++){const p=mantle.at(i/40,side<0?.035:.965),n=V(p.x,0,p.z-z0).normalize();edge.push(p.addScaledVector(n,.04*W))}line('cape','accent',edge,.025*W);
      }
    }
    limbWrap('Bracadeiras_vigia','leather',E,Wr,.25,.85,.065*W,{flare:.015*W});
    for(let i=0;i<3;i++)ring('extras',i===1?'trim':'leather',E,Wr,.37+i*.18,.06*W,.095*W);
    emit('extras','leather',handPatch(body,0,.035*W));
    // Correias cruzadas planas e fivelas, assentadas na camada externa.
    for(const side of [-1,1]){
      const pts=[];for(let i=0;i<=36;i++){const t=i/36,y=lerp(Y(.075),Y(.335),t),phi=side*lerp(.73,.48,t);pts.push(surfAt(coat.solid,y,phi,.21*W))}emit('upper','leather',strap(pts,.105*W));
      const g=buckleGeo(.13*W,.15*W,.017*W);g.rotateZ(side*.55);g.translate(...pts[12].clone().add(V(0,0,.025*W)).toArray());emit('upper','trim',g);
    }
    const crest=badge('flame',.12*W,.022*W),p=surfAt(shirt.solid,Y(.15),0,.11*W);crest.translate(...p.toArray());emit('extras','trim',crest);
    const gem=new THREE.OctahedronGeometry(.10*W);gem.scale(.65,1.5,.45);gem.translate(p.x,p.y,p.z+.05*W);emit('extras','gem',gem);
    const chain=[surfAt(coat.solid,Y(.10),-.60,.10*W),surfAt(shirt.solid,Y(.155),0,.13*W),surfAt(coat.solid,Y(.10),.60,.10*W)];emit('extras','trim',chainG(chain,.019*W));
  }
  return true;
}
