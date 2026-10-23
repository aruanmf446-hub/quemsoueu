// Chapelaria esculpida das novas skins do deserto. Não altera os modelos anteriores.
import * as THREE from 'three';
import {clothSurface} from './fabric.js';
import {badge} from './detail.js';
import {groomedLock} from './groom.js';
function tuft(a,b,width,thickness,bend){
 const axis=b.clone().sub(a).normalize(),u=new THREE.Vector3(0,0,1).cross(axis).normalize(),v=axis.clone().cross(u),points=Array.from({length:19},(_,i)=>a.clone().lerp(b,i/18).addScaledVector(v,bend*Math.sin(Math.PI*i/18)));
 return groomedLock(points,width,thickness,{normal:()=>v,rows:24,segments:20,profile:t=>{const r=Math.max(.002,Math.sin(Math.PI*(.12+.88*t))**.8*(1-.6*t));return[width*r,thickness*r]}});
}
const PI=Math.PI,V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),mix=THREE.MathUtils.lerp;
function smoothProfile(points,t){
  const n=points.length,d=points.slice(1).map((p,i)=>(p[1]-points[i][1])/(p[0]-points[i][0])),m=d.map((v,i)=>i?d[i-1]*v<=0?0:2*d[i-1]*v/(d[i-1]+v):v);m.push(d[d.length-1]);
  let k=0;while(k<n-2&&t>points[k+1][0])k++;const a=points[k],b=points[k+1],h=b[0]-a[0],u=THREE.MathUtils.clamp((t-a[0])/h,0,1),v=u*u;
  return (2*v*u-3*v+1)*a[1]+(v*u-2*v+u)*h*m[k]+(-2*v*u+3*v)*b[1]+(v*u-v)*h*m[k+1];
}
export function cactusHeadgear({head,fit,ring,add,tube,sphere,place,gemGeo,mats}){
  const {top,cz:zc}=fit;
  if(head==='frontier_hat'){
    const y=top-.29,R=ring(y,-.075,.045,144),H=.66;
    const crown=(t,u)=>{const ph=u*2*PI,b=R.at(ph),r=Math.hypot(b.x,b.z-zc),f=smoothProfile([[0,1],[.20,1.025],[.56,.95],[.79,.83],[.94,.58],[1,.015]],t),pinch=.105*Math.sin(2*ph)**2*Math.sin(PI*t)**2*Math.max(0,Math.cos(ph));return V(Math.sin(ph)*(r*f-pinch),b.y+H*Math.sin(t*PI/2)-.115*Math.cos(ph)**2*Math.sin(PI*t*.88)**6,zc+Math.cos(ph)*(r*f-pinch))};
    add('fabric',clothSurface(56,192,crown,{closed:true,thickness:.035}));
    const brim=(t,u)=>{const ph=u*2*PI,b=R.at(ph),r=Math.hypot(b.x,b.z-zc),e=.85+.10*Math.sin(ph)**2,up=.31*Math.sin(ph)**4*t*t-.13*Math.cos(ph)**2*t;return V(Math.sin(ph)*(r+e*t),b.y+up+.035*Math.sin(ph)*t,zc+Math.cos(ph)*(r+e*t))};
    add('fabric',clothSurface(24,192,brim,{closed:true,thickness:.04}));
    add('band',tube(Array.from({length:193},(_,i)=>brim(1,i/192)),.02,10));
    add('band',clothSurface(8,144,(t,u)=>{const p=crown(.04+.17*t,u),n=V(p.x,0,p.z-zc).normalize();return p.addScaledVector(n,.018)},{closed:true,thickness:.026}));
    for(const t of [.05,.20])add('metal',tube(Array.from({length:145},(_,i)=>crown(t,i/144).addScaledVector(V(Math.sin(i/144*2*PI),0,Math.cos(i/144*2*PI)),.027)),.009,8));
    // Pesponto individual acompanha a aba curvada, com espaço real entre as laçadas.
    for(let i=0;i<112;i++){
      const a=i/112,b=(i+.55)/112,pts=[brim(.955,a),brim(.968,(a+b)/2),brim(.955,b)];for(const p of pts)p.y+=.021;add('metal',tube(pts,.0065,5));
    }
    const p=R.at(0).add(V(0,.15,.11)),g=new THREE.TorusGeometry(.19,.021,10,64);add('metal',place(g,p,V(0,0,1)));
    const plate=new THREE.CylinderGeometry(.172,.172,.035,56);plate.rotateX(PI/2);add('band',place(plate,p.clone().add(V(0,0,.007)),V(0,0,1)));
    const star=badge('star',.166,.026);add('metal',place(star,p.clone().add(V(0,0,.036)),V(0,0,1)));
    for(let i=0;i<5;i++){const a=PI/2+i*2*PI/5;add('metal',sphere(p.clone().add(V(Math.cos(a)*.168,Math.sin(a)*.168,.052)),.013,1,1,.5))}
    return true;
  }
  if(head!=='guard_helmet')return false;
  mats.fabric.metalness=.68;mats.fabric.roughness=.29;mats.fabric.clearcoat=.5;mats.fabric.clearcoatRoughness=.2;
  mats.plume.roughness=.86;mats.plume.sheen=.8;
  const y=top-.29,R=ring(y,-.07,.07,144),height=.65;
  const dome=(t,u)=>{const ph=u*2*PI,b=R.at(ph),r=Math.hypot(b.x,b.z-zc)*Math.cos(t*PI*.499),ridge=1+.022*Math.cos(ph*8)*Math.sin(PI*t);return V(Math.sin(ph)*r*ridge,b.y+height*Math.sin(t*PI/2),zc+Math.cos(ph)*r*ridge)};
  add('fabric',clothSurface(48,192,dome,{closed:true,thickness:.065}));
  for(const t of [0,.095])add('metal',tube(Array.from({length:193},(_,i)=>dome(t,i/192).addScaledVector(V(Math.sin(i/192*2*PI),0,Math.cos(i/192*2*PI)),.012)),t===0?.034:.014,10));
  // Nervuras sobre a cúpula, ajustadas à malha em vez de cilindros atravessando o elmo.
  for(let k=0;k<8;k++)add('metal',tube(Array.from({length:33},(_,i)=>dome(.075+i/32*.89,k/8).add(V(0,.014,0))),.012,8));
  const f=R.at(0).add(V(0,.115,.065));
  const shield=new THREE.Shape();shield.moveTo(-.25,-.09);shield.lineTo(-.23,.16);shield.quadraticCurveTo(-.1,.24,0,.55);shield.quadraticCurveTo(.1,.24,.23,.16);shield.lineTo(.25,-.09);shield.quadraticCurveTo(0,-.24,-.25,-.09);
  const plate=new THREE.ExtrudeGeometry(shield,{depth:.045,bevelEnabled:true,bevelSize:.018,bevelThickness:.012,bevelSegments:4,curveSegments:24}),inset=plate.clone();inset.scale(.82,.84,.7);
  add('metal',place(plate,f,V(0,0,1)));add('fabric',place(inset,f.clone().add(V(0,.018,.047)),V(0,0,1)));
  const flame=badge('flame',.135,.025);add('metal',place(flame,f.clone().add(V(0,.11,.09)),V(0,0,1)));
  add('gem',gemGeo(f.clone().add(V(0,.39,.09)),.061,V(0,0,1),1.5));
  // Bochecheiras curvas separadas dos olhos e placas internas menores de esmalte.
  for(const side of [-1,1]){
    const cheek=(t,u)=>{const ph=side*(1.02+u*.55),base=R.at(ph),r=Math.hypot(base.x,base.z-zc)+.018+Math.sin(PI*t)*.035;return V(Math.sin(ph)*r,base.y-.76*t+.10*Math.sin(PI*u)*t,zc+Math.cos(ph)*r)};
    add('metal',clothSurface(36,28,cheek,{thickness:.043}));
    add('fabric',clothSurface(30,22,(t,u)=>{const p=cheek(.12+t*.74,.12+u*.76);return p.addScaledVector(V(Math.sin(side*(1.02+u*.55)),0,Math.cos(side*(1.02+u*.55))),.035)},{thickness:.018}));
    for(const u of [0,1])add('metal',tube(Array.from({length:33},(_,i)=>cheek(i/32,u)),.022,8));
  }
  // Espinhos cônicos inclinados, soldados a rosetas reais na borda da cúpula.
  for(const ph of [-2.75,-2.1,-1.5,-.92,.92,1.5,2.1,2.75]){
    const p=dome(.22,ph/(2*PI)),dir=V(Math.sin(ph)*.85,.72,Math.cos(ph)*.85).normalize(),g=new THREE.ConeGeometry(.075,.31,14,1);g.translate(0,.155,0);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0,1,0),dir));g.translate(...p.toArray());add('metal',g);add('metal',sphere(p,.095,1,.5,1));
  }
  // Penacho cheio: fileiras sobrepostas varrem para trás com pontas afiladas.
  const baseY=y+height-.04;
  for(let row=0;row<3;row++)for(let i=0;i<25;i++){
    const t=i/24,z=.24-t*1.06,x=(row-1)*.055,base=V(x,baseY-.07*t,z),end=V(x*1.7+.025*Math.sin(i*1.7+row),baseY+.69*Math.sin(PI*(.18+.76*t))+.21+.045*Math.sin(i*2.37+row*1.4),-.06-t*1.08+.04*Math.cos(i*1.9+row));
    add('plume',tuft(base,end,.13,.06,.16));
  }
  const comb=[];for(let i=0;i<=28;i++){const t=i/28;comb.push(V(0,baseY-.06*t,.25-t*1.08))}add('metal',tube(comb,.065,12));
  for(let i=0;i<24;i++){const ph=i/24*2*PI,p=dome(.052,i/24);add('metal',sphere(p.clone().addScaledVector(V(Math.sin(ph),0,Math.cos(ph)),.02),.023,1,1,.5))}
  return true;
}
