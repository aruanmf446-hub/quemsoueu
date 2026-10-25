// Corte próprio da arqueira: blusa de linho, corpete baixo e abas independentes.
// Os campos de tecido continuam medidos no corpo, inclusive nos tipos físicos.
import * as THREE from 'three';
import {clothSurface,handPatch} from './fabric.js';
import {panel,buckleGeo,tuft} from './detail.js';
import {leafGeo} from './forest.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),PI=Math.PI;

export function buildArcherOutfit(C){
 if(C.style!=='forest_huntress')return false;
 const {body,B,W,Y,Lb,z0,yN,S,E,Wr,H,K,A,ySole,bf,garment,envelope,trousers,boots,beltOn,cape,limbR,limbWrap,surfAt,frontZ,backZ,addGeoS,sph,orient,lerp,clamp}=C;
 const emit=(slot,ch,g)=>addGeoS(slot,ch,g);
 const line=(slot,ch,pts,r=.008*W)=>emit(slot,ch,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),Math.max(12,Math.min(192,pts.length*3)),r,8,false));
 const stud=(slot,p,r=.016*W)=>emit(slot,'trim',sph(p,r,1,1,.55,12,8));
 const stitch=(slot,pt,u)=>{for(let j=0;j<36;j+=2)line(slot,'lining',[pt(j/36,u),pt((j+.65)/36,u)],.0035*W)};
 const at=(fn,f,a=0,off=.04*W)=>surfAt(fn,Y(f),a,off);
 function strap(slot,fn,f0,a0,f1,a1,width=.09,lift=.055){
  const pt=(t,u)=>{const y=Y(lerp(f0,f1,t)),a=lerp(a0,a1,t),p=surfAt(fn,y,a),r=Math.max(.18*W,Math.hypot(p.x,p.z-z0));return surfAt(fn,y,a+(u-.5)*width*W/r,lift*W)};
  emit(slot,'leather',clothSurface(56,8,pt,{thickness:.020*W}));stitch(slot,pt,.14);stitch(slot,pt,.86);return pt;
 }
 function buckle(slot,fn,f,a,w=.16,h=.13,lift=.11){
  const p=at(fn,f,a,lift*W),n=V(Math.sin(a),0,Math.cos(a));emit(slot,'trim',orient(buckleGeo(w*W,h*W,.019*W),p,n));
 }
 const shirt=garment('Blusa_linho_franzida_arqueira','secondary','upper',{top:Y(.10),bottom:Y(.397),t:.060*W,sleeve:null,vneck:.045*W,env:{ease:.060*W,hang:.5,cinch:Y(.325),cinchK:.91,flareFrom:Y(.35),flare:.08,folds:.026*W,foldN:15,smooth:14}});
 const support=envelope(yN+.12*W,Y(.40),{ease:.040*W,hang:.55,cinch:Y(.32),cinchK:.90,smooth:14});
 // O corpete termina abaixo do busto: a blusa clara continua legível por inteiro.
 const corset=garment('Corpete_baixo_couro_arqueira','leather','upper',{top:Y(.245),bottom:Y(.387),t:.065*W,sleeve:null,open:.075,hollow:true,mesh:false,over:shirt.solid,overGap:.028*W,env:{ease:.055*W,hang:.55,cinch:Y(.32),cinchK:.88,smooth:14}});
 const corsetEnv=(x,y,z)=>Math.min(shirt.env(x,y,z)-.040*W,corset.env(x,y,z));
 const cp=(t,u)=>{const a=.06+u*(2*PI-.12),f0=.248+.025*Math.max(0,Math.cos(a))-.014*Math.sin(a)**2;return surfAt(corsetEnv,Y(lerp(f0,.389,t)),a,.018*W)};
 emit('upper','leather',clothSurface(42,128,cp,{thickness:.032*W}));
 for(const t of [0,1])line('upper','lining',Array.from({length:129},(_,i)=>cp(t,i/128)),.014*W);
 for(const u of [0,1]){line('upper','leather',Array.from({length:43},(_,i)=>cp(i/42,u)),.016*W);stitch('upper',cp,u)}
 const beltEnv=(x,y,z)=>Math.min(shirt.env(x,y,z),corsetEnv(x,y,z)-.025*W);
 for(const side of [-1,1]){
  strap('upper',support,.055,side*1.03,.30,-side*.21,.095,.09);buckle('upper',support,.155,side*.55,.13,.15,.12);
  strap('upper',corsetEnv,.275,side*1.19,.36,-side*.28,.10,.06);buckle('upper',corsetEnv,.32,side*.25,.14,.11,.105);
 }
 // Laçamento do corpete assentado sobre o linho, com ilhós pequenos.
 for(let j=0;j<6;j++){
  const f=.275+j*.015,ph=.12;for(const side of [-1,1])stud('upper',at(corsetEnv,f,side*ph,.075*W),.013*W);
  line('upper','lining',[at(corsetEnv,f,-ph,.075*W),at(corsetEnv,f+.012,ph,.075*W)],.006*W);
 }
 // Mangas soltas nascem no bíceps. As pregas convergem para os dois franzidos.
 const sleeveCurve=new THREE.CatmullRomCurve3([S.clone().lerp(E,.23),S.clone().lerp(E,.60),E.clone(),E.clone().lerp(Wr,.30)]),nr=48,frames=sleeveCurve.computeFrenetFrames(nr,false),radii=[];
 for(let k=0;k<=nr;k++){
  const t=k/nr,p=sleeveCurve.getPoint(t);let radius=.02*W;
  for(let j=0;j<16;j++){const a=j/16*PI*2,d=frames.normals[k].clone().multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[k],Math.sin(a));let r=.01*W;while(r<1.3*W&&bf(p.x+d.x*r,p.y+d.y*r,p.z+d.z*r)<0)r+=.010*W;radius=Math.max(radius,r)}
  radii.push(radius+.05*W+.145*W*Math.sin(PI*t)**.70);
 }
 for(const side of [-1,1]){
  const sleeve=(t,u)=>{const q=Math.min(nr-.0001,t*nr),k=Math.floor(q),a=u*PI*2,rr=lerp(radii[k],radii[k+1],q-k)+.024*W*Math.sin(a*13+t*1.8)*(.35+.65*Math.sin(PI*t)),n=frames.normals[k].clone().lerp(frames.normals[k+1],q-k).normalize(),b=frames.binormals[k].clone().lerp(frames.binormals[k+1],q-k).normalize(),p=sleeveCurve.getPoint(t).addScaledVector(n,Math.cos(a)*rr).addScaledVector(b,Math.sin(a)*rr);p.x*=side;return p};
  emit('upper','secondary',clothSurface(nr,96,sleeve,{closed:true,thickness:.024*W}));
  for(const t of [0,.05,.94,1])line('upper',t<.1?'leather':'secondary',Array.from({length:97},(_,i)=>sleeve(t,i/96)),t===0?.022*W:.028*W);
  const arm=S.clone().lerp(E,.13);arm.x*=side;const armAxis=E.clone().sub(S).normalize();armAxis.x*=side;
  const r=limbR(S.clone().lerp(E,.13),E.clone().sub(S).normalize())+.035*W,ring=new THREE.TorusGeometry(r,.026*W,10,64);emit('upper','leather',orient(ring,arm,armAxis));
  const tab=panel(.13*W,.17*W,.027*W);tab.translate(arm.x,arm.y,arm.z+r);emit('upper','leather',tab);stud('upper',V(arm.x,arm.y,arm.z+r+.035*W));
 }
 // Short de base e tecidos com recortes próprios, sem membrana entre as pernas.
 trousers('Short_couro_arqueira','pants',{top:.35,cuff:.43,ease:.033*W,puff:.015*W,under:{fn:shirt.solid,y:Y(.39)+.03*W}});
 const skirt=envelope(Y(.34),Y(.82),{ease:.08*W,hang:.42,flareFrom:Y(.37),flare:.14,folds:.035*W,foldN:13,smooth:14});
 function flap(a,width,end,ch,phase,lift=.07){
  const pt=(t,u)=>{const ph=a+(u-.5)*width*(1-.15*t),rag=.025*Math.sin(u*71+phase)+.015*Math.sin(u*131+phase*.8),f=lerp(.365,end,t),y=Y(f)+W*(.18*Math.abs(2*u-1)+rag+.08*Math.sin(u*PI*2+phase))*t**6;
   return surfAt(skirt,y,ph,W*(lift+.045*t*t+.028*Math.sin(ph*14+2*t)*Math.sin(PI*t)))};
  emit('lower',ch,clothSurface(64,40,pt,{thickness:.023*W}));
  for(const u of [0,1])line('lower',ch,Array.from({length:49},(_,i)=>pt(i/48,u)),.010*W);
  // Pequenos fios apenas na barra; o contorno principal já contém o desgaste.
  for(let j=0;j<18;j++){const u=(j+.5)/18,p=pt(1,u);line('lower',ch,[p,p.clone().add(V(.009*W,-(.025+.025*Math.sin(j*1.9)**2)*W,.008*W))],.003*W)}
  return pt;
 }
 flap(-.94,.95,.66,'secondary',.7);flap(1.02,1.02,.77,'secondary',2.1);flap(PI,1.9,.72,'secondary',3.5);
 const banner=flap(.40,.68,.82,'fabric',1.3,.17);flap(-1.36,.43,.85,'accent',2.8,.19);
 // Ramo bordado contínuo, em vez de um símbolo pequeno perdido no painel.
 const stem=Array.from({length:41},(_,i)=>banner(.20+i/40*.69,.50).add(V(0,0,.018*W)));line('lower','secondary',stem,.010*W);
 for(let j=0;j<9;j++)for(const side of [-1,1]){
  const t=.24+j*.069,p=banner(t,.5+side*.20),n=V(p.x,0,p.z-z0).normalize(),leaf=leafGeo(.080*W,.008*W);leaf.rotateZ(-side*.6);emit('lower','secondary',orient(leaf,p.clone().addScaledVector(n,.025*W),n));
 }
 // Cintos inclinados, bolsas volumosas e tiras curtas medidos na roupa.
 for(const [f,h,tilt]of [[.335,.15,.025],[.375,.095,-.06]])beltOn('Cinto_couro_arqueira','leather',beltEnv,Y(f),h*W,.055*W,{tilt});
 buckle('belt',beltEnv,.335,0,.24,.19,.12);buckle('belt',beltEnv,.375,.67,.19,.14,.12);
 for(const side of [-1,1]){
  const a=side*1.15,p=at(skirt,.43,a,.16*W),n=V(Math.sin(a),0,Math.cos(a));
  emit('belt','leather',orient(new THREE.BoxGeometry(.29*W,.49*W,.15*W,3,4,2),p,n));
  const lid=panel(.32*W,.18*W,.045*W);lid.translate(0,.18*W,.10*W);emit('belt','leather',orient(lid,p,n));
  emit('belt','trim',orient(buckleGeo(.12*W,.10*W,.018*W),p.clone().addScaledVector(n,.14*W),n));
  strap('belt',skirt,.36,a,.47,a,.075,.12);
  // Duas correias na coxa, sem engrossar a perna nem cobrir o vão da saia.
  const axis=K.clone().sub(H).normalize();for(const t of [.28,.43]){
   const p=H.clone().lerp(K,t),r=limbR(p,axis)+.035*W;p.x*=side;
   const band=new THREE.CylinderGeometry(r,r,.063*W,48,1,true);emit('lower','leather',orient(band,p,V(0,0,1),V(side*axis.x,axis.y,axis.z)));
   const q=p.clone().add(V(0,0,r+.025*W));emit('lower','trim',orient(buckleGeo(.12*W,.085*W,.017*W),q,V(0,0,1)));
  }
 }
 const neck=envelope(yN+.22*W,Y(.13),{ease:.035*W,hang:.7,drape:.008*W,smooth:14});
 const cowl=(t,u)=>{const a=-PI+u*PI*2,yy=lerp(yN+.16*W,Y(.055),t)-.045*W*Math.cos(a)*Math.sin(PI*t);return surfAt(neck,yy,a,.060*W+.055*W*Math.sin(PI*t)+.035*W*Math.sin(a*5+7*t)*Math.sin(PI*t))};
 emit('cape','fabric',clothSurface(32,128,cowl,{closed:true,thickness:.025*W}));
 for(const t of [0,.90])line('cape','fabric',Array.from({length:129},(_,i)=>cowl(t,i/128)),.026*W);
 const coatBase=(x,y,z)=>lerp(support(x,y,z),Math.min(support(x,y,z),skirt(x,y,z)-.28*W),C.sstep(Y(.27),Y(.38),y));
 cape('Capa_curta_rasgada_arqueira','accent',{top:.04,yBottom:Y(.62),span:2.8,turn:.14,flare:.14,pleats:13,ragged:.19*W,over:coatBase,refined:true});
 // Braçadeiras com correias diagonais e luvas curtas.
 limbWrap('Bracadeira_couro_arqueira','leather',E,Wr,.28,.95,.052*W);
 const glove=handPatch(body,0,.018*W),gp=glove.attributes.position,gi=glove.index.array,gd=Wr.clone().sub(E).normalize(),gloveIds=[];
 for(let i=0;i<gi.length;i+=3){const q=V();for(let k=0;k<3;k++)q.add(V(Math.abs(gp.getX(gi[i+k])),gp.getY(gi[i+k]),gp.getZ(gi[i+k])));q.multiplyScalar(1/3);if(q.sub(Wr).dot(gd)<.045*Lb)gloveIds.push(gi[i],gi[i+1],gi[i+2])}glove.setIndex(gloveIds);emit('extras','leather',glove);
 for(const side of [-1,1])for(let j=0;j<3;j++){
  const axis=Wr.clone().sub(E).normalize(),p=E.clone().lerp(Wr,.40+j*.20),r=limbR(p,axis)+.085*W;p.x*=side;const ring=new THREE.TorusGeometry(r,.022*W,8,48);axis.x*=side;emit('extras','lining',orient(ring,p,axis));stud('extras',p.clone().add(V(0,0,r)));
 }
 // Botas altas de couro: cano, sola, costuras, polainas de linho e cadarços.
 boots('Botas_couro_arqueira','leather',{h:.27,t:.070*W,cuffT:.045*W,toe:.045});C.bootFinish(.27);
 for(const side of [-1,1]){
  const x=side*A.x,yt=A.y+.26*Lb;
  for(let j=0;j<8;j++){const y=lerp(A.y+.09*W,yt-.12*W,j/7),z=frontZ(x,y)+.13*W,sg=j%2?1:-1;line('feet','leather',[V(x-sg*.17*W,y,z),V(x+sg*.17*W,y+.13*W,z+.012*W)],.019*W);for(const s of [-1,1])stud('feet',V(x+s*.18*W,y,z),.012*W)}
  const axis=A.clone().sub(K).normalize(),p=K.clone().lerp(A,.34),r=limbR(p,axis)+.10*W;p.x*=side;
  const wrap=new THREE.CylinderGeometry(r*1.03,r,.22*W,64,3,true);wrap.rotateZ(side*.13);wrap.translate(...p.toArray());emit('feet','secondary',wrap);
 }
 // Aljava e flechas de alturas variadas; equipamento independente do figurino.
 const qc=V(.49*W,Y(.18),backZ(.49*W,Y(.18))-.36*W),qa=V(-.27,.96,-.03).normalize(),ql=.29*Lb;
 const qg=new THREE.CylinderGeometry(.18*W,.14*W,ql,40);qg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0,1,0),qa));qg.translate(...qc.toArray());emit('extras','leather',qg);
 for(const t of [-.45,.43]){const g=new THREE.TorusGeometry((t<0?.15:.18)*W,.025*W,10,48);emit('extras','trim',orient(g,qc.clone().addScaledVector(qa,t*ql),qa))}
 for(let j=0;j<8;j++){
  const a=j*2.4,q=qc.clone().add(V(Math.cos(a)*.12*W,0,Math.sin(a)*.12*W)),end=q.clone().addScaledVector(qa,ql*(.69+.025*(j%3)));
  line('extras','leather',[q.clone().addScaledVector(qa,-ql*.25),end],.013*W);
  for(let k=0;k<3;k++){const d=V(Math.cos(k*PI*2/3)*.065*W,0,Math.sin(k*PI*2/3)*.065*W);emit('extras',k%2?'fabric':'accent',tuft(end.clone().addScaledVector(qa,-.27*W),end.clone().add(d),.052*W,.011*W,.018*W))}
 }
 strap('extras',support,.05,-.91,.34,.92,.11,.14);
 // O arco fica ao lado da mão, com empunhadura espessa e corda independente.
 const bx=Wr.x-.16*W,by=Wr.y+.08*W,bz=Wr.z+.23*W,bh=.235*Lb;
 const bow=[V(bx+.04*W,by-bh,bz),V(bx-.18*W,by-bh*.66,bz),V(bx+.25*W,by-bh*.27,bz+.04*W),V(bx+.30*W,by,bz+.05*W),V(bx+.25*W,by+bh*.27,bz+.04*W),V(bx-.18*W,by+bh*.66,bz),V(bx+.04*W,by+bh,bz)];
 line('extras','leather',bow,.060*W);line('extras','trim',bow.map(p=>p.clone().add(V(.017*W,0,.045*W))),.010*W);line('extras','lining',[bow[0],V(bx-.05*W,by,bz),bow[6]],.006*W);
 return true;
}
