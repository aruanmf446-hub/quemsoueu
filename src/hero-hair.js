// Mechas de herói: volumes fechados em camadas, sulcos esculpidos e pontas curvas.
// Os estilos antigos continuam no gerador original. Tudo é geometria, inclusive tranças e anilhas.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const PI=Math.PI,V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),clamp=THREE.MathUtils.clamp;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
function random(seed){let n=seed;return()=>{n=Math.imul(n^n>>>15,1|n)+0x6D2B79F5|0;return((n^n>>>14)>>>0)/4294967296}}

export function buildHeroHair(fit,style,color){
  const P=fit.P,sdf=fit.sdf,top=fit.top,cz=fit.cz,cy=fit.cy,brow=fit.browY,kind=style.hero,rand=random(701+kind.length*37),parts=[],ornaments=[];
  const earY=fit.ears.length?Math.max(...fit.ears.map(e=>e.top.y)):brow-.4;
  const lobe=fit.ears.length?Math.min(...fit.ears.map(e=>e.lobe.y)):brow-.9;
  function gradient(p){const e=.006;return V(sdf(p.x+e,p.y,p.z)-sdf(p.x-e,p.y,p.z),sdf(p.x,p.y+e,p.z)-sdf(p.x,p.y-e,p.z),sdf(p.x,p.y,p.z+e)-sdf(p.x,p.y,p.z-e)).normalize()}
  function outside(p,offset=.04){const d=sdf(p.x,p.y,p.z);if(d<offset)p.addScaledVector(gradient(p),offset-d);return p}
  function scalp(theta,phi,lift=.05){const dir=V(Math.sin(theta)*Math.sin(phi),Math.cos(theta),Math.sin(theta)*Math.cos(phi)),c=V(0,cy,cz);let r=2;
    for(let k=0;k<70;k++){const p=c.clone().addScaledVector(dir,r),d=sdf(p.x,p.y,p.z);if(Math.abs(d)<.0003)break;r-=clamp(d*.85,-.1,.15)}
    return c.addScaledVector(dir,r+lift);
  }
  function lock(points,width,thick,{rope=false,phase=0,tone=1,tip=.82,grooves=5}={}){
    const curve=new THREE.CatmullRomCurve3(points,false,'centripetal'),rows=Math.max(28,Math.min(80,Math.round(curve.getLength()*30))),cols=18,p=[],colors=[],uv=[],ix=[];
    const tan=V(),n=V(),bin=V(),baseTone=.87+rand()*.19;
    for(let i=0;i<=rows;i++){
      const t=i/rows,c=curve.getPoint(t);tan.copy(curve.getTangent(t));
      // Lado largo acompanha a superfície; a moldura do rosto conserva a espessura no perfil.
      n.set(c.x,Math.max(.12,c.y-cy)*.28,c.z-cz);if(n.lengthSq()<.01)n.set(0,0,1);
      n.addScaledVector(tan,-n.dot(tan)).normalize();if(n.lengthSq()<.01)n.set(0,0,1);bin.crossVectors(tan,n).normalize();n.crossVectors(bin,tan).normalize();
      const root=.72+.28*smooth(0,.13,t),taper=Math.max(.008,(1-.46*t)*(1-smooth(tip,1,t))),w=width*root*Math.pow(taper,.6),h=thick*root*Math.pow(taper,.55);
      for(let j=0;j<=cols;j++){
        const a=2*PI*j/cols,groove=1-(rope?.07:.12)*(.5+.5*Math.cos(a*grooves+(rope?t*22:phase))),q=c.clone().addScaledVector(bin,Math.cos(a)*w*groove).addScaledVector(n,Math.sin(a)*h*groove);
        p.push(q.x,q.y,q.z);const shade=baseTone*tone*(.72+.28*Math.max(0,Math.sin(a)))*(.7+.3*smooth(0,.25,t))*(.95+.05*Math.cos(a*grooves+(rope?t*22:phase)));colors.push(shade,shade,shade);uv.push(j/cols,t);
        if(i<rows&&j<cols){const k=i*(cols+1)+j;ix.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2)}
      }
    }
    const k0=p.length/3;p.push(...curve.getPoint(0).toArray(),...curve.getPoint(1).toArray());colors.push(.5,.5,.5,.9,.9,.9);uv.push(.5,0,.5,1);
    for(let j=0;j<cols;j++){ix.push(k0,j+1,j,k0+1,rows*(cols+1)+j,rows*(cols+1)+j+1)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();
    const normals=g.attributes.normal;for(let i=0;i<=rows;i++){const a=i*(cols+1),b=a+cols,v=V().fromBufferAttribute(normals,a).add(V().fromBufferAttribute(normals,b)).normalize();normals.setXYZ(a,...v.toArray());normals.setXYZ(b,...v.toArray())}parts.push(g);
    return curve;
  }
  // Touca contínua medida na própria pele, escondida sob as raízes das mechas.
  const src=fit.skinGeo,sp=src.attributes.position,sn=src.attributes.normal,N=fit.skinN,remap=new Map(),cp=[],cc=[],ci=[];
  const line=q=>{const a=Math.abs(Math.atan2(q.x,q.z-cz));return a<.9?brow+.19-.10*Math.sin(a*2):a<1.75?earY+.04-(a-.9)*.48:lobe-.2};
  for(let i=0;i<src.index.count;i+=3){const ids=[src.index.getX(i),src.index.getX(i+1),src.index.getX(i+2)];if(ids.some(k=>k>=N)||!ids.every(k=>{const q=V().fromBufferAttribute(sp,k);return q.y>line(q)-.025}))continue;
    for(const k of ids){if(!remap.has(k)){const q=V().fromBufferAttribute(sp,k),no=V().fromBufferAttribute(sn,k);q.addScaledVector(no,.035);remap.set(k,cp.length/3);cp.push(...q.toArray());cc.push(.63,.63,.63)}ci.push(remap.get(k))}
  }
  const cap=new THREE.BufferGeometry();cap.setAttribute('position',new THREE.Float32BufferAttribute(cp,3));cap.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));cap.setIndex(ci);cap.computeVertexNormals();
  const short=kind==='pixie'||kind==='tousled'||kind==='veteran',long=kind==='waves'||kind==='halfup';
  if(short){
    // Três fileiras sobrepostas: nuca, laterais e coroa, com pontas soltas de verdade.
    for(let row=0;row<3;row++)for(let j=0;j<18;j++){
      const ph=2*PI*j/18+(row%2)*.16,a=scalp(.46+row*.24,ph,.035),b=scalp(.83+row*.23,ph+.38,.075),front=Math.cos(ph)>.45;
      const endTheta=front?1.07+row*.075:1.62+row*.18,c=scalp(endTheta,ph+.58,.065+rand()*.035),d=c.clone().add(V(Math.sin(ph+.58)*(.10+rand()*.06),-.08-rand()*.08,Math.cos(ph+.58)*.055));
      if(kind==='pixie'&&Math.sin(ph)<-.15)d.y-=.08;
      lock([a,b,c,d],(kind==='veteran'?.10:.09)+rand()*.032,.028+rand()*.012,{phase:j*.7,tip:.65});
    }
    // Frange assimétrica que cruza a testa, com topete levantado em vez de um capacete liso.
    for(let j=0;j<8;j++){
      const x=-.69+j*.17,root=outside(V(.16+j*.035,top-.20+j*.01,cz+.24),.035),b=outside(V(.10+j*.025,top-.02+Math.sin(j*.8)*.035,cz+.49),.045),c=outside(V(x+.19,brow+.28+.06*Math.sin(j*.9),cz+.78),.045),end=outside(V(x,brow+.04+Math.abs(x)*.11,cz+.73),.025);
      lock([root,b,c,end],.095+rand()*.025,.027,{phase:j,tip:.65,tone:1.04});
    }
    if(kind==='pixie'){
      // Trança lateral de três fios, usada pela arqueira e pela guarda.
      const ph=-1.48;for(let strand=0;strand<3;strand++){
        const pts=[];for(let i=0;i<=44;i++){const t=i/44,q=scalp(.55+t*.92,ph-.13*t,.12),a=t*PI*7+strand*2*PI/3;q.x+=Math.cos(a)*.028;q.z+=Math.sin(a)*.028;pts.push(q)}lock(pts,.025,.025,{rope:true,tip:.9,grooves:3});
      }
    }
  }else if(kind==='locks'){
    // Dreads pesados em camadas, com torção helicoidal e anilhas separadas.
    for(let row=0;row<3;row++)for(let j=0;j<13;j++){
      const phi=.72+(2*PI-1.44)*j/12+(row%2)*.10,a=scalp(.24+row*.30,phi,.07),b=scalp(.98+row*.13,phi+.22,.15),c=scalp(1.65,phi+.3,.17),len=.6+row*.28+rand()*.45,side=Math.sin(phi);
      const d=outside(V(c.x+side*.12,c.y-len,Math.min(c.z,cz+.13)-.10),.12),e=d.clone().add(V(side*.08,-.25,-.09));
      const curve=lock([a,b,c,d,e],.073+rand()*.021,.067,{rope:true,phase:j,tip:.91,grooves:7});
      if((j+row)%4===0){const t=.65,point=curve.getPoint(t),dir=curve.getTangent(t),g=new THREE.CylinderGeometry(.083,.083,.105,20,1,true);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0,1,0),dir));g.translate(...point.toArray());ornaments.push(g)}
    }
    for(let j=0;j<7;j++){const x=-.54+j*.18;lock([outside(V(x*.7,top-.06,cz+.24),.1),V(x,top+.13,cz+.65),outside(V(x+.11,brow+.16,cz+.86),.1),outside(V(x+.22,brow+.01,cz+.70),.07)],.095,.073,{rope:true,tip:.9,grooves:6})}
  }else if(long){
    const bottom=kind==='waves'?-3.65:-3.25;
    for(let layer=0;layer<3;layer++)for(let j=0;j<24;j++){
      const phi=.84+j*(2*PI-1.68)/23,a=scalp(.18+layer*.24,phi,.05),b=scalp(1.15,phi+.15,.13+layer*.04),c=scalp(1.78,phi+.13,.18+layer*.04),side=Math.sin(phi),rear=Math.cos(phi),pts=[a,b,c],end=bottom+.38*Math.sin(j*.82)+layer*.17;
      for(let k=1;k<=9;k++){const t=k/9,yy=THREE.MathUtils.lerp(c.y,end,t),wave=Math.sin(t*PI*4.8+j*.37+layer*.8);const q=V(c.x+side*(.16*t+.11*wave),yy,cz+Math.min(rear,-.09)*(.88+.12*t)+.12*Math.cos(t*PI*4.8+j*.37));outside(q,.12+layer*.03);pts.push(q)}
      lock(pts,.11+rand()*.045,.055+layer*.006,{tip:.88,phase:j*.4,tone:.93+layer*.035});
    }
    // Mechas que enquadram o rosto; têm início alto e terminam nos ombros.
    for(const sg of [-1,1])for(let j=0;j<4;j++){
      const a=scalp(.30+j*.10,sg*(.45+j*.12),.06),b=outside(V(sg*(.56+j*.025),brow+.2,cz+.68),.10),c=outside(V(sg*(.78+j*.04),-.65,cz+.45),.13),d=outside(V(sg*(.75+j*.06),-1.65-j*.08,cz+.35),.16),e=V(sg*(.81+j*.04),-2.25-j*.14,cz+.04);
      lock([a,b,c,d,e],.085+j*.008,.045,{tip:.83,phase:j});
    }
    if(kind==='halfup'){
      for(let j=0;j<18;j++){const a=j*2*PI/18,pts=[];for(let k=0;k<=36;k++){const t=k/36,th=a+t*PI*2.8;pts.push(V(Math.cos(th)*(.25+.07*Math.sin(t*PI)),top+.02+Math.sin(th)*.23,cz-.38+t*.18))}lock(pts,.07,.05,{tip:.92,phase:j})}
    }
  }else if(kind==='curlup'){
    // Nana: cachos enrolados em um coque volumoso, com mechas soltas.
    for(let row=0;row<2;row++)for(let j=0;j<26;j++){const ph=j*2*PI/26,a=scalp(.22+row*.42,ph,.045),b=scalp(1.12+row*.14,ph+.12,.08),c=V(-.08,top+.34,cz-.36);lock([a,b,c],.08,.055,{tip:.94,phase:j})}
    for(let j=0;j<58;j++){
      const a=j*2.399963,r=.35+rand()*.25,center=V(-.2+Math.cos(a)*r,top+.17+Math.sin(a)*r,cz-.35+(rand()-.5)*.42),pts=[];
      for(let k=0;k<=48;k++){const t=k/48,th=t*PI*4.8+a,rr=.075+.025*Math.sin(t*PI);pts.push(center.clone().add(V(Math.cos(th)*rr,Math.sin(th)*rr,-t*.36)))}lock(pts,.044,.04,{rope:true,tip:.93,phase:j});
    }
    for(const side of [-1,1])for(let j=0;j<4;j++){const pts=[];for(let k=0;k<=50;k++){const t=k/50,a=t*PI*5+j;pts.push(outside(V(side*(.64+.045*j)+Math.sin(a)*.045,brow+.22-t*(.8+j*.09),cz+.38+Math.cos(a)*.055),.075))}lock(pts,.033,.03,{tip:.9,phase:j})}
  }
  const hex=new THREE.Color(color),material=new THREE.MeshPhysicalMaterial({name:'Hair',color:hex,vertexColors:true,roughness:.38,sheen:.8,sheenColor:hex.clone().lerp(new THREE.Color('#fff1d4'),.36),sheenRoughness:.37,clearcoat:.16,clearcoatRoughness:.55}),baseMaterial=material.clone();baseMaterial.name='Hair_Base';baseMaterial.roughness=.54;
  const group=new THREE.Group();group.name='Hair_'+style.id;
  const capMesh=new THREE.Mesh(cap,baseMaterial);capMesh.name='Hair_Cap';group.add(capMesh);
  if(parts.length){const geo=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geo,material);mesh.name='Hair_Locks';group.add(mesh)}
  let metal=null;if(ornaments.length){metal=new THREE.MeshPhysicalMaterial({name:'Hair_Ring',color:'#b98d3f',metalness:.85,roughness:.32});const geo=mergeGeometries(ornaments,false);ornaments.forEach(g=>g.dispose());const m=new THREE.Mesh(geo,metal);m.name='Hair_Rings';group.add(m)}
  group.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});
  return {group,material,meshes:group.children.filter(m=>m.isMesh),setColor(c){for(const m of [material,baseMaterial]){m.color.set(c);m.sheenColor.set(c).lerp(new THREE.Color('#fff1d4'),.36)}},dispose(){group.traverse(m=>{if(m.isMesh)m.geometry.dispose()});material.dispose();baseMaterial.dispose();metal?.dispose()}};
}

// Sardas discretas, posicionadas na superfície do rosto dos novos personagens.
export function buildHeroFreckles(fit){
  if(!fit.P.heroFreckles)return null;const rand=random(1939),geos=[];
  for(const side of [-1,1])for(let i=0;i<19;i++){
    const x=side*(.17+rand()*.43),y=-.20-rand()*.15,z=fit.surfZ(x,y),r=.006+rand()*.006,g=new THREE.SphereGeometry(r,7,5);g.scale(1,.72,.24);g.translate(x,y,z+.003);geos.push(g);
  }
  const geo=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());const material=new THREE.MeshStandardMaterial({name:'Face_Freckles',color:'#87503b',roughness:.9}),mesh=new THREE.Mesh(geo,material);mesh.name='Face_Freckles';return {mesh,dispose(){geo.dispose();material.dispose()}};
}
