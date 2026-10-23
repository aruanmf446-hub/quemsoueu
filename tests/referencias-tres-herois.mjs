// Modelos das referências: peças editáveis/exportáveis e orelhas cobertas só enquanto houver capuz.
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {buildHead} from '../src/head.js';
import {PRESETS} from '../src/presets.js';
import {defaultLook,headOpts,buildLook,attachLook} from '../src/look.js';
import {buildBody,headScale,bodyViewHeight} from '../src/body.js';
import {buildClothes} from '../src/clothes.js';
import * as THREE from 'three';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const reports=[],dimensions=new Map();
for(const id of ['nana_explorer','nico_inventor','bread_vigilante','bread_baker']){
 const look=defaultLook(id),head=buildHead(id,{}, {quality:.35,export:true,...headOpts(look,PRESETS[id])}),visual=buildLook(head.fit,look);
 try{
  attachLook(head,visual);let vertices=0,meshes=0;
  visual.group.traverse(m=>{if(!m.isMesh)return;meshes++;const g=m.geometry,p=g.attributes.position,n=g.attributes.normal;vertices+=p.count;
   for(const [name,a]of Object.entries(g.attributes))assert(a.array.every(Number.isFinite),id+'/'+m.name+'/'+name);
   if(g.index)assert(g.index.array.every(i=>i<p.count),id+': índice fora da malha');
   for(let i=0;i<n.count;i++)assert(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<1e-4,id+': normal inválida');
   if(m.material.normalMap?.name==='Hair_Fiber_Normal')assert(g.attributes.uv&&g.attributes.tangent,id+'/'+m.name+': fios sem UV/tangente');
   else if(m.material.normalMap)assert(g.attributes[m.material.normalMap.channel?'uv1':'uv'],id+'/'+m.name+': mapa sem UV');
  });
  assert.equal(head.rig.makeClips().length,12);
  if(id==='nana_explorer'){
   for(const name of ['white','purple'])assert(visual.group.getObjectByName('Hair_Streak_'+name),'Mecha da Nana ausente: '+name);
   const white=visual.group.getObjectByName('Hair_Streak_white').material.color.getHex();visual.setHairColor('#633719');
   assert.equal(visual.group.getObjectByName('Hair_Streak_white').material.color.getHex(),white,'A mecha clara perdeu sua identidade ao tingir o cabelo');
   head.group.updateMatrixWorld(true);
   const lens=visual.group.getObjectByName('Acc_visor'),bounds=new THREE.Box3().setFromObject(lens);
   assert(bounds.max.x-bounds.min.x>1.30,'Visor da Nana não envolve as têmporas');
   for(const eye of head.fit.eyes)for(const dx of [-.06,0,.06])for(const dy of [-.07,.07]){
    const ray=new THREE.Raycaster(new THREE.Vector3(eye.x+dx,eye.y+dy,4),new THREE.Vector3(0,0,-1)),hit=ray.intersectObject(lens,false)[0];
    assert(hit,'Lente da Nana com falha diante do olho');assert(hit.point.z>head.fit.surfZ(eye.x+dx,eye.y+dy)+.025,'Lente atravessando a face da Nana');
   }
  }
  if(id==='nico_inventor')assert(visual.group.getObjectByName('Acc_optical'),'Armação própria do Nico ausente');
  if(id==='bread_vigilante'){
   head.group.updateMatrixWorld(true);
   const mask=visual.group.getObjectByName('Acc_mask'),hood=visual.group.getObjectByName('Acc_fabric');
   assert(mask&&hood,'Capuz e máscara precisam existir como peças reais');
   for(const x of [-.23,0,.23])for(const dy of [-.06,0,.06]){
    const y=head.params.mouthY+dy,ray=new THREE.Raycaster(new THREE.Vector3(x,y,4),new THREE.Vector3(0,0,-1)),hit=ray.intersectObject(mask,false)[0];
    assert(hit,'Máscara deixou a boca descoberta');assert(hit.point.z>head.fit.surfZ(x,y)+.035,'Máscara entrou nos lábios');
   }
   const backRay=new THREE.Raycaster(new THREE.Vector3(0,head.params.eyeY,-4),new THREE.Vector3(0,0,1)),back=backRay.intersectObject(hood,false)[0];
   assert(back&&head.fit.sdf(...back.point.toArray())>.025,'Capuz não cobre a parte de trás da cabeça');
   const box=new THREE.Box3().setFromObject(hood);assert(box.min.y<head.params.loft.y[0]-.65&&box.max.y>head.fit.top+.10,'Capuz precisa de topo e queda até os ombros');
   const ears=[];head.group.traverse(m=>{if(m.name.startsWith('Ear_'))ears.push(m)});assert.equal(ears.length,2);
   assert(ears.every(m=>!m.visible),'Orelhas atravessando o capuz');
   visual.rebuildAcc({...look,acc:{...look.acc,head:null}});assert(ears.every(m=>m.visible),'Orelhas não retornaram ao retirar o capuz');
   visual.rebuildAcc(look);assert(ears.every(m=>!m.visible),'Capuz recolocado sem cobrir as orelhas');
  }
  // Verifica o personagem vestido, incluindo peças SDF e painéis sobrepostos.
  const body=buildBody(head.fit,id,{cell:.06,headScale:headScale(id)}),clothes=buildClothes(body,look);
  try{
   const skin=body.geo.attributes.position.array.slice(),bounds=new THREE.Box3();clothes.group.updateMatrixWorld(true);
   clothes.group.traverse(m=>{
    if(!m.isMesh)return;const g=m.geometry,p=g.attributes.position;
    for(const [name,a]of Object.entries(g.attributes))assert(a.array.every(Number.isFinite),id+'/'+m.name+'/'+name);
    assert(p.count>0,id+': peça vazia');if(g.index)assert(g.index.array.every(i=>i<p.count),id+': índice da roupa inválido');
    if(m.material.normalMap)assert(g.attributes[m.material.normalMap.channel?'uv1':'uv'],id+': tecido sem UV');
    g.computeBoundingBox();bounds.union(g.boundingBox);
   });
   assert(bounds.max.y<body.joints.yNeck+body.joints.W*1.1,id+': roupa ultrapassou a cabeça');
   assert(bounds.min.y>body.joints.ySole-.30*body.joints.W,id+': roupa abaixo dos pés');
   // O centro do peito tem tecido à frente da pele nas três roupas. A barriga
   // descoberta da Nana fica fora desta seção; o avental não é usado como cobertura.
   const ray=new THREE.Raycaster(new THREE.Vector3(0,body.joints.Y(.17),body.joints.bounds.z1+2),new THREE.Vector3(0,0,-1));
   const hit=ray.intersectObject(clothes.group,true)[0];assert(hit,id+': peito sem roupa');
   assert(body.sdf(...hit.point.toArray())>.005,id+': tecido entrou na pele do peito');
   assert.deepEqual(body.geo.attributes.position.array,skin,id+': roupa alterou a pele');
   const height=body.pivot.y+body.hs*(head.fit.top-body.pivot.y)-body.ySole,faceHeight=body.hs*(head.fit.top-head.params.loft.y[0]);
   dimensions.set(id,{height,faceRatio:faceHeight/height,width:body.joints.W});
   if(id==='nana_explorer')for(const side of [-1,1]){
    const J=body.joints,L=.105*J.Lb*body.proportions.foot*(.9+.1*J.W),ray=new THREE.Raycaster(new THREE.Vector3(side*J.ankle.x,body.ySole+2,J.ankle.z+.55*L),new THREE.Vector3(0,-1,0)),feet=clothes.group.getObjectByName('RoupaSlot_feet'),hit=ray.intersectObject(feet,true)[0];
    assert(hit,'Tênis da Nana sem cabedal no peito do pé');assert(body.sdf(...hit.point.toArray())>.005,'Pé atravessando o cabedal da Nana');
   }
  }finally{clothes.dispose();body.geo.dispose()}
  reports.push({id,meshes,vertices,clips:12});console.log(JSON.stringify(reports.at(-1)));
 }finally{visual.dispose();head.dispose()}
}
const nico=dimensions.get('nico_inventor'),nana=dimensions.get('nana_explorer');
assert(nico.height<nana.height*.65,'Nico precisa ser baixo em escala real');
assert(nico.width<nana.width*.80,'Nico precisa ter o corpo mais magro');
assert(nico.faceRatio<.25,'A cabeça do Nico ainda ocupa uma fração exagerada da altura');
assert(bodyViewHeight('nico_inventor',nico.height)>nico.height,'O seletor voltou a ampliar a criança à altura dos adultos');
console.log(JSON.stringify({proporcoes:{nico,nana}}));
if(process.env.ATELIE_RENDERS){mkdirSync(process.env.ATELIE_RENDERS,{recursive:true});writeFileSync(process.env.ATELIE_RENDERS+'/modelos-verificados.json',JSON.stringify(reports,null,2))}
