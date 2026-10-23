// Verifica a malha real e as relações entre identidades; não depende de roupa, cabelo ou cor.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {buildHead} from '../src/head.js';
import {PRESETS,PRESET_ORDER} from '../src/presets.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const baseline=process.argv[2]?await import(pathToFileURL(resolve(process.argv[2],'src/head.js')).href):null;
const expected=process.env.ATELIE_REFINADOS?.split(',').filter(Boolean);
if(expected)for(const id of expected)assert(PRESET_ORDER.includes(id),'Refino desconhecido: '+id);
const hashes=new Map(),metrics=new Map(),changes=[];
function face(head){return head.params.kind==='robot'?head.group:head.group.getObjectByName('Head_Skin')||head.group.getObjectByName('Rosto')}
function hashGeometry(root){const hash=createHash('sha256');root.traverse(m=>{if(m.isMesh)hash.update(Buffer.from(m.geometry.attributes.position.array.buffer))});return hash.digest('hex')}
for(const id of PRESET_ORDER){
 const head=buildHead(id,{}, {quality:.35,export:true});
 try{
  assert(PRESETS[id].faceIdentity,id+': identidade ausente');const root=face(head);assert(root,id+': malha do rosto ausente');
  root.traverse(m=>{if(!m.isMesh)return;const g=m.geometry;for(const [name,a]of Object.entries(g.attributes))assert(a.array.every(Number.isFinite),id+'/'+name+': atributo inválido');if(g.index)assert(g.index.array.every(i=>i<g.attributes.position.count),id+': índice fora da malha')});
  const hash=hashGeometry(root);hashes.set(id,hash);
  if(!['robot','companion'].includes(PRESETS[id].kind)){
   assert.equal(root.geometry.morphAttributes.position.length,11,id+': blendshapes perdidos');const p=root.geometry.attributes.position;
   const width=y=>{let w=0;for(let i=0;i<head.fit.skinN;i++)if(Math.abs(p.getY(i)-y)<.035&&p.getZ(i)>.05)w=Math.max(w,Math.abs(p.getX(i)));return w};
   metrics.set(id,{jaw:width(head.params.loft.y[0]+(head.params.mouthY-head.params.loft.y[0])*.45),cheek:width(head.params.cheekY??head.params.eyeY-.2),nose:head.fit.surfZ(0,head.params.noseTipY)});
   const bag=head.group.getObjectByName('Mouth_Bag');
   if(bag){const a=bag.geometry.attributes.position;for(let i=0;i<a.count;i++)assert(a.getZ(i)<head.fit.surfZ(a.getX(i),a.getY(i))-.015,id+': cavidade oral atravessou a superfície facial')}
   if(!head.params.open)for(const name of ['Teeth_Upper','Teeth_Lower','Tongue']){
    const mesh=head.group.getObjectByName(name);if(!mesh)continue;const a=mesh.geometry.attributes.position;
    for(let i=0;i<a.count;i++)assert(a.getZ(i)<head.fit.surfZ(a.getX(i),a.getY(i))-.015,id+'/'+name+': interior aparece pela pele em repouso');
   }
   if(head.params.sculptedNose){
    const z=head.fit.surfZ,tip=head.params.noseTipY,root=head.params.eyeY-.02;
    // Regressão das linhas retas que a união suave gerava ao entrar/sair do campo nasal.
    for(const [x,y,dx,dy]of [[.42,tip,.0001,0],[0,root+.25,0,.0001],[.25,tip-.3,0,.0001]])assert(Math.abs(z(x+dx,y+dy)-z(x-dx,y-dy))<.002,id+': descontinuidade no volume nasal');
   }
  }
  if(id!=='robot_ball')assert.equal(head.rig.makeClips().length,12,id+': clipes faciais perdidos');
  if(baseline){const old=baseline.buildHead(id,{}, {quality:.35,export:true});try{const previous=hashGeometry(face(old));if(!expected||expected.includes(id)){assert.notEqual(hash,previous,id+': rosto não foi refinado');changes.push(id)}else assert.equal(hash,previous,id+': refino individual alterou outro personagem')}finally{old.dispose()}}
  console.log('OK',id);
 }finally{head.dispose()}
}
// Mesmo personagem em skins diferentes conserva sua anatomia.
assert.equal(hashes.get('bread_baker'),hashes.get('bread_vigilante'));
assert.equal(hashes.get('desert_fennec'),hashes.get('cowboy_on_fennec'));
// Identidades anteriormente próximas precisam se distinguir também na superfície sem acessórios.
for(const [a,b]of [['forest_archer_f','forest_guard_f'],['forest_princess','nana_explorer'],['forest_guard_m','forest_guard_veteran'],['forest_archer_m','forest_artificer']]){
 const x=metrics.get(a),y=metrics.get(b),distance=Math.hypot(x.jaw-y.jaw,x.cheek-y.cheek,x.nose-y.nose);assert(distance>.035,a+' / '+b+': anatomia ainda excessivamente próxima');console.log('Distância anatômica',a,b,distance.toFixed(3));
}
assert.notEqual(hashes.get('frontier_cowboy'),hashes.get('cactus_soldier'));assert.notEqual(hashes.get('cactus_soldier'),hashes.get('cactus_soldier_large'));
console.log(JSON.stringify({personagens:hashes.size,rostosAlteradosContraReferencia:changes.length,skinsCompartilhadasPreservadas:true}));
