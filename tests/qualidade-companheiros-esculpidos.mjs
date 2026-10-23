// Contratos da construção: superfície finita, tufos fechados e vidro sem polos degenerados.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildHead} from '../src/head.js';
import {quill} from '../src/companion-detail.js';
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>new Proxy({},{get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
function finite(g,label){
 for(const [name,a]of Object.entries(g.attributes))assert(a.array.every(Number.isFinite),label+'/'+name);
 const p=g.attributes.position,n=g.attributes.normal;assert(p.count>0);
 for(let i=0;i<n.count;i++)assert(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<1e-4,label+': normal inválida');
}
function closed(g,label){
 const p=g.attributes.position,ix=g.index.array,edges=new Map(),a=new THREE.Vector3(),b=a.clone(),c=a.clone();let volume=0;
 const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*1e6)).join(':');
 for(let i=0;i<ix.length;i+=3){
  a.fromBufferAttribute(p,ix[i]);b.fromBufferAttribute(p,ix[i+1]);c.fromBufferAttribute(p,ix[i+2]);
  assert(b.clone().sub(a).cross(c.clone().sub(a)).length()>1e-12,label+': triângulo degenerado');volume+=a.dot(b.clone().cross(c))/6;
  for(let j=0;j<3;j++){const x=key(ix[i+j]),y=key(ix[i+(j+1)%3]),e=x<y?x+'|'+y:y+'|'+x;edges.set(e,(edges.get(e)||0)+1)}
 }
 assert(volume>0,label+': faces invertidas');for(const count of edges.values())assert.equal(count,2,label+': borda aberta ou duplicada');
}
for(const feather of [false,true])for(const normal of [new THREE.Vector3(0,0,1),new THREE.Vector3(1,0,0)]){
 const g=quill(new THREE.Vector3(.4,.1,.3),new THREE.Vector3(.48,-.25,.24),.06,.025,.035,feather,normal);finite(g,'Tufo');closed(g,'Tufo');g.dispose();
}
for(const id of ['paysandu_wolf','ruby_raven','desert_fennec','cowboy_on_fennec','robot_ball']){
 const h=buildHead(id,{}, {quality:.35});try{
  h.group.traverse(m=>{if(m.isMesh){finite(m.geometry,id+'/'+m.name);if(Number.isFinite(m.geometry.userData.rootSurfaceMax))assert(m.geometry.userData.rootSurfaceMax<-.008,id+'/'+m.name+': raiz exposta fora da superfície')}});
  if(id==='robot_ball')closed(h.group.getObjectByName('Screen').geometry,'Vidro curvo');
  else assert.equal(h.rig.makeClips().length,12);
  for(const pose of [{smile:1},{wide:1},{blinkL:1,blinkR:1},{jaw:1}]){h.rig.apply(pose);h.group.updateMatrixWorld(true)}
  console.log(id+': superfície válida, construção e expressões preservadas');
 }finally{h.dispose()}
}
