// Regressão das interpenetrações relatadas: medidas na malha deformada, sem
// reutilizar os volumes ou planos do corretor. Unidades nativas: altura ~1.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {restoreImportedBindPose} from '../src/imported-bind.js';
import {bakeMixamoMotions} from '../src/mixamo-motions.js';
if(!globalThis.ProgressEvent)globalThis.ProgressEvent=class{};
const buffer=fs.readFileSync(new URL('../assets/characters/nana-explorer.glb',import.meta.url));
const jsonLength=buffer.readUInt32LE(12),json=JSON.parse(buffer.subarray(20,jsonLength+20));
json.buffers[0].uri='data:application/octet-stream;base64,'+buffer.subarray(jsonLength+28).toString('base64');
json.materials=[{}];delete json.images;delete json.textures;
const gltf=await new GLTFLoader().parseAsync(JSON.stringify(json),'');
restoreImportedBindPose(gltf.scene);
const actor=new T.Group();actor.add(gltf.scene);actor.updateMatrixWorld(true);
const meshes=[];actor.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o)});
assert.equal(meshes.length,1);
const skin=meshes[0],names=skin.skeleton.bones.map(b=>b.name.replace(/^mixamorig[:_]?/i,''));
const groups={LeftHand:[],RightHand:[],LeftLeg:[],RightLeg:[],Head:[],Torso:[]};
const index=skin.geometry.attributes.skinIndex,weight=skin.geometry.attributes.skinWeight;
for(let i=0;i<index.count;i++){
 const totals={};
 for(let j=0;j<4;j++){
  const name=names[index.getComponent(i,j)],w=weight.getComponent(i,j);
  for(const group of Object.keys(groups)){
   const match=group.endsWith('Hand')?name===group:group.endsWith('Leg')?name.startsWith(group.slice(0,-3))&&/(UpLeg|Leg)/.test(name):group==='Head'?name==='Head':/^(Hips|Spine[12]?)$/.test(name);
   if(match)totals[group]=(totals[group]||0)+w;
  }
 }
 for(const group of Object.keys(groups))if(totals[group]>.85)groups[group].push(i);
}
assert.equal(groups.LeftHand.length,177);assert.equal(groups.RightHand.length,166);
for(const group of ['Head','Torso','LeftLeg','RightLeg'])assert(groups[group].length>100,'Amostragem incompleta: '+group);
const head=actor.getObjectByName('mixamorigHead'),restHead=head.matrixWorld.clone();
const clips=bakeMixamoMotions(actor,meshes),mixer=new T.AnimationMixer(gltf.scene);
function sample(clip,t,selected=Object.keys(groups)){
 mixer.stopAllAction();const action=mixer.clipAction(clips.find(c=>c.name===clip));
 action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();action.time=t;
 mixer.update(0);actor.updateMatrixWorld(true);skin.skeleton.update();
 return Object.fromEntries(selected.map(g=>[g,groups[g].map(i=>skin.getVertexPosition(i,new T.Vector3()).applyMatrix4(skin.matrixWorld))]));
}
function distance(a,b){let squared=Infinity;for(const p of a)for(const q of b)squared=Math.min(squared,p.distanceToSquared(q));return Math.sqrt(squared)}
// Instantes encontrados na auditoria independente de 8c44e5b. Não são escolhidos
// pelo corretor nem suas regiões analíticas; incluem mãos, cabeça e as duas pernas.
const cases=[
 ['Body_lobby',32/30,'LeftHand','RightHand',.000994],
 ['Body_lobby',.5,'RightHand','Torso',.000581],
 ['Body_defeat',106/30,'LeftHand','LeftLeg',.000509],
 ['Body_defeat',89/30,'RightHand','Head',.000677],
 ['Body_defeat',107/30,'RightHand','RightLeg',.001161],
 ['Body_victory',176/30,'LeftHand','LeftLeg',.000479],
 ['Body_victory',152/30,'RightHand','RightLeg',.000455],
 ['Body_dance_floss',95/30,'LeftHand','Head',.000625],
 ['Body_dance_floss',2.9,'RightHand','Head',.000725],
 ['Body_dance_floss',0,'LeftHand','LeftLeg',.000297],
 ['Body_dance_floss',8/30,'RightHand','RightLeg',.001120],
 ['Body_dance_shuffle',145/30,'LeftHand','RightHand',.000635],
 ['Body_dance_shuffle',16/30,'RightHand','Torso',.000982]
];
const contacts=[],contactFailures=[];
for(const [clip,t,hand,target,before] of cases){
 const points=sample(clip,t),after=distance(points[hand],points[target]);
 contacts.push({clip,t,hand,target,before,after});
 if(after<=.003)contactFailures.push({clip,t,hand,target,after});
}
// Grade espacial independente do corretor: se dois vértices estiverem a menos
// de .003, suas células coincidem ou são vizinhas. A consulta só decide esta
// proximidade; não apresenta ausência de contatos como distância exata infinita.
const cellSize=.003;
function makeGrid(points){
 const grid=new Map();
 for(const p of points){const key=[Math.floor(p.x/cellSize),Math.floor(p.y/cellSize),Math.floor(p.z/cellSize)].join(',');if(!grid.has(key))grid.set(key,[]);grid.get(key).push(p)}
 return grid;
}
function nearDistance(points,grid){
 let squared=cellSize*cellSize;
 for(const p of points){
  const x=Math.floor(p.x/cellSize),y=Math.floor(p.y/cellSize),z=Math.floor(p.z/cellSize);
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++){
   const values=grid.get([x+dx,y+dy,z+dz].join(','));
   if(values)for(const q of values)squared=Math.min(squared,p.distanceToSquared(q));
  }
 }
 return Math.sqrt(squared);
}
const pairs=[['LeftHand','RightHand'],...['LeftHand','RightHand'].flatMap(hand=>['Head','Torso','LeftLeg','RightLeg'].map(target=>[hand,target]))];
let denseContactSamples=0,denseContactFailingSamples=0;const denseContactFailures=[];
for(const clip of clips)for(let i=0;i<=Math.ceil(clip.duration*30);i++){
 const t=Math.min(i/30,clip.duration-1e-5),points=sample(clip.name,t),grids=Object.fromEntries(['RightHand','Head','Torso','LeftLeg','RightLeg'].map(g=>[g,makeGrid(points[g])]));denseContactSamples++;
 for(const [hand,target]of pairs){
  const after=nearDistance(points[hand],grids[target]);
  if(after<cellSize){denseContactFailingSamples++;if(denseContactFailures.length<20)denseContactFailures.push({clip:clip.name,t,hand,target,after})}
 }
}
// A visibilidade do olhar exige afastamento lateral: avançar a palma diante
// da cabeça pode tirar a interseção física e continuar escondendo os olhos.
// Faixa central dos óculos medida na pose de referência deste GLB.
const faceVisibility=[],eyeFailures=[];let eyePoseSamples=0,eyeFailingSamples=0;
for(const clip of clips){
 const rows=Object.fromEntries(['Left','Right'].map(side=>[side,{clip:clip.name,side,maxCovering:0,worstTime:0,samples:0}]));
 for(let i=0;i<=Math.ceil(clip.duration*60);i++){
  const t=Math.min(i/60,clip.duration-1e-5),points=sample(clip.name,t,['LeftHand','RightHand']);
  const intoRest=restHead.clone().multiply(head.matrixWorld.clone().invert());eyePoseSamples++;
  for(const side of ['Left','Right']){
   const covering=points[side+'Hand'].map(p=>p.clone().applyMatrix4(intoRest)).filter(p=>p.x>-.035&&p.x<.04&&p.y>.845&&p.y<.88&&p.z>.05).length;
   const row=rows[side];row.samples++;
   if(covering>row.maxCovering){row.maxCovering=covering;row.worstTime=t}
   if(covering){eyeFailingSamples++;if(eyeFailures.length<20)eyeFailures.push({clip:clip.name,t,side,covering})}
  }
 }
 faceVisibility.push(...Object.values(rows));
}
// A distância entre vértices pode não detectar faces que se atravessam.
// Este instante da dança retrô foi encontrado por uma auditoria independente
// das arestas indexadas da malha. Testa os dois sentidos, sem volumes do corretor.
const trianglePose={clip:'Body_dance_shuffle',time:3.3},trianglePoints=sample(trianglePose.clip,trianglePose.time,['LeftHand','RightHand']);
const handTopology={};
for(const name of ['LeftHand','RightHand']){
 const lookup=new Map(groups[name].map((index,i)=>[index,i])),triangles=[],edgeKeys=new Set(),edges=[];
 for(let i=0;i<skin.geometry.index.count;i+=3){
  const face=[0,1,2].map(k=>lookup.get(skin.geometry.index.getX(i+k)));
  if(face.some(v=>v===undefined))continue;
  triangles.push(face);
  for(const [a,b]of [[face[0],face[1]],[face[1],face[2]],[face[2],face[0]]]){
   const key=[Math.min(a,b),Math.max(a,b)].join(',');
   if(!edgeKeys.has(key)){edgeKeys.add(key);edges.push([a,b])}
  }
 }
 assert(triangles.length>100&&edges.length>200,'Amostragem de faces incompleta: '+name);
 handTopology[name]={triangles,edges};
}
const triangleContacts=[];
for(const [hand,target]of [['LeftHand','RightHand'],['RightHand','LeftHand']]){
 const p=trianglePoints[hand],q=trianglePoints[target],ray=new T.Ray(),hit=new T.Vector3();let intersections=0;
 for(const [a,b]of handTopology[hand].edges){
  const direction=p[b].clone().sub(p[a]),length=direction.length();if(length<1e-8)continue;
  ray.set(p[a],direction.multiplyScalar(1/length));
  for(const [x,y,z]of handTopology[target].triangles){
   if(ray.intersectTriangle(q[x],q[y],q[z],false,hit)){
    const distance=hit.distanceTo(p[a]);if(distance>1e-6&&distance<length-1e-6)intersections++;
   }
  }
 }
 triangleContacts.push({hand,target,edges:handTopology[hand].edges.length,triangles:handTopology[target].triangles.length,intersections});
}
console.log(JSON.stringify({contactPoses:cases.length,denseContactSamples,denseContactPairs:pairs.length,denseContactFailingSamples,denseContactFailures,eyePoseSamples,eyeFailingSamples,faceVisibility,eyeFailures,trianglePose,triangleContacts,groups:Object.fromEntries(Object.entries(groups).map(([g,ids])=>[g,ids.length])),contacts}));
assert.equal(contactFailures.length,0,'Contatos de regressão persistem: '+JSON.stringify(contactFailures));
assert.equal(denseContactFailingSamples,0,'Contatos residuais na amostragem densa: '+JSON.stringify(denseContactFailures));
assert.equal(eyeFailingSamples,0,'A mão ainda cobre o centro dos óculos: '+JSON.stringify(eyeFailures));

for(const contact of triangleContacts)assert.equal(contact.intersections,0,'Faces das mãos se atravessam na dança retrô em 3,3 s: '+JSON.stringify(contact));
